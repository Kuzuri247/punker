import fs from "node:fs/promises"
import path from "node:path"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { eq } from "drizzle-orm"
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
  generatePackageJson,
  generateReadme,
  generateServerJs,
  generateStartBat,
  generateStartSh,
  normalizeExportHtml,
} from "@/lib/games/export-templates"
import { getGame } from "@/lib/games/queries"
import { elapsed } from "@/lib/observability"

interface TarFileEntry {
  name: string
  data: Uint8Array
}

/**
 * Lightweight, zero-dependency in-memory tar extractor supporting standard and ustar archives.
 */
function parseTar(buffer: Uint8Array): TarFileEntry[] {
  const files: TarFileEntry[] = []
  let offset = 0
  const decoder = new TextDecoder("utf-8")

  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512)
    // Check for end of archive (empty block)
    let isZeroBlock = true
    for (let i = 0; i < 512; i++) {
      if (header[i] !== 0) {
        isZeroBlock = false
        break
      }
    }
    if (isZeroBlock) break

    // Filename: bytes 0-100
    let nameEnd = 0
    while (nameEnd < 100 && header[nameEnd] !== 0) nameEnd++
    let name = decoder.decode(header.subarray(0, nameEnd)).trim()

    // UStar prefix: bytes 345-500
    let prefixEnd = 345
    while (prefixEnd < 500 && header[prefixEnd] !== 0) prefixEnd++
    if (prefixEnd > 345) {
      const prefix = decoder.decode(header.subarray(345, prefixEnd)).trim()
      if (prefix) {
        name = `${prefix}/${name}`
      }
    }

    // Size: bytes 124-136 (octal string)
    let sizeStr = ""
    for (let i = 124; i < 136; i++) {
      if (header[i] === 0 || header[i] === 32) continue
      sizeStr += String.fromCharCode(header[i])
    }
    const size = parseInt(sizeStr, 8) || 0
    const type = String.fromCharCode(header[156])

    offset += 512
    // '0', '\0', or empty indicates regular file
    if ((type === "0" || type === "" || type === "\0") && size > 0) {
      const data = buffer.subarray(offset, offset + size)
      const cleanName = name.replace(/^(\.\/|\/)/, "").trim()
      if (cleanName) {
        files.push({ name: cleanName, data })
      }
    }
    offset += Math.ceil(size / 512) * 512
  }

  return files
}

/**
 * Streams files into an in-memory zip archive using fflate.Zip without high buffer spikes.
 */
