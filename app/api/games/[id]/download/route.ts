import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { eq } from "drizzle-orm"

import { getGameSandbox } from "@/lib/daytona/utils"
import { db, games } from "@/lib/db/client"
import {
  generatePackageJson,
  generateReadme,
  generateServerJs,
  generateStartBat,
  generateStartSh,
} from "@/lib/games/export-templates"
import { getGame } from "@/lib/games/queries"
import { elapsed } from "@/lib/observability"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = performance.now()
  const { id } = await params

  Sentry.getIsolationScope().setTags({
    "app.route": "GET /api/games/[id]/download",
    "game.id": id,
  })

  const { userId, orgId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let game = await getGame(id)
  if (!game) {
    // Resilient fallback check directly against games table
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

  if (!game.sandboxId) {
    return Response.json(
      { error: "Game sandbox has not been created yet" },
      { status: 409 }
    )
  }

  try {
    const { sandbox } = await getGameSandbox(id)
    if (!sandbox) {
      return Response.json(
        { error: "Sandbox is currently unreachable" },
        { status: 503 }
      )
    }

    const safeTitle = (game.title || "game")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase()
    const gameTitle = game.title || "Game"

    const exportDir = `/tmp/export-${id}`
    const zipPath = `/tmp/${id}-package.zip`

    // 1. Clean prior staging directories
    await sandbox.process.executeCommand(
      `rm -rf '${exportDir}' '${zipPath}' && mkdir -p '${exportDir}'`
    )

    // 2. Copy game files into staging directory
    await sandbox.process.executeCommand(
      `cp -r /home/daytona/game/* '${exportDir}/' 2>/dev/null || cp -r /home/daytona/game/. '${exportDir}/'`
    )

    // 3. Inject standalone Node server, package.json, launchers, and README
    await sandbox.fs.uploadFile(
      Buffer.from(generatePackageJson(gameTitle, safeTitle), "utf8"),
      `${exportDir}/package.json`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateServerJs(gameTitle), "utf8"),
      `${exportDir}/server.js`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateStartBat(gameTitle), "utf8"),
      `${exportDir}/start_game.bat`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateStartSh(gameTitle), "utf8"),
      `${exportDir}/start_game.sh`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateReadme(gameTitle), "utf8"),
      `${exportDir}/README.md`
    )

    // 4. Set execution permissions and compress bundle
    await sandbox.process.executeCommand(`chmod +x '${exportDir}/start_game.sh'`)
    const execRes = await sandbox.process.executeCommand(
      `cd '${exportDir}' && zip -r '${zipPath}' . -x "*.git*"`
    )

    if (execRes.exitCode !== 0) {
      throw new Error(`Zip creation failed with code ${execRes.exitCode}: ${execRes.result}`)
    }

    // 5. Extract file via base64 encoded stream
    let fileBuffer: Buffer
    const b64Res = await sandbox.process.executeCommand(`base64 -w 0 '${zipPath}'`)
    if (b64Res.exitCode === 0 && b64Res.result) {
      fileBuffer = Buffer.from(b64Res.result.trim(), "base64")
    } else {
      fileBuffer = await sandbox.fs.downloadFile(zipPath)
    }

    // 6. Cleanup temporary staging folder in the background
    sandbox.process
      .executeCommand(`rm -rf '${exportDir}' '${zipPath}'`)
      .catch(() => {})

    Sentry.logger.info(`Downloaded game bundle for ${id}`, {
      "game.id": id,
      sizeBytes: fileBuffer.length,
      durationMs: elapsed(startedAt),
    })

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeTitle}-build.zip"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    Sentry.logger.error(`Failed to export game bundle for ${id}`, {
      "game.id": id,
      error: error?.message,
    })

    return Response.json(
      { error: error?.message || "Failed to generate game export archive" },
      { status: 500 }
    )
  }
}
