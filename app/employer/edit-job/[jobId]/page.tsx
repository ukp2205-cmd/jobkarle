import { createAdminClient } from "@/lib/supabase/admin"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { redirect } from "next/navigation"
import EditJobForm from "@/components/edit-job-form"

async function getJobDetails(jobId: string, employerId: string) {
  const supabase = createAdminClient()

  const { data: job, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", jobId)
    .eq("employer_id", employerId)
    .single()

  if (error || !job) {
    return null
  }

  return job
}

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    redirect("/employer/login")
  }

  const { jobId } = await params
  const job = await getJobDetails(jobId, session.employerId)

  if (!job) {
    redirect("/employer/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EditJobForm job={job} employerId={session.employerId} />
    </div>
  )
}
