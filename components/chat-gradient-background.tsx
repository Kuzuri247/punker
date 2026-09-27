"use client"

import { cn } from "@/lib/utils"

export function ChatGradientBackground({
  className,
}: {
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none",
        className
      )}
    >
      {/* Outer ambient sapphire halo (Gemini style) */}
      <div
        className="h-[420px] w-[90vw] max-w-[920px] rounded-full blur-[100px] sm:blur-[120px] opacity-75 dark:opacity-85 animate-[pulse_8s_ease-in-out_infinite] transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 50%, rgba(37, 99, 235, 0.45) 0%, rgba(29, 78, 216, 0.3) 35%, rgba(30, 58, 138, 0.16) 60%, transparent 80%)",
        }}
      />

      {/* Inner luminous blue core directly behind the chat input */}
      <div
        className="absolute h-[240px] w-[70vw] max-w-[620px] rounded-full blur-[65px] opacity-65 dark:opacity-75 animate-[pulse_6s_ease-in-out_infinite_1s]"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(59, 130, 246, 0.38) 0%, rgba(37, 99, 235, 0.2) 45%, transparent 75%)",
        }}
      />

      {/* Light mode refined aura */}
      <div
        className="absolute h-[380px] w-[85vw] max-w-[800px] rounded-full blur-[90px] opacity-60 dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(147, 197, 253, 0.55) 0%, rgba(191, 219, 254, 0.35) 40%, transparent 75%)",
        }}
      />
    </div>
  )
}
