"use client"

import type React from "react"

import { useState, useEffect, useRef, type Event } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardNavigationGuard } from "@/components/dashboard-navigation-guard"
import {
  Plus,
  Trash2,
  Calendar,
  FileText,
  Download,
  Upload,
  Edit,
  Loader2,
  User,
  Search,
  LogOut,
  Briefcase,
  MapPin,
  IndianRupee,
  Eye,
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Ban,
  EyeOff,
  AlertTriangle,
  Settings,
  Mail,
  Phone,
  Award,
  Target,
  Languages,
  GraduationCap,
} from "lucide-react" // Added Calendar, Plus, Trash2, FileText, Download, Upload, Edit, Loader2, User, Settings
import {
  getRecommendedJobs,
  saveJob,
  getSavedJobs,
  unsaveJob,
  getMyApplications,
  updateCandidateProfile,
  uploadResume,
  updateEmploymentHistory,
} from "@/app/actions/candidate-actions"
import { logoutCandidate } from "@/app/actions/candidate-auth-actions"
import { getCandidateProfile } from "@/app/actions/candidate-profile-actions"
import { InfoField } from "@/components/info-field"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getCandidatePrivacySettings,
  updateProfileVisibility,
  blockCompany,
  unblockCompany,
  deactivateProfile,
  reactivateProfile,
  searchCompanies,
} from "@/app/actions/candidate-privacy-actions"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Added Avatar components
import { getTimeAgo } from "@/lib/time-utils" // Added import for getTimeAgo

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
  created_at: string
  job_description: string
  openings?: number
  category?: string // Added for premium jobs
  urgent_hiring?: boolean // Added for urgent hiring tag
  company_logo_url?: string // Added for company logo URL
  employers?: { logo_url?: string } // Added for employer logo from join
}

// Added JobWithStatus to accommodate status like 'applied' or 'saved'
type JobWithStatus = Job & { status?: "applied" | "saved" }

type CandidateDashboardProps = {
  candidateId: string
  candidateName: string
}

const JOBS_PER_PAGE = 10

const calculateProfileCompletion = (profile: any): number => {
  if (!profile) return 0

  const fields = [
    profile.full_name,
    profile.email,
    profile.mobile_number,
    profile.resume_url,
    profile.resume_headline,
    profile.gender,
    profile.current_city,
    profile.current_state,
    profile.work_status,
    profile.current_job_title,
    profile.company_name,
    profile.industry,
    profile.department,
    profile.role_category,
    profile.job_role,
    profile.annual_salary,
    profile.notice_period,
    profile.skills && profile.skills.length > 0,
    profile.highest_qualification,
    profile.course,
    profile.university,
    profile.passing_year,
    profile.preferred_salary,
    profile.preferred_locations && profile.preferred_locations.length > 0,
    profile.date_of_birth,
    profile.marital_status,
    profile.languages_known && profile.languages_known.length > 0,
    profile.certifications && profile.certifications.length > 0,
    profile.projects && profile.projects.length > 0,
    profile.profile_picture_url,
  ]

  const filledFields = fields.filter((field) => field !== null && field !== undefined && field !== "").length
  return Math.round((filledFields / fields.length) * 100)
}

// Helper component for Employment History Edit Form
type EmploymentEditFormProps = {
  employmentHistory: any[]
  onSave: (history: any[]) => void
  onCancel: () => void
}

