import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getCreditBalance } from "@/lib/billing/ledger"
import { GameChat } from "@/components/game-chat"
import { DEFAULT_GAME_MODEL_ID, isGameModelId } from "@/lib/games/model-catalog"
import { getGame } from "@/lib/games/queries"

export async function generateMetadata({
  params,
}: PageProps<"/games/[id]">): Promise<Metadata> {
  const { id } = await params
  const { orgId } = await auth()
  const game = await getGame(id, orgId ?? undefined)

  return {
    title: game?.title ? `${game.title} — Punker` : "Game — Punker",
  }
}

export default async function GamePage({
  params,
  searchParams,
}: PageProps<"/games/[id]">) {
  const [{ orgId, userId }, { id }, { model }] = await Promise.all([
    auth(),
    params,
    searchParams,
  ])

  if (!userId) {
    redirect("/sign-in")
  }

  const [game, credits] = await Promise.all([
    getGame(id, orgId ?? undefined),
    getCreditBalance(orgId),
  ])

  if (!game) {
    notFound()
  }

  return (
    <div className="relative flex h-svh flex-col">
      <GameChat
        gameId={game.id}
        credits={credits}
        initialMessages={game.messages}
        initialModelId={isGameModelId(model) ? model : DEFAULT_GAME_MODEL_ID}
        sandboxId={game.sandboxId}
        // The chat session the last turn persisted. Absent until a game has had
        // one, and the token may already have expired — the transport refreshes
        // it through the mint action on a 401.
        initialSession={
          game.chatAccessToken
            ? {
                publicAccessToken: game.chatAccessToken,
                lastEventId: game.chatLastEventId ?? undefined,
              }
            : undefined
        }
      />
    </div>
  )
}
