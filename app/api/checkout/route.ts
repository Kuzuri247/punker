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
    if (!DODO_BEARER_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Dodo Payments API key is not configured. Please set DODO_PAYMENTS_API_KEY in your .env.local file.",
        },
        { status: 500 }
      )
    }

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

    const adapterRes = await staticCheckout(req)
    if (!adapterRes.ok) {
      const errorText = await adapterRes.text()
      return NextResponse.json({ error: errorText }, { status: adapterRes.status })
    }

    return adapterRes
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to initiate static checkout"
    logger.error("Dodo static checkout failed", { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/checkout
 * Session checkout: accepts product cart or tier and returns { checkout_url }.
 * Automatically attaches authenticated Clerk user info and metadata when available.
 */
export async function POST(req: NextRequest) {
  try {
    if (!DODO_BEARER_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Dodo Payments API key is not configured. Please add DODO_PAYMENTS_API_KEY in your .env.local file.",
        },
        { status: 500 }
      )
    }

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

    // Normalize payload product_cart
    let productCart = rawBody.product_cart as
      | Array<{ product_id: string; quantity: number }>
      | undefined

    // If tier is provided, resolve product_id
    if (!productCart && rawBody.tier) {
      const tier = String(rawBody.tier).toLowerCase()
      const productId =
        TIER_PRODUCT_IDS[tier] || (rawBody.productId as string | undefined)
      if (!productId) {
        return NextResponse.json(
          { error: `Invalid subscription tier: ${String(rawBody.tier)}` },
          { status: 400 }
        )
      }
      productCart = [{ product_id: productId, quantity: 1 }]
    } else if (!productCart && rawBody.productId) {
      productCart = [
        {
          product_id: String(rawBody.productId),
          quantity: Number(rawBody.quantity) || 1,
        },
      ]
    }

    if (!productCart || productCart.length === 0) {
      return NextResponse.json(
        { error: "At least one product is required in product_cart" },
        { status: 400 }
      )
    }

    const customMetadata =
      (rawBody.metadata as Record<string, unknown> | undefined) || {}
    const customCustomer =
      (rawBody.customer as Record<string, unknown> | undefined) || {}

    const metadata: Record<string, string | number | boolean> = {}
    if (effectiveTargetId) {
      metadata.userId = effectiveTargetId
      metadata.clerkUserId = effectiveTargetId
    }
    if (rawBody.tier) {
      metadata.tier = String(rawBody.tier)
    }
    for (const [key, val] of Object.entries(customMetadata)) {
      if (
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean"
      ) {
        metadata[key] = val
      }
    }

    const payload: Record<string, unknown> = {
      product_cart: productCart,
      return_url: (rawBody.return_url as string | undefined) || DODO_RETURN_URL,
    }

    if (Object.keys(metadata).length > 0) {
      payload.metadata = metadata
    }

    // Only attach customer object if valid email is present (prevents Zod union validation error on empty object)
    if (primaryEmail) {
      payload.customer = {
        email: primaryEmail,
        ...(fullName ? { name: fullName } : {}),
        ...customCustomer,
      }
    } else if (
      customCustomer &&
      (customCustomer.email || customCustomer.customer_id)
    ) {
      payload.customer = customCustomer
    }

    // Build synthetic NextRequest with normalized payload for the adapter
    const modifiedReq = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(payload),
    })

    const adapterRes = await sessionCheckout(modifiedReq)

    if (!adapterRes.ok) {
      const errorText = await adapterRes.text()
      let friendlyError = errorText

      if (errorText.includes("401") || errorText.includes("Unauthorized")) {
        friendlyError =
          "Dodo Payments authentication failed. Please verify that DODO_PAYMENTS_API_KEY in your .env.local file is a valid API key from the Dodo dashboard."
      } else if (
        errorText.includes("not found") ||
        errorText.includes("p_pro_tier") ||
        errorText.includes("p_studio_tier")
      ) {
        friendlyError =
          "Product ID not found in your Dodo Payments catalog. Please configure your Dodo product IDs in .env.local (e.g. DODO_PRODUCT_PRO_ID)."
      }

      logger.warn("Dodo session checkout rejected", {
        status: adapterRes.status,
        error: errorText,
      })

      return NextResponse.json(
        { error: friendlyError },
        { status: adapterRes.status }
      )
    }

    return adapterRes
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session"
    logger.error("Dodo session checkout failed", { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
