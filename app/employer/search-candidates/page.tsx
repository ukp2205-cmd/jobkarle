import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { SearchCandidatesPage } from "@/components/search-candidates-page"

async function SearchCandidatesContent({ jobId }: { jobId?: string }) {
  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    redirect("/employer/login")
  }

  return <SearchCandidatesPage employerId={session.employerId} jobId={jobId} />
}

export default async function SearchCandidates({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>
}) {
  const { jobId } = await searchParams

  return (
    <Suspense fallback={null}>
      <SearchCandidatesContent jobId={jobId} />
    </Suspense>
  )
}
