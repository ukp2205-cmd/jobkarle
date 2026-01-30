"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Briefcase,
  Search,
  User,
  LogOut,
  MapPin,
  ArrowLeft,
  Phone,
  Mail,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Loader2,
  Users,
  IndianRupee,
  GraduationCap,
  Calendar,
  Building2,
  CheckCircle2,
} from "lucide-react"
import { searchCandidates, type CandidateSearchResult } from "@/app/actions/candidate-search-actions"
import { toast } from "@/hooks/use-toast"

interface SearchFilters {
  keywords: string
  skills: string[]
  excludeKeywords: string
  locations: string[]
  includeRelocate: boolean
  experienceMin: number
  experienceMax: number
  salaryMin: number
  salaryMax: number
  noticePeriod: string[]
  education: string[]
  industry: string[]
  department: string[]
  company: string
  activeIn: string
  gender: string[]
  diversity: string[]
  jobType: string[]
  employmentType: string[]
  showOnly: string[]
}

interface SearchResultsContentProps {
  employerId: string
  filters: SearchFilters
}

export function SearchResultsContent({ employerId, filters }: SearchResultsContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<CandidateSearchResult[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const resultsPerPage = 20

  useEffect(() => {
    loadCandidates()
  }, [currentPage])

  const loadCandidates = async () => {
    setLoading(true)
    try {
      const result = await searchCandidates({
        employerId,
        ...filters,
        includeSalaryNotMentioned: true,
        displayFilter: "all",
        ageMin: 18,
        ageMax: 65,
      })

      if (result.success) {
        setCandidates(result.candidates || [])
        setTotalResults(result.total || 0)
      } else {
        toast({
          title: "Search Failed",
          description: result.error || "Unable to search candidates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: "An error occurred while searching",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    )
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage)

  const getSearchSummary = () => {
    const parts: string[] = []
    if (filters.keywords) parts.push(`"${filters.keywords}"`)
    if (filters.skills.length > 0) parts.push(`Skills: ${filters.skills.join(", ")}`)
    if (filters.locations.length > 0) parts.push(`Location: ${filters.locations.join(", ")}`)
    return parts.length > 0 ? parts.join(" | ") : "All Candidates"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/employer/dashboard" className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Briefcase className="h-4 w-4 text-white" />
                  <span className="text-base font-bold text-white">JobKarle</span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/employer/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Jobs & Responses
                </Link>
                <Link
                  href="/employer/search-candidates"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search Candidates
                </Link>
                <div className="relative">
                  <span className="px-4 py-2 text-sm font-medium text-gray-900 bg-blue-50 rounded-md flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Search Results
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <Link href="/employer/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="h-4 w-4 inline mr-2" />
                      Dashboard
                    </Link>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      <LogOut className="h-4 w-4 inline mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Back Button & Search Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/employer/search-candidates")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Modify Search
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Search Results</h1>
              <p className="text-sm text-gray-500 mt-0.5">{getSearchSummary()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 ${viewMode === "card" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
              {totalResults} candidates found
            </Badge>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Searching candidates...</span>
          </div>
        ) : candidates.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Users className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search filters</p>
              <Button onClick={() => router.push("/employer/search-candidates")}>Modify Search</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={`grid gap-4 ${viewMode === "card" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            >
              {candidates.map((candidate) => (
                <Card
                  key={candidate.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                          <AvatarImage src={candidate.profile_photo_url || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                            {getInitials(candidate.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{candidate.full_name}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            {candidate.resume_headline || candidate.current_job_title || "Job Seeker"}
                          </p>
                          {candidate.current_company && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {candidate.current_company}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap gap-3 text-sm">
                        {candidate.current_city && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3.5 w-3.5 text-green-500" />
                            {candidate.current_city}
                          </span>
                        )}
                        {candidate.total_experience && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                            {candidate.total_experience} years
                          </span>
                        )}
                        {candidate.preferred_salary && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <IndianRupee className="h-3.5 w-3.5 text-amber-500" />
                            {candidate.preferred_salary} LPA
                          </span>
                        )}
                      </div>

                      {candidate.highest_qualification && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                          {candidate.highest_qualification}
                        </div>
                      )}

                      {(candidate.skills_for_role?.length > 0 || candidate.skills_you_know?.length > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {[...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])]
                            .slice(0, 4)
                            .map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className={`text-xs px-2 py-0.5 ${
                                  filters.skills.some((s) => s.toLowerCase() === skill.toLowerCase())
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {filters.skills.some((s) => s.toLowerCase() === skill.toLowerCase()) && (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                {skill}
                              </Badge>
                            ))}
                          {[...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])].length > 4 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500">
                              +{[...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])].length - 4}{" "}
                              more
                            </Badge>
                          )}
                        </div>
                      )}

                      {candidate.notice_period && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Notice: {candidate.notice_period}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-600 hover:text-blue-600"
                          onClick={() => candidate.mobile && (window.location.href = `tel:${candidate.mobile}`)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-600 hover:text-blue-600"
                          onClick={() => candidate.email && (window.location.href = `mailto:${candidate.email}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        {candidate.resume_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-600 hover:text-blue-600"
                            onClick={() => window.open(candidate.resume_url, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push(`/employer/candidate/${candidate.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
