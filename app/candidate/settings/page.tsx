import { redirect } from "next/navigation"
import { getCandidateSession } from "@/app/actions/candidate-auth-actions"
import { CandidateSettingsView } from "@/components/candidate-settings-view"

export default async function CandidateSettingsPage() {
  const { success, session } = await getCandidateSession()

  if (!success || !session) {
    redirect("/candidate/login")
  }

  return <CandidateSettingsView candidateId={session.candidateId} />
}
