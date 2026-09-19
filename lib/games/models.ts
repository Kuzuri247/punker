import { createGoogle } from "@ai-sdk/google"
import type { LanguageModel } from "ai"

import type { GameModelId } from "./model-catalog"

/**
 * Intercepts Gemini API calls to gracefully handle Google Free-Tier 429 rate limits.
 *
 * The Gemini Free Tier has a strict 20 RPM (requests per minute) limit.
 * During multi-step agent builds (up to 48 steps), 20 steps can execute in ~20 seconds,
 * triggering a temporary RESOURCE_EXHAUSTED quota error.
 *
 * Instead of crashing the turn with AI_RetryError, this wrapper parses Google's exact
 * cooldown instruction (e.g. "Please retry in 25.9s"), sleeps for that duration,
 * and automatically retries the call.
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
 * The configured Google Generative AI provider.
 * Supports both `GEMINI_API_KEY` and standard `GOOGLE_GENERATIVE_AI_API_KEY`.
 */
export const google = createGoogle({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  fetch: rateLimitedFetch,
})

/**
 * The provider instance behind each catalog entry.
 *
 * Server-side only — constructing these reaches for `GEMINI_API_KEY` or
 * `GOOGLE_GENERATIVE_AI_API_KEY`, and the provider SDK has no business in a
 * browser bundle. There is no `server-only` marker enforcing that, though, for
 * the same reason `@/lib/db` keeps its marker in a separate entry: the chat
 * agent imports this module and runs in the Trigger.dev worker, where that
 * marker throws. Reach for the catalog instead of this file from anything a
 * client component can touch.
 *
 * `satisfies` rather than an annotation, so the record has to cover every
 * `GameModelId` — a model added to the catalog and forgotten here is a type
 * error, not an undefined model discovered at the top of someone's turn.
 */
export const gameModels = {
  "gemini-3.8-flash": google("gemini-3.8-flash"),
  "gemini-3.6-flash": google("gemini-3.6-flash"),
  "gemini-3.5-flash-lite": google("gemini-3.5-flash-lite"),
} satisfies Record<GameModelId, LanguageModel>
