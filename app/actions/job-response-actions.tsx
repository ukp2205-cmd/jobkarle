import { sendEmailViaMSG91 } from "@/lib/msg91-email"

export async function sendJobResponseEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  responseStatus: "accepted" | "rejected",
) {
  const statusText = responseStatus === "accepted" ? "Accepted" : "Rejected"
  const statusColor = responseStatus === "accepted" ? "#10b981" : "#ef4444"

  const emailResult = await sendEmailViaMSG91({
    to: candidateEmail,
    subject: `Your Application for ${jobTitle} has been ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Application Status Update</h2>
        <p>Hello ${candidateName},</p>
        <p>We have reviewed your application for the position of <strong>${jobTitle}</strong>.</p>
        <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold;">
          ${statusText}
        </div>
        <p>${
          responseStatus === "accepted"
            ? "Congratulations! We are excited to move forward with your application. Our team will be in touch with next steps."
            : "Thank you for your interest in this position. While we were impressed with your qualifications, we have decided to move forward with other candidates at this time. We encourage you to apply for future positions that match your skills."
        }</p>
        <p>Best regards,<br />JobKarle Team</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `,
  })

  return emailResult
}
