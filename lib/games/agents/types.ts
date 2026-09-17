/**
 * The specialized agent roles that collaborate to build a game in Punker.
 */
export const AGENT_ROLES = [
  "architect",
  "engineer",
  "artist",
  "audio",
  "qa",
] as const

export type AgentRole = (typeof AGENT_ROLES)[number]

export interface AgentDescriptor {
  role: AgentRole
  name: string
  title: string
  description: string
  color: string
}

export const AGENT_DESCRIPTORS: Record<AgentRole, AgentDescriptor> = {
  architect: {
    role: "architect",
    name: "Aria",
    title: "Lead Game Architect & Director",
    description:
      "Designs overall game mechanics, progression, player input loops, and coordinates the specialist team.",
    color: "#6366f1", // Indigo
  },
  engineer: {
    role: "engineer",
    name: "Rex",
    title: "Core Gameplay & Three.js Engineer",
    description:
      "Implements game physics, animation loops, state machines, collisions, camera controls, and entity lifecycles.",
    color: "#0ea5e9", // Sky blue
  },
  artist: {
    role: "artist",
    name: "Nova",
    title: "Visual, Shader & Level Designer",
    description:
      "Crafts lighting rigs, procedural textures, GLSL shaders, skyboxes, particle systems, and aesthetic palettes.",
    color: "#ec4899", // Pink
  },
  audio: {
    role: "audio",
    name: "Echo",
    title: "Audio & Juice Designer",
    description:
      "Synthesizes procedural sound effects and background ambience using the Web Audio API; crafts screen shakes and visual juice.",
    color: "#f59e0b", // Amber
  },
  qa: {
    role: "qa",
    name: "Vigil",
    title: "QA Playtester & Sandbox Inspector",
    description:
      "Validates code integrity, detects runtime exceptions, verifies 60 FPS performance thresholds, and reports bugs.",
    color: "#10b981", // Emerald
  },
}
