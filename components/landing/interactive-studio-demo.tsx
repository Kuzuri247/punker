"use client"

import {
  CheckIcon,
  ChevronDown,
  Eye,
  Flame,
  Maximize2,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
} from "lucide-react"
import { useState } from "react"

import {
  ThreeScenePreview,
  type CameraView,
  type ScenePreset,
} from "@/components/landing/three-scene-preview"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Message, MessageContent } from "@/components/ui/message"
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire"
import { cn } from "@/lib/utils"

type DemoPreset = {
  id: ScenePreset
  title: string
  model: string
  prompt: string
  thinkingTime: string
  reasoning: string
  tools: Array<{ verb: string; target: string }>
  reply: string
  question: string
  options: Array<{ id: CameraView; label: string; desc: string }>
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "cyberpunk",
    title: "cyberpunk-hoverbike",
    model: "Claude 3.7 Sonnet (Thinking)",
    prompt:
      "A fast neon cyberpunk hoverbike racer over a glowing grid with procedural buildings, velocity banking, and glowing speed boost pads.",
    thinkingTime: "3.2s",
    reasoning:
      "Decomposing prompt into Three.js primitives. Setting up perspective camera with dynamic trailing chase offset. Instantiating procedural track chunks. Generating vertex and fragment shaders for neon bloom grid. Adding velocity decay and steering responsiveness...",
    tools: [
      { verb: "Listed assets", target: "in /assets" },
      { verb: "Wrote", target: "src/scene.ts" },
      { verb: "Wrote", target: "src/hovercraft.ts" },
      { verb: "Added", target: "src/shaders/neon-grid.glsl" },
      { verb: "Configured", target: "WASD + touch controls" },
    ],
    reply:
      "I've built your neon hoverbike! The craft floats with harmonic bobbing physics and leans dynamically into corners. I've added procedural skyscrapers that stream past in parallax, glowing cyan speed arches, and pink turbo pads on the track.",
    question: "Which camera perspective do you want to inspect?",
    options: [
      { id: "chase", label: "Third-Person Chase", desc: "Dynamic trailing behind the thruster" },
      { id: "cockpit", label: "Cockpit View", desc: "Low frontal angle facing the horizon" },
      { id: "topdown", label: "Isometric Top-Down", desc: "Tactical bird's eye track overview" },
    ],
  },
  {
    id: "voxel",
    title: "voxel-survival-island",
    model: "Gemini 2.5 Flash",
    prompt:
      "A floating voxel survival island with tiered grass, dirt, and stone cubes, stylized pine trees, and a spinning power crystal in the center.",
    thinkingTime: "2.4s",
    reasoning:
      "Calculating radial voxel coordinate distribution. Generating tiered cube instances for grass, loam, and bedrock layers. Adding low-poly cone-stack pine trees with procedural scatter. Emitting ambient octahedron crystal light with harmonic oscillation...",
    tools: [
      { verb: "Generated", target: "src/terrain/voxel-island.ts" },
      { verb: "Wrote", target: "src/foliage/pine-tree.ts" },
      { verb: "Configured", target: "src/entities/crystal.ts" },
      { verb: "Added", target: "ambient point lighting" },
    ],
    reply:
      "Your voxel island is live! The terrain is built with multi-layered cube voxels (lush top grass, nutrient loam, and deep stone). In the clearing stands a floating power crystal with an animated purple emissive glow.",
    question: "How would you like to view the island?",
    options: [
      { id: "chase", label: "Orbit Perspective", desc: "Angled cinematic vantage point" },
      { id: "cockpit", label: "Ground Level", desc: "First-person adventurer height" },
      { id: "topdown", label: "Map Plan", desc: "Overhead strategic view" },
    ],
  },
  {
    id: "space",
    title: "zero-g-asteroid-defense",
    model: "GPT-4o",
    prompt:
      "A 3D space fighter arena with rotating polygonal asteroids, laser crosshair reticle, and twin wing blasters.",
    thinkingTime: "2.8s",
    reasoning:
      "Constructing starfield background. Modeling low-poly interceptor fuselage with delta wings. Populating orbital ring with tumbling dodecahedron asteroids. Aligning HUD targeting reticle with forward raycast...",
    tools: [
      { verb: "Wrote", target: "src/space/fighter.ts" },
      { verb: "Wrote", target: "src/space/asteroids.ts" },
      { verb: "Added", target: "src/hud/crosshair.ts" },
      { verb: "Configured", target: "6-DOF camera kinematics" },
    ],
    reply:
      "Your space defense arena is ready! Control the interceptor drone through the tumbling asteroid field. The fighter has twin wing blasters and an animated targeting reticle locking onto forward coordinates.",
    question: "Select flight camera mode:",
    options: [
      { id: "chase", label: "Combat Chase", desc: "Stabilized stern flight perspective" },
      { id: "cockpit", label: "Pilot Cockpit", desc: "Direct through-canopy targeting" },
      { id: "topdown", label: "Radar Top-Down", desc: "Sector tactical scanner view" },
    ],
  },
]

