import { PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { Check, ExternalLink, ShieldCheck, Sparkles } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

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
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  const { orgId, userId } = await auth()
  const targetId = orgId || userId

  const params = await searchParams

  // Reconcile Clerk credits if an organization is present
  if (orgId) {
    await reconcileCredits(orgId)
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
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-6">
        <span className="font-heading text-sm font-medium">Billing & Credits</span>
        <div className="flex items-center gap-3">
          {isPaidActive && (
            <Link
              href="/customer-portal"
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Manage Subscription
              <ExternalLink className="ml-1.5 size-3.5" />
            </Link>
          )}
          <span className="text-xs font-medium text-muted-foreground">
            Balance: {formatCredits(credits)}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-10">
          {/* Notifications */}
          {params.success === "true" && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
              <ShieldCheck className="size-5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">Subscription confirmed!</span>{" "}
                Your workspace entitlements and credit allotments are activating.
              </div>
            </div>
          )}

          {params.portal === "no_subscription" && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
              You do not have an active Dodo Payments subscription yet. Select a plan
              below to subscribe.
            </div>
          )}

          {/* Credit balance display */}
          <section className="rounded-2xl border border-border/70 bg-card/75 p-6 shadow-xs backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Available Studio Credits
                </span>
                <div className="mt-2 font-heading text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {formatCredits(credits)}
                </div>
              </div>

              {isPaidActive && (
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <Sparkles className="size-3.5" />
                    Active Plan: {entitlements.tierConfig.name}
                  </div>
                  {currentSub?.currentPeriodEnd && (
                    <span className="text-[11px] text-muted-foreground">
                      Renews on{" "}
                      {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Credits power frontier AI reasoning (Gemini 3.8 Flash, Claude 3.7 Sonnet,
              GPT-4o), dedicated Daytona isolated sandbox execution, and real-time game
              generation turns. Unused subscription credits roll over every month.
            </p>
          </section>

          {/* Dodo Subscription Plans Grid */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
                  Subscription Plans
                </h2>
                <p className="text-xs text-muted-foreground">
                  Powered by Dodo Payments. Select an organization tier to power your game
                  creation studio.
                </p>
              </div>

              {isPaidActive && (
                <Link
                  href="/customer-portal"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Customer Portal
                  <ExternalLink className="ml-1.5 size-3.5" />
                </Link>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {/* Free Explorer */}
              <div
                className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                  currentTier === "free"
                    ? "border-primary/50 bg-card shadow-sm ring-1 ring-primary/20"
                    : "border-border/70 bg-card/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Free Explorer
                    </span>
                    {currentTier === "free" && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-foreground">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      $0
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Starter studio for experimenting with basic 3D games and demos.
                  </p>

                  <div className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-foreground shrink-0" />
                      <span>$1.00 starter inference credits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-foreground shrink-0" />
                      <span>1 active Daytona sandbox</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-foreground shrink-0" />
                      <span>Gemini 3.8 Flash & mini models</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  {currentTier === "free" ? (
                    <Button variant="outline" size="default" disabled className="w-full">
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

              {/* Creator / Pro */}
              <div
                className={`relative flex flex-col justify-between rounded-2xl border-2 p-6 transition-all ${
                  currentTier === "pro"
                    ? "border-primary bg-card shadow-md"
                    : "border-foreground/80 bg-card/90 shadow-sm"
                }`}
              >
                <div className="absolute -top-3 right-5">
                  <span className="rounded-full bg-foreground text-background px-2.5 py-0.5 text-[10px] font-medium shadow-xs">
                    Popular
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Creator
                    </span>
                    {currentTier === "pro" && (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      $19
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    For active game creators and developers building rich three.js worlds.
                  </p>

                  <div className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="text-foreground">
                        $25.00/mo credits (~350 turns)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span>5 persistent Daytona sandboxes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Access to Claude 3.7 & GPT-4o</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Monthly credit rollover</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
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
                className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
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
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      $49
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    For production studios with heavy AI turn usage and team sandboxes.
                  </p>

                  <div className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="text-foreground">
                        $70.00/mo credits (~1,000 turns)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span>20 sandboxes with 8GB RAM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Priority Trigger.dev queues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Dedicated concurrency slots</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
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
                    <CheckoutButton tier="studio" variant="secondary" className="w-full">
                      Upgrade to Studio Pro
                    </CheckoutButton>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Clerk Pricing Table fallback/sync section */}
          <section className="space-y-4 pt-4 border-t border-border/40">
            <details className="group cursor-pointer">
              <summary className="flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground">
                <span>View Clerk Organization Pricing Table</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
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
