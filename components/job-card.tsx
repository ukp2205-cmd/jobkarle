"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Briefcase, DollarSign, Clock, Bookmark, BookmarkCheck } from "lucide-react"
import { getTimeAgo } from "@/lib/time-utils"

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
  urgent_hiring?: boolean
  company_logo_url?: string
  employer_logo_url?: string
  employers?: { logo_url?: string }
}

interface JobCardProps {
  job: Job
  onSave: () => void
  saved: boolean
  onView: () => void
}

export default function JobCard({ job, onSave, saved, onView }: JobCardProps) {
  const getSalaryString = (min: number, max: number) => {
    if (!min && !max) return "Not disclosed"
    const minLPA = min / 100000
    const maxLPA = max / 100000
    if (min && max) return `₹${minLPA.toFixed(0)}-${maxLPA.toFixed(0)} LPA`
    if (min) return `₹${minLPA.toFixed(0)}+ LPA`
    return "Not disclosed"
  }

  const getLocationString = (locations: string[]) => {
    if (!locations || locations.length === 0) return "Not specified"
    if (locations.length === 1) return locations[0]
    if (locations.length === 2) return locations.join(", ")
    return `${locations[0]}, ${locations[1]} +${locations.length - 2}`
  }

  const getCompanyLogo = () => {
    // Priority 1: Job-specific company logo
    if (job.company_logo_url) {
      return job.company_logo_url
    }
    // Priority 2: Employer's logo from employers table
    if (job.employer_logo_url) {
      return job.employer_logo_url
    }
    // Priority 3: Employer logo from joined employers object
    if (job.employers?.logo_url) {
      return job.employers.logo_url
    }
    // Default: JobKarle logo as fallback
    return "/jobkarle-logo.png"
  }

  const getCompanyInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isPremium = job.category === "premium"
  const showUrgentHiring = isPremium && job.urgent_hiring

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-shadow bg-white border relative ${isPremium ? "border-blue-200" : "border-gray-200"}`}
    >
      {isPremium && (
        <div className="absolute left-0 top-0 z-[5]">
          <div className="relative">
            {/* Corner triangle background - much smaller on mobile */}
            <svg width="24" height="24" viewBox="0 0 48 48" className="drop-shadow-lg sm:w-12 sm:h-12">
              <path d="M 0 0 L 48 0 L 0 48 Z" fill="url(#cornerGradientCard)" />
              <defs>
                <linearGradient id="cornerGradientCard" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93C5FD" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
              </defs>
            </svg>
            {/* Gold diamond icon on corner - much smaller on mobile */}
            <div className="absolute left-0.5 top-0.5 sm:left-1 sm:top-1">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="sm:w-[25px] sm:h-[25px]">
                <path d="M10 1L5 6L10 19L15 6L10 1Z" fill="url(#goldDiamondGradient)" />
                <path d="M10 1L7 6H13L10 1Z" fill="#FEF3C7" opacity="0.9" />
                <ellipse cx="9" cy="4" rx="2" ry="1.2" fill="white" opacity="0.95" />
                <defs>
                  <linearGradient
                    id="goldDiamondGradient"
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

      {showUrgentHiring && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg z-10">
          URGENT HIRING
        </div>
      )}

      {job.created_at && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{getTimeAgo(job.created_at)}</span>
        </div>
      )}

      <div className={`p-4 sm:p-6 ${isPremium ? "pl-8 sm:pl-6" : ""}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-gray-200 flex-shrink-0">
              <AvatarImage src={getCompanyLogo() || "/placeholder.svg"} alt={job.company_name} />
              <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                {getCompanyInitials(job.company_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 leading-tight sm:leading-normal break-words">
                {job.job_title}
              </h3>
              <p className="text-xs sm:text-base text-gray-600 mb-2 truncate">{job.company_name}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {getLocationString(job.job_locations)}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {job.min_experience || 0} - {job.max_experience || 0} years
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {getSalaryString(job.min_salary, job.max_salary)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-start">
            <Button variant="ghost" size="sm" onClick={onSave} className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-gray-100">
              {saved ? (
                <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0277bd]" />
              ) : (
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {isPremium && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300 font-semibold">
              ⭐ PREMIUM
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {job.employment_type}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
            {job.work_mode}
          </Badge>
          {job.openings && (
            <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              {job.openings} {job.openings === 1 ? "opening" : "openings"}
            </Badge>
          )}
        </div>

        {job.required_skills && job.required_skills.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {job.required_skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
                  {skill}
                </Badge>
              ))}
              {job.required_skills.length > 5 && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
                  +{job.required_skills.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 sm:pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button
              onClick={onView}
              variant="outline"
              className="flex-1 sm:flex-none h-8 sm:h-9 px-4 sm:px-6 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm bg-transparent"
            >
              View Details
            </Button>
            <Button className="flex-1 sm:flex-none h-8 sm:h-9 px-4 sm:px-6 bg-[#0277bd] hover:bg-[#01579b] text-white text-xs sm:text-sm">
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
