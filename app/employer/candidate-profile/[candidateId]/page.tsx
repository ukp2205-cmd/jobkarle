import { CandidateProfileViewer } from "@/components/candidate-profile-viewer"

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ candidateId: string }>
}) {
  const { candidateId } = await params

  return <CandidateProfileViewer candidateId={candidateId} />
}
