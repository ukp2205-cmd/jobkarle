"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"

interface PaymentCheckoutFormProps {
  employerId: string
  planType: "classic" | "premium"
  billingCycle: "monthly" | "annual"
  employerName: string
  employerEmail: string
  employerPhone: string
  amount: number
}

export function PaymentCheckoutForm({
  employerId,
  planType,
  billingCycle,
  employerName,
  employerEmail,
  employerPhone,
  amount,
}: PaymentCheckoutFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    const loadCashfreeSDK = () => {
      // Check if SDK already loaded globally
      if ((window as any).Cashfree) {
        console.log("[v0] Cashfree SDK already available globally")
        setSdkLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js"
      script.async = true
      script.onload = () => {
        console.log("[v0] Cashfree SDK loaded successfully")
        setSdkLoaded(true)
      }
      script.onerror = () => {
        console.error("[v0] Failed to load Cashfree SDK from official URL")
        setError("Payment system temporarily unavailable. Please try again in a moment.")
      }
      document.body.appendChild(script)
    }

    loadCashfreeSDK()

    return () => {
      // Cleanup scripts on unmount
      const scripts = document.querySelectorAll('script[src*="cashfree"]')
      scripts.forEach((script) => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      })
    }
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!sdkLoaded) {
        setError("Payment system is not ready. Please wait a moment and try again.")
        setLoading(false)
        return
      }

      console.log("[v0] Initiating Cashfree payment")

      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId,
          planType,
          billingCycle,
          employerName,
          employerEmail,
          employerPhone,
          amount,
        }),
      })

      if (!response.ok) {
        console.error("[v0] Payment API returned error status:", response.status)
        const errorData = await response.json()
        console.error("[v0] Payment API error response:", errorData)
        setError(errorData.message || "Failed to initiate payment. Please check your details and try again.")
        setLoading(false)
        return
      }

      const result = await response.json()
      console.log("[v0] Payment initiate response:", result)

      if (!result.success) {
        setError(result.message || "Failed to initiate payment")
        setLoading(false)
        return
      }

      if (!result.paymentSessionId) {
        console.error("[v0] No payment session ID received from server")
        setError("Payment session not created. Please try again.")
        setLoading(false)
        return
      }

      console.log("[v0] Opening Cashfree checkout with session ID:", result.paymentSessionId)

      const cashfreeSDK = (window as any).Cashfree
      if (!cashfreeSDK) {
        console.error("[v0] Cashfree SDK not available on window object")
        setError("Payment SDK not initialized. Please refresh and try again.")
        setLoading(false)
        return
      }

      // Initialize Cashfree SDK
      const cashfree = cashfreeSDK({
        mode: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      })

      // Open Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: result.paymentSessionId,
        redirectTarget: "_self", // Redirect to return_url after payment
      }

      await cashfree.checkout(checkoutOptions)
    } catch (err: any) {
      console.error("[v0] Payment error:", err)
      setError(err.message || "Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const GST_RATE = 0.18
  const gstAmount = Math.round(amount * GST_RATE)
  const grandTotal = amount + gstAmount

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Plan:</span>
          <span className="font-medium">
            {planType.charAt(0).toUpperCase() + planType.slice(1)} ({billingCycle})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">₹{amount.toLocaleString("en-IN")}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">GST (18%):</span>
          <span className="font-medium">₹{gstAmount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <span className="text-gray-900 font-semibold">Grand Total:</span>
          <span className="text-lg font-bold text-blue-600">₹{grandTotal.toLocaleString("en-IN")}</span>
        </div>
        {/* </CHANGE> */}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button onClick={handlePayment} disabled={loading || !sdkLoaded} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : !sdkLoaded ? (
          "Loading Payment System..."
        ) : (
          "Proceed to Payment"
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Secure payment powered by Cashfree. Your payment information is encrypted and secure.
      </p>
    </Card>
  )
}
