"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { logoutCandidate } from "@/app/actions/candidate-auth-actions"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { SessionTimeoutWarning } from "@/components/session-timeout-warning"

interface CandidateSessionWrapperProps {
  children: React.ReactNode
}

export function CandidateSessionWrapper({ children }: CandidateSessionWrapperProps) {
  const router = useRouter()

  const { showWarning, secondsRemaining, extendSession } = useSessionTimeout({
    timeoutMs: 15 * 60 * 1000, // 15 minutes (900,000 ms)
    warningMs: 0, // 0 seconds - immediate logout without warning
    onTimeout: async () => {
      await logoutCandidate()
      router.push("/candidate/login?timeout=true")
    },
  })

  return (
    <>
      <SessionTimeoutWarning open={showWarning} secondsRemaining={secondsRemaining} onExtendSession={extendSession} />
      {children}
    </>
  )
}
