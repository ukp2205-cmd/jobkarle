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
 * Initiate payment with Cashfree
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

    const amount = plan.price
    console.log("[v0] Plan details - Amount:", amount, "Credits:", plan.credits_allocated)

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${employerId.substring(0, 8)}`

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        employer_id: employerId,
        merchant_transaction_id: orderId,
        amount: amount,
        plan_type: planType,
        billing_cycle: billingCycle,
        status: "pending",
        payment_gateway: "cashfree",
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      console.error("[v0] Failed to create transaction:", transactionError)
      return { success: false, message: "Failed to create payment transaction" }
    }

    console.log("[v0] Created transaction:", transaction.id)

    // Get Cashfree credentials from environment
    const clientId = process.env.CASHFREE_CLIENT_ID
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET
    const mode = process.env.CASHFREE_MODE || "production"

    if (!clientId || !clientSecret) {
      console.error("[v0] Cashfree credentials not configured")
      return { success: false, message: "Payment gateway not configured" }
    }

    // Use the environment mode (production credentials with production API)
    const sandboxMode = mode === "sandbox"
    const cashfreeUrl = sandboxMode
      ? "https://sandbox.cashfree.com/pg/orders"
      : "https://api.cashfree.com/pg/orders"

    console.log("[v0] Using Cashfree mode:", mode, "sandboxMode:", sandboxMode, "URL:", cashfreeUrl)

    // Get the actual deployment URL from Vercel environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   "https://job-karle-mfewsz767-ukp2205-2966s-projects.vercel.app"
    
    console.log("[v0] Using base URL for payment:", baseUrl)

    // Create Cashfree order
    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: employerId,
        customer_name: employerName,
        customer_email: employerEmail,
        customer_phone: employerPhone,
      },
      order_meta: {
        return_url: `${baseUrl}/employer/payment/success?order_id=${orderId}`,
        notify_url: `${baseUrl}/api/payment/webhook`,
      },
    }

    console.log("[v0] Creating Cashfree order with return_url:", orderPayload.order_meta.return_url)

    const response = await fetch(cashfreeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(orderPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Cashfree API error:", response.status, errorText)
      return { success: false, message: "Failed to create payment order" }
    }

    const cashfreeOrder = await response.json()
    console.log("[v0] Cashfree order created:", cashfreeOrder.order_id)

    // Update transaction with payment session ID
    await supabase
      .from("payment_transactions")
      .update({
        transaction_id: cashfreeOrder.cf_order_id,
        response_data: cashfreeOrder,
      })
      .eq("id", transaction.id)

    return {
      success: true,
      paymentSessionId: cashfreeOrder.payment_session_id,
      orderId: orderId,
      sandboxMode,
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