const EmploymentEditForm: React.FC<EmploymentEditFormProps> = ({ employmentHistory, onSave, onCancel }) => {
  const [history, setHistory] = useState(employmentHistory)
  const [isSaving, setIsSaving] = useState(false)

  const addJob = () => {
    setHistory([
      ...history,
      { job_title: "", company_name: "", start_date: "", end_date: "", is_current: false, employment_type: "" },
    ])
  }

  const updateJob = (index: number, field: string, value: any) => {
    const updated = [...history]
    updated[index] = { ...updated[index], [field]: value }
    setHistory(updated)
  }

  const removeJob = (index: number) => {
    setHistory(history.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Basic validation example
    const valid = history.every((job) => job.job_title && job.company_name && job.start_date)
    if (!valid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for each job.",
        variant: "destructive",
      })
      setIsSaving(false)
      return
    }
    onSave(history)
    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      {history.length > 0 ? (
        history.map((job, index) => (
          <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Job Title *"
                  value={job.job_title}
                  onChange={(e) => updateJob(index, "job_title", e.target.value)}
                  className="rounded-full"
                />
                <Input
                  placeholder="Company Name *"
                  value={job.company_name}
                  onChange={(e) => updateJob(index, "company_name", e.target.value)}
                  className="rounded-full"
                />
                <Input
                  type="date"
                  placeholder="Start Date *"
                  value={job.start_date}
                  onChange={(e) => updateJob(index, "start_date", e.target.value)}
                  className="rounded-full"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={job.end_date || ""}
                  onChange={(e) => updateJob(index, "end_date", e.target.value)}
                  disabled={job.is_current}
                  className="rounded-full"
                />
                <Select
                  value={job.employment_type || ""}
                  onValueChange={(val) => updateJob(index, "employment_type", val)}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`currently-working-${index}`}
                    checked={job.is_current}
                    onChange={(e) => {
                      updateJob(index, "is_current", e.target.checked)
                      if (e.target.checked) {
                        updateJob(index, "end_date", "") // Clear end date if current
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`currently-working-${index}`} className="text-sm font-medium">
                    Currently Working
                  </Label>
                </div>
              </div>
              <Button onClick={() => removeJob(index)} variant="ghost" size="icon" className="text-red-600 ml-2">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Job Description"
              value={job.job_description || ""}
              onChange={(e) => updateJob(index, "job_description", e.target.value)}
              rows={2}
              className="rounded-full"
            />
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">No employment history added yet.</p>
      )}

      <div className="flex items-center gap-2 mt-4">
        <Button onClick={addJob} size="sm" variant="outline" className="flex-shrink-0 bg-transparent rounded-full">
          <Plus className="w-4 h-4 mr-1" />
          Add Job
        </Button>
        <div className="flex-1 border-t border-dashed border-gray-300"></div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="rounded-full bg-transparent">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

function CandidateDashboard({ candidateId, candidateName }: CandidateDashboardProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobWithStatus[]>([])
  const [savedJobsList, setSavedJobsList] = useState<string[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<"recommended" | "saved">("recommended")
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [showProfileView, setShowProfileView] = useState(false) // Renamed from showProfile
  const [profileData, setProfileData] = useState<any>(null)

  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false) // Added for upload state
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false) // Added for save profile button state

  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [activePrivacyDialog, setActivePrivacyDialog] = useState<"visibility" | "blocked" | "deactivate" | null>(null)
  const [privacySettings, setPrivacySettings] = useState<any>(null)
  const [blockedCompanies, setBlockedCompanies] = useState<any[]>([])
  const [companySearchQuery, setCompanySearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedCompanyToBlock, setSelectedCompanyToBlock] = useState<any>(null)
  const [blockReason, setBlockReason] = useState("")
  const [customBlockReason, setCustomBlockReason] = useState("")
  const [deactivationReason, setDeactivationReason] = useState("")
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)

  // State for profile picture upload
  const [isPictureUploading, setIsPictureUploading] = useState(false)
  const profilePictureInputRef = useRef<HTMLInputElement>(null)

  const [skillDuplicateError, setSkillDuplicateError] = useState("")

  const [languages, setLanguages] = useState<
    Array<{
      language: string
      read: boolean
      write: boolean
      speak: boolean
    }>
  >([])

  const [certifications, setCertifications] = useState<
    Array<{
      name: string
      topic: string
      from_date: string
      to_date: string
      url: string
      issuer?: string // Added issuer field
    }>
  >([])

  const [projects, setProjects] = useState<
    Array<{
      name: string
      description: string
      url: string
      technologies: string
    }>
  >([])

  const resumeInputRef = useRef<HTMLInputElement>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null) // "employment", "education", etc.

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      console.log("[v0] Loading candidate profile data for:", candidateId)
      const result = await getCandidateProfile(candidateId)

      if (result.success && result.candidate) {
        console.log("[v0] Profile data loaded successfully")
        console.log("[v0] Employment history:", result.candidate.employment_history)
        console.log("[v0] Skills:", result.candidate.skills)
        console.log("[v0] Preferred salary:", result.candidate.preferred_salary)
        console.log("[v0] Education:", result.candidate.highest_qualification, result.candidate.course)
        console.log("[v0] Certifications:", result.candidate.certifications)
        console.log("[v0] Projects:", result.candidate.projects)

        setProfileData(result.candidate)

        // Initialize arrays for edit mode
        if (result.candidate.languages_known) {
          setLanguages(Array.isArray(result.candidate.languages_known) ? result.candidate.languages_known : [])
        }
        if (result.candidate.certifications) {
          setCertifications(Array.isArray(result.candidate.certifications) ? result.candidate.certifications : [])
        }
        if (result.candidate.projects) {
          setProjects(Array.isArray(result.candidate.projects) ? result.candidate.projects : [])
        }
      } else {
        console.error("[v0] Failed to load profile:", result.error)
      }
    }

    loadProfileData()
  }, [candidateId])

  useEffect(() => {
    if (!profileData) return

    // </CHANGE> Fixed languages_known initialization - it's already an array of objects with {language, read, write, speak}
    if (profileData?.languages_known && Array.isArray(profileData.languages_known)) {
      setLanguages(profileData.languages_known)
    }
    if (profileData?.certifications && Array.isArray(profileData.certifications)) {
      setCertifications(
        profileData.certifications.map((cert: any) =>
          typeof cert === "string" ? { name: cert, topic: "", from_date: "", to_date: "", url: "" } : cert,
        ),
      )
    }
    if (profileData?.projects && Array.isArray(profileData.projects)) {
      setProjects(
        profileData.projects.map((proj: any) =>
          typeof proj === "string" ? { name: proj, description: "", url: "", technologies: "" } : proj,
        ),
      )
    }
  }, [profileData])

  const addLanguage = () => {
    setLanguages([...languages, { language: "", read: false, write: false, speak: false }])
  }

  const updateLanguage = (index: number, field: string, value: any) => {
    const updated = [...languages]
    updated[index] = { ...updated[index], [field]: value }
    setLanguages(updated)
  }

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index))
  }

  const addCertification = () => {
    setCertifications([...certifications, { name: "", topic: "", from_date: "", to_date: "", url: "", issuer: "" }])
  }

  const updateCertification = (index: number, field: string, value: string) => {
    const updated = [...certifications]
    updated[index] = { ...updated[index], [field]: value }
    setCertifications(updated)
  }

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const addProject = () => {
    setProjects([...projects, { name: "", description: "", url: "", technologies: "" }])
  }

  const updateProject = (index: number, field: string, value: string) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      const { applications } = await getMyApplications(candidateId)
      const appliedIds = new Set(applications.map((app: any) => app.job_id))
      setAppliedJobIds(appliedIds)

      const result = await getRecommendedJobs(candidateId)
      if (result.success) {
        const jobsWithStatus = result.jobs.map((job: Job) => ({
          ...job,
          status: appliedIds.has(job.id) ? "applied" : undefined,
        }))
        setJobs(jobsWithStatus)
        if (activeTab === "recommended") {
          setFilteredJobs(jobsWithStatus)
        }
      }

      const savedResult = await getSavedJobs(candidateId)
      if (savedResult.success) {
        setSavedJobsList(savedResult.jobs.map((job: Job) => job.id))
        const savedIds = new Set(savedResult.jobs.map((job) => job.id))
        setSavedJobs(savedIds)

        const savedJobsWithStatus = savedResult.jobs.map((job: Job) => ({
          ...job,
          status: "saved",
        }))

        if (activeTab === "saved") {
          setFilteredJobs(savedJobsWithStatus)
        }
      }
      setIsLoading(false)
    }
    loadData()
  }, [candidateId, activeTab])

  useEffect(() => {
    const currentJobs =
      activeTab === "recommended"
        ? jobs
        : (savedJobsList.map((id) => jobs.find((job) => job.id === id)!).filter(Boolean) as JobWithStatus[])

    setFilteredJobs(currentJobs)
    setCurrentPage(1)
  }, [jobs, savedJobsList, activeTab])

  const loadJobs = async () => {
    setIsLoading(true)
    const result = await getRecommendedJobs(candidateId)
    if (result.success) {
      const jobsWithStatus = result.jobs.map((job: Job) => ({
        ...job,
        status: appliedJobIds.has(job.id) ? "applied" : undefined,
      }))
      setJobs(jobsWithStatus)
      if (activeTab === "recommended") {
        setFilteredJobs(jobsWithStatus)
      }
    }
    setIsLoading(false)
  }

  const loadSavedJobs = async () => {
    const result = await getSavedJobs(candidateId)
    if (result.success) {
      setSavedJobsList(result.jobs.map((job: Job) => job.id))
      const savedIds = new Set(result.jobs.map((job) => job.id))
      setSavedJobs(savedIds)

      const savedJobsWithStatus = result.jobs.map((job: Job) => ({
        ...job,
        status: "saved",
      }))

      if (activeTab === "saved") {
        setFilteredJobs(savedJobsWithStatus)
      }
    }
  }

  const handleLogout = async () => {
    await logoutCandidate()
    window.location.href = "/candidate/login"
  }

  const handleSaveJob = async (jobId: string) => {
    if (savedJobs.has(jobId)) {
      const result = await unsaveJob(candidateId, jobId)
      if (result.success) {
        setSavedJobs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        loadSavedJobs()
      }
    } else {
      const result = await saveJob(candidateId, jobId)
      if (result.success) {
        setSavedJobs((prev) => new Set([...prev, jobId]))
        loadSavedJobs()
      }
    }
  }

  const handleViewJob = (jobId: string) => {
    router.push(`/candidate/jobs/${jobId}`)
  }

  const getLocationString = (locations: string[]) => {
    if (!locations || locations.length === 0) return "Not specified"
    return locations.join(", ")
  }

  const formatSalary = (salary: string | number | null) => {
    if (!salary) return "Not specified"

    // Remove commas if present and convert to number
    const salaryStr = typeof salary === "string" ? salary.replace(/,/g, "") : String(salary)
    const salaryNum = Number.parseFloat(salaryStr)

    if (isNaN(salaryNum)) return "Not specified"

    // If number is already in lakhs (< 100), return as is
    if (salaryNum < 100) {
      return `${salaryNum.toFixed(2)} LPA`
    }

    // Otherwise divide by 100000 to convert to lakhs
    return `${(salaryNum / 100000).toFixed(2)} LPA`
  }

  const getSalaryString = (minSalary: number | null, maxSalary: number | null) => {
    if (minSalary === null && maxSalary === null) return "Not specified"
    if (minSalary !== null && maxSalary !== null) {
      return `${formatSalary(minSalary)} - ${formatSalary(maxSalary)}`
    }
    if (minSalary !== null) {
      return `₹${formatSalary(minSalary)} onwards`
    }
    if (maxSalary !== null) {
      return `Upto ₹${formatSalary(maxSalary)}`
    }
    return "Not specified"
  }

  const loadPrivacySettings = async () => {
    const result = await getCandidatePrivacySettings(candidateId)
    if (result.success && result.data) {
      setPrivacySettings(result.data.settings)
      setBlockedCompanies(result.data.blockedCompanies)
    }
  }

  const handleVisibilityChange = async (visibility: "public" | "hidden" | "private") => {
    setIsSavingPrivacy(true)
    const result = await updateProfileVisibility(candidateId, visibility)
    if (result.success) {
      setPrivacySettings((prev: any) => (prev ? { ...prev, profile_visibility: visibility } : null))
      toast({
        title: "Success",
        description: "Profile visibility updated successfully",
      })
    }
    setIsSavingPrivacy(false)
  }

  useEffect(() => {
    if (companySearchQuery.trim()) {
      const timeoutId = setTimeout(async () => {
        const result = await searchCompanies(companySearchQuery)
        if (result.success && result.companies) {
          setSearchResults(result.companies)
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [companySearchQuery])

  const handleSelectCompanyToBlock = (company: any) => {
    setSelectedCompanyToBlock(company)
    setBlockReason("")
    setCustomBlockReason("")
  }

  const handleConfirmBlock = async () => {
    if (!selectedCompanyToBlock || !blockReason) return
    const finalReason = blockReason === "Other" ? customBlockReason : blockReason
    if (!finalReason.trim()) return

    if (!selectedCompanyToBlock.employer_id) {
      toast({
        title: "Error",
        description: "Cannot block company: missing employer information",
        variant: "destructive",
      })
      return
    }

    setIsSavingPrivacy(true)
    const result = await blockCompany(
      candidateId,
      selectedCompanyToBlock.company_name,
      selectedCompanyToBlock.employer_id,
      blockReason,
      customBlockReason,
    )
    if (result.success) {
      await loadPrivacySettings()
      const jobResult = await getRecommendedJobs(candidateId)
      if (jobResult.success) {
        const appliedIds = new Set(Array.from(appliedJobIds))
        const jobsWithStatus = jobResult.jobs.map((job: Job) => ({
          ...job,
          status: appliedIds.has(job.id) ? "applied" : undefined,
        }))
        setJobs(jobsWithStatus)
        if (activeTab === "recommended") {
          setFilteredJobs(jobsWithStatus)
        }
      }
      setCompanySearchQuery("")
      setSearchResults([])
      setSelectedCompanyToBlock(null)
      setBlockReason("")
      setCustomBlockReason("")
      toast({
        title: "Success",
        description: "Company blocked successfully",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to block company",
        variant: "destructive",
      })
    }
    setIsSavingPrivacy(false)
  }

  const handleUnblockCompany = async (employerId: string) => {
    setIsSavingPrivacy(true)
    const result = await unblockCompany(candidateId, employerId)
    if (result.success) {
      await loadPrivacySettings()
      const jobResult = await getRecommendedJobs(candidateId)
      if (jobResult.success) {
        const appliedIds = new Set(Array.from(appliedJobIds))
        const jobsWithStatus = jobResult.jobs.map((job: Job) => ({
          ...job,
          status: appliedIds.has(job.id) ? "applied" : undefined,
        }))
        setJobs(jobsWithStatus)
        if (activeTab === "recommended") {
          setFilteredJobs(jobsWithStatus)
        }
      }
      toast({
        title: "Success",
        description: "Company unblocked successfully",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to unblock company",
        variant: "destructive",
      })
    }
    setIsSavingPrivacy(false)
  }

  const handleDeactivateProfile = async () => {
    setIsSavingPrivacy(true)
    const result = await deactivateProfile(candidateId, deactivationReason)
    if (result.success) {
      router.push("/candidate/login")
    }
    setIsSavingPrivacy(false)
  }

  const handleReactivateProfile = async () => {
    setIsSavingPrivacy(true)
    const result = await reactivateProfile(candidateId)
    if (result.success) {
      await loadPrivacySettings()
      toast({
        title: "Success",
        description: "Profile reactivated successfully",
      })
    }
    setIsSavingPrivacy(false)
  }

  const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement
    if (showProfileMenu && !target.closest(".profile-menu-container")) {
      setShowProfileMenu(false)
    }
    if (showSettingsMenu && !target.closest(".settings-menu-container")) {
      setShowSettingsMenu(false)
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showProfileMenu, showSettingsMenu])

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE
  const endIndex = startIndex + JOBS_PER_PAGE
  const currentJobs = filteredJobs.slice(startIndex, endIndex)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleViewProfile = async () => {
    console.log("[v0] Loading profile view")
    const result = await getCandidateProfile(candidateId)

    if (result.success && result.candidate) {
      setProfileData(result.candidate)
      setShowProfileView(true) // Use the correct state name
      setShowProfileMenu(false)
      setIsEditMode(false)
      setEditFormData(null)
      setUploadError(null)
    } else {
      console.error("[v0] Failed to load profile:", result.error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB")
      return
    }

    setIsPictureUploading(true) // Use the specific uploading state for the picture
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("candidateId", candidateId)

      const response = await fetch("/api/upload-profile-picture", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      setEditFormData((prev: any) => ({
        ...prev,
        profile_picture_url: result.url,
      }))

      // Update profileData immediately for UI feedback
      setProfileData((prev: any) => ({
        ...prev,
        profile_picture_url: result.url,
        updated_at: new Date().toISOString(),
      }))

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      })

      console.log("[v0] Profile picture uploaded:", result.url)
    } catch (error) {
      console.error("[v0] Error uploading profile picture:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setIsPictureUploading(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a PDF, DOC, or DOCX file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadResume(file, candidateId) // Pass candidateId for server-side action

      if (!result.success || !result.url) {
        throw new Error(result.error || "Upload failed")
      }

      setEditFormData((prev: any) => ({
        ...prev,
        resume_url: result.url,
      }))

      setProfileData((prev: any) => ({
        // Update profileData immediately for UI feedback
        ...prev,
        resume_url: result.url,
        updated_at: new Date().toISOString(),
      }))

      toast({
        title: "Success",
        description: "Resume uploaded successfully",
      })

      console.log("[v0] Resume uploaded:", result.url)
    } catch (error) {
      console.error("[v0] Error uploading resume:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload resume",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleResumeDownload = async () => {
    if (!profileData?.resume_url) return

    try {
      // Assuming handleResumeDownload is an action that takes the URL and initiates download
      // and returns { success: boolean, error?: string }
      const result = await handleResumeDownload(profileData.resume_url)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to download resume",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error downloading resume:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during download.",
        variant: "destructive",
      })
    }
  }

  const handleEmploymentSave = async (newHistory: any[]) => {
    setIsSaving(true)
    try {
      const result = await updateEmploymentHistory(candidateId, newHistory)
      if (result.success) {
        setProfileData((prev: any) => ({ ...prev, employment_history: result.data }))
        setEditingSection(null)
        toast({
          title: "Success",
          description: "Employment history updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update employment history",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving employment history:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditProfile = () => {
    setIsEditMode(true)
    setEditFormData({
      ...profileData,
      languages_known: profileData.languages_known || [],
      certifications: profileData.certifications || [],
      projects: profileData.projects || [],
      skills_you_know: profileData.skills_you_know || [],
      skills_for_role: profileData.skills_for_role || [],
    })
    if (profileData?.languages_known && Array.isArray(profileData.languages_known)) {
      setLanguages(
        profileData.languages_known.map((lang: any) =>
          typeof lang === "string" ? { language: lang, read: false, write: false, speak: false } : lang,
        ),
      )
    }
    if (profileData?.certifications && Array.isArray(profileData.certifications)) {
      setCertifications(
        profileData.certifications.map((cert: any) =>
          typeof cert === "string" ? { name: cert, topic: "", from_date: "", to_date: "", url: "", issuer: "" } : cert,
        ),
      )
    }
    if (profileData?.projects && Array.isArray(profileData.projects)) {
      setProjects(
        profileData.projects.map((proj: any) =>
          typeof proj === "string" ? { name: proj, description: "", url: "", technologies: "" } : proj,
        ),
      )
    }
  }

  const reloadJobsAfterProfileUpdate = async () => {
    console.log("[v0] Reloading job recommendations after profile update...")
    setIsLoading(true)

    const result = await getRecommendedJobs(candidateId)
    if (result.success) {
      const jobsWithStatus = result.jobs.map((job: Job) => ({
        ...job,
        status: appliedJobIds.has(job.id) ? "applied" : undefined,
      }))
      setJobs(jobsWithStatus)
      if (activeTab === "recommended") {
        setFilteredJobs(jobsWithStatus)
      }
      console.log("[v0] Job recommendations refreshed successfully")
    }

    setIsLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!editFormData) return

    setIsSaving(true)
    setUploadError(null)

    try {
      console.log("[v0] Saving profile with resume_url:", editFormData.resume_url)
      console.log("[v0] Saving profile with skills:", editFormData.skills_for_role)

      const result = await updateCandidateProfile(candidateId, {
        full_name: editFormData.full_name,
        mobile_number: editFormData.mobile_number,
        email: editFormData.email,
        resume_headline: editFormData.resume_headline,
        gender: editFormData.gender,
        current_city: editFormData.current_city,
        current_state: editFormData.current_state,
        work_status: editFormData.work_status,
        current_job_title: editFormData.current_job_title,
        company_name: editFormData.company_name,
        industry: editFormData.industry,
        department: editFormData.department,
        role_category: editFormData.role_category,
        job_role: editFormData.job_role,
        total_experience_years: editFormData.total_experience_years,
        total_experience_months: editFormData.total_experience_months,
        annual_salary: editFormData.annual_salary,
        notice_period: editFormData.notice_period,
        currently_employed: editFormData.currently_employed,
        skills_for_role: editFormData.skills_for_role, // Updated to skills_for_role
        skills_you_know: editFormData.skills_you_know, // Added for general skills
        preferred_salary: editFormData.preferred_salary,
        preferred_locations: editFormData.preferred_locations,
        highest_qualification: editFormData.highest_qualification,
        course: editFormData.course,
        specialization: editFormData.specialization,
        course_type: editFormData.course_type,
        university: editFormData.university,
        passing_year: editFormData.passing_year,
        starting_year: editFormData.starting_year,
        resume_url: editFormData.resume_url,
        profile_picture_url: editFormData.profile_picture_url,
        date_of_birth: editFormData.date_of_birth,
        marital_status: editFormData.marital_status,
        languages_known: languages,
        certifications: certifications,
        projects: projects,
        employment_history: profileData.employment_history,
      })

      if (result.success) {
        setProfileData(result.data)
        setIsEditMode(false)
        setEditFormData(null)
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        // </CHANGE> Reload jobs after profile update
        await reloadJobsAfterProfileUpdate()
      } else {
        setUploadError(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      setUploadError("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditFormData(null)
    setUploadError(null)
    if (profileData?.languages_known && Array.isArray(profileData.languages_known)) {
      setLanguages(
        profileData.languages_known.map((lang: any) =>
          typeof lang === "string" ? { language: lang, read: false, write: false, speak: false } : lang,
        ),
      )
    } else {
      setLanguages([])
    }
    if (profileData?.certifications && Array.isArray(profileData.certifications)) {
      setCertifications(
        profileData.certifications.map((cert: any) =>
          typeof cert === "string" ? { name: cert, topic: "", from_date: "", to_date: "", url: "", issuer: "" } : cert,
        ),
      )
    } else {
      setCertifications([])
    }
    if (profileData?.projects && Array.isArray(profileData.projects)) {
      setProjects(
        profileData.projects.map((proj: any) =>
          typeof proj === "string" ? { name: proj, description: "", url: "", technologies: "" } : proj,
        ),
      )
    } else {
      setProjects([])
    }
    setEditingSection(null) // Reset editing section
  }

  const profileCompletion = profileData ? calculateProfileCompletion(profileData) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-6">
              <Link href="/candidate/dashboard" className="flex items-center gap-1.5 md:gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs md:text-sm">JK</span>
                </div>
                <span className="text-lg md:text-2xl font-semibold text-blue-600">JobKarle</span>
              </Link>
              <Link
                href="/candidate/search"
                className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
              >
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Search Jobs</span>
              </Link>
            </div>

            <Link
              href="/candidate/search"
              className="sm:hidden flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 rounded-md"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Jobs</span>
            </Link>

            <div className="flex items-center gap-1 md:gap-2">
              <div className="relative settings-menu-container">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSettingsMenu(!showSettingsMenu)
                    if (!showSettingsMenu) {
                      loadPrivacySettings()
                    }
                  }}
                  className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 p-0"
                >
                  <Settings className="w-4 h-4 md:w-4.5 md:h-4.5 text-gray-600" />
                </Button>

                {showSettingsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => {
                        setActivePrivacyDialog("visibility")
                        setShowSettingsMenu(false)
                      }}
                      className="w-full px-4 py-3 sm:py-2 text-left text-sm sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2"
                    >
                      <Eye className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span>Profile Visibility</span>
                    </button>
                    <button
                      onClick={() => {
                        setActivePrivacyDialog("blocked")
                        setShowSettingsMenu(false)
                      }}
                      className="w-full px-4 py-3 sm:py-2 text-left text-sm sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2"
                    >
                      <Ban className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span>Blocked Companies</span>
                    </button>
                    <button
                      onClick={() => {
                        setActivePrivacyDialog("deactivate")
                        setShowSettingsMenu(false)
                      }}
                      className="w-full px-4 py-3 sm:py-2 text-left text-sm sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2"
                    >
                      <EyeOff className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span>Deactivate Profile</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative profile-menu-container">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1 md:gap-2 h-8 md:h-9 px-1 md:px-2"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {profileData?.profile_picture_url ? (
                      <img
                        src={profileData.profile_picture_url || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                    )}
                  </div>
                </Button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="text-sm md:text-base font-semibold text-gray-900 truncate">{candidateName}</div>
                    </div>
                    <button
                      onClick={handleViewProfile}
                      className="w-full px-4 py-3 sm:py-2 text-left text-sm sm:text-base text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2"
                    >
                      <User className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span>View/Update Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 sm:py-2 text-left text-sm sm:text-base text-gray-700 hover:bg-gray-50 flex items-center gap-3 sm:gap-2"
                    >
                      <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <Dialog
        open={activePrivacyDialog === "visibility"}
        onOpenChange={(open) => !open && setActivePrivacyDialog(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Profile Visibility
            </DialogTitle>
            <DialogDescription>Control who can see your profile in search results</DialogDescription>
          </DialogHeader>

          {privacySettings && !privacySettings.is_profile_active && privacySettings.deactivated_at && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Profile Deactivated</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Your profile was deactivated on {new Date(privacySettings.deactivated_at).toLocaleDateString()}
                  </p>
                  <Button
                    onClick={handleReactivateProfile}
                    disabled={isSavingPrivacy}
                    size="sm"
                    className="mt-3 bg-orange-600 hover:bg-orange-700 rounded-full"
                  >
                    {isSavingPrivacy ? "Reactivating..." : "Reactivate Profile"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <RadioGroup
            value={privacySettings?.profile_visibility}
            onValueChange={handleVisibilityChange}
            disabled={isSavingPrivacy || !privacySettings?.is_profile_active}
          >
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="public" id="dialog-public" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dialog-public" className="text-sm font-medium cursor-pointer">
                    Public
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Your profile is visible to all employers in search results and job recommendations
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="hidden" id="dialog-hidden" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dialog-hidden" className="text-sm font-medium cursor-pointer">
                    Hidden
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Your profile won't appear in search results, but you can still apply to jobs
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="private" id="dialog-private" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dialog-private" className="text-sm font-medium cursor-pointer">
                    Private
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Only employers you've applied to can view your profile details
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </DialogContent>
      </Dialog>
      <Dialog open={activePrivacyDialog === "blocked"} onOpenChange={(open) => !open && setActivePrivacyDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              Blocked Companies
            </DialogTitle>
            <DialogDescription>
              Prevent specific companies from viewing your profile or contacting you
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-company-search" className="text-sm font-medium">
                Search Company to Block
              </Label>
              <Input
                id="dialog-company-search"
                placeholder="Enter company name..."
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
                disabled={!privacySettings?.is_profile_active}
                className="text-sm rounded-full"
              />
              {companySearchQuery.trim() && searchResults.length === 0 && (
                <p className="text-xs text-gray-500">Searching...</p>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Search Results</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((company, index) => (
                    <div
                      key={`${company.company_name}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium">{company.company_name}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleSelectCompanyToBlock(company)}
                        disabled={isSavingPrivacy}
                        className="rounded-full"
                      >
                        Block
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blockedCompanies.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blocked Companies ({blockedCompanies.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {blockedCompanies.map((company, index) => (
                    <div
                      key={`${company.employer_id}-${index}`}
                      className="flex flex-col gap-2 p-3 border rounded-lg bg-red-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Ban className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{company.company_name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">Reason: {company.reason}</p>
                            <p className="text-xs text-gray-500">
                              Blocked on {new Date(company.blocked_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblockCompany(company.employer_id)}
                          disabled={isSavingPrivacy || !privacySettings?.is_profile_active}
                          className="ml-2 flex-shrink-0 rounded-full"
                        >
                          Unblock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blockedCompanies.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">No companies blocked yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={activePrivacyDialog === "deactivate"}
        onOpenChange={(open) => !open && setActivePrivacyDialog(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <EyeOff className="w-5 h-5" />
              Deactivate Profile
            </DialogTitle>
            <DialogDescription>
              Temporarily deactivate your profile. You can reactivate it anytime by logging back in.
            </DialogDescription>
          </DialogHeader>

          {privacySettings?.is_profile_active ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-deactivation-reason" className="text-sm font-medium">
                  Reason for deactivation (optional)
                </Label>
                <Textarea
                  id="dialog-deactivation-reason"
                  placeholder="Let us know why you're deactivating your profile..."
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  rows={3}
                  className="text-sm rounded-lg"
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSavingPrivacy} className="w-full rounded-full">
                    <EyeOff className="w-4 h-4 mr-2" />
                    Deactivate Profile
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to deactivate your profile?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>When you deactivate your profile:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Your profile will be hidden from all employers</li>
                        <li>You won't receive job recommendations</li>
                        <li>Employers won't be able to contact you</li>
                        <li>You can reactivate anytime by logging back in</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivateProfile} className="bg-red-600 hover:bg-red-700">
                      {isSavingPrivacy ? "Deactivating..." : "Yes, Deactivate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Profile Already Deactivated</p>
                  {privacySettings?.deactivated_at && (
                    <p className="text-xs text-orange-700 mt-1">
                      Your profile was deactivated on {new Date(privacySettings.deactivated_at).toLocaleDateString()}
                    </p>
                  )}
                  {privacySettings?.deactivation_reason && (
                    <p className="text-xs text-orange-700 mt-1">Reason: {privacySettings.deactivation_reason}</p>
                  )}
                  <Button
                    onClick={handleReactivateProfile}
                    disabled={isSavingPrivacy}
                    size="sm"
                    className="mt-3 bg-orange-600 hover:bg-orange-700 rounded-full"
                  >
                    {isSavingPrivacy ? "Reactivating..." : "Reactivate Profile"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!selectedCompanyToBlock} onOpenChange={(open) => !open && setSelectedCompanyToBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {selectedCompanyToBlock?.company_name}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Please select a reason for blocking this company:</p>

              <div className="space-y-3">
                <Label htmlFor="block-reason-select" className="text-sm font-medium text-gray-900">
                  Reason for blocking
                </Label>
                <Select value={blockReason} onValueChange={setBlockReason}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Poor work environment">Poor work environment</SelectItem>
                    <SelectItem value="Unprofessional behavior">Unprofessional behavior</SelectItem>
                    <SelectItem value="Salary/payment issues">Salary/payment issues</SelectItem>
                    <SelectItem value="Misleading job description">Misleading job description</SelectItem>
                    <SelectItem value="Harassment or discrimination">Harassment or discrimination</SelectItem>
                    <SelectItem value="Not interested in this company">Not interested in this company</SelectItem>
                    <SelectItem value="Previous bad experience">Previous bad experience</SelectItem>
                    <SelectItem value="Other">Other (specify below)</SelectItem>
                  </SelectContent>
                </Select>

                {blockReason === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-block-reason" className="text-sm font-medium text-gray-900">
                      Please specify your reason
                    </Label>
                    <Textarea
                      id="custom-block-reason"
                      placeholder="Enter your reason for blocking this company..."
                      value={customBlockReason}
                      onChange={(e) => setCustomBlockReason(e.target.value)}
                      rows={3}
                      className="text-sm rounded-lg"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              disabled={!blockReason || (blockReason === "Other" && !customBlockReason.trim()) || isSavingPrivacy}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSavingPrivacy ? "Blocking..." : "Block Company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Jobs for you</h1>
          <p className="text-sm md:text-lg text-gray-600">Based on your skills and profile</p>
        </div>

        <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("recommended")}
            className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all ${
              activeTab === "recommended"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Recommended ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all ${
              activeTab === "saved" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Saved ({savedJobsList.length})
          </button>
        </div>

        <div className="mb-3 md:mb-4 text-xs md:text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} jobs
        </div>

        <div className="space-y-3 md:space-y-6">
          {isLoading ? (
            <div className="text-center py-12 md:py-16 bg-white rounded-lg border border-gray-200">
              <p className="text-base md:text-lg text-gray-500">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white rounded-lg border border-gray-200">
              <Briefcase className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-base md:text-xl font-medium text-gray-700 mb-1 md:mb-2">No jobs found</p>
              <p className="text-sm md:text-base text-gray-500 px-4">
                {activeTab === "recommended" ? "Try adjusting your search terms" : "You haven't saved any jobs yet"}
              </p>
            </div>
          ) : (
            currentJobs.map((job) => (
              <Card
                key={job.id}
                className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 group rounded-lg relative"
              >
                {/* Premium indicator badge */}
                {job.category === "premium" && (
                  <div className="absolute -top-px -left-px z-20">
                    <div className="relative">
                      {/* Corner triangle background */}
                      <svg width="24" height="24" viewBox="0 0 48 48" className="drop-shadow-lg sm:w-12 sm:h-12">
                        <path d="M 0 0 L 48 0 L 0 48 Z" fill="url(#cornerGradientCandidate)" />
                        <defs>
                          <linearGradient id="cornerGradientCandidate" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#93C5FD" />
                            <stop offset="100%" stopColor="#60A5FA" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute left-0.5 top-0.5 sm:left-1 sm:top-1">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="sm:w-[25px] sm:h-[25px]">
                          <path d="M10 1L5 6L10 19L15 6L10 1Z" fill="url(#goldDiamondGradientCandidate)" />
                          <path d="M10 1L7 6H13L10 1Z" fill="#FEF3C7" opacity="0.9" />
                          <ellipse cx="9" cy="4" rx="2" ry="1.2" fill="white" opacity="0.95" />
                          <defs>
                            <linearGradient
                              id="goldDiamondGradientCandidate"
                              x1="10"
                              y1="1"
                              x2="10"
                              y2="19"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop offset="0%" stopColor="#FEF3C7" />
                              <stop offset="30%" stopColor="#FCD34D" />
                              <stop offset="70%" stopColor="#F59E0B" />
                              <stop offset="100%" stopColor="#D97706" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                {job.urgent_hiring && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg z-10">
                    URGENT HIRING
                  </div>
                )}

                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start">
                    <div className="flex-1 space-y-2 md:space-y-3 w-full">
                      <div className="space-y-1 md:space-y-1.5">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <h3
                            className="text-lg md:text-2xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors group-hover:text-blue-600 break-words"
                            onClick={() => handleViewJob(job.id)}
                          >
                            {job.job_title}
                          </h3>
                          {job.openings && job.openings > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5 md:px-2 py-0.5 font-medium rounded-full"
                            >
                              {job.openings} {job.openings === 1 ? "Opening" : "Openings"}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-gray-200 flex-shrink-0">
                            <AvatarImage 
                              src={job.company_logo_url || job.employers?.logo_url || "/jobkarle-logo.png"} 
                              alt={job.company_name} 
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                              {job.company_name.charAt(0).toUpperCase()}
                              {job.company_name.split(" ")[1]?.charAt(0).toUpperCase() || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-base md:text-lg font-semibold text-gray-800 break-words">
                              {job.company_name}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500">
                              <Clock className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{getTimeAgo(job.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {job.status === "applied" && (
                          <Badge
                            variant="secondary"
                            className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-1 rounded-full"
                          >
                            ✓ Applied
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 py-2 border-y border-gray-100">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xs md:text-sm text-gray-500 mb-0.5">Experience</div>
                            <div className="text-sm md:text-base font-semibold text-gray-900">
                              {job.min_experience || 0}-{job.max_experience || 0} Years
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs md:text-sm text-gray-500 mb-0.5">Salary (Annual)</div>
                            <div className="text-sm md:text-base font-semibold text-gray-900 break-words">
                              {getSalaryString(job.min_salary, job.max_salary)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs md:text-sm text-gray-500 mb-0.5">Location</div>
                            <div className="text-sm md:text-base font-semibold text-gray-900 break-words">
                              {getLocationString(job.job_locations)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                        {job.employment_type && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-xs md:text-sm px-2 md:px-4 py-1 md:py-1.5 rounded-full"
                          >
                            {job.employment_type}
                          </Badge>
                        )}
                        {job.work_mode && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-50 text-purple-700 border-purple-200 text-xs md:text-sm px-2 md:px-4 py-1 md:py-1.5 rounded-full"
                          >
                            {job.work_mode}
                          </Badge>
                        )}
                      </div>

                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="text-xs md:text-sm font-medium text-gray-700 pt-1.5 md:pt-2 whitespace-nowrap">
                            Skills:
                          </div>
                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {job.required_skills.slice(0, 8).map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 font-normal border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors rounded-full"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {job.required_skills.length > 8 && (
                              <Badge
                                variant="outline"
                                className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 font-medium border-gray-300 rounded-full"
                              >
                                +{job.required_skills.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 md:gap-3 w-full md:w-auto md:min-w-[120px]">
                      <Button
                        size="sm"
                        onClick={() => handleViewJob(job.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 h-9 md:h-11 text-sm md:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 shadow-sm hover:shadow-md transition-all"
                      >
                        <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        <span>View</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={savedJobs.has(job.id) ? "default" : "outline"}
                        onClick={() => handleSaveJob(job.id)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 h-9 md:h-11 text-sm md:text-base font-medium transition-all ${
                          savedJobs.has(job.id)
                            ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                            : "hover:bg-gray-50 hover:border-gray-400"
                        } rounded-full`}
                      >
                        {savedJobs.has(job.id) ? (
                          <>
                            <Bookmark className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4 md:w-5 md:h-5" />
                            <span>Save</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!isLoading && filteredJobs.length > 0 && totalPages > 1 && (
          <div className="mt-6 md:mt-8 flex items-center justify-center gap-1 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm bg-transparent rounded-full"
            >
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>

            <div className="flex items-center gap-1">
              {currentPage > 3 && (
                <>
                  <Button
                    variant={currentPage === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(1)}
                    className="h-8 md:h-10 w-8 md:w-10 text-xs md:text-sm rounded-full"
                  >
                    1
                  </Button>
                  {currentPage > 4 && <span className="px-1 md:px-2 text-gray-500 text-xs md:text-sm">...</span>}
                </>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true
                  if (page === 1 || page === totalPages) return false
                  return Math.abs(currentPage - page) <= 1
                })
                .map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className={`h-8 md:h-10 w-8 md:w-10 text-xs md:text-sm rounded-full ${
                      currentPage === page
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        : ""
                    }`}
                  >
                    {page}
                  </Button>
                ))}

              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-1 md:px-2 text-gray-500 text-xs md:text-sm">...</span>
                  )}
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    className="h-8 md:h-10 w-8 md:w-10 text-xs md:text-sm rounded-full"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm bg-transparent rounded-full"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-0.5 md:ml-1" />
            </Button>
          </div>
        )}
      </div>
      {showProfileView && profileData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
              <button
                onClick={() => {
                  setShowProfileView(false)
                  setIsEditMode(false)
                  setEditFormData(null)
                  setUploadError(null)
                  setEditingSection(null)
                }}
                className="absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>

              <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-8 pt-8 pb-20">
                <div className="absolute top-6 right-6 flex items-center gap-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-600">Profile</span>
                    <div className="relative w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                          calculateProfileCompletion(profileData) === 100
                            ? "bg-green-500"
                            : calculateProfileCompletion(profileData) >= 75
                              ? "bg-blue-500"
                              : calculateProfileCompletion(profileData) >= 50
                                ? "bg-yellow-500"
                                : "bg-orange-500"
                        }`}
                        style={{ width: `${calculateProfileCompletion(profileData)}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        calculateProfileCompletion(profileData) === 100
                          ? "text-green-600"
                          : calculateProfileCompletion(profileData) >= 75
                            ? "text-blue-600"
                            : calculateProfileCompletion(profileData) >= 50
                              ? "text-yellow-600"
                              : "text-orange-600"
                      }`}
                    >
                      {calculateProfileCompletion(profileData)}%
                    </span>
                  </div>

                  {!isEditMode && (
                    <Button
                      onClick={handleEditProfile}
                      className="bg-white hover:bg-gray-50 text-blue-700 font-semibold shadow-lg rounded-full px-6"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-6 mt-12">
                  <div
                    className={`flex-shrink-0 ${
                      isEditMode ? "cursor-pointer hover:opacity-80 transition-opacity relative group" : ""
                    }`}
                    onClick={() => isEditMode && profilePictureInputRef.current?.click()}
                  >
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl">
                      {profileData.profile_picture_url ? (
                        <img
                          src={profileData.profile_picture_url || "/placeholder.svg"}
                          alt={profileData.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                          <User className="w-14 h-14 text-white" />
                        </div>
                      )}
                    </div>
                    {isEditMode && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-white mx-auto mb-1" />
                          <span className="text-white text-xs font-medium">Change Photo</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={profilePictureInputRef}
                    onChange={handleProfilePictureUpload}
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                  />
                  {isEditMode && isPictureUploading && (
                    <div className="mt-2 text-xs text-white flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {isEditMode && uploadError && (
                    <div className="mt-2 text-xs text-red-300 max-w-[112px]">{uploadError}</div>
                  )}

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-3">{profileData.full_name}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-blue-50 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{profileData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{profileData.mobile_number}</span>
                      </div>
                      {profileData.date_of_birth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Born:{" "}
                            {new Date(profileData.date_of_birth).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    {profileData.resume_headline && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                        <p className="text-blue-50 text-sm leading-relaxed">{profileData.resume_headline}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{uploadError}</div>
                )}

                {isEditMode && (
                  <div className="flex justify-end gap-3 pb-4 border-b">
                    <Button variant="outline" onClick={handleCancelEdit} className="rounded-full bg-transparent">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}

                {/* Resume Section */}
                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Resume
                      </h3>
                      <div className="flex items-center gap-2">
                        {profileData.resume_url && (
                          <>
                            <Button
                              onClick={() => window.open(profileData.resume_url!, "_blank")}
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              onClick={handleResumeDownload}
                              size="sm"
                              variant="outline"
                              className="rounded-full bg-transparent"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </>
                        )}
                        <Button
                          onClick={() => resumeInputRef.current?.click()}
                          size="sm"
                          variant="default"
                          disabled={isUploading}
                          className="rounded-full"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {profileData.resume_url ? "Replace" : "Upload"}
                        </Button>
                        <input
                          type="file"
                          ref={resumeInputRef}
                          onChange={handleResumeUpload}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                        />
                      </div>
                    </div>

                    {profileData.resume_url ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Resume uploaded</p>
                            <p className="text-sm text-gray-600">
                              Last updated: {new Date(profileData.updated_at || "").toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-2">No resume uploaded</p>
                        <p className="text-sm text-gray-400">Upload your resume (PDF, DOC, DOCX - Max 5MB)</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* The profile picture upload is now handled by clicking the avatar in the header */}

                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {isEditMode ? (
                        <>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Gender</Label>
                            <Select
                              value={editFormData?.gender || ""}
                              onValueChange={(val) => setEditFormData({ ...editFormData, gender: val })}
                            >
                              <SelectTrigger className="rounded-full">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Date of Birth</Label>
                            <Input
                              type="date"
                              value={editFormData?.date_of_birth?.split("T")[0] || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                              className="rounded-full"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Marital Status</Label>
                            <Select
                              value={editFormData?.marital_status || ""}
                              onValueChange={(val) => setEditFormData({ ...editFormData, marital_status: val })}
                            >
                              <SelectTrigger className="rounded-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">Divorced</SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Current City</Label>
                            <Input
                              value={editFormData?.current_city || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, current_city: e.target.value })}
                              placeholder="Enter city"
                              className="rounded-full"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Current State</Label>
                            <Input
                              value={editFormData?.current_state || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, current_state: e.target.value })}
                              placeholder="Enter state"
                              className="rounded-full"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Work Status</Label>
                            <Select
                              value={editFormData?.work_status || ""}
                              onValueChange={(val) => setEditFormData({ ...editFormData, work_status: val })}
                            >
                              <SelectTrigger className="rounded-full">
                                <SelectValue placeholder="Select work status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fresher">Fresher</SelectItem>
                                <SelectItem value="experienced">Experienced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <>
                          <InfoField label="Gender" value={profileData.gender} />
                          <InfoField
                            label="Date of Birth"
                            value={
                              profileData.date_of_birth
                                ? new Date(profileData.date_of_birth).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : undefined
                            }
                          />
                          <InfoField label="Marital Status" value={profileData.marital_status} capitalize />
                          <InfoField label="Current City" value={profileData.current_city} />
                          <InfoField label="Current State" value={profileData.current_state} />
                          <InfoField label="Work Status" value={profileData.work_status} capitalize />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Languages className="w-5 h-5 text-blue-600" />
                      Languages Known
                    </h3>
                    {isEditMode && (
                      <Button onClick={addLanguage} size="sm" variant="outline" className="rounded-full bg-transparent">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Language
                      </Button>
                    )}
                    <div className="space-y-4">
                      {isEditMode ? (
                        languages.length > 0 ? (
                          languages.map((lang, index) => (
                            <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  placeholder="Language name"
                                  value={lang.language}
                                  onChange={(e) => updateLanguage(index, "language", e.target.value)}
                                  className="rounded-full"
                                />
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={lang.read}
                                      onChange={(e) => updateLanguage(index, "read", e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">Read</span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={lang.write}
                                      onChange={(e) => updateLanguage(index, "write", e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">Write</span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={lang.speak}
                                      onChange={(e) => updateLanguage(index, "speak", e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">Speak</span>
                                  </label>
                                </div>
                              </div>
                              <Button
                                onClick={() => removeLanguage(index)}
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No languages added yet. Click "Add Language" to start.
                          </p>
                        )
                      ) : profileData.languages_known && profileData.languages_known.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {profileData.languages_known.map((lang: any, index: number) => (
                            <div key={index} className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <p className="font-semibold text-gray-900 mb-2">{lang.language}</p>
                              <div className="flex gap-2 text-xs">
                                {lang.read && <Badge variant="secondary">Read</Badge>}
                                {lang.write && <Badge variant="secondary">Write</Badge>}
                                {lang.speak && <Badge variant="secondary">Speak</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No languages specified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      Certifications
                    </h3>
                    {isEditMode && (
                      <Button
                        onClick={addCertification}
                        size="sm"
                        variant="outline"
                        className="rounded-full bg-transparent"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Certification
                      </Button>
                    )}
                    <div className="space-y-4">
                      {isEditMode ? (
                        certifications.length > 0 ? (
                          certifications.map((cert, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input
                                    placeholder="Certification name"
                                    value={cert.name}
                                    onChange={(e) => updateCertification(index, "name", e.target.value)}
                                    className="rounded-full"
                                  />
                                  <Input
                                    placeholder="Topic/Subject"
                                    value={cert.topic}
                                    onChange={(e) => updateCertification(index, "topic", e.target.value)}
                                    className="rounded-full"
                                  />
                                  <Input
                                    type="date"
                                    placeholder="From date"
                                    value={cert.from_date}
                                    onChange={(e) => updateCertification(index, "from_date", e.target.value)}
                                    className="rounded-full"
                                  />
                                  <Input
                                    type="date"
                                    placeholder="To date (expiry)"
                                    value={cert.to_date}
                                    onChange={(e) => updateCertification(index, "to_date", e.target.value)}
                                    className="rounded-full"
                                  />
                                  <Input
                                    placeholder="Certificate URL"
                                    value={cert.url}
                                    onChange={(e) => updateCertification(index, "url", e.target.value)}
                                    className="md:col-span-2 rounded-full"
                                  />
                                  <Input
                                    placeholder="Certified From (Issuer)" // Added input for issuer
                                    value={cert.issuer || ""}
                                    onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                                    className="md:col-span-2 rounded-full"
                                  />
                                </div>
                                <Button
                                  onClick={() => removeCertification(index)}
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No certifications added yet. Click "Add Certification" to start.
                          </p>
                        )
                      ) : profileData.certifications && profileData.certifications.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profileData.certifications.map((cert: any, index: number) => (
                            <div key={index} className="p-4 bg-green-50 border border-green-100 rounded-lg">
                              <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                              {cert.issuer && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Certified from:</span> {cert.issuer}
                                </p>
                              )}
                              {cert.topic && <p className="text-sm text-gray-600 mt-1">{cert.topic}</p>}
                              {(cert.from_date || cert.issueDate || cert.from_date || cert.expiryDate) && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {(cert.from_date || cert.issueDate || cert.from_date || cert.expiryDate) &&
                                    new Date(
                                      cert.from_date || cert.issueDate || cert.from_date || cert.expiryDate,
                                    ).toLocaleDateString("en-IN", {
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                  {(cert.from_date || cert.issueDate || cert.from_date || cert.expiryDate) &&
                                    (cert.to_date || cert.expiryDate) &&
                                    "- "}
                                  {(cert.to_date || cert.expiryDate) &&
                                    new Date(cert.to_date || cert.expiryDate).toLocaleDateString("en-IN", {
                                      month: "short",
                                      year: "numeric",
                                    })}
                                </p>
                              )}
                              {cert.url && (
                                <a
                                  href={cert.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-2 block"
                                >
                                  View Certificate
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No certifications added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Added employment history edit functionality with add/edit/delete options */}
                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Employment History
                    </h3>
                    {editingSection !== "employment" && (
                      <Button
                        onClick={() => setEditingSection("employment")}
                        variant="outline"
                        size="sm"
                        className="rounded-full mb-4"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}

                    {editingSection === "employment" ? (
                      <EmploymentEditForm
                        employmentHistory={profileData.employment_history || []}
                        onSave={handleEmploymentSave}
                        onCancel={() => setEditingSection(null)}
                      />
                    ) : profileData.work_status !== "fresher" ? (
                      <div className="space-y-6">
                        {profileData.employment_history && profileData.employment_history.length > 0 ? (
                          <div className="space-y-4">
                            {profileData.employment_history.map((job: any, index: number) => (
                              <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-semibold text-gray-900">
                                      {job.job_title || job.jobTitle || job.currentJobTitle}
                                    </h5>
                                    <p className="text-sm text-gray-600">{job.company_name || job.companyName}</p>
                                  </div>
                                  {(job.is_current || job.currently_working || job.type === "current") && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {job.start_date || job.fromDate || job.durationFrom
                                    ? new Date(job.start_date || job.fromDate || job.durationFrom).toLocaleDateString(
                                        "en-IN",
                                        {
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )
                                    : "Start Date Not Specified"}
                                  {" - "}
                                  {job.end_date || job.toDate || job.durationTo
                                    ? job.toDate === "Present" || job.durationTo === "Present"
                                      ? "Present"
                                      : new Date(job.end_date || job.toDate || job.durationTo).toLocaleDateString(
                                          "en-IN",
                                          {
                                            month: "short",
                                            year: "numeric",
                                          },
                                        )
                                    : "Present"}
                                </p>
                                {job.employment_type && (
                                  <Badge variant="outline" className="mt-2">
                                    {job.employment_type}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">No employment history added</p>
                            <p className="text-sm text-gray-400">Click "Edit" to add your work experience</p>
                          </div>
                        )}

                        {/* Total Experience Display */}
                        {(profileData.total_experience_years || profileData.total_experience_months) && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">Total Experience</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {profileData.total_experience_years || 0} Years {profileData.total_experience_months || 0}{" "}
                              Months
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Fresher - No work experience yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Education
                    </h3>

                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Highest Qualification *
                          </Label>
                          <Input
                            value={editFormData?.highest_qualification || ""}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, highest_qualification: e.target.value })
                            }
                            placeholder="e.g., Bachelor's, Master's, PhD"
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Course *</Label>
                          <Input
                            value={editFormData?.course || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                            placeholder="e.g., B.Tech, MBA, BCA"
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Specialization</Label>
                          <Input
                            value={editFormData?.specialization || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                            placeholder="e.g., Computer Science, Finance"
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Course Type</Label>
                          <Select
                            value={editFormData?.course_type || ""}
                            onValueChange={(val) => setEditFormData({ ...editFormData, course_type: val })}
                          >
                            <SelectTrigger className="rounded-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Full Time">Full Time</SelectItem>
                              <SelectItem value="Part Time">Part Time</SelectItem>
                              <SelectItem value="Distance Learning">Distance Learning</SelectItem>
                              <SelectItem value="Correspondence">Correspondence</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">University/Institute</Label>
                          <Input
                            value={editFormData?.university || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, university: e.target.value })}
                            placeholder="Enter university name"
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Starting Year</Label>
                          <Input
                            type="number"
                            value={editFormData?.starting_year || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, starting_year: e.target.value })}
                            placeholder="e.g., 2018"
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Passing Year</Label>
                          <Input
                            type="number"
                            value={editFormData?.passing_year || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, passing_year: e.target.value })}
                            placeholder="e.g., 2022"
                            className="rounded-full"
                          />
                        </div>
                      </div>
                    ) : profileData.highest_qualification || profileData.course ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {profileData.highest_qualification && (
                            <InfoField label="Highest Qualification" value={profileData.highest_qualification} />
                          )}
                          {profileData.course && <InfoField label="Course" value={profileData.course} />}
                          {profileData.specialization && (
                            <InfoField label="Specialization" value={profileData.specialization} />
                          )}
                          {profileData.course_type && (
                            <InfoField label="Course Type" value={profileData.course_type} capitalize />
                          )}
                          {profileData.university && (
                            <InfoField label="University/Institute" value={profileData.university} />
                          )}
                          {(profileData.starting_year || profileData.passing_year) && (
                            <InfoField
                              label="Duration"
                              value={`${profileData.starting_year || "N/A"} - ${profileData.passing_year || "N/A"}`}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No education details provided</p>
                        {!isEditMode && (
                          <p className="text-xs text-gray-400 mt-2">Click "Edit Profile" to add education details</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Projects
                    </h3>
                    {isEditMode && (
                      <Button onClick={addProject} size="sm" variant="outline" className="rounded-full bg-transparent">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Project
                      </Button>
                    )}
                    <div className="space-y-4">
                      {isEditMode ? (
                        projects.length > 0 ? (
                          projects.map((proj, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-3">
                                  <Input
                                    placeholder="Project name"
                                    value={proj.name}
                                    onChange={(e) => updateProject(index, "name", e.target.value)}
                                    className="rounded-full"
                                  />
                                  <Textarea
                                    placeholder="Project description"
                                    value={proj.description}
                                    onChange={(e) => updateProject(index, "description", e.target.value)}
                                    rows={2}
                                    className="rounded-full"
                                  />
                                  <Input
                                    placeholder="Technologies used (comma-separated)"
                                    value={proj.technologies}
                                    onChange={(e) => updateProject(index, "technologies", e.target.value)}
                                    className="rounded-full"
                                  />
                                  <Input
                                    placeholder="Project URL"
                                    value={proj.url}
                                    onChange={(e) => updateProject(index, "url", e.target.value)}
                                    className="rounded-full"
                                  />
                                </div>
                                <Button
                                  onClick={() => removeProject(index)}
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No projects added yet. Click "Add Project" to start.</p>
                        )
                      ) : profileData.projects && profileData.projects.length > 0 ? (
                        <div className="space-y-4">
                          {profileData.projects.map((proj: any, index: number) => (
                            <div key={index} className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                              <h4 className="font-semibold text-gray-900">{proj.name}</h4>
                              {proj.description && <p className="text-sm text-gray-600 mt-2">{proj.description}</p>}
                              {proj.technologies && (
                                <p className="text-xs text-gray-500 mt-2">
                                  <span className="font-medium">Technologies:</span> {proj.technologies}
                                </p>
                              )}
                              {proj.url && (
                                <a
                                  href={proj.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-2 block"
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
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 rounded-lg shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Key Skills
                      </h3>
                      {isEditMode ? (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Add Skills (Press Enter or comma to add)
                          </Label>
                          <Input
                            placeholder="Type a skill and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault()
                                const input = e.currentTarget
                                const skill = input.value.trim().replace(/,$/g, "")
                                if (skill) {
                                  const currentSkills = editFormData?.skills_for_role || []
                                  if (currentSkills.includes(skill)) {
                                    setSkillDuplicateError("Skill already added")
                                    setTimeout(() => setSkillDuplicateError(""), 3000)
                                  } else {
                                    setEditFormData({
                                      ...editFormData,
                                      skills_for_role: [...currentSkills, skill],
                                    })
                                    setSkillDuplicateError("")
                                  }
                                  input.value = ""
                                }
                              }
                            }}
                            className="rounded-full"
                          />
                          {skillDuplicateError && (
                            <p className="text-red-600 text-sm mt-1 font-medium">{skillDuplicateError}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-4">
                            {(editFormData?.skills_for_role || []).map((skill: string, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                                onClick={() => {
                                  const newSkills = (editFormData?.skills_for_role || []).filter(
                                    (_: string, i: number) => i !== index,
                                  )
                                  setEditFormData({ ...editFormData, skills_for_role: newSkills })
                                }}
                              >
                                {skill} <X className="w-3 h-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                          {(!editFormData?.skills_for_role || editFormData.skills_for_role.length === 0) && (
                            <p className="text-gray-500 text-sm mt-2">
                              No skills added yet. Start typing to add skills.
                            </p>
                          )}
                        </div>
                      ) : profileData.skills_for_role &&
                        Array.isArray(profileData.skills_for_role) &&
                        profileData.skills_for_role.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills_for_role.map((skill: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No skills specified</p>
                          {!isEditMode && (
                            <p className="text-xs text-gray-400 mt-1">Click "Edit Profile" to add skills</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 rounded-lg shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        All Skills
                      </h3>
                      {isEditMode ? (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Add Additional Skills (Press Enter or comma to add)
                          </Label>
                          <Input
                            placeholder="Type a skill and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault()
                                const input = e.currentTarget
                                const skill = input.value.trim().replace(/,$/g, "")
                                if (skill) {
                                  const currentSkills = editFormData?.skills_you_know || []
                                  if (!currentSkills.includes(skill)) {
                                    setEditFormData({
                                      ...editFormData,
                                      skills_you_know: [...currentSkills, skill],
                                    })
                                  }
                                  input.value = ""
                                }
                              }
                            }}
                            className="rounded-full"
                          />
                          <div className="flex flex-wrap gap-2 mt-4">
                            {(editFormData?.skills_you_know || []).map((skill: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer"
                                onClick={() => {
                                  const newSkills = (editFormData?.skills_you_know || []).filter(
                                    (_: string, i: number) => i !== index,
                                  )
                                  setEditFormData({ ...editFormData, skills_you_know: newSkills })
                                }}
                              >
                                {skill} <X className="w-3 h-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                          {(!editFormData?.skills_you_know || editFormData.skills_you_know.length === 0) && (
                            <p className="text-gray-500 text-sm mt-2">No additional skills added yet.</p>
                          )}
                        </div>
                      ) : profileData.skills_you_know &&
                        Array.isArray(profileData.skills_you_know) &&
                        profileData.skills_you_know.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills_you_know.map((skill: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No additional skills specified</p>
                          {!isEditMode && (
                            <p className="text-xs text-gray-400 mt-1">Click "Edit Profile" to add more skills</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 rounded-lg shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Job Preferences
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Preferred Salary</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{formatSalary(profileData.preferred_salary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Preferred Locations</p>
                          {profileData.preferred_locations &&
                          Array.isArray(profileData.preferred_locations) &&
                          profileData.preferred_locations.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profileData.preferred_locations.map((location: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {location}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No locations specified</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { CandidateDashboard }
