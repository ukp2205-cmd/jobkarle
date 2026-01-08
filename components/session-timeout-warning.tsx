"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Timer } from "lucide-react"
import { useEffect } from "react"

interface SessionTimeoutWarningProps {
  open: boolean
  secondsRemaining: number
  onExtendSession: () => void
}

export function SessionTimeoutWarning({ open, secondsRemaining, onExtendSession }: SessionTimeoutWarningProps) {
  useEffect(() => {
    console.log("[v0] 🎬 SessionTimeoutWarning rendered - open:", open, "secondsRemaining:", secondsRemaining)
  }, [open, secondsRemaining])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Session Will Expire Soon</DialogTitle>
              <DialogDescription className="mt-1">Your session will expire due to inactivity</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-red-600">
              <Timer className="h-5 w-5" />
              <span className="text-sm font-medium">Session expires in</span>
            </div>
            <div key={secondsRemaining} className="text-5xl font-bold text-red-600 tabular-nums">
              {secondsRemaining}s
            </div>
            <p className="text-sm text-gray-600 text-center mt-2">
              Click to keep your session active, or you will be automatically logged out.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={onExtendSession} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            Keep Me Active
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
