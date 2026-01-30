"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  IndianRupee,
  Clock,
  Bookmark,
  Building2,
  GraduationCap,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { applyToJob, saveJob, unsaveJob } from "@/app/actions/candidate-dashboard-actions"
import { getTimeAgo } from "@/lib/time-utils"

type Job = {
  id: string
  job_title: string
  company_name: string
  job_locations: string[]
  min_experience: number
  max_experience: number
  min_salary: number
  max_salary: number
  employment_type: string
  work_mode: string
  required_skills: string[]
  job_description: string
  key_responsibilities: string
  required_qualifications: string
  perks: string[]
  screening_questions: string[]
  created_at: string
  status?: string
  category?: string
  shift?: string
  educational_qualifications?: any[]
  candidate_industries?: string[]
  role_description?: string
  employer_id?: string
  company_logo_url?: string
  employers?: {
    logo_url?: string
    description?: string
    company_name?: string
  }
}

export function JobDetailView({
  job,
  candidateId,
  isSaved: initialIsSaved,
  hasApplied: initialHasApplied,
  isAuthenticated = false,
}: {
  job: Job
  candidateId?: string
  isSaved: boolean
  hasApplied: boolean
  isAuthenticated?: boolean
}) {
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [screeningAnswers, setScreeningAnswers] = useState<Record<number, string>>({})
  const [isApplying, setIsApplying] = useState(false)
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [hasApplied, setHasApplied] = useState(initialHasApplied)

  const jobStatus = job.status || "published"
  const isJobClosed = jobStatus === "closed"
  const isJobExpired = jobStatus === "expired"
  const isJobDraft = jobStatus === "draft"
  const canApply = jobStatus === "published"

  const getStatusMessage = () => {
    if (isJobClosed) return "This job is no longer accepting applications because it has been closed by the employer."
    if (isJobExpired) return "This job posting has expired and is no longer accepting applications."
    if (isJobDraft) return "This job is not yet published and is not accepting applications."
    return null
  }

  const handleApply = async () => {
    if (!isAuthenticated || !candidateId) {
      // Redirect to login with return URL
      router.push(`/candidate/login?redirect=/candidate/jobs/${job.id}`)
      return
    }

    if (!canApply) {
      alert("This job is not accepting applications")
      return
    }

    if (job.screening_questions && job.screening_questions.length > 0) {
      const unanswered = job.screening_questions.some((_, idx) => !screeningAnswers[idx]?.trim())
      if (unanswered) {
        alert("Please answer all screening questions")
        return
      }
    }

    setIsApplying(true)

    const result = await applyToJob(candidateId, job.id, screeningAnswers)

    if (result.success) {
      setHasApplied(true)
      setShowApplyModal(false)
      alert("✅ Application submitted successfully! The employer will review your application.")
      router.push("/candidate/dashboard")
    } else {
      alert(result.error || "Failed to apply")
    }
    setIsApplying(false)
  }

  const handleSave = async () => {
    if (!isAuthenticated || !candidateId) {
      router.push(`/candidate/login?redirect=/candidate/jobs/${job.id}`)
      return
    }

    if (isSaved) {
      const result = await unsaveJob(candidateId, job.id)
      if (result.success) {
        setIsSaved(false)
      }
    } else {
      const result = await saveJob(candidateId, job.id)
      if (result.success) {
        setIsSaved(true)
      }
    }
  }

  const getLocationString = (locations: string[]) => {
    if (!locations || locations.length === 0) return "Not specified"
    return locations.join(", ")
  }

  const getSalaryString = (min: number, max: number) => {
    if (!min && !max) return "Not disclosed"

    const minLakhs = min
    const maxLakhs = max

    if (min && max) return `${Math.round(minLakhs)} - ${Math.round(maxLakhs)} LPA`
    if (min) return `${Math.round(minLakhs)}+ LPA`
    return "Not disclosed"
  }

  const getCompanyInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getArrayString = (value: any) => {
    if (!value) return null
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "string") return value
    return null
  }

  const getCompanyLogo = () => {
    // Priority 1: Job-specific company logo
    if (job.company_logo_url) {
      return job.company_logo_url
    }
    // Priority 2: Employer's logo from employers table
    if (job.employers?.logo_url) {
      return job.employers.logo_url
    }
    // Default: JobKarle logo as fallback
    return "/jobkarle-logo.png"
  }

  const getCompanyDescription = () => {
    if (job.employers?.description) {
      return job.employers.description
    }
    return `${job.company_name} is currently hiring for the ${job.job_title} position. Join our team and contribute to exciting projects in a dynamic work environment.`
  }

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

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        <Card className="p-4 md:p-8">
          {!canApply && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Job Not Available</h3>
                <p className="text-sm text-amber-800">{getStatusMessage()}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 mb-6">
            <Avatar className="w-12 h-12 md:w-16 md:h-16 border-2 border-gray-200">
              <AvatarImage src={getCompanyLogo() || "/placeholder.svg"} alt={job.company_name} />
              <AvatarFallback className="bg-blue-600 text-white text-base md:text-lg font-semibold">
                {getCompanyInitials(job.company_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">{job.job_title}</h1>
              <div className="text-base md:text-lg text-gray-700 mb-4">{job.company_name}</div>

              <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>
                    {job.min_experience || 0}-{job.max_experience || 0} years
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  <span>{getSalaryString(job.min_salary, job.max_salary)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="break-words">{getLocationString(job.job_locations)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{job.employment_type}</span>
                </div>
                {job.created_at && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Posted {getTimeAgo(job.created_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex md:flex-col gap-2 w-full md:w-auto">
              {hasApplied ? (
                <Button size="default" className="flex-1 md:flex-none px-6 bg-green-600 hover:bg-green-700" disabled>
                  Applied
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (!isAuthenticated || !candidateId) {
                      router.push(`/candidate/login?redirect=/candidate/jobs/${job.id}`)
                    } else {
                      setShowApplyModal(true)
                    }
                  }}
                  size="default"
                  className="flex-1 md:flex-none px-6 bg-blue-600 hover:bg-blue-700"
                  disabled={!canApply}
                >
                  {!isAuthenticated ? "Login to Apply" : canApply ? "Apply" : "Not Available"}
                </Button>
              )}
              <Button
                onClick={handleSave}
                variant="outline"
                size="default"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>

          {job.required_skills && job.required_skills.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Job Description</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.job_description }}
              />
            </div>

            {job.key_responsibilities && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Key Responsibilities</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: job.key_responsibilities }}
                />
              </div>
            )}

            {job.required_qualifications && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Required Qualifications</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: job.required_qualifications }}
                />
              </div>
            )}

            {job.perks && job.perks.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Perks and Benefits</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {job.perks.map((perk, idx) => (
                    <li key={idx}>{perk}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.candidate_industries && getArrayString(job.candidate_industries) && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Industry Type</div>
                      <div className="text-sm text-gray-600">{getArrayString(job.candidate_industries)}</div>
                    </div>
                  </div>
                )}

                {job.category && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Category</div>
                      <div className="text-sm text-gray-600">{job.category}</div>
                    </div>
                  </div>
                )}

                {job.role_description && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Role</div>
                      <div className="text-sm text-gray-600">{job.role_description}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Employment Type</div>
                    <div className="text-sm text-gray-600">{job.employment_type || "Full-time"}</div>
                  </div>
                </div>

                {job.educational_qualifications && getArrayString(job.educational_qualifications) && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Education</div>
                      <div className="text-sm text-gray-600">{getArrayString(job.educational_qualifications)}</div>
                    </div>
                  </div>
                )}

                {job.shift && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Shift</div>
                      <div className="text-sm text-gray-600">{job.shift}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">About {job.company_name}</h3>
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 border-2 border-gray-200">
                  <AvatarImage src={getCompanyLogo() || "/placeholder.svg"} alt={job.company_name} />
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                    {getCompanyInitials(job.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">{job.company_name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {getArrayString(job.candidate_industries)
                      ? `Industry: ${getArrayString(job.candidate_industries)}`
                      : "Industry information not available"}
                  </div>
                  <div className="text-sm text-gray-700">{getCompanyDescription()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            {hasApplied ? (
              <Button size="default" className="px-8 bg-green-600 hover:bg-green-700" disabled>
                Applied
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!isAuthenticated || !candidateId) {
                    router.push(`/candidate/login?redirect=/candidate/jobs/${job.id}`)
                  } else {
                    setShowApplyModal(true)
                  }
                }}
                size="default"
                className="px-8 bg-blue-600 hover:bg-blue-700"
                disabled={!canApply}
              >
                {!isAuthenticated ? "Login to Apply" : canApply ? "Apply for this position" : "Applications Closed"}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Apply for {job.job_title}</h3>

            {job.screening_questions && job.screening_questions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">Please answer the following screening questions:</p>
                {job.screening_questions.map((question, idx) => (
                  <div key={idx}>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {idx + 1}. {question}
                    </label>
                    <Input
                      value={screeningAnswers[idx] || ""}
                      onChange={(e) => setScreeningAnswers({ ...screeningAnswers, [idx]: e.target.value })}
                      placeholder="Your answer"
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">No screening questions for this job. Click submit to apply.</p>
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowApplyModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={isApplying} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isApplying ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
