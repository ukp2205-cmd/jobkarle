"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, Briefcase, IndianRupee, ChevronDown, ChevronUp, ArrowLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getJobsByIndustry, type JobsByIndustry } from "@/app/actions/jobs-actions"
import { getTimeAgo } from "@/lib/time-utils"

export default function JobsPage() {
  const [jobsByIndustry, setJobsByIndustry] = useState<JobsByIndustry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    const result = await getJobsByIndustry()
    if (result.success) {
      setJobsByIndustry(result.jobsByIndustry)
      // Expand first 3 industries by default
      const firstThree = new Set(result.jobsByIndustry.slice(0, 3).map((item) => item.industry))
      setExpandedIndustries(firstThree)
    }
    setLoading(false)
  }

  const toggleIndustry = (industry: string) => {
    setExpandedIndustries((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(industry)) {
        newSet.delete(industry)
      } else {
        newSet.add(industry)
      }
      return newSet
    })
  }

  const totalJobs = jobsByIndustry.reduce((sum, item) => sum + item.jobs.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">JK</span>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobKarle
              </span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse Jobs by Industry</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {loading ? "Loading jobs..." : `${totalJobs} jobs across ${jobsByIndustry.length} industries`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : jobsByIndustry.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs available</h3>
            <p className="text-sm text-gray-600 mb-4">Check back later for new opportunities</p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobsByIndustry.map((industryGroup) => (
              <div key={industryGroup.industry} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Industry Header */}
                <button
                  onClick={() => toggleIndustry(industryGroup.industry)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">{industryGroup.industry}</h2>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {industryGroup.jobs.length} {industryGroup.jobs.length === 1 ? "job" : "jobs"} available
                      </p>
                    </div>
                  </div>
                  {expandedIndustries.has(industryGroup.industry) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Jobs List */}
                {expandedIndustries.has(industryGroup.industry) && (
                  <div className="border-t border-gray-200 divide-y divide-gray-200">
                    {industryGroup.jobs.map((job) => (
                      <div
                        key={job.id}
                        className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors relative overflow-visible ${
                          job.category === "premium" ? "border-blue-200" : "bg-white"
                        }`}
                      >
                        {job.category === "premium" && (
                          <div className="absolute left-0 top-0 z-[5]">
                            <div className="relative">
                              {/* Corner triangle background */}
                              <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
                                <path d="M 0 0 L 48 0 L 0 48 Z" fill="url(#cornerGradientJobs)" />
                                <defs>
                                  <linearGradient id="cornerGradientJobs" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#1D4ED8" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="absolute left-1 top-1">
                                <svg width="25" height="25" viewBox="0 0 20 20" fill="none">
                                  <path d="M10 1L5 6L10 19L15 6L10 1Z" fill="url(#goldDiamondGradientJobs)" />
                                  <path d="M10 1L7 6H13L10 1Z" fill="#FEF3C7" opacity="0.9" />
                                  <ellipse cx="9" cy="4" rx="2" ry="1.2" fill="white" opacity="0.95" />
                                  <defs>
                                    <linearGradient
                                      id="goldDiamondGradientJobs"
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

                        <Link href={`/candidate/jobs/${job.id}`} className="block">
                          <div className="flex items-start gap-3">
                            {/* Main job content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                  {job.job_title}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{job.company_name}</p>
                              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="break-words">
                                    {job.job_locations.length > 0 ? job.job_locations.join(", ") : "Not specified"}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  {job.min_experience} - {job.max_experience} years
                                </span>
                                {job.min_salary > 0 && (
                                  <span className="flex items-center gap-1 whitespace-nowrap">
                                    <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                    {job.min_salary}L - {job.max_salary}L
                                  </span>
                                )}
                              </div>
                              {/* Skills display section */}
                              {job.required_skills && job.required_skills.length > 0 && (
                                <div className="mt-3 mb-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {job.required_skills.slice(0, 5).map((skill: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {job.required_skills.length > 5 && (
                                      <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200">
                                        +{job.required_skills.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {job.employment_type && (
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                    {job.employment_type}
                                  </span>
                                )}
                                {job.work_mode && (
                                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                    {job.work_mode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>

                        {job.created_at && (
                          <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(job.created_at)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
