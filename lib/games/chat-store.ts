import type { UIMessage } from "ai"
import type { TranscriptStorage } from "@trigger.dev/sdk/ai"
import { eq } from "drizzle-orm"

// Imported straight from `./client` rather than `@/lib/db`: this module runs
// inside the Trigger.dev worker, where the `server-only` marker on the `@/lib/db`
// entry would throw.
import { db, games } from "@/lib/db/client"
import { describeError, logger } from "@/lib/observability"

/**
 * A game's stored chat thread.
 *
 * Lookups here are by id alone, with no org scoping, unlike `getGame`. The
 * caller is the chat agent, which has no Clerk session to scope by — a game id
 * only ever reaches it through a session the server actions in
 * `@/lib/games/chat-actions` already authorized against the caller's org.
 */
export async function loadGameMessages(gameId: string): Promise<UIMessage[]> {
  const [game] = await db
    .select({ messages: games.messages })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)

  return (game?.messages as UIMessage[]) ?? []
}

/**
 * The organization a game belongs to, or `undefined` if the game is gone.
 *
 * The agent bills the org that owns the game rather than one it is told about:
 * the model id on a turn comes from the browser, but who pays for it is settled
 * here, from the row, where a tab cannot reach it.
 */
export async function loadGameOrgId(
  gameId: string
): Promise<string | undefined> {
  const [game] = await db
    .select({ orgId: games.orgId })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)

  return game?.orgId
}

/**
 * Replaces a game's chat thread.
 */
export async function saveGameMessages({
  gameId,
  messages,
}: {
  gameId: string
  messages: UIMessage[]
}): Promise<void> {
  await db.update(games).set({ messages }).where(eq(games.id, gameId))
}

/**
 * Replaces a game's chat thread and the stream cursor for it.
 */
export async function saveGameTurn({
  gameId,
  messages,
  chatAccessToken,
  chatLastEventId,
}: {
  gameId: string
  messages: UIMessage[]
  chatAccessToken: string
  chatLastEventId: string | undefined
}): Promise<void> {
  await db
    .update(games)
    .set({ messages, chatAccessToken, chatLastEventId })
    .where(eq(games.id, gameId))
}

/**
 * Trigger.dev TranscriptStorage implementation for Punker games.
 *
 * The runtime calls `load` at run boot and `save` after every durable change
 * (turn-start, turn-complete, error, compaction). Storing the conversation as
 * a document in `games.messages` ensures that the database is the source of truth,
 * with zero custom recovery or compaction logic required.
 */
export const gameTranscriptStorage: TranscriptStorage = {
  async load<TUIMessage extends UIMessage = UIMessage>({
    chatId,
  }: {
    chatId: string
  }) {
    const [game] = await db
      .select({
        messages: games.messages,
        chatLastEventId: games.chatLastEventId,
      })
      .from(games)
      .where(eq(games.id, chatId))
      .limit(1)

    return {
      messages: (game?.messages as unknown as TUIMessage[]) ?? [],
      state: null,
      cursors: {
        lastOutEventId: game?.chatLastEventId ?? undefined,
      },
    }
  },

  async save({ chatId }, changeset) {
    const messages = changeset.transcript.entries.map((e) => e.message)
    const lastOutEventId = changeset.cursors?.lastOutEventId

    try {
      await db
        .update(games)
        .set({
          messages,
          ...(lastOutEventId ? { chatLastEventId: lastOutEventId } : {}),
        })
        .where(eq(games.id, chatId))
    } catch (error) {
      logger.error(logger.fmt`Could not persist transcript for game ${chatId}`, {
        "game.id": chatId,
        "chat.messages": messages.length,
        ...describeError(error),
      })
      throw error
    }
  },
}
