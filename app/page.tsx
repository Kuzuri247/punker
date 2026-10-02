import { auth } from "@clerk/nextjs/server"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

import { ChatGradientBackground } from "@/components/chat-gradient-background"
import { InteractiveStudioDemo } from "@/components/landing/interactive-studio-demo"
import { LandingArchitecture } from "@/components/landing/landing-architecture"
import { LandingComposer } from "@/components/landing/landing-composer"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHeader } from "@/components/landing/landing-header"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col selection:bg-cyan-500/20">
      {/* Top Header */}
      <LandingHeader userId={userId} />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full pt-12 pb-16 sm:pt-20 sm:pb-20 overflow-hidden px-4">
          <ChatGradientBackground />

          <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 dark:border-white/10 bg-secondary/50 dark:bg-white/5 px-3 py-1 text-xs font-medium text-foreground shadow-2xs backdrop-blur-md">
              <Sparkles className="size-3 text-cyan-500 dark:text-cyan-400" />
              <span>Describe a game. Watch it come to life.</span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-foreground text-balance">
              Build 3D games with AI
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground font-normal leading-relaxed text-pretty">
              Punker is an agentic Three.js builder that plans the scene graph, writes modular code, and streams playable 3D worlds from plain English.
            </p>

            {/* Central Composer */}
            <div className="pt-2">
              <LandingComposer userId={userId} />
            </div>
          </div>
        </section>

        {/* Interactive Studio Preview Section */}
        <section className="w-full px-4 sm:px-6 py-6 sm:py-10">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-col items-center text-center space-y-1 mb-6">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Live Studio Interface
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
                Chat on the left, playable 3D on the right
              </h2>
            </div>

            <InteractiveStudioDemo />
          </div>
        </section>

        {/* Platform Architecture Section */}
        <section className="w-full px-4 sm:px-6">
          <LandingArchitecture />
        </section>

        {/* Call to Action Banner */}
        <section className="w-full px-4 sm:px-6 py-12 sm:py-16">
          <div className="relative isolate mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#18191a] p-8 sm:p-12 text-center shadow-xl">
            <ChatGradientBackground />

            <div className="relative z-10 space-y-5 max-w-xl mx-auto">
              <h2 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
                Ready to build your next 3D world?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Describe your game mechanics, tweak controls in conversational chat, and export clean Three.js code.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href={userId ? "/new" : "/sign-up"}
                  className={cn(
                    buttonVariants({ size: "default" }),
                    "h-10 gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-foreground/90 transition-all active:scale-95 shadow-sm"
                  )}
                >
                  <span>{userId ? "Open Studio" : "Start building for free"}</span>
                  <ArrowRight className="size-4" />
                </Link>

                {!userId && (
                  <Link
                    href="/sign-in"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "h-10 rounded-full border-border/80 dark:border-white/15 bg-background/60 px-5 text-sm font-normal text-foreground hover:bg-muted"
                    )}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
