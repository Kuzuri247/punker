"use client"

import { StripeMeshGradient } from "@/components/ui/stripe-mesh-gradient"
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
      {/* Stripe-inspired chromatic mesh wave */}
      <StripeMeshGradient />

      {/* Outer ambient sapphire halo */}
      <div
        className="h-[420px] w-[90vw] max-w-[920px] rounded-full blur-[100px] sm:blur-[120px] opacity-60 dark:opacity-75 animate-[pulse_8s_ease-in-out_infinite] transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 50%, rgba(79, 70, 229, 0.35) 0%, rgba(6, 182, 212, 0.25) 35%, rgba(99, 102, 241, 0.12) 60%, transparent 80%)",
        }}
      />

      {/* Inner luminous core directly behind the chat input */}
      <div
        className="absolute h-[240px] w-[70vw] max-w-[620px] rounded-full blur-[65px] opacity-50 dark:opacity-65 animate-[pulse_6s_ease-in-out_infinite_1s]"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(6, 182, 212, 0.3) 0%, rgba(79, 70, 229, 0.2) 45%, transparent 75%)",
        }}
      />

      {/* Light mode subtle aura */}
      <div
        className="absolute h-[380px] w-[85vw] max-w-[800px] rounded-full blur-[90px] opacity-40 dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(147, 197, 253, 0.45) 0%, rgba(199, 210, 254, 0.3) 40%, transparent 75%)",
        }}
      />
    </div>
  )
}
