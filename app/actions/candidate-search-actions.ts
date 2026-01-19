"use server"

import { createServerClient } from "@/lib/supabase/server"

type SearchFilters = {
  locations?: string[]
  minExperience?: number
  maxExperience?: number
  minSalary?: number
  maxSalary?: number
  employmentTypes?: string[]
  workModes?: string[]
  datePosted?: "24h" | "7d" | "30d" | "all"
}

export async function searchJobs(query: string, filters: SearchFilters = {}, candidateId?: string) {
  try {
    const supabase = await createServerClient()

    let blockedEmployerIds: string[] = []
    if (candidateId) {
      const { data: blockedEmployers } = await supabase
        .from("blocked_employers")
        .select("employer_id")
        .eq("candidate_id", candidateId)

      if (blockedEmployers && blockedEmployers.length > 0) {
        blockedEmployerIds = blockedEmployers.map((blocked) => blocked.employer_id).filter(Boolean)
        console.log("[v0] Filtering out", blockedEmployerIds.length, "blocked employers")
      }
    }

    const queryBuilder = supabase
      .from("job_postings")
      .select("*, category, urgent_hiring, company_logo_url, employers!job_postings_employer_id_fkey(logo_url)")
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (filters.datePosted && filters.datePosted !== "all") {
      const now = new Date()
      let cutoffDate: Date

      if (filters.datePosted === "24h") {
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      } else if (filters.datePosted === "7d") {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (filters.datePosted === "30d") {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      } else {
        cutoffDate = new Date(0) // All time
      }

      queryBuilder.gte("created_at", cutoffDate.toISOString())
      console.log("[v0] Date posted filter applied:", filters.datePosted, "cutoff:", cutoffDate.toISOString())
    }

    const { data: jobs, error } = await queryBuilder.limit(200)

    if (error) {
      console.error("[v0] Error searching jobs:", error)
      return { success: false, error: error.message, jobs: [] }
    }

    let filteredJobs = jobs || []

    if (blockedEmployerIds.length > 0) {
      const beforeCount = filteredJobs.length
      filteredJobs = filteredJobs.filter((job) => {
        return !job.employer_id || !blockedEmployerIds.includes(job.employer_id)
      })
      console.log(
        "[v0] After blocked employer filter:",
        filteredJobs.length,
        "jobs (filtered out:",
        beforeCount - filteredJobs.length,
        ")",
      )
    }

    console.log("[v0] Total jobs fetched from database:", filteredJobs.length)

    if (query.trim()) {
      const beforeCount = filteredJobs.length
      const keyword = query.toLowerCase().trim()

      console.log("[v0] STEP 1 - Searching for keyword:", keyword)

      // Add relevance scores to each job
      const jobsWithScores = filteredJobs.map((job) => {
        let score = 0
        const matchedIn: string[] = []

        // Job title matching (highest priority - score 100)
        const matchesJobTitle = job.job_title?.toLowerCase().includes(keyword)
        if (matchesJobTitle) {
          score += 100
          matchedIn.push("title")
        }

        // Exact skill matching (high priority - score 50 per match)
        const matchedSkills = (job.required_skills || []).filter((skill: string) => {
          const skillLower = skill.toLowerCase()
          return skillLower.includes(keyword) || keyword.includes(skillLower)
        })
        if (matchedSkills.length > 0) {
          score += 50 * matchedSkills.length
          matchedIn.push(`skills(${matchedSkills.length})`)
        }

        // Company name matching (medium priority - score 30)
        const matchesCompany = job.company_name?.toLowerCase().includes(keyword)
        if (matchesCompany) {
          score += 30
          matchedIn.push("company")
        }

        // Description matching (lowest priority - score 5)
        const matchesDescription = keyword.length >= 3 && job.job_description?.toLowerCase().includes(keyword)
        if (matchesDescription) {
          score += 5
          matchedIn.push("description")
        }

        return {
          ...job,
          _relevanceScore: score,
          _matchedIn: matchedIn,
        }
      })

      // This prevents "Underwriter" matching "develop" in description only
      filteredJobs = jobsWithScores.filter((job) => {
        const hasMatch = job._relevanceScore > 5 // Require more than just description match

        if (hasMatch) {
          console.log("[v0] ✓ Keyword matched:", {
            title: job.job_title,
            company: job.company_name,
            skills: job.required_skills,
            matchedIn: job._matchedIn.join(", "),
            relevanceScore: job._relevanceScore,
          })
        } else if (job._relevanceScore > 0) {
          console.log("[v0] ✗ Job rejected (description-only match):", {
            title: job.job_title,
            matchedIn: job._matchedIn.join(", "),
            relevanceScore: job._relevanceScore,
          })
        }

        return hasMatch
      })

      console.log(
        "[v0] STEP 1 - After keyword filter:",
        filteredJobs.length,
        "jobs (filtered out:",
        beforeCount - filteredJobs.length,
        ")",
      )
    }

    // This ensures keyword searches show all matching jobs unless user actively selects experience
    if (filters.minExperience !== undefined && filters.minExperience !== null && filters.minExperience > 0) {
      const beforeCount = filteredJobs.length
      const userSelectedExp = filters.minExperience

      console.log("[v0] STEP 2 - Experience filter IS being applied. User selected experience:", userSelectedExp)

      filteredJobs = filteredJobs.filter((job) => {
        const jobMinExp = job.min_experience || 0
        const jobMaxExp = job.max_experience || 100

        // STRICT MATCHING: user's experience must fall within job's requirement range
        const matches = userSelectedExp >= jobMinExp && userSelectedExp <= jobMaxExp

        if (!matches) {
          console.log("[v0] Job rejected by experience:", {
            title: job.job_title,
            jobRequirement: `${jobMinExp}-${jobMaxExp} years`,
            userExperience: `${userSelectedExp} years`,
            reason:
              userSelectedExp < jobMinExp
                ? `User exp (${userSelectedExp}) is below job minimum (${jobMinExp})`
                : `User exp (${userSelectedExp}) is above job maximum (${jobMaxExp})`,
          })
        }

        return matches
      })

      console.log(
        "[v0] STEP 2 - After experience filter:",
        filteredJobs.length,
        "jobs (filtered out:",
        beforeCount - filteredJobs.length,
        ")",
      )
      console.log("[v0] Experience filter applied: User selected", userSelectedExp, "years")
    } else {
      console.log(
        "[v0] STEP 2 - No experience filter applied (minExperience is 0, undefined, or null - showing all experience levels)",
      )
    }

    if (filters.locations && filters.locations.length > 0) {
      const beforeCount = filteredJobs.length

      console.log("[v0] STEP 3 - Location filter received:", filters.locations)
      console.log("[v0] STEP 3 - Location filter type check:", {
        isArray: Array.isArray(filters.locations),
        length: filters.locations.length,
        values: filters.locations,
      })

      filteredJobs = filteredJobs.filter((job) => {
        const jobLocations = (job.job_locations || []) as string[]

        // Clean and normalize location strings for comparison
        const normalizedFilterLocs = filters.locations!.map((loc) => loc.toLowerCase().trim())
        const normalizedJobLocs = jobLocations.map((loc) => loc.toLowerCase().trim())

        // Match if ANY filter location matches ANY job location
        const matches = normalizedFilterLocs.some((filterLoc) =>
          normalizedJobLocs.some(
            (jobLoc) => jobLoc === filterLoc || jobLoc.includes(filterLoc) || filterLoc.includes(jobLoc),
          ),
        )

        if (!matches) {
          console.log("[v0] Job rejected by location:", {
            title: job.job_title,
            jobLocations: normalizedJobLocs,
            requiredLocations: normalizedFilterLocs,
          })
        } else {
          console.log("[v0] ✓ Job MATCHED by location:", {
            title: job.job_title,
            jobLocations: normalizedJobLocs,
            matchedWith: normalizedFilterLocs,
          })
        }

        return matches
      })

      console.log(
        "[v0] STEP 3 - After location filter:",
        filteredJobs.length,
        "jobs (filtered out:",
        beforeCount - filteredJobs.length,
        ")",
      )
    } else {
      console.log("[v0] STEP 3 - No location filter applied (showing all locations)")
    }

    if (filters.minSalary || filters.maxSalary) {
      const beforeCount = filteredJobs.length
      filteredJobs = filteredJobs.filter((job) => {
        let jobMinSalary = Number(job.min_salary) || 0
        let jobMaxSalary = Number(job.max_salary) || Number.POSITIVE_INFINITY

        if (jobMinSalary > 1000) {
          jobMinSalary = jobMinSalary / 100000
        }
        if (jobMaxSalary > 1000 && jobMaxSalary !== Number.POSITIVE_INFINITY) {
          jobMaxSalary = jobMaxSalary / 100000
        }

        const filterMin = filters.minSalary || 0
        const filterMax = filters.maxSalary || Number.POSITIVE_INFINITY

        const passes = jobMinSalary <= filterMax && jobMaxSalary >= filterMin

        if (!passes) {
          console.log("[v0] Job filtered out by salary:", {
            title: job.job_title,
            jobSalary: `${jobMinSalary}-${jobMaxSalary} lakhs`,
            filterRange: `${filterMin}-${filterMax} lakhs`,
          })
        }

        return passes
      })
      console.log(
        "[v0] STEP 4 - After salary filter:",
        filteredJobs.length,
        "jobs (filtered out:",
        beforeCount - filteredJobs.length,
        ")",
      )
    }

    if (filters.employmentTypes && filters.employmentTypes.length > 0) {
      filteredJobs = filteredJobs.filter((job) => filters.employmentTypes!.includes(job.employment_type))
      console.log("[v0] After employment type filter:", filteredJobs.length, "jobs")
    }

    if (filters.workModes && filters.workModes.length > 0) {
      filteredJobs = filteredJobs.filter((job) => filters.workModes!.includes(job.work_mode))
      console.log("[v0] After work mode filter:", filteredJobs.length, "jobs")
    }

    console.log("[v0] ===== FINAL SEARCH RESULTS =====")
    console.log("[v0] Query:", query || "(no keywords)")
    console.log(
      "[v0] Experience filter:",
      filters.minExperience !== undefined ? `${filters.minExperience} years` : "none",
    )
    console.log("[v0] Location filter:", filters.locations?.length ? filters.locations.join(", ") : "none")
    console.log("[v0] Date posted filter:", filters.datePosted || "none")
    console.log("[v0] Total results:", filteredJobs.length)

    filteredJobs.sort((a, b) => {
      // Premium jobs always come first
      if (a.category === "premium" && b.category !== "premium") return -1
      if (a.category !== "premium" && b.category === "premium") return 1

      // Among premium jobs, urgent hiring comes first
      if (a.category === "premium" && b.category === "premium") {
        if (a.urgent_hiring && !b.urgent_hiring) return -1
        if (!a.urgent_hiring && b.urgent_hiring) return 1
      }

      // Sort by relevance score if available (from keyword search)
      if (a._relevanceScore && b._relevanceScore) {
        return b._relevanceScore - a._relevanceScore
      }

      // Finally sort by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    console.log("[v0] Jobs sorted: Premium jobs shown first")
    console.log("[v0] ===================================")

    return { success: true, jobs: filteredJobs }
  } catch (error) {
    console.error("[v0] Error in searchJobs:", error)
    return { success: false, error: "Failed to search jobs", jobs: [] }
  }
}

export async function saveJob(candidateId: string, jobId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("saved_jobs").insert({
      job_id: jobId,
      candidate_id: candidateId,
    })

    if (error) {
      console.error("[v0] Error saving job:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in saveJob:", error)
    return { success: false, error: "Failed to save job" }
  }
}

export async function unsaveJob(candidateId: string, jobId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("saved_jobs").delete().eq("candidate_id", candidateId).eq("job_id", jobId)

    if (error) {
      console.error("[v0] Error unsaving job:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in unsaveJob:", error)
    return { success: false, error: "Failed to unsave job" }
  }
}

export async function isJobSaved(candidateId: string, jobId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("saved_jobs")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("job_id", jobId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error checking if job is saved:", error)
      return { success: false, isSaved: false }
    }

    return { success: true, isSaved: !!data }
  } catch (error) {
    console.error("[v0] Error in isJobSaved:", error)
    return { success: false, isSaved: false }
  }
}

export async function getDesignationSuggestions(query = "") {
  try {
    const supabase = await createServerClient()

    // Fetch all published jobs and extract unique job titles
    const { data: jobs, error } = await supabase
      .from("job_postings")
      .select("job_title")
      .eq("status", "published")
      .not("job_title", "is", null)

    if (error) {
      console.error("[v0] Error fetching designations:", error)
      return { success: false, suggestions: [] }
    }

    // Extract unique job titles
    const uniqueTitles = Array.from(new Set(jobs.map((job) => job.job_title).filter(Boolean)))

    // If query is provided, filter the suggestions
    let filteredTitles = uniqueTitles
    if (query.trim()) {
      const queryLower = query.toLowerCase()
      filteredTitles = uniqueTitles.filter((title) => title.toLowerCase().includes(queryLower))
    }

    // Sort alphabetically and limit to 10 suggestions
    const suggestions = filteredTitles.sort((a, b) => a.localeCompare(b)).slice(0, 10)

    console.log("[v0] Designation suggestions fetched:", suggestions.length)

    return { success: true, suggestions }
  } catch (error) {
    console.error("[v0] Error in getDesignationSuggestions:", error)
    return { success: false, suggestions: [] }
  }
}

export async function getCompanySuggestions(query = "") {
  try {
    const supabase = await createServerClient()

    // Fetch all published jobs and extract unique company names
    const { data: jobs, error } = await supabase
      .from("job_postings")
      .select("company_name")
      .eq("status", "published")
      .not("company_name", "is", null)

    if (error) {
      console.error("[v0] Error fetching companies:", error)
      return { success: false, suggestions: [] }
    }

    // Extract unique company names
    const uniqueCompanies = Array.from(new Set(jobs.map((job) => job.company_name).filter(Boolean)))

    // If query is provided, filter the suggestions
    let filteredCompanies = uniqueCompanies
    if (query.trim()) {
      const queryLower = query.toLowerCase()
      filteredCompanies = uniqueCompanies.filter((company) => company.toLowerCase().includes(queryLower))
    }

    // Sort alphabetically and limit to 10 suggestions
    const suggestions = filteredCompanies.sort((a, b) => a.localeCompare(b)).slice(0, 10)

    console.log("[v0] Company suggestions fetched:", suggestions.length)

    return { success: true, suggestions }
  } catch (error) {
    console.error("[v0] Error in getCompanySuggestions:", error)
    return { success: false, suggestions: [] }
  }
}

export async function getSkillSuggestions(query = "") {
  try {
    const supabase = await createServerClient()

    const { data: skillsData, error } = await supabase.from("skills").select("name").order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching skills:", error)
      return { success: false, suggestions: [] }
    }

    // Extract skill names
    const allSkills = skillsData.map((skill) => skill.name).filter(Boolean)

    // If query is provided, filter the suggestions
    let filteredSkills = allSkills
    if (query.trim()) {
      const queryLower = query.toLowerCase()
      filteredSkills = allSkills.filter((skill) => skill.toLowerCase().includes(queryLower))
    }

    // Limit to 10 suggestions
    const suggestions = filteredSkills.slice(0, 10)

    console.log("[v0] Skill suggestions fetched:", suggestions.length)

    return { success: true, suggestions }
  } catch (error) {
    console.error("[v0] Error in getSkillSuggestions:", error)
    return { success: false, suggestions: [] }
  }
}

export interface CandidateSearchResult {
  id: string
  full_name: string
  email: string
  mobile_number?: string
  current_job_title?: string
  company_name?: string
  skills_for_role?: string[]
  skills_you_know?: string[]
  preferred_locations?: string[]
  preferred_salary?: string
  notice_period?: string
  total_experience_years?: number
  total_experience_months?: number
  current_city?: string
  current_state?: string
  highest_qualification?: string
  industry?: string
  gender?: string
  profile_picture_url?: string
  resume_headline?: string
  resume_url?: string
  created_at?: string
  updated_at?: string
  is_mobile_verified?: boolean
  otp_verified?: boolean
}

export async function getSkillsFromDB(query = "") {
  try {
    const supabase = await createServerClient()

    let queryBuilder = supabase
      .from("skills")
      .select("id, skill_name, category")
      .order("skill_name", { ascending: true })

    if (query.trim()) {
      queryBuilder = queryBuilder.ilike("skill_name", `%${query}%`)
    }

    const { data, error } = await queryBuilder.limit(50)

    if (error) {
      console.error("[v0] Error fetching skills:", error)
      return { success: false, skills: [] }
    }

    return { success: true, skills: data || [] }
  } catch (error) {
    console.error("[v0] Error in getSkillsFromDB:", error)
    return { success: false, skills: [] }
  }
}

export async function getLocationsFromDB(query = "") {
  try {
    const supabase = await createServerClient()

    // Fetch cities
    let citiesQuery = supabase.from("cities").select("id, name, state_id").order("name", { ascending: true })

    if (query.trim()) {
      citiesQuery = citiesQuery.ilike("name", `%${query}%`)
    }

    const { data: cities, error: citiesError } = await citiesQuery.limit(30)

    // Fetch states
    let statesQuery = supabase.from("states").select("id, name, country").order("name", { ascending: true })

    if (query.trim()) {
      statesQuery = statesQuery.ilike("name", `%${query}%`)
    }

    const { data: states, error: statesError } = await statesQuery.limit(20)

    if (citiesError || statesError) {
      console.error("[v0] Error fetching locations:", citiesError || statesError)
      return { success: false, cities: [], states: [] }
    }

    return { success: true, cities: cities || [], states: states || [] }
  } catch (error) {
    console.error("[v0] Error in getLocationsFromDB:", error)
    return { success: false, cities: [], states: [] }
  }
}

export async function getIndustriesFromDB() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("industries")
      .select("id, name, description")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching industries:", error)
      return { success: false, industries: [] }
    }

    return { success: true, industries: data || [] }
  } catch (error) {
    console.error("[v0] Error in getIndustriesFromDB:", error)
    return { success: false, industries: [] }
  }
}

