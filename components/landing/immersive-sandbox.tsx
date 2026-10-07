"use client"

import { useRef, useState } from "react"
import {
  ArrowRight,
  Eye,
  Flame,
  Gauge,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react"
import Link from "next/link"

import { ThreeScenePreview } from "@/components/landing/three-scene-preview"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ImmersiveSandbox({
  userId,
  className,
}: {
  userId?: string | null
  className?: string
}) {
  const [wireframe, setWireframe] = useState(false)
  const [boostActive, setBoostActive] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(false)
  const [steerDirection, setSteerDirection] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Live telemetry state from Three.js engine
  const [telemetry, setTelemetry] = useState<{
    speedKmh: number
    score: number
    isBoosting: boolean
    fps: number
  }>({
    speedKmh: 360,
    score: 0,
    isBoosting: false,
    fps: 60,
  })

  const sandboxRef = useRef<HTMLDivElement>(null)

  function toggleFullscreen() {
    if (!sandboxRef.current) return
    if (!document.fullscreenElement) {
      sandboxRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={sandboxRef}
      className={cn(
        "relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#08090C] shadow-2xl backdrop-blur-xl transition-all",
        isFullscreen && "h-screen w-screen max-w-none rounded-none border-none",
        className
      )}
    >
      {/* Sleek Window Frame Bar (Zero Green Dots, Zero Clutter) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#12131A]/95 px-4 py-2.5 backdrop-blur-md">
        {/* Left: Clean Monochrome Window Buttons & Engine Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-white/90 font-medium">punker://engine/apex-skyway</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
              WebGL2 Runtime
            </span>
          </div>
        </div>

        {/* Center: Live Performance & Telemetry (No green dots) */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-400">
            <Gauge className="size-3 text-cyan-400" />
            <span>{telemetry.speedKmh} KM/H</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">
            <Zap className="size-3 text-amber-400" />
            <span>{telemetry.score} PTS</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-zinc-400">
            <span>{telemetry.fps} FPS</span>
          </div>
        </div>

        {/* Right: Interactive Actions */}
        <div className="flex items-center gap-1.5">
          {/* Sound Synthesizer Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            title={isSoundEnabled ? "Mute engine audio" : "Enable futuristic engine audio"}
            aria-label="Toggle audio"
            className={cn(
              "h-7 cursor-pointer gap-1 rounded-full border px-2 text-[11px] transition-all",
              isSoundEnabled
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/15 hover:text-white"
            )}
          >
            {isSoundEnabled ? <Volume2 className="size-3" /> : <VolumeX className="size-3" />}
            <span className="hidden sm:inline">{isSoundEnabled ? "Sound On" : "Sound"}</span>
          </Button>

          {/* Wireframe toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Mesh"
            className={cn(
              "h-7 cursor-pointer gap-1 rounded-full border px-2.5 text-[11px] transition-all",
              wireframe
                ? "bg-cyan-500 text-white border-cyan-400"
                : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/15 hover:text-white"
            )}
          >
            <Eye className="size-3" />
            <span className="hidden sm:inline">Wireframe</span>
          </Button>

          {/* Fullscreen toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="size-7 cursor-pointer rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </Button>

          {/* Open Studio Link */}
          <Link
            href={userId ? "/new" : "/sign-up"}
            className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-all active:scale-95 ml-1"
          >
            <span>Open Studio</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative w-full h-[520px] sm:h-[620px] bg-[#08090C] overflow-hidden">
        <ThreeScenePreview
          wireframe={wireframe}
          boost={boostActive}
          steerDirection={steerDirection}
          isSoundEnabled={isSoundEnabled}
          onTelemetryUpdate={setTelemetry}
        />

        {/* Clean Top-Left Game Telemetry Overlay */}
        <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-1.5 font-mono">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur-md">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Apex Craft:</span>
            <span className="text-cyan-400 font-semibold">{telemetry.speedKmh} KM/H</span>
            {telemetry.isBoosting && (
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Flame className="size-2.5" /> BOOST
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-1 text-[11px] text-zinc-300 backdrop-blur-md">
            <span className="text-amber-400">★ Cores:</span>
            <span className="font-semibold text-white">{telemetry.score}</span>
            <span className="text-[10px] text-zinc-500">• Steer to collect</span>
          </div>
        </div>

        {/* Floating Bottom Interactive Controls Deck (Uncluttered, Sleek, Touch + Keyboard) */}
        <div className="absolute bottom-5 inset-x-0 z-20 px-4 flex flex-col items-center gap-2.5">
          {/* Touch / Click Steering & Boost Controls */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPointerDown={() => setSteerDirection(-1)}
              onPointerUp={() => setSteerDirection(0)}
              onPointerLeave={() => setSteerDirection(0)}
              className="h-9 px-3.5 rounded-full border-white/15 bg-black/70 text-xs font-mono text-white/90 backdrop-blur-md hover:bg-white/15 hover:text-white active:scale-95 cursor-pointer shadow-lg select-none"
            >
              <span>← Steer Left</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onPointerDown={() => setBoostActive(true)}
              onPointerUp={() => setBoostActive(false)}
              onPointerLeave={() => setBoostActive(false)}
              className={cn(
                "h-9 px-4 rounded-full border text-xs font-mono font-medium backdrop-blur-md active:scale-95 cursor-pointer shadow-lg select-none transition-all",
                boostActive || telemetry.isBoosting
                  ? "border-amber-500 bg-amber-500 text-black shadow-amber-500/30"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              )}
            >
              <Flame className="size-3.5 mr-1" />
              <span>HOLD BOOST</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onPointerDown={() => setSteerDirection(1)}
              onPointerUp={() => setSteerDirection(0)}
              onPointerLeave={() => setSteerDirection(0)}
              className="h-9 px-3.5 rounded-full border-white/15 bg-black/70 text-xs font-mono text-white/90 backdrop-blur-md hover:bg-white/15 hover:text-white active:scale-95 cursor-pointer shadow-lg select-none"
            >
              <span>Steer Right →</span>
            </Button>
          </div>

          {/* Desktop Keyboard & Drag Controls Legend */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3.5 py-1 text-[11px] font-mono text-zinc-400 backdrop-blur-md">
            <span>Controls:</span>
            <span className="text-zinc-200">[A][D] or Drag to Steer</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-200">Hold [W] or [Space] to Boost</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-200">[S] Brake</span>
          </div>
        </div>
      </div>
    </div>
  )
}
