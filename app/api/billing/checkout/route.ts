import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { dodo } from "@/lib/billing/dodo"
import { logger } from "@/lib/observability"

// Map tier to Dodo product IDs (configurable via environment variables or defaults)
const TIER_PRODUCT_IDS: Record<string, string | undefined> = {
  pro: process.env.DODO_PRODUCT_PRO_ID || "p_pro_tier",
  studio: process.env.DODO_PRODUCT_STUDIO_ID || "p_studio_tier",
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    const user = await currentUser()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const tier = (body?.tier || "pro").toLowerCase()

    const productId = TIER_PRODUCT_IDS[tier]
    if (!productId) {
      return NextResponse.json(
        { error: `Invalid tier requested: ${tier}` },
        { status: 400 }
      )
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000"

    const primaryEmail =
      user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress || user?.emailAddresses[0]?.emailAddress

    const effectiveTargetId = orgId || userId

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: `${appUrl}/billing?success=true&tier=${tier}`,
      metadata: {
        userId: effectiveTargetId,
        tier,
      },
      customer: primaryEmail
        ? {
            email: primaryEmail,
            name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || undefined,
          }
        : undefined,
    })

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    })
  } catch (error: any) {
    logger.error("Failed to create Dodo checkout session", {
      error: error?.message,
    })
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
