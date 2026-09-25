"use client"

import * as React from "react"
import { marked } from "marked"

import { cn } from "@/lib/utils"

marked.setOptions({
  gfm: true,
  breaks: true,
})

function preprocessMarkdown(raw: string): string {
  if (!raw) return ""

  let text = raw.replace(/\r\n/g, "\n")

  // Isolate headings when they are preceded by non-newline, non-# characters (e.g. "some text. ### Heading")
  text = text.replace(/([^\n#])[ \t]*(#{1,6}\s+)/g, "$1\n\n$2")

  // When a heading is followed on the same line by a list item or colon + list item:
  // e.g. "### What Changed: - **Item**" -> "### What Changed\n\n- **Item**"
  text = text.replace(
    /^(#{1,6}\s+[^\n]+?)\s*(?::[ \t]*|[ \t]+)(-\s+|\*\s+|\d+\.\s+)/gm,
    "$1\n\n$2"
  )

  // Ensure bullet points preceded by text on the same line have their own line
  text = text.replace(/([^\n])[ \t]+([*-]\s+)/g, "$1\n$2")

  // Ensure numbered list items preceded by text on the same line have their own line
  text = text.replace(/([^\n])[ \t]+(\d+\.\s+)/g, "$1\n$2")

  return text
}

function injectStreamingCursor(html: string): string {
  const cursor =
    '<span class="inline-block ml-1.5 size-1.5 rounded-full bg-foreground/80 animate-pulse align-middle" aria-hidden="true"></span>'

  // If it ends with </li></ul> or </ol>, inject before the last </li>
  const listEndRegex = /(<\/li>)(<\/(?:ul|ol)>\s*)$/i
  if (listEndRegex.test(html)) {
    return html.replace(listEndRegex, `${cursor}$1$2`)
  }

  const lastClosingTagRegex =
    /(<\/(?:p|h[1-6]|div|span|strong|em|code|li)>)\s*$/i
  if (lastClosingTagRegex.test(html)) {
    return html.replace(lastClosingTagRegex, `${cursor}$1`)
  }

  return html + cursor
}

export function MarkdownMessage({
  content,
  isStreaming = false,
  className,
}: {
  content: string
  isStreaming?: boolean
  className?: string
}) {
  const html = React.useMemo(() => {
    if (!content) return ""
    const preprocessed = preprocessMarkdown(content)
    try {
      const parsed = marked.parse(preprocessed, { async: false }) as string
      return isStreaming ? injectStreamingCursor(parsed) : parsed
    } catch {
      return preprocessed
    }
  }, [content, isStreaming])

  if (!content && isStreaming) {
    return (
      <div className={cn("flex items-center py-1", className)}>
        <span className="size-2 rounded-full bg-foreground/70 animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "markdown-content w-full text-[15px] leading-relaxed text-foreground/90 text-pretty selection:bg-foreground/10",
        // Headings - bold, distinct, well spaced
        "[&_h1]:font-heading [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:tracking-tight [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:first:mt-0",
        "[&_h2]:font-heading [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:tracking-tight [&_h2]:mt-3.5 [&_h2]:mb-1.5 [&_h2]:first:mt-0",
        "[&_h3]:font-heading [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:tracking-tight [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:first:mt-0",
        "[&_h4]:font-heading [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-foreground [&_h4]:mt-2.5 [&_h4]:mb-1 [&_h4]:first:mt-0",
        // Paragraphs
        "[&_p]:my-1.5 [&_p]:first:mt-0 [&_p]:last:mb-0 [&_p]:leading-relaxed",
        // Bold / Strong & Emphasis - bold must be strong and prominent!
        "[&_strong]:font-bold [&_strong]:text-foreground",
        "[&_b]:font-bold [&_b]:text-foreground",
        "[&_em]:italic [&_em]:text-foreground/90",
        // Lists
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1.5",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1.5",
        "[&_li]:pl-0.5 [&_li]:leading-relaxed [&_li>p]:my-0.5 [&_li::marker]:text-muted-foreground/70",
        // Code
        "[&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-muted/80 [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:border [&_code]:border-border/60",
        "[&_pre]:bg-card/90 [&_pre]:border [&_pre]:border-border/70 [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:my-2.5 [&_pre]:overflow-x-auto",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:border-0 [&_pre_code]:text-xs [&_pre_code]:leading-relaxed",
        // Blockquotes & Horizontal rules
        "[&_blockquote]:border-l-2 [&_blockquote]:border-border/80 [&_blockquote]:pl-3.5 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_hr]:my-3.5 [&_hr]:border-border/60",
        // Links
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
