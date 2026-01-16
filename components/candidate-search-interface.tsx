"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Search, User, LogOut, Filter, X, ChevronUp, ChevronDown, CheckIcon as Checkbox } from "lucide-react"
import {
  searchJobs,
  saveJob,
  unsaveJob,
  isJobSaved,
  getDesignationSuggestions,
  getCompanySuggestions,
  getSkillSuggestions,
} from "@/app/actions/candidate-search-actions"
import JobCard from "@/components/job-card"

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
  openings?: number
  category?: string
}

type SearchInterfaceProps = {
  candidateId: string
  candidateName: string
}

export default function CandidateSearchInterface({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)

  // Filter states
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 20])
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 50])
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([])
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([])
  const [datePosted, setDatePosted] = useState<"24h" | "7d" | "30d" | "all">("all")

  const locations = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata"]
  const employmentTypes = ["Full-time", "Part-time", "Contract", "Internship"]
  const workModes = ["In office", "Remote", "Hybrid"]

  useEffect(() => {
    if (searchParams.get("q")) {
      handleSearch()
    }
  }, [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoadingSuggestions(true)

      // Fetch suggestions from all three sources in parallel
      const [designationResult, companyResult, skillResult] = await Promise.all([
        getDesignationSuggestions(searchQuery),
        getCompanySuggestions(searchQuery),
        getSkillSuggestions(searchQuery),
      ])

      // Combine all suggestions and remove duplicates
      const allSuggestions = [
        ...(designationResult.suggestions || []),
        ...(companyResult.suggestions || []),
        ...(skillResult.suggestions || []),
      ]

      // Remove duplicates and limit to 10
      const uniqueSuggestions = Array.from(new Set(allSuggestions)).slice(0, 10)

      setSuggestions(uniqueSuggestions)
      setShowSuggestions(uniqueSuggestions.length > 0)
      setIsLoadingSuggestions(false)
    }

    // Debounce the autocomplete
    const timeoutId = setTimeout(fetchSuggestions, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearch = async () => {
    setIsLoading(true)
    setShowSuggestions(false)

    console.log("[v0] ===== SEARCH INITIATED =====")
    console.log("[v0] Search query:", searchQuery)

    console.log("[v0] Selected locations STATE:", selectedLocations)
    console.log("[v0] Selected locations LENGTH:", selectedLocations.length)
    console.log("[v0] Selected locations TYPE:", typeof selectedLocations)
    if (selectedLocations.length > 0) {
      selectedLocations.forEach((loc, idx) => {
        console.log(`[v0] Location[${idx}]:`, loc, `(type: ${typeof loc})`)
      })
    }

    console.log(
      "[v0] Selected locations:",
      selectedLocations.length > 0 ? selectedLocations.join(", ") : "All locations",
    )
    console.log("[v0] Experience range:", experienceRange)

    const filters: any = {}

    if (selectedLocations.length > 0) {
      const cleanedLocations = selectedLocations
        .flatMap((loc) => (loc.includes(",") ? loc.split(",").map((l) => l.trim()) : [loc.trim()]))
        .filter(Boolean)

      filters.locations = cleanedLocations
      console.log("[v0] ✓ Location filter APPLIED - Cleaned locations:", cleanedLocations)
    } else {
      console.log("[v0] ✗ Location filter NOT applied - Showing jobs from all locations")
    }

    const isDefaultExperience = experienceRange[0] === 0 && experienceRange[1] === 20

    if (!isDefaultExperience) {
      filters.minExperience = experienceRange[0]
      filters.maxExperience = experienceRange[1]
      console.log("[v0] ✓ Experience filter WILL BE APPLIED:", filters.minExperience, "-", filters.maxExperience)
    } else {
      console.log("[v0] ✗ Experience filter NOT applied (slider is at default [0, 20])")
    }

    console.log("[v0] Final filters object before sending:", JSON.stringify(filters, null, 2))

    if (salaryRange[0] !== 0 || salaryRange[1] !== 50) {
      filters.minSalary = salaryRange[0] * 100000
      filters.maxSalary = salaryRange[1] * 100000
      console.log("[v0] Salary filter active:", salaryRange)
    }

    if (selectedEmploymentTypes.length > 0) {
      filters.employmentTypes = selectedEmploymentTypes
    }

    if (selectedWorkModes.length > 0) {
      filters.workModes = selectedWorkModes
    }

    // Added date posted filter
    if (datePosted !== "all") {
      filters.datePosted = datePosted
      console.log("[v0] ✓ Date posted filter applied:", datePosted)
    }

    const result = await searchJobs(searchQuery, filters, candidateId)

    if (result.success) {
      setJobs(result.jobs)

      // Check saved status for all jobs
      const savedStatusPromises = result.jobs.map((job) => isJobSaved(candidateId, job.id))
      const savedStatuses = await Promise.all(savedStatusPromises)
      const newSavedJobs = new Set<string>()
      savedStatuses.forEach((status, index) => {
        if (status.isSaved) {
          newSavedJobs.add(result.jobs[index].id)
        }
      })
      setSavedJobs(newSavedJobs)
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setTimeout(() => {
      handleSearch()
    }, 100)
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
      }
    } else {
      const result = await saveJob(candidateId, jobId)
      if (result.success) {
        setSavedJobs((prev) => new Set([...prev, jobId]))
      }
    }
  }

  const handleViewJob = (jobId: string) => {
    router.push(`/candidate/jobs/${jobId}`)
  }

  const handleLogout = async () => {
    window.location.href = "/candidate/login"
  }

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) => (prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]))
  }

  const toggleEmploymentType = (type: string) => {
    setSelectedEmploymentTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const toggleWorkMode = (mode: string) => {
    setSelectedWorkModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]))
  }

  const clearFilters = () => {
    setSelectedLocations([])
    setExperienceRange([0, 20])
    setSalaryRange([0, 50])
    setSelectedEmploymentTypes([])
    setSelectedWorkModes([])
    setDatePosted("all") // Clear date posted filter
    setShowDateFilter(false) // Hide date filter
  }

  const getSalaryString = (min: number, max: number) => {
    if (!min && !max) return "Not disclosed"
    const minLPA = min
    const maxLPA = max
    if (min && max) return `${minLPA.toFixed(0)}-${maxLPA.toFixed(0)} LPA`
    if (min) return `${minLPA.toFixed(0)}+ LPA`
    return "Not disclosed"
  }

  const getLocationString = (locations: string[]) => {
    if (!locations || locations.length === 0) return "Not specified"
    if (locations.length === 1) return locations[0]
    if (locations.length === 2) return locations.join(", ")
    return `${locations[0]}, ${locations[1]} +${locations.length - 2}`
  }

  const activeFiltersCount =
    selectedLocations.length +
    selectedEmploymentTypes.length +
    selectedWorkModes.length +
    (experienceRange[0] !== 0 || experienceRange[1] !== 20 ? 1 : 0) +
    (salaryRange[0] !== 0 || salaryRange[1] !== 50 ? 1 : 0) +
    (datePosted !== "all" ? 1 : 0) // Include date posted filter in count

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <a href="/candidate/dashboard" className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#0277bd] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">JK</span>
              </div>
              <span className="text-lg sm:text-2xl font-semibold text-[#0277bd]">JobKarle</span>
            </a>

            {/* Profile */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 h-8 sm:h-9 px-2"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0277bd]" />
                </div>
              </Button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Candidate Name</div>
                  </div>
                  <button
                    onClick={() => router.push("/candidate/dashboard")}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Container */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="mx-auto max-w-3xl">
            {/* Relative wrapper for autocomplete dropdown */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by job title, company, or skills"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                      setShowSuggestions(false)
                    }
                  }}
                  className="h-12 pl-4 pr-12 text-base rounded-full"
                />
              </div>

              {/* Autocomplete suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Loading suggestions...</div>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">{suggestion}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
              {/* Search and Filter Buttons */}
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-full px-8"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
              {/* Mobile Filter Toggle Button */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg flex items-center gap-2 text-xs sm:text-sm border-gray-300"
              >
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#0277bd]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 lg:gap-8">
          {/* Filters Sidebar/Drawer */}
          {showFilters && (
            <>
              {/* Mobile overlay */}
              <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowFilters(false)} />

              {/* Filter panel */}
              <aside className="fixed lg:sticky top-0 left-0 lg:top-24 h-full lg:h-fit w-[85vw] max-w-sm lg:w-80 bg-white rounded-none lg:rounded-lg border-r lg:border border-gray-200 p-4 sm:p-6 overflow-y-auto z-50 shadow-xl lg:shadow-sm">
                {/* Filters Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Filters</h2>
                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-[#0277bd] hover:text-[#01579b] text-xs sm:text-sm h-8"
                      >
                        Clear All
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Filters Content */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Location */}
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 block">
                      Location
                    </Label>
                    <div className="space-y-1.5 sm:space-y-2">
                      {locations.map((location) => (
                        <label key={location} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLocations.includes(location)}
                            onChange={() => toggleLocation(location)}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0277bd] rounded border-gray-300 focus:ring-[#0277bd]"
                          />
                          <span className="text-xs sm:text-sm text-gray-700">{location}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Experience */}
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 block">
                      Experience: {experienceRange[0]}-{experienceRange[1]} yrs
                    </Label>
                    <Slider
                      value={experienceRange}
                      onValueChange={(value) => setExperienceRange(value as [number, number])}
                      min={0}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Salary */}
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 block">
                      Salary: {salaryRange[0]}-{salaryRange[1]} LPA
                    </Label>
                    <Slider
                      value={salaryRange}
                      onValueChange={(value) => setSalaryRange(value as [number, number])}
                      min={0}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Employment Type */}
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 block">
                      Employment Type
                    </Label>
                    <div className="space-y-1.5 sm:space-y-2">
                      {employmentTypes.map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedEmploymentTypes.includes(type)}
                            onChange={() => toggleEmploymentType(type)}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0277bd] rounded border-gray-300 focus:ring-[#0277bd]"
                          />
                          <span className="text-xs sm:text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Work Mode */}
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 block">
                      Work Mode
                    </Label>
                    <div className="space-y-1.5 sm:space-y-2">
                      {workModes.map((mode) => (
                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedWorkModes.includes(mode)}
                            onChange={() => toggleWorkMode(mode)}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0277bd] rounded border-gray-300 focus:ring-[#0277bd]"
                          />
                          <span className="text-xs sm:text-sm text-gray-700">{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Date Posted Filter */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowDateFilter(!showDateFilter)}
                      className="flex items-center justify-between w-full font-medium text-sm text-gray-700 mb-2"
                    >
                      Date Posted
                      {showDateFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showDateFilter && (
                      <div className="space-y-2 ml-1">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={datePosted === "24h"} onCheckedChange={() => setDatePosted("24h")} />
                          <span className="text-gray-700">Last 24 hours</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={datePosted === "7d"} onCheckedChange={() => setDatePosted("7d")} />
                          <span className="text-gray-700">Last 7 days</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={datePosted === "30d"} onCheckedChange={() => setDatePosted("30d")} />
                          <span className="text-gray-700">Last 30 days</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={datePosted === "all"} onCheckedChange={() => setDatePosted("all")} />
                          <span className="text-gray-700">All time</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply Filters Button */}
                <Button
                  onClick={() => {
                    handleSearch()
                    setShowFilters(false)
                  }}
                  className="w-full mt-4 sm:mt-6 h-9 sm:h-10 bg-[#0277bd] hover:bg-[#01579b] text-xs sm:text-sm"
                >
                  Apply Filters
                </Button>
              </aside>
            </>
          )}

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Results Header */}
            {!isLoading && jobs.length > 0 && (
              <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                      {searchQuery && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Search:</span> {searchQuery}
                        </span>
                      )}
                      {selectedLocations.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">•</span>
                          <span className="font-medium">Location:</span> {selectedLocations.join(", ")}
                        </span>
                      )}
                      {!experienceRange.every((value) => value === 0 || value === 20) && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">•</span>
                          <span className="font-medium">Experience:</span> {experienceRange[0]} - {experienceRange[1]}{" "}
                          years
                        </span>
                      )}
                      {datePosted !== "all" && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">•</span>
                          <span className="font-medium">Date Posted:</span> {datePosted}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12 sm:py-20">
                <div className="animate-spin w-10 h-10 sm:w-12 sm:h-12 border-4 border-[#0277bd] border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
                <p className="text-base sm:text-lg text-gray-600">Searching jobs...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && jobs.length === 0 && searchQuery && (
              <div className="text-center py-12 sm:py-20 bg-white rounded-lg border border-gray-200 px-4">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {datePosted === "24h" && "No jobs posted in the last 24 hours"}
                  {datePosted === "7d" && "No jobs posted in the last 7 days"}
                  {datePosted === "30d" && "No jobs posted in the last 30 days"}
                  {datePosted === "all" && "No jobs found"}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  {datePosted !== "all"
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
            )}

            {/* Initial State */}
            {!isLoading && jobs.length === 0 && !searchQuery && (
              <div className="text-center py-12 sm:py-20 bg-white rounded-lg border border-gray-200 px-4">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Start searching for jobs</h3>
                <p className="text-sm sm:text-base text-gray-600">Enter keywords to find your next opportunity</p>
              </div>
            )}

            {/* Job Cards */}
            {!isLoading && jobs.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSave={() => handleSaveJob(job.id)}
                    saved={savedJobs.has(job.id)}
                    onView={() => handleViewJob(job.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export { CandidateSearchInterface as SearchInterface }
