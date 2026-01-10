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
  console.log("[v0] Full options received:", JSON.stringify(options, null, 2))

  const to = options.to
  const resetLink = options.resetLink
  const name = options.name

  // MSG91 Configuration from environment variables
  const apiKey = process.env.MSG_91_KEY
  const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@jobkarle.com"
  const fromName = process.env.SMTP_FROM_NAME || "JobKarle"
  const templateId = "template_10_01_2026_15_01"

  // Validate MSG91 API key
  if (!apiKey) {
    console.error("[v0] MSG91 API Key not configured")
    return { success: false, error: "Email service not configured. Please contact your administrator." }
  }

  const MAX_RETRIES = 2
  const TIMEOUT_MS = 10000 // 10 second timeout

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[v0] Sending email via MSG91 to: ${to} (Attempt ${attempt}/${MAX_RETRIES})`)
      console.log(`[v0] Reset Link being sent: ${resetLink}`)
      console.log(`[v0] Name being sent: ${name}`)

      // MSG91 expects variables per-recipient for template substitution
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
            // Variables go inside the recipient object for template substitution
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

      console.log("[v0] Payload being sent to MSG91:", JSON.stringify(payload, null, 2))

      const startTime = Date.now()

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

      const duration = Date.now() - startTime
      console.log(`[v0] MSG91 API response received in ${duration}ms`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`[v0] MSG91 API Error (${response.status}):`, JSON.stringify(errorData, null, 2))
        throw new Error(`MSG91 API Error: ${errorData.message || response.statusText}`)
      }

      const result = await response.json()
      console.log(`[v0] Email sent successfully via MSG91`)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[v0] MSG91 Email Error (Attempt ${attempt}/${MAX_RETRIES}):`, errorMessage)

      if (attempt < MAX_RETRIES) {
        console.log(`[v0] Retrying in ${1000 * attempt}ms...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        continue
      }

      return { success: false, error: errorMessage }
    }
  }

  return { success: false, error: "Max retries exceeded. Please try again later." }
}

export async function sendEmailViaSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  return sendEmailViaMSG91(options)
}