export async function getDepartmentsFromDB(industryId?: string) {
  try {
    const supabase = await createServerClient()

    let queryBuilder = supabase
      .from("departments")
      .select("id, department_name, industry_id, description")
      .eq("is_active", true)
      .order("department_name", { ascending: true })

    if (industryId) {
      queryBuilder = queryBuilder.eq("industry_id", industryId)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error("[v0] Error fetching departments:", error)
      return { success: false, departments: [] }
    }

    return { success: true, departments: data || [] }
  } catch (error) {
    console.error("[v0] Error in getDepartmentsFromDB:", error)
    return { success: false, departments: [] }
  }
}

export async function getRoleCategoriesFromDB(departmentId?: string) {
  try {
    const supabase = await createServerClient()

    let queryBuilder = supabase
      .from("role_categories")
      .select("id, role_category_name, department_id, description")
      .eq("is_active", true)
      .order("role_category_name", { ascending: true })

    if (departmentId) {
      queryBuilder = queryBuilder.eq("department_id", departmentId)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error("[v0] Error fetching role categories:", error)
      return { success: false, roleCategories: [] }
    }

    return { success: true, roleCategories: data || [] }
  } catch (error) {
    console.error("[v0] Error in getRoleCategoriesFromDB:", error)
    return { success: false, roleCategories: [] }
  }
}

