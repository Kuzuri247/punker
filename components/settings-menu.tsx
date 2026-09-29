"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useClerk, useUser } from "@clerk/nextjs"
import Link from "next/link"
import {
  Coins,
  CreditCard,
  Laptop,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCredits } from "@/lib/billing/format"
import { cn } from "@/lib/utils"

const emptySubscribe = () => () => {}

export function SettingsMenu({
  className,
  credits,
}: {
  className?: string
  credits?: bigint
}) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const clerk = useClerk()
  const { user } = useUser()

  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const isDark = resolvedTheme === "dark"

  const themeLabel = React.useMemo(() => {
    if (!mounted) return "Theme"
    if (theme === "system") return "Device theme"
    if (theme === "dark") return "Dark theme"
    if (theme === "light") return "Light theme"
    return "Theme"
  }, [mounted, theme])

  const ThemeIcon = React.useMemo(() => {
    if (!mounted) return Sun
    if (theme === "system") return Laptop
    if (theme === "dark" || isDark) return Moon
    return Sun
  }, [mounted, theme, isDark])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Settings"
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 shrink-0 rounded-lg text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground data-[popup-open]:bg-secondary/80 data-[popup-open]:text-foreground",
              className
            )}
          />
        }
      >
        <Settings className="size-4.5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="end"
        sideOffset={10}
        alignOffset={-4}
        className="w-72! min-w-72 rounded-2xl border border-border/70 bg-popover/95 p-1.5 text-popover-foreground shadow-2xl shadow-black/25 backdrop-blur-md outline-none"
      >
        {/* User Identity Header if available */}
        {user && (
          <>
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User avatar"}
                  className="size-8 rounded-full object-cover ring-1 ring-border/50"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {user.firstName?.[0] || user.username?.[0] || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.fullName || user.username || "Account"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator className="my-1" />
          </>
        )}

        {/* Primary Settings Section: Theme toggle with options to select from */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-normal">
              <ThemeIcon className="size-4.5 text-muted-foreground" />
              <span className="flex-1 text-left">Theme</span>
              <span className="mr-1 text-xs text-muted-foreground capitalize">
                {theme === "system"
                  ? "Device"
                  : theme === "dark"
                    ? "Dark"
                    : theme === "light"
                      ? "Light"
                      : ""}
              </span>
            </DropdownMenuSubTrigger>

            <DropdownMenuSubContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-48! min-w-48 rounded-xl border border-border/70 bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-md"
            >
              <DropdownMenuRadioGroup
                value={theme ?? "system"}
                onValueChange={(val) => setTheme(val)}
              >
                <DropdownMenuRadioItem
                  value="system"
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm"
                >
                  <Laptop className="size-4 text-muted-foreground" />
                  <span>Device theme</span>
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  value="dark"
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm"
                >
                  <Moon className="size-4 text-muted-foreground" />
                  <span>Dark theme</span>
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  value="light"
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm"
                >
                  <Sun className="size-4 text-muted-foreground" />
                  <span>Light theme</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Account and navigation options */}
        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            render={<Link href="/billing" prefetch={true} />}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-normal"
          >
            <Coins className="size-4.5 text-muted-foreground" />
            <span className="flex-1 text-left">Manage subscription</span>
            {credits !== undefined && (
              <span className="rounded-md border border-border/60 bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                {formatCredits(credits)}
              </span>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => clerk.openUserProfile()}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-normal"
          >
            <User className="size-4.5 text-muted-foreground" />
            <span>Manage account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => clerk.signOut()}
          className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-normal"
        >
          <LogOut className="size-4.5" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
