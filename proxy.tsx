import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route requires employer authentication
  const employerProtectedRoutes = ["/employer/dashboard", "/employer/post-job"]

  if (employerProtectedRoutes.some((route) => pathname.startsWith(route))) {
    const employerSession = request.cookies.get("employer_session")

    // If no session cookie, redirect to login
    if (!employerSession) {
      const url = request.nextUrl.clone()
      url.pathname = "/employer/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Only protect /candidate/dashboard - job viewing should be public, only applying requires login
  const candidateProtectedRoutes = ["/candidate/dashboard"]

  if (candidateProtectedRoutes.some((route) => pathname.startsWith(route))) {
    const candidateSession = request.cookies.get("candidate_session")

    // If no session cookie, redirect to login
    if (!candidateSession) {
      const url = request.nextUrl.clone()
      url.pathname = "/candidate/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/employer/:path*", "/candidate/:path*"],
}
