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
