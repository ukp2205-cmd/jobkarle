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

  // Refs to hold timer IDs and prevent re-initialization
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)
  const isMountedRef = useRef(true)

  const onTimeoutRef = useRef(onTimeout)
  const onWarningRef = useRef(onWarning)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
    onWarningRef.current = onWarning
  }, [onTimeout, onWarning])

  const clearSessionTimers = () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  }

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      console.log("[v0] 🛑 Clearing countdown interval")
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }

  const handleAutoLogout = () => {
    console.log("[v0] 🚪 Auto-logout triggered")
    clearCountdown()
    clearSessionTimers()
    setShowWarning(false)

    if (onTimeoutRef.current) {
      onTimeoutRef.current()
    }

    // Redirect to login with timeout parameter
    router.push("/employer/login?timeout=true")
  }

  const startCountdown = () => {
    const warningSeconds = Math.floor(warningMs / 1000)
    console.log("[v0] ⏰ Starting countdown from", warningSeconds, "seconds")

    setSecondsRemaining(warningSeconds)
    let remaining = warningSeconds

    // Clear any existing countdown
    clearCountdown()

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1
      console.log("[v0] ⏱️ Countdown tick:", remaining, "seconds remaining")

      if (!isMountedRef.current) {
        console.log("[v0] ⚠️ Component unmounted - stopping countdown")
        clearCountdown()
        return
      }

      setSecondsRemaining(remaining)

      if (remaining <= 0) {
        console.log("[v0] ⏰ Countdown finished - auto-logout now")
        clearCountdown()
        handleAutoLogout()
      }
    }, 1000)

    if (onWarningRef.current) {
      onWarningRef.current()
    }
  }

  const showWarningModal = () => {
    console.log("[v0] ⚠️ Showing session warning modal")
    setShowWarning(true)
    startCountdown()
  }

  const resetSessionTimer = () => {
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
      if (isMountedRef.current) {
        showWarningModal()
      }
    }, warningDelay)

    // Set logout timer (backup in case countdown fails)
    logoutTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log("[v0] 🕐 Backup logout timer triggered")
        handleAutoLogout()
      }
    }, timeoutMs)
  }

  const extendSession = useCallback(() => {
    console.log("[v0] ✅ Session extended by user")
    setShowWarning(false)
    clearCountdown()
    resetSessionTimer()
  }, [])

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log("[v0] ⏭️ Already initialized - skipping")
      return
    }

    console.log("[v0] 🚀 Initializing session timeout")
    isInitializedRef.current = true
    isMountedRef.current = true

    // Track user activity
    const activityEvents = ["mousedown", "keydown", "touchstart", "click"]

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetSessionTimer)
    })

    // Start initial timer
    resetSessionTimer()

    // Cleanup on unmount only
    return () => {
      console.log("[v0] 🧹 Cleaning up session timeout on unmount")
      isMountedRef.current = false

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetSessionTimer)
      })

      clearSessionTimers()
      clearCountdown()
      isInitializedRef.current = false
    }
  }, []) // Empty dependency array - run once on mount only

  return {
    showWarning,
    secondsRemaining,
    extendSession,
  }
}