export async function getEducationFromDB() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("highest_qualifications")
      .select("id, level, display_order")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching education:", error)
      return { success: false, qualifications: [] }
    }

    return { success: true, qualifications: data || [] }
  } catch (error) {
    console.error("[v0] Error in getEducationFromDB:", error)
    return { success: false, qualifications: [] }
  }
}

export async function getEducationCoursesFromDB(qualificationId?: number) {
  try {
    const supabase = await createServerClient()

    let queryBuilder = supabase
      .from("educations_with_level")
      .select("id, education_name, education_level, qualification_id")
      .order("education_name", { ascending: true })

    if (qualificationId) {
      queryBuilder = queryBuilder.eq("qualification_id", qualificationId)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error("[v0] Error fetching education courses:", error)
      return { success: false, courses: [] }
    }

    return { success: true, courses: data || [] }
  } catch (error) {
    console.error("[v0] Error in getEducationCoursesFromDB:", error)
    return { success: false, courses: [] }
  }
}

export async function getSearchFilterOptions() {
  try {
    const supabase = await createServerClient()

    // Parallel fetch all filter data
    const [skillsResult, citiesResult, statesResult, industriesResult, departmentsResult, qualificationsResult] =
      await Promise.all([
        supabase.from("skills").select("id, skill_name, category").order("skill_name").limit(100),
        supabase.from("cities").select("id, name").order("name").limit(100),
        supabase.from("states").select("id, name").order("name"),
        supabase.from("industries").select("id, name").order("name"),
        supabase
          .from("departments")
          .select("id, department_name, industry_id")
          .eq("is_active", true)
          .order("department_name"),
        supabase.from("highest_qualifications").select("id, level, display_order").order("display_order"),
      ])

    return {
      success: true,
      skills: skillsResult.data || [],
      cities: citiesResult.data || [],
      states: statesResult.data || [],
      industries: industriesResult.data || [],
      departments: departmentsResult.data || [],
      qualifications: qualificationsResult.data || [],
    }
  } catch (error) {
    console.error("[v0] Error in getSearchFilterOptions:", error)
    return {
      success: false,
      skills: [],
      cities: [],
      states: [],
      industries: [],
      departments: [],
      qualifications: [],
    }
  }
}

