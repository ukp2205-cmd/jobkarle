import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { formatPhoneNumber, verifyOTP } from "@/lib/otp-utils"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, email, userType = "candidate" } = await request.json()

    console.log("[v0] verify-otp: Phone:", phoneNumber, "userType:", userType)

    // Validate input
    if (!phoneNumber || !otp) {
      return NextResponse.json({ success: false, message: "Phone number and OTP are required" }, { status: 400 })
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, message: "OTP must be 6 digits" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    console.log("[v0] verify-otp: Formatted phone:", formattedPhone)

    const supabase = await createClient()

    const tableName = userType === "employer" ? "employers" : "candidates"

    const { data: allRecords, error: fetchError } = await supabase
      .from(tableName)
      .select("id, otp_hash, otp_expires_at, created_at")
      .eq("mobile_number", formattedPhone)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("[v0] verify-otp: Database error fetching records:", fetchError.message)
      return NextResponse.json({ success: false, message: "Database error occurred" }, { status: 500 })
    }

    console.log("[v0] verify-otp: Found", allRecords?.length || 0, "record(s)")

    if (!allRecords || allRecords.length === 0) {
      console.error("[v0] verify-otp: No record found for phone:", formattedPhone)
      return NextResponse.json(
        { success: false, message: "No record found for this phone number. Please complete registration first." },
        { status: 404 },
      )
    }

    if (allRecords.length > 1) {
      console.log("[v0] verify-otp: Found", allRecords.length, "duplicate records, cleaning up...")
      const recordToKeep = allRecords[0]
      const idsToDelete = allRecords.slice(1).map((r) => r.id)

      console.log("[v0] verify-otp: Keeping record ID:", recordToKeep.id, "created at:", recordToKeep.created_at)
      console.log("[v0] verify-otp: Deleting", idsToDelete.length, "older duplicate records")

      const { error: deleteError } = await supabase.from(tableName).delete().in("id", idsToDelete)

      if (deleteError) {
        console.error("[v0] verify-otp: Error deleting duplicates:", deleteError)
      } else {
        console.log("[v0] verify-otp: Successfully deleted duplicates")
      }
    }

    const record = allRecords[0]

    if (!record.otp_hash) {
      console.error("[v0] verify-otp: No OTP found for phone:", formattedPhone)
      return NextResponse.json(
        { success: false, message: "No OTP found for this phone number. Please request a new OTP." },
        { status: 404 },
      )
    }

    console.log("[v0] verify-otp: OTP record found, checking expiration...")

    // Check if OTP has expired
    const now = new Date()
    const expiresAt = new Date(record.otp_expires_at)

    if (now > expiresAt) {
      console.log("[v0] verify-otp: OTP has expired")

      // Clear expired OTP
      await supabase.from(tableName).update({ otp_hash: null, otp_expires_at: null }).eq("id", record.id)

      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 },
      )
    }

    console.log("[v0] verify-otp: Verifying OTP hash locally...")

    const isValid = await verifyOTP(otp, record.otp_hash)

    if (!isValid) {
      console.log("[v0] verify-otp: Invalid OTP")
      return NextResponse.json({ success: false, message: "Invalid OTP. Please try again." }, { status: 400 })
    }

    console.log("[v0] verify-otp: OTP is valid, updating verification status...")

    const updateData =
      userType === "candidate"
        ? { otp_verified: true, is_mobile_verified: true, otp_hash: null, otp_expires_at: null }
        : { otp_verified: true, otp_hash: null, otp_expires_at: null }

    const { error: updateError } = await supabase.from(tableName).update(updateData).eq("id", record.id)

    if (updateError) {
      console.error("[v0] verify-otp: Update error:", updateError.message)
      return NextResponse.json(
        { success: false, message: `Failed to update verification status: ${updateError.message}` },
        { status: 500 },
      )
    }

    console.log("[v0] verify-otp: Success! otp_verified set to true for", tableName, "record ID:", record.id)

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully!",
    })
  } catch (error: any) {
    console.error("[v0] verify-otp: Exception:", error.message)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
