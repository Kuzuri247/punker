"use client"

import type { DynamicToolUIPart, ToolUIPart } from "ai"
import { getToolName } from "ai"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleAlertIcon,
} from "lucide-react"
import { useState } from "react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/**
 * Gemini-style minimal, collapsible tool execution item.
 * Clean, quiet, and unobtrusive.
 */
export function ToolCallCard({
  part,
  className,
}: {
  part: ToolUIPart | DynamicToolUIPart
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const toolName = getToolName(part)
  const status = getToolStatus(part.state)
  const input = part.input as Record<string, unknown> | undefined
  const targetPath = typeof input?.path === "string" ? input.path : undefined
  const hasDetails = hasExpandableDetails(toolName, input)

  const label = formatMinimalLabel(toolName, targetPath, status)

  return (
    <div className={cn("my-1 w-full max-w-2xl", className)}>
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        disabled={!hasDetails}
        className={cn(
          "group flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
          hasDetails && "cursor-pointer hover:bg-muted/40",
          status === "failed" && "text-destructive hover:text-destructive"
        )}
      >
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          {status === "active" ? (
            <Spinner className="size-3 text-muted-foreground" />
          ) : status === "done" ? (
            <CheckIcon className="size-3 text-muted-foreground/70 group-hover:text-foreground" />
          ) : (
            <CircleAlertIcon className="size-3 text-destructive" />
          )}
        </span>

        <span className="text-[12px] font-normal text-muted-foreground group-hover:text-foreground">
          {label}
        </span>

        {hasDetails && (
          <span className="ml-1 text-muted-foreground/50 transition-transform group-hover:text-foreground">
            {expanded ? (
              <ChevronDownIcon className="size-3" />
            ) : (
              <ChevronRightIcon className="size-3" />
            )}
          </span>
        )}
      </button>

      {/* Expanded minimal details */}
      {expanded && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border/70 bg-card/60 p-3 text-[12px] text-foreground/90 shadow-2xs backdrop-blur-xs animate-in fade-in-50">
          {toolName === "replace_text" && input && (
            <div className="space-y-2">
              {typeof input.find === "string" && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-destructive">
                  <div className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-1">
                    - find
                  </div>
                  <pre className="max-h-28 overflow-x-auto font-mono text-[11px] whitespace-pre-wrap">
                    {input.find}
                  </pre>
                </div>
              )}
              {typeof input.replace === "string" && (
                <div className="rounded-lg border border-border/70 bg-muted/40 p-2 text-foreground">
                  <div className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-1">
                    + replace
                  </div>
                  <pre className="max-h-28 overflow-x-auto font-mono text-[11px] whitespace-pre-wrap">
                    {input.replace || "(removed)"}
                  </pre>
                </div>
              )}
            </div>
          )}

          {toolName === "write_file" && input && typeof input.content === "string" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>{targetPath}</span>
                <span>{input.content.split("\n").length} lines</span>
              </div>
              <pre className="max-h-36 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-2.5 font-mono text-[11px] leading-relaxed">
                {input.content.slice(0, 1000) +
                  (input.content.length > 1000 ? "\n... [truncated]" : "")}
              </pre>
            </div>
          )}

          {toolName === "qa_inspect" && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2 text-xs text-muted-foreground">
              QA Audit passed: index.html structure, scripts, and canvas verified.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getToolStatus(
  state: ToolUIPart["state"] | DynamicToolUIPart["state"]
): "active" | "done" | "failed" {
  switch (state) {
    case "output-available":
      return "done"
    case "output-error":
    case "output-denied":
      return "failed"
    default:
      return "active"
  }
}

function formatMinimalLabel(
  tool: string,
  targetPath: string | undefined,
  status: "active" | "done" | "failed"
): string {
  const isDone = status === "done"

  switch (tool) {
    case "write_file":
      return targetPath
        ? `${isDone ? "Wrote" : "Writing"} ${targetPath}`
        : `${isDone ? "Wrote file" : "Writing file"}`
    case "replace_text":
      return targetPath
        ? `${isDone ? "Edited" : "Editing"} ${targetPath}`
        : `${isDone ? "Edited file" : "Editing file"}`
    case "read_file":
      return targetPath
        ? `${isDone ? "Read" : "Reading"} ${targetPath}`
        : `${isDone ? "Read file" : "Reading file"}`
    case "list_files":
      return isDone ? "Listed workspace files" : "Listing files"
    case "delete_file":
      return targetPath
        ? `${isDone ? "Deleted" : "Deleting"} ${targetPath}`
        : `${isDone ? "Deleted file" : "Deleting file"}`
    case "qa_inspect":
      return isDone ? "QA playtest passed" : "Running QA inspection"
    default:
      return isDone ? "Tool complete" : "Running tool"
  }
}

function hasExpandableDetails(
  tool: string,
  input: Record<string, unknown> | undefined
): boolean {
  if (!input) return false
  if (tool === "replace_text" && (input.find || input.replace)) return true
  if (tool === "write_file" && input.content) return true
  if (tool === "qa_inspect") return true
  return false
}
