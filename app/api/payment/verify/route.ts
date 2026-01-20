import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body

    console.log("[v0] Verifying Razorpay payment:", { razorpay_order_id, razorpay_payment_id, orderId })

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      console.error("[v0] RAZORPAY_KEY_SECRET not configured")
      return NextResponse.json({ success: false, message: "Payment gateway not configured" }, { status: 500 })
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (generatedSignature !== razorpay_signature) {
      console.error("[v0] Signature verification failed")
      return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 400 })
    }

    console.log("[v0] Signature verified successfully")

    // Update transaction status in database
    const supabase = createAdminClient()

    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (txError || !transaction) {
      console.error("[v0] Transaction not found:", orderId)
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 })
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "success",
        payment_id: razorpay_payment_id,
        response_data: {
          ...transaction.response_data,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("[v0] Error updating transaction:", updateError)
      return NextResponse.json({ success: false, message: "Failed to update transaction" }, { status: 500 })
    }

    // Add credits to employer
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30) // Credits valid for 30 days

    const { error: creditsError } = await supabase.from("employer_credits").insert({
      employer_id: transaction.employer_id,
      credits_purchased: transaction.credits,
      credits_remaining: transaction.credits,
      plan_type: transaction.plan_type,
      billing_cycle: transaction.billing_cycle || "monthly",
      amount_paid: transaction.amount,
      payment_transaction_id: transaction.id,
      is_expired: false,
      expires_at: expiryDate.toISOString(),
    })

    if (creditsError) {
      console.error("[v0] Error adding credits:", creditsError)
      return NextResponse.json({ success: false, message: "Failed to add credits" }, { status: 500 })
    }

    console.log("[v0] Payment verified and credits added successfully")

    return NextResponse.json({ success: true, message: "Payment verified successfully" })
  } catch (error: any) {
    console.error("[v0] Error in payment verification:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
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
