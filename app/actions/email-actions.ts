"use server"

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  resetLink?: string
  name?: string
}

export async function sendEmailViaMSG91(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const to = options.to
  const resetLink = options.resetLink
  const name = options.name

  const apiKey = process.env.MSG_91_KEY
  const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@jobkarle.com"
  const fromName = process.env.SMTP_FROM_NAME || "JobKarle"
  const templateId = "template_10_01_2026_15_01"

  if (!apiKey) {
    console.error("[v0] MSG91 API Key not configured")
    return { success: false, error: "Email service not configured. Please contact your administrator." }
  }

  const MAX_RETRIES = 2
  const TIMEOUT_MS = 5000 // Reduced from 10s to 5s
  const RETRY_DELAY_MS = 500 // Fixed 500ms delay instead of exponential

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const payload = {
        template_id: templateId,
        short_url: 1,
        recipients: [
          {
            to: [
              {
                email: to,
              },
            ],
            variables: {
              resetLink: resetLink || "",
              name: name || "User",
            },
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const response = await fetch("https://api.msg91.com/api/v5/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] MSG91 Error (${response.status}):`, errorText)
        throw new Error(`MSG91 API Error: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        await response.json()
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        continue
      }

      console.error(`[v0] MSG91 Email Failed:`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  return { success: false, error: "Max retries exceeded. Please try again later." }
}

export async function sendEmailViaSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  return sendEmailViaMSG91(options)
}
