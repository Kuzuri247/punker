import { eq, sql } from "drizzle-orm"

import { creditWallets, db, subscriptions } from "@/lib/db/client"
import { GAME_MODELS, type GameModelId } from "@/lib/games/model-catalog"

export type SubscriptionTier = "free" | "pro" | "studio"

export interface TierConfig {
  name: string
  priceMonthlyDollars: number
  monthlyCredits: number
  sandboxMemoryMb: number
  sandboxVcpu: number
  maxConcurrentSandboxes: number
  autoStopMinutes: number
  allowedModels: GameModelId[]
  priorityQueue: boolean
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: "Free / Starter",
    priceMonthlyDollars: 0,
    monthlyCredits: 50,
    sandboxMemoryMb: 1024,
    sandboxVcpu: 1,
    maxConcurrentSandboxes: 1,
    autoStopMinutes: 10,
    allowedModels: [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "claude-3-5-haiku",
      "gpt-4o-mini",
    ],
    priorityQueue: false,
  },
  pro: {
    name: "Pro Builder",
    priceMonthlyDollars: 19,
    monthlyCredits: 1000,
    sandboxMemoryMb: 4096,
    sandboxVcpu: 2,
    maxConcurrentSandboxes: 3,
    autoStopMinutes: 30,
    allowedModels: [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "claude-3-7-sonnet",
      "claude-3-5-haiku",
      "gpt-4o",
      "gpt-4o-mini",
    ],
    priorityQueue: false,
  },
  studio: {
    name: "Studio Max",
    priceMonthlyDollars: 49,
    monthlyCredits: 3500,
    sandboxMemoryMb: 8192,
    sandboxVcpu: 4,
    maxConcurrentSandboxes: 10,
    autoStopMinutes: 60,
    allowedModels: [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "claude-3-7-sonnet",
      "claude-3-5-haiku",
      "gpt-4o",
      "gpt-4o-mini",
    ],
    priorityQueue: true,
  },
}

export interface UserEntitlements {
  tier: SubscriptionTier
  tierConfig: TierConfig
  creditsBalance: number
  sandboxMemoryMb: number
  sandboxVcpu: number
  maxConcurrentSandboxes: number
  autoStopMinutes: number
  allowedModels: GameModelId[]
  canBuild: boolean
}

/**
 * Resolves the active entitlements for a given user or organization ID.
 * Queries active subscription and wallet balance, defaulting safely to Free tier.
 */
export async function getEntitlements(
  userIdOrOrgId: string | null | undefined
): Promise<UserEntitlements> {
  if (!userIdOrOrgId) {
    const freeConfig = TIER_CONFIGS.free
    return {
      tier: "free",
      tierConfig: freeConfig,
      creditsBalance: 0,
      sandboxMemoryMb: freeConfig.sandboxMemoryMb,
      sandboxVcpu: freeConfig.sandboxVcpu,
      maxConcurrentSandboxes: freeConfig.maxConcurrentSandboxes,
      autoStopMinutes: freeConfig.autoStopMinutes,
      allowedModels: freeConfig.allowedModels,
      canBuild: false,
    }
  }

  // 1. Look up active subscription
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userIdOrOrgId))
    .limit(1)

  const activeSub = subRows[0]
  const isSubActive =
    activeSub && (activeSub.status === "active" || activeSub.status === "on_hold")
  const tier: SubscriptionTier = isSubActive
    ? (activeSub.tier as SubscriptionTier) || "free"
    : "free"

  const config = TIER_CONFIGS[tier] || TIER_CONFIGS.free

  // 2. Look up credit wallet balance (initialize with 50 free credits if no row exists)
  const walletRows = await db
    .select()
    .from(creditWallets)
    .where(eq(creditWallets.userId, userIdOrOrgId))
    .limit(1)

  let balance = 50
  if (walletRows.length === 0) {
    await db
      .insert(creditWallets)
      .values({
        userId: userIdOrOrgId,
        balance: 50,
      })
      .onConflictDoNothing()
  } else {
    balance = walletRows[0].balance
  }

  return {
    tier,
    tierConfig: config,
    creditsBalance: balance,
    sandboxMemoryMb: activeSub?.sandboxMemoryMb ?? config.sandboxMemoryMb,
    sandboxVcpu: activeSub?.sandboxVcpu ?? config.sandboxVcpu,
    maxConcurrentSandboxes:
      activeSub?.maxConcurrentSandboxes ?? config.maxConcurrentSandboxes,
    autoStopMinutes: config.autoStopMinutes,
    allowedModels: config.allowedModels,
    canBuild: balance > 0,
  }
}

/**
 * Deducts credits from the user/organization wallet.
 */
export async function deductCredits(
  userIdOrOrgId: string,
  amount: number
): Promise<{ success: boolean; remainingBalance: number }> {
  if (amount <= 0) {
    const current = await getEntitlements(userIdOrOrgId)
    return { success: true, remainingBalance: current.creditsBalance }
  }

  const result = await db
    .update(creditWallets)
    .set({
      balance: sql`${creditWallets.balance} - ${amount}`,
    })
    .where(eq(creditWallets.userId, userIdOrOrgId))
    .returning({ balance: creditWallets.balance })

  const updatedBalance = result[0]?.balance ?? 0
  return {
    success: true,
    remainingBalance: updatedBalance,
  }
}

/**
 * Grants credits to a user/organization wallet (e.g., from Dodo subscription renewals or top-ups).
 */
export async function grantCredits(
  userIdOrOrgId: string,
  amount: number
): Promise<number> {
  const result = await db
    .insert(creditWallets)
    .values({
      userId: userIdOrOrgId,
      balance: amount,
      lifetimePurchased: amount,
    })
    .onConflictDoUpdate({
      target: creditWallets.userId,
      set: {
        balance: sql`${creditWallets.balance} + ${amount}`,
        lifetimePurchased: sql`${creditWallets.lifetimePurchased} + ${amount}`,
        updatedAt: new Date(),
      },
    })
    .returning({ balance: creditWallets.balance })

  return result[0]?.balance ?? amount
}
