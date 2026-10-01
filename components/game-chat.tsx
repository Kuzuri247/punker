"use client"

import type { ChatSessionPersistedState } from "@trigger.dev/sdk/chat"
import type { UIMessage } from "ai"
import { PanelRightClose, PanelRightOpen, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"

import {
  ChatPreview,
  type GameError,
  type PreviewStatus,
} from "@/components/chat-preview"
import { ChatThread } from "@/components/chat-thread"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Spinner } from "@/components/ui/spinner"
import type { GameModelId } from "@/lib/games/model-catalog"
import { cn } from "@/lib/utils"

export function GameChat({
  gameId,
  credits,
  initialMessages,
  initialModelId,
  initialSession,
  sandboxId,
}: {
  gameId: string
  gameTitle?: string
  /** The organization's balance when the page was rendered. */
  credits: bigint
  initialMessages: UIMessage[]
  /** The model this thread opens on — see `GamePage` for where it comes from. */
  initialModelId: GameModelId
  initialSession?: ChatSessionPersistedState
  sandboxId: string | null
}) {
  // What the preview is showing, counted in finished turns.
  const [previewRevision, setPreviewRevision] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("idle")
  const [isPreviewHidden, setIsPreviewHidden] = useState(false)
  const previewPanelRef = useRef<PanelImperativeHandle>(null)
  const sendPromptRef = useRef<((text: string) => void) | null>(null)

  const router = useRouter()

  // Session Re-attachment: Reconnect to active environments across page reloads
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`punker_active_sandbox_${gameId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        // If the sandbox was active in the last 30 minutes, automatically re-attach
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          setIsStarted(true)
        }
      }
    } catch (_) {}
  }, [gameId])

  useEffect(() => {
    if (isStarted) {
      try {
        sessionStorage.setItem(
          `punker_active_sandbox_${gameId}`,
          JSON.stringify({ timestamp: Date.now(), sandboxId })
        )
      } catch (_) {}
    }
  }, [isStarted, gameId, sandboxId])

  const handleStartSandbox = useCallback(() => {
    setIsStarted(true)
    if (isPreviewHidden) {
      const panel = previewPanelRef.current
      if (panel) {
        panel.expand()
        if (panel.isCollapsed()) {
          panel.resize(60)
        }
      }
      setIsPreviewHidden(false)
    }
  }, [isPreviewHidden])

  const handleToggleHide = useCallback(() => {
    const panel = previewPanelRef.current
    if (!panel) return
    if (isPreviewHidden || panel.isCollapsed()) {
      panel.expand()
      if (panel.isCollapsed()) {
        panel.resize(60)
      }
      setIsPreviewHidden(false)
    } else {
      panel.collapse()
      setIsPreviewHidden(true)
    }
  }, [isPreviewHidden])

  const handleResize = useCallback((size: { asPercentage: number }) => {
    setIsPreviewHidden(size.asPercentage === 0)
  }, [])

  const handleTurnComplete = useCallback(() => {
    if (isStarted) {
      setPreviewRevision((revision) => revision + 1)
    }

    // The turn just spent credits, and the sidebar that shows the balance is
    // rendered by the layout above this page — server-side, once, when the
    // route was entered. Re-rendering it is what makes the number move; the
    // refresh keeps this component's own state, so the thread and the preview
    // are untouched by it.
    router.refresh()
  }, [isStarted, router])

  const handleSelfHeal = useCallback((error: GameError) => {
    if (!sendPromptRef.current) return
    const fileLoc = error.source
      ? `\nTarget file: ${error.source.split("/").pop() || error.source}${error.line ? `:${error.line}` : ""}`
      : ""
    const stackPart = error.stack ? `\nStack trace:\n\`\`\`\n${error.stack}\n\`\`\`` : ""
    sendPromptRef.current(
      `Autonomous Self-Healing: The game encountered a runtime crash during preview:\n"${error.message}"${fileLoc}${stackPart}\nPlease inspect the code and fix this error immediately.`
    )
  }, [])

  const thread = (
    <ChatThread
      gameId={gameId}
      credits={credits}
      initialMessages={initialMessages}
      initialModelId={initialModelId}
      initialSession={initialSession}
      onTurnComplete={handleTurnComplete}
      sendPromptRef={sendPromptRef}
    />
  )

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Floating Top-Right Controls when sandbox is hidden: Start Sandbox button & Bookmark open tab */}
      {isPreviewHidden && (
        <div className="absolute top-3.5 right-0 z-30 flex items-center gap-2">
          {!isStarted || previewStatus === "idle" ? (
            <Button
              size="sm"
              onClick={handleStartSandbox}
              className="h-8 cursor-pointer gap-1.5 rounded-lg border border-border/70 bg-background/90 px-3 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-muted active:scale-95"
            >
              <Play className="size-3.5 fill-current" />
              <span>Start Sandbox</span>
            </Button>
          ) : previewStatus === "loading" || previewStatus === "building" ? (
            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background/90 px-3 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
              <Spinner className="size-3.5" />
              <span className="hidden sm:inline animate-pulse">Starting Sandbox…</span>
            </div>
          ) : previewStatus === "fallback" ? (
            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-500/25 bg-background/90 px-3 text-[11px] font-medium text-amber-500 shadow-sm backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Standby Preview</span>
            </div>
          ) : (
            <div className="flex h-8 items-center rounded-lg border border-border/70 bg-background/90 px-3 text-xs font-medium text-foreground shadow-sm backdrop-blur-md">
              <span>Live Preview</span>
            </div>
          )}

          {/* Bookmark tab sticking flush to the end of the screen when sandbox is hidden */}
          <button
            type="button"
            onClick={handleToggleHide}
            className="group flex h-8 items-center justify-center rounded-l-md border-y border-l border-r-0 border-border/80 bg-background/95 px-2.5 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
            title="Show sandbox"
            aria-label="Show sandbox"
          >
            <PanelRightOpen className="size-4" />
          </button>
        </div>
      )}

      {/* Panels Group - Clean chat and preview layout taking full height */}
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup>
          <ResizablePanel
            defaultSize="40"
            minSize="25"
            className="flex h-full flex-col"
          >
            {thread}
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className={cn(isPreviewHidden && "hidden")}
          />
          <ResizablePanel
            panelRef={previewPanelRef}
            collapsible={true}
            collapsedSize={0}
            defaultSize={60}
            minSize="25"
            onResize={handleResize}
            className="relative flex h-full flex-col overflow-visible"
          >
            {/* Extended sidebar button attached to the sandbox div edge */}
            {!isPreviewHidden && (
              <button
                type="button"
                onClick={handleToggleHide}
                className="absolute top-3.5 -left-8 z-30 flex h-8 w-8 items-center justify-center rounded-l-md border-y border-l border-r-0 border-border/80 bg-background/95 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
                title="Hide sandbox"
                aria-label="Hide sandbox"
              >
                <PanelRightClose className="size-4" />
              </button>
            )}
            <ChatPreview
              key={gameId}
              gameId={gameId}
              revision={previewRevision}
              isStarted={isStarted}
              onStart={handleStartSandbox}
              onStatusChange={setPreviewStatus}
              onToggleHide={handleToggleHide}
              onSelfHeal={handleSelfHeal}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
