"use server"

import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function loginCandidate(email: string, password: string) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Candidate login attempt for:", email)

    // Fetch candidate from database
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, email, password_hash, full_name, is_mobile_verified, registration_completed")
      .eq("email", email)
      .maybeSingle()

    if (candidateError) {
      console.error("[v0] Database error:", candidateError)
      return { success: false, error: "Database error occurred" }
    }

    if (!candidate) {
      console.log("[v0] Candidate not found")
      return { success: false, error: "Invalid login credentials" }
    }

    if (!candidate.is_mobile_verified) {
      return { success: false, error: "Please verify your mobile number first" }
    }

    if (!candidate.password_hash) {
      return { success: false, error: "Invalid login credentials" }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, candidate.password_hash)

    if (!isValidPassword) {
      console.log("[v0] Invalid password")
      return { success: false, error: "Invalid login credentials" }
    }

    // Create session
    const cookieStore = await cookies()
    const sessionData = {
      candidateId: candidate.id,
      email: candidate.email,
      fullName: candidate.full_name,
      loginTime: new Date().toISOString(),
    }

    cookieStore.set("candidate_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("[v0] Candidate login successful:", candidate.email)

    return {
      success: true,
      user: {
        id: candidate.id,
        email: candidate.email,
        fullName: candidate.full_name,
      },
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function logoutCandidate() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("candidate_session")
    return { success: true }
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return { success: false, error: "Failed to logout" }
  }
}

export async function getCandidateSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("candidate_session")

    if (!sessionCookie) {
      return { success: false, session: null }
    }

    const session = JSON.parse(sessionCookie.value)
    return { success: true, session }
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return { success: false, session: null }
  }
}

export async function loginCandidateWithGoogle() {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Initiating Google OAuth sign-in for candidate")

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback/candidate`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      console.error("[v0] Google OAuth error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Google OAuth URL generated:", data.url)
    return { success: true, url: data.url }
  } catch (error) {
    console.error("[v0] Google OAuth initiation error:", error)
    return { success: false, error: "Failed to initiate Google sign-in" }
  }
}

export async function handleGoogleOAuthCallback(user: any) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Processing Google OAuth callback for:", user.email)

    // Check if candidate already exists
    const { data: existingCandidate, error: fetchError } = await supabase
      .from("candidates")
      .select("id, email, full_name, is_mobile_verified, registration_completed")
      .eq("email", user.email)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error fetching candidate:", fetchError)
      return { success: false, error: "Database error occurred" }
    }

    let candidateId: string

    if (existingCandidate) {
      // Existing candidate - just log them in
      candidateId = existingCandidate.id
      console.log("[v0] Existing candidate found, logging in")
    } else {
      // New candidate - create account
      console.log("[v0] Creating new candidate from Google OAuth")

      const { data: newCandidate, error: insertError } = await supabase
        .from("candidates")
        .insert({
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0],
          is_mobile_verified: false, // Will need to verify mobile separately
          registration_completed: false,
          current_registration_step: 1,
          profile_picture_url: user.user_metadata?.avatar_url,
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("[v0] Error creating candidate:", insertError)
        return { success: false, error: "Failed to create candidate account" }
      }

      candidateId = newCandidate.id
    }

    // Create session
    const cookieStore = await cookies()
    const sessionData = {
      candidateId,
      email: user.email,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0],
      loginTime: new Date().toISOString(),
    }

    cookieStore.set("candidate_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("[v0] Google OAuth login successful for:", user.email)

    return {
      success: true,
      user: {
        id: candidateId,
        email: user.email,
        fullName: sessionData.fullName,
      },
      isNewUser: !existingCandidate,
    }
  } catch (error) {
    console.error("[v0] Google OAuth callback error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
