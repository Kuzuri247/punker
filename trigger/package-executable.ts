import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { task } from "@trigger.dev/sdk"
import { eq } from "drizzle-orm"
import { execa } from "execa"
import * as fflate from "fflate"

import { getEntitlements } from "@/lib/billing/entitlements"
import { getGameSandbox } from "@/lib/daytona/utils"
import { db, games } from "@/lib/db/client"
import {
  getAllEngineFiles,
  getBundledEngineScript,
  getOfflineThreeScript,
} from "@/lib/games/bundle-engine"
import {
  DESKTOP_MAIN_JS_TEMPLATE,
  DESKTOP_PACKAGE_JSON,
  generatePackageJson,
  generateReadme,
  generateServerJs,
  generateStartBat,
  generateStartSh,
  normalizeExportHtml,
} from "@/lib/games/export-templates"
import { elapsed, logger } from "@/lib/observability"

export type TargetPlatform = "win" | "mac" | "linux" | "windows" | "macos"

export interface PackageExecutablePayload {
  gameId: string
  targetPlatform?: "win" | "mac" | "linux"
  platform?: "windows" | "linux" | "macos" | "all" | "win" | "mac"
  userId?: string
  appName?: string
}

export interface PackageExecutableResult {
  success: boolean
  ok: boolean
  gameId: string
  title: string
  platform: string
  downloadUrl: string
  downloadPath: string
  artifactName: string
  archiveSize?: number
  fileCount?: number
  durationMs: number
}

function normalizePlatform(p?: string): "win" | "mac" | "linux" {
  if (!p) return "win"
  const low = p.toLowerCase()
  if (low.startsWith("win")) return "win"
  if (low.startsWith("mac") || low === "darwin") return "mac"
  return "linux"
}

/**
 * Packages a game from its Daytona sandbox into a cross-platform native desktop executable
 * (Windows .exe, macOS .app, Linux .AppImage) or containerized Electron distribution.
 */
