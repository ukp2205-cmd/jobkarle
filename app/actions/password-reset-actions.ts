"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

interface ResetPasswordParams {
  token: string
  email: string
  newPassword?: string
}

interface ResetPasswordResult {
  success: boolean
  error?: string
  data?: any
}

export async function resetCandidatePassword(params: ResetPasswordParams): Promise<ResetPasswordResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Fetch candidate with token
    const { data: candidate, error: fetchError } = await supabase
      .from("candidates")
      .select("id, reset_token, reset_token_expires_at")
      .eq("email", params.email)
      .single()

    if (fetchError || !candidate) {
      return { success: false, error: "Invalid reset link" }
    }

    // Validate token
    if (candidate.reset_token !== params.token) {
      return { success: false, error: "Invalid reset link" }
    }

    // Check token expiry
    if (candidate.reset_token_expires_at && new Date(candidate.reset_token_expires_at) < new Date()) {
      return { success: false, error: "Reset link has expired" }
    }

    // If newPassword is provided, update the password
    if (params.newPassword) {
      const hashedPassword = await bcrypt.hash(params.newPassword, 10)

      const { error: updateError } = await supabase
        .from("candidates")
        .update({
          password_hash: hashedPassword,
          reset_token: null,
          reset_token_expires_at: null,
        })
        .eq("email", params.email)
        .eq("reset_token", params.token)

      if (updateError) {
        return { success: false, error: "Failed to reset password" }
      }

      return { success: true }
    }

    // Just validation, return success
    return { success: true, data: candidate }
  } catch (error: any) {
    console.error("[v0] Reset candidate password error:", error)
    return { success: false, error: error.message || "Failed to reset password" }
  }
}

export async function resetEmployerPassword(params: ResetPasswordParams): Promise<ResetPasswordResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Fetch employer with token
    const { data: employer, error: fetchError } = await supabase
      .from("employers")
      .select("id, reset_token, reset_token_expires_at")
      .eq("email", params.email)
      .single()

    if (fetchError || !employer) {
      return { success: false, error: "Invalid reset link" }
    }

    // Validate token
    if (employer.reset_token !== params.token) {
      return { success: false, error: "Invalid reset link" }
    }

    // Check token expiry
    if (employer.reset_token_expires_at && new Date(employer.reset_token_expires_at) < new Date()) {
      return { success: false, error: "Reset link has expired" }
    }

    // If newPassword is provided, update the password
    if (params.newPassword) {
      const hashedPassword = await bcrypt.hash(params.newPassword, 10)

      const { error: updateError } = await supabase
        .from("employers")
        .update({
          password_hash: hashedPassword,
          reset_token: null,
          reset_token_expires_at: null,
        })
        .eq("email", params.email)
        .eq("reset_token", params.token)

      if (updateError) {
        return { success: false, error: "Failed to reset password" }
      }

      return { success: true }
    }

    // Just validation, return success
    return { success: true, data: employer }
  } catch (error: any) {
    console.error("[v0] Reset employer password error:", error)
    return { success: false, error: error.message || "Failed to reset password" }
  }
}
