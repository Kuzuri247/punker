"use client"

import * as React from "react"
import {
  AlertCircle,
  Box,
  ChevronDown,
  Code2,
  FileCode2,
  Gauge,
  Globe,
  Palette,
  Search,
  ShieldCheck,
  Volume2,
} from "lucide-react"
import type { DynamicToolUIPart, ToolUIPart } from "ai"

import { getFriendlyStepInfo, type FriendlyStepInfo } from "./friendly-step"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const INITIAL_LIMIT = 3

function renderStepIcon(step: FriendlyStepInfo) {
  switch (step.iconKind) {
    case "js":
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-amber-500/15 text-amber-500 dark:text-amber-400">
          <FileCode2 className="size-3" />
        </span>
      )
    case "css":
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-sky-500/15 text-sky-500 dark:text-sky-400">
          <Palette className="size-3" />
        </span>
      )
    case "html":
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-orange-500/15 text-orange-500 dark:text-orange-400">
          <Globe className="size-3" />
        </span>
      )
    case "audio":
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-purple-500/15 text-purple-500 dark:text-purple-400">
          <Volume2 className="size-3" />
        </span>
      )
    case "scene":
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">
          <Box className="size-3" />
        </span>
      )
    case "inspect":
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-teal-500/15 text-teal-500 dark:text-teal-400">
          <Gauge className="size-3" />
        </span>
      )
    case "search":
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-slate-500/15 text-slate-500 dark:text-slate-400">
          <Search className="size-3" />
        </span>
      )
    default:
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          <Code2 className="size-3" />
        </span>
      )
  }
}

export function StepsDropdown({
  parts,
  className,
}: {
  parts: Array<ToolUIPart | DynamicToolUIPart>
  className?: string
}) {
  const steps = React.useMemo(
    () => parts.map(getFriendlyStepInfo),
    [parts]
  )
  const activeStep = steps.find((s) => s.isLoading)
  const isRunning = Boolean(activeStep)

  // Top level expander ("Actions ˅" / "Researched ˅") - closed by default
  const [isHeaderOpen, setIsHeaderOpen] = React.useState(false)

  // Subcategory expander ("Editing game code ˅")
  const [isSubcategoryOpen, setIsSubcategoryOpen] = React.useState(true)

  // "+N more" expander
  const [showAll, setShowAll] = React.useState(false)

  if (steps.length === 0) {
    return null
  }

  // Derive primary category and query description
  const primaryCategory =
    activeStep?.category ||
    steps[steps.length - 1]?.category ||
    "Editing game code"

  const primaryTarget =
    activeStep?.targetFile ||
    steps[steps.length - 1]?.targetFile ||
    "runtime"

  const displayedSteps = showAll ? steps : steps.slice(0, INITIAL_LIMIT)
  const hasMore = steps.length > INITIAL_LIMIT

  return (
    <div
      className={cn(
        "mb-2 flex w-full flex-col items-start gap-1 font-sans text-xs select-none",
        className
      )}
    >
      {/* Top Header: "Actions ˅" matching "Researched ˅" reference */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsHeaderOpen((prev) => !prev)}
          className="group flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
          aria-expanded={isHeaderOpen}
        >
          {isRunning && <Spinner className="size-3 text-muted-foreground" />}
          <span>{isRunning ? "Running actions…" : "Actions"}</span>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground/60 transition-transform duration-200 group-hover:text-foreground",
              isHeaderOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>

        {/* When collapsed, show inline source badge matching Image 1 ("learn.microsoft +2") */}
        {!isHeaderOpen && (
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3 text-muted-foreground/60" />
            <span className="font-mono text-[10px]">{primaryTarget}</span>
            {steps.length > 1 && (
              <span className="font-medium text-muted-foreground/80">
                +{steps.length - 1}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Actions Body */}
      {isHeaderOpen && (
        <div className="mt-1 flex w-full flex-col gap-1.5 pl-2 animate-in fade-in-50 duration-150">
          {/* Subcategory: "Editing game code ˅" matching "Searching the web ˅" */}
          <button
            type="button"
            onClick={() => setIsSubcategoryOpen((prev) => !prev)}
            className="group flex items-center gap-2 text-xs font-medium text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer self-start"
            aria-expanded={isSubcategoryOpen}
          >
            <Code2 className="size-3.5 text-muted-foreground/70 group-hover:text-foreground" />
            <span>{primaryCategory}</span>
            <ChevronDown
              className={cn(
                "size-3 text-muted-foreground/60 transition-transform duration-200 group-hover:text-foreground",
                isSubcategoryOpen ? "rotate-0" : "-rotate-90"
              )}
            />
          </button>

          {/* Under Subcategory */}
          {isSubcategoryOpen && (
            <div className="flex w-full flex-col gap-1.5 pl-5.5">
              {/* Query line: 🔍 ... */}
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground/70 py-0.5">
                <Search className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="truncate">
                  {isRunning && activeStep
                    ? activeStep.activeLabel
                    : `Updating ${primaryTarget} and game architecture`}
                </span>
              </div>

              {/* Items List */}
              <div className="flex w-full flex-col gap-1">
                {displayedSteps.map((step) => (
                  <div
                    key={step.id}
                    className="group flex items-center gap-3 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderStepIcon(step)}
                      <span className="truncate text-foreground/90 font-normal">
                        {step.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-muted-foreground/60 text-[11px]">
                      {step.targetFile && (
                        <span className="font-mono text-[11px] text-muted-foreground/70">
                          {step.targetFile}
                        </span>
                      )}
                      {step.isDone && (
                        <ShieldCheck className="size-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                      )}
                      {step.isLoading && (
                        <span className="size-1.5 rounded-full bg-foreground animate-pulse" />
                      )}
                      {step.hasError && (
                        <AlertCircle className="size-3.5 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}

                {/* "+N more" or "Show less" toggle matching Image 2 & 3 */}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setShowAll((prev) => !prev)}
                    className="self-start pt-1 text-xs font-normal text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors"
                  >
                    {showAll
                      ? "Show less"
                      : `+${steps.length - INITIAL_LIMIT} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
