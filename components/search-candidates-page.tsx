"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Briefcase,
  Search,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  GraduationCap,
  Users,
  X,
  History,
  Bookmark,
  IndianRupee,
  FileText,
  Building2,
  Loader2,
} from "lucide-react"
import {
  getRecentSearches,
  saveSearch,
  getSearchFilterOptions,
  getSkillsFromDB,
  getLocationsFromDB,
  searchCandidates, // Declare the searchCandidates variable
} from "@/app/actions/candidate-search-actions"
import { toast } from "@/hooks/use-toast"

interface SearchCandidatesPageProps {
  employerId: string
  jobId?: string
}

export function SearchCandidatesPage({ employerId, jobId }: SearchCandidatesPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<any[]>([])
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(true)

  // Dynamic filter options from database
  const [filterOptions, setFilterOptions] = useState<{
    skills: any[]
    cities: any[]
    states: any[]
    industries: any[]
    departments: any[]
    qualifications: any[]
  }>({
    skills: [],
    cities: [],
    states: [],
    industries: [],
    departments: [],
    qualifications: [],
  })

  // Skill suggestions
  const [skillSuggestions, setSkillSuggestions] = useState<any[]>([])
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)

  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  // Search Filters State
  const [filters, setFilters] = useState({
    keywords: [] as string[], // Changed to array for multiple keywords
    keywordInput: "", // Added input field for keywords
    skills: [] as string[],
    skillInput: "",
    excludeKeywords: "",
    location: [] as string[],
    locationInput: "",
    includeRelocate: true,
    excludeAnywhere: false,
    experience: { min: 0, max: 30 },
    salary: { min: 0, max: 100 },
    includeSalaryNotMentioned: true,
    noticePeriod: [] as string[],
    education: [] as string[],
    industry: [] as string[],
    department: [] as string[],
    company: "",
    activeIn: "6months",
    gender: "all",
    diversity: [] as string[],
    ageRange: { min: 18, max: 65 },
    jobType: [] as string[],
    employmentType: [] as string[],
    workPermit: "",
    displayFilter: "all",
    showOnly: [] as string[],
  })

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    keywords: true,
    location: true,
    salary: true,
    employment: false,
    education: false,
    diversity: false,
  })

  // Static options
  const noticePeriodOptions = ["Immediate", "15 days", "1 month", "2 months", "3 months", "More than 3 months"]

  const genderOptions = [
    { value: "all", label: "All candidates" },
    { value: "Male", label: "Male candidates" },
    { value: "Female", label: "Female candidates" },
  ]

  const diversityOptions = ["Person with Disabilities", "LGBTQ+", "Veterans"]

  const jobTypeOptions = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"]

  const employmentTypeOptions = ["Permanent", "Temporary", "Contractual"]

  const activeInOptions = [
    { value: "1month", label: "1 month" },
    { value: "3months", label: "3 months" },
    { value: "6months", label: "6 months" },
    { value: "1year", label: "1 year" },
    { value: "all", label: "All time" },
  ]

  const displayFilterOptions = [
    { value: "all", label: "All candidates" },
    { value: "new_registrations", label: "New registrations" },
    { value: "modified", label: "Modified candidates" },
  ]

  // Load filter options from database
  useEffect(() => {
    loadFilterOptions()
    loadRecentSearches()
  }, [])

  const loadFilterOptions = async () => {
    setLoadingFilters(true)
    try {
      const result = await getSearchFilterOptions()
      if (result.success) {
        setFilterOptions({
          skills: result.skills || [],
          cities: result.cities || [],
          states: result.states || [],
          industries: result.industries || [],
          departments: result.departments || [],
          qualifications: result.qualifications || [],
        })
      }
    } catch (error) {
      console.error("Error loading filter options:", error)
    } finally {
      setLoadingFilters(false)
    }
  }

  const loadRecentSearches = async () => {
    try {
      console.log("[v0] Loading recent searches for employer:", employerId)
      const result = await getRecentSearches(employerId)
      console.log("[v0] Recent searches result:", result)
      if (result.success) {
        console.log("[v0] Recent searches count:", result.recentSearches?.length || 0)
        console.log("[v0] Saved searches count:", result.savedSearches?.length || 0)
        setRecentSearches(result.recentSearches || [])
        setSavedSearches(result.savedSearches || [])
      }
    } catch (error) {
      console.error("[v0] Error loading recent searches:", error)
    }
  }

  // Debounced skill search
  const searchSkills = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSkillSuggestions([])
      setShowSkillSuggestions(false)
      return
    }

    const result = await getSkillsFromDB(query)
    if (result.success) {
      setSkillSuggestions(result.skills)
      setShowSkillSuggestions(true)
    }
  }, [])

  // Debounced location search
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
      return
    }

    const result = await getLocationsFromDB(query)
    if (result.success) {
      const combined = [
        ...(result.cities || []).map((c: any) => ({ ...c, type: "city" })),
        ...(result.states || []).map((s: any) => ({ ...s, type: "state" })),
      ]
      setLocationSuggestions(combined)
      setShowLocationSuggestions(true)
    }
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    try {
      // Build search params
      const searchParams = new URLSearchParams()

      if (filters.keywords.length > 0) searchParams.set("keywords", filters.keywords.join(","))
      if (filters.skills.length > 0) searchParams.set("skills", filters.skills.join(","))
      if (filters.excludeKeywords) searchParams.set("excludeKeywords", filters.excludeKeywords)
      if (filters.location.length > 0) searchParams.set("locations", filters.location.join(","))
      if (filters.includeRelocate) searchParams.set("includeRelocate", "true")
      if (filters.experience.min > 0) searchParams.set("expMin", String(filters.experience.min))
      if (filters.experience.max < 30) searchParams.set("expMax", String(filters.experience.max))
      if (filters.salary.min > 0) searchParams.set("salaryMin", String(filters.salary.min))
      if (filters.salary.max < 100) searchParams.set("salaryMax", String(filters.salary.max))
      if (filters.noticePeriod.length > 0) searchParams.set("noticePeriod", filters.noticePeriod.join(","))
      if (filters.education.length > 0) searchParams.set("education", filters.education.join(","))
      if (filters.industry.length > 0) searchParams.set("industry", filters.industry.join(","))
      if (filters.department.length > 0) searchParams.set("department", filters.department.join(","))
      if (filters.company) searchParams.set("company", filters.company)
      if (filters.activeIn !== "6months") searchParams.set("activeIn", filters.activeIn)
      if (filters.gender && filters.gender !== "all") searchParams.set("gender", filters.gender)
      if (filters.diversity.length > 0) searchParams.set("diversity", filters.diversity.join(","))
      if (filters.jobType.length > 0) searchParams.set("jobType", filters.jobType.join(","))
      if (filters.employmentType.length > 0) searchParams.set("employmentType", filters.employmentType.join(","))
      if (filters.showOnly.length > 0) searchParams.set("showOnly", filters.showOnly.join(","))

      // Auto-save to recent searches with comprehensive name
      let searchName = "Search"
      const nameParts: string[] = []
      
      if (filters.keywords.length > 0) {
        nameParts.push(filters.keywords.join(", "))
      }
      if (filters.skills.length > 0) {
        nameParts.push(`Skills: ${filters.skills.slice(0, 2).join(", ")}${filters.skills.length > 2 ? "..." : ""}`)
      }
      if (filters.location.length > 0) {
        nameParts.push(`Location: ${filters.location.slice(0, 2).join(", ")}${filters.location.length > 2 ? "..." : ""}`)
      }
      if (filters.experience.min > 0 || filters.experience.max < 30) {
        nameParts.push(`Exp: ${filters.experience.min}-${filters.experience.max}y`)
      }
      if (filters.salary.min > 0 || filters.salary.max < 100) {
        nameParts.push(`Salary: ${filters.salary.min}-${filters.salary.max}L`)
      }
      if (filters.education.length > 0) {
        nameParts.push(`Edu: ${filters.education.join(", ")}`)
      }
      
      searchName = nameParts.length > 0 ? nameParts.join(" | ") : "All Candidates"
      
      console.log("[v0] Saving search with name:", searchName, "filters:", filters)
      const saveResult = await saveSearch({
        employerId,
        searchName,
        filters,
      })
      console.log("[v0] Save search result:", saveResult)
      
      // Reload recent searches to show the latest
      await loadRecentSearches()

      // Navigate to candidates page with search filters
      router.push(`/employer/candidates?${searchParams.toString()}`)
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: "An error occurred while searching",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleSaveSearch = async () => {
    try {
      const result = await saveSearch({
        employerId,
        searchName: filters.keywords.join(", ") || filters.skills.join(", ") || "Untitled Search",
        filters,
      })
      if (result.success) {
        toast({
          title: "Search Saved",
          description: "Your search has been saved successfully",
        })
        loadRecentSearches()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      })
    }
  }

  const fillSearch = (search: any) => {
    if (search.filters) {
      setFilters(search.filters)
    }
    if (search.keywords) {
      // Handle both string and array formats for backward compatibility
      const keywordsArray = Array.isArray(search.keywords) ? search.keywords : [search.keywords]
      setFilters((prev) => ({ ...prev, keywords: keywordsArray }))
    }
  }

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !filters.keywords.includes(keyword.trim())) {
      setFilters((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()],
        keywordInput: "",
      }))
    }
  }

  const removeKeyword = (keyword: string) => {
    setFilters((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }))
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !filters.skills.includes(skill.trim())) {
      setFilters((prev) => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
        skillInput: "",
      }))
    }
    setShowSkillSuggestions(false)
  }

  const removeSkill = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const addLocation = (loc: string) => {
    if (loc && !filters.location.includes(loc)) {
      setFilters((prev) => ({
        ...prev,
        location: [...prev.location, loc],
        locationInput: "",
      }))
    }
    setShowLocationSuggestions(false)
  }

  const removeLocation = (loc: string) => {
    setFilters((prev) => ({
      ...prev,
      location: prev.location.filter((l) => l !== loc),
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleArrayFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const arr = prev[key] as string[]
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter((v) => v !== value) }
      }
      return { ...prev, [key]: [...arr, value] }
    })
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
                <div className="relative">
                  <span className="px-4 py-2 text-sm font-medium text-gray-900 bg-blue-50 rounded-md flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    Search Candidates
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
                    <Link
                      href="/employer/dashboard"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
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

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Search Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Header Card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Search Candidates</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Find the perfect talent for your requirements</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Keywords Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Keywords (Press Enter to add)
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter keyword and press Enter (e.g. java, developer, engineer)..."
                      value={filters.keywordInput}
                      onChange={(e) => setFilters((prev) => ({ ...prev, keywordInput: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addKeyword(filters.keywordInput)
                        }
                      }}
                      className="h-12 pl-4 pr-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  
                  {/* Selected Keywords */}
                  {filters.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filters.keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                          onClick={() => removeKeyword(keyword)}
                        >
                          {keyword}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Skills Input with Autocomplete */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Skills</Label>
                    <div className="relative">
                      <Input
                        placeholder="Type skill name to search..."
                        value={filters.skillInput}
                        onChange={(e) => {
                          setFilters((prev) => ({ ...prev, skillInput: e.target.value }))
                          searchSkills(e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addSkill(filters.skillInput)
                          }
                        }}
                        onFocus={() => filters.skillInput.length >= 2 && setShowSkillSuggestions(true)}
                        className="h-10"
                      />
                      {/* Skill Suggestions Dropdown */}
                      {showSkillSuggestions && skillSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {skillSuggestions.map((skill) => (
                            <button
                              key={skill.id}
                              onClick={() => addSkill(skill.skill_name)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between"
                            >
                              <span>{skill.skill_name}</span>
                              {skill.category && <span className="text-xs text-gray-400">{skill.category}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Selected Skills */}
                    {filters.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {filters.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                            onClick={() => removeSkill(skill)}
                          >
                            {skill}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exclude Keywords */}
                  <Input
                    placeholder="Exclude keywords (comma separated)"
                    value={filters.excludeKeywords}
                    onChange={(e) => setFilters((prev) => ({ ...prev, excludeKeywords: e.target.value }))}
                    className="h-10 text-sm border-gray-200 rounded-lg"
                  />
                </div>

                {/* Experience Section */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-500" />
                    Experience (Years)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.experience.min}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          experience: { ...prev.experience, min: Number(e.target.value) },
                        }))
                      }
                      className="h-10 w-24"
                      min={0}
                      max={30}
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.experience.max}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          experience: { ...prev.experience, max: Number(e.target.value) },
                        }))
                      }
                      className="h-10 w-24"
                      min={0}
                      max={30}
                    />
                    <span className="text-sm text-gray-500">Years</span>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-3 pt-2 border-t">
                  <button
                    onClick={() => toggleSection("location")}
                    className="w-full flex items-center justify-between py-2"
                  >
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
                      <MapPin className="h-4 w-4 text-green-500" />
                      Current Location of Candidate
                      {filters.location.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                          {filters.location.length}
                        </Badge>
                      )}
                    </Label>
                    {expandedSections.location ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.location && (
                    <div className="space-y-3 pl-6">
                      {/* Location Input with Autocomplete */}
                      <div className="relative">
                        <Input
                          placeholder="Add location..."
                          value={filters.locationInput}
                          onChange={(e) => {
                            setFilters((prev) => ({ ...prev, locationInput: e.target.value }))
                            searchLocations(e.target.value)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addLocation(filters.locationInput)
                            }
                          }}
                          onFocus={() => filters.locationInput.length >= 2 && setShowLocationSuggestions(true)}
                          className="h-10 text-sm"
                        />
                        {/* Location Suggestions Dropdown */}
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {locationSuggestions.map((loc) => (
                              <button
                                key={loc.id}
                                onClick={() => addLocation(loc.name)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 flex items-center justify-between"
                              >
                                <span>{loc.name}</span>
                                <span className="text-xs text-gray-400 capitalize">{loc.type}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Select Cities */}
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.cities.slice(0, 7).map((city) => (
                          <Button
                            key={city.id}
                            variant={filters.location.includes(city.name) ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              filters.location.includes(city.name) ? removeLocation(city.name) : addLocation(city.name)
                            }
                            className={`text-xs ${
                              filters.location.includes(city.name)
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {city.name}
                          </Button>
                        ))}
                      </div>

                      {/* Selected Locations */}
                      {filters.location.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {filters.location.map((loc) => (
                            <Badge
                              key={loc}
                              className="px-2 py-1 bg-green-100 text-green-700 cursor-pointer hover:bg-green-200"
                              onClick={() => removeLocation(loc)}
                            >
                              {loc}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Location Preferences */}
                      <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <Checkbox
                            checked={filters.includeRelocate}
                            onCheckedChange={(checked) =>
                              setFilters((prev) => ({ ...prev, includeRelocate: checked as boolean }))
                            }
                          />
                          Include candidates who prefer to relocate to above locations
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <Checkbox
                            checked={filters.excludeAnywhere}
                            onCheckedChange={(checked) =>
                              setFilters((prev) => ({ ...prev, excludeAnywhere: checked as boolean }))
                            }
                          />
                          Exclude candidates who have mentioned Anywhere in India
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Salary Section */}
                <div className="space-y-3 pt-2 border-t">
                  <button
                    onClick={() => toggleSection("salary")}
                    className="w-full flex items-center justify-between py-2"
                  >
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
                      <IndianRupee className="h-4 w-4 text-amber-500" />
                      Annual Salary
                    </Label>
                    {expandedSections.salary ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.salary && (
                    <div className="space-y-4 pl-6">
                      <div className="flex items-center gap-4">
                        <Select defaultValue="INR">
                          <SelectTrigger className="w-20 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Min salary"
                          value={filters.salary.min || ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              salary: { ...prev.salary, min: Number(e.target.value) },
                            }))
                          }
                          className="h-10 flex-1"
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                          type="number"
                          placeholder="Max salary"
                          value={filters.salary.max || ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              salary: { ...prev.salary, max: Number(e.target.value) },
                            }))
                          }
                          className="h-10 flex-1"
                        />
                        <span className="text-sm text-gray-500">Lacs</span>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <Checkbox
                          checked={filters.includeSalaryNotMentioned}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({ ...prev, includeSalaryNotMentioned: checked as boolean }))
                          }
                        />
                        Include candidates who did not mention their current salary
                      </label>
                    </div>
                  )}
                </div>

                {/* Employment Details Section */}
                <div className="space-y-3 pt-2 border-t">
                  <button
                    onClick={() => toggleSection("employment")}
                    className="w-full flex items-center justify-between py-2"
                  >
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      Employment Details
                    </Label>
                    {expandedSections.employment ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.employment && (
                    <div className="space-y-4 pl-6">
                      {/* Department */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Department</Label>
                        <Select
                          value={filters.department[0] || ""}
                          onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, department: value ? [value] : [] }))
                          }
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {filterOptions.departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.department_name}>
                                {dept.department_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Industry */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Industry</Label>
                        <Select
                          value={filters.industry[0] || ""}
                          onValueChange={(value) => setFilters((prev) => ({ ...prev, industry: value ? [value] : [] }))}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {filterOptions.industries.map((ind) => (
                              <SelectItem key={ind.id} value={ind.name}>
                                {ind.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Company */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Company</Label>
                        <Input
                          placeholder="Enter company name"
                          value={filters.company}
                          onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))}
                          className="h-10"
                        />
                      </div>

                      {/* Notice Period */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Notice Period</Label>
                        <div className="flex flex-wrap gap-2">
                          {noticePeriodOptions.map((period) => (
                            <Button
                              key={period}
                              variant={filters.noticePeriod.includes(period) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleArrayFilter("noticePeriod", period)}
                              className={`text-xs ${
                                filters.noticePeriod.includes(period)
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {period}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Education Section */}
                <div className="space-y-3 pt-2 border-t">
                  <button
                    onClick={() => toggleSection("education")}
                    className="w-full flex items-center justify-between py-2"
                  >
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
                      <GraduationCap className="h-4 w-4 text-emerald-500" />
                      Education Details
                    </Label>
                    {expandedSections.education ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.education && (
                    <div className="space-y-4 pl-6">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Highest Qualification</Label>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.qualifications.map((qual) => (
                            <Button
                              key={qual.id}
                              variant={filters.education.includes(qual.level) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleArrayFilter("education", qual.level)}
                              className={`text-xs ${
                                filters.education.includes(qual.level)
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {qual.level}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Diversity Section */}
                <div className="space-y-3 pt-2 border-t">
                  <button
                    onClick={() => toggleSection("diversity")}
                    className="w-full flex items-center justify-between py-2"
                  >
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4 text-pink-500" />
                      Diversity and Additional Details
                    </Label>
                    {expandedSections.diversity ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.diversity && (
                    <div className="space-y-4 pl-6">
                      {/* Gender */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Gender</Label>
                        <Select
                          value={filters.gender}
                          onValueChange={(value) => setFilters((prev) => ({ ...prev, gender: value }))}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="All candidates" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Diversity */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Diversity Details</Label>
                        <div className="space-y-2">
                          {diversityOptions.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                              <Checkbox
                                checked={filters.diversity.includes(opt)}
                                onCheckedChange={() => toggleArrayFilter("diversity", opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Job Type */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Job Type Seeking</Label>
                        <div className="flex flex-wrap gap-2">
                          {jobTypeOptions.map((type) => (
                            <Button
                              key={type}
                              variant={filters.jobType.includes(type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleArrayFilter("jobType", type)}
                              className={`text-xs ${
                                filters.jobType.includes(type) ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-gray-100"
                              }`}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Employment Type */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Employment Type</Label>
                        <div className="flex flex-wrap gap-2">
                          {employmentTypeOptions.map((type) => (
                            <Button
                              key={type}
                              variant={filters.employmentType.includes(type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleArrayFilter("employmentType", type)}
                              className={`text-xs ${
                                filters.employmentType.includes(type)
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Show Only */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Show Only</Label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <Checkbox
                              checked={filters.showOnly.includes("verified_mobile")}
                              onCheckedChange={() => toggleArrayFilter("showOnly", "verified_mobile")}
                            />
                            Verified mobile number
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <Checkbox
                              checked={filters.showOnly.includes("verified_email")}
                              onCheckedChange={() => toggleArrayFilter("showOnly", "verified_email")}
                            />
                            Verified email
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <Checkbox
                              checked={filters.showOnly.includes("has_resume")}
                              onCheckedChange={() => toggleArrayFilter("showOnly", "has_resume")}
                            />
                            Resume attached
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active In Filter */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Active in</span>
                      <Select
                        value={filters.activeIn}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, activeIn: value }))}
                      >
                        <SelectTrigger className="w-32 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activeInOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Search Candidates
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveSearch}
                    className="h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50 bg-transparent"
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Recent & Saved Searches */}
          <div className="space-y-6">
            {/* Recent Searches */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentSearches.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent searches</p>
                ) : (
                  recentSearches.slice(0, 3).map((search) => (
                    <div
                      key={search.id}
                      className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer group"
                      onClick={async () => {
                        console.log("[v0] Executing recent search with saved filters:", search.filters)
                        // Fill the form first for visual feedback
                        fillSearch(search)
                        
                        // Execute search immediately with the saved filters (not the state)
                        setLoading(true)
                        try {
                          const result = await searchCandidates({
                            employerId,
                            ...search.filters,
                          })
                          
                          console.log("[v0] Search completed. Results:", result.candidates?.length)
                          
                          if (result.success && result.candidates) {
                            router.push(`/employer/search-candidates/results?candidateIds=${result.candidates.map((c: any) => c.id).join(",")}`)
                          } else {
                            toast({
                              title: "No Results",
                              description: "No candidates found matching your criteria",
                            })
                          }
                        } catch (error) {
                          console.error("[v0] Search error:", error)
                          toast({
                            title: "Search Failed",
                            description: "An error occurred while searching",
                            variant: "destructive",
                          })
                        } finally {
                          setLoading(false)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {search.search_name || search.keywords || "Search"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(search.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        <Search className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </div>
                      {search.filters && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {search.filters.skills?.slice(0, 2).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs px-1.5 py-0 bg-blue-100 text-blue-600">
                              {skill}
                            </Badge>
                          ))}
                          {search.filters.location?.slice(0, 1).map((loc: string) => (
                            <Badge key={loc} variant="secondary" className="text-xs px-1.5 py-0 bg-green-100 text-green-600">
                              <MapPin className="h-2.5 w-2.5 mr-0.5" />
                              {loc}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Saved Searches */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-amber-500" />
                    Saved Searches
                  </CardTitle>
                  {savedSearches.length > 0 && <span className="text-xs text-gray-500">View all</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedSearches.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No saved searches</p>
                ) : (
                  savedSearches.slice(0, 5).map((search) => (
                    <div
                      key={search.id}
                      className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{search.keywords || "Saved Search"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => fillSearch(search)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Fill this search
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
