"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Gift, Sparkles } from "lucide-react"

interface FreeCreditsToastProps {
  isOpen: boolean
  creditsAllocated: number
}

export function FreeCreditsToast({ isOpen, creditsAllocated }: FreeCreditsToastProps) {
  const [open, setOpen] = useState(isOpen)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    setOpen(isOpen)
    setCountdown(10)
  }, [isOpen])

  useEffect(() => {
    if (!open) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setOpen(false)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-2 border-green-500">
        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-full">
              <Gift className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h2 className="text-2xl font-bold text-green-700">Congratulations!</h2>
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-800">
                {creditsAllocated} Free Credits Added to Your Account!
              </p>
              <p className="text-sm text-gray-600">
                Monthly quota activated successfully
              </p>
            </div>
            
            <div className="pt-4 space-y-1">
              <p className="text-base font-medium text-gray-700">
                Your free job posting can start now!
              </p>
              <p className="text-xs text-gray-500">
                Automatically closing in {countdown} seconds...
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
