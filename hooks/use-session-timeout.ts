"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

interface UseSessionTimeoutProps {
  timeoutMs?: number
  warningMs?: number
  onTimeout?: () => void
  onWarning?: () => void
}

export function useSessionTimeout({
  timeoutMs = 60000, // 1 minute for testing
  warningMs = 10000, // 10 seconds warning
  onTimeout,
  onWarning,
}: UseSessionTimeoutProps = {}) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  // Refs to hold timer IDs
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  const clearSessionTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  }, [])

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const handleAutoLogout = useCallback(() => {
    console.log("[v0] 🚪 Auto-logout triggered")
    clearCountdown()
    clearSessionTimers()
    setShowWarning(false)

    if (onTimeout) {
      onTimeout()
    }

    // Redirect to login with timeout parameter
    router.push("/employer/login?timeout=true")
  }, [router, onTimeout, clearCountdown, clearSessionTimers])

  const startCountdown = useCallback(() => {
    const warningSeconds = Math.floor(warningMs / 1000)
    console.log("[v0] ⏰ Starting countdown from", warningSeconds, "seconds")

    setSecondsRemaining(warningSeconds)
    let remaining = warningSeconds

    // Clear any existing countdown
    clearCountdown()

    // Start new countdown interval
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1
      console.log("[v0] ⏱️ Countdown:", remaining, "seconds remaining")

      setSecondsRemaining(remaining)

      if (remaining <= 0) {
        console.log("[v0] ⏰ Countdown finished - logging out")
        clearCountdown()
        handleAutoLogout()
      }
    }, 1000)

    if (onWarning) {
      onWarning()
    }
  }, [warningMs, onWarning, handleAutoLogout, clearCountdown])

  const showWarningModal = useCallback(() => {
    console.log("[v0] ⚠️ Showing session warning modal")
    setShowWarning(true)
    startCountdown()
  }, [startCountdown])

  const resetSessionTimer = useCallback(() => {
    // Don't reset if warning is showing
    if (showWarning) {
      console.log("[v0] ⛔ Warning active - ignoring activity")
      return
    }

    console.log("[v0] 👆 Activity detected - resetting timer")
    clearSessionTimers()

    // Calculate when to show warning
    const warningDelay = timeoutMs - warningMs
    console.log("[v0] ⏲️ Next warning in", warningDelay / 1000, "seconds")

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      showWarningModal()
    }, warningDelay)

    // Set logout timer (backup in case countdown fails)
    logoutTimerRef.current = setTimeout(() => {
      handleAutoLogout()
    }, timeoutMs)
  }, [timeoutMs, warningMs, showWarning, showWarningModal, handleAutoLogout, clearSessionTimers])

  const extendSession = useCallback(() => {
    console.log("[v0] ✅ Session extended by user")
    setShowWarning(false)
    clearCountdown()
    resetSessionTimer()
  }, [resetSessionTimer, clearCountdown])

  useEffect(() => {
    if (isInitializedRef.current) {
      return
    }

    console.log("[v0] 🚀 Initializing session timeout")
    isInitializedRef.current = true

    // Track user activity
    const activityEvents = ["mousedown", "keydown", "touchstart", "click"]

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetSessionTimer)
    })

    // Start initial timer
    resetSessionTimer()

    // Cleanup
    return () => {
      console.log("[v0] 🧹 Cleaning up session timeout")
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetSessionTimer)
      })
      clearSessionTimers()
      clearCountdown()
    }
  }, [resetSessionTimer, clearSessionTimers, clearCountdown])

  return {
    showWarning,
    secondsRemaining,
    extendSession,
  }
}
