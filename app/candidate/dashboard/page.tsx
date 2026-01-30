import { redirect } from "next/navigation"
import { getCandidateSession } from "@/app/actions/candidate-auth-actions"
import { CandidateDashboard } from "@/components/candidate-dashboard"
import { CandidateSessionWrapper } from "@/components/candidate-session-wrapper"
import { DashboardNavigationGuard } from "@/components/dashboard-navigation-guard"

export default async function CandidateDashboardPage() {
  const { success, session } = await getCandidateSession()

  if (!success || !session) {
    redirect("/candidate/login")
  }

  return (
    <DashboardNavigationGuard dashboardType="candidate">
      <CandidateSessionWrapper>
        <CandidateDashboard candidateId={session.candidateId} candidateName={session.fullName} />
      </CandidateSessionWrapper>
    </DashboardNavigationGuard>
  )
}
