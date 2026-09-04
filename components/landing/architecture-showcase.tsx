"use client";

import React, { useState } from "react";
import {
  Layers,
  Cpu,
  Boxes,
  Bot,
  Database,
  ShieldCheck,
  Activity,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Code2,
  Sparkles,
} from "lucide-react";

interface LayerInfo {
  id: string;
  category: string;
  title: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  services: {
    name: string;
    description: string;
    status: string;
  }[];
  role: string;
}

const ARCHITECTURE_LAYERS: LayerInfo[] = [
  {
    id: "app",
    category: "APP",
    title: "Application & Interface Core",
    icon: Cpu,
    color: "from-blue-500 to-cyan-500",
    badge: "Next.js 16 + React 19 + AI SDK",
    role: "High-performance App Router with Turbopack, responsive Gemini-style layout, and streaming LLM responses.",
    services: [
      { name: "Next.js 16", description: "Turbopack server & edge runtime", status: "Active" },
      { name: "React 19", description: "Concurrent features & Server Components", status: "Active" },
      { name: "Vercel AI SDK", description: "Streamed LLM generative game synthesis", status: "Integrated" },
    ],
  },
  {
    id: "games",
    category: "GAMES",
    title: "3D Engines & Generative Meshes",
    icon: Boxes,
    color: "from-amber-500 to-orange-500",
    badge: "Tripo 3D + Three.js / WebGL",
    role: "AI-driven 3D voxel and polygon mesh synthesis, shader compilation, and real-time interactive physics.",
    services: [
      { name: "Tripo 3D", description: "Text-to-3D asset generation neural pipeline", status: "Connected" },
      { name: "Three.js / WebGL", description: "GPU-accelerated in-browser game engine", status: "Active" },
    ],
  },
  {
    id: "agent",
    category: "AGENT",
    title: "Orchestration & Workflow Engine",
    icon: Bot,
    color: "from-emerald-500 to-green-500",
    badge: "Inngest Workflows",
    role: "Durable event-driven AI agents running multi-step game design loops, NPC logic, and automated game balancing.",
    services: [
      { name: "Inngest Agent", description: "Durable stateful AI workflow execution", status: "Live" },
      { name: "Event Bus", description: "Real-time game event triggers and retries", status: "Active" },
    ],
  },
  {
    id: "data",
    category: "DATA",
    title: "Serverless State & Vector Store",
    icon: Database,
    color: "from-emerald-400 to-teal-500",
    badge: "Neon Postgres + Vector DB",
    role: "Instant branching serverless database storing player assets, procedural world seeds, and multiplayer states.",
    services: [
      { name: "Neon Postgres", description: "Serverless SQL database with auto-scaling", status: "Ready" },
      { name: "Vector Search", description: "Semantic search for 3D assets & scripts", status: "Indexed" },
    ],
  },
  {
    id: "auth",
    category: "AUTH & BILLING",
    title: "Authentication & Creator Monetization",
    icon: ShieldCheck,
    color: "from-violet-500 to-indigo-500",
    badge: "Clerk Auth + Stripe Billing",
    role: "Enterprise-grade authentication with biometric passkeys, social logins, and creator subscription tiers.",
    services: [
      { name: "Clerk Auth", description: "Next-gen user auth with instant /chat redirect", status: "Configured" },
      { name: "Billing Engine", description: "Usage credits & creator asset marketplace", status: "Ready" },
    ],
  },
  {
    id: "monitoring",
    category: "MONITORING",
    title: "Observability & Error Tracking",
    icon: Activity,
    color: "from-rose-500 to-pink-500",
    badge: "Sentry Error & Performance Tracing",
    role: "Real-time error capture, WebGL crash monitoring, and distributed tracing across AI agent execution steps.",
    services: [
      { name: "Sentry", description: "Crash reporting, breadcrumbs & telemetry", status: "Active" },
      { name: "Agent Tracing", description: "Step-by-step latency & token tracking", status: "Monitored" },
    ],
  },
  {
    id: "deploying",
    category: "DEPLOYING",
    title: "Continuous Cloud Deployment",
    icon: Rocket,
    color: "from-purple-500 to-sky-500",
    badge: "Railway Cloud Containers",
    role: "Zero-config infrastructure deploying production builds, edge handlers, and backend workers effortlessly.",
    services: [
      { name: "Railway", description: "Automated container builds & edge routing", status: "Ready" },
      { name: "Health Checks", description: "Zero-downtime rolling deployments", status: "Active" },
    ],
  },
];

