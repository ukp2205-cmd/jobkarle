"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Sparkles,
  History,
  Bookmark,
  IndianRupee,
  FileText,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Eye,
} from "lucide-react"
import {
  searchCandidates,
  getRecentSearches,
  saveSearch,
  getSearchFilterOptions,
  getSkillsFromDB,
  getLocationsFromDB,
  type CandidateSearchResult,
} from "@/app/actions/candidate-search-actions"
import { toast } from "@/hooks/use-toast"

interface SearchCandidatesPageProps {
  employerId: string
  jobId?: string
}

export function SearchCandidatesPage({ employerId, jobId }: SearchCandidatesPageProps) {
  const [searchResults, setSearchResults] = useState<CandidateSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<any[]>([])
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
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
    keywords: "",
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
    gender: "",
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
    { value: "", label: "All candidates" },
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
      const result = await getRecentSearches(employerId)
      if (result.success) {
        setRecentSearches(result.recentSearches || [])
        setSavedSearches(result.savedSearches || [])
      }
    } catch (error) {
      console.error("Error loading recent searches:", error)
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
    setSearched(true)
    try {
      const result = await searchCandidates({
        employerId,
        keywords: filters.keywords,
        skills: filters.skills,
        excludeKeywords: filters.excludeKeywords,
        locations: filters.location,
        includeRelocate: filters.includeRelocate,
        experienceMin: filters.experience.min,
        experienceMax: filters.experience.max,
        salaryMin: filters.salary.min,
        salaryMax: filters.salary.max,
        includeSalaryNotMentioned: filters.includeSalaryNotMentioned,
        noticePeriod: filters.noticePeriod,
        education: filters.education,
        industry: filters.industry,
        department: filters.department,
        company: filters.company,
        activeIn: filters.activeIn,
        gender: filters.gender ? [filters.gender] : [],
        diversity: filters.diversity,
        ageMin: filters.ageRange.min,
        ageMax: filters.ageRange.max,
        jobType: filters.jobType,
        employmentType: filters.employmentType,
        showOnly: filters.showOnly,
        displayFilter: filters.displayFilter,
      })

      if (result.success) {
        setSearchResults(result.candidates || [])
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

  const handleSaveSearch = async () => {
    try {
      const result = await saveSearch({
        employerId,
        searchName: filters.keywords || filters.skills.join(", ") || "Untitled Search",
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
      setFilters((prev) => ({ ...prev, keywords: search.keywords }))
    }
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <Search className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Search Candidates</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">Find the perfect talent for your requirements</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                      <Sparkles className="h-3 w-3" />
                      AI-Powered
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Keywords Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Keywords
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter job title, designation, company name..."
                      value={filters.keywords}
                      onChange={(e) => setFilters((prev) => ({ ...prev, keywords: e.target.value }))}
                      className="h-12 pl-4 pr-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>

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

                      {/* Age Range */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Candidate Age</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            placeholder="Min age"
                            value={filters.ageRange.min}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                ageRange: { ...prev.ageRange, min: Number(e.target.value) },
                              }))
                            }
                            className="h-10 w-24"
                            min={18}
                            max={65}
                          />
                          <span className="text-gray-400">to</span>
                          <Input
                            type="number"
                            placeholder="Max age"
                            value={filters.ageRange.max}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                ageRange: { ...prev.ageRange, max: Number(e.target.value) },
                              }))
                            }
                            className="h-10 w-24"
                            min={18}
                            max={65}
                          />
                          <span className="text-sm text-gray-500">Years</span>
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

                      {/* Display Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Display</Label>
                        <Select
                          value={filters.displayFilter}
                          onValueChange={(value) => setFilters((prev) => ({ ...prev, displayFilter: value }))}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {displayFilterOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show Only */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Show only candidates with</Label>
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
                            Verified email ID
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <Checkbox
                              checked={filters.showOnly.includes("attached_resume")}
                              onCheckedChange={() => toggleArrayFilter("showOnly", "attached_resume")}
                            />
                            Attached resume
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active In Filter */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Active in</Label>
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

                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleSaveSearch} className="h-10 bg-transparent">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save Search
                    </Button>
                    <Button
                      onClick={handleSearch}
                      disabled={loading}
                      className="h-10 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search Candidates
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searched && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {loading ? "Searching..." : `${totalResults} candidates found`}
                  </h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <Card className="border-0 shadow-md">
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h4>
                      <p className="text-sm text-gray-500">Try adjusting your search filters</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {searchResults.map((candidate) => (
                      <Card
                        key={candidate.id}
                        className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white"
                      >
                        <CardContent className="p-5">
                          <div className="flex gap-4">
                            {/* Avatar */}
                            <Avatar className="h-16 w-16 border-2 border-gray-100">
                              <AvatarImage src={candidate.profile_picture_url || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                                {getInitials(candidate.full_name || "")}
                              </AvatarFallback>
                            </Avatar>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                                    {candidate.full_name}
                                  </h4>
                                  {candidate.resume_headline && (
                                    <p className="text-sm text-gray-600 line-clamp-1">{candidate.resume_headline}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {candidate.is_mobile_verified && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Info Row */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                {candidate.current_job_title && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-4 w-4 text-gray-400" />
                                    {candidate.current_job_title}
                                    {candidate.company_name && ` at ${candidate.company_name}`}
                                  </span>
                                )}
                                {(candidate.current_city || candidate.current_state) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    {[candidate.current_city, candidate.current_state].filter(Boolean).join(", ")}
                                  </span>
                                )}
                                {candidate.total_experience_years !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    {candidate.total_experience_years}y experience
                                  </span>
                                )}
                                {candidate.preferred_salary && (
                                  <span className="flex items-center gap-1">
                                    <IndianRupee className="h-4 w-4 text-gray-400" />
                                    {candidate.preferred_salary} LPA expected
                                  </span>
                                )}
                              </div>

                              {/* Skills */}
                              {(candidate.skills_for_role?.length > 0 || candidate.skills_you_know?.length > 0) && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {[...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])]
                                    .slice(0, 8)
                                    .map((skill, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs bg-gray-100 text-gray-700"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  {[...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])].length >
                                    8 && (
                                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                                      +
                                      {[...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])]
                                        .length - 8}{" "}
                                      more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View Profile
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                  <Phone className="h-3.5 w-3.5 mr-1" />
                                  Contact
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                  <Mail className="h-3.5 w-3.5 mr-1" />
                                  Email
                                </Button>
                                {candidate.resume_url && (
                                  <Button variant="outline" size="sm" className="h-8 bg-transparent">
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Resume
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Searches */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSearches.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent searches</p>
                ) : (
                  recentSearches.map((search) => (
                    <div key={search.id} className="group">
                      <p className="text-sm font-medium text-gray-900 truncate">{search.keywords || "Untitled"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => fillSearch(search)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Fill this search
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => {
                            fillSearch(search)
                            handleSearch()
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Search profiles
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Saved Searches */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-amber-500" />
                    Saved Searches
                  </CardTitle>
                  {savedSearches.length > 0 && (
                    <button className="text-xs text-blue-600 hover:text-blue-700">View all</button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedSearches.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved searches</p>
                ) : (
                  savedSearches.map((search) => (
                    <div key={search.id} className="group">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {search.search_name || search.keywords || "Untitled"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => fillSearch(search)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Fill this search
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => {
                            fillSearch(search)
                            handleSearch()
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Search profiles
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
