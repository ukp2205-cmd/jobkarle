"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export function useDashboardExitConfirmation(isDashboard: "employer" | "candidate") {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Only add confirmation for dashboard pages
    const dashboardPrefix = isDashboard === "employer" ? "/employer/dashboard" : "/candidate/dashboard"
    
    if (!pathname.startsWith(dashboardPrefix)) {
      return
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // This handles browser navigation (refresh, close, etc.)
      e.preventDefault()
      e.returnValue = ""
    }

    // Add listener for browser navigation
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [pathname, isDashboard])
}
