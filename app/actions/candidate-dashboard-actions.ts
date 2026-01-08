"use server"

import { createServerClient } from "@/lib/supabase/server"

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // If it's a 502 or network error, retry
      if (i < maxRetries - 1 && (error.message?.includes("502") || error.message?.includes("Network"))) {
        const delay = initialDelay * Math.pow(2, i)
        console.log(`[v0] Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw lastError
}

export async function getRecommendedJobs(candidateId: string) {
  try {
    const supabase = await createServerClient()

    const { data: candidate, error: candidateError } = await retryWithBackoff(async () => {
      return await supabase
        .from("candidates")
        .select(
          "skills_for_role, preferred_locations, preferred_salary, total_experience_years, industry, department, registration_completed, email, full_name",
        )
        .eq("id", candidateId)
        .single()
    })

    if (candidateError || !candidate) {
      console.log("[v0] Candidate not found or error:", candidateError)
      return { success: false, error: "Candidate not found", jobs: [], profileIncomplete: false }
    }

    console.log("[v0] === JOB RECOMMENDATION REQUEST ===")
    console.log("[v0] Candidate:", {
      email: candidate.email,
      name: candidate.full_name,
      id: candidateId.substring(0, 8) + "...",
    })

    const candidateSkills = (candidate.skills_for_role || []) as string[]
    const candidateLocations = (candidate.preferred_locations || []) as string[]
    const candidateSalary = candidate.preferred_salary
    const candidateExperience = candidate.total_experience_years || 0
    const candidateIndustry = candidate.industry as string | null
    const candidateDepartment = candidate.department as string | null

    const { data: blockedEmployers } = await supabase
      .from("blocked_employers")
      .select("employer_id")
      .eq("candidate_id", candidateId)

    const blockedEmployerIds = (blockedEmployers || []).map((blocked) => blocked.employer_id).filter(Boolean)

    console.log("[v0] Blocked Employers Query Result:", {
      raw: blockedEmployers,
      count: blockedEmployers?.length || 0,
      employerIds: blockedEmployerIds,
    })

    const profileIncomplete = candidateSkills.length === 0

    console.log("[v0] Candidate Profile:", {
      skills: candidateSkills,
      locations: candidateLocations,
      salary: candidateSalary,
      experience: candidateExperience,
      industry: candidateIndustry,
      department: candidateDepartment,
      profileIncomplete,
      blockedCompanies: blockedEmployerIds.length,
    })

    const { data: jobs, error } = await supabase
      .from("job_postings")
      .select("*, openings")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("[v0] Error fetching jobs:", error)
      return { success: false, error: error.message, jobs: [], profileIncomplete }
    }

    console.log("[v0] Total published jobs:", jobs?.length || 0)

    if (profileIncomplete) {
      console.log("[v0] Profile incomplete - returning 0 jobs to force profile completion")
      return {
        success: true,
        jobs: [],
        profileIncomplete: true,
        message: "Please complete your profile (add skills) to see job recommendations",
      }
    }

    const normalizedCandidateSkills = candidateSkills.map((skill) => String(skill).toLowerCase().trim())
    const normalizedCandidateLocations =
      candidateLocations.length > 0 ? candidateLocations.map((loc) => String(loc).toLowerCase().trim()) : []

    let candidateSalaryMin = 0
    let candidateSalaryMax = Number.POSITIVE_INFINITY
    if (candidateSalary) {
      const salaryNum = Number(candidateSalary)
      if (salaryNum >= 100) {
        candidateSalaryMin = salaryNum
        candidateSalaryMax = salaryNum
      } else {
        candidateSalaryMin = salaryNum * 100000
        candidateSalaryMax = salaryNum * 100000
      }
    }

    console.log("[v0] Candidate salary range:", {
      raw: candidateSalary,
      min: candidateSalaryMin,
      max: candidateSalaryMax,
      minLPA: candidateSalaryMin / 100000,
      maxLPA: candidateSalaryMax / 100000,
    })

    const matchedJobs =
      jobs?.filter((job) => {
        const isBlocked = job.employer_id && blockedEmployerIds.includes(job.employer_id)
        console.log(`[v0] Checking job "${job.job_title}" at ${job.company_name}:`, {
          jobEmployerId: job.employer_id,
          blockedIds: blockedEmployerIds,
          isBlocked,
        })

        if (isBlocked) {
          console.log(`[v0] ❌ JOB FILTERED (Blocked Employer): "${job.job_title}" at ${job.company_name}`)
          return false
        }

        let matchScore = 0
        const matchDetails: any = {}

        const jobMinSalary = Number(job.min_salary) || 0
        const jobMaxSalary = Number(job.max_salary) || Number.POSITIVE_INFINITY

        const salaryMatch =
          !candidateSalary || (candidateSalaryMin <= jobMaxSalary && candidateSalaryMax >= jobMinSalary)
        matchDetails.salary = {
          match: salaryMatch,
          candidateRange: candidateSalary
            ? `${candidateSalaryMin / 100000}-${candidateSalaryMax / 100000} LPA`
            : "Not specified",
          jobRange: `${jobMinSalary / 100000}-${jobMaxSalary / 100000} LPA`,
        }
        if (salaryMatch) matchScore += 25

        const jobLocations = (job.job_locations || []) as string[]
        const normalizedJobLocations = jobLocations.map((loc) => String(loc).toLowerCase().trim())

        const locationMatch =
          normalizedCandidateLocations.length === 0 ||
          normalizedCandidateLocations.some((candidateLoc) =>
            normalizedJobLocations.some((jobLoc) => jobLoc.includes(candidateLoc) || candidateLoc.includes(jobLoc)),
          )
        matchDetails.location = {
          match: locationMatch,
          candidateLocations: normalizedCandidateLocations.length > 0 ? normalizedCandidateLocations : ["Any location"],
          jobLocations: normalizedJobLocations,
        }
        if (locationMatch) matchScore += 25

        const jobMinExp = Number(job.min_experience) || 0
        const jobMaxExp = Number(job.max_experience) || 100

        const experienceMatch = candidateExperience >= jobMinExp && candidateExperience <= jobMaxExp
        matchDetails.experience = {
          match: experienceMatch,
          candidateExp: candidateExperience,
          jobRange: `${jobMinExp}-${jobMaxExp} years`,
        }
        if (experienceMatch) matchScore += 25

        const jobSkills = (job.required_skills || []) as string[]
        const normalizedJobSkills = jobSkills.map((skill) => String(skill).toLowerCase().trim())

        const matchingSkills = normalizedCandidateSkills.filter((candidateSkill) =>
          normalizedJobSkills.some((jobSkill) => {
            return candidateSkill === jobSkill || candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
          }),
        )

        const skillsMatch = matchingSkills.length > 0
        matchDetails.skills = {
          match: skillsMatch,
          matchingSkills: matchingSkills,
          candidateSkills: normalizedCandidateSkills,
          jobSkills: normalizedJobSkills,
        }
        if (skillsMatch) matchScore += 25

        const isMatch = matchScore >= 25

        if (isMatch) {
          console.log(`[v0] ✅ JOB MATCHED: "${job.job_title}" at ${job.company_name}`)
          console.log(`[v0]    Match Score: ${matchScore}/100`)
          console.log(
            `[v0]    ${matchDetails.salary.match ? "✓" : "✗"} Salary: ${matchDetails.salary.candidateRange} vs ${matchDetails.salary.jobRange}`,
          )
          console.log(
            `[v0]    ${matchDetails.location.match ? "✓" : "✗"} Location: ${matchDetails.location.candidateLocations.join(", ")} vs ${matchDetails.location.jobLocations.join(", ")}`,
          )
          console.log(
            `[v0]    ${matchDetails.experience.match ? "✓" : "✗"} Experience: ${matchDetails.experience.candidateExp} years vs ${matchDetails.experience.jobRange}`,
          )
          console.log(
            `[v0]    ${matchDetails.skills.match ? "✓" : "✗"} Skills: ${matchingSkills.length} matching (${matchingSkills.join(", ")})`,
          )
        }

        return isMatch
      }) || []

    console.log("[v0] === MATCHING COMPLETE ===")
    console.log("[v0] Total matched jobs:", matchedJobs.length)
    console.log("[v0] ========================")

    return { success: true, jobs: matchedJobs, profileIncomplete: false }
  } catch (error) {
    console.error("[v0] Error in getRecommendedJobs:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch jobs"
    return { success: false, error: errorMessage, jobs: [], profileIncomplete: false }
  }
}

export async function getJobDetails(jobId: string, candidateId?: string) {
  try {
    const supabase = await createServerClient()

    const { data: job, error } = await supabase
      .from("job_postings")
      .select(
        `
        *,
        employers!job_postings_employer_id_fkey (
          logo_url,
          description,
          company_name
        )
      `,
      )
      .eq("id", jobId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    let hasApplied = false
    if (candidateId) {
      const { data: application } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("candidate_id", candidateId)
        .maybeSingle()

      hasApplied = !!application
    }

    return { success: true, job, hasApplied }
  } catch (error) {
    console.error("[v0] Error fetching job details:", error)
    return { success: false, error: "Failed to fetch job details" }
  }
}

export async function applyToJob(candidateId: string, jobId: string, screeningAnswers: Record<number, string>) {
  try {
    const supabase = await createServerClient()

    const { data: candidate } = await supabase.from("candidates").select("resume_url").eq("id", candidateId).single()

    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "You have already applied to this job" }
    }

    const { error } = await supabase.from("job_applications").insert({
      job_id: jobId,
      candidate_id: candidateId,
      screening_answers: screeningAnswers,
      resume_url: candidate?.resume_url || null,
      status: "applied",
    })

    if (error) {
      console.error("[v0] Error applying to job:", error)
      return { success: false, error: error.message }
    }

    return { success: true, jobId }
  } catch (error) {
    console.error("[v0] Error in applyToJob:", error)
    return { success: false, error: "Failed to apply to job" }
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

export async function getSavedJobs(candidateId: string) {
  try {
    const supabase = await createServerClient()

    const { data: savedJobs, error } = await supabase
      .from("saved_jobs")
      .select(`
        *,
        job_postings (*)
      `)
      .eq("candidate_id", candidateId)
      .order("saved_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching saved jobs:", error)
      return { success: false, error: error.message, jobs: [] }
    }

    const jobs = savedJobs?.map((saved: any) => saved.job_postings) || []

    return { success: true, jobs }
  } catch (error) {
    console.error("[v0] Error in getSavedJobs:", error)
    return { success: false, error: "Failed to fetch saved jobs", jobs: [] }
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

export async function getMyApplications(candidateId: string) {
  try {
    const supabase = await createServerClient()

    const { data: applications, error } = await supabase
      .from("job_applications")
      .select(
        `
        *,
        job_postings (*)
      `,
      )
      .eq("candidate_id", candidateId)
      .eq("status", "applied")
      .order("applied_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching applications:", error)
      return { success: false, error: error.message, applications: [] }
    }

    return { success: true, applications: applications || [] }
  } catch (error) {
    console.error("[v0] Error in getMyApplications:", error)
    return { success: false, error: "Failed to fetch applications", applications: [] }
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
