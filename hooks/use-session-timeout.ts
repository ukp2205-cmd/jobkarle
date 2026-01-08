"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useRouter } from "next/navigation"

interface UseSessionTimeoutOptions {
  timeoutMs: number
  warningMs: number
  onTimeout?: () => void
  onWarning?: () => void
}

export function useSessionTimeout({ timeoutMs, warningMs, onTimeout, onWarning }: UseSessionTimeoutOptions) {
  const router = useRouter()
  const timeoutIdRef = useRef<NodeJS.Timeout>()
  const warningIdRef = useRef<NodeJS.Timeout>()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const countdownIdRef = useRef<NodeJS.Timeout>()
  const isCountingRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    if (warningIdRef.current) {
      clearTimeout(warningIdRef.current)
    }
    if (countdownIdRef.current) {
      clearInterval(countdownIdRef.current)
    }
    isCountingRef.current = false
  }, [])

  const handleTimeout = useCallback(() => {
    console.log("[v0] ⏰ Session timeout - logging out user")
    clearTimers()
    setShowWarning(false)
    if (onTimeout) {
      onTimeout()
    } else {
      fetch("/api/employer-logout", { method: "POST" })
        .then(() => {
          console.log("[v0] ✓ Logout successful, redirecting to login")
          router.push("/employer/login?timeout=true")
        })
        .catch((error) => {
          console.error("[v0] ✗ Error during auto-logout:", error)
          router.push("/employer/login?timeout=true")
        })
    }
  }, [clearTimers, onTimeout, router])

  const handleWarning = useCallback(() => {
    if (isCountingRef.current) {
      console.log("[v0] ⚠️ Countdown already in progress, skipping duplicate warning")
      return
    }

    console.log("[v0] 🔔 Session timeout warning - showing modal")
    isCountingRef.current = true
    setShowWarning(true)

    const warningSeconds = Math.floor(warningMs / 1000)
    console.log("[v0] 🕐 Starting countdown from", warningSeconds, "seconds")

    setSecondsRemaining(warningSeconds)
    console.log("[v0] 📊 Initial secondsRemaining set to:", warningSeconds)

    let remaining = warningSeconds

    countdownIdRef.current = setInterval(() => {
      remaining -= 1
      console.log("[v0] ⏱️ Countdown tick:", remaining, "seconds")

      setSecondsRemaining((prev) => {
        console.log("[v0] 🔄 Updating secondsRemaining from", prev, "to", remaining)
        return remaining
      })

      if (remaining <= 0) {
        console.log("[v0] 🛑 Countdown reached 0 - triggering auto-logout")
        if (countdownIdRef.current) {
          clearInterval(countdownIdRef.current)
        }
        handleTimeout()
      }
    }, 1000)

    if (onWarning) {
      onWarning()
    }
  }, [warningMs, onWarning, handleTimeout])

  const resetTimer = useCallback(() => {
    if (showWarning || isCountingRef.current) {
      console.log("[v0] ⛔ Warning showing - ignoring activity")
      return
    }

    console.log("[v0] 👆 Activity detected - resetting session timer")
    clearTimers()

    const warningTime = timeoutMs - warningMs
    console.log("[v0] ⏲️ Setting warning timer for", warningTime, "ms (", warningTime / 1000, "seconds )")
    warningIdRef.current = setTimeout(handleWarning, warningTime)
  }, [timeoutMs, warningMs, handleWarning, clearTimers, showWarning])

  const extendSession = useCallback(() => {
    console.log("[v0] ✋ User clicked to extend session")
    setShowWarning(false)
    isCountingRef.current = false
    clearTimers()

    const warningTime = timeoutMs - warningMs
    console.log("[v0] ♻️ Session extended - setting new warning timer for", warningTime, "ms")
    warningIdRef.current = setTimeout(handleWarning, warningTime)
  }, [timeoutMs, warningMs, handleWarning, clearTimers])

  useEffect(() => {
    console.log("[v0] 🚀 Session timeout initialized", {
      timeoutMs,
      warningMs,
      timeoutMinutes: timeoutMs / 60000,
      warningSeconds: warningMs / 1000,
    })

    const events = ["click", "keydown"]

    const handleActivity = () => {
      resetTimer()
    }

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    resetTimer()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      clearTimers()
    }
  }, [resetTimer, timeoutMs, warningMs, clearTimers])

  useEffect(() => {
    console.log("[v0] 📈 State update - showWarning:", showWarning, "secondsRemaining:", secondsRemaining)
  }, [showWarning, secondsRemaining])

  return {
    showWarning,
    secondsRemaining,
    extendSession,
    resetTimer,
  }
}
