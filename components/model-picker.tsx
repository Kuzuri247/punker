"use client"

import { ChevronDownIcon, KeyRound, ShieldCheck, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InputGroupButton } from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import {
  GAME_MODELS,
  type GameModelId,
  type GameModelConfig,
} from "@/lib/games/model-catalog"
import {
  getStoredApiKeys,
  onByokChange,
  type ModelProvider,
} from "@/lib/games/byok-store"
import { ByokDialog } from "@/components/byok-dialog"

export function ModelPicker({
  modelId,
  onModelChange,
}: {
  modelId: GameModelId
  onModelChange: (modelId: GameModelId) => void
}) {
  const selected = GAME_MODELS.find((model) => model.id === modelId)
  const [byokOpen, setByokOpen] = useState(false)
  const [byokKeys, setByokKeys] = useState<Record<ModelProvider, string>>({
    google: "",
    anthropic: "",
    openai: "",
  })

  useEffect(() => {
    setByokKeys(getStoredApiKeys())
    return onByokChange(() => {
      setByokKeys(getStoredApiKeys())
    })
  }, [])

  const providers: Array<{
    id: ModelProvider
    name: string
    models: readonly GameModelConfig[]
  }> = [
    {
      id: "google",
      name: "Google Gemini",
      models: GAME_MODELS.filter((m) => m.provider === "google"),
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      models: GAME_MODELS.filter((m) => m.provider === "anthropic"),
    },
    {
      id: "openai",
      name: "OpenAI",
      models: GAME_MODELS.filter((m) => m.provider === "openai"),
    },
  ]

  const hasSelectedByok = selected
    ? Boolean(byokKeys[selected.provider as ModelProvider])
    : false

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <InputGroupButton className="rounded-full py-1 text-xs text-muted-foreground hover:text-foreground">
              <span className="font-sans font-medium">{selected?.name ?? modelId}</span>
              {hasSelectedByok && (
                <span title="Using custom BYOK key" className="inline-flex">
                  <ShieldCheck className="size-3 text-emerald-500" />
                </span>
              )}
              <ChevronDownIcon className="size-3 opacity-60" />
            </InputGroupButton>
          }
        />
        <DropdownMenuContent className="w-80 p-1.5" align="start">
          <DropdownMenuRadioGroup
            value={modelId}
            onValueChange={(value) => onModelChange(value as GameModelId)}
          >
            {providers.map((group, groupIdx) => (
              <DropdownMenuGroup key={group.id}>
                {groupIdx > 0 && <DropdownMenuSeparator className="my-1" />}
                <DropdownMenuLabel className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>{group.name}</span>
                  {Boolean(byokKeys[group.id]) && (
                    <span className="text-[10px] text-emerald-500 font-medium lowercase">
                      key active
                    </span>
                  )}
                </DropdownMenuLabel>
                {group.models.map((model) => {
                  const isPro = model.tier === "pro"
                  const hasCustomKey = Boolean(byokKeys[model.provider])

                  return (
                    <DropdownMenuRadioItem
                      key={model.id}
                      value={model.id}
                      className="py-1.5 px-2 cursor-pointer rounded-md"
                    >
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-medium text-xs text-foreground">
                            {model.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {hasCustomKey ? (
                              <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                              >
                                BYOK
                              </Badge>
                            ) : isPro ? (
                              <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
                              >
                                PRO
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/70">
                                free
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          {model.tagline}
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                  )
                })}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem
            onClick={() => setByokOpen(true)}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
          >
            <KeyRound className="size-3.5 text-foreground/80 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">Custom API Keys (BYOK)</span>
              <span className="text-[10px] text-muted-foreground">
                Bypass credit limits with personal provider keys
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ByokDialog open={byokOpen} onOpenChange={setByokOpen} />
    </>
  )
}
