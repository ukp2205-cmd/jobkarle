"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { calculateAndSaveCVScore } from "./cv-scoring-actions"

export interface JobApplication {
  id: string
  candidate_id: string
  job_id: string
  status: string
  applied_at: string
  screening_answers: any
  resume_url: string | null
  cv_score: number | null // Added cv_score field
  candidate: {
    full_name: string
    email: string
    mobile_number: string
    current_job_title: string
    company_name: string
    skills_for_role: string[]
    skills_you_know: string[]
    preferred_locations: string[]
    current_state: string
    current_city: string
    notice_period: string
    availability_to_join: string
    work_status: string
    preferred_salary: string
    annual_salary: string
    total_experience_years: number
    total_experience_months: number
    highest_qualification: string
    course: string
    industry: string
    department: string
    gender: string
    resume_headline: string | null
    languages_known: any | null // Changed from languages to languages_known
    employment_history: any | null // Changed from previous_employment to employment_history
    resume_url: string | null
  }
}

export async function getJobApplications(
  jobId: string,
  filters?: {
    status?: string
    search?: string
    experience?: string
    location?: string
    salary?: string
  },
) {
  try {
    console.log("[v0] ========== GET JOB APPLICATIONS ==========")
    console.log("[v0] Job ID:", jobId)
    console.log("[v0] Filters:", JSON.stringify(filters))
    console.log("[v0] Environment:", process.env.NODE_ENV)
    console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing")

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] ERROR: Missing Supabase environment variables")
      return {
        success: false,
        error: "Database configuration error. Please contact support.",
        applications: [],
        job: null,
      }
    }

    const supabase = createAdminClient()

    if (!jobId) {
      console.error("[v0] ERROR: No job ID provided")
      return { success: false, error: "Job ID is required", applications: [], job: null }
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 15000),
    )

    const jobPromise = supabase
      .from("job_postings")
      .select("id, job_title, employer_id, status")
      .eq("id", jobId)
      .single()

    const { data: job, error: jobError } = (await Promise.race([jobPromise, timeoutPromise])) as any

    if (jobError || !job) {
      console.error("[v0] ERROR: Job not found:", jobError)
      return {
        success: false,
        error: jobError?.message || "Job not found. Please check the job ID.",
        applications: [],
        job: null,
      }
    }

    console.log("[v0] Job found:", job.job_title, "| Employer ID:", job.employer_id)

    if (job.status === "draft") {
      console.log("[v0] Job is in draft status - no responses available")
      return {
        success: true,
        applications: [],
        job: {
          id: job.id,
          title: job.job_title,
          employer_id: job.employer_id,
          status: job.status,
        },
        isDraft: true,
      }
    }

    let query = supabase
      .from("job_applications")
      .select("id, candidate_id, job_id, status, applied_at, screening_answers, resume_url, cv_score")
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      console.log("[v0] Filtering by status:", filters.status)
      query = query.eq("status", filters.status)
    }

    const appsPromise = query
    const { data: applicationsData, error: appsError } = (await Promise.race([appsPromise, timeoutPromise])) as any

    if (appsError) {
      console.error("[v0] ERROR: Failed to fetch applications:", appsError)
      return {
        success: false,
        error: `Failed to load applications: ${appsError.message}`,
        applications: [],
        job: null,
      }
    }

    console.log("[v0] Found applications:", applicationsData?.length || 0)

    if (!applicationsData || applicationsData.length === 0) {
      console.log("[v0] No applications found for this job")
      return {
        success: true,
        applications: [],
        job: {
          id: job.id,
          title: job.job_title,
          employer_id: job.employer_id,
          status: job.status,
        },
      }
    }

    const appsWithoutScore = applicationsData.filter((app: any) => app.cv_score === null || app.cv_score === undefined)
    if (appsWithoutScore.length > 0) {
      console.log("[v0] Auto-calculating CV scores for", appsWithoutScore.length, "applications")
      // Calculate in parallel for faster processing
      await Promise.all(
        appsWithoutScore.map((app: any) =>
          calculateAndSaveCVScore(app.id, jobId).catch((err) => {
            console.error("[v0] Error calculating CV score for app", app.id, ":", err)
          }),
        ),
      )

      // Refetch applications to get updated scores
      const { data: updatedApps } = await supabase
        .from("job_applications")
        .select("id, candidate_id, job_id, status, applied_at, screening_answers, resume_url, cv_score")
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false })

      if (updatedApps) {
        applicationsData.length = 0
        applicationsData.push(...updatedApps)
        console.log("[v0] Refetched applications with updated CV scores")
      }
    }

    const candidateIds = applicationsData.map((app: any) => app.candidate_id)
    console.log("[v0] Fetching", candidateIds.length, "candidates")

    const candidatesPromise = supabase
      .from("candidates")
      .select(
        "id, full_name, email, mobile_number, current_job_title, company_name, skills_for_role, skills_you_know, preferred_locations, current_state, current_city, notice_period, availability_to_join, work_status, preferred_salary, annual_salary, total_experience_years, total_experience_months, highest_qualification, course, industry, department, gender, resume_headline, languages_known, employment_history, resume_url",
      )
      .in("id", candidateIds)

    const { data: candidatesData, error: candidatesError } = (await Promise.race([
      candidatesPromise,
      timeoutPromise,
    ])) as any

    if (candidatesError) {
      console.error("[v0] ERROR: Failed to fetch candidates:", candidatesError)
      return {
        success: false,
        error: `Failed to load candidate details: ${candidatesError.message}`,
        applications: [],
        job: null,
      }
    }

    console.log("[v0] Found candidates:", candidatesData?.length || 0)

    const candidatesMap = new Map((candidatesData || []).map((c: any) => [c.id, c]))

    const applications: JobApplication[] = applicationsData
      .map((app: any) => {
        const candidate = candidatesMap.get(app.candidate_id)
        if (!candidate) {
          console.warn(`[v0] WARNING: No candidate found for ID ${app.candidate_id}`)
          return null
        }
        return {
          id: app.id,
          candidate_id: app.candidate_id,
          job_id: app.job_id,
          status: app.status,
          applied_at: app.applied_at,
          screening_answers: app.screening_answers,
          resume_url: app.resume_url,
          cv_score: app.cv_score,
          candidate: {
            full_name: candidate.full_name,
            email: candidate.email,
            mobile_number: candidate.mobile_number,
            current_job_title: candidate.current_job_title,
            company_name: candidate.company_name,
            skills_for_role: candidate.skills_for_role || [],
            skills_you_know: candidate.skills_you_know || [],
            preferred_locations: candidate.preferred_locations || [],
            current_state: candidate.current_state,
            current_city: candidate.current_city,
            notice_period: candidate.notice_period,
            availability_to_join: candidate.availability_to_join,
            work_status: candidate.work_status,
            preferred_salary: candidate.preferred_salary,
            annual_salary: candidate.annual_salary,
            total_experience_years: candidate.total_experience_years || 0,
            total_experience_months: candidate.total_experience_months || 0,
            highest_qualification: candidate.highest_qualification,
            course: candidate.course,
            industry: candidate.industry,
            department: candidate.department,
            gender: candidate.gender,
            resume_headline: candidate.resume_headline || null,
            languages_known: candidate.languages_known || null,
            employment_history: candidate.employment_history || null,
            resume_url: candidate.resume_url || null,
          },
        }
      })
      .filter((app): app is JobApplication => app !== null)

    // Apply client-side filters
    let filteredApplications = applications

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      const beforeFilter = filteredApplications.length
      filteredApplications = filteredApplications.filter(
        (app) =>
          app.candidate.full_name?.toLowerCase().includes(searchLower) ||
          app.candidate.email?.toLowerCase().includes(searchLower) ||
          app.candidate.current_job_title?.toLowerCase().includes(searchLower) ||
          app.candidate.skills_for_role?.some((skill: string) => skill.toLowerCase().includes(searchLower)) ||
          app.candidate.skills_you_know?.some((skill: string) => skill.toLowerCase().includes(searchLower)),
      )
      console.log(`[v0] Search filter: ${beforeFilter} → ${filteredApplications.length} applications`)
    }

    if (filters?.experience) {
      const [min, max] = filters.experience.split("-").map(Number)
      const beforeFilter = filteredApplications.length
      filteredApplications = filteredApplications.filter((app) => {
        const exp = app.candidate.total_experience_years || 0
        if (max) return exp >= min && exp <= max
        return exp >= min
      })
      console.log(
        `[v0] Experience filter (${filters.experience}): ${beforeFilter} → ${filteredApplications.length} applications`,
      )
    }

    if (filters?.location) {
      const locationLower = filters.location.toLowerCase()
      const beforeFilter = filteredApplications.length
      filteredApplications = filteredApplications.filter(
        (app) =>
          app.candidate.current_state?.toLowerCase().includes(locationLower) ||
          app.candidate.current_city?.toLowerCase().includes(locationLower),
      )
      console.log(`[v0] Location filter: ${beforeFilter} → ${filteredApplications.length} applications`)
    }

    console.log("[v0] Final result:", filteredApplications.length, "applications after all filters")
    console.log("[v0] ==========================================")

    return {
      success: true,
      applications: filteredApplications,
      applicationsCount: filteredApplications.length,
      jobTitle: job.job_title,
      job: {
        id: job.id,
        title: job.job_title,
        employer_id: job.employer_id,
        status: job.status,
      },
    }
  } catch (error: any) {
    console.error("[v0] EXCEPTION in getJobApplications:", error)
    return {
      success: false,
      error: `Database error: ${error.message}. Please try again or contact support.`,
      applications: [],
      job: null,
    }
  }
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId)

    if (error) {
      console.error("[v0] Error updating application status:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in updateApplicationStatus:", error)
    return { success: false, error: error.message }
  }
}

export async function bulkUpdateApplicationStatus(applicationIds: string[], status: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", applicationIds)

    if (error) {
      console.error("[v0] Error bulk updating application status:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in bulkUpdateApplicationStatus:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteApplication(applicationId: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from("job_applications").delete().eq("id", applicationId)

    if (error) {
      console.error("[v0] Error deleting application:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in deleteApplication:", error)
    return { success: false, error: error.message }
  }
}
