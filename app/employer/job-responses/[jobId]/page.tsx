import { redirect } from "next/navigation"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { JobResponsesManager } from "@/components/job-responses-manager"

export default async function JobResponsesPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params

  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    redirect("/employer/login")
  }

  return <JobResponsesManager jobId={jobId} employerId={session.employerId} />
}
