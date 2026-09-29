import { PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import {
  Check,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ByokDialog } from "@/components/byok-dialog"
import { CheckoutButton } from "@/components/checkout-button"
import { Button, buttonVariants } from "@/components/ui/button"
import { getEntitlements } from "@/lib/billing/entitlements"
import { formatCredits } from "@/lib/billing/format"
import { getCreditBalance } from "@/lib/billing/ledger"
import { reconcileCredits } from "@/lib/billing/reconcile"
import { db, subscriptions } from "@/lib/db/client"

export const metadata: Metadata = {
  title: "Billing & Credits",
}

interface BillingPageProps {
  searchParams: Promise<{
    success?: string
    portal?: string
    tier?: string
  }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const [{ orgId, userId }, params] = await Promise.all([auth(), searchParams])

  if (!userId) {
    redirect("/sign-in")
  }

  const targetId = orgId || userId

  // Only block on reconcileCredits if user just returned from checkout (params.success/portal),
  // so new credits appear immediately. For normal visits, reconcile in the background for instant navigation!
  if (orgId) {
    if (params?.success || params?.portal) {
      await reconcileCredits(orgId)
    } else {
      void reconcileCredits(orgId)
    }
  }

  const [credits, entitlements, subRows] = await Promise.all([
    getCreditBalance(orgId),
    getEntitlements(targetId),
    targetId
      ? db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, targetId))
          .limit(1)
      : Promise.resolve([]),
  ])

  const currentSub = subRows[0]
  const currentTier = entitlements.tier || "free"
  const isPaidActive =
    currentSub?.status === "active" && currentSub?.tier !== "free"

  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-10">
          {/* Notifications */}
          {params.success === "true" && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
              <ShieldCheck className="size-5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">Subscription confirmed!</span>{" "}
                Your workspace entitlements and credit allotments are
                activating.
              </div>
            </div>
          )}

          {params.portal === "no_subscription" && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
              You do not have an active Dodo Payments subscription yet. Select a
              plan below to subscribe.
            </div>
          )}

          {/* Credit balance display */}
          <section className="rounded-2xl border border-border/70 bg-card/75 p-6 shadow-xs backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Available Studio Credits
                </span>
                <div className="mt-2 font-heading text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {formatCredits(credits)}
                </div>
              </div>

              {isPaidActive && (
                <div className="flex flex-col items-start gap-1.5 sm:items-end">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <Sparkles className="size-3.5" />
                    Active Plan: {entitlements.tierConfig.name}
                  </div>
                  {currentSub?.currentPeriodEnd && (
                    <span
                      className="text-[11px] text-muted-foreground"
                      suppressHydrationWarning
                    >
                      Renews on{" "}
                      {new Date(currentSub.currentPeriodEnd).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Credits power frontier AI reasoning (Gemini 3.8 Flash, Claude 3.7
              Sonnet, GPT-4o), dedicated Daytona isolated sandbox execution, and
              real-time game generation turns. Unused subscription credits roll
              over every month.
            </p>
          </section>

          {/* Dodo Subscription Plans Grid */}
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
                  Subscription Plans
                </h2>
                <p className="text-xs text-muted-foreground">
                  Powered by Dodo Payments. Select an organization tier to power
                  your game creation studio.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ByokDialog
                  triggerVariant="outline"
                  triggerSize="sm"
                  trigger={
                    <>
                      <KeyRound className="mr-1.5 size-3.5" />
                      Configure BYOK Keys
                    </>
                  }
                />
                {isPaidActive && (
                  <Link
                    href="/customer-portal"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Customer Portal
                    <ExternalLink className="ml-1.5 size-3.5" />
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Free Explorer */}
              <div
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  currentTier === "free"
                    ? "border-primary/50 bg-card shadow-sm ring-1 ring-primary/20"
                    : "border-border/70 bg-card/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Free / Explorer
                    </span>
                    {currentTier === "free" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      $0
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Starter studio for experimenting with basic 3D games and
                    demos.
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-foreground" />
                      <span>10 setup credits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-foreground" />
                      <span>5-min sandbox timeout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-foreground" />
                      <span>1 active sandbox (1GB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-foreground" />
                      <span>Play in-browser (WebGL preview)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {currentTier === "free" ? (
                    <Button
                      variant="outline"
                      size="default"
                      disabled
                      className="w-full"
                    >
                      Active Plan
                    </Button>
                  ) : (
                    <Link
                      href="/customer-portal"
                      className={buttonVariants({
                        variant: "outline",
                        size: "default",
                        className: "w-full",
                      })}
                    >
                      Manage in Portal
                    </Link>
                  )}
                </div>
              </div>

              {/* Indie Creator */}
              <div
                className={`relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all ${
                  currentTier === "pro"
                    ? "border-primary bg-card shadow-md"
                    : "border-foreground/80 bg-card/90 shadow-sm"
                }`}
              >
                <div className="absolute -top-3 right-4">
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background shadow-xs">
                    Popular
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Indie Creator
                    </span>
                    {currentTier === "pro" && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      $19
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    For active game creators and developers building rich
                    three.js worlds.
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span className="text-foreground">
                        300 generation credits/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>10-min timeout, auto-hibernation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>3 sandboxes (1 vCPU, 2GB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>HTML5 Web Bundle (.zip) download</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {currentTier === "pro" ? (
                    <Link
                      href="/customer-portal"
                      className={buttonVariants({
                        variant: "outline",
                        size: "default",
                        className: "w-full",
                      })}
                    >
                      Manage Subscription
                    </Link>
                  ) : (
                    <CheckoutButton tier="pro" className="w-full">
                      Upgrade to Creator
                    </CheckoutButton>
                  )}
                </div>
              </div>

              {/* Studio Pro */}
              <div
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  currentTier === "studio"
                    ? "border-primary bg-card shadow-md ring-1 ring-primary/20"
                    : "border-border/70 bg-card/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Studio Pro
                    </span>
                    {currentTier === "studio" && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      $49
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    For production studios with heavy AI turn usage and team
                    sandboxes.
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span className="text-foreground">
                        1,200 generation credits/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>Gemini 2.0 Pro deep reasoning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>30-min timeout, 5 sandboxes (4GB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>Windows & Mac standalone export</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {currentTier === "studio" ? (
                    <Link
                      href="/customer-portal"
                      className={buttonVariants({
                        variant: "outline",
                        size: "default",
                        className: "w-full",
                      })}
                    >
                      Manage Subscription
                    </Link>
                  ) : (
                    <CheckoutButton
                      tier="studio"
                      variant="secondary"
                      className="w-full"
                    >
                      Upgrade to Studio Pro
                    </CheckoutButton>
                  )}
                </div>
              </div>

              {/* BYOK Hacker */}
              <div
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  currentTier === "byok"
                    ? "border-primary bg-card shadow-md ring-1 ring-primary/20"
                    : "border-border/70 bg-card/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      BYOK Hacker
                    </span>
                    {currentTier === "byok" && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      $10
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      /mo
                    </span>
                    <span className="ml-2 text-[11px] text-muted-foreground/80">
                      or $69 lifetime
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Bring your own Gemini/Claude/OpenAI keys. Zero token limits.
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span className="text-foreground">
                        Unlimited turns (you pay provider)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>15-min sandbox session timeout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>HTML5 + Standalone executable export</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                      <span>Zero token markup</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  {currentTier === "byok" ? (
                    <ByokDialog
                      triggerVariant="outline"
                      triggerSize="default"
                      triggerClassName="w-full"
                      trigger="Configure API Keys"
                    />
                  ) : (
                    <>
                      <CheckoutButton
                        tier="byok"
                        variant="outline"
                        className="w-full"
                      >
                        Subscribe ($10/mo)
                      </CheckoutButton>
                      <ByokDialog
                        triggerVariant="ghost"
                        triggerSize="xs"
                        triggerClassName="w-full text-[11px]"
                        trigger="Enter Keys Directly"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Clerk Pricing Table fallback/sync section */}
          <section className="space-y-4 border-t border-border/40 pt-4">
            <details className="group cursor-pointer">
              <summary className="flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground">
                <span>View Clerk Organization Pricing Table</span>
                <span className="transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card/20 p-2">
                <PricingTable for="organization" />
              </div>
            </details>
          </section>
        </div>
      </div>
    </div>
  )
}
