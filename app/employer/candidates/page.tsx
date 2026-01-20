import { redirect } from "next/navigation"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { CandidatesView } from "@/components/candidates-view"

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    redirect("/employer/login")
  }

  const params = await searchParams

  return <CandidatesView employerId={session.employerId} searchParams={params} />
}
