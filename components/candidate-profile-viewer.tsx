"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getCandidateProfile } from "@/app/actions/candidate-profile-actions"
import { updateApplicationStatus, deleteApplication } from "@/app/actions/job-responses-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Download,
  Target,
  Award,
  Loader2,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  XCircle,
  Circle,
  Trash2,
  MessageCircle,
  ChevronDown,
  Globe,
  User,
} from "lucide-react"
import Link from "next/link"
import ResumeViewer from "./resume-viewer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type CandidateData = {
  id: string
  full_name: string
  email: string
  mobile_number: string
  profile_picture_url: string | null
  resume_url: string | null
  resume_headline: string | null
  gender: string | null
  date_of_birth: string | null
  marital_status: string | null
  current_city: string | null
  current_state: string | null
  work_status: string | null
  currently_employed: string | null
  total_experience_years: number | null
  total_experience_months: number | null
  company_name: string | null
  current_job_title: string | null
  annual_salary: string | null
  notice_period: string | null
  availability_to_join: string | null
  employment_history: Array<{
    job_title: string
    company_name: string
    employment_type: string
    start_date: string
    end_date: string
    is_current: boolean
    currently_working?: boolean
  }> | null
  skills_for_role: string[] | null
  skills_you_know: string[] | null
  industry: string | null
  department: string | null
  role_category: string | null
  job_role: string | null
  preferred_salary: string | null
  preferred_locations: string[] | null
  highest_qualification: string | null
  course: string | null
  course_type: string | null
  specialization: string | null
  university: string | null
  starting_year: string | null
  passing_year: string | null
  duration_from: string | null
  duration_to: string | null
  languages_known: Array<{ language: string; read: boolean; speak: boolean; write: boolean }> | string[] | null
  certifications: Array<{
    certification_name: string
    issuing_organization: string | null
    issue_date: string | null
  }> | null
  projects: Array<{
    title: string
    description: string
    role?: string
    technologies?: string
    start_date: string
    end_date?: string
    url?: string
  }> | null
  accomplishments: Array<{
    title: string
    description?: string
    year?: string
  }> | null
  created_at: string
}

type CandidateProfileViewerProps = {
  candidateId: string
}

