"use client"

import * as React from "react"
import { Brain, ChevronDown, ChevronRight, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

export function ThoughtAccordion({
  text,
  isStreaming = false,
  className,
}: {
  text: string
  isStreaming?: boolean
  className?: string
}) {
  const [isOpen, setIsOpen] = React.useState(isStreaming)

  React.useEffect(() => {
    if (isStreaming) {
      setIsOpen(true)
    }
  }, [isStreaming])

  if (!text || text.trim() === "") {
    return null
  }

  const wordCount = text.trim().split(/\s+/).length

  return (
    <div
      className={cn(
        "mb-2 w-full rounded-xl border border-border/70 bg-card/50 text-xs shadow-2xs backdrop-blur-xs transition-all overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-muted-foreground hover:text-foreground hover:bg-card/70 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-md bg-foreground/10 text-foreground/80">
            {isStreaming ? (
              <Sparkles className="size-3 animate-pulse text-amber-500" />
            ) : (
              <Brain className="size-3 text-foreground/70" />
            )}
          </div>
          <span className="font-medium text-foreground/90">
            {isStreaming ? "Thinking…" : "Thought Process"}
          </span>
          <span className="text-[11px] text-muted-foreground/60">
            ({wordCount} words)
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="size-3.5 opacity-60 transition-transform" />
        ) : (
          <ChevronRight className="size-3.5 opacity-60 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border/50 bg-background/40 px-3.5 py-2.5 font-mono text-[12px] leading-relaxed text-muted-foreground/90 animate-in fade-in-50 slide-in-from-top-1 duration-150 whitespace-pre-wrap selection:bg-foreground/10">
          {text}
        </div>
      )}
    </div>
  )
}
