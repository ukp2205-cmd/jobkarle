import { loginEmployer } from "@/app/actions/employer-auth-actions"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("[v0] Login API called for:", email)

    const result = await loginEmployer(email, password)

    console.log("[v0] Login result:", JSON.stringify(result))

    if (result.success) {
      console.log("[v0] Login successful, returning employer data")
      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          companyName: result.user.companyName,
          contactPerson: result.user.contactPerson,
          mobileNumber: result.user.mobileNumber, // Added from session
        },
      })
    } else {
      console.log("[v0] Login failed with error:", result.error)
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Login failed",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("[v0] Login API error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during login",
      },
      { status: 500 },
    )
  }
}
