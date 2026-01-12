import { redirect } from "next/navigation"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { JobsDashboard } from "@/components/jobs-dashboard"
import { EmployerSessionWrapper } from "@/components/employer-session-wrapper"

export default async function EmployerDashboardPage() {
  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    redirect("/employer/login")
  }

  return (
    <EmployerSessionWrapper>
      <JobsDashboard
        employerId={session.employerId}
        employerName={session.contactPerson || session.email?.split("@")[0] || "Employer"}
        companyName={session.companyName || "Company"}
        logoUrl={session.logoUrl}
      />
    </EmployerSessionWrapper>
  )
}
