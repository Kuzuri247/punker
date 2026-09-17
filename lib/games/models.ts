import { createGoogle } from "@ai-sdk/google"
import type { LanguageModel } from "ai"

import type { GameModelId } from "./model-catalog"

/**
 * The configured Google Generative AI provider.
 * Supports both `GEMINI_API_KEY` and standard `GOOGLE_GENERATIVE_AI_API_KEY`.
 */
export const google = createGoogle({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
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
