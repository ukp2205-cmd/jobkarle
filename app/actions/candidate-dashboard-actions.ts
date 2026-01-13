"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/client"

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
    const supabase = createClient()

    const { data: candidate } = await supabase.from("candidates").select("*").eq("id", candidateId).single()

    if (!candidate) {
      return { success: false, jobs: [], error: "Candidate not found" }
    }

    const { data: blockedEmployers } = await supabase
      .from("blocked_employers")
      .select("employer_id")
      .eq("candidate_id", candidateId)

    const blockedEmployerIds = blockedEmployers?.map((b) => b.employer_id) || []

    const { data: jobs } = await supabase
      .from("job_postings")
      .select("*")
      .eq("status", "published")
      .gte("expires_at", new Date().toISOString())

    // First try new 'skills' column, then fallback to merging old columns
    let candidateSkills: string[] = []

    if (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0) {
      candidateSkills = candidate.skills as string[]
      console.log(`[v0] Using new 'skills' column:`, candidateSkills)
    } else {
      // Fallback to old columns
      const skillsForRole = (candidate.skills_for_role || []) as string[]
      const skillsYouKnow = (candidate.skills_you_know || []) as string[]
      candidateSkills = [...new Set([...skillsForRole, ...skillsYouKnow])]
      console.log(`[v0] Using legacy skill columns - skills_for_role + skills_you_know:`, candidateSkills)
    }

    const normalizedCandidateSkills = candidateSkills.map((skill) => String(skill).toLowerCase().trim())

    console.log(
      `[v0] Candidate has ${normalizedCandidateSkills.length} normalized skills for matching:`,
      normalizedCandidateSkills,
    )

    const candidateLocations = (candidate.preferred_locations || []) as string[]
    const normalizedCandidateLocations = candidateLocations.map((loc) => String(loc).toLowerCase().trim())

    const candidateIndustry = candidate.industry
    const candidateEducation = candidate.highest_qualification
    const candidateExperience = (candidate.total_experience_years || 0) + (candidate.total_experience_months || 0) / 12
    const candidateSalary = candidate.preferred_salary

    let candidateSalaryMin = 0
    let candidateSalaryMax = Number.POSITIVE_INFINITY
    if (candidateSalary) {
      const salaryStr = String(candidateSalary).replace(/[^0-9.]/g, "")
      const salaryNum = Number(salaryStr)
      if (!isNaN(salaryNum) && salaryNum > 0) {
        if (salaryNum >= 100) {
          candidateSalaryMin = salaryNum
          candidateSalaryMax = salaryNum
        } else {
          candidateSalaryMin = salaryNum * 100000
          candidateSalaryMax = salaryNum * 100000
        }
      }
    }

    const matchedJobs =
      jobs
        ?.map((job) => {
          // Always exclude blocked employers
          const isBlocked = job.employer_id && blockedEmployerIds.includes(job.employer_id)
          if (isBlocked) {
            console.log(`[v0] ✗ Job "${job.job_title}" (ID: ${job.id}) - Blocked employer`)
            return null
          }

          // STRICT SKILLS MATCHING - This is the PRIMARY filter
          const jobSkills = (job.required_skills || []) as string[]
          const normalizedJobSkills = jobSkills.map((skill) => String(skill).toLowerCase().trim())

          console.log(`[v0] Checking job "${job.job_title}" (ID: ${job.id}) with skills:`, normalizedJobSkills)

          if (normalizedCandidateSkills.length === 0) {
            console.log(`[v0] ✗ Job "${job.job_title}" rejected - Candidate has NO skills in profile`)
            return null
          }

          // If job has no required skills, reject it (we can't match)
          if (jobSkills.length === 0) {
            console.log(`[v0] ✗ Job "${job.job_title}" rejected - Job has NO required skills`)
            return null
          }

          const matchingSkills = normalizedCandidateSkills.filter((candidateSkill) =>
            normalizedJobSkills.some((jobSkill) => {
              return (
                candidateSkill === jobSkill || candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
              )
            }),
          )

          // Calculate skill match percentage
          const skillMatchPercentage = (matchingSkills.length / jobSkills.length) * 100

          // STRICT REQUIREMENT: At least 50% of job skills must match candidate skills
          if (skillMatchPercentage < 50) {
            console.log(
              `[v0] ✗ Job "${job.job_title}" rejected - Skill match only ${skillMatchPercentage.toFixed(0)}% (need 50%+). Matching skills: [${matchingSkills.join(", ")}]`,
            )
            return null
          }

          console.log(
            `[v0] ✓ Job "${job.job_title}" - Skill match: ${skillMatchPercentage.toFixed(0)}% (${matchingSkills.length}/${jobSkills.length}). Matching skills: [${matchingSkills.join(", ")}]`,
          )

          // SECONDARY SCORING FACTORS (not hard filters)
          let matchScore = skillMatchPercentage * 2 // Skills are weighted 2x

          // Industry match adds bonus points (not required)
          const jobIndustries = (job.candidate_industries || []) as string[]
          const normalizedJobIndustries = jobIndustries.map((ind) => String(ind).toLowerCase().trim())

          const industryMatch =
            candidateIndustry &&
            jobIndustries.length > 0 &&
            normalizedJobIndustries.some(
              (jobInd) =>
                jobInd === candidateIndustry.toLowerCase().trim() ||
                candidateIndustry.toLowerCase().trim().includes(jobInd) ||
                jobInd.includes(candidateIndustry.toLowerCase().trim()),
            )

          if (industryMatch) {
            matchScore += 30
            console.log(`[v0]   + Industry match bonus`)
          }

          // Location match adds bonus points (not required)
          const jobLocations = (job.job_locations || []) as string[]
          const normalizedJobLocations = jobLocations.map((loc) => String(loc).toLowerCase().trim())

          const locationMatch =
            normalizedCandidateLocations.length > 0 &&
            jobLocations.length > 0 &&
            normalizedCandidateLocations.some((candidateLoc) =>
              normalizedJobLocations.some((jobLoc) => jobLoc.includes(candidateLoc) || candidateLoc.includes(jobLoc)),
            )

          if (locationMatch) {
            matchScore += 20
            console.log(`[v0]   + Location match bonus`)
          }

          // Salary match adds bonus points (not required)
          const jobMinSalary = Number(job.min_salary) || 0
          const jobMaxSalary = Number(job.max_salary) || Number.POSITIVE_INFINITY

          const salaryMatch =
            candidateSalary &&
            candidateSalaryMin > 0 &&
            candidateSalaryMin <= jobMaxSalary &&
            candidateSalaryMax >= jobMinSalary

          if (salaryMatch) {
            matchScore += 15
            console.log(`[v0]   + Salary match bonus`)
          }

          // Experience match adds bonus points (not required)
          const jobMinExp = Number(job.min_experience) || 0
          const jobMaxExp = Number(job.max_experience) || 100
          const experienceMatch = candidateExperience >= jobMinExp && candidateExperience <= jobMaxExp

          if (experienceMatch) {
            matchScore += 10
            console.log(`[v0]   + Experience match bonus`)
          }

          console.log(`[v0]   Total match score: ${matchScore.toFixed(0)}`)

          return {
            ...job,
            matchScore,
            skillMatchPercentage,
          }
        })
        .filter((job) => job !== null) || []

    const sortedJobs = matchedJobs.sort((a, b) => {
      // First priority: match score
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore
      }

      // Second priority: premium jobs
      const aPremium = a.category === "premium" ? 1 : 0
      const bPremium = b.category === "premium" ? 1 : 0
      if (aPremium !== bPremium) return bPremium - aPremium

      // Third priority: newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    console.log(
      `[v0] ✓ Returned ${sortedJobs.length} skill-matched jobs (50%+ match) out of ${jobs?.length || 0} total jobs`,
    )

    return {
      success: true,
      jobs: sortedJobs,
      candidateProfile: {
        industry: candidateIndustry,
        skills: candidateSkills,
        locations: candidateLocations,
        education: candidateEducation,
        experience: candidateExperience,
        salary: candidateSalary,
      },
    }
  } catch (error: any) {
    console.error("[v0] ✗ Error in getRecommendedJobs:", error)
    return { success: false, jobs: [], error: error.message }
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