export default function CandidateProfileViewer({ candidateId }: CandidateProfileViewerProps) {
  const [candidate, setCandidate] = useState<CandidateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const jobId = searchParams.get("jobId")
  const jobTitle = searchParams.get("jobTitle")
  const applicationId = searchParams.get("applicationId")

  useEffect(() => {
    loadCandidateProfile()
  }, [candidateId])

  const loadCandidateProfile = async () => {
    setLoading(true)
    setError(null)
    const result = await getCandidateProfile(candidateId)
    if (result.success && result.candidate) {
      setCandidate(result.candidate)
    } else {
      setError(result.error || "Failed to load candidate profile")
    }
    setLoading(false)
  }

  const handleStatusChange = async (status: string) => {
    if (!applicationId) {
      toast({
        title: "Error",
        description: "Application ID is missing",
        variant: "destructive",
      })
      return
    }

    setActionLoading(status)
    const result = await updateApplicationStatus(applicationId, status)
    setActionLoading(null)

    if (result.success) {
      toast({
        title: "Status Updated",
        description: `Candidate has been ${status === "shortlisted" ? "shortlisted" : status === "rejected" ? "rejected" : "marked as maybe"}`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!applicationId) {
      toast({
        title: "Error",
        description: "Application ID is missing",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      return
    }

    setActionLoading("delete")
    const result = await deleteApplication(applicationId)
    setActionLoading(null)

    if (result.success) {
      toast({
        title: "Application Deleted",
        description: "The application has been permanently deleted",
      })
      // Navigate back to job responses page after a short delay
      setTimeout(() => {
        router.push(`/employer/job-responses/${jobId}`)
      }, 1500)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete application",
        variant: "destructive",
      })
    }
  }

  const handleEmail = () => {
    if (candidate?.email) {
      window.location.href = `mailto:${candidate.email}`
    }
  }

  const handleWhatsApp = () => {
    if (candidate?.mobile_number) {
      const phoneNumber = candidate.mobile_number.replace(/\D/g, "")
      window.open(`https://wa.me/${phoneNumber}`, "_blank")
    }
  }

  const getExperienceText = () => {
    if (!candidate) return "Not specified" // Added null check for candidate
    if (candidate.work_status === "fresher") return "Fresher"
    const years = candidate.total_experience_years || 0
    const months = candidate.total_experience_months || 0
    if (years === 0 && months === 0) return "Fresher"
    if (months === 0) return `${years} ${years === 1 ? "Year" : "Years"}`
    if (years === 0) return `${months} ${months === 1 ? "Month" : "Months"}`
    return `${years} ${years === 1 ? "Year" : "Years"} ${months} ${months === 1 ? "Month" : "Months"}`
  }

  const getLocationText = () => {
    if (!candidate) return "Not specified" // Added null check for candidate
    if (candidate.current_city && candidate.current_state) {
      return `${candidate.current_city}, ${candidate.current_state}`
    }
    return candidate.current_city || candidate.current_state || "Not specified"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified"
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatSalaryToLPA = (salary: string | null | undefined): string => {
    if (!salary) return "Not specified"

    // Remove commas and any non-numeric characters except decimal point
    const numericValue = salary.replace(/[^0-9.]/g, "")
    const salaryNumber = Number.parseFloat(numericValue)

    if (isNaN(salaryNumber)) return "Not specified"

    // Convert to LPA (1 Lakh = 100,000)
    const lpa = salaryNumber / 100000

    // Format to 2 decimal places if needed
    return `₹${lpa.toFixed(lpa % 1 === 0 ? 0 : 2)} LPA`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.close()} variant="outline">
              Close Tab
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  JK
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  JobKarle
                </span>
              </Link>

              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <ChevronRight className="w-4 h-4" />
                <Link href="/employer/dashboard" className="hover:text-gray-900">
                  All Jobs
                </Link>
                {jobTitle && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="max-w-[200px] truncate">{jobTitle}</span>
                  </>
                )}
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{candidate.full_name}</span>
              </div>
            </div>
            <Button onClick={() => window.history.back()} variant="outline" size="sm">
              Back
            </Button>
          </div>

          {applicationId && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleStatusChange("shortlisted")}
                  disabled={actionLoading !== null}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full px-4"
                >
                  {actionLoading === "shortlisted" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Shortlist
                </Button>
                <Button
                  onClick={() => handleStatusChange("maybe")}
                  disabled={actionLoading !== null}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {actionLoading === "maybe" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Circle className="w-4 h-4 mr-2" />
                  )}
                  Maybe
                </Button>
                <Button
                  onClick={() => handleStatusChange("rejected")}
                  disabled={actionLoading !== null}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  {actionLoading === "rejected" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-2" />
                <Button onClick={handleEmail} size="sm" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-700 bg-transparent"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-2" />
                <Button
                  onClick={handleDelete}
                  disabled={actionLoading !== null}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                >
                  {actionLoading === "delete" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="space-y-3">
          {/* Header with Candidate Info */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Profile Picture */}
                  <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                    <AvatarImage src={candidate.profile_picture_url || undefined} alt={candidate.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                      {candidate.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{candidate.full_name}</h1>

                    {candidate.resume_headline && (
                      <p className="text-base text-gray-700 mb-3 leading-relaxed">{candidate.resume_headline}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span>{candidate.mobile_number}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{getLocationText()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-3">
              {candidate.resume_url && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Resume</h2>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={candidate.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`${candidate.full_name}_Resume.pdf`}
                              className="cursor-pointer"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Download as PDF
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={candidate.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`${candidate.full_name}_Resume.docx`}
                              className="cursor-pointer"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Download as Word
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <ResumeViewer
                      resumeUrl={candidate.resume_url}
                      candidateName={candidate.full_name}
                      candidatePhone={candidate.mobile_number} // Added phone number for WhatsApp button
                    />
                  </CardContent>
                </Card>
              )}

              {/* Professional Summary */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Professional Summary</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Experience" value={getExperienceText()} />
                    <InfoItem label="Current Role" value={candidate.current_job_title || "Not specified"} />
                    <InfoItem label="Company" value={candidate.company_name || "Not specified"} />
                    <InfoItem
                      label="Employment Status"
                      value={candidate.currently_employed === "yes" ? "Employed" : "Not Employed"}
                    />
                    {candidate.work_status !== "fresher" && (
                      <>
                        <InfoItem label="Current Salary" value={candidate.annual_salary || "Not disclosed"} />
                        <InfoItem label="Notice Period" value={candidate.notice_period || "Not specified"} />
                      </>
                    )}
                    {candidate.work_status === "fresher" && candidate.availability_to_join && (
                      <InfoItem label="Availability" value={candidate.availability_to_join} />
                    )}
                    <InfoItem label="Industry" value={candidate.industry || "Not specified"} />
                    <InfoItem label="Department" value={candidate.department || "Not specified"} />
                    <InfoItem label="Role Category" value={candidate.role_category || "Not specified"} />
                    <InfoItem label="Job Role" value={candidate.job_role || "Not specified"} />
                  </div>
                </CardContent>
              </Card>

              {/* Employment History */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Employment History</h2>
                  </div>
                  {candidate.employment_history && candidate.employment_history.length > 0 ? (
                    <div className="space-y-2">
                      {candidate.employment_history.map((job, index) => (
                        <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {job.job_title || job.currentJobTitle || "Job Title Not Specified"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {job.company_name || job.companyName || "Company Not Specified"}
                              </p>
                            </div>
                            {(job.is_current || job.currently_working) && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {job.start_date || job.durationFrom
                              ? new Date(job.start_date || job.durationFrom).toLocaleDateString("en-IN", {
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Start Date Not Specified"}
                            {" - "}
                            {job.is_current || job.currently_working
                              ? "Present"
                              : job.end_date || job.durationTo
                                ? new Date(job.end_date || job.durationTo).toLocaleDateString("en-IN", {
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "End Date Not Specified"}
                          </p>
                          {job.employment_type && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {job.employment_type}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No employment history available</p>
                  )}
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Education</h2>
                  </div>
                  {candidate.highest_qualification || candidate.course ? (
                    <div className="space-y-3">
                      {candidate.highest_qualification && (
                        <InfoItem label="Highest Qualification" value={candidate.highest_qualification} />
                      )}
                      {candidate.course && <InfoItem label="Course" value={candidate.course} />}
                      {candidate.course_type && <InfoItem label="Course Type" value={candidate.course_type} />}
                      {candidate.specialization && <InfoItem label="Specialization" value={candidate.specialization} />}
                      {candidate.university && <InfoItem label="University" value={candidate.university} />}
                      {(candidate.starting_year || candidate.passing_year) && (
                        <InfoItem
                          label="Year"
                          value={`${candidate.starting_year || "N/A"} - ${candidate.passing_year || "N/A"}`}
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No education details provided</p>
                  )}
                </CardContent>
              </Card>

              {/* Projects */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                  </div>
                  {candidate.projects && candidate.projects.length > 0 ? (
                    <div className="space-y-4">
                      {candidate.projects.map((project, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-2">
                          <h3 className="font-semibold text-gray-900">{project.title}</h3>
                          {project.role && <p className="text-sm text-gray-600">Role: {project.role}</p>}
                          <p className="text-sm text-gray-700">{project.description}</p>
                          {project.technologies && (
                            <p className="text-sm text-gray-600">Technologies: {project.technologies}</p>
                          )}
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>
                              {project.start_date} - {project.end_date || "Present"}
                            </span>
                          </div>
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View Project
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No projects added</p>
                  )}
                </CardContent>
              </Card>

              {/* Accomplishments */}
              {/* Added Accomplishments section */}
              {candidate.accomplishments && candidate.accomplishments.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Accomplishments</h2>
                    </div>
                    <div className="space-y-2">
                      {candidate.accomplishments.map((accomplishment, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded-md">
                          <p className="font-medium text-sm">{accomplishment.title}</p>
                          {accomplishment.description && (
                            <p className="text-xs text-gray-600 mt-1">{accomplishment.description}</p>
                          )}
                          {accomplishment.year && (
                            <p className="text-xs text-gray-500 mt-0.5">Year: {accomplishment.year}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Languages Known */}
              {candidate.languages_known && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Languages Known</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidate.languages_known.map((language, index) => {
                        // Check if language is an object with language property
                        const languageName =
                          typeof language === "object" && language !== null ? language.language : language

                        return (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {languageName}
                            {typeof language === "object" && language.read && language.speak && language.write && (
                              <span className="ml-1 text-[10px] opacity-70">(R/W/S)</span>
                            )}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {candidate.certifications && candidate.certifications.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
                    </div>
                    <div className="space-y-2">
                      {candidate.certifications.map((cert, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded-md">
                          <p className="font-medium text-sm">{cert.certification_name}</p>
                          {cert.issuing_organization && (
                            <p className="text-xs text-gray-600 mt-1">{cert.issuing_organization}</p>
                          )}
                          {cert.issue_date && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Issued:{" "}
                              {new Date(cert.issue_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                              })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Skills */}
              {(candidate.skills_for_role?.length > 0 || candidate.skills_you_know?.length > 0) && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                    </div>
                    <div className="space-y-3">
                      {candidate.skills_for_role && candidate.skills_for_role.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Skills for Role</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills_for_role.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {candidate.skills_you_know && candidate.skills_you_know.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">All Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills_you_know.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Languages Known */}
              {candidate.languages_known && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Languages Known</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidate.languages_known.map((language, index) => {
                        // Check if language is an object with language property
                        const languageName =
                          typeof language === "object" && language !== null ? language.language : language

                        return (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {languageName}
                            {typeof language === "object" && language.read && language.speak && language.write && (
                              <span className="ml-1 text-[10px] opacity-70">(R/W/S)</span>
                            )}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Preferences */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Job Preferences</h2>
                  </div>
                  <div className="space-y-3">
                    <InfoItem
                      label="Preferred Salary"
                      value={
                        candidate.preferred_salary ? formatSalaryToLPA(candidate.preferred_salary) : "Not specified"
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Preferred Locations</p>
                      {candidate.preferred_locations && candidate.preferred_locations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {candidate.preferred_locations.map((location, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No locations specified</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  </div>
                  <div className="space-y-3">
                    <InfoItem label="Current City" value={candidate.current_city || "Not specified"} />
                    <InfoItem label="Current State" value={candidate.current_state || "Not specified"} />
                    <InfoItem label="Work Status" value={candidate.work_status || "Not specified"} />
                    <InfoItem label="Gender" value={candidate.gender || "Not specified"} />
                    <InfoItem label="Date of Birth" value={formatDate(candidate.date_of_birth)} />
                    <InfoItem
                      label="Marital Status"
                      value={
                        candidate.marital_status
                          ? candidate.marital_status.charAt(0).toUpperCase() + candidate.marital_status.slice(1)
                          : "Not specified"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component for displaying info items
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-sm text-gray-900 mt-1">{value}</p>
    </div>
  )
}

export { CandidateProfileViewer }
