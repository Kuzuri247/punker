"use client"

import { useState, useTransition } from "react"

import { ChatComposer } from "@/components/chat-composer"
import { createGame } from "@/lib/games/actions"
import {
  DEFAULT_GAME_MODEL_ID,
  type GameModelId,
} from "@/lib/games/model-catalog"

export function NewGameComposer() {
  const [prompt, setPrompt] = useState("")
  const [modelId, setModelId] = useState<GameModelId>(DEFAULT_GAME_MODEL_ID)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(value: string) {
    startTransition(async () => {
      await createGame(value, modelId)
    })
  }

  return (
    <ChatComposer
      value={prompt}
      onValueChange={setPrompt}
      onSubmit={handleSubmit}
      modelId={modelId}
      onModelChange={setModelId}
      disabled={isPending}
    />
  )
}
