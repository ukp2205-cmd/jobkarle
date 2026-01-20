import { type NextRequest, NextResponse } from "next/server"
import { initiatePayment } from "@/app/actions/payment-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employerId, planType, billingCycle, employerName, employerEmail, employerPhone } = body

    console.log("[v0] Payment initiate request body:", {
      employerId,
      planType,
      billingCycle,
      employerName,
      employerEmail,
      employerPhone,
    })

    // Validate required fields
    if (!employerId || !planType || !billingCycle || !employerName || !employerEmail || !employerPhone) {
      console.error("[v0] Missing required fields in payment request")
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Initiating Razorpay payment for employer:", employerId)

    const result = await initiatePayment({
      employerId,
      planType,
      billingCycle,
      employerName,
      employerEmail,
      employerPhone,
    })

    console.log("[v0] Payment initiation result:", result)

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Payment initiation API error details:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    })
    return NextResponse.json(
      { success: false, message: "Internal server error. Please try again later." },
      { status: 500 },
    )
  }
}
