import { auth } from "@clerk/nextjs/server"
import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"

import { formatCredits } from "@/lib/billing/format"
import {
  getCreditBalance,
  grantTestCredits,
  hasCreditsToBuild,
  resetTestSpend,
} from "@/lib/billing/ledger"
import { priceStep } from "@/lib/billing/pricing"
import { DEFAULT_GAME_MODEL_ID, isGameModelId } from "@/lib/games/model-catalog"
import { google } from "@/lib/games/models"
import { describeError } from "@/lib/observability"

/**
 * Safe Testing Endpoint (/api/test)
 *
 * Provides developers and test suites with a zero-risk way to:
 * 1. Inspect organization credit balance and building permission.
 * 2. Grant free test credits to prevent draining development accounts.
 * 3. Run dry-run model tests that verify LLM connectivity and report exact
 *    credits saved without deducting anything from the ledger.
 */

export async function GET(request: NextRequest) {
  const { orgId, userId } = await auth()
  const searchParams = request.nextUrl.searchParams
  const targetOrg = searchParams.get("orgId") || orgId

  if (!targetOrg) {
    return NextResponse.json(
      {
        error: "No active organization found. Please sign in to an organization or pass ?orgId=...",
        userId,
      },
      { status: 400 }
    )
  }

  const balance = await getCreditBalance(targetOrg)
  const canBuild = await hasCreditsToBuild(targetOrg)
  const safeModeActive = process.env.SAFE_TESTING_MODE === "true"

  return NextResponse.json({
    status: "ok",
    organization: targetOrg,
    credits: {
      formatted: formatCredits(balance),
      rawBillionths: balance.toString(),
      canBuild,
    },
    safety: {
      safeTestingModeActive: safeModeActive,
      environment: process.env.NODE_ENV,
      message: safeModeActive
        ? "Safe testing mode is ACTIVE — background turn steps will not debit credits."
        : "Standard mode active. You can grant test credits below or enable SAFE_TESTING_MODE=true.",
    },
    actions: {
      grantCredits: "POST /api/test with { action: 'grant', amount: 50 }",
      resetSpend: "POST /api/test with { action: 'reset' }",
      dryRunTest: "POST /api/test with { action: 'dry_run', prompt: '3D retro asteroid shooter' }",
    },
  })
}

export async function POST(request: NextRequest) {
  const { orgId, userId } = await auth()
  const searchParams = request.nextUrl.searchParams

  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // Body is optional if action is passed in query
  }

  const action =
    typeof body.action === "string"
      ? body.action
      : searchParams.get("action") || "grant"

  const targetOrg =
    (typeof body.orgId === "string" ? body.orgId : undefined) ||
    searchParams.get("orgId") ||
    orgId

  if (!targetOrg) {
    return NextResponse.json(
      {
        error: "No organization found. Please sign in to an organization or provide 'orgId'.",
        userId,
      },
      { status: 400 }
    )
  }

  // 1. Action: Grant safe test credits
  if (action === "grant" || action === "topup") {
    const amountDollars =
      typeof body.amount === "number" && body.amount > 0 ? body.amount : 50

    const newBalance = await grantTestCredits(targetOrg, amountDollars)

    return NextResponse.json({
      success: true,
      action: "grant",
      organization: targetOrg,
      granted: `$${amountDollars.toFixed(2)}`,
      newBalance: formatCredits(newBalance),
      message: `Successfully granted $${amountDollars.toFixed(2)} test credits. Zero real money charged.`,
    })
  }

  // 2. Action: Reset recorded test debits
  if (action === "reset") {
    const newBalance = await resetTestSpend(targetOrg)

    return NextResponse.json({
      success: true,
      action: "reset",
      organization: targetOrg,
      newBalance: formatCredits(newBalance),
      message: "Cleared recorded step debits and restored balance.",
    })
  }

  // 3. Action: Dry-run simulation (model test with $0 credit deduction)
  if (action === "dry_run" || action === "simulate") {
    const prompt =
      typeof body.prompt === "string" && body.prompt.trim()
        ? body.prompt.trim()
        : "Plan a minimal Three.js space shooter with lighting, camera, and player ship."

    const modelId =
      typeof body.modelId === "string" && isGameModelId(body.modelId)
        ? body.modelId
        : DEFAULT_GAME_MODEL_ID

    const startedAt = performance.now()

    try {
      const { text, usage } = await generateText({
        model: google(modelId),
        instructions:
          "You are the Punker Architect testing the generation pipeline safely. " +
          "Produce a concise 3-sentence architectural outline for the Three.js game.",
        prompt,
        maxOutputTokens: 150,
      })

      const simulatedCost = priceStep({ modelId, usage })
      const durationMs = Math.round(performance.now() - startedAt)

      return NextResponse.json({
        success: true,
        action: "dry_run",
        organization: targetOrg,
        testMode: "SAFE — zero credits deducted from ledger",
        creditsSaved: formatCredits(simulatedCost),
        rawCostBillionths: simulatedCost.toString(),
        durationMs,
        tokenUsage: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
        },
        model: modelId,
        previewText: text,
      })
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          action: "dry_run",
          error: "Model inference dry-run failed",
          ...describeError(error),
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    {
      error: `Unknown action '${action}'. Valid actions are 'grant', 'reset', or 'dry_run'.`,
    },
    { status: 400 }
  )
}
