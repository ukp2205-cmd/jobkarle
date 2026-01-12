"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  IndianRupee,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { searchJobsWithElastic } from "@/app/actions/elastic-search-actions"
import Link from "next/link"

type SearchParams = {
  skills: string[]
  experience: string
  location: string
}

type HomeSearchResultsProps = {
  searchParams: SearchParams
  onBack: () => void
}

export function HomeSearchResults({ searchParams, onBack }: HomeSearchResultsProps) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    locations: searchParams.location ? [searchParams.location] : ([] as string[]),
    minExperience: 0,
    maxExperience: 30,
    minSalary: 0,
    maxSalary: 50,
    employmentTypes: [] as string[],
    workModes: [] as string[],
    datePosted: "all" as "24h" | "7d" | "30d" | "all",
  })
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    experience: true,
    salary: true,
    employmentType: true,
    workMode: true,
    datePosted: true,
  })

  useEffect(() => {
    loadJobs()
  }, [searchParams, filters])

  const loadJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const query = searchParams.skills.filter(Boolean).join(" ")

      console.log("[v0] === Home Search Component ===")
      console.log("[v0] Search query:", query, "Skills array:", searchParams.skills)
      console.log("[v0] Location filter:", filters.locations)

      // Parse experience if provided
      const expMatch = searchParams.experience.match(/\d+/)
      const experience = expMatch ? Number.parseInt(expMatch[0]) : undefined

      const searchFilters: any = {}

      // Add location filter
      if (filters.locations.length > 0) {
        searchFilters.city = filters.locations.join(",")
      }

      // Add experience filter
      if (experience !== undefined) {
        searchFilters.min_experience = experience
        searchFilters.max_experience = experience + 5
      } else if (filters.minExperience > 0 || filters.maxExperience < 30) {
        searchFilters.min_experience = filters.minExperience
        searchFilters.max_experience = filters.maxExperience
      }

      // Add salary filter
      if (filters.minSalary > 0 || filters.maxSalary < 50) {
        searchFilters.min_salary = filters.minSalary * 100000 // Convert LPA to rupees
        searchFilters.max_salary = filters.maxSalary * 100000
      }

      // Add employment type filter (Note: Elasticsearch doesn't support this yet)
      if (filters.employmentTypes.length > 0) {
        searchFilters.employment_type = filters.employmentTypes[0]
      }

      // Add work mode filter (Note: Elasticsearch doesn't support this yet)
      if (filters.workModes.length > 0) {
        searchFilters.work_mode = filters.workModes[0]
      }

      // Add date posted filter
      if (filters.datePosted !== "all") {
        searchFilters.date_posted = filters.datePosted
      }

      console.log("[v0] Elasticsearch search filters:", searchFilters)

      const results = await searchJobsWithElastic(query, searchFilters)
      console.log("[v0] Search results received:", results?.length || 0)

      setJobs(results || [])
    } catch (err) {
      console.error("[v0] Error loading jobs:", err)
      setError("Failed to load job results. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleLocation = (location: string) => {
    setFilters((prev) => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...prev.locations, location],
    }))
  }

  const toggleEmploymentType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      employmentTypes: prev.employmentTypes.includes(type)
        ? prev.employmentTypes.filter((t) => t !== type)
        : [...prev.employmentTypes, type],
    }))
  }

  const toggleWorkMode = (mode: string) => {
    setFilters((prev) => ({
      ...prev,
      workModes: prev.workModes.includes(mode) ? prev.workModes.filter((m) => m !== mode) : [...prev.workModes, mode],
    }))
  }

  const toggleDatePosted = (datePosted: "24h" | "7d" | "30d" | "all") => {
    setFilters((prev) => ({
      ...prev,
      datePosted,
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const availableLocations = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"]
  const employmentTypes = ["Full-time", "Part-time", "Contract", "Internship"]
  const workModes = ["Office", "Hybrid", "Remote"]
  const datePostedOptions = ["24h", "7d", "30d", "all"]

  const clearFilters = () => {
    setFilters({
      locations: [],
      minExperience: 0,
      maxExperience: 30,
      minSalary: 0,
      maxSalary: 50,
      employmentTypes: [],
      workModes: [],
      datePosted: "all",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#0277bd] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">JK</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-[#0277bd]">JobKarle</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`
            fixed lg:static inset-0 z-50 lg:z-auto
            ${showFilters ? "block" : "hidden lg:block"}
            lg:w-64 lg:flex-shrink-0
          `}
          >
            <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={() => setShowFilters(false)} />
            <div
              className="
              fixed lg:static
              left-0 top-0 bottom-0
              w-80 max-w-[85vw]
              lg:w-64
              bg-white rounded-none lg:rounded-lg shadow-sm p-4
              overflow-y-auto
              lg:sticky lg:top-20
            "
            >
              <div className="flex items-center justify-between mb-4 lg:mb-0">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Filters
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="lg:hidden">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("location")}
                  className="flex items-center justify-between w-full font-medium text-sm text-gray-700 mb-2"
                >
                  Location
                  {expandedSections.location ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.location && (
                  <div className="space-y-2 ml-1">
                    {availableLocations.map((location) => (
                      <label key={location} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={filters.locations.includes(location)}
                          onCheckedChange={() => toggleLocation(location)}
                        />
                        <span className="text-gray-700">{location}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("experience")}
                  className="flex items-center justify-between w-full font-medium text-sm text-gray-700 mb-2"
                >
                  Experience
                  {expandedSections.experience ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.experience && (
                  <div className="space-y-3">
                    <Slider
                      min={0}
                      max={30}
                      step={1}
                      value={[filters.minExperience, filters.maxExperience]}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          minExperience: value[0],
                          maxExperience: value[1],
                        }))
                      }
                    />
                    <div className="text-xs text-gray-600">
                      {filters.minExperience} - {filters.maxExperience}+ years
                    </div>
                  </div>
                )}
              </div>

              {/* Salary Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("salary")}
                  className="flex items-center justify-between w-full font-medium text-sm text-gray-700 mb-2"
                >
                  Salary (LPA)
                  {expandedSections.salary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.salary && (
                  <div className="space-y-3">
                    <Slider
                      min={0}
                      max={50}
                      step={1}
                      value={[filters.minSalary, filters.maxSalary]}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          minSalary: value[0],
                          maxSalary: value[1],
                        }))
                      }
                    />
                    <div className="text-xs text-gray-600">
                      ₹{filters.minSalary}L - ₹{filters.maxSalary}L
                    </div>
                  </div>
                )}
              </div>

              {/* Employment Type Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("employmentType")}
                  className="flex items-center justify-between w-full font-medium text-sm text-gray-700 mb-2"
                >
                  Employment Type
                  {expandedSections.employmentType ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.employmentType && (
                  <div className="space-y-2 ml-1">
                    {employmentTypes.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={filters.employmentTypes.includes(type)}
                          onCheckedChange={() => toggleEmploymentType(type)}
                        />
                        <span className="text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Mode Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("workMode")}
                  className="flex items-center justify-between w-full font-medium text-sm text-gray-700 mb-2"
                >
                  Work Mode
                  {expandedSections.workMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.workMode && (
                  <div className="space-y-2 ml-1">
                    {workModes.map((mode) => (
                      <label key={mode} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={filters.workModes.includes(mode)}
                          onCheckedChange={() => toggleWorkMode(mode)}
                        />
                        <span className="text-gray-700">{mode}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Posted Filter */}
              <div className="border-b pb-4">
                <button
                  type="button"
                  onClick={() => toggleSection("datePosted")}
                  className="flex items-center justify-between w-full text-sm font-medium mb-2"
                >
                  Date Posted
                  {expandedSections.datePosted ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.datePosted && (
                  <div className="space-y-2 mt-2 ml-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={filters.datePosted === "24h"}
                        onCheckedChange={() => setFilters((prev) => ({ ...prev, datePosted: "24h" }))}
                      />
                      <span className="text-gray-700">Last 24 hours</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={filters.datePosted === "7d"}
                        onCheckedChange={() => setFilters((prev) => ({ ...prev, datePosted: "7d" }))}
                      />
                      <span className="text-gray-700">Last 7 days</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={filters.datePosted === "30d"}
                        onCheckedChange={() => setFilters((prev) => ({ ...prev, datePosted: "30d" }))}
                      />
                      <span className="text-gray-700">Last 30 days</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={filters.datePosted === "all"}
                        onCheckedChange={() => setFilters((prev) => ({ ...prev, datePosted: "all" }))}
                      />
                      <span className="text-gray-700">All time</span>
                    </label>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  loadJobs()
                  setShowFilters(false)
                }}
                className="w-full bg-[#0277bd] hover:bg-[#0277bd]/90"
              >
                Apply Filters
              </Button>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => loadJobs()}>Try Again</Button>
              </div>
            )}
            {!error && (
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {loading ? "Searching..." : `${jobs.length} jobs found`}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                  {searchParams.skills.length > 0 && `Search: ${searchParams.skills.join(", ")}`}
                  {searchParams.experience && ` • Experience: ${searchParams.experience}`}
                  {searchParams.location && ` • Location: ${searchParams.location}`}
                  {filters.datePosted !== "all" && ` • Date Posted: ${filters.datePosted}`}
                </p>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 sm:py-20 bg-white rounded-lg border border-gray-200 px-4">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {filters.datePosted === "24h" && "No jobs posted in the last 24 hours"}
                  {filters.datePosted === "7d" && "No jobs posted in the last 7 days"}
                  {filters.datePosted === "30d" && "No jobs posted in the last 30 days"}
                  {filters.datePosted === "all" && "No jobs found"}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  {filters.datePosted !== "all"
                    ? "Try selecting a different time period or adjusting your filters"
                    : "Try adjusting your search terms or filters"}
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="text-xs sm:text-sm h-9 sm:h-10 bg-transparent"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow relative"
                  >
                    {job.category === "premium" && job.urgent_hiring && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg z-10">
                        URGENT HIRING
                      </div>
                    )}

                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            {job.company_logo_url ? (
                              <img
                                src={job.company_logo_url || "/placeholder.svg"}
                                alt={`${job.company_name} logo`}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-6 h-6 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <Link href={`/candidate/jobs/${job.id}`} className="block group">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words group-hover:text-[#0277bd] transition-colors cursor-pointer">
                                  {job.job_title}
                                </h3>
                              </Link>
                              <p className="text-sm text-gray-600 mb-3 break-words">{job.company_name}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              {(job.job_locations || []).join(", ") || "Not specified"}
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              {job.min_experience || 0} - {job.max_experience || 0} years
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              {job.min_salary || 0}L - {job.max_salary || 0}L
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {job.employment_type}
                            </span>
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                              {job.work_mode}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Link href={`/candidate/jobs/${job.id}`} className="flex-1 sm:flex-none">
                          <Button size="sm" variant="outline" className="w-full bg-transparent">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/candidate/jobs/${job.id}`} className="flex-1 sm:flex-none">
                          <Button size="sm" className="w-full bg-[#0277bd] hover:bg-[#0277bd]/90">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