export function ArchitectureShowcase() {
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo>(ARCHITECTURE_LAYERS[0]);

  return (
    <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 tracking-wide uppercase">
          <Layers className="w-3.5 h-3.5" />
          Full-Stack Platform Architecture
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Built with the Gold Standard Stack
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-3">
          Every layer is engineered to deliver lightning-fast AI game generation, durable agent workflows, and seamless 3D rendering in your browser.
        </p>
      </div>

      {/* Interactive Blueprint Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Blueprint Layers List */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {ARCHITECTURE_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isSelected = selectedLayer.id === layer.id;

            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? "bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10 scale-[1.01]"
                    : "bg-slate-950/50 border-slate-800/70 hover:bg-slate-900/50 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${layer.color} flex items-center justify-center text-black font-bold shadow-md shadow-black/40`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                        {layer.category}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-slate-300 font-medium">
                        {layer.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white mt-0.5">
                      {layer.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isSelected ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-slate-700"
                    }`}
                  />
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? "text-emerald-400 translate-x-0.5" : "text-slate-600 group-hover:text-slate-400"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Layer Deep-Dive Card */}
        <div className="lg:col-span-6 sticky top-24">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient corner light */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  {selectedLayer.category} Layer
                </span>
                <span className="text-xs text-slate-500 font-mono">Architecture Spec</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Production Ready
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-100 mb-2">{selectedLayer.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">{selectedLayer.role}</p>

            <div className="space-y-3 mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Core Stack Components
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedLayer.services.map((svc) => (
                  <div
                    key={svc.name}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{svc.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                        {svc.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      {svc.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code / Config Preview snippet */}
            <div className="rounded-xl bg-black/70 border border-slate-800/80 p-3.5 font-mono text-xs text-slate-300 overflow-x-auto">
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 mb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  Integration Pipeline
                </span>
                <span>{selectedLayer.id}.config.ts</span>
              </div>
              <pre className="text-[11px] text-emerald-300/90 leading-relaxed">
                {selectedLayer.id === "app" &&
                  `import { NextRequest } from 'next/server';\nimport { streamText } from 'ai';\n// Turbopack Edge Runtime enabled`}
                {selectedLayer.id === "games" &&
                  `const renderer = new THREE.WebGLRenderer({ antialias: true });\nconst mesh = await TripoAI.generateMesh(prompt);\nscene.add(mesh);`}
                {selectedLayer.id === "agent" &&
                  `export const gameAgent = inngest.createFunction(\n  { id: "synthesize-game-loop" },\n  { event: "game/generate.requested" },\n  async ({ event, step }) => { /* ... */ }\n);`}
                {selectedLayer.id === "data" &&
                  `import { neon } from '@neondatabase/serverless';\nconst sql = neon(process.env.DATABASE_URL);\nconst games = await sql\`SELECT * FROM games\`;`}
                {selectedLayer.id === "auth" &&
                  `import { clerkMiddleware } from '@clerk/nextjs/server';\n// Protects /chat route while directing landing users`}
                {selectedLayer.id === "monitoring" &&
                  `import * as Sentry from '@sentry/nextjs';\nSentry.captureMessage('Game physics compiled');`}
                {selectedLayer.id === "deploying" &&
                  `# Railway Deployment Profile\nFROM node:20-alpine\nCMD ["npm", "run", "start"]`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
