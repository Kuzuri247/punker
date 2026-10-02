"use client"

import { UserButton } from "@clerk/nextjs"
import { ArrowRight, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingHeader({
  userId,
}: {
  userId?: string | null
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              alt="Punker"
              width={22}
              height={22}
              className="size-5.5"
            />
            <span className="font-logo text-lg tracking-tight text-foreground">Punker</span>
          </Link>

          <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autonomous Three.js Studio</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {userId ? (
            <div className="flex items-center gap-2">
              <Link
                href="/new"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-8 gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background hover:bg-foreground/90 transition-all active:scale-95 shadow-xs"
                )}
              >
                <span>Enter Studio</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <UserButton />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-8 rounded-full px-3 text-xs font-normal text-muted-foreground hover:text-foreground"
                )}
              >
                Sign in
              </Link>

              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-8 gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background hover:bg-foreground/90 transition-all active:scale-95 shadow-xs"
                )}
              >
                <span>Start building</span>
                <Sparkles className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
