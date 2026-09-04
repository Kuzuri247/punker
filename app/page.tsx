"use client";

import React from "react";
import Link from "next/link";
import {
  Gamepad2,
  Sparkles,
  ArrowRight,
  Layers,
  Bot,
  Database,
  ShieldCheck,
  Zap,
  Play,
  Terminal,
  Cpu,
  Boxes,
  Code2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Interactive3DScene } from "@/components/game/interactive-3d-scene";
import { ArchitectureShowcase } from "@/components/landing/architecture-showcase";
import { GameTemplates } from "@/components/landing/game-templates";
import { NavbarAuthControls, isClerkConfigured } from "@/components/auth/auth-provider";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-foreground selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Ambient Grid & Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-[#07090e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform border border-emerald-400/30">
              <Gamepad2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                PUNKER
              </span>
              <span className="text-[10px] ml-1.5 font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                AI ENGINE
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Engine Features
            </a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">
              Stack Architecture
            </a>
            <a href="#templates" className="hover:text-emerald-400 transition-colors">
              Blueprints
            </a>
            <Link href="/chat" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Chat Studio
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <NavbarAuthControls />

            <Link href="/chat">
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold text-xs h-8 px-3.5 shadow-md shadow-emerald-500/20 rounded-lg cursor-pointer"
              >
                Open Studio <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-12 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 mb-6 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-emerald-400">Next-Gen Engine</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Natural Language to WebGL</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Build 3D & 2D Games at the{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Speed of Thought
                </span>
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                The unified AI game creation platform. Prompt intelligent game agents, synthesize 3D voxel meshes, tune physics shaders, and export playable browser games in real time.
              </p>

              {/* Service Stack Highlights */}
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Next.js 16
                </span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Three.js 3D
                </span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                  Inngest Agent
                </span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-teal-400">
                  Neon DB
                </span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-400">
                  Clerk Auth
                </span>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
                <Link href="/chat" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold h-11 px-6 shadow-xl shadow-emerald-500/20 text-sm rounded-xl cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Launch AI Chat Studio
                  </Button>
                </Link>

                <a href="#architecture" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white h-11 px-5 text-sm rounded-xl"
                  >
                    <Layers className="w-4 h-4 mr-2 text-emerald-400" />
                    View Stack Blueprint
                  </Button>
                </a>
              </div>

              {/* Mini Feature Ticker */}
              <div className="mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 w-full text-left">
                <div>
                  <div className="text-xl font-bold text-white">60 FPS</div>
                  <div className="text-[11px] text-muted-foreground">WebGL In-Browser</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-400">Zero Code</div>
                  <div className="text-[11px] text-muted-foreground">Prompt-to-Physics</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-cyan-400">Durable</div>
                  <div className="text-[11px] text-muted-foreground">Inngest AI Agents</div>
                </div>
              </div>
            </div>

            {/* Right Hero Viewport: Live Interactive 3D Canvas */}
            <div className="lg:col-span-6 w-full h-[440px] sm:h-[480px]">
              <div className="relative w-full h-full rounded-2xl p-1 bg-gradient-to-b from-emerald-500/30 via-slate-800/60 to-cyan-500/20 shadow-2xl shadow-emerald-950/40">
                <Interactive3DScene
                  interactive={true}
                  showControls={true}
                  preset="cyberpunk"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/30">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3 tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" />
              Engine Superpowers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Everything You Need to Ship 3D Games
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">
              From character generation to multiplayer synchronization and background agent workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Generative 3D Meshes & Shaders
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Turn text prompts into high-performance Three.js geometries, custom GLSL vertex/fragment shaders, and voxel assets rendered with real-time lighting.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-900 flex items-center text-xs text-emerald-400 font-medium">
                <span>WebGL & WebGPU Ready</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Durable Inngest AI Agents
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Background agent workflows that design NPC dialogue trees, run physics simulation sanity checks, and balance weapon stats asynchronously without timeouts.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-900 flex items-center text-xs text-cyan-400 font-medium">
                <span>Multi-Step Durable Execution</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Serverless Neon Postgres State
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Store game saves, procedural level seeds, and asset embeddings with instant branching and auto-scaling serverless database performance.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-900 flex items-center text-xs text-indigo-400 font-medium">
                <span>Branching SQL & Vector Storage</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Stack Architecture Section (From Prompt Image) */}
        <div id="architecture">
          <ArchitectureShowcase />
        </div>

        {/* Game Templates Section */}
        <div id="templates">
          <GameTemplates />
        </div>

        {/* Bottom CTA Banner */}
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/30 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Instant Access
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Ready to create your next 3D hit?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                Step into the AI Chat Studio. Prompt your game vision and watch the 3D scene assemble in real time with Next.js and Clerk.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/chat">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold h-11 px-7 rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer text-sm"
                  >
                    Open Studio Now <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>

                <Link href="/sign-up">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800 h-11 px-6 rounded-xl text-sm"
                  >
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-[#06080c] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Gamepad2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-300">Punker AI Game Engine</span>
            <span>• Next.js 16 + Inngest + Neon + Clerk</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">
              Architecture
            </a>
            <Link href="/chat" className="hover:text-emerald-400 transition-colors">
              Chat Studio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
