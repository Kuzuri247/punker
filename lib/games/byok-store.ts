/**
 * Client storage utility for Bring-Your-Own-Key (BYOK).
 * Persists provider keys in browser localStorage so developers
 * can bypass credit limits and access frontier models without paying out of tier.
 */

export type ModelProvider = "google" | "anthropic" | "openai"

const STORAGE_KEY = "punker_byok_keys"
const CHANGE_EVENT = "punker_byok_changed"

export function getStoredApiKeys(): Record<ModelProvider, string> {
  if (typeof window === "undefined") {
    return { google: "", anthropic: "", openai: "" }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { google: "", anthropic: "", openai: "" }
    const parsed = JSON.parse(raw)
    return {
      google: typeof parsed.google === "string" ? parsed.google : "",
      anthropic: typeof parsed.anthropic === "string" ? parsed.anthropic : "",
      openai: typeof parsed.openai === "string" ? parsed.openai : "",
    }
  } catch {
    return { google: "", anthropic: "", openai: "" }
  }
}

export function getStoredApiKey(provider: ModelProvider): string | undefined {
  const keys = getStoredApiKeys()
  const key = keys[provider]?.trim()
  return key ? key : undefined
}

export function setStoredApiKey(provider: ModelProvider, key: string): void {
  if (typeof window === "undefined") return

  try {
    const current = getStoredApiKeys()
    const updated = { ...current, [provider]: key.trim() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { provider, key } }))
  } catch (err) {
    console.error("Failed to store custom API key:", err)
  }
}

export function clearStoredApiKey(provider: ModelProvider): void {
  setStoredApiKey(provider, "")
}

export function onByokChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}
