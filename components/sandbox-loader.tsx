"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const LOADER_STEPS = [
  "Allocating virtual compute…",
  "Initializing WebGL runtime…",
  "Compiling scene assets…",
  "Connecting preview bridge…",
]

export function SandboxStartupLoader({
  status = "loading",
  attempt = 0,
  probeDelay = 500,
  elapsedSeconds = 0,
  className,
}: {
  status?: "loading" | "building"
  attempt?: number
  probeDelay?: number
  elapsedSeconds?: number
  className?: string
}) {
  const [stepIndex, setStepIndex] = React.useState(0)
  const [progress, setProgress] = React.useState(20)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADER_STEPS.length)
      setProgress((prev) => Math.min(prev + 18, 92))
    }, 1800)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center p-6 select-none bg-background",
        className
      )}
    >
      <div className="flex max-w-xs flex-col items-center gap-4 text-center animate-in fade-in duration-300">
        {/* Sleek Minimal Spinner */}
        <div className="relative flex size-10 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>

        {/* Minimal Typography */}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {status === "building" ? "Rebuilding Sandbox" : "Starting Sandbox"}
          </h3>
          <p className="text-xs text-muted-foreground transition-opacity duration-300">
            {LOADER_STEPS[stepIndex]}
          </p>
        </div>

        {/* Sleek Slim Progress Line */}
        <div className="h-1 w-44 overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Minimal Cold-Start Notice if delay exceeds threshold */}
        {elapsedSeconds >= 15 && (
          <span className="text-[11px] text-muted-foreground/80 font-mono pt-1">
            Cloud VM cold start ({elapsedSeconds}s elapsed)…
          </span>
        )}
      </div>
    </div>
  )
}
