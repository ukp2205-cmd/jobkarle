"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"
import { allocateCredits } from "./credits-actions"
import { getPlanDetailsBySlug } from "./plans-actions"

export type BillingCycle = "monthly" | "annual"

interface PaymentInitiationData {
  employerId: string
  planType: string
  billingCycle: BillingCycle
  employerName: string
  employerEmail: string
  employerPhone: string
}

function isSandboxMode(): boolean {
  console.log("[v0] HARDCODED: Using PRODUCTION mode only")
  return false // Always production
}

function getCashfreeApiUrl(): string {
  console.log("[v0] HARDCODED: Using production API URL")
  return "https://api.cashfree.com/pg/orders" // Always production
}

/**
 * Generate Cashfree payment order signature
 */
function generateCashfreeSignature(data: string, clientSecret: string): string {
  return crypto.createHmac("sha256", clientSecret).update(data).digest("base64")
}

/**
 * Initiate payment with Cashfree
 */
export async function initiatePayment(data: PaymentInitiationData) {
  try {
    const supabase = createAdminClient()

    console.log("[v0] Payment initiation for employer:", data.employerId, "plan:", data.planType)

    const planDetails = await getPlanDetailsBySlug(data.planType)

    if (!planDetails || planDetails.price === 0) {
      console.error("[v0] Invalid plan or plan is free:", data.planType)
      return {
        success: false,
        message: "Invalid plan or plan does not require payment.",
      }
    }

    const amount = planDetails.price

    console.log("[v0] Found plan:", planDetails.slug, "Price:", amount)

    // Generate unique order ID
    const orderId = `JOBKARLE_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    const normalizedPlanTypeForDB = planDetails.slug

    // Create payment transaction record
    const { data: paymentRecord, error: insertError } = await supabase
      .from("payment_transactions")
      .insert({
        employer_id: data.employerId,
        plan_type: normalizedPlanTypeForDB,
        payment_gateway: "cashfree",
        billing_cycle: planDetails.billing_cycle,
        amount: amount,
        merchant_transaction_id: orderId,
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating payment transaction:", insertError.message)
      return { success: false, message: "Failed to initiate payment" }
    }

    console.log("[v0] Payment transaction created:", orderId, "with plan type:", normalizedPlanTypeForDB)

    const clientId = process.env.CASHFREE_CLIENT_ID || ""
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET || ""

    if (!clientId || !clientSecret) {
      console.error("[v0] Cashfree credentials missing")
      return { success: false, message: "Payment gateway not configured" }
    }

    console.log("[v0] ========== CASHFREE CREDENTIAL DEBUG ==========")
    console.log("[v0] Client ID length:", clientId.length)
    console.log("[v0] Client Secret length:", clientSecret.length)
    console.log("[v0] Client ID first 12 chars:", clientId.substring(0, 12))
    console.log("[v0] Client ID last 4 chars:", clientId.substring(clientId.length - 4))
    console.log("[v0] Client Secret first 8 chars:", clientSecret.substring(0, 8))
    console.log("[v0] Client ID has whitespace:", /\s/.test(clientId))
    console.log("[v0] Client Secret has whitespace:", /\s/.test(clientSecret))
    console.log("[v0] Client ID format (UUID):", /^[a-f0-9]{8}-[a-f0-9]{4}-/i.test(clientId))

    // Trim any whitespace
    const trimmedClientId = clientId.trim()
    const trimmedClientSecret = clientSecret.trim()

    if (trimmedClientId !== clientId || trimmedClientSecret !== clientSecret) {
      console.warn("[v0] WARNING: Credentials had whitespace! Using trimmed values.")
    }

    const sandboxMode = false // HARDCODED: Always production
    const apiUrl = "https://api.cashfree.com/pg/orders" // HARDCODED: Always production URL
    console.log("[v0] Cashfree mode: PRODUCTION (HARDCODED)")
    console.log("[v0] Cashfree API URL:", apiUrl)
    console.log("[v0] ================================================")

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jobkarle.com"

    // Prepare Cashfree order request
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: data.employerId,
        customer_email: data.employerEmail,
        customer_phone: data.employerPhone.replace(/^\+/, ""), // Remove + prefix from phone
        customer_name: data.employerName,
      },
      order_meta: {
        return_url: `${appUrl}/employer/payment/success?order_id=${orderId}`,
        notify_url: `${appUrl}/api/payment/webhook`,
      },
      order_note: `JobKarle ${planDetails.name} (${amount} INR)`,
    }

    console.log("[v0] Creating Cashfree order:", orderId, "for plan:", planDetails.name)
    console.log("[v0] Order request:", JSON.stringify(orderRequest, null, 2))

    const requestHeaders = {
      "x-client-id": trimmedClientId,
      "x-client-secret": trimmedClientSecret,
      "Content-Type": "application/json",
      "x-api-version": "2025-01-01",
      "x-request-id": `${orderId}_${Date.now()}`,
    }

    console.log("[v0] Request headers (masked secret):", {
      ...requestHeaders,
      "x-client-secret": `${requestHeaders["x-client-secret"].substring(0, 8)}...masked`,
    })

    const cashfreeResponse = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(orderRequest),
    })

    const responseText = await cashfreeResponse.text()
    console.log("[v0] Cashfree raw response:", responseText)

    let cashfreeData
    try {
      cashfreeData = JSON.parse(responseText)
    } catch (e) {
      console.error("[v0] Failed to parse Cashfree response:", responseText)
      return { success: false, message: "Invalid response from payment gateway" }
    }

    if (!cashfreeResponse.ok) {
      console.error("[v0] Cashfree API error:", cashfreeData)
      console.error("[v0] Cashfree API status:", cashfreeResponse.status)
      console.error("[v0] Using API URL:", apiUrl)

      if (cashfreeResponse.status === 401) {
        return {
          success: false,
          message:
            "Payment gateway authentication failed. Please verify your Cashfree API credentials are correct and match the environment (sandbox/production).",
        }
      }

      return {
        success: false,
        message: cashfreeData.message || "Failed to create payment order",
      }
    }

    console.log("[v0] Cashfree order created successfully:", orderId)

    const paymentSessionId = cashfreeData.payment_session_id
    if (!paymentSessionId) {
      console.error("[v0] No payment session ID received from Cashfree")
      return {
        success: false,
        message: "Failed to generate payment link",
      }
    }

    console.log("[v0] Payment session ID generated:", paymentSessionId)

    return {
      success: true,
      orderId: cashfreeData.order_id,
      paymentSessionId: paymentSessionId,
      transactionId: orderId,
      amount: amount,
      sandboxMode: sandboxMode,
    }
  } catch (error: any) {
    console.error("[v0] Payment initiation error:", error)
    return { success: false, message: error.message || "Payment initiation failed" }
  }
}

/**
 * Verify Cashfree payment callback
 */
export async function verifyPayment(paymentResponse: any) {
  try {
    const supabase = createAdminClient()
    const { orderId, orderAmount, referenceId, paymentStatus, paymentMethod } = paymentResponse

    console.log("[v0] Verifying Cashfree payment for order:", orderId)
    console.log("[v0] Payment status received:", paymentStatus)
    console.log("[v0] Full payment response:", JSON.stringify(paymentResponse, null, 2))

    if (!paymentStatus) {
      console.error("[v0] Payment status is empty or null for order:", orderId)
      return { success: false, message: "Payment abandoned - no payment status received" }
    }

    // Fetch transaction from database
    const { data: transaction, error: fetchError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("merchant_transaction_id", orderId)
      .single()

    if (fetchError || !transaction) {
      console.error("[v0] Transaction not found:", orderId)
      return { success: false, message: "Transaction not found" }
    }

    // Verify amount matches
    if (Number.parseInt(orderAmount) !== transaction.amount) {
      console.error("[v0] Amount mismatch for order:", orderId)
      return { success: false, message: "Amount verification failed" }
    }

    const successStatuses = ["SUCCESS", "success", "AUTHORIZED"]
    const failureStatuses = ["FAILED", "failed", "CANCELLED", "cancelled", "ABANDONED", "abandoned"]

    if (successStatuses.includes(paymentStatus)) {
      console.log("[v0] Payment SUCCESSFUL for order:", orderId, "Status:", paymentStatus)

      // Allocate credits to employer
      const creditResult = await allocateCredits(transaction.employer_id, transaction.plan_type)

      if (!creditResult.success) {
        console.error("[v0] Failed to allocate credits after successful payment")
        await supabase
          .from("payment_transactions")
          .update({
            status: "failed",
            error_message: "Credit allocation failed",
            response_data: paymentResponse,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        return {
          success: false,
          message: "Payment successful but credit allocation failed. Please contact support.",
          transactionId: orderId,
        }
      }

      // Update transaction with success status
      await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          payment_id: referenceId,
          allocated_credit_id: creditResult.creditId,
          response_data: paymentResponse,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      // Update employer_credits with payment transaction ID and billing cycle
      await supabase
        .from("employer_credits")
        .update({
          payment_transaction_id: transaction.id,
          billing_cycle: transaction.billing_cycle,
        })
        .eq("id", creditResult.creditId)

      return {
        success: true,
        message: "Payment successful! Credits have been added to your account.",
        transactionId: orderId,
      }
    } else {
      console.log("[v0] Payment FAILED/ABANDONED for order:", orderId, "Status:", paymentStatus)

      // Payment failed, abandoned, or has any non-success status
      const failureReason = failureStatuses.includes(paymentStatus) ? paymentStatus : paymentStatus || "abandoned"

      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          error_message: `Payment ${failureReason}`,
          response_data: paymentResponse,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      return {
        success: false,
        message: `Payment ${failureReason}. Please try again.`,
        transactionId: orderId,
      }
    }
  } catch (error: any) {
    console.error("[v0] Payment verification error:", error)
    return { success: false, message: error.message || "Payment verification failed" }
  }
}

/**
 * Get payment history for an employer
 */
export async function getPaymentHistory(employerId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching payment history:", error)
      return { success: false, message: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Payment history exception:", error)
    return { success: false, message: error.message, data: [] }
  }
}
