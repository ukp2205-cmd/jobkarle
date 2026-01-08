import { redirect } from "next/navigation"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { EmployerProfile } from "@/components/employer-profile"
import { EmployerSessionWrapper } from "@/components/employer-session-wrapper"

export default async function EmployerProfilePage() {
  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    redirect("/employer/login")
  }

  return (
    <EmployerSessionWrapper>
      <EmployerProfile employerId={session.employerId} />
    </EmployerSessionWrapper>
  )
}
