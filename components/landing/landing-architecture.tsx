"use client"

import {
  Boxes,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react"

const CAPABILITIES = [
  {
    icon: Layers,
    tag: "01 // SCENE GRAPH",
    title: "Declarative Three.js Architecture",
    description:
      "Prompts are mapped directly into hierarchical scene graphs, procedural geometry buffers, PBR materials, and camera rigs. The agent builds games with real structure instead of monolithic scripts.",
    codeSnippet: `// scene-graph.ts
const scene = new THREE.Scene()
const craft = new HoverVehicle({ mass: 120 })
scene.add(craft)
scene.fog = new THREE.FogExp2(0x0a0c10, 0.035)`,
  },
  {
    icon: Workflow,
    tag: "02 // AGENT WORKFLOW",
    title: "Deterministic Multi-File Tooling",
    description:
      "The agent reads, writes, and replaces code across discrete modular files (scene.ts, controls.ts, entities.ts). Edits are atomic, diffed, and validated before runtime execution.",
    codeSnippet: `✓ Read src/controls.ts
✓ Edited src/player.ts (line 42-58)
✓ Wrote src/shaders/neon-bloom.glsl
✓ Verified WebGL2 pipeline`,
  },
  {
    icon: ShieldAlert,
    tag: "03 // RUNTIME DIAGNOSTICS",
    title: "Self-Healing WebGL Sandboxes",
    description:
      "Each game runs in an isolated container. If a shader compilation fails or a physics loop throws an unhandled exception, postMessage intercepts the call stack and dispatches an automatic repair turn.",
    codeSnippet: `[RUNTIME WARNING] WebGL: Shader compile error at L34
→ Intercepting call stack
→ Auto-dispatching repair turn to agent
✓ Shader patched: Uniform vec3 resolution fixed`,
  },
  {
    icon: Cpu,
    tag: "04 // FRONTIER INTELLIGENCE",
    title: "Hybrid Reasoning & BYOK",
    description:
      "Orchestrate builds across Claude 3.7 Sonnet with extended thinking, Gemini 2.5 Flash, and GPT-4o. Bring your own API keys or draw from organization credit ledger.",
    codeSnippet: `Model: claude-3-7-sonnet
Mode: hybrid-reasoning (budget: 4k tokens)
Context: 200k tokens
BYOK: Active (zero markup)`,
  },
]

export function LandingArchitecture() {
  return (
    <section className="mx-auto w-full max-w-6xl py-12 sm:py-16">
      {/* Section Header */}
      <div className="mb-10 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Wrench className="size-3 text-cyan-500" />
          <span>Platform Architecture</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
          Engineered for autonomous 3D development
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto font-normal">
          How Punker translates natural language intent into playable Three.js experiences.
        </p>
      </div>

      {/* Grid of 4 architectural inspect panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon
          return (
            <div
              key={cap.tag}
              className="flex flex-col justify-between rounded-2xl border border-border/80 dark:border-white/10 bg-card/70 dark:bg-[#18191a]/80 p-5 sm:p-6 shadow-sm hover:border-border transition-colors backdrop-blur-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 dark:border-white/10 bg-secondary/50 dark:bg-white/5">
                    <Icon className="size-4 text-foreground/80" />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                    {cap.tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-heading text-base font-medium text-foreground tracking-tight">
                    {cap.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground font-normal">
                    {cap.description}
                  </p>
                </div>
              </div>

              {/* Code / Diagnostic Terminal Box */}
              <div className="mt-4 rounded-xl border border-border/50 dark:border-white/5 bg-background/90 dark:bg-[#111213] p-3 font-mono text-[11px] text-muted-foreground/90 whitespace-pre leading-relaxed overflow-x-auto">
                {cap.codeSnippet}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
