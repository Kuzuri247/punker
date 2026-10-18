import fs from "node:fs/promises"
import path from "node:path"

let cachedEngineMinJs: Uint8Array | null = null
let cachedThreeModule: Uint8Array | null = null

/**
 * Retrieves the bundled proprietary engine runtime module (punker-engine.min.js),
 * which consolidates engine.js, physics.js, sound.js, lighting.js, postfx.js,
 * particles.js, hud.js, controls.js, input.js, animation.js, materials.js,
 * math.js, models.js, state.js, and debug.js into a single standalone ES module.
 */
export async function getBundledEngineScript(): Promise<Uint8Array> {
  if (cachedEngineMinJs) {
    return cachedEngineMinJs
  }

  const bundledPath = path.join(
    process.cwd(),
    "lib",
    "games",
    "runtime",
    "punker-engine.min.js"
  )

  try {
    const content = await fs.readFile(bundledPath)
    cachedEngineMinJs = new Uint8Array(content)
    return cachedEngineMinJs
  } catch (error) {
    console.warn(
      "Pre-bundled punker-engine.min.js not found on disk, reading index.js fallback:",
      error instanceof Error ? error.message : String(error)
    )
  }

  // Resilient fallback: read index.js directly if bundle file is missing
  const engineIndexPath = path.join(
    process.cwd(),
    "lib",
    "games",
    "runtime",
    "engine",
    "index.js"
  )
  const fallback = await fs.readFile(engineIndexPath)
  cachedEngineMinJs = new Uint8Array(fallback)
  return cachedEngineMinJs
}

/**
 * Reads and caches the offline three.module.js distribution
 * to eliminate external CDN dependencies in standalone exports.
 */
export async function getOfflineThreeScript(): Promise<Uint8Array> {
  if (cachedThreeModule) {
    return cachedThreeModule
  }

  const threePath = path.join(
    process.cwd(),
    "node_modules",
    "three",
    "build",
    "three.module.js"
  )

  const content = await fs.readFile(threePath)
  cachedThreeModule = new Uint8Array(content)
  return cachedThreeModule
}

/**
 * Reads all files from lib/games/runtime/engine/ into memory
 * to provide full offline relative resolution for exports.
 */
export async function getAllEngineFiles(): Promise<
  Array<{ relativePath: string; content: Uint8Array }>
> {
  const engineDir = path.join(process.cwd(), "lib", "games", "runtime", "engine")
  const results: Array<{ relativePath: string; content: Uint8Array }> = []

  try {
    const entries = await fs.readdir(engineDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".json"))) {
        const filePath = path.join(engineDir, entry.name)
        const content = await fs.readFile(filePath)
        results.push({
          relativePath: `engine/${entry.name}`,
          content: new Uint8Array(content),
        })
      }
    }
  } catch (error) {
    console.error("Failed to read all engine files:", error)
  }

  return results
}
