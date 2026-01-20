import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body

    console.log("[v0] ========== PAYMENT VERIFICATION STARTED ==========")
    console.log("[v0] Razorpay Order ID:", razorpay_order_id)
    console.log("[v0] Razorpay Payment ID:", razorpay_payment_id)
    console.log("[v0] Our Order ID:", orderId)

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

    console.log("[v0] Signature comparison - Received:", razorpay_signature.substring(0, 10) + "...")
    console.log("[v0] Signature comparison - Generated:", generatedSignature.substring(0, 10) + "...")

    if (generatedSignature !== razorpay_signature) {
      console.error("[v0] ❌ Signature verification FAILED")
      return NextResponse.json({ success: false, message: "Payment signature verification failed" }, { status: 400 })
    }

    console.log("[v0] ✓ Signature verified successfully")

    // Update transaction status in database
    const supabase = createAdminClient()

    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("transaction_id", orderId)
      .single()

    if (txError || !transaction) {
      console.error("[v0] Transaction not found for order ID:", orderId)
      console.error("[v0] Database error:", txError)
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 })
    }
    
    console.log("[v0] Transaction found:", transaction.id, "Plan:", transaction.plan_type, "Credits:", transaction.credits)

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

    console.log("[v0] Adding credits - Employer:", transaction.employer_id, "Credits:", transaction.credits, "Plan:", transaction.plan_type)

    const { data: creditRecord, error: creditsError } = await supabase.from("employer_credits").insert({
      employer_id: transaction.employer_id,
      credits_allocated: transaction.credits,
      credits_used: 0,
      credits_remaining: transaction.credits,
      plan_type: transaction.plan_type,
      billing_cycle: transaction.billing_cycle || "monthly",
      allocated_at: new Date().toISOString(),
      payment_transaction_id: transaction.id,
      is_expired: false,
      expires_at: expiryDate.toISOString(),
    }).select()

    if (creditsError) {
      console.error("[v0] ❌ Error adding credits:", creditsError.message)
      console.error("[v0] Full error:", creditsError)
      return NextResponse.json({ success: false, message: `Failed to add credits: ${creditsError.message}` }, { status: 500 })
    }
    
    console.log("[v0] ✓ Credits added successfully, record ID:", creditRecord?.[0]?.id)

    console.log("[v0] ✓ Payment verified and credits added successfully")
    console.log("[v0] ========== PAYMENT VERIFICATION COMPLETED ==========")

    return NextResponse.json({ 
      success: true, 
      message: "Payment verified successfully",
      credits_added: transaction.credits,
      transaction_id: transaction.id
    })
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
