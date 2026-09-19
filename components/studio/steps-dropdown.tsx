"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronRight, AlertCircle } from "lucide-react"
import type { DynamicToolUIPart, ToolUIPart } from "ai"

import { getFriendlyStepInfo } from "./friendly-step"
import { cn } from "@/lib/utils"

export function StepsDropdown({
  parts,
  className,
}: {
  parts: Array<ToolUIPart | DynamicToolUIPart>
  className?: string
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  if (parts.length === 0) {
    return null
  }

  const steps = parts.map(getFriendlyStepInfo)
  const completedSteps = steps.filter((s) => s.isDone)
  const activeStep = steps.find((s) => s.isLoading)

  return (
    <div className={cn("my-1.5 flex flex-col items-start gap-1 text-[13px]", className)}>
      {/* Active step running in real-time */}
      {activeStep && (
        <div className="flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-400 animate-in fade-in duration-200">
          <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-normal">{activeStep.activeLabel}…</span>
        </div>
      )}

      {/* Completed steps rolled into a clean dropdown */}
      {completedSteps.length > 0 && (
        <div className="flex flex-col items-start">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="group flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/30 px-3 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
            aria-expanded={isOpen}
          >
            <Check className="size-3 text-sky-400" />
            <span>
              {completedSteps.length === 1
                ? "1 step completed"
                : `${completedSteps.length} steps completed`}
            </span>
            {isOpen ? (
              <ChevronDown className="size-3.5 text-muted-foreground/60 transition-transform" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground/60 transition-transform" />
            )}
          </button>

          {/* Expanded dropdown list */}
          {isOpen && (
            <div className="mt-2 flex flex-col gap-1.5 pl-2 animate-in fade-in-50 slide-in-from-top-1 duration-150">
              {completedSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2 text-muted-foreground/90 text-xs"
                >
                  {step.hasError ? (
                    <AlertCircle className="size-3 text-destructive shrink-0" />
                  ) : (
                    <Check className="size-3 text-sky-400 shrink-0" />
                  )}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
