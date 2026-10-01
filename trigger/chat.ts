import { chat } from "@trigger.dev/sdk/ai"
import { stepCountIs } from "ai"
import { z } from "zod"

import { deductCredits, getEntitlements } from "@/lib/billing/entitlements"
import {
  chargeStep,
  hasCreditsToBuild,
  OUT_OF_CREDITS,
} from "@/lib/billing/ledger"
import { priceStep } from "@/lib/billing/pricing"
import { createGameSandbox } from "@/lib/daytona/utils"
import { gameModelSettings } from "@/lib/games/agent"
import {
  gameTranscriptStorage,
  loadGameOrgId,
  saveGameTurn,
} from "@/lib/games/chat-store"
import { gameInstructions } from "@/lib/games/instructions"
import { DEFAULT_GAME_MODEL_ID, GAME_MODELS } from "@/lib/games/model-catalog"
import { describeError, elapsed, logger } from "@/lib/observability"
import { createGameTools } from "@/lib/games/tools"

const gameClientDataSchema = z
  .object({
    modelId: z.enum(GAME_MODELS.map((model) => model.id)).optional(),
    apiKey: z.string().optional(),
  })
  .optional()

// A turn is a read-edit-read loop over the game's files, so it needs room for
// many steps; the default of one would stop the turn dead after the first tool
// call, before the model has said anything.
const MAX_STEPS = 48

/**
 * A game's chat thread, run as one long-lived task per conversation.
 *
 * A game owns exactly one thread and the chat id is the game id, so the
 * `games` row stays the source of truth for history: `storage` reads it
 * back at the top of every run and persists each turn's changes durable to Postgres.
 *
 * Authorization happens before a session can exist, in the server actions in
 * `@/lib/games/chat-actions` — there is no Clerk session in here to scope by.
 */
