"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  EllipsisIcon,
  LaptopIcon,
  LockIcon,
  MonitorIcon,
  PencilLineIcon,
  TerminalIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { deleteGame, renameGame } from "@/lib/games/actions"
import {
  checkExportEntitlements,
  getDesktopExportRunStatus,
  startDesktopExportTask,
} from "@/lib/games/export-actions"
import { slugifyTitle, TITLE_MAX_LENGTH } from "@/lib/games/title"

/**
 * Enhanced game options menu:
 * - HTML5 Web Bundle direct export
 * - Cross-platform native desktop executable packaging (Windows .exe, macOS .app, Linux .AppImage)
 * - Rename and Delete dialogs
 */
export function GameMenu({
  gameId,
  title,
  trigger,
}: {
  gameId: string
  title: string
  trigger?: React.ReactElement
}) {
  const pathname = usePathname()
  const [dialog, setDialog] = useState<"rename" | "delete" | "export-desktop" | null>(null)
  const [name, setName] = useState(title)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Desktop Packaging State
  const [selectedPlatform, setSelectedPlatform] = useState<"win" | "mac" | "linux">("win")
  const [packagingStatus, setPackagingStatus] = useState<
    "idle" | "starting" | "building" | "completed" | "failed"
  >("idle")
  const [packagingRunId, setPackagingRunId] = useState<string | null>(null)
  const [packagingDownloadUrl, setPackagingDownloadUrl] = useState<string | null>(null)
  const [packagingArtifactName, setPackagingArtifactName] = useState<string | null>(null)
  const [packagingError, setPackagingError] = useState<string | null>(null)
  const [entitlements, setEntitlements] = useState<{
    exportZip: boolean
    exportExecutable: boolean
    tier: string
  } | null>(null)

  function openDialog(next: "rename" | "delete" | "export-desktop") {
    setName(title)
    setError(null)
    if (next === "export-desktop") {
      setPackagingError(null)
      checkExportEntitlements().then(setEntitlements).catch(() => {})
    }
    setDialog(next)
  }

  function handleOpenChange(open: boolean) {
    if (!open && !isPending && packagingStatus !== "building" && packagingStatus !== "starting") {
      setDialog(null)
    }
  }

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        await renameGame(gameId, name)
        setDialog(null)
      } catch {
        setError("That name could not be saved. Try again.")
      }
    })
  }

  function handleDelete() {
    setError(null)

    startTransition(async () => {
      try {
        const isCurrentPage =
          pathname === `/games/${gameId}` ||
          pathname === `/games/${slugifyTitle(title)}` ||
          (pathname.startsWith("/games/") && pathname.includes(slugifyTitle(title)))
        await deleteGame(gameId, isCurrentPage)
      } catch {
        setError("This game could not be deleted. Try again.")
      }
    })
  }

  const [isExportingHtml5, setIsExportingHtml5] = useState(false)

  async function handleExportHtml5() {
    setIsExportingHtml5(true)
    setError(null)

    try {
      const response = await fetch(`/api/games/${gameId}/download`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Export failed: HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()}-html5-bundle.zip`

      const anchor = document.createElement("a")
      anchor.style.display = "none"
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()

      setTimeout(() => {
        document.body.removeChild(anchor)
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (err: any) {
      alert(err?.message || "Failed to download game export.")
    } finally {
      setIsExportingHtml5(false)
    }
  }

  // Start desktop executable build task via Trigger.dev
  async function handleStartDesktopBuild() {
    setPackagingStatus("starting")
    setPackagingError(null)

    try {
      const result = await startDesktopExportTask(gameId, selectedPlatform)
      if (!result.ok) {
        setPackagingStatus("failed")
        setPackagingError(result.error || "Failed to start desktop packaging task")
        return
      }

      if (result.runId) {
        setPackagingRunId(result.runId)
        setPackagingStatus("building")
      }
    } catch (err: any) {
      setPackagingStatus("failed")
      setPackagingError(err?.message || "Encountered an error while starting packaging")
    }
  }

  // Subscribe/poll Trigger.dev run status during build
  useEffect(() => {
    if (packagingStatus !== "building" || !packagingRunId) return

    let cancelled = false
    const pollInterval = setInterval(async () => {
      if (cancelled) return

      try {
        const run = await getDesktopExportRunStatus(packagingRunId)
        if (cancelled) return

        if (run.status === "COMPLETED") {
          setPackagingStatus("completed")
          setPackagingDownloadUrl(run.downloadUrl || `/api/games/${gameId}/download?type=${selectedPlatform}`)
          setPackagingArtifactName(run.artifactName || `${title.toLowerCase()}_${selectedPlatform}.zip`)
          clearInterval(pollInterval)
        } else if (run.status === "FAILED" || run.status === "CANCELED") {
          setPackagingStatus("failed")
          setPackagingError(run.error || "Desktop packaging failed")
          clearInterval(pollInterval)
        }
      } catch (err: any) {
        if (!cancelled) {
          setPackagingStatus("failed")
          setPackagingError(err?.message || "Failed to query packaging progress")
          clearInterval(pollInterval)
        }
      }
    }, 2500)

    return () => {
      cancelled = true
      clearInterval(pollInterval)
    }
  }, [packagingStatus, packagingRunId, gameId, selectedPlatform, title])

  const trimmed = name.trim()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Options for ${title}`}
          render={trigger ?? <Button variant="ghost" size="icon-sm" />}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleExportHtml5} disabled={isExportingHtml5}>
            {isExportingHtml5 ? <Spinner className="size-4" /> : <DownloadIcon className="size-4" />}
            {isExportingHtml5 ? "Bundling HTML5..." : "Export HTML5 Bundle (.zip)"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openDialog("export-desktop")}>
            <LaptopIcon className="size-4" />
            Package Desktop Executable
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openDialog("rename")}>
            <PencilLineIcon className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => openDialog("delete")}>
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={dialog === "rename"} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleRename} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename game</DialogTitle>
              <DialogDescription>
                This is the name in the sidebar and above the thread. It does not change the game itself.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="game-title">Name</FieldLabel>
              <Input
                id="game-title"
                name="title"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={TITLE_MAX_LENGTH}
                disabled={isPending}
                autoFocus
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={!trimmed || isPending} focusableWhenDisabled>
                {isPending && <Spinner />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Realtime Desktop Packaging Modal */}
      <Dialog open={dialog === "export-desktop"} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LaptopIcon className="size-5 text-primary" />
              Package Desktop Executable
            </DialogTitle>
            <DialogDescription>
              Build cross-platform desktop executables running offline on an embedded Electron shell.
            </DialogDescription>
          </DialogHeader>

          {entitlements && !entitlements.exportExecutable ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm">
              <div className="flex items-start gap-3">
                <LockIcon className="mt-0.5 size-4 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-400">Studio Pro Required</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Native desktop packaging is gated to <strong>Studio Pro</strong> and <strong>BYOK</strong> members.
                    Free and Indie plans support direct HTML5 bundle exports.
                  </p>
                  <Button render={<Link href="/billing" />} size="sm" variant="default" className="mt-3">
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              {packagingStatus === "idle" && (
                <>
                  <div className="space-y-2">
                    <FieldLabel>Target Platform</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={selectedPlatform === "win" ? "default" : "outline"}
                        className="flex flex-col h-auto py-3 gap-1"
                        onClick={() => setSelectedPlatform("win")}
                      >
                        <MonitorIcon className="size-5" />
                        <span className="text-xs font-semibold">Windows</span>
                        <span className="text-[10px] text-muted-foreground">.exe</span>
                      </Button>
                      <Button
                        type="button"
                        variant={selectedPlatform === "mac" ? "default" : "outline"}
                        className="flex flex-col h-auto py-3 gap-1"
                        onClick={() => setSelectedPlatform("mac")}
                      >
                        <LaptopIcon className="size-5" />
                        <span className="text-xs font-semibold">macOS</span>
                        <span className="text-[10px] text-muted-foreground">.app</span>
                      </Button>
                      <Button
                        type="button"
                        variant={selectedPlatform === "linux" ? "default" : "outline"}
                        className="flex flex-col h-auto py-3 gap-1"
                        onClick={() => setSelectedPlatform("linux")}
                      >
                        <TerminalIcon className="size-5" />
                        <span className="text-xs font-semibold">Linux</span>
                        <span className="text-[10px] text-muted-foreground">.AppImage</span>
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Packages the proprietary engine runtime, shaders, and assets without browser timeouts.
                  </p>
                </>
              )}

              {(packagingStatus === "starting" || packagingStatus === "building") && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-muted/20 rounded-lg border">
                  <Spinner className="size-8 text-primary" />
                  <div>
                    <h4 className="font-semibold text-sm">
                      {packagingStatus === "starting"
                        ? "Dispatching packaging worker..."
                        : `Building native ${selectedPlatform.toUpperCase()} executable...`}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trigger.dev v3 background task active. Inlining engine runtime and containerizing shell.
                    </p>
                  </div>
                </div>
              )}

              {packagingStatus === "completed" && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2Icon className="size-8 text-emerald-500" />
                  <div>
                    <h4 className="font-semibold text-sm text-emerald-400">Desktop Executable Ready!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {packagingArtifactName || `${title} (${selectedPlatform}) packaged successfully.`}
                    </p>
                  </div>
                </div>
              )}

              {packagingStatus === "failed" && (
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  <AlertTriangleIcon className="size-6" />
                  <p className="text-xs font-medium">{packagingError || "Build task encountered an error"}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {packagingStatus === "completed" ? (
              <Button
                render={
                  <a
                    href={
                      packagingDownloadUrl ||
                      `/api/games/${gameId}/download?type=${selectedPlatform}&ready=true`
                    }
                  />
                }
                variant="default"
                className="w-full bg-emerald-600 hover:bg-emerald-500"
              >
                <DownloadIcon className="size-4 mr-2" />
                Download Executable (.zip)
              </Button>
            ) : packagingStatus === "failed" ? (
              <Button type="button" variant="outline" onClick={() => setPackagingStatus("idle")} className="w-full">
                Try Again
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStartDesktopBuild}
                disabled={
                  (entitlements && !entitlements.exportExecutable) ||
                  packagingStatus === "starting" ||
                  packagingStatus === "building"
                }
                className="w-full"
              >
                {packagingStatus === "starting" || packagingStatus === "building" ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    Packaging...
                  </>
                ) : (
                  "Build Executable"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={dialog === "delete"} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Move “{title}” to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              The thread and the sandbox it was built in go with it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending} focusableWhenDisabled>
              {isPending && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
