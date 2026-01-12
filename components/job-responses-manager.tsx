"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pencil, SlidersHorizontal, ChevronUp } from "lucide-react"
import {
  X,
  ChevronDown,
  GripVertical,
  Briefcase,
  Search,
  User,
  LogOut,
  ChevronRight,
  MoreVertical,
  Mail,
  Forward,
  MessageSquare,
  Send,
} from "lucide-react"
import { getJobApplications, updateApplicationStatus } from "@/app/actions/job-responses-actions"
import { saveColumnPreferences, getColumnPreferences } from "@/app/actions/column-preferences-actions"
import { toast } from "@/components/ui/use-toast" // Import toast
import { calculateCVScoresForJob } from "@/app/actions/cv-scoring-actions" // Import for CV scoring

interface Application {
  id: string
  candidate_id: string
  job_id: string
  status: string
  applied_at: string
  screening_answers?: any
  resume_url?: string
  cv_score?: number | null // Added cv_score field
  candidate: {
    full_name: string
    email: string
    mobile_number: string
    current_job_title?: string
    company_name?: string
    skills_for_role?: string[]
    skills_you_know?: string[]
    preferred_locations: string[]
    preferred_salary: string | null
    annual_salary?: string | null
    notice_period: string | null
    availability_to_join?: string | null
    work_status?: string | null
    total_experience_years: number
    total_experience_months?: number
    current_state?: string // Added current_state
    current_city?: string // Added current_city
    highest_qualification?: string
    course?: string
    highest_education?: string
    education?: string
    industry?: string
    department?: string
    total_experience?: number
    key_skill_score?: number
    designation_score?: number
    call_status?: string
    gender?: string
    diversity?: string
  }
}

interface JobDetails {
  id: string
  title: string
  employer_id: string
  status: string
}

// Define a type for JobApplication to match the expected type from backend
type JobApplication = Application

// Helper functions to fix lint errors
const getDesignation = (candidate: Application["candidate"]): string => {
  return candidate.current_job_title || "Not specified"
}

const getNoticePeriodOrAvailability = (candidate: Application["candidate"]): string => {
  if (candidate.availability_to_join) return candidate.availability_to_join
  if (candidate.notice_period) return candidate.notice_period
  return "Not specified"
}

