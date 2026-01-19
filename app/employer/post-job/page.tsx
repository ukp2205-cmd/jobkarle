import { JobPostingForm } from "@/components/job-posting-form"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { EmployerSessionWrapper } from "@/components/employer-session-wrapper"
import Link from "next/link"

export default async function PostJobPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; edit?: string }>
}) {
  const { success, session } = await getEmployerSession()
  const params = await searchParams

  console.log("[v0] Post Job Page - Auth check:", { success, hasSession: !!session })

  // If not authenticated, show login prompt
  if (!success || !session) {
    console.log("[v0] User not authenticated, showing login prompt")
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in as an employer to post a job. Please register or login to continue.
          </p>
          <div className="space-y-3">
            <Link
              href="/employer/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Login as Employer
            </Link>
            <Link
              href="/employer/register"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Register as Employer
            </Link>
            <Link
              href="/"
              className="block w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  console.log("[v0] User authenticated, showing job posting form for employer:", session.employerId)

  return (
    <EmployerSessionWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <JobPostingForm employerId={session.employerId} jobType={params.type} logoUrl={session.logoUrl} />
      </div>
    </EmployerSessionWrapper>
  )
}
