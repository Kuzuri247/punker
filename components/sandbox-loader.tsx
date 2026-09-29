"use client"

import * as React from "react"
import {
  Box,
  CheckCircle2,
  Cpu,
  Flame,
  Layers,
  Radio,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

const BOOT_STEPS = [
  {
    id: "vm",
    label: "Spinning up isolated Daytona microVM",
    detail: "Container allocated • Port 3000 mapped",
    icon: Cpu,
  },
  {
    id: "gpu",
    label: "Mounting WebGL & Three.js runtime",
    detail: "Hardware acceleration active • 60 FPS target",
    icon: Layers,
  },
  {
    id: "scene",
    label: "Compiling shaders & scene assets",
    detail: "Lighting, physics engine & cameras bound",
    icon: Box,
  },
  {
    id: "tunnel",
    label: "Establishing secure preview tunnel",
    detail: "WebSocket HMR bridge ready for live interaction",
    icon: Zap,
  },
]

export function SandboxStartupLoader({
  status = "loading",
  className,
}: {
  status?: "loading" | "building"
  className?: string
}) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [progress, setProgress] = React.useState(18)

  // Step and progress animation ticker
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) =>
        prev < BOOT_STEPS.length - 1 ? prev + 1 : prev
      )
      setProgress((prev) =>
        Math.min(prev + Math.floor(Math.random() * 22 + 12), 96)
      )
    }, 1200)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background/95 p-6 select-none",
        className
      )}
    >
      {/* 3D Perspective Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform:
            "perspective(500px) rotateX(55deg) translateY(-10%) translateZ(0)",
          transformOrigin: "center center",
        }}
      />

      {/* Radial ambient lighting */}
      <div className="pointer-events-none absolute size-96 animate-pulse rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute size-72 rounded-full bg-cyan-500/10 blur-[80px]" />

      {/* Main Holographic Console */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        {/* Holographic Gyroscope & 3D Isometric Core */}
        <div className="relative flex size-28 items-center justify-center">
          {/* Outer Pulsing Aura */}
          <div className="absolute inset-0 animate-ping rounded-full border border-primary/20 bg-primary/5 opacity-30 duration-1000" />

          {/* Counter-rotating Outer Dashed Ring */}
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-primary/40"
            style={{ animationDuration: "12s" }}
          />

          {/* Clockwise Middle Ring with Cyan Accent */}
          <div
            className="absolute inset-2 animate-spin rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-primary/60 border-l-transparent"
            style={{ animationDuration: "6s", animationDirection: "reverse" }}
          />

          {/* Inner Fast Ring */}
          <div
            className="absolute inset-5 animate-spin rounded-full border border-violet-400/60 border-b-transparent"
            style={{ animationDuration: "3s" }}
          />

          {/* Center Glowing Isometric Core */}
          <div className="relative flex size-12 items-center justify-center rounded-2xl border border-primary/40 bg-card/90 shadow-lg shadow-primary/20 backdrop-blur-md">
            <Box className="size-6 animate-pulse text-primary" />
            <div className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-cyan-500" />
            </div>
          </div>
        </div>

        {/* Status Header Badge */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground shadow-xs backdrop-blur-md">
            <Radio className="size-3 animate-pulse text-cyan-500" />
            <span className="text-[11px] font-semibold tracking-wide text-foreground/90 uppercase">
              {status === "building"
                ? "Daytona Engine Building"
                : "Starting Isolated Sandbox"}
            </span>
          </div>

          <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {status === "building"
              ? "Rebuilding 3D Scene & WebGL Context"
              : "Booting Real-Time Game Environment"}
          </h3>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Allocating dedicated virtual compute, VRAM, and fast hot-reload
            bridge for 60 FPS live preview.
          </p>
        </div>

        {/* Progress Bar with Glowing Shimmer */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3 text-primary" />
              System Initialization
            </span>
            <span className="font-mono font-semibold text-foreground">
              {progress}%
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full border border-border/60 bg-secondary/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Telemetry Stage Ticker Card */}
        <div className="w-full rounded-2xl border border-border/70 bg-card/70 p-3.5 shadow-sm backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between border-b border-border/50 pb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Terminal className="size-3.5" />
              Live Boot Telemetry
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-emerald-500">
              <span className="size-1.5 animate-ping rounded-full bg-emerald-500" />
              ACTIVE
            </span>
          </div>

          <div className="space-y-2">
            {BOOT_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex
              const StepIcon = step.icon

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-all",
                    isCurrent && "bg-secondary/70 font-medium text-foreground",
                    isDone && "text-muted-foreground opacity-80",
                    !isDone &&
                      !isCurrent &&
                      "text-muted-foreground/40 opacity-40"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                  ) : isCurrent ? (
                    <StepIcon className="size-3.5 shrink-0 animate-pulse text-primary" />
                  ) : (
                    <div className="size-3.5 shrink-0 rounded-full border border-border/60" />
                  )}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{step.label}</span>
                    {isCurrent && (
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {step.detail}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
