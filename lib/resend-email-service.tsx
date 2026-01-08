import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendPasswordResetEmailParams {
  to: string
  userName: string
  resetLink: string
  userType: "candidate" | "employer"
}

export async function sendPasswordResetEmail({ to, userName, resetLink, userType }: SendPasswordResetEmailParams) {
  const userTypeLabel = userType === "candidate" ? "Job Seeker" : "Employer"

  try {
    // If no API key is configured, log the email for development
    if (!process.env.RESEND_API_KEY || !resend) {
      console.log("[v0] RESEND_API_KEY not configured. Email would be sent to:", to)
      console.log("[v0] Reset link:", resetLink)
      return {
        success: true,
        message: "Email service not configured. Check console for reset link.",
      }
    }

    const { data, error } = await resend.emails.send({
      from: "JobKarle <noreply@jobkarle.com>", // Change this to your verified domain
      to: [to],
      subject: "Reset Your JobKarle Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">JobKarle</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your ${userTypeLabel} account. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
                ${resetLink}
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="color: #999; font-size: 14px; line-height: 1.6;">
                  <strong>Important:</strong> This link will expire in 30 minutes for security reasons.
                </p>
                
                <p style="color: #999; font-size: 14px; line-height: 1.6;">
                  If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2025 JobKarle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("[v0] Resend email error:", error)
      return {
        success: false,
        message: "Failed to send password reset email.",
      }
    }

    console.log("[v0] Password reset email sent successfully:", data?.id)
    return {
      success: true,
      message: "Password reset email sent successfully.",
    }
  } catch (error) {
    console.error("[v0] Error sending password reset email:", error)
    return {
      success: false,
      message: "An error occurred while sending the email.",
    }
  }
}
