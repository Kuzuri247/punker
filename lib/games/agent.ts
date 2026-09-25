import type { GameModelId } from "./model-catalog"
import { resolveModel } from "./models"

/**
 * The per-model half of a turn's `streamText` call.
 * Spread into `streamText` alongside instructions and tools.
 * Resolves the appropriate model instance (supporting BYOK when provided).
 */
export function gameModelSettings(
  modelId: GameModelId,
  options?: { customApiKey?: string }
) {
  return { model: resolveModel(modelId, options) }
}
