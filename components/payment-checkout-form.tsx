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
    const loadRazorpaySDK = () => {
      // Check if SDK already loaded globally
      if ((window as any).Razorpay) {
        console.log("[v0] Razorpay SDK already available globally")
        setSdkLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => {
        console.log("[v0] Razorpay SDK loaded successfully")
        setSdkLoaded(true)
      }
      script.onerror = () => {
        console.error("[v0] Failed to load Razorpay SDK")
        setError("Payment system temporarily unavailable. Please try again in a moment.")
      }
      document.body.appendChild(script)
    }

    loadRazorpaySDK()

    return () => {
      // Cleanup scripts on unmount
      const scripts = document.querySelectorAll('script[src*="razorpay"]')
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

      // Calculate GST and grand total inside the function
      const GST_RATE = 0.18
      const baseAmount = amount // Base amount received from pricing page
      const gstAmount = parseFloat((baseAmount * GST_RATE).toFixed(2))
      const grandTotal = parseFloat((baseAmount + gstAmount).toFixed(2))

      console.log("[v0] ========== PAYMENT INITIATION ==========")
      console.log("[v0] Base amount:", baseAmount)
      console.log("[v0] GST (18%):", gstAmount)
      console.log("[v0] Grand Total with GST:", grandTotal)

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
          amount: grandTotal, // Send total including GST to Razorpay
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

      if (!result.razorpayOrderId) {
        console.error("[v0] No Razorpay order ID received from server")
        setError("Payment order not created. Please try again.")
        setLoading(false)
        return
      }

      console.log("[v0] Opening Razorpay checkout with order ID:", result.razorpayOrderId)

      const RazorpaySDK = (window as any).Razorpay
      if (!RazorpaySDK) {
        console.error("[v0] Razorpay SDK not available on window object")
        setError("Payment SDK not initialized. Please refresh and try again.")
        setLoading(false)
        return
      }

      // Razorpay checkout options
      const razorpayOptions = {
        key: result.keyId, // Key ID comes from server response
        amount: result.amount, // Amount in paise
        currency: result.currency,
        name: "JobKarle",
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan - ${billingCycle}`,
        order_id: result.razorpayOrderId,
        prefill: {
          name: employerName,
          email: employerEmail,
          contact: employerPhone,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async function (response: any) {
          console.log("[v0] Payment captured successfully:", response)
          
          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: result.orderId,
              }),
            })
            
            if (!verifyResponse.ok) {
              console.error("[v0] Verification API returned error:", verifyResponse.status)
              throw new Error("Verification request failed")
            }
            
            const verifyResult = await verifyResponse.json()
            console.log("[v0] Verification result:", verifyResult)
            
            if (verifyResult.success) {
              console.log("[v0] ✓ Payment verified successfully!")
              console.log("[v0] Credits added:", verifyResult.credits_added)
              console.log("[v0] Redirecting to employer dashboard...")
              window.location.href = `/employer/dashboard?payment_success=true&credits_added=${verifyResult.credits_added}`
            } else {
              console.error("[v0] Payment verification failed:", verifyResult.message)
              setError(`Payment verification failed: ${verifyResult.message}. Please contact support with payment ID: ${response.razorpay_payment_id}`)
              setLoading(false)
            }
          } catch (error: any) {
            console.error("[v0] Error during verification:", error)
            setError(`Verification error: ${error.message}. Your payment ID: ${response.razorpay_payment_id}. Please contact support.`)
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            console.log("[v0] Payment cancelled by user")
            setError("Payment was cancelled")
            setLoading(false)
          },
        },
      }

      const rzp = new RazorpaySDK(razorpayOptions)
      rzp.open()
    } catch (err: any) {
      console.error("[v0] Payment error:", err)
      setError(err.message || "Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  // Amount is BASE price from pricing page, we need to ADD GST
  const GST_RATE = 0.18
  const baseAmount = amount // This is the base amount
  const gstAmount = parseFloat((baseAmount * GST_RATE).toFixed(2))
  const grandTotal = parseFloat((baseAmount + gstAmount).toFixed(2))

  console.log("[v0] Payment Summary - Base amount:", baseAmount, "GST (18%):", gstAmount, "Grand Total:", grandTotal)

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
          <span className="font-medium">₹{baseAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">GST (18%):</span>
          <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold border-t pt-3">
          <span>Grand Total:</span>
          <span className="text-blue-600">₹{grandTotal.toFixed(2)}</span>
        </div>
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
        Secure payment powered by Razorpay. Your payment information is encrypted and secure.
      </p>
    </Card>
  )
}
