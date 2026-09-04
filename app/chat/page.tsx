"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudioSidebar, GameProject } from "@/components/studio/studio-sidebar";
import { ChatInterface, ChatMessage } from "@/components/studio/chat-interface";
import { GameViewport } from "@/components/studio/game-viewport";

const INITIAL_PROJECTS: GameProject[] = [
  {
    id: "proj-1",
    title: "Cyber Glider 3D",
    genre: "Endless Runner",
    engine: "Three.js WebGL",
    updatedAt: "Just now",
    messagesCount: 3,
  },
  {
    id: "proj-2",
    title: "Neon Dungeon Crawler",
    genre: "Isometric Roguelike",
    engine: "Three.js + Inngest",
    updatedAt: "2h ago",
    messagesCount: 5,
  },
  {
    id: "proj-3",
    title: "Voxel Combat Arena",
    genre: "Physics Sandbox",
    engine: "Cannon.js + WebGL",
    updatedAt: "Yesterday",
    messagesCount: 8,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "proj-1": [
    {
      id: "msg-1",
      sender: "user",
      content: "Build a 3D cyberpunk hovercraft runner with neon obstacles, particle thrusters, and procedural platform bobbing.",
      timestamp: "10:24 AM",
    },
    {
      id: "msg-2",
      sender: "assistant",
      content:
        "I've initialized the **Cyber Glider 3D** world! The scene features a central hovercraft chassis equipped with dual energy thrusters, an orbiting voxel obstacle field, and a 60 FPS WebGL game loop. You can drag in the 3D viewport to orbit and test out wireframe mode or spawn new voxels.",
      thoughtProcess: [
        "Inngest Agent: Dispatched event 'game/runner.init'",
        "Tripo AI: Synthesized low-poly aerodynamic hovercraft chassis",
        "Three.js: Configured PerspectiveCamera(45), AmbientLight(0.4), DirectionalKeyLight(1.8)",
        "Particle System: Instantiated 70-point floating cyber spark cloud",
        "Neon DB: Stored level seed 'cyber-run-9284' in serverless Postgres",
      ],
      codeSnippet: `// Cyber Glider Game Loop & Hover Physics
import * as THREE from 'three';

const hero = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.4, 2.4),
  new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
);
hero.add(body);

// Particle Thrusters
const thruster = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.12, 0.6, 16),
  new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
);
hero.add(thruster);

function gameLoop(time) {
  hero.position.y = 1.4 + Math.sin(time * 2.5) * 0.15;
  hero.rotation.z = Math.sin(time * 1.5) * 0.04;
  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}`,
      timestamp: "10:25 AM",
    },
  ],
  "proj-2": [
    {
      id: "msg-p2-1",
      sender: "user",
      content: "Generate an isometric dungeon crawler with procedural room layout.",
      timestamp: "8:10 AM",
    },
    {
      id: "msg-p2-2",
      sender: "assistant",
      content:
        "Created an isometric dungeon crawler prototype with an A* pathfinding enemy state machine, torchlight falloffs, and loot tile markers.",
      thoughtProcess: [
        "Inngest Agent: Queued procedural BSP room partitioner",
        "Tilemap Generator: Generated 16x16 dungeon grid with corridors",
        "Lighting: PointLight with flicker noise for torch atmosphere",
      ],
      timestamp: "8:11 AM",
    },
  ],
};

function ChatStudioContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<GameProject[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>("proj-1");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [viewMode, setViewMode] = useState<"split" | "chat" | "canvas">("split");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check query params for initial prompt from templates
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      handleSendMessage(promptParam);
    }
  }, [searchParams]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activeMessages = messagesMap[activeProjectId] || [];

  const handleNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProj: GameProject = {
      id: newId,
      title: "New 3D Game",
      genre: "Sandbox",
      engine: "Three.js WebGL",
      updatedAt: "Just now",
      messagesCount: 0,
    };
    setProjects([newProj, ...projects]);
    setActiveProjectId(newId);
    setMessagesMap((prev) => ({ ...prev, [newId]: [] }));
  };

  const handleSendMessage = (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] || []), userMsg],
    }));

    setIsGenerating(true);

    // Simulate multi-step AI Agent compilation (Inngest + Three.js)
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        content: `I've updated the game simulation for **"${content.slice(0, 40)}..."**! Added responsive physics bindings, updated the particle velocity curves, and persisted the world state to Neon Postgres. Test the updated mechanics in the 3D viewport on the right.`,
        thoughtProcess: [
          `Inngest Workflow: 'agent.game-synthesis' triggered for ${activeProject.title}`,
          "Parsed gameplay mechanics: Rigid body gravity & collider meshes",
          "Generated custom GLSL vertex shader for dynamic hover trails",
          "Synchronized world state seed to Neon Serverless Database",
        ],
        codeSnippet: `// Live Updated Simulation Hook
const entity = new THREE.Mesh(
  new THREE.DodecahedronGeometry(0.5),
  new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2, metalness: 0.8 })
);
entity.position.set(Math.random() * 4 - 2, 2.0, Math.random() * 4 - 2);
scene.add(entity);

// Physics step
function updatePhysics(delta) {
  entity.rotation.y += delta * 1.5;
  entity.position.y = 1.0 + Math.abs(Math.sin(Date.now() * 0.003)) * 1.2;
}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeProjectId]: [...(prev[activeProjectId] || []), assistantMsg],
      }));
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#07090e] text-foreground">
      {/* Sidebar */}
      <StudioSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => setActiveProjectId(id)}
        onNewProject={handleNewProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Central Chat Interface */}
        {(viewMode === "split" || viewMode === "chat") && (
          <div
            className={`h-full flex flex-col transition-all ${
              viewMode === "split" ? "w-full lg:w-[50%] xl:w-[45%]" : "w-full"
            }`}
          >
            <ChatInterface
              messages={activeMessages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              projectTitle={activeProject.title}
              viewMode={viewMode}
              onSetViewMode={setViewMode}
            />
          </div>
        )}

        {/* Live Game Viewport Pane */}
        {(viewMode === "split" || viewMode === "canvas") && (
          <div
            className={`h-full flex flex-col transition-all ${
              viewMode === "split" ? "hidden lg:flex lg:w-[50%] xl:w-[55%]" : "w-full"
            }`}
          >
            <GameViewport
              activeProjectTitle={activeProject.title}
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#07090e] flex items-center justify-center text-emerald-400 font-mono text-sm">
          Loading AI Game Studio...
        </div>
      }
    >
      <ChatStudioContent />
    </Suspense>
  );
}
