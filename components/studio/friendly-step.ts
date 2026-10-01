import { getToolName } from "ai"
import type { DynamicToolUIPart, ToolUIPart } from "ai"

export type FriendlyStepInfo = {
  id: string
  label: string
  activeLabel: string
  completedLabel: string
  targetFile?: string
  toolName: string
  isDone: boolean
  isLoading: boolean
  hasError: boolean
  iconKind: "js" | "css" | "html" | "audio" | "inspect" | "scene" | "search" | "code"
  category: string
}

/**
 * Translates low-level file manipulations and tool calls into human-friendly,
 * natural studio activities (e.g. "Working on frame", "Working on sound").
 *
 * Avoids leaking raw filenames (game.js, hud.js, index.html) to the player.
 */
export function getFriendlyStepInfo(
  part: ToolUIPart | DynamicToolUIPart
): FriendlyStepInfo {
  const toolName = getToolName(part)
  const isDone = part.state === "output-available"
  const isLoading =
    part.state === "input-streaming" ||
    part.state === "input-available" ||
    part.state === "approval-requested"
  const hasError =
    part.state === "output-error" ||
    part.state === "output-denied"

  const input =
    typeof part.input === "object" && part.input !== null
      ? (part.input as Record<string, unknown>)
      : {}

  const rawPath =
    typeof input.path === "string"
      ? input.path
      : typeof input.target === "string"
        ? input.target
        : ""
  const targetPath = rawPath.toLowerCase()
  const targetFile = rawPath ? rawPath.split("/").pop() || rawPath : undefined

  let activeLabel = "Refining gameplay"
  let completedLabel = "Gameplay refined"
  let category = "Editing game code"
  let iconKind: FriendlyStepInfo["iconKind"] = "code"

  if (toolName === "qa_inspect") {
    activeLabel = "Verifying 60 FPS performance"
    completedLabel = "60 FPS performance verified"
    category = "Running diagnostics"
    iconKind = "inspect"
  } else if (toolName === "list_files") {
    activeLabel = "Analyzing game architecture"
    completedLabel = "Architecture analyzed"
    category = "Analyzing project"
    iconKind = "search"
  } else if (
    targetPath.includes("sound") ||
    targetPath.includes("audio") ||
    targetPath.includes("music") ||
    targetPath.includes("sfx") ||
    targetPath.endsWith(".mp3") ||
    targetPath.endsWith(".wav") ||
    targetPath.endsWith(".ogg")
  ) {
    activeLabel = "Working on sound"
    completedLabel = "Sound & audio synthesized"
    category = "Synthesizing audio"
    iconKind = "audio"
  } else if (targetPath.endsWith(".css")) {
    activeLabel = "Styling game interface"
    completedLabel = "Game styles updated"
    category = "Styling interface"
    iconKind = "css"
  } else if (targetPath.endsWith(".html") || targetPath.endsWith(".htm")) {
    activeLabel = "Updating HTML structure"
    completedLabel = "HTML structure configured"
    category = "Configuring runtime"
    iconKind = "html"
  } else if (
    targetPath.includes("environment") ||
    targetPath.includes("world") ||
    targetPath.includes("scene") ||
    targetPath.includes("sky") ||
    targetPath.includes("terrain") ||
    targetPath.includes("map") ||
    targetPath.includes("ground") ||
    targetPath.endsWith(".gltf") ||
    targetPath.endsWith(".glb")
  ) {
    activeLabel = "Working on environment"
    completedLabel = "3D environment generated"
    category = "Building environment"
    iconKind = "scene"
  } else if (
    targetPath.includes("player") ||
    targetPath.includes("character") ||
    targetPath.includes("controller") ||
    targetPath.includes("input") ||
    targetPath.includes("movement") ||
    targetPath.includes("camera")
  ) {
    activeLabel = "Tuning player controls"
    completedLabel = "Player controls configured"
    category = "Configuring controls"
    iconKind = "js"
  } else if (
    targetPath.includes("hud") ||
    targetPath.includes("ui") ||
    targetPath.includes("score") ||
    targetPath.includes("menu") ||
    targetPath.includes("overlay") ||
    targetPath.includes("health")
  ) {
    activeLabel = "Designing interface & HUD"
    completedLabel = "Interface & HUD ready"
    category = "Designing UI & HUD"
    iconKind = "js"
  } else if (
    targetPath.includes("enemy") ||
    targetPath.includes("boss") ||
    targetPath.includes("obstacle") ||
    targetPath.includes("hazard") ||
    targetPath.includes("ai") ||
    targetPath.includes("physics") ||
    targetPath.includes("collision")
  ) {
    activeLabel = "Creating challenges & physics"
    completedLabel = "Challenges & physics created"
    category = "Simulating physics"
    iconKind = "js"
  } else if (
    targetPath.includes("particle") ||
    targetPath.includes("light") ||
    targetPath.includes("shadow") ||
    targetPath.includes("shader") ||
    targetPath.includes("effect") ||
    targetPath.includes("juice")
  ) {
    activeLabel = "Crafting visual effects & lighting"
    completedLabel = "Visual effects & lighting crafted"
    category = "Rendering effects"
    iconKind = "js"
  } else if (toolName === "read_file") {
    activeLabel = "Reviewing game mechanics"
    completedLabel = "Game mechanics reviewed"
    category = "Reviewing mechanics"
    iconKind = "search"
  } else if (targetPath.endsWith(".js") || targetPath.endsWith(".ts")) {
    iconKind = "js"
  }

  const label = isDone ? completedLabel : activeLabel

  return {
    id: part.toolCallId,
    label,
    activeLabel,
    completedLabel,
    targetFile,
    toolName,
    isDone,
    isLoading,
    hasError,
    iconKind,
    category,
  }
}
