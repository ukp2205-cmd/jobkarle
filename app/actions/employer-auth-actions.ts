"use server"

import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function loginEmployer(email: string, password: string) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Attempting login for:", email)

    // Fetch employer from database
    const { data: employer, error: employerError } = await supabase
      .from("employers")
      .select("id, email, password_hash, company_name, contact_person, otp_verified, mobile_number, logo_url")
      .eq("email", email)
      .maybeSingle()

    if (employerError) {
      console.error("[v0] Database error:", employerError)
      return { success: false, error: "Database error occurred" }
    }

    if (!employer) {
      console.log("[v0] Employer not found in database")
      return { success: false, error: "Invalid login credentials" }
    }

    if (!employer.otp_verified) {
      return { success: false, error: "Please complete your registration and verify your mobile number first" }
    }

    if (!employer.password_hash) {
      console.log("[v0] No password hash found for employer")
      return { success: false, error: "Invalid login credentials" }
    }

    // Verify password against stored hash
    console.log("[v0] Verifying password...")
    const isValidPassword = await bcrypt.compare(password, employer.password_hash)

    if (!isValidPassword) {
      console.log("[v0] Invalid password")
      return { success: false, error: "Invalid login credentials" }
    }

    console.log("[v0] Password verified successfully")

    const cookieStore = await cookies()
    cookieStore.delete("employer_session")

    // Create custom session
    const sessionData = {
      employerId: employer.id,
      email: employer.email,
      companyName: employer.company_name,
      contactPerson: employer.contact_person,
      mobileNumber: employer.mobile_number,
      logoUrl: employer.logo_url,
      loginTime: new Date().toISOString(),
    }

    cookieStore.set("employer_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("[v0] Login successful for:", employer.email, "with employerId:", employer.id)
    console.log("[v0] Session created:", JSON.stringify(sessionData))

    return {
      success: true,
      user: {
        id: employer.id,
        email: employer.email,
        companyName: employer.company_name,
        contactPerson: employer.contact_person,
        mobileNumber: employer.mobile_number,
        logoUrl: employer.logo_url,
      },
    }
  } catch (error) {
    console.error("[v0] Unexpected login error:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function logoutEmployer() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("employer_session")
    return { success: true }
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return { success: false, error: "Failed to logout" }
  }
}

export async function getEmployerSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("employer_session")

    console.log("[v0] getEmployerSession called, cookie exists:", !!sessionCookie)

    if (!sessionCookie) {
      console.log("[v0] No session cookie found")
      return { success: false, session: null }
    }

    const session = JSON.parse(sessionCookie.value)
    console.log(
      "[v0] Session retrieved - employerId:",
      session.employerId,
      "email:",
      session.email,
      "company:",
      session.companyName,
    )
    return { success: true, session }
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return { success: false, session: null }
  }
}
