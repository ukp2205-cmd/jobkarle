"use server"

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
    return { success: false, error: "MSG91 API Key not configured. Please contact your administrator." }
  }

  const MAX_RETRIES = 2
  const TIMEOUT_MS = 10000 // 10 second timeout

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[v0] Sending email via MSG91 to: ${to} (Attempt ${attempt}/${MAX_RETRIES})`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const payload = {
        recipients: [
          {
            to: [
              {
                email: to,
              },
            ],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        domain: fromEmail.split("@")[1] || "jobkarle.com", // Extract domain from email
        subject: subject,
        body: {
          type: "text/html", // Changed from "html" to "text/html" to match MSG91 API specification
          data: html,
        },
      }

      const startTime = Date.now()
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

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] MSG91 API Error:", JSON.stringify(data, null, 2))

        // Retry on server errors (5xx), not on client errors (4xx)
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          console.log(`[v0] Server error (${response.status}). Retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
          continue
        }

        return {
          success: false,
          error: data.message || `MSG91 Error: ${response.status}`,
        }
      }

      console.log("[v0] Email sent successfully via MSG91")
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Check if it's a timeout or abort error
      if (errorMessage.includes("abort") || errorMessage.includes("timeout")) {
        console.error(`[v0] MSG91 Request timeout (Attempt ${attempt}/${MAX_RETRIES})`)
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
          continue
        }
      }

      console.error("[v0] MSG91 Email Error:", errorMessage)

      if (attempt < MAX_RETRIES) {
        console.log(`[v0] Retrying... (Attempt ${attempt + 1}/${MAX_RETRIES})`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        continue
      }

      return { success: false, error: errorMessage }
    }
  }

  return { success: false, error: "Max retries exceeded. Please try again later." }
}
