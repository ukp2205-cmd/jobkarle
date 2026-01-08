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
      .select("*, category, urgent_hiring, company_logo_url")
      .eq("status", "published")
      .order("created_at", { ascending: false })

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
