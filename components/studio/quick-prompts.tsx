"use client"

import {
  SparklesIcon,
  Volume2Icon,
  PaletteIcon,
  ZapIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  {
    icon: Volume2Icon,
    label: "Add retro 8-bit sound effects",
    prompt: "Echo, synthesize procedural Web Audio sound effects for player jump, laser fire, and score pickups.",
  },
  {
    icon: PaletteIcon,
    label: "Upgrade to neon shader lighting",
    prompt: "Nova, upgrade the scene aesthetics with vibrant neon lighting, emissive materials, and particle trails.",
  },
  {
    icon: ZapIcon,
    label: "Add juicy impact & camera shake",
    prompt: "Echo & Rex, add intense juice: screen shake on collisions, ease-in camera recoil, and explosion particles.",
  },
  {
    icon: ShieldCheckIcon,
    label: "Run QA playtest & physics check",
    prompt: "Vigil, inspect the sandbox code, verify 60 FPS performance thresholds, and ensure controls respond smoothly.",
  },
]

export function QuickPrompts({
  onSelect,
  disabled,
  className,
}: {
  onSelect: (prompt: string) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {SUGGESTIONS.map((item) => {
        const Icon = item.icon

        return (
          <button
            key={item.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon className="size-3 text-primary/80" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
