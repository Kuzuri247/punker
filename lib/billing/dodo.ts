import { DodoPayments } from "dodopayments"

/**
 * Shared Dodo Payments API client instance.
 * Connects to test_mode in development and live_mode in production.
 */
export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY ?? "",
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? "",
  environment:
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ||
    (process.env.NODE_ENV === "production" && process.env.DODO_PAYMENTS_ENVIRONMENT !== "test_mode")
      ? "live_mode"
      : "test_mode",
})
