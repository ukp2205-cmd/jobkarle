import { logoutEmployer } from "@/app/actions/employer-auth-actions"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const result = await logoutEmployer()
    if (result.success) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  } catch (error) {
    console.error("[v0] Error in logout API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
