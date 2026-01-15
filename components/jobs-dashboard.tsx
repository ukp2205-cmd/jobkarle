"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  User,
  Briefcase,
  Search,
  LogOut,
  Filter,
  ChevronDown,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Edit,
  MoreVertical,
  Share2,
  Eye,
  X,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getEmployerJobs,
  logoutEmployer,
  publishJobPosting,
  closeJob,
  reopenJob,
  repostJob, // Imported for repost
} from "@/app/actions/job-dashboard-actions"
import { getActiveCredits, type CreditBalance } from "@/app/actions/credits-actions"
import { useToast } from "@/components/ui/use-toast" // Added for toast
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog" // Added for dialog
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { SessionTimeoutWarning } from "@/components/session-timeout-warning"

interface Job {
  id: string
  job_title: string
  location: string
  category: "classified" | "premium" | "internship" // Added 'internship'
  status: string
  created_at: string
  total_responses: number
  new_responses: number
  shortlisted: number
  expires_at?: string // Added for expiry
}

interface Filters {
  status: string[]
  category: string[]
}

interface JobsDashboardProps {
  employerId: string
  employerName?: string
  companyName?: string
  logoUrl?: string | null
}

export default function JobsDashboard({
  employerId,
  employerName = "Employer",
  companyName = "Company",
  logoUrl,
}: JobsDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "drafts">("all")
  const [filters, setFilters] = useState<Filters>({ status: [], category: [] })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(60)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [draftCount, setDraftCount] = useState(0)
  const [allJobsCount, setAllJobsCount] = useState(0)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  const [showCreditModal, setShowCreditModal] = useState(false)
  const [credits, setCredits] = useState<CreditBalance | null>(null)
  const [creditsLoading, setCreditsLoading] = useState(true)

  const [shareModalJob, setShareModalJob] = useState<Job | null>(null)

  const router = useRouter()
  const { toast } = useToast() // Initialize toast

  // State for repost dialog
  const [repostDialogOpen, setRepostDialogOpen] = useState(false)
  const [jobToRepost, setJobToRepost] = useState<string | null>(null)
  const [repostLoading, setRepostLoading] = useState(false)

  const { showWarning, secondsRemaining, extendSession } = useSessionTimeout({
    timeoutMs: 60 * 1000, // 1 minute for testing (change to 15 * 60 * 1000 for production)
    warningMs: 10 * 1000, // 10 seconds warning
    onTimeout: async () => {
      await logoutEmployer()
      router.push("/employer/login?timeout=true")
    },
  })

  useEffect(() => {
    console.log("[v0] JobsDashboard component mounted")
    console.log("[v0] EmployerId prop:", employerId)
    console.log("[v0] EmployerId type:", typeof employerId)
    console.log("[v0] EmployerId is valid:", employerId && employerId.length > 0)
  }, [employerId])

  useEffect(() => {
    loadJobs()
    loadCounts()
    loadCredits()
  }, [employerId, activeTab, filters])

  const loadCounts = async () => {
    try {
      const draftsResult = await getEmployerJobs(employerId, { status: "draft" })
      setDraftCount(draftsResult.jobs?.length || 0)

      const allResult = await getEmployerJobs(employerId, {})
      setAllJobsCount(allResult.jobs?.length || 0)
    } catch (error) {
      console.error("[v0] Error loading counts:", error)
    }
  }

  const loadJobs = async () => {
    console.log("[v0] Loading jobs for employerId:", employerId)
    console.log("[v0] Loading jobs for tab:", activeTab)
    console.log("[v0] Applied filters:", filters)
    setLoading(true)
    try {
      const result = await getEmployerJobs(employerId, {
        status: activeTab === "drafts" ? "draft" : undefined,
      })
      setJobs(result.jobs || [])
      console.log("[v0] Loaded jobs:", result.jobs?.length)
    } catch (error) {
      console.error("[v0] Error loading jobs:", error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const result = await logoutEmployer()
    if (result.success) {
      router.push("/employer/login")
    }
  }

  const handlePublishDraft = async (jobId: string) => {
    if (!confirm("Are you sure you want to publish this draft job?")) {
      return
    }

    const setPublishingJobId = (id: string | null) => {
      // Placeholder for setPublishingJobId logic
    }

    setPublishingJobId(jobId)
    try {
      const result = await publishJobPosting(jobId)
      if (result.success) {
        alert("Job published successfully!")
        await loadJobs()
      } else {
        alert(result.error || "Failed to publish job")
      }
    } catch (error) {
      console.error("Error publishing job:", error)
      alert("An error occurred while publishing the job")
    } finally {
      setPublishingJobId(null)
    }
  }

  const handleEditDraft = (jobId: string) => {
    router.push(`/employer/edit-job/${jobId}`)
  }

  const handleCloseJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to close this job? Candidates will no longer be able to apply.")) {
      return
    }

    try {
      const result = await closeJob(jobId)
      if (result.success) {
        alert("Job closed successfully!")
        await loadJobs()
        await loadCounts()
      } else {
        alert(result.error || "Failed to close job")
      }
    } catch (error) {
      console.error("Error closing job:", error)
      alert("An error occurred while closing the job")
    }
  }

  const handleReopenJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to reopen this job?")) {
      return
    }

    try {
      const result = await reopenJob(jobId)
      if (result.success) {
        alert("Job reopened successfully!")
        await loadJobs()
        await loadCounts()
      } else {
        alert(result.error || "Failed to reopen job")
      }
    } catch (error) {
      console.error("Error reopening job:", error)
      alert("An error occurred while reopening the job")
    }
  }

  // Handle repost job
  const handleRepostJob = async (jobId: string) => {
    if (!employerId) return

    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    const creditsNeeded = job.category === "premium" ? 2 : 1

    setRepostLoading(true)
    try {
      const result = await repostJob(jobId, employerId)

      if (result.success) {
        toast({
          title: "Job Reposted Successfully",
          description: `${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""} have been deducted. The job is now active for 30 days.`,
        })
        await loadJobs()
        await loadCredits()
        setRepostDialogOpen(false)
        setJobToRepost(null)
      } else {
        toast({
          title: "Failed to Repost Job",
          description: result.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error reposting job:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setRepostLoading(false)
    }
  }

  const handlePreviewJob = (jobId: string) => {
    console.log("[v0] Navigating to employer job preview for:", jobId)
    router.push(`/employer/preview-job/${jobId}`)
  }

  const handleShareJob = (job: Job) => {
    console.log("[v0] Opening share modal for:", job.id)
    setShareModalJob(job)
  }

  const shareOnPlatform = (platform: "twitter" | "linkedin" | "facebook") => {
    if (!shareModalJob) return

    const jobUrl = `${window.location.origin}/jobs/${shareModalJob.id}`
    const jobTitle = shareModalJob.job_title
    const shareText = `Check out this job opportunity: ${jobTitle}`

    let shareUrl = ""

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(jobUrl)}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`
        break
    }

    window.open(shareUrl, "_blank", "width=600,height=400")
  }

  const copyJobLink = () => {
    if (!shareModalJob) return

    const jobUrl = `${window.location.origin}/jobs/${shareModalJob.id}`
    navigator.clipboard.writeText(jobUrl)
    alert("Job link copied to clipboard!")
  }

  // Helper to get job status badge
  const getJobStatusBadge = (status: string, expiresAt?: string) => {
    // Check if job is expired based on expires_at
    const isExpired = expiresAt && new Date(expiresAt) < new Date()

    if (isExpired) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Expired</span>
    }

    switch (status) {
      case "published":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
      case "closed":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Closed</span>
      case "draft":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Draft</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{status}</span>
    }
  }

  // Helper to format expiry date
  const formatExpiryDate = (expiresAt?: string) => {
    if (!expiresAt) return null

    const date = new Date(expiresAt)
    const now = new Date()

    if (date < now) {
      return "Expired"
    }

    return `Valid till: ${date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`
  }

  const canRefreshJob = (job: any) => {
    return job.status === "published"
  }

  const canRepostJob = (job: any) => {
    const now = new Date()
    const expiresAt = job.expires_at ? new Date(job.expires_at) : null
    const isExpired = expiresAt ? now > expiresAt : false

    return job.status === "closed" || job.status === "expired" || isExpired
  }

  const getCategoryBadge = (category: string) => {
    if (category === "premium") {
      return (
        <div className="absolute -left-2 -top-3.5 z-20">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Main diamond body with blue gradient */}
            <path
              d="M12 2L2 7L12 22L22 7L12 2Z"
              fill="url(#blueDiamondGradient)"
              stroke="url(#blueStroke)"
              strokeWidth="0.5"
            />

            {/* Diamond facets for depth and realism */}
            <path d="M12 2L7 7H17L12 2Z" fill="rgba(59, 130, 246, 0.4)" stroke="none" />
            <path d="M7 7L2 7L12 22L7 7Z" fill="rgba(37, 99, 235, 0.5)" stroke="none" />
            <path d="M17 7L22 7L12 22L17 7Z" fill="rgba(37, 99, 235, 0.5)" stroke="none" />
            <path d="M12 7L12 22" stroke="rgba(29, 78, 216, 0.3)" strokeWidth="0.5" />

            {/* White highlight for sparkle effect on diamond */}
            <ellipse cx="10" cy="5" rx="2.5" ry="2" fill="white" opacity="0.9" />
            <circle cx="10" cy="5" r="1.2" fill="white" opacity="1" />
            <circle cx="14" cy="8" r="0.8" fill="white" opacity="0.7" />

            {/* Animated gold sparkles around diamond */}
            <g className="animate-pulse" style={{ animationDuration: "2s" }}>
              {/* Top right large gold sparkle */}
              <path
                d="M20 3L20.8 5.2L23 6L20.8 6.8L20 9L19.2 6.8L17 6L19.2 5.2Z"
                fill="url(#sparkleGold1)"
                opacity="0.95"
              />
              {/* Bottom left gold sparkle */}
              <path
                d="M4 17L4.6 18.8L6.5 19.5L4.6 20.2L4 22L3.4 20.2L1.5 19.5L3.4 18.8Z"
                fill="url(#sparkleGold2)"
                opacity="0.9"
              />
              {/* Top left gold sparkle */}
              <path d="M5.5 1.5L5.9 2.7L7 3.1L5.9 3.5L5.5 4.7L5.1 3.5L4 3.1L5.1 2.7Z" fill="#FEF3C7" opacity="0.85" />
              {/* Right side gold sparkle */}
              <path
                d="M21.5 12L21.8 13L22.8 13.3L21.8 13.6L21.5 14.6L21.2 13.6L20.2 13.3L21.2 13Z"
                fill="#FDE68A"
                opacity="0.8"
              />
            </g>

            {/* Additional subtle shimmer gold sparkles */}
            <g className="animate-pulse" style={{ animationDuration: "3s", animationDelay: "0.5s" }}>
              <circle cx="8" cy="10" r="0.5" fill="#FEF3C7" opacity="0.7" />
              <circle cx="16" cy="13" r="0.5" fill="#FDE68A" opacity="0.7" />
              <circle cx="11" cy="15" r="0.4" fill="#FBBF24" opacity="0.6" />
            </g>

            <defs>
              {/* Blue gradient for diamond */}
              <linearGradient id="blueDiamondGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="30%" stopColor="#60A5FA" />
                <stop offset="60%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>

              {/* Blue stroke for definition */}
              <linearGradient id="blueStroke" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>

              {/* Gold sparkle gradients */}
              <radialGradient id="sparkleGold1">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="50%" stopColor="#FCD34D" />
                <stop offset="100%" stopColor="#FBBF24" />
              </radialGradient>

              <radialGradient id="sparkleGold2">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="50%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#FCD34D" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      )
    }
    return null
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === "" ||
      job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatusFilter = filters.status.length === 0 || filters.status.includes(job.status)

    const matchesCategoryFilter = filters.category.length === 0 || filters.category.includes(job.category)

    return matchesSearch && matchesStatusFilter && matchesCategoryFilter
  })

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]))
  }

  const toggleAllJobs = () => {
    if (selectedJobs.length === filteredJobs.length && filteredJobs.length > 0) {
      setSelectedJobs([])
    } else {
      setSelectedJobs(filteredJobs.map((job) => job.id))
    }
  }

  const toggleFilter = (type: "status" | "category", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter((v) => v !== value) : [...prev[type], value],
    }))
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileDropdown])

  const loadCredits = async () => {
    setCreditsLoading(true)
    const balance = await getActiveCredits(employerId)
    setCredits(balance)
    setCreditsLoading(false)
  }

  // Get available credits for repost check
  const availableCredits = credits?.remainingCredits || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionTimeoutWarning open={showWarning} secondsRemaining={secondsRemaining} onExtendSession={extendSession} />

      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-3">
          <div className="flex items-center justify-between gap-2 md:gap-6">
            <div className="flex items-center gap-2 md:gap-8">
              <Link href="/employer/dashboard" className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Briefcase className="h-4 w-4 text-white" />
                  <span className="text-xs md:text-base font-bold text-white">JobKarle</span>
                </div>
              </Link>

              <nav className="flex items-center gap-1">
                <div className="relative">
                  <button className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-base font-medium text-gray-900 hover:bg-gray-50 rounded-t-md transition-colors">
                    Jobs & Responses
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative w-24 sm:w-40 md:w-64">
                <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 h-3 md:h-4 w-3 md:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 md:pl-10 pr-2 md:pr-4 py-1.5 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowCreditModal(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <span className="hidden sm:inline">Available Credits:</span>
                <span className="font-semibold text-blue-600">
                  {creditsLoading ? "..." : credits?.remainingCredits || 0}
                </span>
              </button>

              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Profile menu"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl || "/placeholder.svg"}
                      alt={companyName}
                      className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 md:h-5 w-4 md:w-5 text-gray-600" />
                  )}
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm md:text-base font-semibold text-gray-800">{employerName}</p>
                      <p className="text-xs text-gray-500">{companyName}</p>
                    </div>
                    <Link
                      href="/employer/profile"
                      className="w-full px-4 py-2 text-left text-sm md:text-base text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm md:text-base text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
      </header>

      {showCreditModal && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowCreditModal(false)} />
          <div className="fixed top-20 right-4 md:right-8 w-80 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Credit Balance</h3>
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-white">{credits?.remainingCredits || 0}</div>
                <div className="text-sm text-blue-100 mt-1">Credits Available</div>
              </div>
            </div>

            {/* Credit Details */}
            <div className="p-5 space-y-4 md:space-y-6">
              {/* Job Posting Credits */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Job Posting Credits</span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-gray-600">Total allocated</span>
                  <span className="font-semibold text-gray-900">{credits?.totalCredits || 0}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-gray-600">Used</span>
                  <span className="font-semibold text-gray-900">{credits?.usedCredits || 0}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold text-blue-600">{credits?.remainingCredits || 0}</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{
                        width: credits?.totalCredits
                          ? `${((credits.usedCredits || 0) / credits.totalCredits) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Cost Info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <strong>2 credits</strong> are deducted for each job posting
                  </div>
                </div>
              </div>

              {/* Expiration */}
              {credits?.expiryDate && (
                <div className="text-xs text-gray-500 text-center">
                  Credits expire on {new Date(credits.expiryDate).toLocaleDateString()}
                </div>
              )}

              {/* Upgrade Button */}
              <button
                onClick={() => {
                  setShowCreditModal(false)
                  router.push("/employer/pricing")
                }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
              >
                Buy More Credits
              </button>
            </div>
          </div>
        </>
      )}

      {shareModalJob && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShareModalJob(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[60] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Share Job</h3>
              </div>
              <button
                onClick={() => setShareModalJob(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 mb-1">{shareModalJob.job_title}</p>
              <p className="text-xs text-gray-500">{shareModalJob.location}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => shareOnPlatform("linkedin")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0077B5] hover:bg-[#006399] text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Share on LinkedIn
              </button>

              <button
                onClick={() => shareOnPlatform("twitter")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.244H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on Twitter (X)
              </button>

              <button
                onClick={() => shareOnPlatform("facebook")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1877F2] hover:bg-[#165ECC] text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Share on Facebook
              </button>

              <button
                onClick={copyJobLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Link
              </button>
            </div>
          </div>
        </>
      )}

      <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Track jobs and manage responses</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Responses to your jobs and invites will appear here</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base flex-1 sm:flex-initial">
                  Post job <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/employer/post-job?type=premium" className="flex items-center cursor-pointer">
                    Post a Premium Job
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/employer/post-job?type=internship" className="flex items-center cursor-pointer">
                    Post an Internship
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/employer/post-job?type=classified" className="flex items-center cursor-pointer">
                    Post a Classified Job
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <aside
            className={`
              ${showFilters ? "fixed top-[73px] bottom-0 left-0 z-40 translate-x-0" : "fixed top-[73px] bottom-0 left-0 z-40 -translate-x-full"}
              lg:translate-x-0 lg:static
              w-64 lg:w-64 flex-shrink-0
              transition-transform duration-300 ease-in-out
              lg:block
            `}
          >
            <div className="bg-white rounded-lg border p-3 md:p-4 space-y-4 md:space-y-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between lg:hidden mb-4">
                <h2 className="font-semibold text-base text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                  aria-label="Close filters"
                >
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-sm text-gray-900">Filters</h2>
              </div>

              <div>
                <button className="flex items-center justify-between w-full mb-3">
                  <h3 className="font-medium text-sm text-gray-900">Job status</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                    <Checkbox
                      checked={filters.status.includes("published")}
                      onCheckedChange={() => toggleFilter("status", "published")}
                    />
                    <span className="flex-1">Active Jobs</span>
                    <span className="text-gray-400 text-xs">{jobs.filter((j) => j.status === "published").length}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                    <Checkbox
                      checked={filters.status.includes("closed")}
                      onCheckedChange={() => toggleFilter("status", "closed")}
                    />
                    <span className="flex-1">Closed Jobs</span>
                    <span className="text-gray-400 text-xs">{jobs.filter((j) => j.status === "closed").length}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                    <Checkbox
                      checked={filters.status.includes("expired")}
                      onCheckedChange={() => toggleFilter("status", "expired")}
                    />
                    <span className="flex-1">Expired Jobs</span>
                    <span className="text-gray-400 text-xs">{jobs.filter((j) => j.status === "expired").length}</span>
                  </label>
                </div>
              </div>

              <div>
                <button className="flex items-center justify-between w-full mb-3">
                  <h3 className="font-medium text-sm text-gray-900">Category</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                    <Checkbox
                      checked={filters.category.includes("classified")}
                      onCheckedChange={() => toggleFilter("category", "classified")}
                    />
                    <span className="flex-1">Classified</span>
                    <span className="text-gray-400 text-xs">
                      {jobs.filter((j) => j.category === "classified").length}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                    <Checkbox
                      checked={filters.category.includes("premium")}
                      onCheckedChange={() => toggleFilter("category", "premium")}
                    />
                    <span className="flex-1">Premium</span>
                    <span className="text-gray-400 text-xs">{jobs.filter((j) => j.category === "premium").length}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                    <Checkbox
                      checked={filters.category.includes("internship")}
                      onCheckedChange={() => toggleFilter("category", "internship")}
                    />
                    <span className="flex-1">Internship</span>
                    <span className="text-gray-400 text-xs">
                      {jobs.filter((j) => j.category === "internship").length}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <button className="flex items-center justify-between w-full mb-3">
                  <h3 className="font-medium text-sm text-gray-900">Job posted by</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <Input placeholder="Search by username" className="mb-2.5 text-xs" />
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <Checkbox defaultChecked />
                  <span className="flex-1">Me</span>
                  <span className="text-gray-400 text-xs">{jobs.length}</span>
                </label>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <div className="flex items-center">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-3 border-b-2 font-medium text-sm md:text-base transition-colors ${
                      activeTab === "all"
                        ? "border-orange-500 text-orange-500"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All Jobs {allJobsCount}
                  </button>
                  <button
                    onClick={() => setActiveTab("drafts")}
                    className={`px-4 py-3 border-b-2 font-medium text-sm md:text-base transition-colors ${
                      activeTab === "drafts"
                        ? "border-orange-500 text-orange-500"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Drafts {draftCount}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 border-b">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                    onCheckedChange={toggleAllJobs}
                  />
                  <span className="text-xs md:text-sm text-gray-700">Select All</span>
                </label>
                <Button variant="ghost" size="sm" className="h-7 text-xs md:text-sm" onClick={loadJobs}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh
                </Button>

                {/* Repost Button Logic */}
                {filteredJobs.some(canRepostJob) && availableCredits >= 2 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs md:text-sm">
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Repost Selected ({selectedJobs.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setJobToRepost(selectedJobs[0]) // Repost the first selected job for confirmation
                          setRepostDialogOpen(true)
                        }}
                      >
                        Repost Selected Job
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {/* End Repost Button Logic */}

                <Button variant="ghost" size="sm" className="h-7 text-xs md:text-sm">
                  Collaborate
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs md:text-sm">
                  Close
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs md:text-sm">
                      Sort by: Posted/sent date <ChevronDown className="ml-1.5 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Posted/sent date</DropdownMenuItem>
                    <DropdownMenuItem>Job title (A-Z)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">Loading jobs...</div>
                ) : paginatedJobs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {activeTab === "drafts"
                      ? "No draft jobs found."
                      : "No jobs found. Post your first job to get started!"}
                  </div>
                ) : (
                  paginatedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 hover:bg-gray-50 transition-colors relative border-b border-gray-200 bg-white"
                    >
                      {getCategoryBadge(job.category)}

                      <div className="flex-1 min-w-0 pl-6">
                        <div className="flex flex-col lg:flex-row items-start gap-3 lg:gap-0">
                          <div className="flex items-start gap-3 w-full lg:w-[300px] flex-shrink-0">
                            <div className="pt-1">
                              <Checkbox
                                checked={selectedJobs.includes(job.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedJobs([...selectedJobs, job.id])
                                  } else {
                                    setSelectedJobs(selectedJobs.filter((id) => id !== job.id))
                                  }
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <Link href={`/employer/preview-job/${job.id}`} className="block group">
                                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 break-words group-hover:text-blue-600 transition-colors cursor-pointer">
                                  {job.job_title}
                                </h3>
                              </Link>
                              <p className="text-xs md:text-sm text-gray-600 mb-2 break-words">{job.location}</p>

                              {/* Job status badge and expiry date display */}
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 flex-wrap">
                                {getJobStatusBadge(job.status, job.expires_at)}
                                {job.expires_at && (
                                  <span className="text-xs text-gray-500">{formatExpiryDate(job.expires_at)}</span>
                                )}
                              </div>

                              <div className="text-xs md:text-sm text-gray-500">
                                posted by me • {new Date(job.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-around lg:justify-center gap-4 lg:gap-8 flex-1 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0">
                            <Link href={`/employer/job-responses/${job.id}`} className="flex-1 lg:flex-initial">
                              <div className="flex flex-col items-center cursor-pointer hover:bg-gray-100 rounded-md p-2 transition-colors">
                                <div className="flex items-center gap-1">
                                  <span className="text-base md:text-xl font-semibold text-blue-600">
                                    {job.total_responses}
                                  </span>
                                  {job.new_responses > 0 && (
                                    <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] md:text-xs font-medium rounded">
                                      {job.new_responses} New
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] md:text-sm text-gray-500 text-center">
                                  Total Responses
                                </span>
                              </div>
                            </Link>

                            <div className="flex flex-col items-center flex-1 lg:flex-initial">
                              <span className="text-base md:text-xl font-semibold text-gray-900">
                                {job.shortlisted}
                              </span>
                              <span className="text-[10px] md:text-sm text-gray-500">Shortlisted</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
                            {activeTab === "drafts" && job.status === "draft" && (
                              <button
                                onClick={() => handlePublishDraft(job.id)}
                                disabled={job.id === "publishingJobId"}
                                className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                                title="Publish Draft"
                              >
                                {job.id === "publishingJobId" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </button>
                            )}

                            {canRefreshJob(job) && !canRepostJob(job) && (
                              <>
                                {availableCredits >= (job.category === "premium" ? 2 : 1) ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setJobToRepost(job.id)
                                      setRepostDialogOpen(true)
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title={`Refresh Job (${job.category === "premium" ? 2 : 1} credit${job.category === "premium" ? "s" : ""})`}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="p-2 text-gray-400 cursor-not-allowed rounded-md"
                                    title={`Insufficient credits. Need ${job.category === "premium" ? 2 : 1} credit${job.category === "premium" ? "s" : ""} to refresh.`}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}

                            {canRepostJob(job) && (
                              <>
                                {availableCredits >= (job.category === "premium" ? 2 : 1) ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setJobToRepost(job.id)
                                      setRepostDialogOpen(true)
                                    }}
                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                    title={`Repost Job (${job.category === "premium" ? 2 : 1} credit${job.category === "premium" ? "s" : ""})`}
                                  >
                                    Repost
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="px-3 py-1.5 text-sm text-gray-400 bg-gray-100 cursor-not-allowed rounded-md"
                                    title={`Insufficient credits. Need ${job.category === "premium" ? 2 : 1} credit${job.category === "premium" ? "s" : ""} to repost.`}
                                  >
                                    Repost
                                  </button>
                                )}
                              </>
                            )}

                            {/* Edit button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleEditDraft(job.id)
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {job.status === "published" && (
                                  <DropdownMenuItem onClick={() => handleCloseJob(job.id)}>Close Job</DropdownMenuItem>
                                )}
                                {(job.status === "closed" || job.status === "expired") && (
                                  <DropdownMenuItem onClick={() => handleReopenJob(job.id)}>
                                    Reopen Job
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>Collaborate</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShareJob(job)}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share on social media
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePreviewJob(job.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview Job
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!loading && filteredJobs.length > 0 && (
                <div className="border-t px-3 md:px-6 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t">
                    <div className="text-xs md:text-sm text-center sm:text-left">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length}{" "}
                      jobs
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="px-2 md:px-3 py-1 text-xs md:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2 md:px-3 py-1 text-xs md:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-2 md:px-3 py-1 text-xs md:text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-2 md:px-3 py-1 text-xs md:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-2 md:px-3 py-1 text-xs md:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {jobToRepost && canRefreshJob(jobs.find((j) => j.id === jobToRepost)) ? "Refresh Job" : "Repost Job"}
            </DialogTitle>
            <DialogDescription>
              {jobToRepost &&
                (() => {
                  const job = jobs.find((j) => j.id === jobToRepost)
                  if (!job) return null
                  const creditsNeeded = job.category === "premium" ? 2 : 1
                  const action = canRefreshJob(job) ? "Refreshing" : "Reposting"
                  return `${action} this job will deduct ${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""} and make the job active for 30 days. Do you want to continue?`
                })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRepostDialogOpen(false)
                setJobToRepost(null)
              }}
              disabled={repostLoading}
            >
              Cancel
            </Button>
            <Button onClick={() => jobToRepost && handleRepostJob(jobToRepost)} disabled={repostLoading}>
              {repostLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { JobsDashboard }
