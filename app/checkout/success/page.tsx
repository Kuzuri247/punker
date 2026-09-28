import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Sparkles, CreditCard, Box } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Payment Successful",
}

export default async function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/60 p-8 shadow-xl backdrop-blur-md text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="size-8" />
        </div>

        {/* Header */}
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Payment Successful
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Thank you for subscribing! Your workspace is being configured and your
          studio credits are updating in real-time.
        </p>

        {/* Feature status box */}
        <div className="mt-8 grid gap-3 text-left">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <Sparkles className="size-4 shrink-0 text-amber-500" />
            <div className="text-xs">
              <span className="font-medium text-foreground">
                Inference Credits Granted
              </span>
              <p className="text-muted-foreground">
                Turn runs on frontier AI models are now ready to execute.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <Box className="size-4 shrink-0 text-sky-500" />
            <div className="text-xs">
              <span className="font-medium text-foreground">
                Daytona Sandboxes Activated
              </span>
              <p className="text-muted-foreground">
                High-memory isolated cloud containers are standing by.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <CreditCard className="size-4 shrink-0 text-violet-500" />
            <div className="text-xs">
              <span className="font-medium text-foreground">
                Verified via Dodo Payments
              </span>
              <p className="text-muted-foreground">
                Entitlements are authenticated directly via cryptographically signed webhooks.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className={buttonVariants({
              size: "lg",
              className: "w-full sm:w-auto font-medium",
            })}
          >
            Launch Studio
            <ArrowRight className="ml-2 size-4" />
          </Link>

          <Link
            href="/billing"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            View Billing & Credits
          </Link>
        </div>
      </div>
    </div>
  )
}
