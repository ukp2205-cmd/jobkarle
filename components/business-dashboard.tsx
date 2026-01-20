"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link" // Added import
import { createBrowserClient } from "@supabase/ssr"
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  UserCog,
  LogOut,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  AlertTriangle,
  ChevronRight,
  Search,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Pencil,
  Plus,
  CheckCircle2,
  Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  getDailyMetrics,
  getWeeklyMetrics,
  getAllEmployers,
  getAllCandidates,
  getAllJobs,
  getBusinessTeam,
  deleteEmployer,
  deleteCandidate,
  deleteJob,
  updateJobStatus,
  addBusinessTeamMember, // Renamed from addTeamMember
  updateEmployer,
  addEmployer,
  addCandidate,
  updateCandidate,
  getCandidateById,
  addJob,
  updateJob,
  getJobById,
  businessLogout, // Imported businessLogout
  deleteBusinessTeamMember, // Imported deleteBusinessTeamMember
  getPendingEmployers, // Imported for approvals
  approveEmployer, // Imported for approvals
  rejectEmployer, // Imported for approvals
  assignCreditsManually, // Imported for manual credit assignment
} from "@/app/actions/business-dashboard-actions"

interface BusinessSession {
  userId: string
  email: string
  fullName: string
  role: string
}

// Added "approvals" and "credits" to ActiveView
type ActiveView = "dashboard" | "employers" | "candidates" | "jobs" | "team" | "approvals" | "credits"

interface DailyMetrics {
  userActivity: {
    newCandidates: number
    newEmployers: number
    totalCandidates: number
    totalEmployers: number
    totalActiveUsers: number
  }
  jobActivity: {
    newJobsToday: number
    totalJobs: number
    jobsByStatus: Record<string, number>
  }
  applicationFlow: {
    applicationsToday: number
    totalApplications: number
    avgApplicationsPerJob: number
    jobsWithNoApplications: number
  }
}

interface WeeklyMetrics {
  growth: {
    weeklyNewCandidates: number
    weeklyNewEmployers: number
    candidateGrowthPercent: number
    employerGrowthPercent: number
  }
  marketplace: {
    activeJobs: number
    activeJobsThisWeek: number
    activeJobsGrowthPercent: number
    activeCandidates: number
    jobsToCandidatesRatio: number
  }
}

interface EmployerFormData {
  id?: string
  username: string
  company_name: string
  contact_person: string
  email: string
  password?: string
  mobile_number: string
  city: string
  industry_type: string
}

interface CandidateFormData {
  full_name: string
  email: string
  mobile_number: string
  password?: string // Password is only required for new candidates
  gender: string
  work_status: string
  current_job_title: string
  company_name: string
  total_experience_years: number
  total_experience_months: number
  annual_salary: string
  notice_period: string
  highest_qualification: string
  course: string
  specialization: string
  university: string
  passing_year: string
  current_city: string
  current_state: string
  skills_you_know: string[]
  preferred_locations: string[]
}

interface JobFormData {
  job_title: string
  company_name: string
  employer_id?: string // Employer ID is only required for new jobs
  job_description: string
  employment_type: string
  work_mode: string
  min_salary: number
  max_salary: number
  min_experience: number
  max_experience: number
  openings: number
  job_locations: string[]
  required_skills: string[]
  status: string
}

