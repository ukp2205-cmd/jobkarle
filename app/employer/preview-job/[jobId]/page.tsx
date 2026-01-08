import { getJobPostingById } from "@/app/actions/job-dashboard-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Share2 } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function EmployerJobPreviewPage({
  params,
}: {
  params: Promise<{ jobId: string }> | { jobId: string }
}) {
  const resolvedParams = await Promise.resolve(params)
  const { jobId } = resolvedParams

  // Fetch job details
  const result = await getJobPostingById(jobId)

  if (!result.success || !result.job) {
    redirect("/employer/dashboard")
  }

  const job = result.job

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-base">JK</span>
            </div>
            <span className="text-xl font-semibold text-blue-600">JobKarle</span>
          </Link>

          <div className="flex gap-2">
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Link href={`/employer/edit-job/${jobId}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Job
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 hover:bg-gray-100">
          <Link href="/employer/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Share2 className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Preview Mode</h3>
            <p className="text-sm text-blue-800">
              This is how your job posting appears to you. To see how candidates view this job, use the "Share on social
              media" option from your dashboard.
            </p>
          </div>
        </div>

        <Card className="p-6 md:p-8">
          {/* Job Title and Company */}
          <div className="border-b pb-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{job.job_title}</h1>
            <p className="text-lg text-gray-700">{job.company_name}</p>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Employment Type</p>
              <p className="font-medium capitalize">{job.employment_type?.replace("-", " ") || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Work Mode</p>
              <p className="font-medium capitalize">{job.work_mode?.replace("-", " ") || "Not specified"}</p>
            </div>
            {job.shifts && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Shift</p>
                <p className="font-medium capitalize">{job.shifts}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="font-medium">
                {job.min_experience || 0} - {job.max_experience || 0} years
              </p>
            </div>
            {job.openings && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Number of Openings</p>
                <p className="font-medium">{job.openings}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Salary Range</p>
              <p className="font-medium">
                ₹{job.min_salary?.toLocaleString("en-IN")} - ₹{job.max_salary?.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Job Category</p>
              <p className="font-medium capitalize">{job.category?.replace("-", " ") || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <Badge variant={job.status === "published" ? "default" : "secondary"}>{job.status}</Badge>
            </div>
          </div>

          {/* Locations */}
          {job.job_locations && job.job_locations.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Locations</p>
              <div className="flex flex-wrap gap-2">
                {job.job_locations.map((location, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700">
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Required Skills */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          {job.job_description && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Job Description</p>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.job_description }}
              />
            </div>
          )}

          {/* Key Responsibilities */}
          {job.key_responsibilities && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Key Responsibilities</p>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.key_responsibilities }}
              />
            </div>
          )}

          {/* Required Qualifications */}
          {job.required_qualifications && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Required Qualifications</p>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.required_qualifications }}
              />
            </div>
          )}

          {/* Diversity Hiring */}
          {job.diversity_hiring && (
            <div className="mb-6 border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Diversity Hiring</p>
              <p className="font-medium capitalize">{job.diversity_hiring.replace("-", " ")}</p>
            </div>
          )}

          {/* Perks and Benefits */}
          {job.perks && job.perks.length > 0 && (
            <div className="mb-6 border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Perks and Benefits</p>
              <div className="flex flex-wrap gap-2">
                {job.perks.map((perk, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700">
                    {perk}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Screening Questions */}
          {job.screening_questions && job.screening_questions.length > 0 && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Screening Questions</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                {job.screening_questions.map((question, idx) => (
                  <li key={idx}>{question}</li>
                ))}
              </ol>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button asChild variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href={`/employer/edit-job/${jobId}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit This Job
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/employer/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
