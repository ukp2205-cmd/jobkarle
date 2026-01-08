"use server"

import { createAdminClient } from "@/lib/supabase/admin"

interface CandidateData {
  skills_for_role?: string[]
  skills_you_know?: string[]
  current_state?: string
  current_city?: string
  preferred_locations?: string[]
  total_experience_years?: number
  total_experience_months?: number
  highest_qualification?: string
  industry?: string
  department?: string
}

interface JobData {
  job_title?: string
  required_skills?: string[] | string
  job_locations?: string[] | string
  min_experience?: number
  max_experience?: number
  educational_qualifications?: string[] | string
}

function normalizeToArray(data: any): string[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : [data]
    } catch {
      return [data]
    }
  }
  return []
}

/**
 * Calculate CV score based on job and candidate match
 * Score breakdown (out of 10):
 * - Skills match: 5.0 points (50%)
 * - Location match: 2.5 points (25%)
 * - Experience match: 2.0 points (20%)
 * - Education match: 0.5 points (5%)
 */
export async function calculateCVScore(candidate: CandidateData, job: JobData): Promise<number> {
  console.log("[v0] Calculating CV score for candidate")
  console.log("[v0] Candidate skills:", candidate.skills_for_role, candidate.skills_you_know)
  console.log("[v0] Job required skills:", job.required_skills)

  let score = 0

  // 1. Skills matching (5.0 points max) - Most important factor
  const candidateSkills = [
    ...normalizeToArray(candidate.skills_for_role),
    ...normalizeToArray(candidate.skills_you_know),
  ].map((s) => s.toLowerCase().trim())

  const jobSkills = normalizeToArray(job.required_skills).map((s) => s.toLowerCase().trim())

  if (jobSkills.length > 0 && candidateSkills.length > 0) {
    const matchingSkills = jobSkills.filter((skill) => candidateSkills.includes(skill))
    const skillMatchPercentage = matchingSkills.length / jobSkills.length
    score += skillMatchPercentage * 5.0
    console.log("[v0] Skills match:", matchingSkills.length, "/", jobSkills.length, "= +", skillMatchPercentage * 5.0)
  } else if (candidateSkills.length > 0) {
    score += 1.0 // Some skills present
    console.log("[v0] Some skills present: +1.0")
  }

  // 2. Location matching (2.5 points max)
  const candidateLocations = [
    candidate.current_city,
    candidate.current_state,
    ...normalizeToArray(candidate.preferred_locations),
  ]
    .filter(Boolean)
    .map((l) => l?.toLowerCase().trim())

  const jobLocations = normalizeToArray(job.job_locations).map((l) => l.toLowerCase().trim())

  if (jobLocations.length > 0 && candidateLocations.length > 0) {
    const hasLocationMatch = jobLocations.some((jobLoc) =>
      candidateLocations.some((candLoc) => candLoc?.includes(jobLoc) || jobLoc.includes(candLoc || "")),
    )
    score += hasLocationMatch ? 2.5 : 0.5 // Full points if match, small points if any location present
    console.log("[v0] Location match:", hasLocationMatch ? "Yes +2.5" : "Partial +0.5")
  } else if (candidateLocations.length > 0) {
    score += 1.0 // Location data present
    console.log("[v0] Location data present: +1.0")
  }

  // 3. Experience matching (2.0 points max)
  const candidateExpYears = (candidate.total_experience_years || 0) + (candidate.total_experience_months || 0) / 12

  if (job.min_experience !== undefined || job.max_experience !== undefined) {
    const minExp = job.min_experience || 0
    const maxExp = job.max_experience || 999

    if (candidateExpYears >= minExp && candidateExpYears <= maxExp) {
      score += 2.0 // Perfect match
      console.log("[v0] Experience perfect match: +2.0")
    } else if (candidateExpYears >= minExp * 0.8 && candidateExpYears <= maxExp * 1.2) {
      score += 1.5 // Close match (within 20%)
      console.log("[v0] Experience close match: +1.5")
    } else if (candidateExpYears > 0) {
      score += 0.5 // Has experience but not matching
      console.log("[v0] Has experience: +0.5")
    }
  } else if (candidateExpYears > 0) {
    score += 1.0 // Experience present
    console.log("[v0] Experience present: +1.0")
  }

  // 4. Education matching (0.5 points max)
  const jobEdu = normalizeToArray(job.educational_qualifications).map((e) => e.toLowerCase())

  if (jobEdu.length > 0 && candidate.highest_qualification) {
    const candEdu = candidate.highest_qualification.toLowerCase()
    const hasEduMatch = jobEdu.some((edu) => candEdu.includes(edu) || edu.includes(candEdu))

    if (hasEduMatch) {
      score += 0.5 // Match
      console.log("[v0] Education match: +0.5")
    } else if (candidate.highest_qualification) {
      score += 0.2 // Has education specified
      console.log("[v0] Education present: +0.2")
    }
  } else if (candidate.highest_qualification) {
    score += 0.3 // Education present
    console.log("[v0] Education present: +0.3")
  }

  // Round to 1 decimal place and cap at 10
  const finalScore = Math.min(Math.round(score * 10) / 10, 10.0)
  console.log("[v0] Final CV score:", finalScore, "/10")
  return finalScore
}

