"use client"

import type React from "react"

interface CandidateSessionWrapperProps {
  children: React.ReactNode
}

// Removed session timeout functionality for candidates - only employers have session timeout
export function CandidateSessionWrapper({ children }: CandidateSessionWrapperProps) {
  return <>{children}</>
}
