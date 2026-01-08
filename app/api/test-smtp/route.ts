import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/mailer"

export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("[v0] ========== SMTP TEST: Starting ==========")

    const SMTP_HOST = process.env.SMTP_HOST
    const SMTP_PORT = process.env.SMTP_PORT
    const SMTP_USER = process.env.SMTP_USER
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD
    const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
      console.error("[v0] Missing SMTP environment variables")
      return NextResponse.json(
        {
          ok: false,
          error: "SMTP environment variables are missing",
          details: {
            host: !!SMTP_HOST,
            port: !!SMTP_PORT,
            user: !!SMTP_USER,
            password: !!SMTP_PASSWORD,
          },
        },
        { status: 500 },
      )
    }

    console.log("[v0] SMTP Configuration:")
    console.log("[v0] Host:", SMTP_HOST)
    console.log("[v0] Port:", SMTP_PORT)
    console.log("[v0] User:", SMTP_USER.substring(0, 5) + "***")
    console.log("[v0] From Email:", SMTP_FROM_EMAIL)

    console.log("[v0] Sending test email via emailjs...")

    await sendEmail({
      to: SMTP_USER,
      subject: "✅ SMTP Test Successful - JobKarle",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SMTP Test</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 10px;">
              <h1 style="color: white; margin: 0; font-size: 32px;">✅ SMTP Test Successful!</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="color: #333; font-size: 18px; line-height: 1.6; margin: 0;">
                Your JobKarle SMTP configuration is working perfectly! 🎉
              </p>
              
              <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 5px;">
                <p style="color: #166534; font-size: 14px; margin: 0;">
                  <strong>SMTP Connection Details:</strong><br>
                  Server: ${SMTP_HOST}<br>
                  Port: ${SMTP_PORT}<br>
                  Status: ✅ Connected
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                You can now use the password reset functionality with confidence!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    console.log("[v0] ========== SMTP TEST: SUCCESS ==========")

    return NextResponse.json({
      ok: true,
      message: "SMTP test email sent successfully!",
      details: {
        host: SMTP_HOST,
        port: SMTP_PORT,
        user: SMTP_USER.substring(0, 5) + "***",
      },
    })
  } catch (error: any) {
    console.error("[v0] ========== SMTP TEST: FAILED ==========")
    console.error("[v0] Error:", error.message)
    console.error("[v0] Stack:", error.stack)

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
