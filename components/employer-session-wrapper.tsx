"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { logoutEmployer } from "@/app/actions/employer-auth-actions"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { SessionTimeoutWarning } from "@/components/session-timeout-warning"

interface EmployerSessionWrapperProps {
  children: React.ReactNode
}

export function EmployerSessionWrapper({ children }: EmployerSessionWrapperProps) {
  const router = useRouter()

  const { showWarning, secondsRemaining, extendSession } = useSessionTimeout({
    timeoutMs: 60 * 1000, // 1 minute for testing (change to 15 * 60 * 1000 for production: 15 minutes)
    warningMs: 10 * 1000, // 10 seconds warning (change to 2 * 60 * 1000 for production: 2 minutes)
    onTimeout: async () => {
      await logoutEmployer()
      router.push("/employer/login?timeout=true")
    },
  })

  return (
    <>
      <SessionTimeoutWarning open={showWarning} secondsRemaining={secondsRemaining} onExtendSession={extendSession} />
      {children}
    </>
  )
}
