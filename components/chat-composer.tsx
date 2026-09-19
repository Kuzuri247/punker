"use client"

import { ArrowUpIcon, SquareIcon } from "lucide-react"

import { ModelPicker } from "@/components/model-picker"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import type { GameModelId } from "@/lib/games/model-catalog"

export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
  onStop,
  modelId,
  onModelChange,
  streaming = false,
  disabled = false,
  placeholder = "Describe the game you want to build…",
}: {
  value: string
  onValueChange: (value: string) => void
  /** Receives the trimmed prompt; only called when it is non-empty. */
  onSubmit: (value: string) => void
  /** Cancels the turn in flight. Required for the button to offer a stop. */
  onStop?: () => void
  /** The model the next turn runs on, and the way to change it. */
  modelId: GameModelId
  onModelChange: (modelId: GameModelId) => void
  /** A turn is in flight, so the submit button becomes a stop button. */
  streaming?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  const prompt = value.trim()
  const canSubmit = prompt.length > 0 && !disabled
  // Stop replaces send rather than sitting beside it, so the one button in the
  // corner always drives the turn: start it, then end it.
  const canStop = streaming && Boolean(onStop)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    onSubmit(prompt)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter keeps the newline.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <InputGroup className="rounded-2xl border-border/60 bg-secondary/35 p-1.5 shadow-xs transition-all focus-within:border-sky-500/40 focus-within:ring-1 focus-within:ring-sky-500/20">
        <InputGroupTextarea
          name="prompt"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="field-sizing-content max-h-48 min-h-11 px-3 pt-2 text-[15px] placeholder:text-muted-foreground/60"
        />
        <InputGroupAddon align="block-end" className="px-1.5 pt-1">
          <ModelPicker modelId={modelId} onModelChange={onModelChange} />
          {/* Base UI buttons default to `type="button"`, so only send opts in. */}
          {canStop ? (
            <Button
              size="icon"
              onClick={onStop}
              aria-label="Stop generating"
              className="ml-auto size-8 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-transform active:scale-95"
            >
              <SquareIcon className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!canSubmit}
              aria-label="Send message"
              className="ml-auto size-8 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 transition-transform active:scale-95"
            >
              <ArrowUpIcon className="size-4" />
            </Button>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
