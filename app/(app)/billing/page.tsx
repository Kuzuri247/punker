import { PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"

import { formatCredits } from "@/lib/billing/format"
import { getCreditBalance } from "@/lib/billing/ledger"
import { reconcileCredits } from "@/lib/billing/reconcile"

export const metadata: Metadata = {
  title: "Billing",
}

export default async function BillingPage() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  const { orgId } = await auth()

  // This is where someone lands after checkout, so it is where the months an
  // organization has paid for are turned into ledger rows. Reconciling costs a
  // read of the subscription and, all but the first time each month, an insert
  // that conflicts and does nothing.
  if (orgId) {
    await reconcileCredits(orgId)
  }

  const credits = await getCreditBalance(orgId)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-6">
        <span className="font-heading text-sm font-medium">Billing & Credits</span>
        <span className="text-xs font-medium text-muted-foreground">
          Balance: {formatCredits(credits)}
        </span>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-10">
          {/* Credit balance display */}
          <section className="rounded-2xl border border-border/50 bg-secondary/20 p-6">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Available Studio Credits
            </span>
            <div className="mt-2 font-heading text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
              {formatCredits(credits)}
            </div>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground">
              Credits power Gemini inference, Daytona isolated sandboxes, and turn runs.
              Unused subscription credits roll over every month.
            </p>
          </section>

          {/* Minimal Plan Comparison Overview */}
          <section className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
                Subscription Plans
              </h2>
              <p className="text-xs text-muted-foreground">
                Select an organization tier to keep your game creation studio running.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                <div className="text-sm font-semibold text-foreground">Free Explorer</div>
                <div className="mt-1 text-2xl font-bold tracking-tight">$0<span className="text-xs font-normal text-muted-foreground"> /mo</span></div>
                <p className="mt-2 text-xs text-muted-foreground">
                  $1.00 starter credits (~15 turns on Gemini 3.8 Flash), 1 active sandbox.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">Creator</div>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                    Popular
                  </span>
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">$19<span className="text-xs font-normal text-muted-foreground"> /mo</span></div>
                <p className="mt-2 text-xs text-muted-foreground">
                  $25.00/mo credits (~350 turns), 5 persistent sandboxes, multi-agent team.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                <div className="text-sm font-semibold text-foreground">Studio Pro</div>
                <div className="mt-1 text-2xl font-bold tracking-tight">$49<span className="text-xs font-normal text-muted-foreground"> /mo</span></div>
                <p className="mt-2 text-xs text-muted-foreground">
                  $70.00/mo credits (~1,000 turns), 20 sandboxes, priority Trigger queues.
                </p>
              </div>
            </div>
          </section>

          {/* Clerk Pricing Table */}
          <section className="space-y-4">
            <h3 className="font-heading text-lg font-medium tracking-tight text-foreground">
              Manage Organization Subscription
            </h3>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/20 p-2">
              <PricingTable for="organization" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
