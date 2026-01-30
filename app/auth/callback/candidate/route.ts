import { createServerClient } from "@/lib/supabase/server"
import { handleGoogleOAuthCallback } from "@/app/actions/candidate-auth-actions"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  console.log("[v0] OAuth callback received with code:", code ? "present" : "missing")

  if (code) {
    const supabase = await createServerClient()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] OAuth code exchange error:", error)
      return NextResponse.redirect(`${requestUrl.origin}/candidate/login?error=oauth_failed`)
    }

    if (data.user) {
      // Handle the OAuth callback to create/update candidate and session
      const result = await handleGoogleOAuthCallback(data.user)

      if (result.success) {
        // Redirect to dashboard or complete registration
        const redirectUrl = result.isNewUser
          ? `${requestUrl.origin}/register?step=2` // Complete mobile verification
          : `${requestUrl.origin}/candidate/dashboard`

        console.log("[v0] OAuth successful, redirecting to:", redirectUrl)
        return NextResponse.redirect(redirectUrl)
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/candidate/login?error=callback_failed`)
      }
    }
  }

  // If no code or user, redirect back to login
  return NextResponse.redirect(`${requestUrl.origin}/candidate/login`)
}
