import { auth } from "@clerk/nextjs/server"
import { CustomerPortal } from "@dodopayments/nextjs"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { DODO_BEARER_TOKEN, DODO_ENVIRONMENT } from "@/lib/billing/dodo"
import { db, subscriptions } from "@/lib/db/client"
import { logger } from "@/lib/observability"

const portalHandler = CustomerPortal({
  bearerToken: DODO_BEARER_TOKEN,
  environment: DODO_ENVIRONMENT,
})

/**
 * GET /customer-portal or /api/customer-portal
 * Query params:
 *   - customer_id (optional): The Dodo customer ID. If omitted, looked up from user's active subscription.
 *   - send_email (optional): Boolean to send email link.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get("customer_id")

    if (customerId) {
      return await portalHandler(req)
    }

    // Try resolving customerId from authenticated Clerk user or org
    let targetId: string | null = null
    try {
      const { userId, orgId } = await auth()
      targetId = orgId || userId || null
    } catch {
      // Unauthenticated
    }

    if (targetId) {
      const subRows = await db
        .select({ customerId: subscriptions.customerId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, targetId))
        .limit(1)

      const dbCustomerId = subRows[0]?.customerId
      if (dbCustomerId && dbCustomerId !== "cust_unknown") {
        const portalUrl = new URL(req.url)
        portalUrl.searchParams.set("customer_id", dbCustomerId)
        return await portalHandler(new NextRequest(portalUrl, req))
      }
    }

    // If still no customer ID found, redirect to billing page
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000"

    return NextResponse.redirect(`${appUrl}/billing?portal=no_subscription`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to access customer portal"
    logger.error("Dodo customer portal redirect failed", {
      error: message,
    })
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
