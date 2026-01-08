import { type NextRequest, NextResponse } from "next/server"
import { sendEmailViaMicrosoft } from "@/lib/microsoft-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    console.log("[v0] ========== TEST EMAIL ENDPOINT ==========")
    console.log("[v0] Testing email send to:", email)
    console.log("[v0] Environment variables check:")
    console.log("[v0] SMTP_HOST:", process.env.SMTP_HOST ? "✓ set" : "✗ missing")
    console.log("[v0] SMTP_PORT:", process.env.SMTP_PORT ? "✓ set" : "✗ missing")
    console.log("[v0] SMTP_USER:", process.env.SMTP_USER ? "✓ set" : "✗ missing")
    console.log("[v0] SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "✓ set" : "✗ missing")
    console.log("[v0] SMTP_FROM_EMAIL:", process.env.SMTP_FROM_EMAIL ? "✓ set" : "✗ missing")
    console.log("[v0] SMTP_SECURE:", process.env.SMTP_SECURE ? "✓ set" : "✗ missing")

    const result = await sendEmailViaMicrosoft({
      to: email,
      subject: "JobKarle Test Email",
      html: "<h1>This is a test email</h1><p>If you received this, email sending is working!</p>",
      text: "This is a test email. If you received this, email sending is working!",
    })

    console.log("[v0] Email test result:", result)

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error: any) {
    console.error("[v0] Test email endpoint error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: {
          name: error.name,
          message: error.message,
        },
      },
      { status: 500 },
    )
  }
}
