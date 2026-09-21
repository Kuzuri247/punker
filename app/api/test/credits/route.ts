import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

import { formatCredits } from "@/lib/billing/format"
import {
  getCreditBalance,
  grantTestCredits,
  hasCreditsToBuild,
  resetTestSpend,
} from "@/lib/billing/ledger"

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

  return NextResponse.json({
    status: "ok",
    organization: targetOrg,
    balance: formatCredits(balance),
    rawBillionths: balance.toString(),
    canBuild,
    safeTestingMode: process.env.SAFE_TESTING_MODE === "true",
  })
}

export async function POST(request: NextRequest) {
  const { orgId, userId } = await auth()
  const searchParams = request.nextUrl.searchParams

  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // Body optional
  }

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

  const amountDollars =
    typeof body.amount === "number" && body.amount > 0 ? body.amount : 50

  const newBalance = await grantTestCredits(targetOrg, amountDollars)

  return NextResponse.json({
    success: true,
    organization: targetOrg,
    granted: `$${amountDollars.toFixed(2)}`,
    newBalance: formatCredits(newBalance),
    message: `Granted $${amountDollars.toFixed(2)} test credits safely without real payment.`,
  })
}

export async function DELETE(request: NextRequest) {
  const { orgId, userId } = await auth()
  const searchParams = request.nextUrl.searchParams
  const targetOrg = searchParams.get("orgId") || orgId

  if (!targetOrg) {
    return NextResponse.json(
      {
        error: "No active organization found.",
        userId,
      },
      { status: 400 }
    )
  }

  const newBalance = await resetTestSpend(targetOrg)

  return NextResponse.json({
    success: true,
    organization: targetOrg,
    newBalance: formatCredits(newBalance),
    message: "Reset all recorded step debits for organization.",
  })
}
