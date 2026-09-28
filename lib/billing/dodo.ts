import { DodoPayments } from "dodopayments"

export const DODO_ENVIRONMENT: "test_mode" | "live_mode" =
  process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ||
  (process.env.NODE_ENV === "production" &&
    process.env.DODO_PAYMENTS_ENVIRONMENT !== "test_mode")
    ? "live_mode"
    : "test_mode"

export const DODO_BEARER_TOKEN = process.env.DODO_PAYMENTS_API_KEY ?? ""
export const DODO_WEBHOOK_KEY =
  process.env.DODO_PAYMENTS_WEBHOOK_KEY ||
  process.env.DODO_PAYMENTS_WEBHOOK_SECRET ||
  ""

export const DODO_RETURN_URL =
  process.env.DODO_PAYMENTS_RETURN_URL ||
  (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`
    : "http://localhost:3000/checkout/success")

export const TIER_PRODUCT_IDS: Record<string, string> = {
  pro: process.env.DODO_PRODUCT_PRO_ID || "p_pro_tier",
  studio: process.env.DODO_PRODUCT_STUDIO_ID || "p_studio_tier",
}

/**
 * Shared Dodo Payments API client instance.
 * Connects to test_mode in development and live_mode in production.
 */
export const dodo = new DodoPayments({
  bearerToken: DODO_BEARER_TOKEN,
  webhookKey: DODO_WEBHOOK_KEY,
  environment: DODO_ENVIRONMENT,
})

