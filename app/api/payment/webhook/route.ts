import { type NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/app/actions/payment-actions"

/**
 * Cashfree webhook endpoint for payment verification
 * This handles server-to-server callbacks from Cashfree after payment completion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Cashfree webhook received")

    // Extract payment details from Cashfree webhook response
    const paymentResponse = {
      orderId: body.data?.order?.order_id,
      orderAmount: body.data?.order?.order_amount,
      referenceId: body.data?.payment?.cf_payment_id,
      paymentStatus: body.data?.payment?.payment_status,
      paymentMethod: body.data?.payment?.payment_method,
      rawResponse: body,
    }

    console.log(
      "[v0] Webhook payment details - Order ID:",
      paymentResponse.orderId,
      "Status:",
      paymentResponse.paymentStatus,
    )

    // Verify the payment
    const result = await verifyPayment(paymentResponse)

    if (result.success) {
      console.log("[v0] Webhook payment verification successful for order:", paymentResponse.orderId)
      return NextResponse.json({ status: "ok", message: "Payment verified successfully" }, { status: 200 })
    } else {
      console.error("[v0] Webhook payment verification failed:", result.message)
      return NextResponse.json({ status: "error", message: result.message }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ status: "error", message: "Webhook processing failed" }, { status: 500 })
  }
}
