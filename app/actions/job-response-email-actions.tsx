"use server"

import { sendEmailViaMSG91 } from "@/app/actions/email-actions"

export async function sendJobResponseEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  status: "accepted" | "rejected" | "under-review",
  companyName: string,
): Promise<{ success: boolean; error?: string }> {
  let subject = ""
  let html = ""

  if (status === "accepted") {
    subject = `Great News! Your Application for ${jobTitle} at ${companyName} has been Accepted`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Congratulations!</h2>
        <p>Hi ${candidateName},</p>
        <p>We're excited to inform you that your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been <strong style="color: #22c55e;">ACCEPTED</strong>.</p>
        <p>The employer will contact you shortly with next steps. Keep an eye on your inbox and phone for their communication.</p>
        <p>Best of luck with your interview!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">JobKarle Team</p>
      </div>
    `
  } else if (status === "rejected") {
    subject = `Application Update: ${jobTitle} at ${companyName}`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #666;">Application Status Update</h2>
        <p>Hi ${candidateName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        <p>While your profile was impressive, the employer has decided to move forward with other candidates at this time. Don't get discouraged – there are many other great opportunities on JobKarle that match your skills.</p>
        <p>Keep applying and best of luck with your job search!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">JobKarle Team</p>
      </div>
    `
  } else {
    subject = `Your Application for ${jobTitle} at ${companyName} is Under Review`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Application Under Review</h2>
        <p>Hi ${candidateName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        <p>Your application is currently under review by the employer. We'll notify you as soon as they make a decision.</p>
        <p>In the meantime, feel free to explore other job opportunities on JobKarle.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">JobKarle Team</p>
      </div>
    `
  }

  return await sendEmailViaMSG91({
    to: candidateEmail,
    subject: subject,
    html: html,
  })
}
