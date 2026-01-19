"use client"

import React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DashboardNavigationGuardProps {
  dashboardType: "employer" | "candidate"
  children: React.ReactNode
}

export function DashboardNavigationGuard({ dashboardType, children }: DashboardNavigationGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const dashboardPrefix = dashboardType === "employer" ? "/employer/dashboard" : "/candidate/dashboard"
  const isDashboardPage = pathname.startsWith(dashboardPrefix)

  useEffect(() => {
    if (!isDashboardPage) return

    // Intercept all link clicks on the page
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("a")
      
      if (!link) return
      
      const href = link.getAttribute("href")
      if (!href) return

      // Check if navigation is going outside the dashboard
      const isExternalNavigation = !href.startsWith(dashboardPrefix) && 
                                   !href.startsWith("#") && 
                                   href !== pathname

      if (isExternalNavigation) {
        e.preventDefault()
        setPendingNavigation(href)
        setShowExitDialog(true)
      }
    }

    document.addEventListener("click", handleLinkClick, true)

    return () => {
      document.removeEventListener("click", handleLinkClick, true)
    }
  }, [isDashboardPage, dashboardPrefix, pathname])

  const handleConfirmExit = () => {
    if (pendingNavigation) {
      setShowExitDialog(false)
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleCancelExit = () => {
    setShowExitDialog(false)
    setPendingNavigation(null)
  }

  return (
    <>
      {children}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to exit?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to leave the dashboard. Any unsaved changes may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Yes, Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
