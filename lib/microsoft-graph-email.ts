/**
 * Microsoft Graph API Email Service
 * Uses Client Credentials flow (app-only authentication)
 *
 * Required Environment Variables:
 * - TENANT_ID_MS: Azure AD Tenant ID
 * - CLIENT_ID_MS: Azure AD App Registration Client ID
 * - SECRET_VALUE_MS: Azure AD App Registration Client Secret (the actual secret value, not ID)
 * - MS_SENDER_EMAIL: The email address to send from (must be a valid mailbox in your tenant)
 *
 * Required Azure AD Permissions:
 * - Mail.Send (Application permission, NOT delegated)
 * - Admin consent must be granted
 */

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth2 access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  const tenantId = process.env.TENANT_ID_MS
  const clientId = process.env.CLIENT_ID_MS
  const clientSecret = process.env.SECRET_VALUE_MS

  // Validate credentials
  if (!tenantId || !clientId || !clientSecret) {
    const missing = []
    if (!tenantId) missing.push("TENANT_ID_MS")
    if (!clientId) missing.push("CLIENT_ID_MS")
    if (!clientSecret) missing.push("SECRET_VALUE_MS")
    throw new Error(`Missing Microsoft credentials: ${missing.join(", ")}`)
  }

  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300000) {
    console.log("[v0] Using cached Microsoft Graph token")
    return cachedToken.token
  }

  console.log("[v0] Requesting new Microsoft Graph access token...")

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  })

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Token request failed:", response.status, errorText)
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (!data.access_token) {
    console.error("[v0] No access token in response:", data)
    throw new Error("No access token received from Microsoft")
  }

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  console.log("[v0] Successfully obtained Microsoft Graph access token")
  return data.access_token
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailResult {
  success: boolean
  error?: string
  messageId?: string
}

/**
 * Send email using Microsoft Graph API
 */
export async function sendEmailViaGraph(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text } = options

  console.log("[v0] ========== MICROSOFT GRAPH EMAIL ==========")
  console.log("[v0] To:", to)
  console.log("[v0] Subject:", subject)

  try {
    // Get sender email from environment
    const senderEmail = process.env.MS_SENDER_EMAIL || process.env.SMTP_FROM_EMAIL

    if (!senderEmail) {
      console.error("[v0] ERROR: MS_SENDER_EMAIL environment variable is not set")
      return {
        success: false,
        error:
          "MS_SENDER_EMAIL environment variable is required. This should be the email address of a mailbox in your Microsoft 365 tenant.",
      }
    }

    console.log("[v0] Sender email:", senderEmail)

    // Get access token
    const accessToken = await getAccessToken()

    // Prepare email payload
    const emailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: false,
    }

    console.log("[v0] Sending email via Microsoft Graph API...")

    // Send email using Graph API
    // With application permissions, use /users/{id}/sendMail
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`

    const response = await fetch(graphUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Graph API error: ${response.status}`

      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
        console.error("[v0] Graph API error details:", JSON.stringify(errorJson, null, 2))
      } catch {
        console.error("[v0] Graph API error (raw):", errorText)
      }

      // Common error explanations
      if (response.status === 403) {
        errorMessage += " - The app may not have Mail.Send permission or admin consent is not granted."
      } else if (response.status === 404) {
        errorMessage += ` - The sender mailbox '${senderEmail}' was not found. Make sure it exists in your Microsoft 365 tenant.`
      } else if (response.status === 401) {
        errorMessage += " - Authentication failed. Check your TENANT_ID_MS, CLIENT_ID_MS, and SECRET_VALUE_MS."
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    // 202 Accepted means email was queued successfully
    console.log("[v0] Email sent successfully via Microsoft Graph API!")
    console.log("[v0] ============================================")

    return {
      success: true,
      messageId: `graph-${Date.now()}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Microsoft Graph email error:", errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Verify Microsoft Graph API configuration
 */
export async function verifyGraphConfig(): Promise<{ valid: boolean; error?: string }> {
  console.log("[v0] Verifying Microsoft Graph configuration...")

  const tenantId = process.env.TENANT_ID_MS
  const clientId = process.env.CLIENT_ID_MS
  const clientSecret = process.env.SECRET_VALUE_MS
  const senderEmail = process.env.MS_SENDER_EMAIL || process.env.SMTP_FROM_EMAIL

  const missing = []
  if (!tenantId) missing.push("TENANT_ID_MS")
  if (!clientId) missing.push("CLIENT_ID_MS")
  if (!clientSecret) missing.push("SECRET_VALUE_MS")
  if (!senderEmail) missing.push("MS_SENDER_EMAIL")

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing environment variables: ${missing.join(", ")}`,
    }
  }

  try {
    // Try to get an access token to verify credentials
    await getAccessToken()
    console.log("[v0] Microsoft Graph configuration is valid!")
    return { valid: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      valid: false,
      error: errorMessage,
    }
  }
}
