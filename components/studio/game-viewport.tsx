"use client";

import React, { useState } from "react";
import {
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RefreshCw,
  Download,
  Code2,
  Layers,
  Terminal,
  Database,
  Bot,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Interactive3DScene } from "@/components/game/interactive-3d-scene";

interface GameViewportProps {
  activeProjectTitle: string;
  gameCode?: string;
  className?: string;
}

export function GameViewport({
  activeProjectTitle,
  gameCode = `// Generated Three.js Game Loop
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Setup platform & hovercraft
const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(5.5, 6, 0.4, 32),
  new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.8 })
);
scene.add(platform);

// Thruster physics & particle loop
function animate() {
  requestAnimationFrame(animate);
  // Hovercraft bobbing & entity rotation
  renderer.render(scene, camera);
}
animate();`,
  className = "",
}: GameViewportProps) {
  const [activeTab, setActiveTab] = useState<"viewport" | "code" | "agent">("viewport");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#080b12] border-l border-border/40 overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 bg-[#080b12]" : ""
      } ${className}`}
    >
      {/* Viewport Header Bar */}
      <div className="h-12 px-3.5 border-b border-border/40 flex items-center justify-between bg-slate-950/70 shrink-0">
        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("viewport")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "viewport"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>3D Canvas</span>
            </button>

            <button
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "code"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Code Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab("agent")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "agent"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inngest Pipeline</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 px-2.5 text-xs border-slate-800 text-slate-300 hover:bg-slate-900"
            title="Copy Game Source Code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400 mr-1" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" /> Export Code
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Tab 1: Interactive 3D Canvas */}
        {activeTab === "viewport" && (
          <div className="w-full h-full p-2.5">
            <Interactive3DScene
              interactive={true}
              showControls={true}
              preset="cyberpunk"
              className="w-full h-full"
            />
          </div>
        )}

        {/* Tab 2: Code Inspector */}
        {activeTab === "code" && (
          <div className="w-full h-full p-4 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/80">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Three.js Compiled Game Loop</span>
              </span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Live Synced
              </span>
            </div>
            <pre className="text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre">
              {gameCode}
            </pre>
          </div>
        )}

        {/* Tab 3: Inngest & Neon Agent Pipeline */}
        {activeTab === "agent" && (
          <div className="w-full h-full p-4 overflow-y-auto text-xs bg-slate-950/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span className="font-semibold text-slate-200">INNGEST AGENT EXECUTION TRACE</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Durable Function: 200 OK
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-mono font-bold text-slate-200 text-[11px]">
                    step.run(&quot;parse-game-specs&quot;)
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Extracted 3D voxel parameters, camera angles, and physics rigidbodies from natural language prompt.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-mono font-bold text-slate-200 text-[11px]">
                    step.run(&quot;synthesize-threejs-geometries&quot;)
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Generated PBR materials, directional key lights, and cyber grid platform meshes.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-mono font-bold text-slate-200 text-[11px]">
                    step.run(&quot;persist-to-neon-postgres&quot;)
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Branch: <code className="text-teal-300">ep-aged-grass-1823</code> • Saved scene checkpoint and player state.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
