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
          console.log("[v0] ========== PAYMENT HANDLER CALLED ==========")
          console.log("[v0] Razorpay response:", JSON.stringify(response, null, 2))
          console.log("[v0] Order ID:", response.razorpay_order_id)
          console.log("[v0] Payment ID:", response.razorpay_payment_id)
          console.log("[v0] Signature:", response.razorpay_signature)
          
          // Prevent modal from closing during verification
          setLoading(true)
          
          try {
            console.log("[v0] Sending verification request to /api/payment/verify...")
            
            // Verify payment on server
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: response.razorpay_order_id, // Use Razorpay order ID for lookup
            }
            
            console.log("[v0] Verification payload:", JSON.stringify(verifyPayload, null, 2))
            
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(verifyPayload),
            })
            
            console.log("[v0] Verification API response status:", verifyResponse.status)
            
            if (!verifyResponse.ok) {
              const errorText = await verifyResponse.text()
              console.error("[v0] Verification API error:", errorText)
              throw new Error(`Verification failed with status ${verifyResponse.status}`)
            }
            
            const verifyResult = await verifyResponse.json()
            console.log("[v0] Verification result:", JSON.stringify(verifyResult, null, 2))
            
            if (verifyResult.success) {
              console.log("[v0] ✓✓✓ PAYMENT VERIFIED SUCCESSFULLY ✓✓✓")
              console.log("[v0] Credits added to account:", verifyResult.credits_added)
              console.log("[v0] Redirecting to dashboard in 1 second...")
              
              // Show success message before redirect
              alert(`Payment successful! ${verifyResult.credits_added} credit(s) added to your account.`)
              
              // Redirect to dashboard
              setTimeout(() => {
                window.location.href = `/employer/dashboard?payment_success=true&credits_added=${verifyResult.credits_added}`
              }, 1000)
            } else {
              console.error("[v0] ❌ Payment verification failed:", verifyResult.message)
              alert(`Payment verification failed: ${verifyResult.message}\nPayment ID: ${response.razorpay_payment_id}\nPlease contact support.`)
              setError(`Payment verification failed. Payment ID: ${response.razorpay_payment_id}`)
              setLoading(false)
            }
          } catch (error: any) {
            console.error("[v0] ❌ Exception during verification:", error)
            console.error("[v0] Error stack:", error.stack)
            alert(`Verification error: ${error.message}\nPayment ID: ${response.razorpay_payment_id}\nPlease contact support.`)
            setError(`Verification error. Payment ID: ${response.razorpay_payment_id}. Contact support.`)
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            console.log("[v0] ========== PAYMENT MODAL DISMISSED ==========")
            console.log("[v0] Payment cancelled or closed by user")
            setError("Payment was cancelled")
            setLoading(false)
          },
          escape: false, // Prevent closing with escape key during payment
          backdropclose: false, // Prevent closing by clicking outside
        },
      }

      console.log("[v0] Creating Razorpay instance...")
      console.log("[v0] Razorpay Key ID:", razorpayOptions.key)
      console.log("[v0] Razorpay Order ID:", razorpayOptions.order_id)
      console.log("[v0] Amount in paise:", razorpayOptions.amount)
      console.log("[v0] Handler function defined:", typeof razorpayOptions.handler === 'function')
      
      const rzp = new RazorpaySDK(razorpayOptions)
      
      console.log("[v0] Razorpay instance created successfully")
      
      // Add error event listener
      rzp.on('payment.failed', function (response: any) {
        console.log("[v0] ========== PAYMENT FAILED ==========")
        console.log("[v0] Error:", response.error)
        console.log("[v0] Error code:", response.error.code)
        console.log("[v0] Error description:", response.error.description)
        console.log("[v0] Error source:", response.error.source)
        console.log("[v0] Error step:", response.error.step)
        console.log("[v0] Error reason:", response.error.reason)
        
        setError(`Payment failed: ${response.error.description || response.error.reason}`)
        setLoading(false)
      })
      
      console.log("[v0] Opening Razorpay checkout modal...")
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
