"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser, useClerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import { Sparkles, KeyRound, ExternalLink, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";

import { shadcn } from "@clerk/ui/themes";
import { SignInButton, SignUpButton, Show } from "@clerk/nextjs";

const rawPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
export const isClerkConfigured = Boolean(
  rawPublishableKey &&
  !rawPublishableKey.includes("your_clerk_publishable_key") &&
  rawPublishableKey.startsWith("pk_")
);

interface MockAuthContextType {
  isSignedIn: boolean;
  user: {
    id: string;
    fullName: string;
    primaryEmailAddress?: { emailAddress: string };
    imageUrl?: string;
  } | null;
  signOut: () => void;
  signIn: () => void;
  isClerkLive: boolean;
}

const MockAuthContext = createContext<MockAuthContextType>({
  isSignedIn: true,
  user: {
    id: "demo-user-1",
    fullName: "Game Architect",
    primaryEmailAddress: { emailAddress: "architect@punker.engine" },
  },
  signOut: () => {},
  signIn: () => {},
  isClerkLive: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [demoSignedIn, setDemoSignedIn] = useState(true);

  if (!isClerkConfigured) {
    return (
      <MockAuthContext.Provider
        value={{
          isSignedIn: demoSignedIn,
          user: demoSignedIn
            ? {
                id: "demo-user-1",
                fullName: "Game Architect (Demo)",
                primaryEmailAddress: { emailAddress: "architect@punker.engine" },
              }
            : null,
          signOut: () => setDemoSignedIn(false),
          signIn: () => setDemoSignedIn(true),
          isClerkLive: false,
        }}
      >
        {children}
      </MockAuthContext.Provider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={rawPublishableKey}
      appearance={{ theme: shadcn }}
    >
      {children}
    </ClerkProvider>
  );
}

export function useAppAuth() {
  const mockContext = useContext(MockAuthContext);
  if (!isClerkConfigured) {
    return {
      isLoaded: true,
      isSignedIn: mockContext.isSignedIn,
      user: mockContext.user,
      signOut: mockContext.signOut,
      signIn: mockContext.signIn,
      isClerkLive: false,
    };
  }

  return {
    isLoaded: true,
    isSignedIn: true,
    user: null,
    signOut: () => {},
    signIn: () => {},
    isClerkLive: true,
  };
}

/**
 * Universal Navbar Auth Controls:
 * Follows Step 6 specification:
 * <Show when="signed-out"><SignInButton /><SignUpButton /></Show>
 * <Show when="signed-in"><UserButton /></Show>
 */
export function NavbarAuthControls() {
  if (isClerkConfigured) {
    return (
      <div className="flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg cursor-pointer"
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold text-xs h-8 px-3 rounded-lg shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Sign Up
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    );
  }

  // Demo mode controls
  return <AppUserButton />;
}

/**
 * Universal User Button: Renders real Clerk UserButton if configured,
 * or interactive demo profile dropdown if in demo mode.
 */
export function AppUserButton() {
  const { isClerkLive, isSignedIn, user, signOut, signIn } = useAppAuth();

  if (isClerkLive) {
    return (
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    );
  }

  // Demo fallback
  return (
    <div className="flex items-center gap-2.5">
      {isSignedIn ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Sign out of demo session?")) {
                signOut();
              }
            }}
            title="Click to sign out (Demo mode)"
            className="flex items-center gap-2 p-1.5 px-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs text-slate-200 transition-all cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-black">
              GA
            </div>
            <span className="max-w-[100px] truncate font-medium">Game Architect</span>
          </button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={signIn}
          className="text-xs h-7 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
        >
          Sign In (Demo)
        </Button>
      )}
    </div>
  );
}

/**
 * Renders an informative status banner when running without Clerk keys
 */
export function ClerkSetupBanner() {
  if (isClerkConfigured) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-cyan-500/15 border-b border-amber-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-300">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-semibold text-amber-300">Clerk Demo Mode Active:</span>
        <span>
          To activate live authentication, paste your keys into <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200 border border-amber-500/20 font-mono">.env.local</code>.
        </span>
      </div>
      <a
        href="https://dashboard.clerk.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors ml-auto"
      >
        Get Clerk Keys <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
