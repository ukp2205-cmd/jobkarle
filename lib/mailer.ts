import { sendEmailViaMicrosoft } from "./microsoft-email"

export async function sendEmail(options: {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
}) {
  const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "JobKarle"

  // Check if we're in v0 preview environment
  const isPreviewEnvironment = process.env.VERCEL_URL?.includes("vusercontent.net")

  if (isPreviewEnvironment) {
    console.log("[v0] ========== EMAIL PREVIEW MODE ==========")
    console.log("[v0] Preview environment detected - email will not be sent")
    console.log("[v0] In production, this email will be sent to:", options.to)
    console.log("[v0] Subject:", options.subject)
    console.log("[v0] From:", options.from || `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`)
    console.log("[v0] HTML Body length:", options.html?.length || 0)

    return {
      success: true,
      messageId: "preview-mode-" + Date.now(),
      message: "Email logged in preview mode (will send in production)",
    }
  }

  try {
    console.log("[v0] [mailer.ts] Sending email via SMTP directly from server action")

    const result = await sendEmailViaMicrosoft({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from: options.from,
    })

    console.log("[v0] [mailer.ts] Email send result:", result.success ? "SUCCESS" : "FAILED")

    return {
      success: result.success,
      messageId: result.messageId,
      message: result.message || result.error,
      error: result.error,
    }
  } catch (error: any) {
    console.error("[v0] [mailer.ts] Error sending email:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
