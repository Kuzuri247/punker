"use client"

import {
  ArrowUpIcon,
  Box,
  Dices,
  FileText,
  Music,
  Paperclip,
  SquareIcon,
  X,
} from "lucide-react"
import { useRef, useState } from "react"

import { ModelPicker } from "@/components/model-picker"
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import type { GameModelId } from "@/lib/games/model-catalog"
import { suggestions } from "@/lib/games/suggestions"
import { cn } from "@/lib/utils"

export type ComposerAttachment = {
  id: string
  file: File
  name: string
  size: number
  type: string
  state: "uploading" | "done" | "error"
  url?: string
  path?: string
  error?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
  onStop,
  modelId,
  onModelChange,
  gameId,
  streaming = false,
  disabled = false,
  placeholder = "Describe the game you want to build…",
}: {
  value: string
  onValueChange: (value: string) => void
  /** Receives the prompt; only called when it is non-empty. */
  onSubmit: (value: string) => void
  /** Cancels the turn in flight. Required for the button to offer a stop. */
  onStop?: () => void
  /** The model the next turn runs on, and the way to change it. */
  modelId: GameModelId
  onModelChange: (modelId: GameModelId) => void
  gameId?: string
  /** A turn is in flight, so the submit button becomes a stop button. */
  streaming?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [templateIndex, setTemplateIndex] = useState(-1)
  const [isRolling, setIsRolling] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleCycleTemplate() {
    setIsRolling(true)
    setTimeout(() => setIsRolling(false), 350)
    const nextIndex = (templateIndex + 1) % suggestions.length
    setTemplateIndex(nextIndex)
    const template = suggestions[nextIndex]
    onValueChange(template.prompt)
  }

  const prompt = value.trim()
  const isUploading = attachments.some((a) => a.state === "uploading")
  const canSubmit = (prompt.length > 0 || attachments.some((a) => a.state === "done")) && !disabled && !isUploading
  const canStop = streaming && Boolean(onStop)

  async function uploadFiles(files: File[]) {
    if (!gameId || files.length === 0) return

    const newAttachments: ComposerAttachment[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      state: "uploading",
    }))

    setAttachments((prev) => [...prev, ...newAttachments])

    for (const att of newAttachments) {
      try {
        const formData = new FormData()
        formData.append("files", att.file)

        const res = await fetch(`/api/games/${gameId}/upload`, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.error || `Upload failed: HTTP ${res.status}`)
        }

        const data = await res.json()
        const uploaded = data.files?.[0]
        if (!uploaded) throw new Error("Upload response missing file info")

        setAttachments((prev) =>
          prev.map((item) =>
            item.id === att.id
              ? {
                  ...item,
                  state: "done",
                  url: uploaded.url,
                  path: uploaded.path,
                }
              : item
          )
        )
      } catch (err: any) {
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === att.id
              ? {
                  ...item,
                  state: "error",
                  error: err.message || "Failed to upload",
                }
              : item
          )
        )
      }
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    let finalPrompt = prompt
    const doneAttachments = attachments.filter((a) => a.state === "done")

    if (doneAttachments.length > 0) {
      const assetList = doneAttachments
        .map(
          (a) =>
            `- ${a.path} (${a.type || "asset"}, URL: ${a.url})`
        )
        .join("\n")

      finalPrompt = finalPrompt
        ? `${finalPrompt}\n\n[Attached Assets in Sandbox:\n${assetList}]`
        : `[Attached Assets in Sandbox:\n${assetList}\nPlease use these assets in the game code.]`
    }

    onSubmit(finalPrompt)
    setAttachments([])
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter keeps the newline.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      onDragOver={(e) => {
        if (gameId) {
          e.preventDefault()
          setIsDragging(true)
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        if (gameId) {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFiles(Array.from(e.dataTransfer.files))
          }
        }
      }}
    >
      <InputGroup
        className={cn(
          "relative flex flex-col w-full rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-2xl transition-shadow duration-300 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-indigo-500/30 p-2.5",
          isDragging && "border-indigo-400 ring-2 ring-indigo-500/30"
        )}
      >
        {/* Render uploaded / uploading attachments */}
        {attachments.length > 0 && (
          <AttachmentGroup className="px-2 pt-1 pb-2">
            {attachments.map((att) => {
              const isImage = att.type.startsWith("image/")
              const isAudio =
                att.type.startsWith("audio/") ||
                att.name.endsWith(".mp3") ||
                att.name.endsWith(".wav") ||
                att.name.endsWith(".ogg")
              const is3D = att.name.endsWith(".glb") || att.name.endsWith(".gltf")

              return (
                <Attachment
                  key={att.id}
                  state={att.state}
                  size="xs"
                  className="rounded-lg bg-background/80"
                >
                  <AttachmentMedia variant={isImage ? "image" : "icon"}>
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(att.file)}
                        alt={att.name}
                        className="size-full object-cover"
                      />
                    ) : isAudio ? (
                      <Music className="size-3.5 text-amber-500" />
                    ) : is3D ? (
                      <Box className="size-3.5 text-indigo-500" />
                    ) : (
                      <FileText className="size-3.5 text-muted-foreground" />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle className="text-xs">{att.name}</AttachmentTitle>
                    <AttachmentDescription className="text-[10px]">
                      {att.state === "uploading"
                        ? "Uploading…"
                        : att.state === "error"
                          ? att.error || "Failed"
                          : `${formatFileSize(att.size)} • in /assets`}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </AttachmentActions>
                </Attachment>
              )
            })}
          </AttachmentGroup>
        )}

        <InputGroupTextarea
          name="prompt"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            isUploading
              ? "Uploading attachments…"
              : isDragging
                ? "Drop files to upload to game assets…"
                : placeholder
          }
          rows={1}
          className="field-sizing-content max-h-48 min-h-12 px-3.5 pt-2.5 text-[15px] font-normal leading-relaxed text-zinc-100 placeholder:text-zinc-400"
        />

        <InputGroupAddon align="block-end" className="gap-2 px-2 pb-1 pt-1.5">
          <ModelPicker modelId={modelId} onModelChange={onModelChange} />

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ready
          </span>

          {/* Attachment trigger button */}
          {gameId && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,image/*,.glb,.gltf,.json,.txt,.md,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    uploadFiles(Array.from(e.target.files))
                    e.target.value = ""
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Attach assets (Audio, Images, 3D Models, Documents)"
                className="size-8 rounded-full text-foreground/85 hover:text-foreground hover:bg-muted/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Paperclip className="size-3.5" />
              </Button>
            </>
          )}

          {/* Action cluster on the right: Dice button (left of send) + Submit/Stop button */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Dice template cycle button (to the left of send button) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={handleCycleTemplate}
              title={
                templateIndex >= 0
                  ? `Template (${templateIndex + 1}/${suggestions.length}): ${suggestions[templateIndex].label}`
                  : "Cycle template ideas"
              }
              aria-label="Cycle template ideas"
              className="size-8 rounded-full text-foreground hover:text-foreground bg-muted/60 hover:bg-muted dark:bg-white/10 dark:hover:bg-white/15 border border-border/60 dark:border-white/10 transition-all active:scale-90 cursor-pointer"
            >
              <Dices
                className={cn(
                  "size-4 transition-transform duration-300",
                  isRolling && "rotate-180 scale-125 text-primary"
                )}
              />
            </Button>

            {/* Submit / Stop button */}
            {canStop ? (
              <Button
                size="icon"
                onClick={onStop}
                aria-label="Stop generating"
                className="size-8 rounded-full bg-foreground text-background shadow-xs hover:bg-foreground/90 transition-all active:scale-95 cursor-pointer"
              >
                <SquareIcon className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!canSubmit}
                aria-label="Send message"
                className={cn(
                  "size-8 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer",
                  canSubmit
                    ? "bg-foreground text-background hover:bg-foreground/90 hover:shadow-md"
                    : "bg-muted dark:bg-white/10 text-muted-foreground/60 dark:text-zinc-400/60 opacity-60 cursor-not-allowed border border-border/60 dark:border-white/10"
                )}
              >
                <ArrowUpIcon className="size-4 stroke-[2.5]" />
              </Button>
            )}
          </div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
