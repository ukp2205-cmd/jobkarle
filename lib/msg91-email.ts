export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmailViaMSG91(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, from } = options

  const apiKey = process.env.MSG_91_KEY
  const fromEmail = from || process.env.SMTP_FROM_EMAIL || "noreply@jobkarle.com"
  const fromName = process.env.SMTP_FROM_NAME || "JobKarle"

  if (!apiKey) {
    console.error(
      "[v0] MSG91 API Key not configured. Please add MSG_91_KEY to your environment variables in the Vars section.",
    )
    console.error(
      "[v0] Available env vars:",
      Object.keys(process.env).filter((k) => k.includes("MSG") || k.includes("SMTP")),
    )
    return { success: false, error: "MSG91 API Key not configured. Please contact your administrator." }
  }

  try {
    console.log("[v0] Sending email via MSG91 to:", to)
    console.log("[v0] Using MSG91 API endpoint: https://api.msg91.com/api/v5/email/send")

    const payload = {
      to: to,
      from_email: fromEmail,
      from_name: fromName,
      subject: subject,
      html: html,
    }

    const response = await fetch("https://api.msg91.com/api/v5/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] MSG91 API Error:", data)
      return {
        success: false,
        error: data.message || `MSG91 Error: ${response.status}`,
      }
    }

    console.log("[v0] Email sent successfully via MSG91")
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] MSG91 Email Error:", errorMessage)
    return { success: false, error: errorMessage }
  }
}
