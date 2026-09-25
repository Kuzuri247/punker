import { task } from "@trigger.dev/sdk"
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
import { describeError, elapsed, logger } from "@/lib/observability"

export interface PackageExecutablePayload {
  gameId: string
  platform?: "windows" | "linux" | "macos" | "all"
  appName?: string
}

export interface PackageExecutableResult {
  ok: boolean
  gameId: string
  title: string
  platform: string
  archiveSize: number
  fileCount: number
  downloadPath: string
  durationMs: number
}

/**
 * Packages a game from its Daytona sandbox into a standalone, portable desktop distribution.
 * Bundles HTML5 Canvas/Three.js assets, engine modules, and offline loader scripts.
 */
export const packageExecutable = task({
  id: "package-executable",
  retry: {
    maxAttempts: 2,
  },
  run: async (
    payload: PackageExecutablePayload,
    { ctx }
  ): Promise<PackageExecutableResult> => {
    const startedAt = performance.now()
    const { gameId, platform = "windows", appName } = payload

    logger.info(`Starting desktop executable packaging for game ${gameId}`, {
      "game.id": gameId,
      platform,
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

    const title = appName || game.title || "Game"
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()

    // 2. Access the Daytona sandbox
    const { sandbox } = await getGameSandbox(gameId)
    if (!sandbox) {
      throw new Error(`No active Daytona sandbox found for game: ${gameId}`)
    }

    // 3. Prepare packaging directory and zip bundle in the sandbox
    const exportDir = `/tmp/export-${gameId}`
    const archivePath = `/tmp/${safeTitle}-${platform}-build.zip`

    await sandbox.process.executeCommand(`rm -rf '${exportDir}' '${archivePath}'`)
    await sandbox.process.executeCommand(`mkdir -p '${exportDir}'`)

    // Copy game files to export directory
    await sandbox.process.executeCommand(
      `cp -r /home/daytona/game/* '${exportDir}/' 2>/dev/null || cp -r /home/daytona/game/. '${exportDir}/'`
    )

    // Inject standalone Node server, package.json, launchers, and README
    await sandbox.fs.uploadFile(
      Buffer.from(generatePackageJson(title, safeTitle), "utf8"),
      `${exportDir}/package.json`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateServerJs(title), "utf8"),
      `${exportDir}/server.js`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateStartBat(title), "utf8"),
      `${exportDir}/start_game.bat`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateStartSh(title), "utf8"),
      `${exportDir}/start_game.sh`
    )
    await sandbox.fs.uploadFile(
      Buffer.from(generateReadme(title), "utf8"),
      `${exportDir}/README.md`
    )
    await sandbox.process.executeCommand(`chmod +x '${exportDir}/start_game.sh'`)

    // Create zip archive
    await sandbox.process.executeCommand(
      `cd '${exportDir}' && zip -r '${archivePath}' .`
    )

    // Verify created archive
    let archiveSize = 0
    const b64Res = await sandbox.process.executeCommand(`base64 -w 0 '${archivePath}'`)
    if (b64Res.exitCode === 0 && b64Res.result) {
      archiveSize = Buffer.from(b64Res.result.trim(), "base64").length
    } else {
      const archiveStat = await sandbox.fs.downloadFile(archivePath)
      archiveSize = archiveStat.length
    }

    logger.info(`Successfully packaged game ${gameId}`, {
      "game.id": gameId,
      archiveSize,
      durationMs: elapsed(startedAt),
    })

    return {
      ok: true,
      gameId,
      title,
      platform,
      archiveSize,
      fileCount: 0,
      downloadPath: `/api/games/${gameId}/download`,
      durationMs: elapsed(startedAt),
    }
  },
})