export function InteractiveStudioDemo() {
  const [activePresetIndex, setActivePresetIndex] = useState(0)
  const [isThinkingOpen, setIsThinkingOpen] = useState(true)
  const [cameraView, setCameraView] = useState<CameraView>("chase")
  const [wireframe, setWireframe] = useState(false)
  const [boost, setBoost] = useState(false)

  const activeDemo = DEMO_PRESETS[activePresetIndex]

  function handleSelectPreset(index: number) {
    setActivePresetIndex(index)
    setCameraView("chase")
    setWireframe(false)
    setBoost(false)
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Studio Window Frame */}
      <div className="overflow-hidden rounded-2xl border border-border/80 dark:border-white/15 bg-card dark:bg-[#18191a] shadow-xl dark:shadow-2xl dark:shadow-black/70 backdrop-blur-md">
        {/* Studio Window Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 dark:border-white/10 bg-muted/40 dark:bg-[#1f2022] px-4 py-2.5">
          {/* Left: Window Breadcrumb / Status */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500/80" />
              <span className="size-2.5 rounded-full bg-amber-500/80" />
              <span className="size-2.5 rounded-full bg-emerald-500/80" />
            </div>

            <div className="h-3.5 w-px bg-border/60" />

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span className="text-foreground/80 font-medium">games/</span>
              <span>{activeDemo.title}</span>
            </div>
          </div>

          {/* Center: Presets Tab Switcher */}
          <div className="flex items-center rounded-lg border border-border/60 dark:border-white/10 bg-background/80 p-0.5 shadow-2xs">
            {DEMO_PRESETS.map((preset, idx) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  activePresetIndex === idx
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {preset.id === "cyberpunk"
                  ? "Cyberpunk"
                  : preset.id === "voxel"
                    ? "Voxel Island"
                    : "Space Arena"}
              </button>
            ))}
          </div>

          {/* Right: Studio Status Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Preview</span>
            </div>

            <div className="hidden items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground sm:flex">
              <Terminal className="size-3" />
              <span>{activeDemo.model}</span>
            </div>
          </div>
        </div>

        {/* Studio Body: Split View (Chat Thread on left, Live 3D Canvas on right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
          {/* Left Side: Real-style Chat Thread (5 cols) */}
          <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-border/60 dark:border-white/10 bg-background/60 p-4 sm:p-5 overflow-y-auto max-h-[580px] space-y-4">
            {/* User Prompt Message */}
            <Message align="end">
              <MessageContent>
                <Bubble
                  variant="secondary"
                  align="end"
                  className="rounded-2xl border border-border/60 bg-secondary/80 px-4 py-2.5 text-[13px] sm:text-[14px] font-normal leading-relaxed text-foreground shadow-2xs"
                >
                  <BubbleContent>{activeDemo.prompt}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>

            {/* Agent Thought Accordion */}
            <div className="rounded-xl border border-border/60 dark:border-white/10 bg-card/80 dark:bg-[#1e1f20]/90 p-3 shadow-2xs">
              <button
                type="button"
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="flex w-full cursor-pointer items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-cyan-500 dark:text-cyan-400" />
                  <span>Thinking ({activeDemo.thinkingTime})</span>
                </div>
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    isThinkingOpen && "rotate-180"
                  )}
                />
              </button>

              {isThinkingOpen && (
                <div className="mt-2 text-[11px] font-normal leading-relaxed text-muted-foreground/90 border-t border-border/40 pt-2 font-mono">
                  {activeDemo.reasoning}
                </div>
              )}
            </div>

            {/* Tool Execution Markers */}
            <div className="space-y-1.5 pl-1">
              {activeDemo.tools.map((tool, i) => (
                <Marker key={i} className="w-fit text-xs">
                  <MarkerIcon>
                    <CheckIcon className="size-3 text-emerald-500" />
                  </MarkerIcon>
                  <MarkerContent className="text-[12px]">
                    <span className="text-muted-foreground">{tool.verb}</span>
                    <span className="ml-1 font-mono text-foreground">{tool.target}</span>
                  </MarkerContent>
                </Marker>
              ))}
            </div>

            {/* Assistant Reply Bubble */}
            <div className="text-[13px] sm:text-[14px] font-normal leading-relaxed text-foreground bg-card/40 dark:bg-white/[0.02] rounded-xl p-3 border border-border/40">
              {activeDemo.reply}
            </div>

            {/* Interactive Question Card */}
            <div className="rounded-xl border border-border/80 dark:border-white/15 bg-card dark:bg-[#1e1f20] p-3 shadow-xs">
              <p className="text-xs font-medium text-foreground mb-2">
                {activeDemo.question}
              </p>
              <div className="space-y-1.5">
                {activeDemo.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCameraView(opt.id)}
                    className={cn(
                      "w-full cursor-pointer text-left rounded-lg p-2 transition-all border text-xs",
                      cameraView === opt.id
                        ? "border-foreground/50 bg-foreground/5 dark:bg-white/10 text-foreground font-medium shadow-2xs"
                        : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {cameraView === opt.id && (
                        <span className="size-1.5 rounded-full bg-cyan-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Real Three.js Interactive 3D Canvas (7 cols) */}
          <div className="lg:col-span-7 relative flex flex-col bg-[#08090c] dark:bg-black overflow-hidden">
            {/* 3D Scene Action Toolbar */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 shadow-sm backdrop-blur-md">
                <span className="text-[11px] font-medium text-white/90">
                  {cameraView === "chase"
                    ? "Chase Cam"
                    : cameraView === "cockpit"
                      ? "Cockpit View"
                      : "Top-Down"}
                </span>
              </div>

              {/* Interactive Toolbar buttons */}
              <div className="pointer-events-auto flex items-center gap-1.5">
                {/* Wireframe toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setWireframe(!wireframe)}
                  title="Toggle wireframe mode"
                  className={cn(
                    "h-7 cursor-pointer gap-1 rounded-full border px-2.5 text-[11px] shadow-sm backdrop-blur-md transition-all",
                    wireframe
                      ? "bg-cyan-500 text-white border-cyan-400"
                      : "bg-black/60 text-white/90 border-white/15 hover:bg-white/15"
                  )}
                >
                  <Eye className="size-3" />
                  <span>Wireframe</span>
                </Button>

                {/* Boost toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBoost(!boost)}
                  title="Toggle thruster boost"
                  className={cn(
                    "h-7 cursor-pointer gap-1 rounded-full border px-2.5 text-[11px] shadow-sm backdrop-blur-md transition-all",
                    boost
                      ? "bg-amber-500 text-white border-amber-400"
                      : "bg-black/60 text-white/90 border-white/15 hover:bg-white/15"
                  )}
                >
                  <Flame className="size-3" />
                  <span>Boost</span>
                </Button>

                {/* Reset Camera */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setCameraView("chase")}
                  title="Reset view"
                  className="size-7 cursor-pointer rounded-full border border-white/15 bg-black/60 text-white/90 hover:bg-white/15 shadow-sm backdrop-blur-md"
                >
                  <RotateCcw className="size-3" />
                </Button>
              </div>
            </div>

            {/* Real Three.js Canvas */}
            <div className="relative flex-1 size-full min-h-[360px] sm:min-h-[480px]">
              <ThreeScenePreview
                key={`${activeDemo.id}-${wireframe}`}
                preset={activeDemo.id}
                cameraView={cameraView}
                wireframe={wireframe}
                boost={boost}
              />

              {/* Bottom hint overlay */}
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] text-white/70 shadow-xs backdrop-blur-md">
                <span>Drag to orbit camera in 3D</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
