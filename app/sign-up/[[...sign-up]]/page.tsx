"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Gamepad2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/components/auth/auth-provider";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 bg-[#080b11] text-foreground overflow-hidden">
      {/* Dynamic background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-slate-900/60 hover:bg-slate-800/80 px-3 py-1.5 rounded-full border border-border/40 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Platform branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 border border-emerald-400/30">
            <Gamepad2 className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Join Punker AI Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create an account to start generating 3D worlds and agents
          </p>
        </div>

        {isClerkConfigured ? (
          <div className="w-full flex justify-center">
            <SignUp
              fallbackRedirectUrl="/chat"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-xl w-full",
                  headerTitle: "text-foreground font-semibold",
                  headerSubtitle: "text-muted-foreground",
                  socialButtonsBlockButton: "bg-slate-900 border border-slate-800 text-foreground hover:bg-slate-850",
                  formButtonPrimary: "bg-emerald-500 hover:bg-emerald-400 text-black font-semibold",
                  footerActionLink: "text-emerald-400 hover:text-emerald-300",
                },
              }}
            />
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-slate-950/90 border border-emerald-500/30 p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Instant Free Access
            </div>

            <p className="text-sm text-slate-300">
              Welcome to the AI Game Studio! In demo mode, you can immediately start experimenting with the central chat and live 3D sandbox.
            </p>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="text-slate-500 font-sans text-[11px] font-semibold">After Clerk Setup:</div>
              <div>Users sign up and land directly at <span className="text-emerald-300">/chat</span>.</div>
            </div>

            <Button
              onClick={() => router.push("/chat")}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold h-10 mt-1 shadow-lg shadow-emerald-500/20"
            >
              Enter Game Studio <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-emerald-400 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
