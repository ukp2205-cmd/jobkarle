import { redirect } from "next/navigation"
import { getCandidateSession } from "@/app/actions/candidate-auth-actions"
import { CandidateDashboard } from "@/components/candidate-dashboard"
import { CandidateSessionWrapper } from "@/components/candidate-session-wrapper"

export default async function CandidateDashboardPage() {
  const { success, session } = await getCandidateSession()

  if (!success || !session) {
    redirect("/candidate/login")
  }

  return (
    <CandidateSessionWrapper>
      <CandidateDashboard candidateId={session.candidateId} candidateName={session.fullName} />
    </CandidateSessionWrapper>
  )
}
