"use client";

import React from "react";
import Link from "next/link";
import { Gamepad2, ArrowRight, Sparkles, Play, Flame, Zap, Compass, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameTemplate {
  id: string;
  title: string;
  genre: string;
  description: string;
  badge: string;
  engine: string;
  initialPrompt: string;
  color: string;
}

const TEMPLATES: GameTemplate[] = [
  {
    id: "cyber-glider",
    title: "Cyber Glider 3D",
    genre: "Sci-Fi Endless Runner",
    description: "High-speed hovercraft navigation through procedural neon obstacles with real-time particle thrusters.",
    badge: "Trending",
    engine: "Three.js + Shaders",
    initialPrompt: "Create a 3D cyberpunk hovercraft runner with procedural neon barriers, speed boosts, and particle trails",
    color: "from-emerald-500/20 to-cyan-500/10 border-emerald-500/30",
  },
  {
    id: "neon-dungeon",
    title: "Neon Dungeon Crawler",
    genre: "Isometric Roguelike",
    description: "Procedural labyrinth generator with A* pathfinding enemies, loot tables, and dynamic torch lighting.",
    badge: "Procedural",
    engine: "Three.js + Inngest",
    initialPrompt: "Build an isometric dungeon crawler with procedural room layouts, enemy AI patrol state machine, and loot chests",
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
  },
  {
    id: "voxel-arena",
    title: "Voxel Arena Brawl",
    genre: "Physics Sandbox",
    description: "Destructible block arena featuring gravity physics, projectile trajectory prediction, and powerups.",
    badge: "Physics 3D",
    engine: "WebGL + Cannon.js",
    initialPrompt: "Generate a voxel combat arena where players shoot energy orbs to shatter destructible cubic columns",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
  },
  {
    id: "space-fleet",
    title: "Zero-G Starfighter",
    genre: "Space Simulator",
    description: "Orbital dogfights with 6-DOF Newtonian flight mechanics, asteroid belt collision, and plasma lasers.",
    badge: "6-DOF Flight",
    engine: "Three.js Engine",
    initialPrompt: "Design a zero-gravity space dogfight game with 6 degrees of freedom, asteroid field, and laser turrets",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
  },
];

export function GameTemplates() {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/30">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3 tracking-wide uppercase">
            <Gamepad2 className="w-3.5 h-3.5" />
            Launchable Game Blueprints
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Start from Proven Game Templates
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Click any template to pre-load its prompt and 3D specifications directly into the AI Chat Studio.
          </p>
        </div>

        <Link href="/chat">
          <Button
            variant="outline"
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs h-9"
          >
            Open Blank Studio <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className={`group rounded-2xl p-5 border bg-gradient-to-b ${tmpl.color} bg-slate-950/70 backdrop-blur-md flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 shadow-xl`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300">
                  {tmpl.genre}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {tmpl.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-2">
                {tmpl.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {tmpl.description}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-3 border-t border-slate-800/80 pt-2.5">
                <span>Engine:</span>
                <span className="text-slate-300">{tmpl.engine}</span>
              </div>

              <Link href={`/chat?prompt=${encodeURIComponent(tmpl.initialPrompt)}`}>
                <Button
                  size="sm"
                  className="w-full bg-slate-900/90 hover:bg-emerald-500 hover:text-black border border-slate-700/80 hover:border-emerald-400 text-slate-200 text-xs font-semibold transition-all h-8"
                >
                  <Play className="w-3 h-3 mr-1 fill-current" />
                  Generate in Studio
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