function createZipStreamingResponse(
  files: Array<{ name: string; content: Uint8Array | string }>,
  filename: string
): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const zip = new fflate.Zip((err, chunk, isFinal) => {
        if (err) {
          controller.error(err)
          return
        }
        if (chunk && chunk.length > 0) {
          controller.enqueue(chunk)
        }
        if (isFinal) {
          controller.close()
        }
      })

      try {
        for (const file of files) {
          const deflate = new fflate.AsyncZipDeflate(file.name, { level: 6 })
          zip.add(deflate)
          const data =
            typeof file.content === "string"
              ? fflate.strToU8(file.content)
              : file.content
          deflate.push(data, true)
        }
        zip.end()
      } catch (streamError) {
        controller.error(streamError)
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = performance.now()
  const { id } = await params
  const url = new URL(request.url)
  const targetPlatform = url.searchParams.get("type")

  Sentry.getIsolationScope().setTags({
    "app.route": "GET /api/games/[id]/download",
    "game.id": id,
    platform: targetPlatform || "html5",
  })

  const { userId, orgId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entitlements = await getEntitlements(orgId || userId)
  if (!entitlements.exportZip) {
    return Response.json(
      {
        error:
          "Exporting HTML5 web bundles requires an Indie Creator, Studio Pro, or BYOK plan. Upgrade from the billing page to download your game files.",
      },
      { status: 403 }
    )
  }

  let game = await getGame(id)
  if (!game) {
    const [row] = await db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1)

    if (row && (!orgId || row.orgId === orgId)) {
      game = row
    }
  }

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 })
  }

  const safeTitle = (game.title || "game")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase()
  const gameTitle = game.title || "Game"

  try {
    const bundleFiles: Array<{ name: string; content: Uint8Array | string }> = []
    let rawIndexHtml = ""
    let hasCustomStyle = false

    // 1. Fetch game files from Daytona sandbox if available
    if (game.sandboxId) {
      try {
        const { sandbox } = await getGameSandbox(id)
        if (sandbox) {
          const tarPath = `/tmp/game-export-${id}.tar.gz`
          await sandbox.process.executeCommand(
            `tar -czf '${tarPath}' -C /home/daytona/game --exclude='.git*' .`
          )
          const tarGzBuffer = await sandbox.fs.downloadFile(tarPath)
          sandbox.process.executeCommand(`rm -f '${tarPath}'`).catch(() => {})

          if (tarGzBuffer && tarGzBuffer.length > 0) {
            const unzippedTar = fflate.gunzipSync(new Uint8Array(tarGzBuffer))
            const extracted = parseTar(unzippedTar)

            for (const file of extracted) {
              const lower = file.name.toLowerCase()
              // Skip sandbox-only development scripts
              if (lower === "report.js" || lower === "welcome.js") {
                continue
              }
              // Skip engine directory from sandbox to avoid stale copies; we inject the canonical version
              if (lower.startsWith("engine/")) {
                continue
              }
              if (lower === "index.html") {
                rawIndexHtml = new TextDecoder("utf-8").decode(file.data)
                continue
              }
              if (lower === "style.css") {
                hasCustomStyle = true
              }
              bundleFiles.push({ name: file.name, content: file.data })
            }
          }
        }
      } catch (sandboxError) {
        Sentry.logger.warn(`Could not extract files from sandbox for ${id}, using fallback`, {
          error: sandboxError instanceof Error ? sandboxError.message : String(sandboxError),
        })
      }
    }

    // 2. Fallback to default runtime files if sandbox files were missing or empty
    if (!rawIndexHtml) {
      const defaultHtmlPath = path.join(
        process.cwd(),
        "lib",
        "games",
        "runtime",
        "index.html"
      )
      try {
        rawIndexHtml = await fs.readFile(defaultHtmlPath, "utf-8")
      } catch {
        rawIndexHtml = `<!doctype html><html><head><title>${gameTitle}</title></head><body><script type="module" src="./punker-engine.min.js"></script></body></html>`
      }
    }

    if (!hasCustomStyle) {
      const defaultCssPath = path.join(
        process.cwd(),
        "lib",
        "games",
        "runtime",
        "style.css"
      )
      try {
        const defaultCss = await fs.readFile(defaultCssPath)
        bundleFiles.push({ name: "style.css", content: new Uint8Array(defaultCss) })
      } catch {}
    }

    // 3. Asset & Template Normalization (Fullscreen scaling, auto-focus, Web Audio unlock)
    const normalizedHtml = normalizeExportHtml(rawIndexHtml, {
      title: gameTitle,
      offlineImportMap: true,
    })
    bundleFiles.push({ name: "index.html", content: normalizedHtml })

    // 4. Bundled Engine Script (punker-engine.min.js)
    const bundledEngine = await getBundledEngineScript()
    bundleFiles.push({ name: "punker-engine.min.js", content: bundledEngine })

    // 5. Offline Three.js Script (three.module.js)
    const offlineThree = await getOfflineThreeScript()
    bundleFiles.push({ name: "three.module.js", content: offlineThree })

    // 6. Include full engine modules directory for backward-compatible relative imports
    const engineFiles = await getAllEngineFiles()
    for (const ef of engineFiles) {
      bundleFiles.push({ name: ef.relativePath, content: ef.content })
    }

    // 7. Inject Standalone Launchers, server.js, package.json, and README
    bundleFiles.push({
      name: "package.json",
      content: generatePackageJson(gameTitle, safeTitle),
    })
    bundleFiles.push({
      name: "server.js",
      content: generateServerJs(gameTitle),
    })
    bundleFiles.push({
      name: "start_game.bat",
      content: generateStartBat(gameTitle),
    })
    bundleFiles.push({
      name: "start_game.sh",
      content: generateStartSh(gameTitle),
    })
    bundleFiles.push({
      name: "README.md",
      content: generateReadme(gameTitle),
    })

    Sentry.logger.info(`Generated HTML5 standalone package for ${id}`, {
      "game.id": id,
      fileCount: bundleFiles.length,
      durationMs: elapsed(startedAt),
    })

    const downloadFilename = `${safeTitle}-html5-bundle.zip`
    return createZipStreamingResponse(bundleFiles, downloadFilename)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate game export archive"
    Sentry.logger.error(`Failed to export game bundle for ${id}`, {
      "game.id": id,
      error: message,
    })

    return Response.json({ error: message }, { status: 500 })
  }
}
