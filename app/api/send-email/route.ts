import { type NextRequest, NextResponse } from "next/server"
import { sendEmailViaMicrosoft } from "@/lib/microsoft-email"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ========== POST /api/send-email ==========")

    const body = await request.json()
    const { to, subject, html, text } = body

    if (!to || !subject) {
      console.error("[v0] Missing required fields: to or subject")
      return NextResponse.json({ success: false, error: "Email and subject are required" }, { status: 400 })
    }

    const isPreviewEnvironment = process.env.VERCEL_URL?.includes("vusercontent.net")

    if (isPreviewEnvironment) {
      console.log("[v0] PREVIEW MODE - Email not sent")
      return NextResponse.json({
        success: true,
        messageId: `preview-${Date.now()}`,
        message: "Email logged in preview (will send in production)",
      })
    }

    console.log("[v0] PRODUCTION MODE - Sending email via SMTP")

    const result = await sendEmailViaMicrosoft({
      to,
      subject,
      html,
      text,
    })

    if (!result.success) {
      console.error("[v0] Email send failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Email sent successfully")
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: result.message,
    })
  } catch (error: any) {
    console.error("[v0] ========== API ROUTE EXCEPTION ==========")
    console.error(`[v0] Error: ${error.message}`)
    console.error(`[v0] Stack: ${error.stack}`)

    return NextResponse.json(
      {
        success: false,
        error: `Server Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
