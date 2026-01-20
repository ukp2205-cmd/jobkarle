"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { FreeCreditsToast } from "@/components/free-credits-toast"

export function FreeCreditsNotificationWrapper({ children }: { children: React.ReactNode }) {
  const [showFreeCreditsToast, setShowFreeCreditsToast] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const freeCreditsAllocated = searchParams.get("freeCreditsAllocated")
    if (freeCreditsAllocated === "true") {
      console.log("[v0] Showing free credits congratulations toast")
      setShowFreeCreditsToast(true)

      // Clean up URL parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("freeCreditsAllocated")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])

  return (
    <>
      <FreeCreditsToast isOpen={showFreeCreditsToast} creditsAllocated={10} />
      {children}
    </>
  )
}
