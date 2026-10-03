"use server"

import { auth } from "@clerk/nextjs/server"
import { runs, tasks } from "@trigger.dev/sdk"
import { eq } from "drizzle-orm"

import { getEntitlements } from "@/lib/billing/entitlements"
import { db, games } from "@/lib/db/client"
import type { packageExecutable } from "@/trigger/package-executable"

export interface StartDesktopExportResult {
  ok: boolean
  runId?: string
  error?: string
  requiresUpgrade?: boolean
}

export interface ExportEntitlementsResult {
  exportZip: boolean
  exportExecutable: boolean
  tier: string
}

/**
 * Checks current user's export entitlements
 */
export async function checkExportEntitlements(): Promise<ExportEntitlementsResult> {
  const { userId, orgId } = await auth()
  const entitlements = await getEntitlements(orgId || userId)
  return {
    exportZip: entitlements.exportZip,
    exportExecutable: entitlements.exportExecutable,
    tier: entitlements.tier,
  }
}

/**
 * Triggers the Trigger.dev background task for packaging native desktop executables
 */
export async function startDesktopExportTask(
  gameId: string,
  targetPlatform: "win" | "mac" | "linux"
): Promise<StartDesktopExportResult> {
  const { userId, orgId } = await auth()
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }

  const entitlements = await getEntitlements(orgId || userId)
  if (!entitlements.exportExecutable) {
    return {
      ok: false,
      requiresUpgrade: true,
      error:
        "Desktop executable packaging is gated to Studio Pro subscribers and BYOK users. Please upgrade your plan on the billing page.",
    }
  }

  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)

  if (!game) {
    return { ok: false, error: "Game not found" }
  }

  try {
    const handle = await tasks.trigger<typeof packageExecutable>(
      "package-executable",
      {
        gameId,
        targetPlatform,
        userId: orgId || userId,
      }
    )

    return {
      ok: true,
      runId: handle.id,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: message,
    }
  }
}

/**
 * Queries the real-time execution status of a packaging run
 */
export async function getDesktopExportRunStatus(runId: string): Promise<{
  status: "PENDING" | "EXECUTING" | "COMPLETED" | "FAILED" | "CANCELED"
  downloadUrl?: string
  artifactName?: string
  error?: string
}> {
  try {
    const run = await runs.retrieve(runId)
    const upperStatus = run.status.toUpperCase()

    if (upperStatus === "COMPLETED") {
      const output = run.output as any
      return {
        status: "COMPLETED",
        downloadUrl: output?.downloadUrl || output?.downloadPath,
        artifactName: output?.artifactName,
      }
    }

    if (
      upperStatus === "FAILED" ||
      upperStatus === "CRASHED" ||
      upperStatus === "SYSTEM_FAILURE"
    ) {
      return {
        status: "FAILED",
        error: (run as any).error?.message || "Desktop packaging task failed",
      }
    }

    if (upperStatus === "CANCELED") {
      return {
        status: "CANCELED",
        error: "Packaging was canceled",
      }
    }

    return {
      status: "EXECUTING",
    }
  } catch (err: unknown) {
    return {
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
