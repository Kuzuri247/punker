import { getToolName } from "ai"
import type { DynamicToolUIPart, ToolUIPart } from "ai"

export type FriendlyStepInfo = {
  id: string
  label: string
  activeLabel: string
  completedLabel: string
  isDone: boolean
  isLoading: boolean
  hasError: boolean
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

  const targetPath =
    typeof input.path === "string"
      ? input.path.toLowerCase()
      : typeof input.target === "string"
        ? input.target.toLowerCase()
        : ""

  let activeLabel = "Refining gameplay"
  let completedLabel = "Gameplay refined"

  if (toolName === "qa_inspect") {
    activeLabel = "Verifying 60 FPS performance"
    completedLabel = "60 FPS performance verified"
  } else if (toolName === "list_files") {
    activeLabel = "Analyzing game architecture"
    completedLabel = "Architecture analyzed"
  } else if (
    targetPath.includes("sound") ||
    targetPath.includes("audio") ||
    targetPath.includes("music") ||
    targetPath.includes("sfx")
  ) {
    activeLabel = "Working on sound"
    completedLabel = "Sound & audio synthesized"
  } else if (
    targetPath.includes("index") ||
    targetPath.includes("frame") ||
    targetPath.includes("engine") ||
    targetPath.includes("main") ||
    targetPath.includes("loop") ||
    targetPath.includes("game")
  ) {
    activeLabel = "Working on frame"
    completedLabel = "Game frame constructed"
  } else if (
    targetPath.includes("environment") ||
    targetPath.includes("world") ||
    targetPath.includes("scene") ||
    targetPath.includes("sky") ||
    targetPath.includes("terrain") ||
    targetPath.includes("map") ||
    targetPath.includes("ground")
  ) {
    activeLabel = "Working on environment"
    completedLabel = "3D environment generated"
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
  } else if (toolName === "read_file") {
    activeLabel = "Reviewing game mechanics"
    completedLabel = "Game mechanics reviewed"
  }

  const label = isDone ? completedLabel : activeLabel

  return {
    id: part.toolCallId,
    label,
    activeLabel,
    completedLabel,
    isDone,
    isLoading,
    hasError,
  }
}
