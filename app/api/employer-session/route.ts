import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { NextResponse } from "next/server"

export async function GET() {
  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  return NextResponse.json({
    employerId: session.employerId,
    email: session.email,
    companyName: session.companyName,
    contactPerson: session.contactPerson,
  })
}
