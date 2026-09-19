"use client"

import * as Sentry from "@sentry/nextjs"
import { Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Preview =
  | { status: "loading" }
  | { status: "building" }
  | { status: "ready"; url: string; revision: number }
  | { status: "error"; message: string }

/** The first failure the frame saw, as `runtime/report.js` reports it. */
type GameError = {
  message: string
  source: string
  line: number | null
  column: number | null
  stack: string
}

// How often the panel asks the frame how it is doing. The exchange is a
// postMessage round trip inside the browser, so the cost of asking is close to
// nothing, and a game can throw at any point in its loop rather than only on
// load — which is why this keeps asking for as long as the frame is mounted.
const HEALTH_POLL_MS = 1000

const text = (value: unknown) => (typeof value === "string" ? value : "")
const count = (value: unknown) => (typeof value === "number" ? value : null)

/**
 * A `game-status` reply, or null for anything else — including a healthy one.
 *
 * Everything here crossed an origin boundary from code the agent wrote and the
 * player's extensions can also post into this window, so the shape is checked
 * rather than trusted, and each field is taken only if it is the type it claims.
 */
function readError(data: unknown): GameError | null {
  if (typeof data !== "object" || data === null) return null

  const status = data as { type?: unknown; error?: unknown }
  if (status.type !== "game-status") return null
  if (typeof status.error !== "object" || status.error === null) return null

  const error = status.error as Record<string, unknown>

  return {
    message: text(error.message) || "Unknown error",
    source: text(error.source),
    line: count(error.line),
    column: count(error.column),
    stack: text(error.stack),
  }
}

/**
 * A url with its query and fragment dropped.
 *
 * Daytona signs the preview url and the signature rides in the query, so the
 * urls coming back out of the frame are credentials as much as locations. Only
 * the path half of one belongs in a log that outlives the sandbox.
 */
function withoutQuery(value: string) {
  return value.replace(/[?#][^\s)'"]*/g, "")
}

/**
 * The running game, embedded from its sandbox.
 *
 * The url can't be resolved on the server with the rest of the page: fetching
 * it starts the sandbox's server, which takes seconds on a cold sandbox and
 * would hold the whole chat behind it. So the panel mounts first and asks for
 * the url itself.
 *
 * `revision` is bumped by whoever owns the thread every time a turn finishes,
 * and every value of it — including the first — is one load of the game. That
 * is the whole reload: the agent's edits land in the sandbox during the turn,
 * so the build to show is whatever is on disk when the turn ends.
 *
 * Mounted under a `key` of the game id, so switching games remounts this with
 * fresh state instead of showing the previous game while the new url loads.
 */
export function ChatPreview({
  gameId,
  revision,
}: {
  gameId: string
  revision: number
}) {
  const [preview, setPreview] = useState<Preview>({ status: "loading" })
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch(`/api/games/${gameId}/preview`, {
          signal: controller.signal,
        })
        const body = await response.json()

        if (response.status === 409) {
          setPreview({ status: "building" })
          return
        }

        if (!response.ok) {
          throw new Error(body.error ?? "Preview is unavailable")
        }

        setPreview({ status: "ready", url: body.url, revision })
      } catch (error) {
        // The abort is this effect being torn down, not a failure to report.
        if (controller.signal.aborted) {
          return
        }

        const message =
          error instanceof Error ? error.message : "Preview is unavailable"

        // The player is about to see "Preview is unavailable" and nothing else
        // — this is the only record of which of the several reasons it was.
        // The route logs the two it answers deliberately (404, 409); what
        // reaches here on top of those is a 500 or the fetch itself failing.
        Sentry.logger.error(
          Sentry.logger.fmt`Preview unavailable for game ${gameId}: ${message}`,
          {
            "game.id": gameId,
            "game.revision": revision,
            "exception.message": message,
            // A failure on revision 0 is a preview that never loaded; a later
            // one is a turn's build failing to reach a player who was watching
            // the previous build a moment ago.
            "preview.first_load": revision === 0,
          }
        )

        // A reload that fails leaves the game already on screen where it is.
        // It is the previous turn's build rather than the latest one, but the
        // panel has no retry of its own — trading a working preview for an
        // error message would strand the player there until the next turn.
        setPreview((current) =>
          current.status === "ready" ? current : { status: "error", message }
        )
      }
    }

    void load()

    return () => controller.abort()
  }, [gameId, revision])

  const ready = preview.status === "ready" ? preview : null

  // The game runs cross-origin, so an exception it throws lands in the frame's
  // console and nowhere this app can reach — which is how a broken build turns
  // into a black rectangle with no explanation. `runtime/report.js` catches the
  // first one on the other side and holds it; this asks for it and logs it.
  //
  // Asking rather than being told, because the failure that matters most is the
  // one thrown while the game loads, before this panel has mounted a listener.
  // A held error answers a poll that arrives late; a pushed one would be gone.
  useEffect(() => {
    const frame = frameRef.current
    if (!ready || !frame) return

    // The frame reports its first error and only that one, so there is exactly
    // one report per load to make. Past it, the poll has nothing left to learn.
    let reported = false

    const ping = () => {
      frame.contentWindow?.postMessage({ type: "game-ping" }, "*")
    }

    const onMessage = (event: MessageEvent) => {
      // The frame is the only window this panel has anything to hear from, and
      // its origin is a signed url that isn't known until it loads — so the
      // check is identity, which is the stronger of the two anyway.
      if (reported || !ready || event.source !== frame.contentWindow) return

      const error = readError(event.data)
      if (!error) return

      reported = true
      clearInterval(timer)

      // Attributes take strings, numbers and booleans, so the halves of a
      // report the frame couldn't fill in are left out rather than sent empty:
      // a syntax error carries a position and no stack, a rejected load a stack
      // and no position, and a failed script tag neither.
      const attributes: Record<string, string | number | boolean> = {
        "game.id": gameId,
        "game.revision": ready.revision,
        "exception.message": error.message,
      }

      if (error.stack) {
        attributes["exception.stacktrace"] = withoutQuery(error.stack)
      }
      if (error.source) {
        attributes["code.file.path"] = withoutQuery(error.source)
      }
      if (error.line !== null) attributes["code.line.number"] = error.line
      if (error.column !== null) attributes["code.column.number"] = error.column

      Sentry.logger.error(
        Sentry.logger.fmt`Game preview crashed: ${error.message}`,
        attributes
      )
    }

    window.addEventListener("message", onMessage)
    const timer = setInterval(ping, HEALTH_POLL_MS)
    ping()

    return () => {
      window.removeEventListener("message", onMessage)
      clearInterval(timer)
    }
  }, [ready, gameId])

  if (preview.status === "loading" || preview.status === "building") {
    return <MinimalistCanvasLoader status={preview.status} />
  }

  if (preview.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          {preview.message}
        </p>
      </div>
    )
  }

  return (
    <iframe
      ref={frameRef}
      // Daytona signs a preview url per sandbox, not per build, so a reload
      // normally hands the iframe the src it is already showing — and setting
      // `src` to its current value is not a navigation. The revision keys the
      // element instead, so React tears the old frame down and mounts a new
      // one, which loads whatever the sandbox now serves.
      key={preview.revision}
      src={preview.url}
      title="Game preview"
      className="h-full w-full border-0 bg-white"
    />
  )
}

function MinimalistCanvasLoader({
  status,
}: {
  status: "loading" | "building"
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-secondary/15 p-6 select-none">
      {/* Subtle perspective grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          transform: "perspective(600px) rotateX(48deg) translateY(-15%)",
          transformOrigin: "center center",
        }}
      />

      {/* Ambient soft glow */}
      <div className="pointer-events-none absolute size-72 rounded-full bg-gradient-to-tr from-sky-400/10 via-indigo-400/10 to-transparent blur-3xl" />

      {/* Central minimal loader */}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center animate-in fade-in duration-300">
        <div className="relative flex size-10 items-center justify-center rounded-2xl border border-border/50 bg-secondary/40 shadow-xs">
          <Sparkles className="size-4 text-sky-400 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[14px] font-medium text-foreground tracking-tight">
            {status === "building"
              ? "Building 3D Scene"
              : "Connecting Live Preview"}
          </span>
          <span className="text-[12px] text-muted-foreground max-w-[260px] leading-relaxed">
            {status === "building"
              ? "Punker Studio is preparing assets, camera, and game loop…"
              : "Loading sandbox environment…"}
          </span>
        </div>
      </div>
    </div>
  )
}

