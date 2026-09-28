import { Webhooks } from "@dodopayments/nextjs"
import { eq } from "drizzle-orm"

import { DODO_WEBHOOK_KEY } from "@/lib/billing/dodo"
import {
  grantCredits,
  type SubscriptionTier,
  TIER_CONFIGS,
} from "@/lib/billing/entitlements"
import { db, subscriptions } from "@/lib/db/client"
import { logger } from "@/lib/observability"

export const POST = Webhooks({
  webhookKey: DODO_WEBHOOK_KEY || "whsec_development_placeholder",

  onPayload: async (payload) => {
    logger.info(`Dodo webhook payload received: ${payload.type}`, {
      businessId: payload.business_id,
      timestamp: payload.timestamp,
    })
  },

  onPaymentSucceeded: async (payload) => {
    const data = payload.data
    logger.info("Dodo payment succeeded", {
      paymentId: data.payment_id,
      totalAmount: data.total_amount,
    })

    // If payment has credit top-up metadata, grant the credits
    const userId = data.metadata?.userId || data.metadata?.user_id
    const creditAmount = parseInt(
      String(data.metadata?.creditAmount || "0"),
      10
    )

    if (userId && creditAmount > 0) {
      await grantCredits(userId, creditAmount)
    }
  },

  onPaymentFailed: async (payload) => {
    const data = payload.data
    logger.warn("Dodo payment failed", {
      paymentId: data.payment_id,
      errorCode: data.error_code,
      errorMessage: data.error_message,
    })
  },

  onRefundSucceeded: async (payload) => {
    const data = payload.data
    logger.info("Dodo refund succeeded", {
      refundId: data.refund_id,
      paymentId: data.payment_id,
      amount: data.amount,
    })
  },

  onSubscriptionActive: async (payload) => {
    const data = payload.data
    logger.info("Dodo subscription activated", {
      subscriptionId: data.subscription_id,
      productId: data.product_id,
    })

    const userId =
      data.metadata?.userId ||
      data.metadata?.user_id ||
      data.metadata?.orgId ||
      data.customer?.metadata?.userId ||
      data.customer?.customer_id

    const tierRaw = String(data.metadata?.tier || "pro").toLowerCase()
    const tier: SubscriptionTier =
      tierRaw === "studio" ? "studio" : tierRaw === "pro" ? "pro" : "free"
    const config = TIER_CONFIGS[tier]

    if (userId) {
      const customerId = data.customer?.customer_id || "cust_unknown"

      await db
        .insert(subscriptions)
        .values({
          id: data.subscription_id || `sub_${Date.now()}`,
          userId,
          customerId,
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
            customerId,
            tier,
            status: "active",
            sandboxMemoryMb: config.sandboxMemoryMb,
            sandboxVcpu: config.sandboxVcpu,
            maxConcurrentSandboxes: config.maxConcurrentSandboxes,
            currentPeriodEnd: data.next_billing_date
              ? new Date(data.next_billing_date)
              : null,
            updatedAt: new Date(),
          },
        })

      // Grant monthly credit allotment for the activated tier
      await grantCredits(userId, config.monthlyCredits)
    }
  },

  onSubscriptionRenewed: async (payload) => {
    const data = payload.data
    logger.info("Dodo subscription renewed", {
      subscriptionId: data.subscription_id,
    })

    const userId =
      data.metadata?.userId ||
      data.metadata?.user_id ||
      data.metadata?.orgId ||
      data.customer?.customer_id

    const tierRaw = String(data.metadata?.tier || "pro").toLowerCase()
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
  },

  onSubscriptionCancelled: async (payload) => {
    const data = payload.data
    logger.info("Dodo subscription cancelled", {
      subscriptionId: data.subscription_id,
    })

    const userId =
      data.metadata?.userId ||
      data.metadata?.user_id ||
      data.metadata?.orgId ||
      data.customer?.customer_id

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
  },
})
