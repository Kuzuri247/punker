import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogle } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"

import { getModelConfig, type GameModelId } from "./model-catalog"

/**
 * Intercepts Gemini API calls to gracefully handle Google Free-Tier 429 rate limits.
 */
async function rateLimitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const maxAttempts = 5

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(input, init)

    if (response.status !== 429) {
      return response
    }

    let waitMs = 30_000 // default 30s cooldown

    try {
      const cloned = response.clone()
      const body = await cloned.text()
      const match = body.match(/retry in ([0-9.]+)s/i)
      if (match && match[1]) {
        waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 1500
      }
      console.warn(
        `[Gemini Quota Notice] Free tier 20 RPM limit reached (attempt ${attempt}/${maxAttempts}). Pausing for ${Math.round(waitMs / 1000)}s to cool down...`
      )
    } catch {
      console.warn(
        `[Gemini Quota Notice] 429 received. Pausing for ${Math.round(waitMs / 1000)}s before retry...`
      )
    }

    if (attempt === maxAttempts) {
      return response
    }

    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  return fetch(input, init)
}

/**
 * Google Generative AI provider instance.
 */
export const google = createGoogle({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  fetch: rateLimitedFetch,
})

/**
 * Anthropic provider instance.
 */
export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * OpenAI provider instance.
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * The baseline model instances for each catalog ID using platform API keys.
 */
export const gameModels = {
  "gemini-3.8-flash": google("gemini-3.8-flash"),
  "gemini-3.6-flash": google("gemini-3.6-flash"),
  "gemini-3.5-flash-lite": google("gemini-3.5-flash-lite"),
  "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-20250219"),
  "claude-3-5-haiku": anthropic("claude-3-5-haiku-20241022"),
  "gpt-4o": openai("gpt-4o"),
  "gpt-4o-mini": openai("gpt-4o-mini"),
} satisfies Record<GameModelId, LanguageModel>

/**
 * Dynamically resolves an LLM provider and model instance.
 * Supports Bring-Your-Own-Key (BYOK) when a custom API key is passed.
 */
export function resolveModel(
  modelId: GameModelId,
  options?: { customApiKey?: string }
): LanguageModel {
  const config = getModelConfig(modelId)

  if (options?.customApiKey) {
    if (config.provider === "anthropic") {
      return createAnthropic({ apiKey: options.customApiKey })(config.modelSlug)
    }
    if (config.provider === "openai") {
      return createOpenAI({ apiKey: options.customApiKey })(config.modelSlug)
    }
    if (config.provider === "google") {
      return createGoogle({ apiKey: options.customApiKey })(config.modelSlug)
    }
  }

  return gameModels[modelId]
}
