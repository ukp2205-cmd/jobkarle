"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, ArrowRight, AlertCircle } from "lucide-react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id") || searchParams.get("txnid")
  const [paymentStatus, setPaymentStatus] = useState<"success" | "checking" | "failed">("checking")

  console.log("[v0] Payment success page loaded with order_id:", orderId)
  console.log("[v0] All URL params:", Object.fromEntries(searchParams.entries()))

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (!orderId) {
        console.error("[v0] No order_id or txnid parameter found in URL")
        setPaymentStatus("failed")
        return
      }

      try {
        console.log("[v0] Verifying payment status for order:", orderId)
        const response = await fetch(`/api/payment/check-status?order_id=${orderId}`)
        const data = await response.json()

        console.log("[v0] Payment status response:", data)

        if (data.success && data.status === "success") {
          console.log("[v0] Payment verified successfully")
          setPaymentStatus("success")
        } else {
          console.error("[v0] Payment verification failed:", data.message, "Status:", data.status)
          // If payment is not successful, redirect to failure page
          router.push(
            `/employer/payment/failure?message=${encodeURIComponent(data.message || "Payment failed")}&txnid=${orderId}`,
          )
        }
      } catch (error) {
        console.error("[v0] Error verifying payment status:", error)
        setPaymentStatus("failed")
      }
    }

    verifyPaymentStatus()
  }, [orderId, router])

  if (paymentStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600">Verifying your payment...</p>
        </Card>
      </div>
    )
  }

  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">We couldn't verify your payment. Please try again or contact support.</p>
          <Link href="/employer/pricing">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Back to Pricing
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your credits have been added to your account. You can now start posting jobs.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
            <p className="text-sm font-mono text-gray-900">{orderId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/employer/dashboard">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/employer/post-job">
            <Button variant="outline" className="w-full bg-transparent">
              Post a Job
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
