"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button, type buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

interface CheckoutButtonProps {
  productId?: string
  tier?: "pro" | "studio"
  children?: React.ReactNode
  className?: string
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  disabled?: boolean
  onClick?: () => void
}

export function CheckoutButton({
  productId,
  tier,
  children = "Subscribe",
  className,
  variant = "default",
  size = "default",
  disabled = false,
  onClick,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleCheckout() {
    if (onClick) {
      onClick()
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          productId,
          product_cart: productId
            ? [{ product_id: productId, quantity: 1 }]
            : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Unable to create checkout session")
      }

      const { checkout_url } = await response.json()
      if (!checkout_url) {
        throw new Error("No checkout URL returned from payment provider")
      }

      window.location.href = checkout_url
    } catch (error: unknown) {
      console.error("Checkout failed:", error)
      const message =
        error instanceof Error ? error.message : "Could not start checkout."
      setErrorMessage(message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <Button
        onClick={handleCheckout}
        disabled={loading || disabled}
        variant={variant}
        size={size}
        className={className}
      >
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        {loading ? "Redirecting to checkout…" : children}
      </Button>
      {errorMessage && (
        <span className="text-xs text-destructive text-center">
          {errorMessage}
        </span>
      )}
    </div>
  )
}

export default CheckoutButton
