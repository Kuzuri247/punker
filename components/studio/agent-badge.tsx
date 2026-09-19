"use client"

import {
  SparklesIcon,
  Code2Icon,
  PaletteIcon,
  Volume2Icon,
  ShieldCheckIcon,
  BotIcon,
} from "lucide-react"

import {
  AGENT_DESCRIPTORS,
  type AgentRole,
} from "@/lib/games/agents/types"
import { cn } from "@/lib/utils"

const ROLE_ICONS: Record<AgentRole, React.ComponentType<{ className?: string }>> = {
  architect: SparklesIcon,
  engineer: Code2Icon,
  artist: PaletteIcon,
  audio: Volume2Icon,
  qa: ShieldCheckIcon,
}

const ROLE_STYLES: Record<
  AgentRole,
  {
    badge: string
    avatar: string
    dot: string
    border: string
  }
> = {
  architect: {
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/15",
    avatar: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    dot: "bg-indigo-400",
    border: "border-indigo-500/30",
  },
  engineer: {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/15",
    avatar: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    dot: "bg-sky-400",
    border: "border-sky-500/30",
  },
  artist: {
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/30 hover:bg-pink-500/15",
    avatar: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    dot: "bg-pink-400",
    border: "border-pink-500/30",
  },
  audio: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
    avatar: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    dot: "bg-amber-400",
    border: "border-amber-500/30",
  },
  qa: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15",
    avatar: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    dot: "bg-emerald-400",
    border: "border-emerald-500/30",
  },
}

export function AgentBadge({
  role,
  size = "sm",
  showTitle = false,
  className,
}: {
  role?: AgentRole
  size?: "xs" | "sm" | "md"
  showTitle?: boolean
  className?: string
}) {
  if (!role || !AGENT_DESCRIPTORS[role]) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-2 py-0.5 text-xs font-medium text-foreground",
          className
        )}
      >
        <BotIcon className="size-3 text-muted-foreground" />
        <span>Punker Studio</span>
      </span>
    )
  }

  const descriptor = AGENT_DESCRIPTORS[role]
  const Icon = ROLE_ICONS[role]
  const styles = ROLE_STYLES[role]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        styles.badge,
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-xs tracking-wide",
        className
      )}
      title={`${descriptor.name} (${descriptor.title}) — ${descriptor.description}`}
    >
      <span className={cn("size-1.5 rounded-full animate-pulse", styles.dot)} />
      <Icon className={cn(size === "xs" ? "size-2.5" : "size-3.5")} />
      <span className="font-semibold">{descriptor.name}</span>
      {showTitle && (
        <span className="text-[11px] opacity-75 font-normal">
          • {descriptor.title}
        </span>
      )}
    </span>
  )
}

export function AgentAvatar({
  role,
  size = "md",
  className,
}: {
  role?: AgentRole
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  if (!role || !AGENT_DESCRIPTORS[role]) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-border/70 bg-secondary/80 text-foreground shadow-xs",
          size === "sm" && "size-7",
          size === "md" && "size-8",
          size === "lg" && "size-10",
          className
        )}
      >
        <BotIcon className="size-4 text-muted-foreground" />
      </div>
    )
  }

  const descriptor = AGENT_DESCRIPTORS[role]
  const Icon = ROLE_ICONS[role]
  const styles = ROLE_STYLES[role]

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg border shadow-xs transition-transform hover:scale-105",
        styles.avatar,
        size === "sm" && "size-7",
        size === "md" && "size-8",
        size === "lg" && "size-10",
        className
      )}
      title={`${descriptor.name} • ${descriptor.title}`}
    >
      <Icon className={cn(size === "sm" ? "size-3.5" : size === "md" ? "size-4" : "size-5")} />
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background",
          styles.dot
        )}
      />
    </div>
  )
}
