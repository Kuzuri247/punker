"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronRight, AlertCircle, FileCode } from "lucide-react"
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
    <div className={cn("my-2 flex flex-col items-start gap-1.5 text-[13px]", className)}>
      {/* Active step running in real-time */}
      {activeStep && (
        <div className="flex items-center gap-2 rounded-full border border-border/80 bg-secondary/90 px-3 py-1 text-xs font-medium text-foreground shadow-2xs animate-in fade-in duration-200">
          <span className="size-1.5 rounded-full bg-foreground animate-pulse" />
          <span>{activeStep.activeLabel}…</span>
          {activeStep.targetFile && (
            <span className="rounded bg-background/60 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
              {activeStep.targetFile}
            </span>
          )}
        </div>
      )}

      {/* Completed steps rolled into a clean dropdown */}
      {completedSteps.length > 0 && (
        <div className="flex flex-col items-start">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="group flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-2xs hover:border-foreground/30 hover:bg-card hover:text-foreground transition-all"
            aria-expanded={isOpen}
          >
            <Check className="size-3 text-foreground/80" />
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
            <div className="mt-2 flex flex-col gap-1.5 border-l border-border/60 pl-3 ml-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-150">
              {completedSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2 text-muted-foreground/90 text-xs"
                >
                  {step.hasError ? (
                    <AlertCircle className="size-3 text-destructive shrink-0" />
                  ) : (
                    <Check className="size-3 text-foreground/70 shrink-0" />
                  )}
                  <span>{step.label}</span>
                  {step.targetFile && (
                    <span className="flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/80">
                      <FileCode className="size-2.5 opacity-60" />
                      {step.targetFile}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
