import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { SearchInterface } from "@/components/candidate-search-interface"

export default async function CandidateSearchPage() {
  const cookieStore = await cookies()
  const candidateSession = cookieStore.get("candidate_session")

  if (!candidateSession) {
    redirect("/candidate/login")
  }

  const sessionData = JSON.parse(candidateSession.value)
  const candidateId = sessionData.candidateId
  const candidateName = sessionData.candidateName

  return <SearchInterface candidateId={candidateId} candidateName={candidateName} />
}
