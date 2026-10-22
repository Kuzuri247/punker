"use client"

import { ArrowUpIcon, Dices } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { ModelPicker } from "@/components/model-picker"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { createGame } from "@/lib/games/actions"
import {
  DEFAULT_GAME_MODEL_ID,
  type GameModelId,
} from "@/lib/games/model-catalog"
import { suggestions } from "@/lib/games/suggestions"
import { cn } from "@/lib/utils"

export function LandingComposer({
  userId,
  value,
  onValueChange,
  className,
  showSuggestions = true,
}: {
  userId?: string | null
  value?: string
  onValueChange?: (val: string) => void
  className?: string
  showSuggestions?: boolean
}) {
  const router = useRouter()
  const [internalPrompt, setInternalPrompt] = useState("")
  const [modelId, setModelId] = useState<GameModelId>(DEFAULT_GAME_MODEL_ID)
  const [templateIndex, setTemplateIndex] = useState(-1)
  const [isRolling, setIsRolling] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isControlled = value !== undefined
  const prompt = isControlled ? value : internalPrompt

  function updatePrompt(newVal: string) {
    if (isControlled) {
      onValueChange?.(newVal)
    } else {
      setInternalPrompt(newVal)
    }
  }

  function handleCycleTemplate() {
    setIsRolling(true)
    setTimeout(() => setIsRolling(false), 350)
    const nextIndex = (templateIndex + 1) % suggestions.length
    setTemplateIndex(nextIndex)
    updatePrompt(suggestions[nextIndex].prompt)
  }

  function handleSelectSuggestion(suggestionPrompt: string) {
    updatePrompt(suggestionPrompt)
  }

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = prompt.trim()
    if (!trimmed || isPending) return

    if (userId) {
      startTransition(async () => {
        await createGame(trimmed, modelId)
      })
    } else {
      // Guest user: preserve prompt and guide to sign-up / studio
      try {
        sessionStorage.setItem("punker_pending_prompt", trimmed)
        sessionStorage.setItem("punker_pending_model", modelId)
      } catch (_) {}
      router.push("/sign-up?redirect_url=/new")
    }
  }

  const canSubmit = prompt.trim().length > 0 && !isPending

  return (
    <div className={cn("mx-auto w-full max-w-2xl space-y-3.5", className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <InputGroup
          className="relative flex flex-col w-full rounded-2xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#15161c]/90 backdrop-blur-xl shadow-xl dark:shadow-2xl transition-all duration-300 focus-within:border-cyan-500/40 focus-within:ring-2 focus-within:ring-cyan-500/20 p-2.5"
        >
          <InputGroupTextarea
            name="prompt"
            value={prompt}
            onChange={(e) => updatePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            disabled={isPending}
            placeholder="Describe the 3D game you want to build…"
            rows={2}
            className="field-sizing-content max-h-48 min-h-14 px-3.5 pt-2 text-[15px] font-normal leading-relaxed text-foreground placeholder:text-muted-foreground"
          />

          <InputGroupAddon align="block-end" className="gap-2 px-2 pb-1 pt-1.5">
            <ModelPicker modelId={modelId} onModelChange={setModelId} />

            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              Ready
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Dice suggestion cycle */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={handleCycleTemplate}
                title={
                  templateIndex >= 0
                    ? `Idea (${templateIndex + 1}/${suggestions.length}): ${suggestions[templateIndex].label}`
                    : "Roll a game idea"
                }
                aria-label="Roll a game idea"
                className="size-8 rounded-full text-foreground hover:text-foreground bg-white/10 hover:bg-white/15 border border-white/10 transition-all active:scale-90 cursor-pointer"
              >
                <Dices
                  className={cn(
                    "size-4 transition-transform duration-300",
                    isRolling && "rotate-180 scale-125 text-primary"
                  )}
                />
              </Button>

              {/* Submit */}
              <Button
                type="submit"
                size="icon"
                disabled={!canSubmit}
                aria-label="Build game"
                className={cn(
                  "size-8 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer",
                  canSubmit
                    ? "bg-foreground text-background hover:bg-foreground/90 hover:shadow-md"
                    : "bg-white/10 text-zinc-400/60 opacity-60 cursor-not-allowed border border-white/10"
                )}
              >
                <ArrowUpIcon className="size-4 stroke-[2.5]" />
              </Button>
            </div>
          </InputGroupAddon>
        </InputGroup>
      </form>

      {/* Suggestion Chips */}
      {showSuggestions && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span className="text-muted-foreground mr-1 text-[11px]">Try an idea:</span>
          {suggestions.slice(0, 4).map((sugg) => {
            const Icon = sugg.icon
            return (
              <button
                key={sugg.label}
                type="button"
                onClick={() => handleSelectSuggestion(sugg.prompt)}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-border/80 dark:border-white/10 bg-secondary/60 dark:bg-white/5 px-2.5 py-1 text-[11px] font-normal text-muted-foreground hover:bg-secondary dark:hover:bg-white/10 hover:text-foreground transition-all active:scale-95"
              >
                <Icon className="size-3 text-muted-foreground/80" />
                <span>{sugg.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
