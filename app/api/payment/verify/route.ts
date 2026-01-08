import { type NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/app/actions/payment-actions"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Cashfree callback received - Order ID:", body.data?.order?.order_id)

    // Extract payment details from Cashfree response
    const paymentResponse = {
      orderId: body.data?.order?.order_id,
      orderAmount: body.data?.order?.order_amount,
      referenceId: body.data?.payment?.cf_payment_id,
      paymentStatus: body.data?.payment?.payment_status,
      paymentMethod: body.data?.payment?.payment_method,
      rawResponse: body,
    }

    const result = await verifyPayment(paymentResponse)

    // Redirect based on payment status
    if (result.success) {
      return NextResponse.redirect(new URL(`/employer/payment/success?txnid=${paymentResponse.orderId}`, request.url))
    } else {
      return NextResponse.redirect(
        new URL(
          `/employer/payment/failure?txnid=${paymentResponse.orderId}&message=${encodeURIComponent(result.message)}`,
          request.url,
        ),
      )
    }
  } catch (error: any) {
    console.error("[v0] Payment verification API error:", error)
    return NextResponse.redirect(new URL("/employer/payment/failure?message=Verification+error", request.url))
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    console.log("[v0] Payment success redirect received - Order ID:", orderId)

    if (!orderId) {
      return NextResponse.redirect(new URL("/employer/payment/failure?message=No+order+ID", request.url))
    }

    const supabase = createAdminClient()

    const { data: transaction, error } = await supabase
      .from("payment_transactions")
      .select("status")
      .eq("merchant_transaction_id", orderId)
      .single()

    if (error || !transaction) {
      console.log("[v0] Transaction not found for order:", orderId)
      return NextResponse.redirect(
        new URL(`/employer/payment/failure?message=Transaction+not+found&txnid=${orderId}`, request.url),
      )
    }

    // Only redirect to success if payment status is actually "success"
    if (transaction.status === "success") {
      return NextResponse.redirect(new URL(`/employer/payment/success?txnid=${orderId}`, request.url))
    } else if (transaction.status === "pending") {
      // Payment is still pending - show failure since user left checkout
      return NextResponse.redirect(
        new URL(`/employer/payment/failure?message=Payment+abandoned&txnid=${orderId}`, request.url),
      )
    } else {
      // Payment failed or has other status
      return NextResponse.redirect(
        new URL(`/employer/payment/failure?message=Payment+${transaction.status}&txnid=${orderId}`, request.url),
      )
    }
  } catch (error: any) {
    console.error("[v0] Payment redirect error:", error)
    return NextResponse.redirect(new URL("/employer/payment/failure?message=Error+processing+payment", request.url))
  }
}
