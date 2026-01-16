import { type NextRequest, NextResponse } from "next/server"
import { handleGoogleOAuthCallback } from "@/app/actions/candidate-auth-actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  console.log("[v0] Google OAuth callback received")

  if (error) {
    console.error("[v0] OAuth error:", error)
    return NextResponse.redirect(new URL(`/candidate/login?error=${encodeURIComponent(error)}`, request.url))
  }

  if (!code) {
    console.error("[v0] No authorization code received")
    return NextResponse.redirect(new URL("/candidate/login?error=no_code", request.url))
  }

  try {
    const result = await handleGoogleOAuthCallback(code)

    if (result.success) {
      // Redirect based on whether user is new or existing
      if (result.isNewUser) {
        // New user - redirect to complete registration
        return NextResponse.redirect(new URL("/register?step=2", request.url))
      } else {
        // Existing user - redirect to dashboard
        return NextResponse.redirect(new URL("/candidate/dashboard", request.url))
      }
    } else {
      console.error("[v0] OAuth callback failed:", result.error)
      return NextResponse.redirect(
        new URL(`/candidate/login?error=${encodeURIComponent(result.error || "login_failed")}`, request.url),
      )
    }
  } catch (error) {
    console.error("[v0] OAuth callback error:", error)
    return NextResponse.redirect(new URL("/candidate/login?error=callback_failed", request.url))
  }
}
