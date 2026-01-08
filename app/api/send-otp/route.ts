import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateOTP, hashOTP, formatPhoneNumber, isValidIndianPhone } from "@/lib/otp-utils"

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userType = "candidate" } = await request.json()

    console.log("[v0] send-otp: Received request for phone:", phoneNumber, "userType:", userType)

    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    if (!isValidIndianPhone(phoneNumber)) {
      return NextResponse.json({ success: false, message: "Invalid Indian phone number format" }, { status: 400 })
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    console.log("[v0] send-otp: Formatted phone:", formattedPhone)

    // Check if API key is configured
    if (!TWO_FACTOR_API_KEY) {
      console.error("[v0] send-otp: TWO_FACTOR_API_KEY not configured")
      return NextResponse.json({ success: false, message: "SMS service not configured" }, { status: 500 })
    }

    // Generate OTP
    const otp = generateOTP()
    console.log("[v0] send-otp: Generated OTP:", otp)

    // Hash OTP
    const otpHash = await hashOTP(otp)
    console.log("[v0] send-otp: OTP hashed successfully")

    // Calculate expiry (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const supabase = await createClient()
    const tableName = userType === "employer" ? "employers" : "candidates"

    const { data: allRecords } = await supabase
      .from(tableName)
      .select("id, created_at, mobile_number")
      .eq("mobile_number", formattedPhone)
      .order("created_at", { ascending: false })

    console.log(`[v0] send-otp: Found ${allRecords?.length || 0} record(s) for ${formattedPhone}`)

    if (allRecords && allRecords.length > 1) {
      console.log(`[v0] send-otp: Found ${allRecords.length} duplicate records, cleaning up...`)
      const keepRecord = allRecords[0]
      const idsToDelete = allRecords.slice(1).map((r) => r.id)

      console.log(`[v0] send-otp: Keeping record ID: ${keepRecord.id}, created at: ${keepRecord.created_at}`)
      console.log(`[v0] send-otp: Deleting ${idsToDelete.length} older records`)

      const { error: deleteError } = await supabase.from(tableName).delete().in("id", idsToDelete)

      if (deleteError) {
        console.error("[v0] send-otp: Error deleting duplicates:", deleteError)
      } else {
        console.log(`[v0] send-otp: Successfully deleted ${idsToDelete.length} duplicate records`)
      }
    }

    const existingRecord = allRecords && allRecords.length > 0 ? allRecords[0] : null

    console.log("[v0] send-otp: Using record:", existingRecord ? `ID: ${existingRecord.id}` : "null")

    if (!existingRecord) {
      console.error("[v0] send-otp: No record found for mobile:", formattedPhone, "in", tableName)

      const { data: unformattedCheck } = await supabase
        .from(tableName)
        .select("id, mobile_number")
        .eq("mobile_number", phoneNumber)
        .maybeSingle()

      console.log("[v0] send-otp: Unformatted check result:", unformattedCheck)

      return NextResponse.json(
        { success: false, message: "User not found. Please complete registration first." },
        { status: 404 },
      )
    }

    console.log("[v0] send-otp: Found record with ID:", existingRecord.id)

    // Update the user record with OTP hash
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        otp_hash: otpHash,
        otp_expires_at: expiresAt,
      })
      .eq("id", existingRecord.id)

    if (updateError) {
      console.error("[v0] send-otp: Error storing OTP:", updateError)
      return NextResponse.json({ success: false, message: "Failed to store OTP" }, { status: 500 })
    }

    console.log("[v0] send-otp: OTP stored in", tableName, "table for ID:", existingRecord.id)

    // Remove +91 prefix and get last 10 digits
    const phoneForAPI = formattedPhone.replace(/^\+91/, "").slice(-10)

    // Use 2Factor SMS endpoint with GET method (no template needed)
    const apiKey = TWO_FACTOR_API_KEY?.trim()
    const apiUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneForAPI}/${otp}/OTP1`

    console.log("[v0] send-otp: Sending OTP via 2Factor OTP1 template")
    console.log("[v0] send-otp: Phone for API (10 digits):", phoneForAPI)
    console.log("[v0] send-otp: OTP:", otp)

    try {
      const smsResponse = await fetch(apiUrl, {
        method: "GET",
      })

      const smsData = await smsResponse.json()
      console.log("[v0] send-otp: 2Factor API response:", smsData)

      if (!smsResponse.ok || smsData.Status !== "Success") {
        await supabase.from(tableName).update({ otp_hash: null, otp_expires_at: null }).eq("id", existingRecord.id)

        console.error("[v0] send-otp: OTP sending failed:", smsData)
        return NextResponse.json(
          {
            success: false,
            message: smsData.Details || "Failed to send OTP",
          },
          { status: 500 },
        )
      }

      console.log("[v0] send-otp: OTP sent successfully")
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully to your phone",
      })
    } catch (smsError) {
      console.error("[v0] send-otp: API error:", smsError)

      await supabase.from(tableName).update({ otp_hash: null, otp_expires_at: null }).eq("id", existingRecord.id)

      return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] send-otp: Unexpected error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
