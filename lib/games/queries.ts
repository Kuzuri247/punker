import "server-only"

import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"

import { db, games, type Game } from "@/lib/db"

export type GameSummary = {
  id: string
  orgId: string
  title: string
  sandboxId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Games belonging to the caller's active organization, newest first.
 * Selects only metadata to avoid transferring multi-megabyte message history.
 */
export async function listGames(): Promise<GameSummary[]> {
  const { orgId } = await auth()

  // Every game is owned by an org, so without an active one there is nothing
  // this caller is allowed to see.
  if (!orgId) {
    return []
  }

  return db
    .select({
      id: games.id,
      orgId: games.orgId,
      title: games.title,
      sandboxId: games.sandboxId,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt,
    })
    .from(games)
    .where(eq(games.orgId, orgId))
    .orderBy(desc(games.createdAt))
}

// Postgres rejects a malformed uuid with an error rather than an empty result,
// so bad ids from the URL are filtered out before they reach the query.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A single game, or `undefined` when it doesn't exist or belongs to another
 * organization.
 */
export async function getGame(id: string): Promise<Game | undefined> {
  const { orgId } = await auth()

  if (!orgId || !UUID_RE.test(id)) {
    return undefined
  }

  const [game] = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.orgId, orgId)))
    .limit(1)

  return game
}
