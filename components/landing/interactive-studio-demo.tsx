"use client"

import { ImmersiveSandbox } from "@/components/landing/immersive-sandbox"

/**
 * InteractiveStudioDemo has been superseded by the unified ImmersiveSandbox architecture.
 * This wrapper is preserved for backwards compatibility.
 */
export function InteractiveStudioDemo({
  userId,
}: {
  userId?: string | null
}) {
  return <ImmersiveSandbox userId={userId} />
}