export async function calculateAndSaveCVScore(applicationId: string, jobId: string) {
  try {
    console.log("[v0] Calculating CV score for application:", applicationId)
    const supabase = createAdminClient()

    // Fetch application with candidate data
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select(
        `
        id,
        candidate_id,
        candidates (
          skills_for_role,
          skills_you_know,
          current_state,
          current_city,
          preferred_locations,
          total_experience_years,
          total_experience_months,
          highest_qualification,
          industry,
          department
        )
      `,
      )
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("[v0] Error fetching application:", appError)
      return { success: false, error: "Application not found" }
    }

    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("job_title, required_skills, job_locations, min_experience, max_experience, educational_qualifications")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      console.error("[v0] Error fetching job:", jobError?.message)
      return { success: false, error: "Job not found" }
    }

    // Calculate score
    const score = await calculateCVScore(application.candidates as any, job as any)

    // Save score to database
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ cv_score: score })
      .eq("id", applicationId)

    if (updateError) {
      console.error("[v0] Error saving CV score:", updateError)
      return { success: false, error: "Failed to save score" }
    }

    console.log("[v0] CV score saved successfully:", score)
    return { success: true, score }
  } catch (error: any) {
    console.error("[v0] Exception in calculateAndSaveCVScore:", error)
    return { success: false, error: error.message }
  }
}

export async function calculateCVScoresForJob(jobId: string) {
  try {
    console.log("[v0] Calculating CV scores for all applications in job:", jobId)
    const supabase = createAdminClient()

    // Fetch all applications for this job
    const { data: applications, error: appsError } = await supabase
      .from("job_applications")
      .select(
        `
        id,
        candidate_id,
        candidates (
          skills_for_role,
          skills_you_know,
          current_state,
          current_city,
          preferred_locations,
          total_experience_years,
          total_experience_months,
          highest_qualification,
          industry,
          department
        )
      `,
      )
      .eq("job_id", jobId)

    if (appsError) {
      console.error("[v0] Error fetching applications:", appsError)
      return { success: false, error: "Failed to fetch applications" }
    }

    console.log("[v0] Found", applications.length, "applications to score")

    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("job_title, required_skills, job_locations, min_experience, max_experience, educational_qualifications")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      console.error("[v0] Error fetching job:", jobError?.message)
      return { success: false, error: "Job not found" }
    }

    // Calculate scores for all applications
    const updates = await Promise.all(
      applications.map(async (app: any) => ({
        id: app.id,
        cv_score: await calculateCVScore(app.candidates, job),
      })),
    )

    console.log("[v0] Calculated scores:", updates.map((u) => `${u.id.substring(0, 8)}: ${u.cv_score}`).join(", "))

    // Batch update scores
    for (const update of updates) {
      await supabase.from("job_applications").update({ cv_score: update.cv_score }).eq("id", update.id)
    }

    console.log("[v0] Successfully updated", updates.length, "CV scores")
    return { success: true, count: updates.length }
  } catch (error: any) {
    console.error("[v0] Exception in calculateCVScoresForJob:", error)
    return { success: false, error: error.message }
  }
}
