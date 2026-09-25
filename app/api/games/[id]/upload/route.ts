import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { eq } from "drizzle-orm"

import { getGameSandbox, createGameSandbox, GAME_DIR } from "@/lib/daytona/utils"
import { db, games } from "@/lib/db/client"
import { getGame } from "@/lib/games/queries"
import { elapsed, logger } from "@/lib/observability"

const ALLOWED_EXTENSIONS = new Set([
  // Audio
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "aac",
  "flac",
  // Images
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "gif",
  "bmp",
  "ico",
  // 3D Models
  "glb",
  "gltf",
  "obj",
  // Documents and Data
  "json",
  "txt",
  "md",
  "csv",
  "xml",
])

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = performance.now()
  const { id: gameId } = await params

  Sentry.getIsolationScope().setTags({
    "app.route": "POST /api/games/[id]/upload",
    "game.id": gameId,
  })

  const { userId, orgId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let game = await getGame(gameId)
  if (!game) {
    const [row] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)

    if (row && (!orgId || row.orgId === orgId)) {
      game = row
    }
  }

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 })
  }

  // Ensure sandbox exists
  let sandbox
  try {
    if (!game.sandboxId) {
      const res = await createGameSandbox(gameId)
      sandbox = res.sandbox
    } else {
      const res = await getGameSandbox(gameId)
      sandbox = res.sandbox
    }
  } catch (err: any) {
    logger.error(logger.fmt`Failed to get sandbox for asset upload: ${err.message}`, {
      "game.id": gameId,
    })
    return Response.json(
      { error: "Sandbox is not available. Please try again." },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const rawFiles = [
    ...formData.getAll("files"),
    ...formData.getAll("file"),
  ].filter((item): item is File => item instanceof File)

  if (rawFiles.length === 0) {
    return Response.json({ error: "No files provided" }, { status: 400 })
  }

  const assetsDir = `${GAME_DIR}/assets`
  try {
    await sandbox.process.executeCommand(`mkdir -p '${assetsDir}'`)
  } catch (err) {
    console.warn("Failed to create assets directory via command:", err)
  }

  const uploadedFiles: Array<{
    name: string
    path: string
    url: string
    size: number
    type: string
  }> = []

  for (const file of rawFiles) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        {
          error: `File "${file.name}" exceeds the maximum allowed size of 25MB.`,
        },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return Response.json(
        {
          error: `File format ".${ext}" is not supported. Supported types: audio (mp3, wav, ogg), images (png, jpg, webp), 3D (glb, gltf), and documents (json, txt, md).`,
        },
        { status: 400 }
      )
    }

    // Sanitize filename to prevent directory traversal
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const targetPath = `${assetsDir}/${safeName}`
    const relativePath = `assets/${safeName}`
    const assetUrl = `/assets/${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let uploaded = false
    try {
      await sandbox.fs.uploadFile(buffer, targetPath)
      uploaded = true
    } catch (fsErr) {
      logger.warn(logger.fmt`uploadFile failed, falling back to base64 exec for ${safeName}`, {
        "game.id": gameId,
      })
    }

    if (!uploaded) {
      // Robust zero-dependency base64 stream fallback
      const base64 = buffer.toString("base64")
      const result = await sandbox.process.executeCommand(
        `echo '${base64}' | base64 -d > '${targetPath}'`
      )
      if (result.exitCode !== 0) {
        throw new Error(
          `Failed to write asset ${safeName} to sandbox: ${result.result}`
        )
      }
    }

    uploadedFiles.push({
      name: safeName,
      path: relativePath,
      url: assetUrl,
      size: file.size,
      type: file.type || `application/${ext}`,
    })
  }

  logger.info(logger.fmt`Uploaded ${uploadedFiles.length} assets to game ${gameId}`, {
    "game.id": gameId,
    duration_ms: elapsed(startedAt),
    files: uploadedFiles.map((f) => f.path),
  })

  return Response.json({
    success: true,
    files: uploadedFiles,
  })
}
