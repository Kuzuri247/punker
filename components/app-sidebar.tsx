"use client"

import { OrganizationSwitcher } from "@clerk/nextjs"
import { MessageSquareIcon, SquarePenIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SettingsMenu } from "@/components/settings-menu"
import { GameMenu } from "@/components/game-menu"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { GameSummary } from "@/lib/games/queries"

export function AppSidebar({
  games,
  credits,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  games: GameSummary[]
  credits: bigint
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        <Link
          href="/"
          className="flex items-center gap-2 group-data-[collapsible=icon]:hidden"
        >
          <Image
            src="/logo.svg"
            alt="Punker"
            width={20}
            height={20}
            className="size-5"
          />
          <span className="font-logo text-base">Punker</span>
        </Link>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/"}
                render={<Link href="/" />}
              >
                <SquarePenIcon />
                <span>New game</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Recents</SidebarGroupLabel>
          <SidebarGroupContent>
            {games.length === 0 ? (
              <Empty className="rounded-xl border border-border/60 bg-muted/20 p-3 group-data-[collapsible=icon]:hidden">
                <EmptyDescription className="text-xs text-muted-foreground">
                  Your games will live here.
                </EmptyDescription>
              </Empty>
            ) : (
              <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                {games.map((game) => (
                  <SidebarMenuItem key={game.id}>
                    <SidebarMenuButton
                      isActive={pathname === `/games/${game.id}`}
                      render={<Link href={`/games/${game.id}`} />}
                    >
                      <span>{game.title}</span>
                    </SidebarMenuButton>
                    {/* The same menu the game's own header has. Rendered as a
                        `SidebarMenuAction` so it sits inside the row rather
                        than beside it: the row is a link, and a button nested
                        in one would be a link that is sometimes not. Hidden
                        until the row is hovered or focused — and, once the
                        menu is open, kept visible by the trigger's
                        `aria-expanded`. */}
                    <GameMenu
                      gameId={game.id}
                      title={game.title}
                      trigger={<SidebarMenuAction showOnHover />}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
            <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger
                    render={
                      <SidebarMenuButton>
                        <MessageSquareIcon />
                        <span>Recents</span>
                      </SidebarMenuButton>
                    }
                  />
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-56 gap-1.5 p-1.5"
                  >
                    <PopoverHeader className="px-2 pt-1">
                      <PopoverTitle className="text-xs text-muted-foreground">
                        Recents
                      </PopoverTitle>
                    </PopoverHeader>
                    {games.length === 0 ? (
                      <Empty className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <EmptyDescription className="text-xs text-muted-foreground">
                          Your games will live here.
                        </EmptyDescription>
                      </Empty>
                    ) : (
                      <SidebarMenu>
                        {games.map((game) => (
                          <SidebarMenuItem key={game.id}>
                            <PopoverClose
                              nativeButton={false}
                              render={
                                <SidebarMenuButton
                                  isActive={pathname === `/games/${game.id}`}
                                  render={<Link href={`/games/${game.id}`} />}
                                >
                                  <span>{game.title}</span>
                                </SidebarMenuButton>
                              }
                            />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: "w-full! max-w-full",
                  organizationSwitcherTrigger:
                    "w-full! max-w-full justify-between! rounded-lg hover:bg-secondary/50 transition-colors py-1.5 px-2",
                  organizationPreview: "min-w-0 flex items-center gap-2",
                  organizationPreviewTextContainer: "min-w-0 flex-1 text-left",
                  organizationPreviewMainIdentifier:
                    "truncate font-medium text-sm text-foreground",
                  organizationPreviewSecondaryIdentifier:
                    "truncate text-xs text-muted-foreground",
                },
              }}
            />
          </div>
          <SettingsMenu credits={credits} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
