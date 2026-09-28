import { auth, currentUser } from "@clerk/nextjs/server"
import { Checkout } from "@dodopayments/nextjs"
import { NextRequest, NextResponse } from "next/server"

import {
  DODO_BEARER_TOKEN,
  DODO_ENVIRONMENT,
  DODO_RETURN_URL,
  TIER_PRODUCT_IDS,
} from "@/lib/billing/dodo"
import { logger } from "@/lib/observability"

// Official adapter handlers
const staticCheckout = Checkout({
  bearerToken: DODO_BEARER_TOKEN,
  returnUrl: DODO_RETURN_URL,
  environment: DODO_ENVIRONMENT,
  type: "static",
})

const sessionCheckout = Checkout({
  bearerToken: DODO_BEARER_TOKEN,
  returnUrl: DODO_RETURN_URL,
  environment: DODO_ENVIRONMENT,
  type: "session",
})

/**
 * GET /api/checkout?productId=...
 * Static checkout: accepts productId query param and redirects/returns checkout URL.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tier = searchParams.get("tier")
    const productId = searchParams.get("productId")

    // If tier was passed instead of productId, resolve it
    if (tier && !productId) {
      const resolvedProductId = TIER_PRODUCT_IDS[tier.toLowerCase()]
      if (resolvedProductId) {
        const url = new URL(req.url)
        url.searchParams.set("productId", resolvedProductId)
        return await staticCheckout(new NextRequest(url, req))
      }
    }

    return await staticCheckout(req)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate static checkout"
    logger.error("Dodo static checkout failed", { error: message })
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/checkout
 * Session checkout: accepts product cart or tier and returns { checkout_url }.
 * Automatically attaches authenticated Clerk user info and metadata when available.
 */
export async function POST(req: NextRequest) {
  try {
    let rawBody: Record<string, unknown> = {}
    try {
      rawBody = (await req.json()) as Record<string, unknown>
    } catch {
      rawBody = {}
    }

    // Check Clerk authentication context (if present)
    let authContext: { userId?: string | null; orgId?: string | null } = {}
    let clerkUser: Awaited<ReturnType<typeof currentUser>> = null
    try {
      authContext = await auth()
      clerkUser = await currentUser()
    } catch {
      // Unauthenticated or outside Clerk middleware scope
    }

    const effectiveTargetId = authContext.orgId || authContext.userId
    const primaryEmail =
      clerkUser?.emailAddresses?.find(
        (e) => e.id === clerkUser?.primaryEmailAddressId
      )?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress
    const fullName =
      `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() || undefined

    // Normalize payload
    let productCart = rawBody.product_cart as Array<{ product_id: string; quantity: number }> | undefined

    // If tier is provided, resolve product_id
    if (!productCart && rawBody.tier) {
      const tier = String(rawBody.tier).toLowerCase()
      const productId = TIER_PRODUCT_IDS[tier] || (rawBody.productId as string | undefined)
      if (!productId) {
        return NextResponse.json(
          { error: `Invalid subscription tier: ${String(rawBody.tier)}` },
          { status: 400 }
        )
      }
      productCart = [{ product_id: productId, quantity: 1 }]
    } else if (!productCart && rawBody.productId) {
      productCart = [{ product_id: String(rawBody.productId), quantity: Number(rawBody.quantity) || 1 }]
    }

    const customMetadata = (rawBody.metadata as Record<string, unknown> | undefined) || {}
    const customCustomer = (rawBody.customer as Record<string, unknown> | undefined) || {}

    const payload = {
      ...rawBody,
      product_cart: productCart,
      return_url: (rawBody.return_url as string | undefined) || DODO_RETURN_URL,
      metadata: {
        ...(effectiveTargetId ? { userId: effectiveTargetId } : {}),
        ...(rawBody.tier ? { tier: String(rawBody.tier) } : {}),
        ...customMetadata,
      },
      customer: {
        ...(primaryEmail ? { email: primaryEmail } : {}),
        ...(fullName ? { name: fullName } : {}),
        ...customCustomer,
      },
    }

    // Build synthetic NextRequest with normalized payload for the adapter
    const modifiedReq = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(payload),
    })

    return await sessionCheckout(modifiedReq)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session"
    logger.error("Dodo session checkout failed", { error: message })
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
