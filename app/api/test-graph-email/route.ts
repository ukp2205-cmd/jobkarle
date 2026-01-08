import { type NextRequest, NextResponse } from "next/server"
import { sendEmailViaGraph, verifyGraphConfig } from "@/lib/microsoft-graph-email"

export async function GET(request: NextRequest) {
  console.log("[v0] Testing Microsoft Graph Email Configuration...")

  // First verify the configuration
  const configCheck = await verifyGraphConfig()

  if (!configCheck.valid) {
    return NextResponse.json({
      success: false,
      step: "configuration",
      error: configCheck.error,
      help: {
        required_env_vars: [
          "TENANT_ID_MS - Your Azure AD Tenant ID",
          "CLIENT_ID_MS - Your Azure AD App Registration Client ID",
          "SECRET_VALUE_MS - Your Azure AD App Registration Client Secret (the actual secret value, not the ID)",
          "MS_SENDER_EMAIL - The email address to send from (must be a mailbox in your M365 tenant)",
        ],
        azure_permissions: [
          "Mail.Send (Application permission, NOT delegated)",
          "Admin consent must be granted in Azure Portal",
        ],
      },
    })
  }

  return NextResponse.json({
    success: true,
    message: "Microsoft Graph configuration is valid! Token obtained successfully.",
    next_step: "Use POST with ?to=email@example.com to send a test email",
  })
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const testEmail = searchParams.get("to")

  if (!testEmail) {
    return NextResponse.json({
      success: false,
      error: "Please provide a test email address: POST /api/test-graph-email?to=your@email.com",
    })
  }

  console.log("[v0] Sending test email to:", testEmail)

  const result = await sendEmailViaGraph({
    to: testEmail,
    subject: "JobKarle - Microsoft Graph Email Test",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #667eea;">Email Test Successful!</h2>
        <p>This email was sent using Microsoft Graph API.</p>
        <p>If you received this, your email configuration is working correctly.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Sent from JobKarle at ${new Date().toISOString()}</p>
      </div>
    `,
  })

  return NextResponse.json(result)
}