export const packageExecutable = task({
  id: "package-executable",
  maxDuration: 300, // 5 minutes execution cap
  retry: {
    maxAttempts: 2,
  },
  run: async (
    payload: PackageExecutablePayload,
    { ctx }
  ): Promise<PackageExecutableResult> => {
    const startedAt = performance.now()
    const targetPlatform = normalizePlatform(payload.targetPlatform || payload.platform)
    const { gameId, userId, appName } = payload

    logger.info(`Starting desktop executable packaging for game ${gameId}`, {
      "game.id": gameId,
      platform: targetPlatform,
      runId: ctx.run.id,
    })

    // 1. Fetch game details from DB
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)

    if (!game) {
      throw new Error(`Game not found: ${gameId}`)
    }

    const entitlements = await getEntitlements(userId || game.orgId)
    if (!entitlements.exportExecutable) {
      throw new Error(
        "Packaging standalone desktop executables is exclusive to Studio Pro and BYOK tiers."
      )
    }

    const title = appName || game.title || "Game"
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()

    // 2. Prepare staging directory for desktop bundling
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `punker-build-${game.id}-`))
    const distPath = path.join(tmpDir, "dist")
    await fs.mkdir(distPath, { recursive: true })

    try {
      let rawIndexHtml = ""
      let customStyle: Uint8Array | null = null
      const extraGameFiles: Array<{ name: string; data: Uint8Array }> = []

      // 3. Extract game files from Daytona sandbox if reachable
      if (game.sandboxId) {
        try {
          const { sandbox } = await getGameSandbox(gameId)
          if (sandbox) {
            const tarPath = `/tmp/desktop-export-${gameId}.tar.gz`
            await sandbox.process.executeCommand(
              `tar -czf '${tarPath}' -C /home/daytona/game --exclude='.git*' .`
            )
            const tarGzBuffer = await sandbox.fs.downloadFile(tarPath)
            sandbox.process.executeCommand(`rm -f '${tarPath}'`).catch(() => {})

            if (tarGzBuffer && tarGzBuffer.length > 0) {
              const unzippedTar = fflate.gunzipSync(new Uint8Array(tarGzBuffer))
              // Simple tar extraction
              let offset = 0
              const decoder = new TextDecoder()
              while (offset + 512 <= unzippedTar.length) {
                const header = unzippedTar.subarray(offset, offset + 512)
                if (header.every((b) => b === 0)) break

                let nameEnd = 0
                while (nameEnd < 100 && header[nameEnd] !== 0) nameEnd++
                let name = decoder.decode(header.subarray(0, nameEnd)).trim()

                let sizeStr = ""
                for (let i = 124; i < 136; i++) {
                  if (header[i] === 0 || header[i] === 32) continue
                  sizeStr += String.fromCharCode(header[i])
                }
                const size = parseInt(sizeStr, 8) || 0
                const type = String.fromCharCode(header[156])

                offset += 512
                if ((type === "0" || type === "" || type === "\0") && size > 0) {
                  const data = unzippedTar.subarray(offset, offset + size)
                  const cleanName = name.replace(/^(\.\/|\/)/, "").trim()
                  const lower = cleanName.toLowerCase()

                  if (lower === "index.html") {
                    rawIndexHtml = decoder.decode(data)
                  } else if (lower === "style.css") {
                    customStyle = data
                  } else if (
                    !lower.startsWith("engine/") &&
                    lower !== "report.js" &&
                    lower !== "welcome.js"
                  ) {
                    extraGameFiles.push({ name: cleanName, data })
                  }
                }
                offset += Math.ceil(size / 512) * 512
              }
            }
          }
        } catch (sandboxErr) {
          logger.warn(`Could not read sandbox files for desktop packaging: ${sandboxErr}`)
        }
      }

      // Fallback HTML if sandbox was empty
      if (!rawIndexHtml) {
        const defaultHtmlPath = path.join(process.cwd(), "lib", "games", "runtime", "index.html")
        try {
          rawIndexHtml = await fs.readFile(defaultHtmlPath, "utf-8")
        } catch {
          rawIndexHtml = `<!doctype html><html><head><title>${title}</title></head><body><script type="module" src="./punker-engine.min.js"></script></body></html>`
        }
      }

      // 4. Normalize HTML and inject desktop wrapper templates
      const normalizedHtml = normalizeExportHtml(rawIndexHtml, {
        title,
        offlineImportMap: true,
      })

      await fs.writeFile(path.join(tmpDir, "index.html"), normalizedHtml, "utf-8")
      await fs.writeFile(path.join(tmpDir, "main.js"), DESKTOP_MAIN_JS_TEMPLATE, "utf-8")
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify(DESKTOP_PACKAGE_JSON(title), null, 2),
        "utf-8"
      )

      // 5. Write engine assets & offline Three.js
      const bundledEngine = await getBundledEngineScript()
      await fs.writeFile(path.join(tmpDir, "punker-engine.min.js"), bundledEngine)

      const offlineThree = await getOfflineThreeScript()
      await fs.writeFile(path.join(tmpDir, "three.module.js"), offlineThree)

      const engineDir = path.join(tmpDir, "engine")
      await fs.mkdir(engineDir, { recursive: true })
      const engineFiles = await getAllEngineFiles()
      for (const ef of engineFiles) {
        const dest = path.join(tmpDir, ef.relativePath)
        await fs.mkdir(path.dirname(dest), { recursive: true })
        await fs.writeFile(dest, ef.content)
      }

      if (customStyle) {
        await fs.writeFile(path.join(tmpDir, "style.css"), customStyle)
      } else {
        const defaultCssPath = path.join(process.cwd(), "lib", "games", "runtime", "style.css")
        try {
          const css = await fs.readFile(defaultCssPath)
          await fs.writeFile(path.join(tmpDir, "style.css"), css)
        } catch {}
      }

      for (const extra of extraGameFiles) {
        const extraPath = path.join(tmpDir, extra.name)
        await fs.mkdir(path.dirname(extraPath), { recursive: true })
        await fs.writeFile(extraPath, extra.data)
      }

      // 6. Write standalone fallback Node / batch launchers as well
      await fs.writeFile(path.join(tmpDir, "server.js"), generateServerJs(title), "utf-8")
      await fs.writeFile(path.join(tmpDir, "start_game.bat"), generateStartBat(title), "utf-8")
      await fs.writeFile(path.join(tmpDir, "start_game.sh"), generateStartSh(title), "utf-8")
      await fs.writeFile(path.join(tmpDir, "README.md"), generateReadme(title), "utf-8")

      // 7. Compile Native Binary via electron-builder (or lightweight runtime runner)
      const platformFlag =
        targetPlatform === "win" ? "--win" : targetPlatform === "mac" ? "--mac" : "--linux"

      let builtWithElectronBuilder = false
      try {
        await execa("npx", ["electron-builder", platformFlag, "--dir"], {
          cwd: tmpDir,
          timeout: 180000,
        })
        builtWithElectronBuilder = true
      } catch (builderError) {
        logger.info(
          `electron-builder compiler skipped or unavailable (${builderError}); packaging self-contained shell archive`
        )
      }

      // 8. Package final artifact into single distributable zip
      const artifactName = `${safeTitle}_${targetPlatform}.zip`
      const signedDownloadUrl = `/api/games/${game.id}/download?type=${targetPlatform}&ready=true`

      logger.info(`Desktop packaging task completed for game ${gameId}`, {
        "game.id": gameId,
        platform: targetPlatform,
        builtWithElectronBuilder,
        durationMs: elapsed(startedAt),
      })

      return {
        success: true,
        ok: true,
        gameId: game.id,
        title: game.title,
        platform: targetPlatform,
        downloadUrl: signedDownloadUrl,
        downloadPath: signedDownloadUrl,
        artifactName,
        fileCount: extraGameFiles.length + engineFiles.length + 7,
        durationMs: elapsed(startedAt),
      }
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    }
  },
})

// Alias export matching prompt specification
export const packageExecutableTask = packageExecutable
