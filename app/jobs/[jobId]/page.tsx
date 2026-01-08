import { getCandidateSession } from "@/app/actions/candidate-auth-actions"
import { getJobDetails, isJobSaved } from "@/app/actions/candidate-dashboard-actions"
import { JobDetailView } from "@/components/job-detail-view"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home } from "lucide-react"
import Link from "next/link"

export default async function PublicJobPage({ params }: { params: Promise<{ jobId: string }> | { jobId: string } }) {
  try {
    console.log("[v0] Public Job Page: Starting to load")

    const resolvedParams = await Promise.resolve(params)
    const { jobId } = resolvedParams

    console.log("[v0] Public Job Page: Job ID:", jobId)

    if (!jobId || typeof jobId !== "string" || jobId.trim().length === 0) {
      console.log("[v0] Public Job Page: Invalid or missing job ID")
      return <JobNotFoundError message="Invalid job ID format" jobId={jobId || "N/A"} />
    }

    // Get candidate session if logged in (optional)
    console.log("[v0] Public Job Page: Checking for candidate session")
    const { success, session } = await getCandidateSession()
    console.log("[v0] Public Job Page: Session result:", { success, candidateId: session?.candidateId })

    console.log("[v0] Public Job Page: This is a PUBLIC page - anyone can view without login")

    // Fetch job details
    console.log("[v0] Public Job Page: Fetching job details for job:", jobId)
    const result = await getJobDetails(jobId, session?.candidateId)
    console.log("[v0] Public Job Page: Job details result:", {
      success: result.success,
      hasJob: !!result.job,
      error: result.error,
    })

    if (!result.success || !result.job) {
      console.error("[v0] Public Job Page: Job not found or fetch failed:", {
        success: result.success,
        error: result.error,
        jobId,
      })
      return (
        <JobNotFoundError
          message={result.error || "Job not found or no longer available"}
          jobId={jobId}
          technicalDetails={result.error}
        />
      )
    }

    // Check if job is saved (only if user is logged in)
    let isSaved = false
    if (success && session?.candidateId) {
      console.log("[v0] Public Job Page: Checking if job is saved")
      const savedResult = await isJobSaved(session.candidateId, jobId)
      isSaved = savedResult.isSaved || false
      console.log("[v0] Public Job Page: Is saved:", isSaved)
    }

    console.log("[v0] Public Job Page: Rendering JobDetailView component")
    console.log("[v0] Public Job Page: Anyone can view. Login only required for Apply/Save actions")

    return (
      <JobDetailView
        job={result.job}
        candidateId={session?.candidateId}
        isSaved={isSaved}
        hasApplied={result.hasApplied || false}
        isAuthenticated={success}
      />
    )
  } catch (error) {
    console.error("[v0] Public Job Page: ERROR occurred:", error)
    console.error("[v0] Public Job Page: Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
    return (
      <JobNotFoundError
        message="An error occurred while loading job details"
        jobId="unknown"
        technicalDetails={(error as Error).message}
      />
    )
  }
}

function JobNotFoundError({
  message,
  jobId,
  technicalDetails,
}: {
  message: string
  jobId: string
  technicalDetails?: string
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-base">JK</span>
            </div>
            <span className="text-xl font-semibold text-blue-600">JobKarle</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <Card className="p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Job Not Found</h1>

          <p className="text-gray-600 mb-2 max-w-md mx-auto">{message}</p>

          {process.env.NODE_ENV === "development" && technicalDetails && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs font-mono text-gray-700">
                <strong>Debug Info:</strong>
                <br />
                Job ID: {jobId}
                <br />
                Error: {technicalDetails}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/candidate/search">
                <Home className="w-4 h-4 mr-2" />
                Browse Jobs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            The job you're looking for may have been removed, expired, or the link may be incorrect.
          </p>
        </Card>
      </div>
    </div>
  )
}
