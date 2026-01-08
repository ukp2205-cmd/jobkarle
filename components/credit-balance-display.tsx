"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp } from "lucide-react"
import { getActiveCredits, type CreditBalance } from "@/app/actions/credits-actions"
import Link from "next/link"

interface CreditBalanceDisplayProps {
  employerId: string
  showUpgradeButton?: boolean
}

export function CreditBalanceDisplay({ employerId, showUpgradeButton = true }: CreditBalanceDisplayProps) {
  const [credits, setCredits] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCredits()
  }, [employerId])

  async function loadCredits() {
    setLoading(true)
    const balance = await getActiveCredits(employerId)
    setCredits(balance)
    setLoading(false)
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-6 bg-muted rounded w-16"></div>
        </div>
      </Card>
    )
  }

  if (!credits) {
    return null
  }

  const percentageRemaining = credits.totalCredits > 0 ? (credits.remainingCredits / credits.totalCredits) * 100 : 0
  const isLowCredits = credits.remainingCredits <= 2

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLowCredits ? "bg-orange-100" : "bg-blue-100"}`}>
            <Sparkles className={`w-5 h-5 ${isLowCredits ? "text-orange-600" : "text-blue-600"}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{credits.remainingCredits}</span>
              <span className="text-sm text-muted-foreground">/ {credits.totalCredits}</span>
            </div>
            <p className="text-xs text-muted-foreground">Job credits</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <div className="w-24 bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  isLowCredits ? "bg-orange-500" : "bg-gradient-to-r from-blue-500 to-purple-500"
                }`}
                style={{ width: `${percentageRemaining}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">{credits.usedCredits} used</p>
          </div>

          {showUpgradeButton && isLowCredits && (
            <Link href="/employer/pricing">
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isLowCredits && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-xs text-orange-700">
            <strong>Low credits!</strong> Only {credits.remainingCredits}{" "}
            {credits.remainingCredits === 1 ? "credit" : "credits"} remaining. Each job post requires 2 credits.
          </p>
        </div>
      )}
    </Card>
  )
}