interface CandidateSearchParams {
  employerId: string
  keywords?: string
  skills?: string[]
  excludeKeywords?: string
  locations?: string[]
  includeRelocate?: boolean
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  includeSalaryNotMentioned?: boolean
  noticePeriod?: string[]
  education?: string[]
  industry?: string[]
  department?: string[]
  company?: string
  activeIn?: string
  gender?: string[]
  diversity?: string[]
  ageMin?: number
  ageMax?: number
  jobType?: string[]
  employmentType?: string[]
  showOnly?: string[] // verified_mobile, verified_email, attached_resume
  displayFilter?: string // all, new_registrations, modified
}

export async function searchCandidates(params: CandidateSearchParams): Promise<{
  success: boolean
  candidates?: CandidateSearchResult[]
  total?: number
  error?: string
}> {
  try {
    const supabase = await createServerClient()

    console.log("[v0] searchCandidates called with params:", JSON.stringify(params, null, 2))

    // Build the query - fetch all candidates first for client-side filtering of array fields
    let queryBuilder = supabase
      .from("candidates")
      .select("*", { count: "exact" })
      .eq("registration_completed", true)
      .eq("is_profile_active", true)
      .order("updated_at", { ascending: false })

    // Keywords search (name, job title, resume headline)
    if (params.keywords?.trim()) {
      const keyword = params.keywords.toLowerCase().trim()
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${keyword}%,current_job_title.ilike.%${keyword}%,resume_headline.ilike.%${keyword}%,company_name.ilike.%${keyword}%`,
      )
    }

    // Experience filter
    if (params.experienceMin !== undefined && params.experienceMin > 0) {
      queryBuilder = queryBuilder.gte("total_experience_years", params.experienceMin)
    }
    if (params.experienceMax !== undefined && params.experienceMax < 30) {
      queryBuilder = queryBuilder.lte("total_experience_years", params.experienceMax)
    }

    // Gender filter
    if (params.gender && params.gender.length > 0) {
      queryBuilder = queryBuilder.in("gender", params.gender)
    }

    // Industry filter
    if (params.industry && params.industry.length > 0) {
      queryBuilder = queryBuilder.in("industry", params.industry)
    }

    // Education filter
    if (params.education && params.education.length > 0) {
      queryBuilder = queryBuilder.in("highest_qualification", params.education)
    }

    // Notice period filter
    if (params.noticePeriod && params.noticePeriod.length > 0) {
      queryBuilder = queryBuilder.in("notice_period", params.noticePeriod)
    }

    // Verified mobile filter
    if (params.showOnly?.includes("verified_mobile")) {
      queryBuilder = queryBuilder.eq("is_mobile_verified", true)
    }

    // Verified email filter
    if (params.showOnly?.includes("verified_email")) {
      queryBuilder = queryBuilder.eq("otp_verified", true)
    }

    // Attached resume filter
    if (params.showOnly?.includes("attached_resume")) {
      queryBuilder = queryBuilder.not("resume_url", "is", null)
    }

    // Active in filter
    if (params.activeIn && params.activeIn !== "all") {
      const now = new Date()
      let cutoffDate: Date

      switch (params.activeIn) {
        case "1month":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "3months":
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "6months":
          cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case "1year":
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      if (params.displayFilter === "new_registrations") {
        queryBuilder = queryBuilder.gte("created_at", cutoffDate.toISOString())
      } else {
        queryBuilder = queryBuilder.gte("updated_at", cutoffDate.toISOString())
      }
    }

    // Limit results
    queryBuilder = queryBuilder.limit(100)

    const { data: candidates, error, count } = await queryBuilder

    if (error) {
      console.error("[v0] Error searching candidates:", error)
      return { success: false, error: error.message, candidates: [], total: 0 }
    }

    console.log("[v0] Initial candidates fetched:", candidates?.length || 0)

    let filteredCandidates = candidates || []

    // Client-side filtering for array fields (skills, locations)
    // Skills filter - check if candidate has ANY of the required skills
    if (params.skills && params.skills.length > 0) {
      const searchSkills = params.skills.map((s) => s.toLowerCase().trim())
      console.log("[v0] Filtering by skills:", searchSkills)

      filteredCandidates = filteredCandidates.filter((candidate) => {
        const candidateSkills = [...(candidate.skills_for_role || []), ...(candidate.skills_you_know || [])].map(
          (s: string) => s.toLowerCase().trim(),
        )

        // Check if candidate has at least one of the required skills
        const hasMatchingSkill = searchSkills.some((skill) =>
          candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs)),
        )

        if (hasMatchingSkill) {
          console.log("[v0] Candidate matches skills:", candidate.full_name, candidateSkills)
        }

        return hasMatchingSkill
      })

      console.log("[v0] After skills filter:", filteredCandidates.length)
    }

    // Location filter - check if candidate is in any of the specified locations
    if (params.locations && params.locations.length > 0) {
      const searchLocations = params.locations.map((l) => l.toLowerCase().trim())
      console.log("[v0] Filtering by locations:", searchLocations)

      filteredCandidates = filteredCandidates.filter((candidate) => {
        const candidateLocations = [
          candidate.current_city,
          candidate.current_state,
          ...(candidate.preferred_locations || []),
        ]
          .filter(Boolean)
          .map((l: string) => l.toLowerCase().trim())

        const matchesLocation = searchLocations.some((loc) =>
          candidateLocations.some((cl) => cl.includes(loc) || loc.includes(cl)),
        )

        // If includeRelocate is true, also include candidates willing to relocate
        if (params.includeRelocate && !matchesLocation) {
          const prefLocations = (candidate.preferred_locations || []).map((l: string) => l.toLowerCase())
          const willingToRelocate = prefLocations.some((pl) =>
            searchLocations.some((sl) => pl.includes(sl) || sl.includes(pl)),
          )
          return willingToRelocate
        }

        return matchesLocation
      })

      console.log("[v0] After location filter:", filteredCandidates.length)
    }

    // Exclude keywords filter
    if (params.excludeKeywords?.trim()) {
      const excludeTerms = params.excludeKeywords
        .toLowerCase()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      filteredCandidates = filteredCandidates.filter((candidate) => {
        const candidateText = [
          candidate.full_name,
          candidate.current_job_title,
          candidate.resume_headline,
          candidate.company_name,
          ...(candidate.skills_for_role || []),
          ...(candidate.skills_you_know || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return !excludeTerms.some((term) => candidateText.includes(term))
      })
    }

    // Salary filter (client-side since preferred_salary is a string)
    if ((params.salaryMin && params.salaryMin > 0) || (params.salaryMax && params.salaryMax < 100)) {
      filteredCandidates = filteredCandidates.filter((candidate) => {
        if (!candidate.preferred_salary && params.includeSalaryNotMentioned) {
          return true
        }

        if (!candidate.preferred_salary) {
          return false
        }

        // Try to parse salary (handle formats like "5-10 LPA", "500000", etc.)
        const salaryStr = candidate.preferred_salary.replace(/[^\d.-]/g, "")
        const salary = Number.parseFloat(salaryStr)

        if (isNaN(salary)) {
          return params.includeSalaryNotMentioned
        }

        // Convert to LPA if needed
        const salaryLPA = salary > 1000 ? salary / 100000 : salary

        const minOk = !params.salaryMin || salaryLPA >= params.salaryMin
        const maxOk = !params.salaryMax || params.salaryMax >= 100 || salaryLPA <= params.salaryMax

        return minOk && maxOk
      })
    }

    console.log("[v0] Final candidates count:", filteredCandidates.length)

    // Try to save search (don't fail if this fails due to RLS)
    try {
      const searchName = params.keywords || params.skills?.join(", ") || "Search"
      await supabase.from("employer_searches").insert({
        employer_id: params.employerId,
        search_name: searchName.slice(0, 100),
        search_filters: params,
        results_count: filteredCandidates.length,
        is_saved: false,
      })
    } catch (saveError) {
      console.log("[v0] Could not save search (non-critical):", saveError)
    }

    return {
      success: true,
      candidates: filteredCandidates,
      total: filteredCandidates.length,
    }
  } catch (error) {
    console.error("[v0] Error in searchCandidates:", error)
    return { success: false, error: "Failed to search candidates", candidates: [], total: 0 }
  }
}

export async function getRecentSearches(employerId: string) {
  try {
    const supabase = await createServerClient()

    // Get recent searches (not saved)
    const { data: recentSearches, error: recentError } = await supabase
      .from("employer_searches")
      .select("*")
      .eq("employer_id", employerId)
      .eq("is_saved", false)
      .order("created_at", { ascending: false })
      .limit(5)

    // Get saved searches
    const { data: savedSearches, error: savedError } = await supabase
      .from("employer_searches")
      .select("*")
      .eq("employer_id", employerId)
      .eq("is_saved", true)
      .order("created_at", { ascending: false })
      .limit(10)

    if (recentError) {
      console.log("[v0] Error fetching recent searches:", recentError)
    }
    if (savedError) {
      console.log("[v0] Error fetching saved searches:", savedError)
    }

    return {
      success: true,
      recentSearches: recentSearches || [],
      savedSearches: savedSearches || [],
    }
  } catch (error) {
    console.error("[v0] Error in getRecentSearches:", error)
    return { success: true, recentSearches: [], savedSearches: [] }
  }
}

export async function saveSearch(params: { employerId: string; searchName: string; filters: any }) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("employer_searches")
      .insert({
        employer_id: params.employerId,
        keywords: params.searchName.slice(0, 255),
        filters: params.filters,
        is_saved: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving search:", error)
      return { success: false, error: error.message }
    }

    return { success: true, search: data }
  } catch (error) {
    console.error("[v0] Error in saveSearch:", error)
    return { success: false, error: "Failed to save search" }
  }
}

export async function deleteSearch(searchId: string, employerId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("employer_searches").delete().eq("id", searchId).eq("employer_id", employerId)

    if (error) {
      console.error("[v0] Error deleting search:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteSearch:", error)
    return { success: false, error: "Failed to delete search" }
  }
}
