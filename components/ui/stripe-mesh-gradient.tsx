"use client"

import { cn } from "@/lib/utils"

export function StripeMeshGradient({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none",
        className
      )}
    >
      {/* Central Indigo / Violet Node */}
      <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,#4f46e5_0%,transparent_70%)] opacity-25 blur-3xl animate-mesh-drift-1 transform-gpu will-change-transform" />

      {/* Left Cyan Accent Node */}
      <div className="absolute top-[10%] -left-[10%] w-[700px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,#06b6d4_0%,transparent_70%)] opacity-20 blur-3xl animate-mesh-drift-2 transform-gpu will-change-transform" />

      {/* Right Violet / Purple Node */}
      <div className="absolute top-[20%] -right-[10%] w-[700px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,#6366f1_0%,transparent_70%)] opacity-20 blur-3xl animate-mesh-drift-3 transform-gpu will-change-transform" />
    </div>
  )
}
