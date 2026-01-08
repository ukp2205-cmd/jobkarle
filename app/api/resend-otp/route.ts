import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { formatPhoneNumber } from "@/lib/otp-utils"

// Cooldown period in seconds (30 seconds)
const COOLDOWN_PERIOD = 30

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    console.log("[v0] resend-otp: Received resend request for phone:", phoneNumber)

    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    console.log("[v0] resend-otp: Formatted phone:", formattedPhone)

    // Check cooldown period
    const supabase = await createClient()
    const { data: existingOTP } = await supabase
      .from("phone_verifications")
      .select("created_at")
      .eq("phone_number", formattedPhone)
      .single()

    if (existingOTP) {
      const createdAt = new Date(existingOTP.created_at)
      const now = new Date()
      const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000

      if (secondsSinceCreation < COOLDOWN_PERIOD) {
        const remainingSeconds = Math.ceil(COOLDOWN_PERIOD - secondsSinceCreation)
        console.log("[v0] resend-otp: Cooldown active, remaining seconds:", remainingSeconds)

        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
          },
          { status: 429 },
        )
      }
    }

    console.log("[v0] resend-otp: Cooldown passed, forwarding to send-otp logic")

    // Forward to send-otp endpoint
    const baseUrl = request.nextUrl.origin
    const sendOTPResponse = await fetch(`${baseUrl}/api/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber: formattedPhone }),
    })

    const result = await sendOTPResponse.json()
    console.log("[v0] resend-otp: Result from send-otp:", result)

    return NextResponse.json(result, { status: sendOTPResponse.status })
  } catch (error) {
    console.error("[v0] resend-otp: Unexpected error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
