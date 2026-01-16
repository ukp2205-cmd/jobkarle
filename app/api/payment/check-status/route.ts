import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    console.log("[v0] Checking payment status for order:", orderId)

    if (!orderId) {
      console.error("[v0] No order_id provided to check-status API")
      return NextResponse.json({ success: false, message: "No order ID provided" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: transaction, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("merchant_transaction_id", orderId)
      .single()

    if (error) {
      console.error("[v0] Database error checking transaction:", error)
    }

    if (!transaction) {
      console.log("[v0] Transaction not found for order:", orderId)
      return NextResponse.json(
        {
          success: false,
          message: "Payment is being processed. Please wait a moment.",
          status: "processing",
        },
        { status: 202 },
      )
    }

    console.log("[v0] Transaction found with status:", transaction.status)

    if (transaction.status === "success") {
      return NextResponse.json({ success: true, status: "success" })
    } else if (transaction.status === "pending") {
      const createdAt = new Date(transaction.created_at).getTime()
      const now = Date.now()
      const fiveMinutesAgo = now - 5 * 60 * 1000

      if (createdAt > fiveMinutesAgo) {
        // Transaction is recent, payment might still be processing
        return NextResponse.json(
          { success: false, message: "Payment is being processed. Please wait.", status: "processing" },
          { status: 202 },
        )
      } else {
        // Old pending transaction - likely abandoned
        return NextResponse.json(
          { success: false, message: "Payment was not completed", status: "abandoned" },
          { status: 400 },
        )
      }
    } else {
      return NextResponse.json(
        { success: false, message: `Payment ${transaction.status}`, status: transaction.status },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Payment status check error:", error)
    return NextResponse.json({ success: false, message: "Error checking payment status" }, { status: 500 })
  }
}
