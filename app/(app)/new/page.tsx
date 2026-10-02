import { auth } from "@clerk/nextjs/server"

import { ChatGradientBackground } from "@/components/chat-gradient-background"
import { NewGameComposer } from "@/components/new-game-composer"

export default async function NewGamePage() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return (
    <div className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <ChatGradientBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            What&apos;s on your mind today?
          </h1>
        </div>

        <div className="w-full space-y-4">
          <NewGameComposer />
        </div>
      </div>
    </div>
  )
}
