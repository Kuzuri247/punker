export default function BillingLoading() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-10">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/60" />
            <div className="h-4 w-96 animate-pulse rounded-md bg-muted/40" />
          </div>

          {/* Current Plan Card Skeleton */}
          <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-36 animate-pulse rounded bg-muted/60" />
                <div className="h-4 w-60 animate-pulse rounded bg-muted/40" />
              </div>
              <div className="h-9 w-28 animate-pulse rounded-xl bg-muted/50" />
            </div>
            <div className="h-px bg-border/40" />
            <div className="flex gap-4">
              <div className="h-4 w-32 animate-pulse rounded bg-muted/40" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted/40" />
            </div>
          </div>

          {/* Pricing Grid Skeleton */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between space-y-6 rounded-2xl border border-border/60 bg-card/50 p-5"
              >
                <div className="space-y-3">
                  <div className="h-5 w-28 animate-pulse rounded bg-muted/60" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted/70" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted/40" />
                </div>
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <div className="h-3.5 w-full animate-pulse rounded bg-muted/40" />
                  <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted/30" />
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted/30" />
                </div>
                <div className="h-10 w-full animate-pulse rounded-xl bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
