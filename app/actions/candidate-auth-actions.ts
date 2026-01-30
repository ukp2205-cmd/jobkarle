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
    console.log("[v0] Initiating direct Google OAuth sign-in for candidate")

    const googleClientId = "92551279196-1988194felgep14d3t7p4ahhsdlm9rg5.apps.googleusercontent.com"
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback/google`

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7)

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state: state,
    })

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    console.log("[v0] Google OAuth URL generated:", googleAuthUrl)
    return { success: true, url: googleAuthUrl, state }
  } catch (error) {
    console.error("[v0] Google OAuth initiation error:", error)
    return { success: false, error: "Failed to initiate Google sign-in" }
  }
}

export async function handleGoogleOAuthCallback(code: string) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Processing direct Google OAuth callback")

    const googleClientId = "92551279196-1988194felgep14d3t7p4ahhsdlm9rg5.apps.googleusercontent.com"
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || ""
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback/google`

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      console.error("[v0] Token exchange failed:", await tokenResponse.text())
      return { success: false, error: "Failed to exchange authorization code" }
    }

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error("[v0] Failed to get user info")
      return { success: false, error: "Failed to get user information" }
    }

    const googleUser = await userInfoResponse.json()
    console.log("[v0] Google user info received:", googleUser.email)

    // Check if candidate already exists
    const { data: existingCandidate, error: fetchError } = await supabase
      .from("candidates")
      .select("id, email, full_name, is_mobile_verified, registration_completed")
      .eq("email", googleUser.email)
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
          email: googleUser.email,
          full_name: googleUser.name || googleUser.email.split("@")[0],
          is_mobile_verified: false,
          registration_completed: false,
          current_registration_step: 1,
          profile_picture_url: googleUser.picture,
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
      email: googleUser.email,
      fullName: googleUser.name || googleUser.email.split("@")[0],
      loginTime: new Date().toISOString(),
      profilePicture: googleUser.picture,
    }

    cookieStore.set("candidate_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("[v0] Google OAuth login successful for:", googleUser.email)

    return {
      success: true,
      user: {
        id: candidateId,
        email: googleUser.email,
        fullName: sessionData.fullName,
      },
      isNewUser: !existingCandidate,
    }
  } catch (error) {
    console.error("[v0] Google OAuth callback error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
