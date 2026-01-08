import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    console.log("[v0] Checking payment status for order:", orderId)

    if (!orderId) {
      return NextResponse.json({ success: false, message: "No order ID provided" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: transaction, error } = await supabase
      .from("payment_transactions")
      .select("status")
      .eq("merchant_transaction_id", orderId)
      .single()

    if (error || !transaction) {
      console.log("[v0] Transaction not found for order:", orderId)
      return NextResponse.json({ success: false, message: "Payment not found", status: "not_found" }, { status: 404 })
    }

    if (transaction.status === "success") {
      return NextResponse.json({ success: true, status: "success" })
    } else if (transaction.status === "pending") {
      return NextResponse.json(
        { success: false, message: "Payment abandoned - you left checkout", status: "abandoned" },
        { status: 400 },
      )
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
