"use client"

import { BotIcon, SparklesIcon } from "lucide-react"

import { AgentBadge } from "@/components/studio/agent-badge"
import { Spinner } from "@/components/ui/spinner"
import type { AgentRole } from "@/lib/games/agents/types"
import { cn } from "@/lib/utils"

export function StudioStatus({
  streaming,
  currentAgent = "architect",
  stepCount,
  maxSteps = 48,
  className,
}: {
  streaming: boolean
  currentAgent?: AgentRole
  stepCount?: number
  maxSteps?: number
  className?: string
}) {
  if (!streaming) return null

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/95 px-4 py-2.5 text-xs text-foreground shadow-sm backdrop-blur-md transition-all animate-in fade-in-50 slide-in-from-bottom-2",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-heading font-semibold text-foreground">
            Punker Studio Active
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">Collaborating in Daytona Sandbox</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AgentBadge role={currentAgent} size="xs" />
        {stepCount !== undefined && (
          <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Step {stepCount}/{maxSteps}
          </span>
        )}
        <Spinner className="size-3 text-primary" />
      </div>
    </div>
  )
}
