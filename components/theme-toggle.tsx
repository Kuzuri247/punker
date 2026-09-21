"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const emptySubscribe = () => () => {}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <div
        className={cn(
          "size-8 rounded-full border border-border/40 bg-secondary/20",
          className
        )}
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className={cn(
        "size-8 rounded-full border border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-all",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="size-4 text-foreground/90 transition-transform duration-200" />
      ) : (
        <Moon className="size-4 text-foreground/90 transition-transform duration-200" />
      )}
    </Button>
  )
}
