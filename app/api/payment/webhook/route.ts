import { type NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/app/actions/payment-actions"

/**
 * Razorpay webhook endpoint for payment verification (optional)
 * Note: Razorpay payments are verified via signature in /api/payment/verify
 * This webhook can be used for additional server-to-server notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Razorpay webhook received:", body.event)

    // Razorpay webhook format: body.event, body.payload
    // Common events: payment.captured, payment.failed, order.paid
    
    if (body.event === "payment.captured" || body.event === "order.paid") {
      const payment = body.payload?.payment?.entity || body.payload?.order?.entity
      
      console.log("[v0] Payment webhook - Order ID:", payment?.order_id, "Payment ID:", payment?.id)
      
      // Payment is already verified in /api/payment/verify
      // This is just for logging/monitoring
      return NextResponse.json({ status: "ok", message: "Webhook received" }, { status: 200 })
    }

    return NextResponse.json({ status: "ok", message: "Event received" }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ status: "error", message: "Webhook processing failed" }, { status: 500 })
  }
}
