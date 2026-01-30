"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { allocateCredits, type PlanType } from "./credits-actions"

interface PaymentResponse {
  orderId: string
  orderAmount: number
  referenceId: string
  paymentStatus: string
  paymentMethod: string
  rawResponse: any
}

interface InitiatePaymentParams {
  employerId: string
  planType: string
  billingCycle: string
  employerName: string
  employerEmail: string
  employerPhone: string
}

/**
 * Initiate payment with Razorpay
 */
export async function initiatePayment(params: InitiatePaymentParams) {
  const supabase = createAdminClient()

  try {
    const { employerId, planType, billingCycle, employerName, employerEmail, employerPhone } = params

    console.log("[v0] Initiating payment for employer:", employerId, "plan:", planType)

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("slug", planType)
      .maybeSingle()

    if (planError) {
      console.error("[v0] Error fetching plan:", planError)
      return { success: false, message: "Error fetching plan details" }
    }

    if (!plan) {
      console.error("[v0] Plan not found for slug:", planType)
      return { success: false, message: `Plan '${planType}' not found. Please contact support.` }
    }

    // Calculate amount with GST
    const baseAmount = plan.price
    const GST_RATE = 0.18 // 18% GST
    const gstAmount = parseFloat((baseAmount * GST_RATE).toFixed(2))
    const amount = parseFloat((baseAmount + gstAmount).toFixed(2))
    const amountInPaise = Math.round(amount * 100) // Convert to paise for database storage

    console.log("[v0] Plan details - Base:", baseAmount, "GST:", gstAmount, "Total:", amount, "Paise:", amountInPaise, "Credits:", plan.credits_allocated)

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${employerId.substring(0, 8)}`

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        employer_id: employerId,
        merchant_transaction_id: orderId,
        amount: amountInPaise, // Store amount in paise (integer)
        plan_type: planType,
        billing_cycle: billingCycle,
        status: "pending",
        payment_gateway: "razorpay",
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      console.error("[v0] Failed to create transaction:", transactionError)
      return { success: false, message: "Failed to create payment transaction" }
    }

    console.log("[v0] Created transaction:", transaction.id)

    // Get Razorpay credentials from environment
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      console.error("[v0] Razorpay credentials not configured")
      return { success: false, message: "Payment gateway not configured" }
    }

    console.log("[v0] Using Razorpay for payment processing")

    // Create Razorpay order
    const razorpayUrl = "https://api.razorpay.com/v1/orders"
    
    console.log("[v0] ========== RAZORPAY ORDER CREATION ==========")
    console.log("[v0] Amount received from frontend (INR):", amount)
    console.log("[v0] Amount in paise for Razorpay:", amountInPaise)
    console.log("[v0] Expected: ₹5 base should be ₹5.90 with GST = 590 paise")
    
    const orderPayload = {
      amount: amountInPaise,
      currency: "INR",
      receipt: orderId,
      notes: {
        employer_id: employerId,
        employer_name: employerName,
        employer_email: employerEmail,
        plan_type: planType,
        credits: plan.credits_allocated,
      },
    }

    console.log("[v0] Creating Razorpay order with payload:", JSON.stringify(orderPayload, null, 2))

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

    const response = await fetch(razorpayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(orderPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Razorpay API error:", response.status, errorText)
      return { success: false, message: "Failed to create payment order" }
    }

    const razorpayOrder = await response.json()
    console.log("[v0] Razorpay order created:", razorpayOrder.id)

    // Update transaction with Razorpay order ID and credits info
    await supabase
      .from("payment_transactions")
      .update({
        transaction_id: razorpayOrder.id,
        response_data: {
          ...razorpayOrder,
          credits: plan.credits_allocated, // Store credits in response_data
        },
      })
      .eq("id", transaction.id)

    return {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      orderId: orderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: keyId, // Send key ID for client-side initialization
    }
  } catch (error: any) {
    console.error("[v0] Payment initiation error:", error)
    return { success: false, message: error.message || "Payment initiation failed" }
  }
}

/**
 * Verify payment and allocate credits to employer
 */
export async function verifyPayment(paymentResponse: PaymentResponse) {
  const supabase = createAdminClient()

  try {
    console.log("[v0] Verifying payment for order:", paymentResponse.orderId)

    // Find the payment transaction by order ID
    const { data: transaction, error: fetchError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("merchant_transaction_id", paymentResponse.orderId)
      .single()

    if (fetchError || !transaction) {
      console.error("[v0] Transaction not found:", fetchError)
      return { success: false, message: "Transaction not found" }
    }

    console.log("[v0] Found transaction:", transaction.id, "for employer:", transaction.employer_id)

    // Check if payment is successful
    if (paymentResponse.paymentStatus !== "SUCCESS") {
      console.log("[v0] Payment not successful, status:", paymentResponse.paymentStatus)
      
      // Update transaction status to failed
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          payment_id: paymentResponse.referenceId,
          response_data: paymentResponse.rawResponse,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      return { success: false, message: "Payment failed" }
    }

    // Payment is successful - allocate credits
    console.log("[v0] Payment successful, allocating credits to employer:", transaction.employer_id)

    const planType = transaction.plan_type as PlanType
    const creditResult = await allocateCredits(transaction.employer_id, planType)

    if (!creditResult.success) {
      console.error("[v0] Failed to allocate credits:", creditResult.message)
      return { success: false, message: "Failed to allocate credits" }
    }

    // Update transaction status to completed
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        payment_id: paymentResponse.referenceId,
        response_data: paymentResponse.rawResponse,
        completed_at: new Date().toISOString(),
        allocated_credit_id: creditResult.creditId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("[v0] Failed to update transaction:", updateError)
      // Credits are allocated, so we still return success
    }

    console.log("[v0] Payment verification and credit allocation successful")
    return { success: true, message: "Payment verified and credits allocated" }
  } catch (error: any) {
    console.error("[v0] Payment verification error:", error)
    return { success: false, message: error.message || "Payment verification failed" }
  }
}

/**
 * Check payment status by order ID
 */
export async function checkPaymentStatus(orderId: string) {
  const supabase = createAdminClient()

  try {
    const { data: transaction, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("merchant_transaction_id", orderId)
      .single()

    if (error || !transaction) {
      return { success: false, message: "Transaction not found" }
    }

    return {
      success: true,
      status: transaction.status,
      amount: transaction.amount,
      planType: transaction.plan_type,
    }
  } catch (error: any) {
    console.error("[v0] Error checking payment status:", error)
    return { success: false, message: error.message }
  }
}
