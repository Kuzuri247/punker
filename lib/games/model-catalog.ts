/**
 * The models a game can be built with, in the order a picker should offer them.
 *
 * Client-safe on purpose: ids and copy, and nothing that talks to Google / Gemini.
 * The provider instances live in `./models`, which pulls in the provider SDK
 * and reads the API key — so a component that only needs to *name* a model
 * never drags either of those into the browser bundle.
 *
 * The ids are Gemini's own model ids rather than slugs of our own. There is
 * one provider behind all three and no versioning story to hide, so a second
 * name for each would only be a mapping to keep in step.
 */
export const GAME_MODELS = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tagline: "The most capable builder — best for a game from scratch.",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    tagline: "Most of the ability, a good deal faster. Good for iterating.",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    tagline: "The quickest and cheapest — best for small, specific tweaks.",
  },
] as const

/**
 * The id of a model this app offers.
 *
 * Derived from the catalog rather than written out again, so the union and the
 * list a player sees cannot drift: adding an entry above is the whole of adding
 * a model, and every exhaustive switch on this type reports what is missing.
 */
export type GameModelId = (typeof GAME_MODELS)[number]["id"]

/**
 * What a turn runs on when nothing picked otherwise.
 *
 * Every turn today, since nothing sends a choice yet — so this is the model the
 * app actually uses, not a fallback that rarely fires.
 */
export const DEFAULT_GAME_MODEL_ID: GameModelId = "gemini-3.8-flash"

/**
 * Whether a value names a model this app offers.
 *
 * A guard rather than a bare comparison, because the places that need it take
 * the id from somewhere the app doesn't control — a URL, a server action's
 * arguments — and want the narrowed type on the other side of the check.
 */
export function isGameModelId(value: unknown): value is GameModelId {
  return GAME_MODELS.some((model) => model.id === value)
}