// Function signature updated to accept jobId and employerId
export function JobResponsesManager({ jobId, employerId }: { jobId: string; employerId: string }) {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [jobDetails, setJobDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all") // State for active tab filter
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showCustomizeColumns, setShowCustomizeColumns] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  const [visibleContacts, setVisibleContacts] = useState<Set<string>>(new Set())
  const [calculatingScores, setCalculatingScores] = useState(false) // State for calculating CV scores
  const [showCVScores, setShowCVScores] = useState(false)

  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const [visibleColumns, setVisibleColumns] = useState({
    candidateName: true,
    designation: true,
    company: true,
    skills: true,
    phone: true,
    location: true,
    noticePeriod: true,
    salary: true,
    status: true,
  })

  const [filters, setFilters] = useState({
    keywords: "",
    searchInSkillsOnly: false,
    states: [] as string[],
    cities: [] as string[],
    customCity: "",
    experience: { min: 0, max: 30 },
    noticePeriod: [] as string[],
    salary: { min: 0, max: 100 },
    education: [] as string[],
    diversity: [] as string[],
    gender: [] as string[],
  })
  const [expandedSections, setExpandedSections] = useState({
    keywords: true,
    location: false,
    experience: false,
    noticePeriod: false,
    salary: false,
    education: false,
    diversity: false,
    gender: false, // Added gender expanded state
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(40)

  const [availableColumns, setAvailableColumns] = useState([
    { key: "candidateName", label: "Candidate Name", selected: true },
    { key: "designation", label: "Designation", selected: true },
    { key: "company", label: "Company Name", selected: true },
    { key: "salary", label: "Salary", selected: true },
    { key: "location", label: "Location", selected: true },
    { key: "exp", label: "Exp", selected: false },
    { key: "noticePeriod", label: "Notice period/ Availability to join", selected: true },
    { key: "skills", label: "Key Skills", selected: true },
    { key: "education", label: "Education", selected: false },
    { key: "preferredLocation", label: "Preferred location", selected: false },
    { key: "industry", label: "Industry", selected: false },
    { key: "department", label: "Department", selected: false },
    { key: "email", label: "Email id", selected: false },
    { key: "applyDate", label: "Apply date", selected: false },
    { key: "phone", label: "Phone Number", selected: true },
    { key: "keySkillScore", label: "Key skill score", selected: false },
    { key: "designationScore", label: "Designation score", selected: false },
    { key: "callStatus", label: "Call Status", selected: false },
    { key: "status", label: "Status", selected: true },
    // Add CV Score column configuration
    { key: "cvScore", label: "CV Score", selected: false },
  ])
  const [columnSearch, setColumnSearch] = useState("")
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  // Column reordering state
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Added top 7 Indian cities list
  const topCities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"]

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    " Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ]

  useEffect(() => {
    loadApplications()
    if (!preferencesLoaded) {
      loadColumnPreferences()
    }
  }, [jobId]) // Removed statusFilter dependency, will use activeTab internally

  const loadApplications = async () => {
    try {
      console.log("[v0] Loading applications for job:", jobId)
      setLoading(true)
      setError(null) // Clear previous errors

      const result = await getJobApplications(jobId)

      console.log("[v0] getJobApplications result:", {
        success: result.success,
        applicationsCount: result.applications?.length,
        jobTitle: result.job?.title,
        error: result.error,
      })

      if (result.success) {
        setApplications(result.applications || [])
        setJobDetails(result.job)
      } else {
        const errorMsg = result.error || "Failed to load applications"
        console.error("[v0] Error loading applications:", errorMsg)
        setError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("[v0] Exception loading applications:", err)
      const errorMsg = err.message || "An unexpected error occurred"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, status: string) => {
    const result = await updateApplicationStatus(applicationId, status)
    if (result.success) {
      loadApplications() // Reload applications to reflect status change
    }
  }

  // Placeholder for handling call status updates, requires an action function if not already defined
  const handleCallStatusUpdate = async (applicationId: string, status: string) => {
    console.log(`Updating call status for ${applicationId} to ${status}`)
    // In a real application, you would call an API to update this status
    // Example:
    // const result = await updateCallStatus(applicationId, status);
    // if (result.success) {
    //   loadApplications();
    // }
    // For now, just update the local state for demonstration
    setApplications((prevApplications) =>
      prevApplications.map((app) =>
        app.id === applicationId ? { ...app, candidate: { ...app.candidate, call_status: status } } : app,
      ),
    )
  }

  const toggleApplicationSelection = (id: string) => {
    setSelectedApplications((prev) => (prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]))
  }

  const toggleAllApplications = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(filteredApplications.map((app) => app.id))
    }
  }

  const formatSalary = (salary: string | null) => {
    if (!salary) return "Not specified"
    const num = Number.parseFloat(salary)
    if (num >= 100) {
      return `₹${(num / 100000).toFixed(2)} LPA`
    }
    return `₹${num} LPA`
  }

  const stats = useMemo(() => {
    const newApplications = applications.filter((app) => app.status === "applied")
    const shortlistedApplications = applications.filter((app) => app.status === "shortlisted")
    const maybeApplications = applications.filter((app) => app.status === "maybe")
    const rejectedApplications = applications.filter((app) => app.status === "rejected")
    return {
      all: applications.length,
      new: newApplications.length,
      shortlisted: shortlistedApplications.length,
      maybe: maybeApplications.length,
      rejected: rejectedApplications.length,
      total: applications.length,
    }
  }, [applications])

  const toggleContactVisibility = (candidateId: string) => {
    setVisibleContacts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId)
      } else {
        newSet.add(candidateId)
      }
      return newSet
    })
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const noticePeriodOptions = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days", "More than 90 Days"]

  const educationOptions = [
    "10th",
    "12th",
    "Diploma",
    "Graduate",
    "Post Graduate",
    "PhD",
    "MBA",
    "B.Tech",
    "M.Tech",
    "BCA",
    "MCA",
    "B.Com",
    "M.Com",
    "BA",
    "MA",
    "BSc",
    "MSc",
  ]

  const diversityOptions = ["Women", "LGBTQ+", "Differently Abled", "Veterans"]

  const genderOptions = ["Male", "Female", "Other"]

  const toggleFilterArrayValue = (filterKey: "noticePeriod" | "education" | "diversity" | "gender", value: string) => {
    setFilters((prev) => {
      const currentValues = prev[filterKey] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [filterKey]: newValues }
    })
  }

  const loadColumnPreferences = async () => {
    try {
      console.log("[v0] Loading column preferences for employer:", employerId, "job:", jobId)
      const storedPreferences = await getColumnPreferences(employerId, jobId)

      if (storedPreferences && storedPreferences.length > 0) {
        console.log("[v0] Found stored preferences:", storedPreferences)

        // Map stored preferences to column objects, preserving their order
        const newAvailableColumns = storedPreferences
          .map((pref: any) => ({
            key: pref.columnKey,
            label: pref.label,
            selected: pref.isSelected,
            order: pref.order,
          }))
          .sort((a, b) => (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY))

        setAvailableColumns(newAvailableColumns)

        const newVisibleColumns: any = {}
        newAvailableColumns.forEach((col) => {
          newVisibleColumns[col.key] = col.selected
        })
        setVisibleColumns(newVisibleColumns)

        console.log("[v0] Applied column preferences with order - columns:", newAvailableColumns)
        setPreferencesLoaded(true)
      } else {
        console.log("[v0] No preferences found, using defaults")
        setPreferencesLoaded(true)
      }
    } catch (error) {
      console.error("[v0] Error loading column preferences:", error)
      setPreferencesLoaded(true)
    }
  }

  const saveColumnPreferencesToDB = async () => {
    try {
      const preferencesToSave = availableColumns.map((col, index) => ({
        columnKey: col.key,
        label: col.label,
        isSelected: col.selected,
        order: col.selected ? index : null, // Only store order for selected columns
      }))
      await saveColumnPreferences(employerId, jobId, preferencesToSave)
      toast({
        title: "Success",
        description: "Column preferences saved.",
      })
    } catch (error) {
      console.error("Error saving column preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save column preferences.",
        variant: "destructive",
      })
    }
  }

  // Handler for calculating CV scores
  const handleCalculateCVScores = async () => {
    try {
      setCalculatingScores(true)
      const result = await calculateCVScoresForJob(jobId)

      if (result.success) {
        toast({
          title: "Success",
          description: `CV scores calculated for ${result.count} candidates`,
        })
        setShowCVScores(true)
        await loadApplications() // Reload to show scores
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to calculate scores",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate scores",
        variant: "destructive",
      })
    } finally {
      setCalculatingScores(false)
    }
  }

  const getCVScoreBadge = (score: number | null) => {
    if (score === null || score === undefined) return null

    let colorClass = ""
    if (score >= 80) colorClass = "bg-green-100 text-green-700 border-green-300"
    else if (score >= 60) colorClass = "bg-yellow-100 text-yellow-700 border-yellow-300"
    else if (score >= 40) colorClass = "bg-orange-100 text-orange-700 border-orange-300"
    else colorClass = "bg-red-100 text-red-700 border-red-300"

    return (
      <Badge className={`${colorClass} font-semibold text-sm`} variant="outline">
        {Math.round(score)}%
      </Badge>
    )
  }

  const filteredApplications = useMemo(() => {
    let result = [...applications]

    if (applications.length > 0) {
      console.log("[v0] First application candidate data:", JSON.stringify(applications[0].candidate, null, 2))
      console.log("[v0] Current filters:", JSON.stringify(filters, null, 2))
    }

    // Filter by active tab
    if (activeTab !== "all") {
      result = result.filter((app) => app.status.toLowerCase() === activeTab.toLowerCase())
    }

    // Filter by keywords - search in skills_for_role and skills_you_know
    if (filters.keywords.trim()) {
      const keyword = filters.keywords.toLowerCase()
      console.log("[v0] Filtering by keyword:", keyword)
      result = result.filter((app) => {
        const skillsForRole = Array.isArray(app.candidate?.skills_for_role) ? app.candidate.skills_for_role : []
        const skillsYouKnow = Array.isArray(app.candidate?.skills_you_know) ? app.candidate.skills_you_know : []
        console.log("[v0] Candidate skills_for_role:", skillsForRole)
        console.log("[v0] Candidate skills_you_know:", skillsYouKnow)

        if (filters.searchInSkillsOnly) {
          // Search only in skills
          return (
            skillsForRole.some((skill: string) => skill?.toLowerCase().includes(keyword)) ||
            skillsYouKnow.some((skill: string) => skill?.toLowerCase().includes(keyword))
          )
        }
        // Search in name, email, job title, company, and skills
        return (
          app.candidate?.full_name?.toLowerCase().includes(keyword) ||
          app.candidate?.email?.toLowerCase().includes(keyword) ||
          app.candidate?.current_job_title?.toLowerCase().includes(keyword) ||
          app.candidate?.company_name?.toLowerCase().includes(keyword) ||
          skillsForRole.some((skill: string) => skill?.toLowerCase().includes(keyword)) ||
          skillsYouKnow.some((skill: string) => skill?.toLowerCase().includes(keyword))
        )
      })
      console.log("[v0] After keyword filter, results:", result.length)
    }

    // Filter by location (State and City) - use CURRENT location, not preferred
    if (filters.states.length > 0 || filters.cities.length > 0 || filters.customCity) {
      result = result.filter((app) => {
        const candidateState = app.candidate?.current_state?.toLowerCase() || ""
        const candidateCity = app.candidate?.current_city?.toLowerCase() || ""
        const preferredLocations = app.candidate?.preferred_locations || []

        // Check states
        let stateMatch = filters.states.length === 0
        if (filters.states.length > 0) {
          stateMatch = filters.states.some(
            (state) =>
              candidateState.includes(state.toLowerCase()) ||
              preferredLocations.some(
                (loc: string) => typeof loc === "string" && loc.toLowerCase().includes(state.toLowerCase()),
              ),
          )
        }

        // Check cities (top 7 + custom)
        let cityMatch = filters.cities.length === 0 && !filters.customCity
        if (filters.cities.length > 0) {
          cityMatch = filters.cities.some(
            (city) =>
              candidateCity.includes(city.toLowerCase()) ||
              preferredLocations.some(
                (loc: string) => typeof loc === "string" && loc.toLowerCase().includes(city.toLowerCase()),
              ),
          )
        }

        // Check custom city
        if (filters.customCity && !cityMatch) {
          const customCityLower = filters.customCity.toLowerCase()
          cityMatch =
            candidateCity.includes(customCityLower) ||
            preferredLocations.some(
              (loc: string) => typeof loc === "string" && loc.toLowerCase().includes(customCityLower),
            )
        }

        return stateMatch && cityMatch
      })
    }

    // Filter by experience range
    if (filters.experience.min > 0 || filters.experience.max < 30) {
      console.log("[v0] Filtering by experience:", filters.experience)
      result = result.filter((app) => {
        const expYears = app.candidate?.total_experience_years || 0
        const expMonths = app.candidate?.total_experience_months || 0
        const totalExp = expYears + expMonths / 12
        console.log("[v0] Candidate experience:", { expYears, expMonths, totalExp })
        return totalExp >= filters.experience.min && totalExp <= filters.experience.max
      })
      console.log("[v0] After experience filter, results:", result.length)
    }

    // Filter by notice period
    if (filters.noticePeriod.length > 0) {
      console.log("[v0] Filtering by notice period:", filters.noticePeriod)
      result = result.filter((app) => {
        const candidateNotice = app.candidate?.notice_period?.toLowerCase() || ""
        console.log("[v0] Candidate notice period:", candidateNotice)
        return filters.noticePeriod.some((period) => {
          const periodLower = period.toLowerCase()
          if (periodLower === "immediate" || periodLower === "immediately joining") {
            return (
              candidateNotice.includes("immediate") || candidateNotice === "0" || candidateNotice.includes("currently")
            )
          }
          if (periodLower === "15 days") {
            return candidateNotice.includes("15") || candidateNotice.includes("2 week")
          }
          if (periodLower === "30 days" || periodLower === "1 month") {
            return (
              candidateNotice.includes("30") ||
              candidateNotice.includes("1 month") ||
              candidateNotice.includes("one month")
            )
          }
          if (periodLower === "45 days") {
            return candidateNotice.includes("45")
          }
          if (periodLower === "60 days" || periodLower === "2 months") {
            return (
              candidateNotice.includes("60") ||
              candidateNotice.includes("2 month") ||
              candidateNotice.includes("two month")
            )
          }
          if (periodLower === "90 days" || periodLower === "3 months") {
            return (
              candidateNotice.includes("90") ||
              candidateNotice.includes("3 month") ||
              candidateNotice.includes("three month")
            )
          }
          if (periodLower === "more than 90 days") {
            // Check if notice period is greater than 90 days
            const noticeNumber = Number.parseInt(candidateNotice.replace(/\D/g, ""), 10)
            return noticeNumber > 90
          }
          return candidateNotice.includes(periodLower)
        })
      })
      console.log("[v0] After notice period filter, results:", result.length)
    }

    // Filter by salary range
    if (filters.salary.min > 0 || filters.salary.max < 100) {
      console.log("[v0] Filtering by salary:", filters.salary)
      result = result.filter((app) => {
        // Check both annual_salary and preferred_salary fields
        const annualSalary = app.candidate?.annual_salary || ""
        const preferredSalary = app.candidate?.preferred_salary || ""
        console.log("[v0] Candidate annual_salary:", annualSalary)
        console.log("[v0] Candidate preferred_salary:", preferredSalary)

        // Parse salary value - handle various formats like "10 LPA", "1000000", "10,00,000"
        const parseSalary = (salaryStr: string): number => {
          if (!salaryStr) return 0
          const cleanStr = salaryStr.toString().toLowerCase().replace(/,/g, "")
          // Check for LPA format
          if (cleanStr.includes("lpa") || cleanStr.includes("lac") || cleanStr.includes("lakh")) {
            const num = Number.parseFloat(cleanStr.replace(/[^0-9.]/g, ""))
            return num // Already in LPA
          }
          // Assume it's in actual amount, convert to LPA
          const num = Number.parseFloat(cleanStr.replace(/[^0-9.]/g, ""))
          if (num > 10000) {
            return num / 100000 // Convert to LPA
          }
          return num
        }

        const salaryInLPA = Math.max(parseSalary(annualSalary), parseSalary(preferredSalary))
        console.log("[v0] Parsed salary in LPA:", salaryInLPA)
        return salaryInLPA >= filters.salary.min && salaryInLPA <= filters.salary.max
      })
      console.log("[v0] After salary filter, results:", result.length)
    }

    // Filter by education
    if (filters.education.length > 0) {
      console.log("[v0] Filtering by education:", filters.education)
      result = result.filter((app) => {
        const qualification = app.candidate?.highest_qualification?.toLowerCase() || ""
        const course = app.candidate?.course?.toLowerCase() || ""
        console.log("[v0] Candidate qualification:", qualification, "course:", course)

        return filters.education.some((edu) => {
          const eduLower = edu.toLowerCase()
          // Check various education formats
          if (eduLower === "10th" || eduLower === "ssc") {
            return qualification.includes("10") || qualification.includes("ssc") || qualification.includes("matric")
          }
          if (eduLower === "12th" || eduLower === "hsc" || eduLower === "intermediate") {
            return (
              qualification.includes("12") ||
              qualification.includes("hsc") ||
              qualification.includes("intermediate") ||
              qualification.includes("puc")
            )
          }
          if (eduLower === "diploma") {
            return qualification.includes("diploma") || course.includes("diploma")
          }
          if (eduLower === "graduate" || eduLower === "graduation") {
            return (
              qualification.includes("graduate") ||
              qualification.includes("graduation") ||
              qualification.includes("bachelor") ||
              course.includes("b.tech") ||
              course.includes("b.e") ||
              course.includes("bca") ||
              course.includes("bsc") ||
              course.includes("bcom") ||
              course.includes("ba")
            )
          }
          if (eduLower === "b.tech" || eduLower === "be" || eduLower === "b.e") {
            return (
              course.includes("b.tech") ||
              course.includes("b.e.") ||
              course.includes("b.e/") ||
              course.includes("btech") ||
              course.includes("engineering")
            )
          }
          if (eduLower === "bca") {
            return course.includes("bca")
          }
          if (eduLower === "mca") {
            return course.includes("mca")
          }
          if (eduLower === "b.com" || eduLower === "bcom") {
            return course.includes("b.com") || course.includes("bcom") || course.includes("commerce")
          }
          if (eduLower === "m.com" || eduLower === "mcom") {
            return course.includes("m.com") || course.includes("mcom")
          }
          if (eduLower === "ba") {
            return course.includes("ba") || course.includes("arts")
          }
          if (eduLower === "ma") {
            return course.includes("ma") || course.includes("master of arts")
          }
          if (eduLower === "bsc") {
            return course.includes("bsc") || course.includes("b.sc") || course.includes("science")
          }
          if (eduLower === "msc") {
            return course.includes("msc") || course.includes("m.sc")
          }
          if (eduLower === "mba") {
            return qualification.includes("mba") || course.includes("mba")
          }
          if (eduLower === "m.tech" || eduLower === "me" || eduLower === "m.e") {
            return (
              qualification.includes("m.tech") ||
              qualification.includes("mtech") ||
              qualification.includes("m.e") ||
              course.includes("m.tech")
            )
          }
          if (eduLower === "post graduate" || eduLower === "pg" || eduLower === "masters") {
            return (
              qualification.includes("post") ||
              qualification.includes("master") ||
              qualification.includes("pg") ||
              course.includes("mba") ||
              course.includes("mca") ||
              course.includes("m.tech") ||
              course.includes("msc") ||
              course.includes("mcom")
            )
          }
          if (eduLower === "phd" || eduLower === "doctorate") {
            return qualification.includes("phd") || qualification.includes("doctor")
          }
          return qualification.includes(eduLower) || course.includes(eduLower)
        })
      })
      console.log("[v0] After education filter, results:", result.length)
    }

    // Filter by gender
    if (filters.gender.length > 0) {
      console.log("[v0] Filtering by gender:", filters.gender)
      result = result.filter((app) => {
        const candidateGender = app.candidate?.gender?.toLowerCase().trim() || ""
        console.log("[v0] Candidate gender:", candidateGender)
        // Use exact match instead of includes to avoid "female".includes("male") = true
        return filters.gender.some((gen) => candidateGender === gen.toLowerCase().trim())
      })
      console.log("[v0] After gender filter, results:", result.length)
    }

    // Filter by diversity (this field may not exist in DB yet, keeping for future use)
    if (filters.diversity.length > 0) {
      console.log("[v0] Filtering by diversity:", filters.diversity)
      // Skip diversity filter if no diversity field exists
      // This can be implemented when diversity data is added to the database
    }

    return result
  }, [applications, activeTab, filters])

  const activeFiltersCount =
    (filters.keywords ? 1 : 0) +
    filters.states.length +
    filters.cities.length +
    (filters.customCity ? 1 : 0) +
    (filters.experience.min > 0 || filters.experience.max < 30 ? 1 : 0) +
    filters.noticePeriod.length +
    (filters.salary.min > 0 || filters.salary.max < 100 ? 1 : 0) +
    filters.education.length +
    filters.diversity.length +
    filters.gender.length

  const clearAllFilters = () => {
    setFilters({
      keywords: "",
      searchInSkillsOnly: false,
      states: [],
      cities: [],
      customCity: "",
      experience: { min: 0, max: 30 },
      noticePeriod: [],
      salary: { min: 0, max: 100 },
      education: [],
      diversity: [],
      gender: [],
    })
  }

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex)

  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault()
    if (draggedColumn && draggedColumn !== columnKey) {
      setDragOverColumn(columnKey)
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    setAvailableColumns((prev) => {
      const newColumns = [...prev]
      const draggedIndex = newColumns.findIndex((col) => col.key === draggedColumn)
      const targetIndex = newColumns.findIndex((col) => col.key === targetColumnKey)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedItem] = newColumns.splice(draggedIndex, 1)
        newColumns.splice(targetIndex, 0, draggedItem)
      }

      return newColumns
    })

    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const moveColumnUp = (columnKey: string) => {
    setAvailableColumns((prev) => {
      const selectedColumns = prev.filter((col) => col.selected)
      const currentIndex = selectedColumns.findIndex((col) => col.key === columnKey)

      if (currentIndex <= 0) return prev

      const newColumns = [...prev]
      const actualCurrentIndex = newColumns.findIndex((col) => col.key === columnKey)
      const prevSelectedKey = selectedColumns[currentIndex - 1].key
      const actualPrevIndex = newColumns.findIndex((col) => col.key === prevSelectedKey)

      const [item] = newColumns.splice(actualCurrentIndex, 1)
      newColumns.splice(actualPrevIndex, 0, item)

      return newColumns
    })
  }

  const moveColumnDown = (columnKey: string) => {
    setAvailableColumns((prev) => {
      const selectedColumns = prev.filter((col) => col.selected)
      const currentIndex = selectedColumns.findIndex((col) => col.key === columnKey)

      if (currentIndex >= selectedColumns.length - 1) return prev

      const newColumns = [...prev]
      const actualCurrentIndex = newColumns.findIndex((col) => col.key === columnKey)
      const nextSelectedKey = selectedColumns[currentIndex + 1].key
      const actualNextIndex = newColumns.findIndex((col) => col.key === nextSelectedKey)

      const [item] = newColumns.splice(actualCurrentIndex, 1)
      newColumns.splice(actualNextIndex, 0, item)

      return newColumns
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading job responses...</p>
          <p className="text-xs text-muted-foreground mt-2">Job ID: {jobId}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Responses</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-xs text-muted-foreground mb-4">Job ID: {jobId}</p>
          <Button onClick={loadApplications}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-8">
              <Link href="/employer/dashboard" className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Briefcase className="h-3 md:h-4 w-3 md:w-4 text-white" />
                  <span className="text-xs md:text-base font-bold text-white">JobKarle</span>
                </div>
              </Link>

              <nav className="hidden sm:flex items-center gap-1">
                <div className="relative">
                  <button className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-t-md transition-colors">
                    Jobs & Responses
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-16 sm:w-32 md:w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 md:pl-10 pr-2 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="p-1.5 hover:bg-gray-100 rounded-full"
                  aria-label="Profile menu"
                >
                  <User className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/employer/dashboard"
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {}} // Add logout handler
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t">
          <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm overflow-x-auto">
                <Link
                  href="/employer/dashboard"
                  className="text-blue-600 hover:underline font-medium whitespace-nowrap"
                >
                  All Jobs
                </Link>
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900 font-medium truncate">{jobDetails?.title || "Loading..."}</span>
                {jobDetails?.status && (
                  <Badge
                    className={`ml-1 md:ml-2 text-xs flex-shrink-0 ${
                      jobDetails.status === "published"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                    variant="outline"
                  >
                    {jobDetails.status === "published" ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm text-blue-600 border-blue-600 bg-transparent max-w-[120px] sm:w-auto"
                onClick={() => {
                  window.location.href = `/employer/edit-job/${jobId}`
                }}
              >
                <Pencil className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Edit Job
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Sidebar */}
      {showFilters && <div className="fixed inset-0 bg-transparent z-40" onClick={() => setShowFilters(false)} />}

      <div
        className={`fixed left-0 top-0 h-full w-full sm:w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 overflow-y-auto ${
          showFilters ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            {/* Updated Filters Sidebar header with active filter count */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Filters</h2>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[#0277bd] text-white rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Clear All Filters button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="w-full mb-4 py-2 text-sm text-[#0277bd] hover:bg-blue-50 rounded border border-[#0277bd]"
            >
              Clear All Filters
            </button>
          )}

          {/* Keywords */}
          <div className="mb-4 border-b pb-4">
            <button
              onClick={() => toggleSection("keywords")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Keywords {filters.keywords && <span className="text-[#0277bd]">*</span>}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.keywords ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.keywords && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Search keywords in profile"
                  value={filters.keywords}
                  onChange={(e) => setFilters((prev) => ({ ...prev, keywords: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0277bd]"
                />
                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                  <Checkbox
                    checked={filters.searchInSkillsOnly}
                    onCheckedChange={(checked) =>
                      setFilters((prev) => ({ ...prev, searchInSkillsOnly: checked === true }))
                    }
                  />
                  <span className="ml-2">Search in key skills only</span>
                </label>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="mb-4 border-b pb-4">
            <button
              onClick={() => toggleSection("location")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Location{" "}
                {(filters.states.length > 0 || filters.cities.length > 0 || filters.customCity) && (
                  <span className="text-[#0277bd]">*</span>
                )}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.location ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.location && (
              <div className="mt-3 space-y-3">
                {/* State selection */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">State</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
                    {indianStates.map((state) => (
                      <label
                        key={state}
                        className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <Checkbox
                          checked={filters.states.includes(state)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({ ...prev, states: [...prev.states, state] }))
                            } else {
                              setFilters((prev) => ({ ...prev, states: prev.states.filter((s) => s !== state) }))
                            }
                          }}
                        />
                        <span className="ml-2">{state}</span>
                      </label>
                    ))}
                  </div>
                  {filters.states.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {filters.states.map((state) => (
                        <span
                          key={state}
                          className="inline-flex items-center px-2 py-0.5 text-xs bg-[#0277bd]/10 text-[#0277bd] rounded"
                        >
                          {state}
                          <button
                            onClick={() =>
                              setFilters((prev) => ({ ...prev, states: prev.states.filter((s) => s !== state) }))
                            }
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* City selection */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Cities</label>
                  <div className="space-y-2">
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
                      {/* Use topCities for selection */}
                      {topCities.map((city) => (
                        <label
                          key={city}
                          className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <Checkbox
                            checked={filters.cities.includes(city)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters((prev) => ({ ...prev, cities: [...prev.cities, city] }))
                              } else {
                                setFilters((prev) => ({ ...prev, cities: prev.cities.filter((c) => c !== city) }))
                              }
                            }}
                          />
                          <span className="ml-2">{city}</span>
                        </label>
                      ))}
                      <input
                        type="text"
                        placeholder="Add custom city..."
                        value={filters.customCity}
                        onChange={(e) => setFilters((prev) => ({ ...prev, customCity: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && filters.customCity.trim()) {
                            // Ensure custom city is not already in the list
                            if (!filters.cities.includes(filters.customCity.trim())) {
                              setFilters((prev) => ({
                                ...prev,
                                cities: [...prev.cities, prev.customCity.trim()],
                                customCity: "",
                              }))
                            }
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0277bd]"
                      />
                    </div>
                    {(filters.cities.length > 0 || filters.customCity) && (
                      <div className="flex flex-wrap gap-1">
                        {filters.cities.map((city) => (
                          <span
                            key={city}
                            className="inline-flex items-center px-2 py-0.5 text-xs bg-[#0277bd]/10 text-[#0277bd] rounded"
                          >
                            {city}
                            <button
                              onClick={() =>
                                setFilters((prev) => ({ ...prev, cities: prev.cities.filter((c) => c !== city) }))
                              }
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {filters.customCity.trim() && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs bg-[#0277bd]/10 text-[#0277bd] rounded">
                            {filters.customCity.trim()}
                            <button
                              onClick={() => setFilters((prev) => ({ ...prev, customCity: "" }))}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="mb-4 border-b pb-4">
            <button
              onClick={() => toggleSection("experience")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Experience{" "}
                {(filters.experience.min > 0 || filters.experience.max < 30) && (
                  <span className="text-[#0277bd]">*</span>
                )}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.experience ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.experience && (
              <div className="mt-3 space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{filters.experience.min} years</span>
                  <span>{filters.experience.max}+ years</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Min Experience</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={filters.experience.min}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          experience: { ...prev.experience, min: Number.parseInt(e.target.value) },
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0277bd]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Max Experience</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={filters.experience.max}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          experience: { ...prev.experience, max: Number.parseInt(e.target.value) },
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0277bd]"
                    />
                  </div>
                </div>
              </div>
            )}
            {!expandedSections.experience && (filters.experience.min > 0 || filters.experience.max < 30) && (
              <p className="text-xs text-[#0277bd] mt-1">
                {filters.experience.min} - {filters.experience.max}+ years
              </p>
            )}
          </div>

          {/* Notice Period */}
          <div className="mb-4 border-b pb-4">
            <button
              onClick={() => toggleSection("noticePeriod")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Notice Period{" "}
                {filters.noticePeriod.length > 0 && (
                  <span className="text-[#0277bd]">({filters.noticePeriod.length})</span>
                )}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  expandedSections.noticePeriod ? "" : "-rotate-90"
                }`}
              />
            </button>
            {expandedSections.noticePeriod && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {noticePeriodOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.noticePeriod.includes(option)}
                      onCheckedChange={() => toggleFilterArrayValue("noticePeriod", option)}
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            )}
            {!expandedSections.noticePeriod && filters.noticePeriod.length > 0 && (
              <p className="text-xs text-[#0277bd] mt-1">{filters.noticePeriod.join(", ")}</p>
            )}
          </div>

          {/* Salary */}
          <div className="mb-4 border-b pb-4">
            <button
              onClick={() => toggleSection("salary")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Salary{" "}
                {(filters.salary.min > 0 || filters.salary.max < 100) && <span className="text-[#0277bd]">*</span>}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.salary ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.salary && (
              <div className="mt-3 space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{filters.salary.min} LPA</span>
                  <span>{filters.salary.max}+ LPA</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Min Salary</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.salary.min}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, min: Number.parseInt(e.target.value) },
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0277bd]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Max Salary</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.salary.max}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, max: Number.parseInt(e.target.value) },
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0277bd]"
                    />
                  </div>
                </div>
              </div>
            )}
            {!expandedSections.salary && (filters.salary.min > 0 || filters.salary.max < 100) && (
              <p className="text-xs text-[#0277bd] mt-1">
                {filters.salary.min} - {filters.salary.max}+ LPA
              </p>
            )}
          </div>

          {/* Education */}
          <div className="mb-4 border-b pb-4">
            <button
              onClick={() => toggleSection("education")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Education{" "}
                {filters.education.length > 0 && <span className="text-[#0277bd]">({filters.education.length})</span>}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.education ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.education && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {educationOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.education.includes(option)}
                      onCheckedChange={() => toggleFilterArrayValue("education", option)}
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            )}
            {!expandedSections.education && filters.education.length > 0 && (
              <p className="text-xs text-[#0277bd] mt-1">
                {filters.education.slice(0, 2).join(", ")}
                {filters.education.length > 2 && ` +${filters.education.length - 2}`}
              </p>
            )}
          </div>

          {/* Diversity */}
          <div className="mb-4 border-b pb-4">
            <button
              onClick={() => toggleSection("diversity")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Diversity{" "}
                {filters.diversity.length > 0 && <span className="text-[#0277bd]">({filters.diversity.length})</span>}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.diversity ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.diversity && (
              <div className="mt-3 space-y-2">
                {diversityOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.diversity.includes(option)}
                      onCheckedChange={() => toggleFilterArrayValue("diversity", option)}
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Gender */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("gender")}
              className="flex items-center justify-between w-full text-left py-2"
            >
              <span className="text-sm font-semibold text-gray-900">
                Gender {filters.gender.length > 0 && <span className="text-[#0277bd]">({filters.gender.length})</span>}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections.gender ? "" : "-rotate-90"}`}
              />
            </button>
            {expandedSections.gender && (
              <div className="mt-3 space-y-2">
                {genderOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.gender.includes(option)}
                      onCheckedChange={() => toggleFilterArrayValue("gender", option)}
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Apply Filters Button */}
          <div className="sticky bottom-0 bg-white pt-4 border-t mt-4">
            <button
              onClick={() => setShowFilters(false)}
              className="w-full py-3 bg-[#0277bd] text-white rounded-lg font-medium hover:bg-[#01579b] transition-colors"
            >
              Apply Filters ({filteredApplications.length} results)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex overflow-x-auto border-b border-gray-200 gap-0.5 md:gap-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-2 md:py-3 px-2 md:px-4 border-b-2 transition-colors whitespace-nowrap text-[10px] sm:text-sm md:text-base ${
                activeTab === "all"
                  ? "border-red-500 text-gray-900 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              All responses <span className="ml-0.5 md:ml-1">({stats.total})</span>
            </button>
            <button
              onClick={() => setActiveTab("applied")}
              className={`py-2 md:py-3 px-2 md:px-4 border-b-2 transition-colors whitespace-nowrap text-[10px] sm:text-sm md:text-base ${
                activeTab === "applied"
                  ? "border-red-500 text-gray-900 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              New responses <span className="ml-0.5 md:ml-1">({stats.new})</span>
            </button>
            <button
              onClick={() => setActiveTab("shortlisted")}
              className={`py-2 md:py-3 px-2 md:px-4 border-b-2 transition-colors whitespace-nowrap text-[10px] sm:text-sm md:text-base ${
                activeTab === "shortlisted"
                  ? "border-red-500 text-gray-900 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Shortlisted <span className="ml-0.5 md:ml-1">({stats.shortlisted})</span>
            </button>
            <button
              onClick={() => setActiveTab("maybe")}
              className={`py-2 md:py-3 px-2 md:px-4 border-b-2 transition-colors whitespace-nowrap text-[10px] sm:text-sm md:text-base ${
                activeTab === "maybe"
                  ? "border-red-500 text-gray-900 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Maybe <span className="ml-0.5 md:ml-1">({stats.maybe})</span>
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`py-2 md:py-3 px-2 md:px-4 border-b-2 transition-colors whitespace-nowrap text-[10px] sm:text-sm md:text-base ${
                activeTab === "rejected"
                  ? "border-red-500 text-gray-900 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Rejected <span className="ml-0.5 md:ml-1">({stats.rejected})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs md:text-sm"
              >
                <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalculateCVScores}
                disabled={calculatingScores}
                className="text-xs md:text-sm bg-transparent"
              >
                {calculatingScores ? "Calculating..." : "Calculate CV Scores"}
              </Button>
              <span className="text-xs md:text-sm text-gray-600">
                Showing {filteredApplications.length} response{filteredApplications.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-32 h-8 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomizeColumns(true)}
                className="text-xs md:text-sm whitespace-nowrap"
              >
                <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Customize columns
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* Desktop table view */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <Checkbox
                        checked={
                          selectedApplications.length === filteredApplications.length && filteredApplications.length > 0
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedApplications(filteredApplications.map((app) => app.id))
                          } else {
                            setSelectedApplications([])
                          }
                        }}
                      />
                    </th>
                    {showCVScores && <th className="px-4 py-3 font-medium">CV Score</th>}
                    <th className="px-4 py-3 font-medium">Candidate Name</th>
                    <th className="px-4 py-3 font-medium">Designation</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Key Skills</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Notice Period/Availability</th>
                    <th className="px-4 py-3 font-medium">Salary</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedApplications.includes(app.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedApplications([...selectedApplications, app.id])
                            } else {
                              setSelectedApplications(selectedApplications.filter((id) => id !== app.id))
                            }
                          }}
                        />
                      </td>
                      {showCVScores && <td className="px-4 py-3">{getCVScoreBadge(app.cv_score)}</td>}
                      <td className="px-4 py-3">
                        <Link
                          href={`/employer/candidate-profile/${app.candidate_id}?jobId=${jobId}&jobTitle=${encodeURIComponent(jobDetails?.title || "")}&applicationId=${app.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors break-words"
                        >
                          {app.candidate.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 break-words">{getDesignation(app.candidate)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 break-words">
                          {app.candidate.company_name || "Not mentioned"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 break-words">
                          {app.candidate.skills_for_role?.slice(0, 3).join(", ") || "Not mentioned"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {visibleContacts.has(app.candidate_id) ? (
                          <span className="text-sm text-gray-900 font-mono">{app.candidate.mobile_number}</span>
                        ) : (
                          <button
                            onClick={() => toggleContactVisibility(app.candidate_id)}
                            className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-300 transition-colors"
                          >
                            Show contact
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 break-words">
                          {app.candidate.current_city && app.candidate.current_state
                            ? `${app.candidate.current_city}, ${app.candidate.current_state}`
                            : app.candidate.current_city || app.candidate.current_state || "Not mentioned"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 break-words">
                          {getNoticePeriodOrAvailability(app.candidate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 break-words">
                          {formatSalary(app.candidate.preferred_salary)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={app.status || "applied"}
                          onValueChange={(value) => handleStatusUpdate(app.id, value)}
                        >
                          <SelectTrigger
                            className={`w-auto min-w-[120px] h-8 text-xs border ${
                              app.status === "shortlisted"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : app.status === "rejected"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : app.status === "maybe"
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                    : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}
                          >
                            <SelectValue>
                              {app.status === "applied"
                                ? "Select"
                                : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applied" className="text-blue-700">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Select
                              </span>
                            </SelectItem>
                            <SelectItem value="shortlisted" className="text-green-700">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Shortlisted
                              </span>
                            </SelectItem>
                            <SelectItem value="maybe" className="text-yellow-700">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                Maybe
                              </span>
                            </SelectItem>
                            <SelectItem value="rejected" className="text-red-700">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Rejected
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `mailto:${app.candidate.email}`
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedApplication(app)
                                setShowForwardModal(true)
                              }}
                            >
                              <Forward className="h-4 w-4 mr-2" />
                              Forward
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Ensure mobile_number is valid before constructing the URL
                                const phoneNumber = app.candidate.mobile_number?.replace(/\D/g, "")
                                if (phoneNumber) {
                                  window.open(`https://wa.me/${phoneNumber}`, "_blank")
                                } else {
                                  alert("Candidate has no valid phone number for WhatsApp.")
                                }
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {paginatedApplications.map((app) => (
                <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedApplications.includes(app.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedApplications([...selectedApplications, app.id])
                          } else {
                            setSelectedApplications(selectedApplications.filter((id) => id !== app.id))
                          }
                        }}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 break-words">{app.candidate.full_name}</h3>
                        <p className="text-xs text-gray-600 break-words">{getDesignation(app.candidate)}</p>
                        {app.cv_score !== null && app.cv_score !== undefined && (
                          <div className="mt-1">{getCVScoreBadge(app.cv_score)}</div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            window.location.href = `mailto:${app.candidate.email}`
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedApplication(app)
                            setShowForwardModal(true)
                          }}
                        >
                          <Forward className="h-4 w-4 mr-2" />
                          Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const phoneNumber = app.candidate.mobile_number?.replace(/\D/g, "")
                            if (phoneNumber) {
                              window.open(`https://wa.me/${phoneNumber}`, "_blank")
                            } else {
                              alert("Candidate has no valid phone number for WhatsApp.")
                            }
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-xs">
                    {app.candidate.company_name && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium flex-shrink-0">Company:</span>
                        <span className="text-gray-900 break-words flex-1">{app.candidate.company_name}</span>
                      </div>
                    )}
                    {app.candidate.skills_for_role && app.candidate.skills_for_role.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium flex-shrink-0">Skills:</span>
                        <span className="text-gray-900 break-words flex-1">
                          {app.candidate.skills_for_role.slice(0, 3).join(", ")}
                        </span>
                      </div>
                    )}
                    {(app.candidate.current_city || app.candidate.current_state) && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium flex-shrink-0">Location:</span>
                        <span className="text-gray-900 break-words flex-1">
                          {app.candidate.current_city && app.candidate.current_state
                            ? `${app.candidate.current_city}, ${app.candidate.current_state}`
                            : app.candidate.current_city || app.candidate.current_state}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 font-medium flex-shrink-0">Notice Period:</span>
                      <span className="text-gray-900 break-words flex-1">
                        {getNoticePeriodOrAvailability(app.candidate)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 font-medium flex-shrink-0">Salary:</span>
                      <span className="text-gray-900 break-words flex-1">
                        {formatSalary(app.candidate.preferred_salary)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 font-medium flex-shrink-0">Phone:</span>
                      <div className="flex-1">
                        {visibleContacts.has(app.candidate_id) ? (
                          <span className="text-gray-900 font-mono">{app.candidate.mobile_number}</span>
                        ) : (
                          <button
                            onClick={() => toggleContactVisibility(app.candidate_id)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-300 transition-colors"
                          >
                            Show contact
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Status:</span>
                      <Select
                        value={app.status || "applied"}
                        onValueChange={(value) => handleStatusUpdate(app.id, value)}
                      >
                        <SelectTrigger
                          className={`flex-1 h-8 text-xs border ${
                            app.status === "shortlisted"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : app.status === "rejected"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : app.status === "maybe"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          <SelectValue>
                            {app.status === "applied"
                              ? "Select"
                              : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Select</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="maybe">Maybe</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm text-gray-600">
            <div className="text-center sm:text-left">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of {filteredApplications.length}{" "}
              responses
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 px-2 md:px-3 text-xs"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2 md:px-3 text-xs"
              >
                Previous
              </Button>
              <span className="text-xs md:text-sm whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2 md:px-3 text-xs"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 px-2 md:px-3 text-xs"
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Forward mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="to">To:</Label>
              <Input id="to" placeholder="Enter comma separated email ids" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="subject">Subject:</Label>
              <Input id="subject" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="message">Message:</Label>
              <Textarea id="message" rows={6} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForwardModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowForwardModal(false)}>
              <Send className="h-4 w-4 mr-2" />
              Forward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customize Columns Sidebar */}
      {showCustomizeColumns && (
        <div className="fixed inset-0 bg-transparent z-40" onClick={() => setShowCustomizeColumns(false)} />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 overflow-y-auto ${
          showCustomizeColumns ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Customize Columns</h2>
            <button onClick={() => setShowCustomizeColumns(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search columns..."
              value={columnSearch}
              onChange={(e) => setColumnSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0277bd]"
            />
          </div>

          {/* Available Columns */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Columns</h3>
            <div className="space-y-2">
              {availableColumns
                .filter((col) => col.label.toLowerCase().includes(columnSearch.toLowerCase()))
                .map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <Checkbox
                      checked={column.selected}
                      onCheckedChange={(checked) => {
                        setAvailableColumns((prev) =>
                          prev.map((col) => (col.key === column.key ? { ...col, selected: checked === true } : col)),
                        )
                      }}
                    />
                    <span className="text-sm text-gray-700 break-words">{column.label}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Selected Columns */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Selected Columns (drag to reorder)</h3>
            <div className="space-y-2">
              {availableColumns
                .filter((col) => col.selected)
                .map((column, index, selectedArr) => (
                  <div
                    key={column.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, column.key)}
                    onDragOver={(e) => handleDragOver(e, column.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.key)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 sm:gap-3 p-2 bg-gray-50 rounded border transition-all ${
                      dragOverColumn === column.key
                        ? "border-[#0277bd] bg-blue-50"
                        : draggedColumn === column.key
                          ? "opacity-50 border-gray-300"
                          : "border-gray-200"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 break-words min-w-0">{column.label}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => moveColumnUp(column.key)}
                        disabled={index === 0}
                        className={`p-1 rounded ${index === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-200"}`}
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveColumnDown(column.key)}
                        disabled={index === selectedArr.length - 1}
                        className={`p-1 rounded ${index === selectedArr.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-200"}`}
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setAvailableColumns((prev) =>
                          prev.map((col) => (col.key === column.key ? { ...col, selected: false } : col)),
                        )
                      }}
                      className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCustomizeColumns(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const newVisibleColumns: any = {}
                availableColumns.forEach((col) => {
                  newVisibleColumns[col.key] = col.selected
                })
                setVisibleColumns(newVisibleColumns)
                setShowCustomizeColumns(false)

                // Save to database
                await saveColumnPreferencesToDB()
              }}
              className="flex-1 bg-[#0277bd] hover:bg-[#01579b]"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobResponsesManager
