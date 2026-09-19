import { schedules } from "@trigger.dev/sdk"

import { daytona } from "@/lib/daytona/client"
import { describeError, logger } from "@/lib/observability"

/**
 * Sweeps Daytona sandboxes every 2 hours.
 * Ensures sandboxes that are idle get paused or archived, preventing compute leakage.
 */
export const sandboxCleanup = schedules.task({
  id: "sandbox-cleanup",
  cron: "0 */2 * * *", // Runs every 2 hours
  run: async () => {
    let checked = 0
    let stopped = 0

    try {
      for await (const sandbox of daytona.list()) {
        checked++

        // If sandbox is running, check if it should be stopped
        if (sandbox.state === "started") {
          try {
            // Check autoStopInterval is set
            if (!sandbox.autoStopInterval) {
              await sandbox.setAutostopInterval(15)
            }

            if (!sandbox.autoArchiveInterval) {
              await sandbox.setAutoArchiveInterval(2880) // 48h
            }
          } catch (err) {
            logger.warn(
              logger.fmt`Failed to audit sandbox intervals ${sandbox.id}`,
              describeError(err)
            )
          }
        }
      }

      logger.info(
        logger.fmt`Completed sandbox cleanup audit: checked ${checked} sandboxes, adjusted ${stopped}`
      )

      return { checked, stopped }
    } catch (error) {
      logger.error("Sandbox cleanup task failed", describeError(error))
      throw error
    }
  },
})