export function BusinessDashboard({ session }: { session: BusinessSession }) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<ActiveView>("dashboard")
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null)
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [employers, setEmployers] = useState<Record<string, unknown>[]>([])
  const [candidates, setCandidates] = useState<Record<string, unknown>[]>([])
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([])
  const [team, setTeam] = useState<Record<string, unknown>[]>([])

  // Pagination states
  const [employerPage, setEmployerPage] = useState(1)
  const [candidatePage, setCandidatePage] = useState(1)
  const [jobPage, setJobPage] = useState(1)
  const [teamPage, setTeamPage] = useState(1)

  // Search states
  const [employerSearch, setEmployerSearch] = useState("")
  const [candidateSearch, setCandidateSearch] = useState("")
  const [jobSearch, setJobSearch] = useState("")

  // Pagination info
  const [employerPagination, setEmployerPagination] = useState({ total: 0, totalPages: 0 })
  const [candidatePagination, setCandidatePagination] = useState({ total: 0, totalPages: 0 })
  const [jobPagination, setJobPagination] = useState({ total: 0, totalPages: 0 })
  const [teamPagination, setTeamPagination] = useState({ total: 0, totalPages: 0 })

  // Dialog states
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null)

  const [employerDialogOpen, setEmployerDialogOpen] = useState(false)
  const [employerFormMode, setEmployerFormMode] = useState<"add" | "edit">("add")
  const [employerFormData, setEmployerFormData] = useState<EmployerFormData>({
    username: "",
    company_name: "",
    contact_person: "",
    email: "",
    password: "",
    mobile_number: "",
    city: "",
    industry_type: "",
  })
  const [employerFormLoading, setEmployerFormLoading] = useState(false)

  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false)
  const [candidateFormStep, setCandidateFormStep] = useState(1)
  const [editingCandidate, setEditingCandidate] = useState<Record<string, unknown> | null>(null)
  const [candidateForm, setCandidateForm] = useState<CandidateFormData>({
    full_name: "",
    email: "",
    mobile_number: "",
    password: "",
    gender: "",
    work_status: "fresher",
    current_job_title: "",
    company_name: "",
    total_experience_years: 0,
    total_experience_months: 0,
    annual_salary: "",
    notice_period: "",
    highest_qualification: "",
    course: "",
    specialization: "",
    university: "",
    passing_year: "",
    current_city: "",
    current_state: "",
    skills_you_know: [],
    preferred_locations: [],
  })
  const [candidateSkillInput, setCandidateSkillInput] = useState("")
  const [candidateLocationInput, setCandidateLocationInput] = useState("")

  const [jobDialogOpen, setJobDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Record<string, unknown> | null>(null)
  const [jobForm, setJobForm] = useState<JobFormData>({
    job_title: "",
    company_name: "",
    employer_id: "",
    job_description: "",
    employment_type: "full-time",
    work_mode: "on-site",
    min_salary: 0,
    max_salary: 0,
    min_experience: 0,
    max_experience: 0,
    openings: 1,
    job_locations: [],
    required_skills: [],
    status: "draft",
  })
  const [jobSkillInput, setJobSkillInput] = useState("")
  const [jobLocationInput, setJobLocationInput] = useState("")

  // New team member form
  const [newTeamMember, setNewTeamMember] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "admin",
  })

  // Added job status filter state to filter draft and published jobs
  const [jobStatusFilter, setJobStatusFilter] = useState<string[]>(["draft", "published", "closed", "expired"]) // Changed default to include all statuses

  const [pendingEmployers, setPendingEmployers] = useState<Record<string, unknown>[]>([])
  const [pendingPage, setPendingPage] = useState(1)
  const [pendingPagination, setPendingPagination] = useState({ total: 0, totalPages: 0 })
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedEmployer, setSelectedEmployer] = useState<Record<string, unknown> | null>(null)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
  const [rejectionReason, setRejectionReason] = useState("")

  // Manual credit assignment states
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [creditFormLoading, setCreditFormLoading] = useState(false)
  const [creditForm, setCreditForm] = useState({
    employerId: "",
    employerEmail: "",
    credits: 1,
    reason: "",
  })
  const [employerSearchResults, setEmployerSearchResults] = useState<Record<string, unknown>[]>([])
  const [employerSearchLoading, setEmployerSearchLoading] = useState(false)
  const [manualAssignments, setManualAssignments] = useState<Record<string, unknown>[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [assignmentsSearch, setAssignmentsSearch] = useState("")

  // Fetch metrics on load
  useEffect(() => {
    fetchMetrics()
  }, [])

  // Fetch data when view changes
  useEffect(() => {
    if (activeView === "dashboard") fetchMetrics() // Also fetch metrics on dashboard view
    if (activeView === "employers") fetchEmployers()
    if (activeView === "candidates") fetchCandidates()
    if (activeView === "jobs") fetchJobs()
    if (activeView === "team") fetchTeam()
    // Fetch pending employers when approvals view is active
    if (activeView === "approvals") fetchPendingEmployers()
    // Fetch manual credit assignments when credits view is active
    if (activeView === "credits") fetchManualAssignments(assignmentsSearch)
  }, [activeView, employerPage, candidatePage, jobPage, teamPage, jobStatusFilter, pendingPage]) // Added pendingPage dependency

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const [dailyResult, weeklyResult] = await Promise.all([getDailyMetrics(), getWeeklyMetrics()])

      if (dailyResult.success && dailyResult.metrics) {
        setDailyMetrics(dailyResult.metrics)
      }
      if (weeklyResult.success && weeklyResult.metrics) {
        setWeeklyMetrics(weeklyResult.metrics)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmployers = async () => {
    const result = await getAllEmployers(employerPage, 10, employerSearch)
    if (result.success && result.employers) {
      setEmployers(result.employers)
      if (result.pagination) {
        setEmployerPagination(result.pagination)
      }
    }
  }

  const fetchCandidates = async () => {
    const result = await getAllCandidates(candidatePage, 10, candidateSearch)
    if (result.success && result.candidates) {
      setCandidates(result.candidates)
      if (result.pagination) {
        setCandidatePagination(result.pagination)
      }
    }
  }

  const fetchJobs = async () => {
    // Modified to support status filtering - fetch ALL jobs then filter in the UI
    const result = await getAllJobs(jobPage, 10, jobSearch)
    if (result.success && result.jobs) {
      setJobs(result.jobs)
      if (result.pagination) {
        setJobPagination(result.pagination)
      }
    }
  }

  const fetchTeam = async () => {
    const result = await getBusinessTeam(teamPage, 10)
    if (result.success && result.team) {
      setTeam(result.team)
      if (result.pagination) {
        setTeamPagination(result.pagination)
      }
    }
  }

  const fetchPendingEmployers = async () => {
    setIsLoading(true)
    const result = await getPendingEmployers(pendingPage, 10, employerSearch) // Using employerSearch for pending employers too
    if (result.success && result.employers) {
      setPendingEmployers(result.employers)
      if (result.pagination) {
        setPendingPagination(result.pagination)
      }
    }
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await businessLogout()
    router.push("/business/login")
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      console.log("[v0] Starting delete operation for:", deleteTarget.type, deleteTarget.id)

      let result
      if (deleteTarget.type === "employer") {
        result = await deleteEmployer(deleteTarget.id)
        if (result.success) {
          console.log("[v0] Employer deleted, refreshing list")
          await fetchEmployers()
        }
      } else if (deleteTarget.type === "candidate") {
        result = await deleteCandidate(deleteTarget.id)
        if (result.success) {
          console.log("[v0] Candidate deleted, refreshing list")
          await fetchCandidates()
        }
      } else if (deleteTarget.type === "job") {
        result = await deleteJob(deleteTarget.id)
        if (result.success) {
          console.log("[v0] Job deleted, refreshing list")
          await fetchJobs()
        }
      } else if (deleteTarget.type === "team_member") {
        result = await deleteBusinessTeamMember(deleteTarget.id)
        if (result.success) {
          console.log("[v0] Team member deleted, refreshing list")
          await fetchTeam()
        }
      }

      if (!result?.success) {
        console.error("[v0] Delete operation failed:", result?.error)
        alert(`Failed to delete: ${result?.error || "Unknown error"}`)
      } else {
        console.log("[v0] Delete operation completed successfully")
      }
    } catch (error) {
      console.error("[v0] Delete operation error:", error)
      alert("An error occurred while deleting. Please try again.")
    }

    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const handleApproveEmployer = async () => {
    if (!selectedEmployer) return

    try {
      // Assuming session.userId is available and represents the admin performing the action
      const result = await approveEmployer(selectedEmployer.id as string, session.userId)
      if (result.success) {
        await fetchPendingEmployers() // Refresh pending list
        await fetchEmployers() // Also refresh the main employers list to show the updated status
        setApprovalDialogOpen(false)
        setSelectedEmployer(null)
        setRejectionReason("") // Clear rejection reason
      } else {
        alert(result.error || "Failed to approve employer")
      }
    } catch (error) {
      console.error("Error approving employer:", error)
      alert("An error occurred while approving. Please try again.")
    }
  }

  const handleRejectEmployer = async () => {
    if (!selectedEmployer || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    try {
      const result = await rejectEmployer(selectedEmployer.id as string, rejectionReason)
      if (result.success) {
        await fetchPendingEmployers() // Refresh pending list
        setApprovalDialogOpen(false)
        setSelectedEmployer(null)
        setRejectionReason("")
      } else {
        alert(result.error || "Failed to reject employer")
      }
    } catch (error) {
      console.error("Error rejecting employer:", error)
      alert("An error occurred while rejecting. Please try again.")
    }
  }

  const openApprovalDialog = (employer: Record<string, unknown>, action: "approve" | "reject") => {
    setSelectedEmployer(employer)
    setApprovalAction(action)
    setRejectionReason("") // Reset reason on open
    setApprovalDialogOpen(true)
  }

  // Fetch manual credit assignments
  const fetchManualAssignments = async (searchQuery = "") => {
    console.log("[v0] Fetching manual assignments, search:", searchQuery)
    setAssignmentsLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      let query = supabase
        .from("manual_credit_assignments")
        .select(`
          *,
          employers:employer_id (
            company_name,
            email
          )
        `)
        .order("assigned_at", { ascending: false })
        .limit(50)

      // Apply search filter if search query exists
      if (searchQuery && searchQuery.trim().length > 0) {
        // Note: This searches by employer_id which won't work well
        // We need to use a different approach for text search
        console.log("[v0] Applying search filter:", searchQuery)
      }

      const { data, error } = await query

      console.log("[v0] Manual assignments response - Data count:", data?.length, "Error:", error)
      
      if (error) {
        console.error("[v0] Error fetching manual assignments:", error)
      } else {
        console.log("[v0] Setting manual assignments, count:", data?.length)
        
        // Apply client-side filtering for search
        let filteredData = data || []
        if (searchQuery && searchQuery.trim().length > 0) {
          const searchLower = searchQuery.toLowerCase()
          filteredData = filteredData.filter((assignment: any) => {
            const companyName = assignment.employers?.company_name?.toLowerCase() || ""
            const email = assignment.employers?.email?.toLowerCase() || ""
            return companyName.includes(searchLower) || email.includes(searchLower)
          })
          console.log("[v0] After search filter, count:", filteredData.length)
        }
        
        setManualAssignments(filteredData)
      }
    } catch (error) {
      console.error("[v0] Exception fetching manual assignments:", error)
    }
    setAssignmentsLoading(false)
  }

  // Manual Credit Assignment Handlers
  const handleOpenCreditDialog = () => {
    setCreditForm({
      employerId: "",
      employerEmail: "",
      credits: 1,
      reason: "",
    })
    setEmployerSearchResults([])
    setCreditDialogOpen(true)
  }

  const handleEmployerSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setEmployerSearchResults([])
      return
    }

    setEmployerSearchLoading(true)
    const result = await getAllEmployers(1, 10, searchQuery)
    if (result.success && result.employers) {
      setEmployerSearchResults(result.employers)
    }
    setEmployerSearchLoading(false)
  }

  const handleSelectEmployer = (employer: Record<string, unknown>) => {
    setCreditForm({
      ...creditForm,
      employerId: employer.id as string,
      employerEmail: employer.email as string,
    })
    setEmployerSearchResults([])
  }

  const handleAssignCredits = async () => {
    if (!creditForm.employerId || creditForm.credits <= 0 || !creditForm.reason.trim()) {
      alert("Please select an employer, enter credits amount, and provide a reason")
      return
    }

    setCreditFormLoading(true)
    try {
      const result = await assignCreditsManually(
        creditForm.employerId,
        creditForm.credits,
        creditForm.reason,
        session.userId,
      )

      if (result.success) {
        alert(
          `Successfully assigned ${result.creditsAdded} credits to ${result.employer?.companyName} (${result.employer?.email})`,
        )
        setCreditDialogOpen(false)
        setCreditForm({
          employerId: "",
          employerEmail: "",
          credits: 1,
          reason: "",
        })
        // Refresh manual assignments list
        await fetchManualAssignments()
        // Refresh employers list if on employers view
        if (activeView === "employers") {
          await fetchEmployers()
        }
      } else {
        alert(result.error || "Failed to assign credits")
      }
    } catch (error) {
      console.error("Error assigning credits:", error)
      alert("An error occurred while assigning credits")
    }
    setCreditFormLoading(false)
  }

  const handleAddEmployer = () => {
    setEmployerFormMode("add")
    setEmployerFormData({
      username: "",
      company_name: "",
      contact_person: "",
      email: "",
      password: "",
      mobile_number: "",
      city: "",
      industry_type: "",
    })
    setEmployerDialogOpen(true)
  }

  const handleEditEmployer = (employer: Record<string, unknown>) => {
    setEmployerFormMode("edit")
    setEmployerFormData({
      id: employer.id as string,
      username: (employer.username as string) || "", // Assuming username is available
      company_name: (employer.company_name as string) || "",
      contact_person: (employer.contact_person as string) || "",
      email: (employer.email as string) || "",
      mobile_number: (employer.mobile_number as string) || "",
      city: (employer.city as string) || "",
      industry_type: (employer.industry_type as string) || "",
    })
    setEmployerDialogOpen(true)
  }

  const handleEmployerFormSubmit = async () => {
    setEmployerFormLoading(true)
    try {
      if (employerFormMode === "add") {
        if (!employerFormData.password) {
          alert("Password is required for new employer")
          setEmployerFormLoading(false)
          return
        }
        if (!employerFormData.username) {
          alert("Username is required for new employer")
          setEmployerFormLoading(false)
          return
        }
        const result = await addEmployer({
          username: employerFormData.username,
          company_name: employerFormData.company_name,
          contact_person: employerFormData.contact_person,
          email: employerFormData.email,
          password: employerFormData.password,
          mobile_number: employerFormData.mobile_number || undefined,
          city: employerFormData.city || undefined,
          industry_type: employerFormData.industry_type || undefined,
        })
        if (!result.success) {
          alert(result.error || "Failed to add employer")
          setEmployerFormLoading(false)
          return
        }
      } else {
        if (!employerFormData.id) return
        const result = await updateEmployer(employerFormData.id, {
          username: employerFormData.username,
          company_name: employerFormData.company_name,
          contact_person: employerFormData.contact_person,
          email: employerFormData.email,
          mobile_number: employerFormData.mobile_number || undefined,
          city: employerFormData.city || undefined,
          industry_type: employerFormData.industry_type || undefined,
        })
        if (!result.success) {
          alert(result.error || "Failed to update employer")
          setEmployerFormLoading(false)
          return
        }
      }
      setEmployerDialogOpen(false)
      fetchEmployers()
    } catch (error) {
      console.error("Error submitting employer form:", error)
      alert("An error occurred")
    }
    setEmployerFormLoading(false)
  }

  const handleAddCandidate = () => {
    setEditingCandidate(null)
    setCandidateForm({
      full_name: "",
      email: "",
      mobile_number: "",
      password: "",
      gender: "",
      work_status: "fresher",
      current_job_title: "",
      company_name: "",
      total_experience_years: 0,
      total_experience_months: 0,
      annual_salary: "",
      notice_period: "",
      highest_qualification: "",
      course: "",
      specialization: "",
      university: "",
      passing_year: "",
      current_city: "",
      current_state: "",
      skills_you_know: [],
      preferred_locations: [],
    })
    setCandidateFormStep(1)
    setCandidateDialogOpen(true)
  }

  const handleEditCandidate = async (candidate: Record<string, unknown>) => {
    setEditingCandidate(candidate)
    // Fetch full candidate details if available, otherwise use provided data
    const candidateDetails = await getCandidateById(candidate.id as string)
    const dataToEdit = candidateDetails.success && candidateDetails.candidate ? candidateDetails.candidate : candidate

    setCandidateForm({
      full_name: (dataToEdit.full_name as string) || "",
      email: (dataToEdit.email as string) || "",
      mobile_number: (dataToEdit.mobile_number as string) || "",
      password: "", // Password is not shown or edited on update
      gender: (dataToEdit.gender as string) || "",
      work_status: (dataToEdit.work_status as string) || "fresher",
      current_job_title: (dataToEdit.current_job_title as string) || "",
      company_name: (dataToEdit.company_name as string) || "",
      total_experience_years: (dataToEdit.total_experience_years as number) || 0,
      total_experience_months: (dataToEdit.total_experience_months as number) || 0,
      annual_salary: (dataToEdit.annual_salary as string) || "",
      notice_period: (dataToEdit.notice_period as string) || "",
      highest_qualification: (dataToEdit.highest_qualification as string) || "",
      course: (dataToEdit.course as string) || "",
      specialization: (dataToEdit.specialization as string) || "",
      university: (dataToEdit.university as string) || "",
      passing_year: (dataToEdit.passing_year as string) || "",
      current_city: (dataToEdit.current_city as string) || "",
      current_state: (dataToEdit.current_state as string) || "",
      skills_you_know: (dataToEdit.skills_you_know as string[]) || [],
      preferred_locations: (dataToEdit.preferred_locations as string[]) || [],
    })
    setCandidateFormStep(1)
    setCandidateDialogOpen(true)
  }

  const handleSaveCandidate = async () => {
    try {
      if (editingCandidate) {
        const result = await updateCandidate(editingCandidate.id as string, candidateForm)
        if (!result.success) throw new Error(result.error || "Failed to update candidate")
      } else {
        const result = await addCandidate(candidateForm)
        if (!result.success) throw new Error(result.error || "Failed to add candidate")
      }
      setCandidateDialogOpen(false)
      fetchCandidates()
    } catch (error) {
      console.error("Error saving candidate:", error)
      alert(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  const handleAddJob = () => {
    setEditingJob(null)
    setJobForm({
      job_title: "",
      company_name: "",
      employer_id: "",
      job_description: "",
      employment_type: "full-time",
      work_mode: "on-site",
      min_salary: 0,
      max_salary: 0,
      min_experience: 0,
      max_experience: 0,
      openings: 1,
      job_locations: [],
      required_skills: [],
      status: "draft",
    })
    setJobDialogOpen(true)
  }

  const handleEditJob = async (job: Record<string, unknown>) => {
    setEditingJob(job)
    // Fetch full job details if available, otherwise use provided data
    const jobDetails = await getJobById(job.id as string)
    const dataToEdit = jobDetails.success && jobDetails.job ? jobDetails.job : job

    setJobForm({
      job_title: (dataToEdit.job_title as string) || "",
      company_name: (dataToEdit.company_name as string) || "",
      employer_id: (dataToEdit.employer_id as string) || "", // Employer ID might be present but not editable directly on edit
      job_description: (dataToEdit.job_description as string) || "",
      employment_type: (dataToEdit.employment_type as string) || "full-time",
      work_mode: (dataToEdit.work_mode as string) || "on-site",
      min_salary: (dataToEdit.min_salary as number) || 0,
      max_salary: (dataToEdit.max_salary as number) || 0,
      min_experience: (dataToEdit.min_experience as number) || 0,
      max_experience: (dataToEdit.max_experience as number) || 0,
      openings: (dataToEdit.openings as number) || 1,
      job_locations: (dataToEdit.job_locations as string[]) || [],
      required_skills: (dataToEdit.required_skills as string[]) || [],
      status: (dataToEdit.status as string) || "draft",
    })
    setJobDialogOpen(true)
  }

  const handleSaveJob = async () => {
    try {
      if (editingJob) {
        const result = await updateJob(editingJob.id as string, jobForm)
        if (!result.success) throw new Error(result.error || "Failed to update job")
      } else {
        if (!jobForm.employer_id) {
          alert("Employer ID is required for new jobs")
          return
        }
        const result = await addJob(jobForm)
        if (!result.success) throw new Error(result.error || "Failed to add job")
      }
      setJobDialogOpen(false)
      fetchJobs()
    } catch (error) {
      console.error("Error saving job:", error)
      alert(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  const handleAddTeamMember = async () => {
    const result = await addBusinessTeamMember(newTeamMember) // Using renamed action
    if (result.success) {
      setAddTeamDialogOpen(false)
      setNewTeamMember({ email: "", password: "", fullName: "", role: "admin" })
      fetchTeam()
    } else {
      alert(result.error || "Failed to add team member")
    }
  }

  const handleJobStatusChange = async (jobId: string, status: string) => {
    const result = await updateJobStatus(jobId, status)
    if (result.success) fetchJobs()
  }

  const sidebarItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "employers" as const, label: "Employers", icon: Building2 },
    { id: "candidates" as const, label: "Candidates", icon: Users },
    { id: "jobs" as const, label: "Jobs", icon: Briefcase },
    { id: "team" as const, label: "Team", icon: UserCog },
  ]

  // Added filtered jobs computed state to apply status filter
  const filteredJobs = jobs.filter((job) => {
    // If no status filter is selected, show all jobs
    if (jobStatusFilter.length === 0) return true

    // Otherwise, show only jobs matching selected statuses
    return jobStatusFilter.includes(job.status as string)
  })

  // FIX: jobStatusFilter and toggleJobStatusFilter were undeclared.
  const toggleJobStatusFilter = (status: string) => {
    setJobStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  // Define onSearch here, as it's used in the JSX and was causing an undeclared variable error.
  const onSearch = () => {
    setJobPage(1) // Reset to the first page when searching
    fetchJobs()
  }

  // Define onStatusChange here, as it's used in the JSX and was causing an undeclared variable error.
  const onStatusChange = (jobId: string, status: string) => {
    handleJobStatusChange(jobId, status)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <Link href="/" className="p-6 border-b border-slate-800 block hover:bg-slate-800 transition-colors">
          <h1 className="text-xl font-bold text-white">JobKarle</h1>
          <p className="text-sm text-slate-400">Business Portal</p>
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeView === item.id ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {activeView === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
              <button
                onClick={() => setActiveView("approvals")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeView === "approvals"
                    ? "bg-primary text-white" // Consistent with other active items
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Pending Approvals</span>
                {pendingPagination.total > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingPagination.total}
                  </Badge>
                )}
                {activeView === "approvals" && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
              <button
                onClick={() => setActiveView("credits")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeView === "credits"
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Coins className="w-5 h-5" />
                <span>Manual Credits</span>
                {activeView === "credits" && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">{session.fullName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{session.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 bg-transparent"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeView === "dashboard" && (
            <DashboardView
              dailyMetrics={dailyMetrics}
              weeklyMetrics={weeklyMetrics}
              isLoading={isLoading}
              onRefresh={fetchMetrics}
            />
          )}

          {activeView === "employers" && (
            <EmployersView
              employers={employers}
              pagination={employerPagination}
              page={employerPage}
              search={employerSearch}
              onPageChange={setEmployerPage}
              onSearchChange={(s) => {
                setEmployerSearch(s)
                setEmployerPage(1)
              }}
              onSearch={fetchEmployers}
              onDelete={(id, name) => {
                setDeleteTarget({ type: "employer", id, name })
                setDeleteDialogOpen(true)
              }}
              onEdit={handleEditEmployer}
              onAdd={handleAddEmployer}
            />
          )}

          {activeView === "candidates" && (
            <CandidatesView
              candidates={candidates}
              pagination={candidatePagination}
              page={candidatePage}
              search={candidateSearch}
              onPageChange={setCandidatePage}
              onSearchChange={(s) => {
                setCandidateSearch(s)
                setCandidatePage(1)
              }}
              onSearch={fetchCandidates}
              onDelete={(id, name) => {
                setDeleteTarget({ type: "candidate", id, name })
                setDeleteDialogOpen(true)
              }}
              onAdd={handleAddCandidate}
              onEdit={handleEditCandidate}
            />
          )}

          {activeView === "jobs" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={jobSearch}
                    onChange={(e) => {
                      setJobSearch(e.target.value)
                      setJobPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        Filter by Status ({jobStatusFilter.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <div className="p-2 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={jobStatusFilter.includes("draft")}
                            onChange={() => toggleJobStatusFilter("draft")}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-300">Draft</span>
                          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-400">
                            {jobs.filter((j) => j.status === "draft").length}
                          </Badge>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={jobStatusFilter.includes("published")}
                            onChange={() => toggleJobStatusFilter("published")}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-300">Published</span>
                          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-400">
                            {jobs.filter((j) => j.status === "published").length}
                          </Badge>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={jobStatusFilter.includes("closed")}
                            onChange={() => toggleJobStatusFilter("closed")}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-300">Closed</span>
                          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-400">
                            {jobs.filter((j) => j.status === "closed").length}
                          </Badge>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={jobStatusFilter.includes("expired")}
                            onChange={() => toggleJobStatusFilter("expired")}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-300">Expired</span>
                          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-400">
                            {jobs.filter((j) => j.status === "expired").length}
                          </Badge>
                        </label>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* </CHANGE> */}
                  <Button size="sm" onClick={handleAddJob} className="bg-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchJobs}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Card className="bg-slate-900 border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Job Title</TableHead>
                      <TableHead className="text-slate-400">Company</TableHead>
                      <TableHead className="text-slate-400">Employer Email</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Salary</TableHead>
                      <TableHead className="text-slate-400">Applications</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Posted</TableHead>
                      <TableHead className="text-slate-400 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          {jobs.length === 0 ? "No jobs found" : "No jobs match the selected filters"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredJobs.map((job) => (
                        <TableRow key={job.id as string} className="border-slate-800">
                          <TableCell className="text-white font-medium">{job.job_title as string}</TableCell>
                          <TableCell className="text-slate-300">{(job.company_name as string) || "N/A"}</TableCell>
                          <TableCell className="text-slate-300">{(job.employer_email as string) || "N/A"}</TableCell>
                          <TableCell className="text-slate-300">{(job.employment_type as string) || "N/A"}</TableCell>
                          <TableCell className="text-slate-300">
                            {job.min_salary && job.max_salary
                              ? `₹${Number(job.min_salary).toLocaleString()} - ₹${Number(job.max_salary).toLocaleString()}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-primary/30 text-white bg-primary/10">
                              {(job.application_count as number) || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={(job.status as string) || "draft"}
                              onValueChange={(value) => onStatusChange(job.id as string, value)}
                            >
                              <SelectTrigger className="w-28 h-8 bg-slate-800 border-slate-700 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="draft" className="text-white">
                                  Draft
                                </SelectItem>
                                <SelectItem value="published" className="text-white">
                                  Published
                                </SelectItem>
                                <SelectItem value="closed" className="text-white">
                                  Closed
                                </SelectItem>
                                <SelectItem value="expired" className="text-white">
                                  Expired
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {new Date(job.created_at as string).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-slate-400">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                {job.status === "draft" && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/employer/post-job?edit=${job.id}`}
                                      className="text-slate-300 focus:text-white focus:bg-slate-700 block px-2 py-1.5"
                                    >
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {/* </CHANGE> */}
                                <DropdownMenuItem
                                  className="text-slate-300 focus:text-white focus:bg-slate-700"
                                  onClick={() => handleEditJob(job)}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleJobStatusChange(job.id as string, "published")}
                                  disabled={job.status === "published"}
                                  className="focus:bg-slate-700 focus:text-white"
                                >
                                  Publish
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleJobStatusChange(job.id as string, "closed")}
                                  disabled={job.status === "closed"}
                                  className="focus:bg-slate-700 focus:text-white"
                                >
                                  Close
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "job",
                                      id: job.id as string,
                                      name: job.job_title as string,
                                    })
                                  }
                                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {/* </CHANGE> */}
                  </TableBody>
                </Table>
              </Card>

              <Pagination page={jobPage} totalPages={jobPagination.totalPages} onPageChange={setJobPage} />
            </div>
          )}

          {activeView === "approvals" && (
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pending Employer Approvals</h2>
                    <p className="text-gray-600 mt-1">Review and approve employer registration requests</p>
                  </div>
                  <Button
                    onClick={fetchPendingEmployers}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:bg-slate-800 bg-transparent"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {/* Search */}
                <div className="mb-6 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <Input
                      placeholder="Search by company name, email, or contact person..."
                      value={employerSearch}
                      onChange={(e) => {
                        setEmployerSearch(e.target.value)
                        setPendingPage(1) // Reset page on search
                      }}
                      className="pl-10 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Pending Employers Table */}
                {pendingEmployers.length === 0 ? (
                  <Card className="p-12 text-center bg-slate-900 border-slate-800">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
                    <p className="text-slate-400">There are no pending employer approvals at this time.</p>
                  </Card>
                ) : (
                  <Card className="bg-slate-900 border-slate-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-400">Company Name</TableHead>
                          <TableHead className="text-slate-400">Contact Person</TableHead>
                          <TableHead className="text-slate-400">Email</TableHead>
                          <TableHead className="text-slate-400">Mobile</TableHead>
                          <TableHead className="text-slate-400">City</TableHead>
                          <TableHead className="text-slate-400">Industry</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-400">Registered</TableHead>
                          <TableHead className="text-right text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingEmployers.map((employer) => (
                          <TableRow key={employer.id as string} className="border-slate-800">
                            <TableCell className="font-medium text-white">{employer.company_name as string}</TableCell>
                            <TableCell className="text-slate-300">{employer.contact_person as string}</TableCell>
                            <TableCell className="text-slate-300">{employer.email as string}</TableCell>
                            <TableCell className="text-slate-300">{employer.mobile_number as string}</TableCell>
                            <TableCell className="text-slate-300">{employer.city as string}</TableCell>
                            <TableCell className="text-slate-300">{employer.industry_type as string}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant={
                                    employer.approval_status === "approved"
                                      ? "default"
                                      : employer.approval_status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className={
                                    employer.approval_status === "approved"
                                      ? "bg-green-500/20 text-green-400"
                                      : employer.approval_status === "pending"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-red-500/20 text-red-400"
                                  }
                                >
                                  {(employer.approval_status as string)?.toUpperCase() || "UNKNOWN"}
                                </Badge>
                                {employer.otp_verified === false && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-slate-800 border-slate-700 text-slate-400"
                                  >
                                    OTP Pending
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {new Date(employer.created_at as string).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => openApprovalDialog(employer, "approve")}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openApprovalDialog(employer, "reject")}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pendingPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between p-4 border-t border-slate-800">
                        <p className="text-sm text-slate-400">
                          Showing {pendingEmployers.length} of {pendingPagination.total} pending approvals
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-400 bg-transparent hover:bg-slate-800 disabled:opacity-50"
                            onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                            disabled={pendingPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-slate-400">
                            Page {pendingPage} of {pendingPagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-400 bg-transparent hover:bg-slate-800 disabled:opacity-50"
                            onClick={() => setPendingPage((p) => Math.min(pendingPagination.totalPages, p + 1))}
                            disabled={pendingPage === pendingPagination.totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
          </div>
        </div>
      )}

      {activeView === "credits" && (
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manual Credit Assignment</h2>
                <p className="text-gray-600 mt-1">Manually assign credits to employers when needed</p>
              </div>
              <Button
                onClick={handleOpenCreditDialog}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Credits
              </Button>
            </div>

            {/* Search and Refresh Bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employer name or email..."
                  value={assignmentsSearch}
                  onChange={(e) => {
                    setAssignmentsSearch(e.target.value)
                    fetchManualAssignments(e.target.value)
                  }}
                  className="pl-10 bg-white"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchManualAssignments(assignmentsSearch)}
                disabled={assignmentsLoading}
                className="bg-white"
              >
                <RefreshCw className={`w-4 h-4 ${assignmentsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-0">
                {assignmentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading assignments...</span>
                  </div>
                ) : manualAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No manual credit assignments yet</p>
                    <p className="text-sm text-gray-500 mt-1">Click "Assign Credits" to add credits to an employer</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credits
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assigned By
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {manualAssignments.map((assignment) => (
                          <tr key={assignment.id as string} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(assignment.assigned_at as string).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="font-medium text-gray-900">
                                {(assignment.employers as any)?.company_name || "N/A"}
                              </div>
                              <div className="text-gray-500 text-xs">{(assignment.employers as any)?.email || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {assignment.credits_assigned as number} credits
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                              <div className="truncate" title={assignment.reason as string}>
                                {assignment.reason as string}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Admin
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeView === "team" && (
        <TeamView
              team={team}
              pagination={teamPagination}
              page={teamPage}
              onPageChange={setTeamPage}
              onAddMember={() => setAddTeamDialogOpen(true)}
              onDelete={(id, name) => {
                setDeleteTarget({ type: "team_member", id, name })
                setDeleteDialogOpen(true)
              }}
            />
          )}
        </div>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Delete</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Team Member</DialogTitle>
            <DialogDescription className="text-slate-400">Add a new member to your business team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={newTeamMember.fullName}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, fullName: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={newTeamMember.email}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Password</Label>
              <Input
                type="password"
                value={newTeamMember.password}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, password: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Role</Label>
              <Select
                value={newTeamMember.role}
                onValueChange={(value) => setNewTeamMember({ ...newTeamMember, role: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTeamDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleAddTeamMember} className="bg-primary">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={employerDialogOpen} onOpenChange={setEmployerDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{employerFormMode === "add" ? "Add New Employer" : "Edit Employer"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {employerFormMode === "add" ? "Create a new employer account" : "Update employer information"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={employerFormData.username}
                onChange={(e) => setEmployerFormData({ ...employerFormData, username: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={employerFormData.company_name}
                onChange={(e) => setEmployerFormData({ ...employerFormData, company_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                value={employerFormData.contact_person}
                onChange={(e) => setEmployerFormData({ ...employerFormData, contact_person: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={employerFormData.email}
                onChange={(e) => setEmployerFormData({ ...employerFormData, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter email address"
              />
            </div>
            {employerFormMode === "add" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={employerFormData.password || ""}
                  onChange={(e) => setEmployerFormData({ ...employerFormData, password: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter password"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                value={employerFormData.mobile_number}
                onChange={(e) => setEmployerFormData({ ...employerFormData, mobile_number: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter mobile number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={employerFormData.city}
                onChange={(e) => setEmployerFormData({ ...employerFormData, city: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry_type">Industry Type</Label>
              <Input
                id="industry_type"
                value={employerFormData.industry_type}
                onChange={(e) => setEmployerFormData({ ...employerFormData, industry_type: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter industry type"
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t border-slate-800 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setEmployerDialogOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmployerFormSubmit}
              disabled={
                employerFormLoading ||
                !employerFormData.username ||
                !employerFormData.company_name ||
                !employerFormData.contact_person ||
                !employerFormData.email
              }
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {employerFormLoading ? "Saving..." : employerFormMode === "add" ? "Add Employer" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingCandidate ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Step {candidateFormStep} of 4 -{" "}
              {candidateFormStep === 1
                ? "Basic Information"
                : candidateFormStep === 2
                  ? "Work Experience"
                  : candidateFormStep === 3
                    ? "Education"
                    : "Skills & Preferences"}
            </DialogDescription>
            {/* Step indicators */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full ${step <= candidateFormStep ? "bg-primary" : "bg-slate-700"}`}
                />
              ))}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4">
            {/* Step 1: Basic Information */}
            {candidateFormStep === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Full Name *</Label>
                  <Input
                    value={candidateForm.full_name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, full_name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Email *</Label>
                  <Input
                    type="email"
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Mobile Number *</Label>
                  <Input
                    value={candidateForm.mobile_number}
                    onChange={(e) => setCandidateForm({ ...candidateForm, mobile_number: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter mobile number"
                  />
                </div>
                {!editingCandidate && (
                  <div>
                    <Label className="text-slate-300">Password *</Label>
                    <Input
                      type="password"
                      value={candidateForm.password || ""}
                      onChange={(e) => setCandidateForm({ ...candidateForm, password: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      placeholder="Enter password"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-slate-300">Gender</Label>
                  <Select
                    value={candidateForm.gender}
                    onValueChange={(value) => setCandidateForm({ ...candidateForm, gender: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Work Status *</Label>
                  <Select
                    value={candidateForm.work_status}
                    onValueChange={(value) => setCandidateForm({ ...candidateForm, work_status: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Select work status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="fresher">Fresher</SelectItem>
                      <SelectItem value="experienced">Experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">City</Label>
                  <Input
                    value={candidateForm.current_city}
                    onChange={(e) => setCandidateForm({ ...candidateForm, current_city: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">State</Label>
                  <Input
                    value={candidateForm.current_state}
                    onChange={(e) => setCandidateForm({ ...candidateForm, current_state: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter state"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Work Experience */}
            {candidateFormStep === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Current Job Title</Label>
                  <Input
                    value={candidateForm.current_job_title}
                    onChange={(e) => setCandidateForm({ ...candidateForm, current_job_title: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter job title"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Company Name</Label>
                  <Input
                    value={candidateForm.company_name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, company_name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Experience (Years)</Label>
                  <Input
                    type="number"
                    value={candidateForm.total_experience_years}
                    onChange={(e) =>
                      setCandidateForm({
                        ...candidateForm,
                        total_experience_years: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Years"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Experience (Months)</Label>
                  <Input
                    type="number"
                    value={candidateForm.total_experience_months}
                    onChange={(e) =>
                      setCandidateForm({
                        ...candidateForm,
                        total_experience_months: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Months"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Annual Salary (LPA)</Label>
                  <Input
                    value={candidateForm.annual_salary}
                    onChange={(e) => setCandidateForm({ ...candidateForm, annual_salary: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="e.g., 5-7 LPA"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Notice Period</Label>
                  <Select
                    value={candidateForm.notice_period}
                    onValueChange={(value) => setCandidateForm({ ...candidateForm, notice_period: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Select notice period" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="15 days">15 Days</SelectItem>
                      <SelectItem value="1 month">1 Month</SelectItem>
                      <SelectItem value="2 months">2 Months</SelectItem>
                      <SelectItem value="3 months">3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Education */}
            {candidateFormStep === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Highest Qualification</Label>
                  <Select
                    value={candidateForm.highest_qualification}
                    onValueChange={(value) => setCandidateForm({ ...candidateForm, highest_qualification: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="10th">10th</SelectItem>
                      <SelectItem value="12th">12th</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="Bachelor's">Bachelor&apos;s</SelectItem>
                      <SelectItem value="Master's">Master&apos;s</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Course</Label>
                  <Input
                    value={candidateForm.course}
                    onChange={(e) => setCandidateForm({ ...candidateForm, course: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="e.g., B.Tech, MBA"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Specialization</Label>
                  <Input
                    value={candidateForm.specialization}
                    onChange={(e) => setCandidateForm({ ...candidateForm, specialization: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">University/College</Label>
                  <Input
                    value={candidateForm.university}
                    onChange={(e) => setCandidateForm({ ...candidateForm, university: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter university name"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Passing Year</Label>
                  <Input
                    value={candidateForm.passing_year}
                    onChange={(e) => setCandidateForm({ ...candidateForm, passing_year: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="e.g., 2023"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Skills & Preferences */}
            {candidateFormStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Skills</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={candidateSkillInput}
                      onChange={(e) => setCandidateSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && candidateSkillInput.trim()) {
                          setCandidateForm({
                            ...candidateForm,
                            skills_you_know: [...candidateForm.skills_you_know, candidateSkillInput.trim()],
                          })
                          setCandidateSkillInput("")
                        }
                      }}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Type skill and press Enter"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (candidateSkillInput.trim()) {
                          setCandidateForm({
                            ...candidateForm,
                            skills_you_know: [...candidateForm.skills_you_know, candidateSkillInput.trim()],
                          })
                          setCandidateSkillInput("")
                        }
                      }}
                      className="bg-primary"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidateForm.skills_you_know.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-800 text-white">
                        {skill}
                        <button
                          onClick={() =>
                            setCandidateForm({
                              ...candidateForm,
                              skills_you_know: candidateForm.skills_you_know.filter((_, i) => i !== index),
                            })
                          }
                          className="ml-2 text-slate-400 hover:text-white"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Preferred Locations</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={candidateLocationInput}
                      onChange={(e) => setCandidateLocationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && candidateLocationInput.trim()) {
                          setCandidateForm({
                            ...candidateForm,
                            preferred_locations: [...candidateForm.preferred_locations, candidateLocationInput.trim()],
                          })
                          setCandidateLocationInput("")
                        }
                      }}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Type location and press Enter"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (candidateLocationInput.trim()) {
                          setCandidateForm({
                            ...candidateForm,
                            preferred_locations: [...candidateForm.preferred_locations, candidateLocationInput.trim()],
                          })
                          setCandidateLocationInput("")
                        }
                      }}
                      className="bg-primary"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidateForm.preferred_locations.map((location, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-800 text-white">
                        {location}
                        <button
                          onClick={() =>
                            setCandidateForm({
                              ...candidateForm,
                              preferred_locations: candidateForm.preferred_locations.filter((_, i) => i !== index),
                            })
                          }
                          className="ml-2 text-slate-400 hover:text-white"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-800 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setCandidateDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            {candidateFormStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCandidateFormStep(candidateFormStep - 1)}
                className="border-slate-700 text-slate-300"
              >
                Previous
              </Button>
            )}
            {candidateFormStep < 4 ? (
              <Button
                onClick={() => setCandidateFormStep(candidateFormStep + 1)}
                className="bg-primary"
                disabled={
                  candidateFormStep === 1 &&
                  (!candidateForm.full_name ||
                    !candidateForm.email ||
                    !candidateForm.mobile_number ||
                    (!editingCandidate && !candidateForm.password))
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSaveCandidate} className="bg-primary">
                {editingCandidate ? "Update" : "Save"} Candidate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingJob ? "Edit Job" : "Add Job"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingJob ? "Update job posting details" : "Create a new job posting"}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Job Title *</Label>
                <Input
                  value={jobForm.job_title}
                  onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Enter job title"
                />
              </div>
              <div>
                <Label className="text-slate-300">Company Name *</Label>
                <Input
                  value={jobForm.company_name}
                  onChange={(e) => setJobForm({ ...jobForm, company_name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Enter company name"
                />
              </div>
              {!editingJob && (
                <div className="col-span-2">
                  <Label className="text-slate-300">Employer ID *</Label>
                  <Input
                    value={jobForm.employer_id}
                    onChange={(e) => setJobForm({ ...jobForm, employer_id: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="Enter employer UUID"
                  />
                </div>
              )}
              <div>
                <Label className="text-slate-300">Employment Type</Label>
                <Select
                  value={jobForm.employment_type}
                  onValueChange={(value) => setJobForm({ ...jobForm, employment_type: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Work Mode</Label>
                <Select
                  value={jobForm.work_mode}
                  onValueChange={(value) => setJobForm({ ...jobForm, work_mode: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="on-site">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Min Salary (₹)</Label>
                <Input
                  type="number"
                  value={jobForm.min_salary}
                  onChange={(e) => setJobForm({ ...jobForm, min_salary: Number.parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Min salary"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Salary (₹)</Label>
                <Input
                  type="number"
                  value={jobForm.max_salary}
                  onChange={(e) => setJobForm({ ...jobForm, max_salary: Number.parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Max salary"
                />
              </div>
              <div>
                <Label className="text-slate-300">Min Experience (Years)</Label>
                <Input
                  type="number"
                  value={jobForm.min_experience}
                  onChange={(e) => setJobForm({ ...jobForm, min_experience: Number.parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Min experience"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Experience (Years)</Label>
                <Input
                  type="number"
                  value={jobForm.max_experience}
                  onChange={(e) => setJobForm({ ...jobForm, max_experience: Number.parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Max experience"
                />
              </div>
              <div>
                <Label className="text-slate-300">Openings</Label>
                <Input
                  type="number"
                  value={jobForm.openings}
                  onChange={(e) => setJobForm({ ...jobForm, openings: Number.parseInt(e.target.value) || 1 })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Number of openings"
                />
              </div>
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={jobForm.status} onValueChange={(value) => setJobForm({ ...jobForm, status: value })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Job Description</Label>
              <textarea
                value={jobForm.job_description}
                onChange={(e) => setJobForm({ ...jobForm, job_description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white mt-1 p-3 rounded-md min-h-[100px]"
                placeholder="Enter job description"
              />
            </div>

            <div>
              <Label className="text-slate-300">Job Locations</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={jobLocationInput}
                  onChange={(e) => setJobLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && jobLocationInput.trim()) {
                      setJobForm({
                        ...jobForm,
                        job_locations: [...jobForm.job_locations, jobLocationInput.trim()],
                      })
                      setJobLocationInput("")
                    }
                  }}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Type location and press Enter"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (jobLocationInput.trim()) {
                      setJobForm({
                        ...jobForm,
                        job_locations: [...jobForm.job_locations, jobLocationInput.trim()],
                      })
                      setJobLocationInput("")
                    }
                  }}
                  className="bg-primary"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {jobForm.job_locations.map((location, index) => (
                  <Badge key={index} variant="secondary" className="bg-slate-800 text-white">
                    {location}
                    <button
                      onClick={() =>
                        setJobForm({
                          ...jobForm,
                          job_locations: jobForm.job_locations.filter((_, i) => i !== index),
                        })
                      }
                      className="ml-2 text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Required Skills</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={jobSkillInput}
                  onChange={(e) => setJobSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && jobSkillInput.trim()) {
                      setJobForm({
                        ...jobForm,
                        required_skills: [...jobForm.required_skills, jobSkillInput.trim()],
                      })
                      setJobSkillInput("")
                    }
                  }}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Type skill and press Enter"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (jobSkillInput.trim()) {
                      setJobForm({
                        ...jobForm,
                        required_skills: [...jobForm.required_skills, jobSkillInput.trim()],
                      })
                      setJobSkillInput("")
                    }
                  }}
                  className="bg-primary"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {jobForm.required_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-slate-800 text-white">
                    {skill}
                    <button
                      onClick={() =>
                        setJobForm({
                          ...jobForm,
                          required_skills: jobForm.required_skills.filter((_, i) => i !== index),
                        })
                      }
                      className="ml-2 text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-800 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setJobDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveJob}
              className="bg-primary"
              disabled={!jobForm.job_title || !jobForm.company_name || (!editingJob && !jobForm.employer_id)}
            >
              {editingJob ? "Update" : "Save"} Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{approvalAction === "approve" ? "Approve Employer" : "Reject Employer"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {approvalAction === "approve"
                ? `Are you sure you want to approve ${selectedEmployer?.company_name}? They will be able to login and post jobs.`
                : `Provide a reason for rejecting ${selectedEmployer?.company_name}'s application.`}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployer && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-800 rounded-lg space-y-2 border border-slate-700">
                <p className="text-sm">
                  <span className="font-semibold text-slate-300">Company:</span>{" "}
                  {selectedEmployer.company_name as string}
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-300">Contact:</span>{" "}
                  {selectedEmployer.contact_person as string}
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-300">Email:</span> {selectedEmployer.email as string}
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-300">Mobile:</span>{" "}
                  {selectedEmployer.mobile_number as string}
                </p>
              </div>

              {approvalAction === "reject" && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Rejection Reason *</Label>
                  <Input
                    placeholder="Please provide a clear reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            {approvalAction === "approve" ? (
              <Button onClick={handleApproveEmployer} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Employer
              </Button>
            ) : (
              <Button onClick={handleRejectEmployer} variant="destructive">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reject Application
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Credit Assignment Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white">Manual Credit Assignment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Assign credits to an employer account. All assignments are logged for audit purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Employer Search */}
            <div className="space-y-2">
              <Label className="text-slate-300">Search Employer *</Label>
              <Input
                placeholder="Type company name or email (min 3 characters)..."
                onChange={(e) => handleEmployerSearch(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                disabled={creditFormLoading}
              />
              {employerSearchLoading && (
                <p className="text-sm text-slate-400">Searching...</p>
              )}
              {employerSearchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-slate-700 rounded-lg bg-slate-800">
                  {employerSearchResults.map((employer) => (
                    <button
                      key={employer.id as string}
                      onClick={() => handleSelectEmployer(employer)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                    >
                      <div className="font-medium text-white">{employer.company_name as string}</div>
                      <div className="text-sm text-slate-400">{employer.email as string}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Employer Display */}
            {creditForm.employerEmail && (
              <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-sm text-green-300">
                  <strong>Selected:</strong> {creditForm.employerEmail}
                </p>
              </div>
            )}

            {/* Credits Input */}
            <div className="space-y-2">
              <Label className="text-slate-300">Number of Credits *</Label>
              <Input
                type="number"
                min="1"
                value={creditForm.credits}
                onChange={(e) => setCreditForm({ ...creditForm, credits: parseInt(e.target.value) || 1 })}
                className="bg-slate-800 border-slate-700 text-white"
                disabled={creditFormLoading}
              />
              <p className="text-xs text-slate-400">Credits will expire in 30 days</p>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label className="text-slate-300">Reason for Assignment *</Label>
              <Input
                placeholder="e.g., Compensation for payment issue, Promotional credits..."
                value={creditForm.reason}
                onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                disabled={creditFormLoading}
              />
              <p className="text-xs text-slate-400">This will be recorded in the audit log</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreditDialogOpen(false)}
              className="border-slate-700 bg-transparent"
              disabled={creditFormLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignCredits}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={creditFormLoading || !creditForm.employerId || !creditForm.reason.trim()}
            >
              {creditFormLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Assign Credits
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Dashboard View Component
function DashboardView({
  dailyMetrics,
  weeklyMetrics,
  isLoading,
  onRefresh,
}: {
  dailyMetrics: DailyMetrics | null
  weeklyMetrics: WeeklyMetrics | null
  isLoading: boolean
  onRefresh: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Platform metrics and insights</p>
          </div>
          <Button onClick={onRefresh} variant="outline" className="border-slate-700 text-slate-400 bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* User Activity Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="New Candidates Today"
              value={dailyMetrics?.userActivity.newCandidates || 0}
              icon={<Users className="w-5 h-5" />}
              trend={weeklyMetrics?.growth.candidateGrowthPercent}
            />
            <MetricCard
              title="New Employers Today"
              value={dailyMetrics?.userActivity.newEmployers || 0}
              icon={<Building2 className="w-5 h-5" />}
              trend={weeklyMetrics?.growth.employerGrowthPercent}
            />
            <MetricCard
              title="Total Candidates"
              value={dailyMetrics?.userActivity.totalCandidates || 0}
              icon={<Users className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Employers"
              value={dailyMetrics?.userActivity.totalEmployers || 0}
              icon={<Building2 className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Job Activity Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Job Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="New Jobs Today"
              value={dailyMetrics?.jobActivity.newJobsToday || 0}
              icon={<Briefcase className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Jobs"
              value={dailyMetrics?.jobActivity.totalJobs || 0}
              icon={<FileText className="w-5 h-5" />}
            />
            <MetricCard
              title="Active Jobs"
              value={weeklyMetrics?.marketplace.activeJobs || 0}
              icon={<Activity className="w-5 h-5" />}
              trend={weeklyMetrics?.marketplace.activeJobsGrowthPercent}
              subtitle={`${weeklyMetrics?.marketplace.activeJobsThisWeek || 0} new this week`}
            />
            <MetricCard
              title="Jobs/Candidates Ratio"
              value={weeklyMetrics?.marketplace.jobsToCandidatesRatio || 0}
              icon={<TrendingUp className="w-5 h-5" />}
              suffix=":1"
            />
          </div>
        </div>

        {/* Application Flow Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Application Flow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Applications Today"
              value={dailyMetrics?.applicationFlow.applicationsToday || 0}
              icon={<FileText className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Applications"
              value={dailyMetrics?.applicationFlow.totalApplications || 0}
              icon={<FileText className="w-5 h-5" />}
            />
            <MetricCard
              title="Avg Applications/Job"
              value={dailyMetrics?.applicationFlow.avgApplicationsPerJob || 0}
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricCard
              title="Jobs with 0 Applications"
              value={dailyMetrics?.applicationFlow.jobsWithNoApplications || 0}
              icon={<AlertTriangle className="w-5 h-5" />}
              variant="warning"
            />
          </div>
        </div>

        {/* Weekly Growth */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Weekly Growth
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Weekly New Candidates"
              value={weeklyMetrics?.growth.weeklyNewCandidates || 0}
              icon={<Users className="w-5 h-5" />}
              trend={weeklyMetrics?.growth.candidateGrowthPercent}
            />
            <MetricCard
              title="Weekly New Employers"
              value={weeklyMetrics?.growth.weeklyNewEmployers || 0}
              icon={<Building2 className="w-5 h-5" />}
              trend={weeklyMetrics?.growth.employerGrowthPercent}
            />
            <MetricCard
              title="Active Candidates"
              value={weeklyMetrics?.marketplace.activeCandidates || 0}
              icon={<Users className="w-5 h-5" />}
            />
            <MetricCard
              title="Active Jobs"
              value={weeklyMetrics?.marketplace.activeJobs || 0}
              icon={<Briefcase className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  icon,
  trend,
  suffix,
  subtitle,
  variant = "default",
}: {
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
  suffix?: string
  subtitle?: string
  variant?: "default" | "warning"
}) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <Card className={`bg-slate-900 border-slate-800 ${variant === "warning" ? "border-amber-500/30" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-2 rounded-lg ${variant === "warning" ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"}`}
          >
            {icon}
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm ${isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-slate-400"}`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : isNegative ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white">
          {value.toLocaleString()}
          {suffix}
        </p>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        <p className="text-sm text-slate-400 mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

// Employers View Component
function EmployersView({
  employers,
  pagination,
  page,
  search,
  onPageChange,
  onSearchChange,
  onEdit,
  onDelete,
  onAdd,
}: {
  employers: Record<string, unknown>[]
  pagination: { total: number; totalPages: number }
  page: number
  search: string
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
  onEdit: (employer: Record<string, unknown>) => void
  onDelete: (id: string, name: string) => void
  onAdd: () => void
}) {
  // Fetch employers function needs to be defined or passed down for the search button
  const fetchEmployers = async () => {
    // This is a placeholder. In a real scenario, this would call the API.
    // For this example, we'll assume it's handled in the parent component's useEffect.
    console.log("Fetching employers...")
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Employers</h1>
            <p className="text-slate-400 mt-1">Manage all registered employers</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-800 text-white">
              {pagination.total} Total
            </Badge>
            <Button onClick={onAdd} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Employer
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by company name, email, or contact..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchEmployers()}
              className="pl-10 bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <Button onClick={fetchEmployers} className="bg-primary">
            Search
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Company</TableHead>
                <TableHead className="text-slate-400">Contact Person</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Phone</TableHead>
                <TableHead className="text-slate-400">City</TableHead>
                <TableHead className="text-slate-400">Industry</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employers.map((employer) => (
                <TableRow key={employer.id as string} className="border-slate-800">
                  <TableCell className="text-white font-medium">{(employer.company_name as string) || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">{(employer.contact_person as string) || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">{employer.email as string}</TableCell>
                  <TableCell className="text-slate-300">{(employer.mobile_number as string) || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">{(employer.city as string) || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">{(employer.industry_type as string) || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={
                          employer.approval_status === "approved"
                            ? "default"
                            : employer.approval_status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                        className={
                          employer.approval_status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : employer.approval_status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400" // For rejected
                        }
                      >
                        {(employer.approval_status as string)?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                      {employer.otp_verified === false && (
                        <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700 text-slate-400">
                          OTP Pending
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(employer.created_at as string).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                          onClick={() => onEdit(employer)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() =>
                            onDelete(
                              employer.id as string,
                              (employer.company_name as string) || (employer.email as string),
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Pagination page={page} totalPages={pagination.totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  )
}

// Candidates View Component
function CandidatesView({
  candidates,
  pagination,
  page,
  search,
  onPageChange,
  onSearchChange,
  onEdit,
  onDelete,
  onAdd,
}: {
  candidates: Record<string, unknown>[]
  pagination: { total: number; totalPages: number }
  page: number
  search: string
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
  onEdit: (candidate: Record<string, unknown>) => void
  onDelete: (id: string, name: string) => void
  onAdd: () => void
}) {
  // Fetch candidates function needs to be defined or passed down for the search button
  const fetchCandidates = async () => {
    // This is a placeholder. In a real scenario, this would call the API.
    // For this example, we'll assume it's handled in the parent component's useEffect.
    console.log("Fetching candidates...")
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Candidates</h1>
            <p className="text-slate-400 mt-1">Manage all registered candidates</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-slate-800 text-white">
              {pagination.total} Total
            </Badge>
            <Button onClick={onAdd} className="bg-primary">
              {" "}
              {/* Added button */}
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCandidates()}
              className="pl-10 bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <Button onClick={fetchCandidates} className="bg-primary">
            Search
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Phone</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Education</TableHead>
                <TableHead className="text-slate-400">Experience</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id as string} className="border-slate-800">
                  <TableCell className="text-white font-medium">{(candidate.full_name as string) || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">{candidate.email as string}</TableCell>
                  <TableCell className="text-slate-300">{(candidate.mobile_number as string) || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">
                    {(() => {
                      const city = candidate.current_city as string | null | undefined
                      const state = candidate.current_state as string | null | undefined
                      const location = [city, state].filter((v) => v && v.trim()).join(", ")
                      return location || "N/A"
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        candidate.work_status === "fresher"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-blue-500/30 text-blue-400"
                      }
                    >
                      {(candidate.work_status as string) || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {(candidate.highest_qualification as string)?.trim() || "N/A"}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {candidate.total_experience_years ? `${candidate.total_experience_years} yrs` : "Fresher"}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(candidate.created_at as string).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                          onClick={() => onEdit(candidate)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() =>
                            onDelete(
                              candidate.id as string,
                              (candidate.full_name as string) || (candidate.email as string),
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Pagination page={page} totalPages={pagination.totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  )
}

// Jobs View Component
function JobsView({
  jobs,
  pagination,
  page,
  search,
  statusFilter,
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onAdd,
  onSearch,
  onStatusChange,
}: {
  jobs: Record<string, unknown>[]
  pagination: { total: number; totalPages: number }
  page: number
  search: string
  statusFilter: string[]
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
  onStatusFilterChange: (statuses: string[]) => void
  onEdit: (job: Record<string, unknown>) => void
  onDelete: (id: string, name: string) => void
  onAdd: () => void
  onSearch: () => void
  onStatusChange: (jobId: string, status: string) => void
}) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Jobs</h1>
            <p className="text-slate-400 mt-1">Manage all job postings</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-slate-800 text-white">
              {pagination.total} Total
            </Badge>
            <Button onClick={onAdd} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by job title or company..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="pl-10 bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <Button onClick={onSearch} className="bg-primary">
            Search
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Filter by Status:</span>
          {["published", "draft", "closed", "expired"].map((status) => (
            <Button
              key={status}
              variant={statusFilter.includes(status) ? "default" : "outline"}
              className={`text-xs h-7 px-3 ${
                statusFilter.includes(status)
                  ? "bg-primary text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
              }`}
              onClick={() => onStatusFilterChange(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-400">
                {jobs.filter((j) => j.status === status).length}
              </Badge>
            </Button>
          ))}
        </div>
        {/* </CHANGE> */}

        <Card className="bg-slate-900 border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Job Title</TableHead>
                <TableHead className="text-slate-400">Company</TableHead>
                <TableHead className="text-slate-400">Employer Email</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Salary</TableHead>
                <TableHead className="text-slate-400">Applications</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Posted</TableHead>
                <TableHead className="text-slate-400 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id as string} className="border-slate-800">
                    <TableCell className="text-white font-medium">{job.job_title as string}</TableCell>
                    <TableCell className="text-slate-300">{(job.company_name as string) || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{(job.employer_email as string) || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{(job.employment_type as string) || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">
                      {job.min_salary && job.max_salary
                        ? `₹${Number(job.min_salary).toLocaleString()} - ₹${Number(job.max_salary).toLocaleString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-white bg-primary/10">
                        {(job.application_count as number) || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={(job.status as string) || "draft"}
                        onValueChange={(value) => onStatusChange(job.id as string, value)}
                      >
                        <SelectTrigger className="w-28 h-8 bg-slate-800 border-slate-700 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="draft" className="text-white">
                            Draft
                          </SelectItem>
                          <SelectItem value="published" className="text-white">
                            Published
                          </SelectItem>
                          <SelectItem value="closed" className="text-white">
                            Closed
                          </SelectItem>
                          <SelectItem value="expired" className="text-white">
                            Expired
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {new Date(job.created_at as string).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-400">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          {job.status === "draft" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/employer/post-job?edit=${job.id}`}
                                className="text-slate-300 focus:text-white focus:bg-slate-700 block px-2 py-1.5"
                              >
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-slate-300 focus:text-white focus:bg-slate-700"
                            onClick={() => onEdit(job)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => onDelete(job.id as string, job.job_title as string)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Pagination page={page} totalPages={pagination.totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  )
}

// Team View Component
function TeamView({
  team,
  pagination,
  page,
  onPageChange,
  onAddMember,
  onDelete,
}: {
  team: Record<string, unknown>[]
  pagination: { total: number; totalPages: number }
  page: number
  onPageChange: (page: number) => void
  onAddMember: () => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Team</h1>
            <p className="text-slate-400 mt-1">Manage business team members</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-slate-800 text-white">
              {pagination.total} Total
            </Badge>
            <Button onClick={onAddMember} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Last Login</TableHead>
                <TableHead className="text-slate-400 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id as string} className="border-800">
                  <TableCell className="text-white font-medium">{member.fullName as string}</TableCell>
                  <TableCell className="text-slate-300">{member.email as string}</TableCell>
                  <TableCell className="text-slate-300">
                    {(member.role as string).replace("_", " ").toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        member.status === "active"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-red-500/30 text-red-400"
                      }
                    >
                      {member.status as string}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {member.lastLogin ? new Date(member.lastLogin as string).toLocaleString() : "Never logged in"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() => onDelete(member.id as string, member.fullName as string)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Pagination page={page} totalPages={pagination.totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  )
}

// Pagination Component
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        className="border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-50 bg-transparent"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Previous
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={page === p ? "default" : "outline"}
          className={page === p ? "bg-primary text-white" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        className="border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-50 bg-transparent"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  )
}
