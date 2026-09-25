/**
 * The models a game can be built with, in the order a picker should offer them.
 * Client-safe: metadata, IDs, provider identifiers, and tier restrictions.
 */

export interface GameModelConfig {
  id: string
  name: string
  provider: "google" | "anthropic" | "openai"
  modelSlug: string
  tagline: string
  tier: "free" | "pro" | "studio"
}

export const GAME_MODELS = [
  // Google Gemini Models (Baseline Free & Ultra-Fast)
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    modelSlug: "gemini-3.8-flash",
    tagline: "The most capable Gemini builder — best for starting a game from scratch.",
    tier: "free",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "google",
    modelSlug: "gemini-3.6-flash",
    tagline: "High capability, rapid response speed. Good for fast iterations.",
    tier: "free",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    provider: "google",
    modelSlug: "gemini-3.5-flash-lite",
    tagline: "Quickest and cheapest — best for small, targeted tweaks.",
    tier: "free",
  },

  // Anthropic Claude Models (Premier Architecture & Logic)
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    modelSlug: "claude-3-7-sonnet-20250219",
    tagline: "Frontier hybrid reasoning and deep 3D game architecture powerhouse.",
    tier: "pro",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    modelSlug: "claude-3-5-haiku-20241022",
    tagline: "Sub-second speed with great code generation quality.",
    tier: "free",
  },

  // OpenAI Models (Broad Generalization & Precision)
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    modelSlug: "gpt-4o",
    tagline: "Flagship versatile OpenAI model for complex gameplay mechanics.",
    tier: "pro",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    modelSlug: "gpt-4o-mini",
    tagline: "Fast and lightweight for small adjustments and game tuning.",
    tier: "free",
  },
] as const

export type GameModelId = (typeof GAME_MODELS)[number]["id"]

export const DEFAULT_GAME_MODEL_ID: GameModelId = "gemini-3.8-flash"

export function isGameModelId(value: unknown): value is GameModelId {
  return GAME_MODELS.some((model) => model.id === value)
}

export function getModelConfig(modelId: GameModelId) {
  return GAME_MODELS.find((model) => model.id === modelId) ?? GAME_MODELS[0]
}
