import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { dodo } from "@/lib/billing/dodo"
import {
  grantCredits,
  SubscriptionTier,
  TIER_CONFIGS,
} from "@/lib/billing/entitlements"
import { db, subscriptions } from "@/lib/db/client"
import { logger } from "@/lib/observability"

export async function POST(req: Request) {
  const rawBody = await req.text()
  const headerList = await headers()

  const webhookHeaders: Record<string, string> = {
    "webhook-id": headerList.get("webhook-id") ?? "",
    "webhook-signature": headerList.get("webhook-signature") ?? "",
    "webhook-timestamp": headerList.get("webhook-timestamp") ?? "",
  }

  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY

  let event: any
  try {
    if (webhookKey && process.env.NODE_ENV === "production") {
      event = dodo.webhooks.unwrap(rawBody, {
        headers: webhookHeaders,
        key: webhookKey,
      })
    } else {
      // In development or if test keys are being staged without verification
      event = JSON.parse(rawBody)
    }
  } catch (err: any) {
    logger.error("Dodo webhook signature verification failed", {
      error: err?.message,
    })
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    )
  }

  const eventType = event?.type || event?.event_type
  const data = event?.data || {}

  logger.info(`Received Dodo Payments webhook event: ${eventType}`, {
    eventType,
    subscriptionId: data.subscription_id,
    paymentId: data.payment_id,
  })

  try {
    switch (eventType) {
      case "subscription.active": {
        const userId =
          data.metadata?.userId ||
          data.metadata?.user_id ||
          data.metadata?.orgId ||
          data.customer?.metadata?.userId ||
          data.customer_id

        const tierRaw = (data.metadata?.tier || "pro").toLowerCase()
        const tier: SubscriptionTier =
          tierRaw === "studio" ? "studio" : tierRaw === "pro" ? "pro" : "free"
        const config = TIER_CONFIGS[tier]

        if (userId) {
          await db
            .insert(subscriptions)
            .values({
              id: data.subscription_id || `sub_${Date.now()}`,
              userId,
              customerId: data.customer_id || data.customer?.customer_id || "cust_unknown",
              tier,
              status: "active",
              currentPeriodEnd: data.next_billing_date
                ? new Date(data.next_billing_date)
                : null,
              sandboxMemoryMb: config.sandboxMemoryMb,
              sandboxVcpu: config.sandboxVcpu,
              maxConcurrentSandboxes: config.maxConcurrentSandboxes,
            })
            .onConflictDoUpdate({
              target: subscriptions.userId,
              set: {
                id: data.subscription_id,
                customerId: data.customer_id,
                tier,
                status: "active",
                sandboxMemoryMb: config.sandboxMemoryMb,
                sandboxVcpu: config.sandboxVcpu,
                maxConcurrentSandboxes: config.maxConcurrentSandboxes,
                updatedAt: new Date(),
              },
            })

          // Grant monthly credit allotment for the activated tier
          await grantCredits(userId, config.monthlyCredits)
        }
        break
      }

      case "subscription.renewed": {
        const userId =
          data.metadata?.userId ||
          data.metadata?.user_id ||
          data.metadata?.orgId ||
          data.customer_id

        const tierRaw = (data.metadata?.tier || "pro").toLowerCase()
        const tier: SubscriptionTier =
          tierRaw === "studio" ? "studio" : tierRaw === "pro" ? "pro" : "free"
        const config = TIER_CONFIGS[tier]

        if (userId) {
          await grantCredits(userId, config.monthlyCredits)
          await db
            .update(subscriptions)
            .set({
              status: "active",
              currentPeriodEnd: data.next_billing_date
                ? new Date(data.next_billing_date)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId))
        }
        break
      }

      case "subscription.cancelled":
      case "subscription.expired":
      case "payment.failed": {
        const userId =
          data.metadata?.userId ||
          data.metadata?.user_id ||
          data.metadata?.orgId ||
          data.customer_id

        if (userId) {
          const freeConfig = TIER_CONFIGS.free
          await db
            .update(subscriptions)
            .set({
              tier: "free",
              status: "cancelled",
              sandboxMemoryMb: freeConfig.sandboxMemoryMb,
              sandboxVcpu: freeConfig.sandboxVcpu,
              maxConcurrentSandboxes: freeConfig.maxConcurrentSandboxes,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId))
        }
        break
      }

      case "payment.succeeded": {
        // Handle standalone one-time credit package purchases if applicable
        const userId = data.metadata?.userId || data.metadata?.user_id
        const creditAmount = parseInt(data.metadata?.creditAmount || "0", 10)

        if (userId && creditAmount > 0) {
          await grantCredits(userId, creditAmount)
        }
        break
      }

      default:
        logger.info(`Unhandled Dodo webhook event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error("Failed processing Dodo webhook event", {
      eventType,
      error: error?.message,
    })
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
