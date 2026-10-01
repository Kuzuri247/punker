"use client"

import * as Sentry from "@sentry/nextjs"
import {
  AlertTriangle,
  Maximize2,
  Minimize2,
  Play,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { SandboxStartupLoader } from "@/components/sandbox-loader"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PreviewStatus = "idle" | "loading" | "building" | "fallback" | "ready" | "error"

type Preview =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "building" }
  | { status: "fallback"; revision: number }
  | { status: "ready"; url: string; revision: number }
  | { status: "error"; message: string }

/** The first failure the frame saw, as `runtime/report.js` reports it. */
export type GameError = {
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
 * To avoid spin-up lag on every chat switch, the sandbox starts on-demand
 * when the player initiates it. Once running, it can also be hidden without
 * unmounting the iframe.
 */
export function ChatPreview({
  gameId,
  revision,
  isStarted,
  onStart,
  onStatusChange,
  onToggleHide,
  onSelfHeal,
}: {
  gameId: string
  revision: number
  isStarted: boolean
  onStart: () => void
  onStatusChange?: (status: PreviewStatus) => void
  onToggleHide?: () => void
  onSelfHeal?: (error: GameError) => void
}) {
  const [preview, setPreview] = useState<Preview>(() =>
    isStarted ? { status: "loading" } : { status: "idle" }
  )
  const [runtimeError, setRuntimeError] = useState<GameError | null>(null)
  const [isAutoHealing, setIsAutoHealing] = useState(false)
  const autoHealedRevisions = useRef<Set<number>>(new Set())
  const [probeAttempt, setProbeAttempt] = useState(0)
  const [probeDelay, setProbeDelay] = useState(500)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onStatusChange?.(preview.status)
  }, [preview.status, onStatusChange])

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true)
        })
      } else {
        setIsFullscreen(true)
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false)
        })
      } else {
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
        setIsFullscreen(false)
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFullscreen])

  useEffect(() => {
    setRuntimeError(null)
    setIsAutoHealing(false)
  }, [revision])

  useEffect(() => {
    if (!isStarted) {
      setPreview({ status: "idle" })
      return
    }

    setPreview((prev) =>
      prev.status === "ready" ? prev : { status: "loading" }
    )

    const controller = new AbortController()
    const startTime = Date.now()
    let attempt = 0

    const elapsedTimer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    async function load() {
      try {
        const response = await fetch(`/api/games/${gameId}/preview`, {
          signal: controller.signal,
        })
        const body = await response.json()

        if (response.status === 409) {
          attempt++
          // Exponential backoff: 500ms -> 1000ms -> 2000ms -> 4000ms max
          const nextDelay = Math.min(500 * Math.pow(2, Math.min(attempt - 1, 3)), 4000)
          setProbeAttempt(attempt)
          setProbeDelay(nextDelay)

          const totalElapsed = (Date.now() - startTime) / 1000
          if (totalElapsed >= 15) {
            // Cold-start fallback after 15 seconds: serve client-side standby preview while container provisions
            setPreview({ status: "fallback", revision })
          } else {
            setPreview({ status: "building" })
          }

          setTimeout(() => {
            if (!controller.signal.aborted) {
              void load()
            }
          }, nextDelay)
          return
        }

        if (!response.ok) {
          throw new Error(body.error ?? "Preview is unavailable")
        }

        // Readiness probe: verify signed preview URL before mounting iframe
        try {
          await fetch(body.url, { method: "HEAD", mode: "no-cors", signal: controller.signal })
        } catch (_) {
          await new Promise((r) => setTimeout(r, 350))
        }

        clearInterval(elapsedTimer)
        setPreview({ status: "ready", url: body.url, revision })

        // Session Re-attachment: cache active sandbox state
        try {
          sessionStorage.setItem(
            `punker_active_sandbox_${gameId}`,
            JSON.stringify({ timestamp: Date.now(), revision })
          )
        } catch (_) {}
      } catch (error) {
        // The abort is this effect being torn down, not a failure to report.
        if (controller.signal.aborted) {
          return
        }

        const message =
          error instanceof Error ? error.message : "Preview is unavailable"

        Sentry.logger.error(
          Sentry.logger.fmt`Preview unavailable for game ${gameId}: ${message}`,
          {
            "game.id": gameId,
            "game.revision": revision,
            "exception.message": message,
            "preview.first_load": revision === 0,
          }
        )

        setPreview((current) =>
          current.status === "ready" ? current : { status: "error", message }
        )
      }
    }

    void load()

    return () => {
      clearInterval(elapsedTimer)
      controller.abort()
    }
  }, [gameId, revision, isStarted])

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
      setRuntimeError(error)

      // Automated Self-Correction: auto-dispatch repair prompt to trigger/chat.ts
      if (onSelfHeal && !autoHealedRevisions.current.has(ready.revision)) {
        autoHealedRevisions.current.add(ready.revision)
        setIsAutoHealing(true)
        onSelfHeal(error)
      }

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

  const [isExporting, setIsExporting] = useState(false)

  // async function handleExport() {
  //   setIsExporting(true)
  //   try {
  //     const response = await fetch(`/api/games/${gameId}/download`)
  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => null)
  //       throw new Error(
  //         errorData?.error || `Export failed: HTTP ${response.status}`
  //       )
  //     }

  //     const blob = await response.blob()
  //     const url = window.URL.createObjectURL(blob)
  //     const filename = `game-${gameId.slice(0, 8)}-build.zip`

  //     const anchor = document.createElement("a")
  //     anchor.style.display = "none"
  //     anchor.href = url
  //     anchor.download = filename
  //     document.body.appendChild(anchor)
  //     anchor.click()

  //     setTimeout(() => {
  //       document.body.removeChild(anchor)
  //       window.URL.revokeObjectURL(url)
  //     }, 1000)
  //   } catch (err: any) {
  //     alert(err?.message || "Failed to download game export.")
  //   } finally {
  //     setIsExporting(false)
  //   }
  // }

  if (preview.status === "idle") {
    return <SandboxIdleView onStart={onStart} />
  }

  if (preview.status === "fallback") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-background">
        <iframe
          srcDoc={getFallbackClientHtml()}
          title="Standby preview"
          className="h-full w-full border-0"
        />
        <div className="absolute bottom-3.5 left-3.5 z-30 flex items-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur-md animate-in fade-in">
          <span>Cloud VM cold-start &gt; 15s • Client Standby Active (auto-swapping when ready)…</span>
        </div>
      </div>
    )
  }

  if (preview.status === "loading" || preview.status === "building") {
    return (
      <SandboxStartupLoader
        status={preview.status}
        attempt={probeAttempt}
        probeDelay={probeDelay}
        elapsedSeconds={elapsedSeconds}
      />
    )
  }

  if (preview.status === "error") {
    return (
      <div className="relative flex h-full flex-col items-center justify-center p-6 text-center bg-muted/10">
        <div className="flex max-w-sm flex-col items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 p-6 shadow-md backdrop-blur-md">
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-foreground">Sandbox Unavailable</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {preview.message}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-1 cursor-pointer gap-1.5 rounded-lg text-xs"
            onClick={onStart}
          >
            <RotateCw className="size-3.5" />
            <span>Retry Connection</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full bg-background transition-all",
        isFullscreen && "fixed inset-0 z-50 h-screen w-screen"
      )}
    >
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
        allow="accelerometer; camera; encrypted-media; display-capture; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; fullscreen"
      />
      <div
        className={cn(
          "absolute z-20 flex items-center gap-1.5",
          isFullscreen ? "top-3.5 right-3.5" : "bottom-3.5 right-3.5"
        )}
      >
        <Button
          variant="outline"
          size="sm"
          className="h-7.5 size-7.5 cursor-pointer rounded-lg border-border/80 bg-background/90 p-0 text-muted-foreground shadow-xs backdrop-blur-md transition-all hover:bg-background hover:text-foreground active:scale-95"
          onClick={() => {
            if (frameRef.current) {
              frameRef.current.src = frameRef.current.src
            }
          }}
          title="Reload preview"
        >
          <RotateCw className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7.5 size-7.5 cursor-pointer rounded-lg border-border/80 bg-background/90 p-0 text-muted-foreground shadow-xs backdrop-blur-md transition-all hover:bg-background hover:text-foreground active:scale-95"
          onClick={toggleFullscreen}
          title={
            isFullscreen ? "Exit full screen (Esc)" : "Switch to full screen"
          }
        >
          {isFullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </Button>
      </div>

      {runtimeError && (
        <div className="absolute right-3 bottom-3 left-3 z-30 flex animate-in items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-card/90 p-3 shadow-lg backdrop-blur-md duration-200 fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
              <AlertTriangle className="size-4 animate-pulse" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-semibold text-foreground">
                Runtime Crash Detected
              </span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {runtimeError.message}
                {runtimeError.source &&
                  ` (${runtimeError.source.split("/").pop()}:${runtimeError.line || 1})`}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isAutoHealing ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Sparkles className="size-3 animate-spin text-amber-500" />
                <span>Auto-repairing…</span>
              </div>
            ) : (
              onSelfHeal && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 cursor-pointer gap-1.5 rounded-lg bg-foreground px-2.5 text-xs font-medium text-background transition-all hover:bg-foreground/90 active:scale-95"
                  onClick={() => {
                    setIsAutoHealing(true)
                    onSelfHeal(runtimeError)
                  }}
                >
                  <Sparkles className="size-3 text-amber-500" />
                  <span>Fix with AI</span>
                </Button>
              )
            )}
            <Button
              size="icon"
              variant="ghost"
              className="size-7 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => {
                setRuntimeError(null)
                setIsAutoHealing(false)
              }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SandboxIdleView({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 select-none bg-background">
      <div className="flex max-w-xs flex-col items-center gap-4 text-center animate-in fade-in duration-300">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-muted/30 text-foreground shadow-2xs">
          <Play className="size-4.5 fill-current ml-0.5 text-foreground/80" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Sandbox Standby
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Launch the isolated runtime environment to run and test your game in real-time.
          </p>
        </div>

        <Button
          size="sm"
          onClick={onStart}
          className="h-8.5 cursor-pointer gap-2 rounded-lg bg-foreground px-4 text-xs font-medium text-background shadow-xs transition-all hover:bg-foreground/90 active:scale-95"
        >
          <Play className="size-3.5 fill-current" />
          <span>Start Sandbox</span>
        </Button>
      </div>
    </div>
  )
}

function getFallbackClientHtml() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Punker Client Standby</title>
  <style>
    body { margin: 0; overflow: hidden; background: #080d1a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; color: #fff; }
    #canvas-container { position: absolute; inset: 0; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js"
      }
    }
  </script>
</head>
<body>
  <div id="canvas-container"></div>
  <script type="module">
    import * as THREE from 'three';
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080d1a, 0.08);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(40, 40, 0x10b981, 0x1e293b);
    grid.position.y = -1.2;
    scene.add(grid);

    const geo = new THREE.IcosahedronGeometry(1.4, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const coreGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x059669 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
      requestAnimationFrame(animate);
      mesh.rotation.x += 0.007;
      mesh.rotation.y += 0.012;
      core.rotation.y -= 0.01;
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`
}
