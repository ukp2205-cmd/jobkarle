"use server"

import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendEmail, generatePasswordResetEmail } from "@/lib/email-service"

// Generate a secure random token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Hash the token for storage
async function hashToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 10)
}

// Candidate: Request password reset
export async function requestCandidatePasswordReset(email: string) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Requesting password reset for candidate:", email)

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, email, full_name")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (candidateError) {
      console.error("[v0] Database error:", candidateError)
      return { success: false, error: "Database error occurred" }
    }

    if (!candidate) {
      console.log("[v0] Candidate not found with email:", email)
      return {
        success: true,
        message: "If this email exists, you will receive a password reset link shortly.",
      }
    }

    console.log("[v0] Candidate found:", candidate.id)

    // Generate reset token
    const resetToken = generateResetToken()
    const hashedToken = await hashToken(resetToken)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    console.log("[v0] Generated reset token, expires at:", expiresAt.toISOString())

    // Store hashed token in database
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        reset_token: hashedToken,
        reset_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", candidate.id)

    if (updateError) {
      console.error("[v0] Error storing reset token:", updateError)
      return { success: false, error: "Failed to generate reset link" }
    }

    console.log("[v0] Reset token stored in database")

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const resetUrl = `${baseUrl}/candidate/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    console.log("[v0] Password reset URL generated")

    // Generate and send email
    const emailContent = await generatePasswordResetEmail(candidate.full_name || "User", resetUrl, "candidate")
    console.log("[v0] Email content generated, sending...")

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset Your JobKarle Password",
      html: emailContent.html,
      text: emailContent.text,
    })

    console.log("[v0] Email result:", JSON.stringify(emailResult))

    return {
      success: true,
      message: emailResult.success
        ? "Password reset link has been sent to your email."
        : "If this email exists, you will receive a password reset link shortly.",
      resetUrl: resetUrl, // For development/debugging
      emailSent: emailResult.success,
      emailError: emailResult.success ? undefined : emailResult.error,
    }
  } catch (error: any) {
    console.error("[v0] Password reset request error:", error.message)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Candidate: Reset password with token
export async function resetCandidatePassword(email: string, token: string, newPassword: string) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Resetting password for candidate:", email)

    // Get candidate with reset token
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, email, reset_token, reset_token_expires_at")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (candidateError || !candidate) {
      console.error("[v0] Candidate not found:", candidateError)
      return { success: false, error: "Invalid reset link" }
    }

    console.log("[v0] Candidate found for reset:", candidate.id)

    if (!candidate.reset_token || !candidate.reset_token_expires_at) {
      console.log("[v0] No reset token found")
      return { success: false, error: "Invalid reset link. Please request a new password reset." }
    }

    // Check if token expired
    if (new Date() > new Date(candidate.reset_token_expires_at)) {
      console.log("[v0] Reset token expired")
      return { success: false, error: "Reset link has expired. Please request a new one." }
    }

    // Verify token
    const isValidToken = await bcrypt.compare(token, candidate.reset_token)
    if (!isValidToken) {
      console.log("[v0] Invalid token provided")
      return { success: false, error: "Invalid reset link. Please request a new password reset." }
    }

    console.log("[v0] Token verified successfully")

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq("id", candidate.id)

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return { success: false, error: "Failed to reset password" }
    }

    console.log("[v0] Password reset successful for:", email)
    return { success: true, message: "Password reset successful. You can now login with your new password." }
  } catch (error) {
    console.error("[v0] Password reset error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Employer: Request password reset
export async function requestEmployerPasswordReset(email: string) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Requesting password reset for employer:", email)

    const { data: employer, error: employerError } = await supabase
      .from("employers")
      .select("id, email, contact_person")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (employerError) {
      console.error("[v0] Database error:", employerError)
      return { success: false, error: "Database error occurred" }
    }

    if (!employer) {
      console.log("[v0] Employer not found with email:", email)
      return {
        success: true,
        message: "If this email exists, you will receive a password reset link shortly.",
      }
    }

    console.log("[v0] Employer found:", employer.id)

    // Generate reset token
    const resetToken = generateResetToken()
    const hashedToken = await hashToken(resetToken)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    console.log("[v0] Generated reset token, expires at:", expiresAt.toISOString())

    // Store hashed token in database
    const { error: updateError } = await supabase
      .from("employers")
      .update({
        reset_token: hashedToken,
        reset_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", employer.id)

    if (updateError) {
      console.error("[v0] Error storing reset token:", updateError)
      return { success: false, error: "Failed to generate reset link" }
    }

    console.log("[v0] Reset token stored in database")

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const resetUrl = `${baseUrl}/employer/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    console.log("[v0] Password reset URL generated")

    // Generate and send email
    const emailContent = await generatePasswordResetEmail(employer.contact_person || "User", resetUrl, "employer")
    console.log("[v0] Email content generated, sending...")

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset Your JobKarle Password",
      html: emailContent.html,
      text: emailContent.text,
    })

    console.log("[v0] Email result:", JSON.stringify(emailResult))

    return {
      success: true,
      message: emailResult.success
        ? "Password reset link has been sent to your email."
        : "If this email exists, you will receive a password reset link shortly.",
      resetUrl: resetUrl, // For development/debugging
      emailSent: emailResult.success,
      emailError: emailResult.success ? undefined : emailResult.error,
    }
  } catch (error: any) {
    console.error("[v0] Password reset request error:", error.message)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Employer: Reset password with token
export async function resetEmployerPassword(email: string, token: string, newPassword: string) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Resetting password for employer:", email)

    // Get employer with reset token
    const { data: employer, error: employerError } = await supabase
      .from("employers")
      .select("id, email, reset_token, reset_token_expires_at")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (employerError || !employer) {
      console.error("[v0] Employer not found:", employerError)
      return { success: false, error: "Invalid reset link" }
    }

    console.log("[v0] Employer found for reset:", employer.id)

    if (!employer.reset_token || !employer.reset_token_expires_at) {
      console.log("[v0] No reset token found")
      return { success: false, error: "Invalid reset link. Please request a new password reset." }
    }

    // Check if token expired
    if (new Date() > new Date(employer.reset_token_expires_at)) {
      console.log("[v0] Reset token expired")
      return { success: false, error: "Reset link has expired. Please request a new one." }
    }

    // Verify token
    const isValidToken = await bcrypt.compare(token, employer.reset_token)
    if (!isValidToken) {
      console.log("[v0] Invalid token provided")
      return { success: false, error: "Invalid reset link. Please request a new password reset." }
    }

    console.log("[v0] Token verified successfully")

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from("employers")
      .update({
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq("id", employer.id)

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return { success: false, error: "Failed to reset password" }
    }

    console.log("[v0] Password reset successful for:", email)
    return { success: true, message: "Password reset successful. You can now login with your new password." }
  } catch (error) {
    console.error("[v0] Password reset error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
