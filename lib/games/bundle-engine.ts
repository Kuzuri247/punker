import fs from "node:fs/promises"
import path from "node:path"
import * as esbuild from "esbuild"

let cachedEngineMinJs: Uint8Array | null = null
let cachedThreeModule: Uint8Array | null = null

/**
 * Bundles all proprietary engine runtime modules:
 * engine.js, physics.js, sound.js, lighting.js, postfx.js,
 * particles.js, hud.js, controls.js, input.js, animation.js,
 * materials.js, math.js, models.js, state.js, debug.js
 * into a single self-contained punker-engine.min.js ES module.
 */
export async function getBundledEngineScript(): Promise<Uint8Array> {
  if (cachedEngineMinJs) {
    return cachedEngineMinJs
  }

  const engineIndexPath = path.join(
    process.cwd(),
    "lib",
    "games",
    "runtime",
    "engine",
    "index.js"
  )

  try {
    const buildResult = await esbuild.build({
      entryPoints: [engineIndexPath],
      bundle: true,
      external: ["three", "three/*"],
      format: "esm",
      minify: true,
      write: false,
    })

    if (buildResult.outputFiles && buildResult.outputFiles.length > 0) {
      cachedEngineMinJs = buildResult.outputFiles[0].contents
      return cachedEngineMinJs
    }
  } catch (error) {
    console.error("Failed to bundle engine runtime with esbuild:", error)
  }

  // Resilient fallback: read index.js directly if esbuild fails
  const fallback = await fs.readFile(engineIndexPath)
  return new Uint8Array(fallback)
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