export const gameChat = chat.agent({
  id: "game-chat",
  clientDataSchema: gameClientDataSchema,
  storage: gameTranscriptStorage,
  cacheControl: { type: "ephemeral" },
  prepareMessages: async ({ messages }) => {
    if (messages.length === 0) return messages
    const last = messages[messages.length - 1]
    return [
      ...messages.slice(0, -1),
      {
        ...last,
        providerOptions: {
          ...last.providerOptions,
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      },
    ]
  },
  pendingMessages: {
    shouldInject: ({ steps }) => steps.length > 0,
    onReceived: ({ message }) => {
      logger.info(logger.fmt`Mid-turn steering message received for game`, {
        "message.id": message.id,
      })
    },
  },
  uiMessageStreamOptions: {
    sendReasoning: true,
    sendSources: true,
    onError: (error) => {
      logger.error(logger.fmt`Chat turn stream error`, {
        ...describeError(error),
      })
      if (error instanceof Error && error.message.includes("rate limit")) {
        return "Model rate limit reached — waiting a moment to resume."
      }
      return error instanceof Error
        ? error.message
        : "An unexpected error occurred during generation."
    },
  },
  // Fires once per game, on the first message of its thread — so the sandbox
  // is created exactly once and is already seeded before `run` streams a reply.
  onChatStart: async ({ chatId }) => {
    try {
      await createGameSandbox(chatId)
    } catch (error) {
      // Fires exactly once per game, and everything the agent does afterwards
      // needs what it builds. Failing here doesn't stop the turn — the tools
      // fall back to creating a sandbox themselves — but it does mean the first
      // turn pays that cost mid-stream, and it is the explanation for the
      // `getGameSandbox` warning that follows.
      logger.error(
        logger.fmt`Could not create the sandbox for game ${chatId}`,
        { "game.id": chatId, ...describeError(error) }
      )

      throw error
    }
  },
  // Every turn, and the last point before it starts streaming: check credits.
  // The runtime TranscriptStorage has already persisted incoming messages at turn-start.
  onTurnStart: async ({ chatId, turn, runId }) => {
    logger.info(logger.fmt`Chat turn starting for game ${chatId} (turn #${turn})`, {
      "game.id": chatId,
      "run.id": runId,
      turn,
    })

    // Checked on every turn, including the first turn of a continuation run —
    // which is where `onChatStart` would have missed it. The session-start
    // check in `@/lib/games/chat-actions` is the other half: this one catches
    // the thread that was affordable when it opened and is not any more.
    //
    // Deliberately *not* per step. A turn that has started is paid for to the
    // end, overdraft and all, because a game abandoned mid-write has cost the
    // same and left nothing to show for it.
    const orgId = await loadGameOrgId(chatId)

    // No row, no owner to bill and nothing to check against. The turn will
    // fail on its own further down for the same reason.
    if (!orgId) {
      return
    }

    if (await hasCreditsToBuild(orgId)) {
      return
    }

    logger.info(logger.fmt`Refused a turn for game ${chatId} — no credits`, {
      "game.id": chatId,
      "organization.id": orgId,
    })

    // Thrown, not written: the turn loop turns this into an error chunk, closes
    // the turn, and leaves the session alive for the next message — so the
    // player reads the reason in the thread and can carry on the moment they
    // top up. The message is shown to them verbatim, so it says something a
    // player can act on rather than something only a log would want.
    throw new Error(OUT_OF_CREDITS)
  },
  onTurnComplete: async ({
    chatId,
    uiMessages,
    chatAccessToken,
    lastEventId,
    clientData,
  }) => {
    const startedAt = performance.now()

    try {
      await saveGameTurn({
        gameId: chatId,
        messages: uiMessages,
        chatAccessToken,
        chatLastEventId: lastEventId,
      })
    } catch (error) {
      // The turn's work is already in the sandbox by now; this is the write
      // that makes it survive a reload. Losing it strands the thread on the
      // previous turn's cursor, which is the one failure here that the player
      // sees and the agent doesn't.
      logger.error(
        logger.fmt`Could not persist the finished turn for game ${chatId}`,
        {
          "game.id": chatId,
          "chat.messages": uiMessages.length,
          "chat.has_cursor": lastEventId !== undefined,
          ...describeError(error),
        }
      )

      throw error
    }

    // Pairs with the `Chat turn starting` log above: one of each per turn, so a
    // turn that began and never ended is a gap rather than something to infer.
    logger.info(logger.fmt`Chat turn complete for game ${chatId}`, {
      "game.id": chatId,
      "gen_ai.request.model": clientData?.modelId ?? DEFAULT_GAME_MODEL_ID,
      "chat.messages": uiMessages.length,
      // A turn that ends with no cursor cannot be resumed, so a reload
      // replays it — worth being able to count.
      "chat.has_cursor": lastEventId !== undefined,
      duration_ms: elapsed(startedAt),
    })
  },
  // Resolved per turn rather than declared once, because the tools have to
  // write into this game's sandbox: the chat id is the game id, so each turn's
  // set is closed over the right one and the model never names a game itself.
  // Declared on the config and handed back to `streamText` below, rather than
  // only passed there: history re-converted at the top of a later turn needs
  // the same set to make sense of the tool calls already in it.
  tools: ({ chatId }) => createGameTools(chatId),
  run: async ({ messages, tools, signal, clientData, chatId, streamText }) => {
    // Read per turn rather than fixed for the thread, so switching models
    // mid-conversation takes effect on the next message and carries the history
    // with it. Named here rather than inline because the same choice decides
    // what the turn runs on and what it is billed at.
    const requestedModelId = clientData?.modelId ?? DEFAULT_GAME_MODEL_ID
    const customApiKey = clientData?.apiKey

    // A turn with nothing to answer.
    if (messages.at(-1)?.role === "assistant") {
      logger.warn(
        logger.fmt`Skipped a turn with nothing to answer for game ${chatId}`,
        {
          "game.id": chatId,
          "chat.messages": messages.length,
        }
      )

      return
    }

    const orgId = await loadGameOrgId(chatId)

    // Enforce model tier gating unless user provided a custom BYOK API key
    const entitlements = await getEntitlements(orgId)
    const isModelAllowed =
      Boolean(customApiKey) || entitlements.allowedModels.includes(requestedModelId)

    const modelId = isModelAllowed ? requestedModelId : DEFAULT_GAME_MODEL_ID
    if (!isModelAllowed) {
      logger.warn(
        logger.fmt`Model ${requestedModelId} not allowed on tier ${entitlements.tier} without BYOK. Falling back to ${DEFAULT_GAME_MODEL_ID}`,
        { "game.id": chatId, requestedModelId, tier: entitlements.tier }
      )
    }

    const hasByok = Boolean(customApiKey)

    return streamText({
      // Spread first, so every option below still wins. Wires up the
      // `prepareStep` behind compaction, steering and background injection.
      ...chat.toStreamTextOptions({ tools }),
      ...gameModelSettings(modelId, { customApiKey }),
      instructions: gameInstructions,
      messages,
      abortSignal: signal,
      stopWhen: stepCountIs(MAX_STEPS),
      onStepEnd: async ({ usage, response }) => {
        if (!orgId) {
          return
        }

        try {
          await chargeStep({
            orgId,
            responseId: response.id,
            amount: priceStep({ modelId, usage }),
            agentRole: "studio",
            bypassDeduction: hasByok,
          })

          if (!hasByok) {
            await deductCredits(orgId, 1)
          }
        } catch (error) {
          // Deliberately swallowed. This runs between steps of a turn the
          // player is watching, and a ledger that is briefly short a row is a
          // better outcome than a build that dies halfway through writing a
          // game. The row is not recoverable afterwards, though, so an org
          // billed less than it used shows up here and nowhere else.
          logger.error(
            logger.fmt`Could not charge a step for game ${chatId}`,
            {
              "game.id": chatId,
              "organization.id": orgId,
              "gen_ai.request.model": modelId,
              "gen_ai.response.id": response.id,
              ...describeError(error),
            }
          )
        }

        // Gentle pacing between tool-loop steps to smooth out Free Tier RPM consumption
        await new Promise((resolve) => setTimeout(resolve, 1200))
      },
    })
  },
})
