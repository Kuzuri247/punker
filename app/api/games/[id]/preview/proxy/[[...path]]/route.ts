import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { eq } from "drizzle-orm"

import { getGamePreviewUrl } from "@/lib/daytona/utils"
import { db, games } from "@/lib/db/client"
import { getGame } from "@/lib/games/queries"
import { slugifyTitle } from "@/lib/games/title"
import { elapsed } from "@/lib/observability"

/**
 * Custom Preview Proxy for Daytona sandboxes.
 *
 * Daytona displays an interstitial warning page when preview URLs are opened
 * in a browser for the first time without custom headers. Because an iframe
 * navigation cannot attach custom request headers, loading the raw signed URL
 * directly in an iframe can cause Daytona's warning page to render inside
 * the preview panel instead of the game.
 *
 * This proxy route serves as Punker's Custom Preview Proxy:
 * 1. Attaches `X-Daytona-Skip-Preview-Warning: true` and `X-Daytona-Disable-CORS: true`
 * 2. Injects `<base href="/api/games/[id]/preview/proxy/">` into HTML documents so
 *    relative asset links (styles, scripts, 3D models, textures) route through this proxy
 * 3. Eliminates cross-origin iframe storage/cookie partitioning restrictions
 */
async function handleProxy(
  request: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  const startedAt = performance.now()
  const { id, path } = await params

  Sentry.getIsolationScope().setTags({
    "app.route": "PROXY /api/games/[id]/preview/proxy",
    "game.id": id,
  })

  const { userId, orgId } = await auth()

  let game = await getGame(id)
  if (!game) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
      const [row] = await db
        .select()
        .from(games)
        .where(eq(games.id, id))
        .limit(1)

      if (row && (!orgId || row.orgId === orgId)) {
        game = row
      }
    } else {
      const [bySlug] = await db
        .select()
        .from(games)
        .where(eq(games.slug, id))
        .limit(1)

      if (bySlug && (!orgId || bySlug.orgId === orgId)) {
        game = bySlug
      } else {
        const rows = await db.select().from(games)
        game = rows.find(
          (r) =>
            (!orgId || r.orgId === orgId) &&
            (r.slug === id || slugifyTitle(r.title) === id)
        )
      }
    }
  }

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 })
  }

  if (!game.sandboxId) {
    return Response.json({ error: "Game has no sandbox yet" }, { status: 409 })
  }

  try {
    const { url: signedBaseUrl } = await getGamePreviewUrl(game.sandboxId)

    const subpath =
      path && path.length > 0 ? path.map(encodeURIComponent).join("/") : ""
    const search = new URL(request.url).search

    const cleanBaseUrl = signedBaseUrl.replace(/\/+$/, "")
    const targetUrl = subpath
      ? `${cleanBaseUrl}/${subpath}${search}`
      : `${cleanBaseUrl}/${search}`

    const upstreamHeaders = new Headers()
    upstreamHeaders.set("X-Daytona-Skip-Preview-Warning", "true")
    upstreamHeaders.set("X-Daytona-Disable-CORS", "true")

    for (const [key, value] of request.headers.entries()) {
      const lower = key.toLowerCase()
      if (
        lower === "accept" ||
        lower === "accept-language" ||
        lower === "range" ||
        lower === "if-none-match" ||
        lower === "if-modified-since" ||
        lower === "user-agent"
      ) {
        upstreamHeaders.set(key, value)
      }
    }

    const upstreamRes = await fetch(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      cache: "no-store",
    })

    if (request.method === "HEAD") {
      const headHeaders = new Headers(upstreamRes.headers)
      headHeaders.delete("content-security-policy")
      headHeaders.delete("x-frame-options")
      return new Response(null, {
        status: upstreamRes.status,
        headers: headHeaders,
      })
    }

    const contentType = upstreamRes.headers.get("content-type") || ""

    if (contentType.includes("text/html")) {
      let html = await upstreamRes.text()
      const targetSlug = game.slug || slugifyTitle(game.title) || id
      const baseTag = `<base href="/api/games/${targetSlug}/preview/proxy/">`

      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>\n    ${baseTag}`)
      } else if (html.includes("<HEAD>")) {
        html = html.replace("<HEAD>", `<HEAD>\n    ${baseTag}`)
      } else if (html.includes("<html>")) {
        html = html.replace("<html>", `<html><head>${baseTag}</head>`)
      } else {
        html = `${baseTag}\n${html}`
      }

      const resHeaders = new Headers(upstreamRes.headers)
      resHeaders.delete("content-security-policy")
      resHeaders.delete("x-frame-options")
      resHeaders.set("Content-Type", "text/html; charset=utf-8")
      resHeaders.delete("content-length")

      return new Response(html, {
        status: upstreamRes.status,
        headers: resHeaders,
      })
    }

    const resHeaders = new Headers(upstreamRes.headers)
    resHeaders.delete("content-security-policy")
    resHeaders.delete("x-frame-options")

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Preview proxy upstream error"
    Sentry.logger.error(`Preview proxy failed for game ${id}`, {
      "game.id": id,
      error: message,
      duration_ms: elapsed(startedAt),
    })

    return Response.json(
      { error: message },
      { status: 502 }
    )
  }
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string; path?: string[] }> }
) {
  return handleProxy(request, ctx)
}

export async function HEAD(
  request: Request,
  ctx: { params: Promise<{ id: string; path?: string[] }> }
) {
  return handleProxy(request, ctx)
}
