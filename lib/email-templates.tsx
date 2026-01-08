export function getPasswordResetEmailTemplate(params: {
  recipientName: string
  resetUrl: string
  userType: "employer" | "candidate"
}): string {
  const { recipientName, resetUrl, userType } = params

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                JobKarle
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px;">
              <h2 style="margin: 0 0 16px; color: #1a202c; font-size: 24px; font-weight: 600;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your ${userType === "employer" ? "employer" : "candidate"} account. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 24px; padding: 16px; background: #f7fafc; border-radius: 8px; color: #667eea; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div style="padding: 24px; background: #fff5f5; border-left: 4px solid #fc8181; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.6;">
                  <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
              
              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Thanks,<br>
                The JobKarle Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 48px; background: #f7fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #a0aec0; font-size: 12px;">
                JobKarle - Your Career Partner
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} JobKarle. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
