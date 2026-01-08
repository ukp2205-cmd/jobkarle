import { redirect } from "next/navigation"
import { getCandidateSession } from "@/app/actions/candidate-auth-actions"
import { CandidateDashboard } from "@/components/candidate-dashboard"

export default async function CandidateDashboardPage() {
  const { success, session } = await getCandidateSession()

  if (!success || !session) {
    redirect("/candidate/login")
  }

  return <CandidateDashboard candidateId={session.candidateId} candidateName={session.fullName} />
}
