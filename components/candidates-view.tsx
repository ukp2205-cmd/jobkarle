"use client"

import { DialogTitle } from "@/components/ui/dialog"

import { DialogHeader } from "@/components/ui/dialog"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  GraduationCap,
  User,
  ArrowLeft,
  Loader2,
  Search,
  X,
  Mail,
  Phone,
  Building2,
  Calendar,
} from "lucide-react"
import { getJobApplications } from "@/app/actions/job-responses-actions"
import { getAllCandidatesForEmployer } from "@/app/actions/search-candidates-actions"
import { toast } from "@/hooks/use-toast"

interface CandidatesViewProps {
  employerId: string
  searchParams: { [key: string]: string | string[] | undefined }
}

interface Application {
  id: string
  candidate_id: string
  job_id: string
  status: string
  applied_at: string
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
    total_experience_years: number
    total_experience_months?: number
    current_city?: string
    highest_qualification?: string
    resume_headline?: string
  }
  job_postings?: {
    job_title: string
    company_name: string
  }
}

export function CandidatesView({ employerId, searchParams }: CandidatesViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<Application[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Application[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Extract search filters from URL params
  const keywords = searchParams.keywords ? String(searchParams.keywords).split(",") : []
  const skills = searchParams.skills ? String(searchParams.skills).split(",") : []
  const locations = searchParams.locations ? String(searchParams.locations).split(",") : []

  useEffect(() => {
    loadCandidates()
  }, [employerId])

  const loadCandidates = async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading candidates with filters:", { keywords, skills, locations })
      
      // Fetch candidates with filters
      const result = await getAllCandidatesForEmployer(employerId, {
        keywords: keywords.join(","),
        skills: skills.join(","),
        locations: locations.join(","),
        expMin: searchParams.expMin ? String(searchParams.expMin) : undefined,
        expMax: searchParams.expMax ? String(searchParams.expMax) : undefined,
        salaryMin: searchParams.salaryMin ? String(searchParams.salaryMin) : undefined,
        salaryMax: searchParams.salaryMax ? String(searchParams.salaryMax) : undefined,
        education: searchParams.education ? String(searchParams.education) : undefined,
        noticePeriod: searchParams.noticePeriod ? String(searchParams.noticePeriod) : undefined,
      })
      
      if (result.success) {
        console.log("[v0] Loaded candidates:", result.candidates.length)
        setCandidates(result.candidates)
        setFilteredCandidates(result.candidates)
      } else {
        console.error("[v0] Error loading candidates:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to load candidates",
          variant: "destructive",
        })
      }
      
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading candidates:", error)
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const highlightText = (text: string, searchTerms: string[]) => {
    if (!searchTerms.length || !text) return text
    
    let highlighted = text
    searchTerms.forEach((term) => {
      if (term && term.trim()) {
        // Escape special regex characters
        const escapedTerm = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escapedTerm})`, "gi")
        highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 font-semibold px-1 rounded">$1</mark>')
      }
    })
    return highlighted
  }

  const matchesFilters = (candidate: Application["candidate"]) => {
    // Check if candidate matches any of the search keywords or skills
    const allSearchTerms = [...keywords, ...skills]
    
    if (allSearchTerms.length === 0) return true // No filters, show all
    
    const candidateData = [
      candidate.full_name,
      candidate.current_job_title,
      candidate.company_name,
      candidate.resume_headline,
      ...(candidate.skills_for_role || []),
      ...(candidate.skills_you_know || []),
    ].filter(Boolean).join(" ").toLowerCase()
    
    return allSearchTerms.some(term => candidateData.includes(term.toLowerCase()))
  }

  const formatSalary = (salary: string | null) => {
    if (!salary) return "Not specified"
    return `₹${salary} LPA`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
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
                <Link
                  href="/employer/search-candidates"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Search Candidates
                </Link>
              </nav>
            </div>

            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Search Filters Display */}
        {(keywords.length > 0 || skills.length > 0 || locations.length > 0) && (
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Filters:</span>
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Search className="h-3 w-3 mr-1" />
                    {keyword}
                  </Badge>
                ))}
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-blue-100 text-blue-800">
                    {skill}
                  </Badge>
                ))}
                {locations.map((location) => (
                  <Badge key={location} variant="secondary" className="bg-green-100 text-green-800">
                    <MapPin className="h-3 w-3 mr-1" />
                    {location}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Search Results
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Candidates Display */}
        {filteredCandidates.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search filters or browse all candidates
              </p>
              <Button onClick={() => router.push("/employer/search-candidates")}>
                Modify Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-5xl mx-auto space-y-4">
            {filteredCandidates.map((application) => {
              const candidate = application.candidate
              const allSearchTerms = [...keywords, ...skills]
              
              return (
                <Card key={application.id} className="border-0 shadow-md hover:shadow-lg transition-all bg-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Left: Content */}
                      <div className="flex-1">
                        {/* Name as hyperlink */}
                        <Link
                          href={`/employer/candidate-profile/${application.candidate_id}?${new URLSearchParams({ 
                            ...(keywords.length > 0 && { keywords: keywords.join(',') }), 
                            ...(skills.length > 0 && { skills: skills.join(',') })
                          }).toString()}`}
                          className="font-bold text-xl text-blue-600 hover:text-blue-700 hover:underline inline-block mb-2"
                        >
                          {candidate.full_name}
                        </Link>

                        {/* Current Job & Company */}
                        {candidate.current_job_title && (
                          <div className="flex items-center gap-2 text-gray-700 mb-3">
                            <Briefcase className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium" dangerouslySetInnerHTML={{ 
                              __html: highlightText(
                                `${candidate.current_job_title}${candidate.company_name ? ` at ${candidate.company_name}` : ''}`,
                                allSearchTerms
                              ) 
                            }} />
                          </div>
                        )}

                        {/* Key Details */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            <span>{candidate.total_experience_years || 0} years exp</span>
                          </div>
                          {candidate.current_city && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span dangerouslySetInnerHTML={{ 
                                __html: highlightText(candidate.current_city, locations) 
                              }} />
                            </div>
                          )}
                          {candidate.notice_period && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{candidate.notice_period}</span>
                            </div>
                          )}
                          {candidate.preferred_salary && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <IndianRupee className="h-4 w-4 text-gray-400" />
                              <span>{formatSalary(candidate.preferred_salary)}</span>
                            </div>
                          )}
                        </div>

                        {/* Education */}
                        {candidate.highest_qualification && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
                            <span>{candidate.highest_qualification}</span>
                          </div>
                        )}

                        {/* Skills */}
                        {(candidate.skills_for_role || candidate.skills_you_know) && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 mb-2">KEY SKILLS</p>
                            <div className="flex flex-wrap gap-1.5">
                              {[...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])]
                                .slice(0, 8)
                                .map((skill, idx) => {
                                  const isMatched = allSearchTerms.some(term => skill.toLowerCase().includes(term.toLowerCase()))
                                  return (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className={isMatched ? "bg-yellow-200 text-yellow-900 font-semibold text-xs" : "bg-gray-100 text-gray-700 text-xs"}
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                })}
                            </div>
                          </div>
                        )}

                        {/* Job Applied */}
                        {application.job_postings && (
                          <div className="pt-3 border-t">
                            <p className="text-xs text-gray-500">Applied for:</p>
                            <p className="text-sm font-medium text-blue-600">
                              {application.job_postings.job_title}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Profile Image & Contact */}
                      <div className="w-48 flex flex-col items-center text-center">
                        <Avatar className="h-32 w-32 mb-4 ring-2 ring-gray-200">
                          <AvatarImage src="/placeholder.svg" alt={candidate.full_name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                            {candidate.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Resume Headline */}
                        {candidate.resume_headline && (
                          <p className="text-sm text-gray-700 font-medium mb-4 line-clamp-3" dangerouslySetInnerHTML={{ 
                            __html: highlightText(candidate.resume_headline, allSearchTerms) 
                          }} />
                        )}

                        {/* Mobile Number */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">{candidate.mobile_number}</span>
                        </div>

                        {/* Email */}
                        <div className="text-xs text-gray-500 mb-4 break-all">
                          {candidate.email}
                        </div>

                        {/* View Profile Button */}
                        <Link href={`/employer/candidate-profile/${application.candidate_id}?${new URLSearchParams({ 
                          ...(keywords.length > 0 && { keywords: keywords.join(',') }), 
                          ...(skills.length > 0 && { skills: skills.join(',') })
                        }).toString()}`} className="w-full">
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
