"use client"

import Image from "next/image"
import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/60 py-8">
      <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 text-xs text-muted-foreground">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="Punker"
            width={18}
            height={18}
            className="size-4.5"
          />
          <span className="font-logo text-sm text-foreground">Punker</span>
          <span>— Autonomous 3D Game Studio</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px]">Three.js runtime active</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 text-[12px]">
          <Link href="/new" className="hover:text-foreground transition-colors">
            Studio
          </Link>
          <Link href="/billing" className="hover:text-foreground transition-colors">
            Billing
          </Link>
          <Link href="/sign-in" className="hover:text-foreground transition-colors">
            Sign In
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
