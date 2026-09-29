import "server-only"

import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"
import { cache } from "react"

import { db, games, type Game } from "@/lib/db"
import { slugifyTitle } from "@/lib/games/title"

export type GameSummary = {
  id: string
  orgId: string
  title: string
  slug: string | null
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
      slug: games.slug,
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
 * organization. Looks up by UUID or by title slug.
 */
export const getGame = cache(async function getGame(
  idOrSlug: string,
  explicitOrgId?: string
): Promise<Game | undefined> {
  const orgId = explicitOrgId ?? (await auth()).orgId

  if (!orgId || !idOrSlug) {
    return undefined
  }

  // 1. If it's a valid UUID, look up by primary key id
  if (UUID_RE.test(idOrSlug)) {
    const [game] = await db
      .select()
      .from(games)
      .where(and(eq(games.id, idOrSlug), eq(games.orgId, orgId)))
      .limit(1)

    if (game) return game
  }

  // 2. Query by slug
  const [bySlug] = await db
    .select()
    .from(games)
    .where(and(eq(games.slug, idOrSlug), eq(games.orgId, orgId)))
    .limit(1)

  if (bySlug) return bySlug

  // 3. Fallback: match by slugified title for legacy rows
  const orgGames = await db.select().from(games).where(eq(games.orgId, orgId))

  return orgGames.find((g) => (g.slug || slugifyTitle(g.title)) === idOrSlug)
})
