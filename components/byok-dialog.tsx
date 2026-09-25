"use client"

import * as React from "react"
import { KeyRound, Check, ShieldCheck, Eye, EyeOff } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getStoredApiKeys,
  setStoredApiKey,
  clearStoredApiKey,
  type ModelProvider,
} from "@/lib/games/byok-store"

export function ByokDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? controlledOnOpenChange : setInternalOpen

  const [keys, setKeys] = React.useState<Record<ModelProvider, string>>({
    anthropic: "",
    openai: "",
    google: "",
  })

  const [showKeys, setShowKeys] = React.useState<Record<ModelProvider, boolean>>({
    anthropic: false,
    openai: false,
    google: false,
  })

  const [savedSuccess, setSavedSuccess] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setKeys(getStoredApiKeys())
      setSavedSuccess(false)
    }
  }, [isOpen])

  function handleSave(provider: ModelProvider) {
    const val = keys[provider].trim()
    if (val) {
      setStoredApiKey(provider, val)
    } else {
      clearStoredApiKey(provider)
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  function handleClear(provider: ModelProvider) {
    clearStoredApiKey(provider)
    setKeys((prev) => ({ ...prev, [provider]: "" }))
  }

  const providers: Array<{
    id: ModelProvider
    name: string
    placeholder: string
    hint: string
  }> = [
    {
      id: "anthropic",
      name: "Anthropic Claude",
      placeholder: "sk-ant-api03-...",
      hint: "Unlocks Claude 3.7 Sonnet & 3.5 Haiku with bypass on credit deductions.",
    },
    {
      id: "openai",
      name: "OpenAI",
      placeholder: "sk-proj-...",
      hint: "Unlocks GPT-4o & GPT-4o Mini with bypass on credit deductions.",
    },
    {
      id: "google",
      name: "Google Gemini",
      placeholder: "AIzaSy...",
      hint: "Unlocks Gemini 3.8 Flash & 3.6 Flash without rate limits.",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger render={trigger as any} />}
      <DialogContent className="max-w-md sm:max-w-lg p-5">
        <DialogHeader className="gap-1.5 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
              <KeyRound className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">
              Bring Your Own Key (BYOK)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Provide your personal provider API keys to bypass credit deduction and
            unlock pro models (Claude 3.7 Sonnet & GPT-4o) directly. Keys stay in
            your browser and are transmitted securely for your turns only.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {providers.map((p) => {
            const hasKey = Boolean(keys[p.id])
            const isVisible = showKeys[p.id]

            return (
              <div
                key={p.id}
                className="flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/60 p-3 shadow-2xs backdrop-blur-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-foreground">
                      {p.name}
                    </Label>
                    {hasKey && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="size-3" />
                        Active
                      </span>
                    )}
                  </div>
                  {hasKey && (
                    <button
                      type="button"
                      onClick={() => handleClear(p.id)}
                      className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative flex items-center">
                  <Input
                    type={isVisible ? "text" : "password"}
                    placeholder={p.placeholder}
                    value={keys[p.id]}
                    onChange={(e) =>
                      setKeys((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="h-8 pr-16 text-xs font-mono"
                  />
                  <div className="absolute right-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowKeys((prev) => ({
                          ...prev,
                          [p.id]: !prev[p.id],
                        }))
                      }
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {isVisible ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => handleSave(p.id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/80">{p.hint}</p>
              </div>
            )
          })}
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5" />
            <span>API key saved successfully! Credit deductions will be bypassed.</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
