"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { deductCredits, getActiveCredits } from "./credits-actions"

// Job dashboard actions - Handles employer job management operations
// Exports: getJobPostingById, getEmployerJobs, closeJob, reopenJob, publishJobPosting, logoutEmployer, repostJob

export async function getJobPostingById(jobId: string) {
  try {
    console.log("[v0] Fetching job posting by ID:", jobId)

    const supabase = await createServerClient()

    const { data: job, error } = await supabase.from("job_postings").select("*").eq("id", jobId).single()

    if (error) {
      console.error("[v0] Error fetching job posting:", error)
      return { success: false, error: error.message, job: null }
    }

    if (!job) {
      console.log("[v0] Job posting not found")
      return { success: false, error: "Job not found", job: null }
    }

    console.log("[v0] Job posting fetched successfully:", job.job_title)
    return { success: true, job, error: null }
  } catch (error) {
    console.error("[v0] Error in getJobPostingById:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch job posting",
      job: null,
    }
  }
}

export async function getEmployerJobs(employerId: string, filters?: { status?: string }) {
  try {
    console.log("[v0] Fetching jobs for employer:", employerId)

    const supabase = await createServerClient()

    let query = supabase
      .from("job_postings")
      .select("*")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false })

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error("[v0] Error fetching employer jobs:", error)
      return { success: false, error: error.message, jobs: [] }
    }

    if (jobs && jobs.length > 0) {
      const jobsWithCounts = await Promise.all(
        jobs.map(async (job) => {
          const { count: totalResponses } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id)

          const { count: newResponses } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id)
            .eq("viewed_by_employer", false)

          const { count: shortlisted } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id)
            .eq("status", "shortlisted")

          return {
            ...job,
            total_responses: totalResponses || 0,
            new_responses: newResponses || 0,
            shortlisted: shortlisted || 0,
          }
        }),
      )

      console.log("[v0] Fetched jobs with counts:", jobsWithCounts.length)
      return { success: true, jobs: jobsWithCounts, error: null }
    }

    console.log("[v0] Fetched jobs count:", jobs?.length || 0)
    return { success: true, jobs: jobs || [], error: null }
  } catch (error) {
    console.error("[v0] Error in getEmployerJobs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch jobs",
      jobs: [],
    }
  }
}

export async function closeJob(jobId: string) {
  try {
    console.log("[v0] Closing job:", jobId)

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("job_postings")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error closing job:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Job closed successfully")
    return { success: true, job: data }
  } catch (error) {
    console.error("[v0] Error in closeJob:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to close job",
    }
  }
}

export async function reopenJob(jobId: string) {
  try {
    console.log("[v0] Reopening job:", jobId)

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("job_postings")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error reopening job:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Job reopened successfully")
    return { success: true, job: data }
  } catch (error) {
    console.error("[v0] Error in reopenJob:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reopen job",
    }
  }
}

export async function publishJobPosting(jobId: string) {
  try {
    console.log("[v0] Publishing job:", jobId)

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("job_postings")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error publishing job:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Job published successfully")
    return { success: true, job: data }
  } catch (error) {
    console.error("[v0] Error in publishJobPosting:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish job",
    }
  }
}

export async function logoutEmployer() {
  try {
    console.log("[v0] Logging out employer")

    const cookieStore = await cookies()
    cookieStore.delete("employer_session")

    console.log("[v0] Employer logged out successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in logoutEmployer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to logout",
    }
  }
}

export async function repostJob(jobId: string, employerId: string) {
  try {
    console.log("[v0] Reposting job:", jobId)

    const supabase = await createServerClient()

    const { data: job, error: fetchError } = await supabase
      .from("job_postings")
      .select("status, employer_id, category")
      .eq("id", jobId)
      .single()

    if (fetchError || !job) {
      console.error("[v0] Error fetching job:", fetchError)
      return { success: false, error: "Job not found" }
    }

    console.log("[v0] Job found:", job)

    // Verify ownership
    if (job.employer_id !== employerId) {
      console.log("[v0] Unauthorized - job employer:", job.employer_id, "vs current employer:", employerId)
      return { success: false, error: "Unauthorized to repost this job" }
    }

    const creditsNeeded = job.category === "premium" ? 2 : 1
    console.log(`[v0] Credits needed for ${job.category} job:`, creditsNeeded)

    console.log("[v0] Calling getActiveCredits...")
    const balance = await getActiveCredits(employerId)
    console.log("[v0] getActiveCredits returned:", balance)

    if (!balance || balance.remainingCredits < creditsNeeded) {
      console.log("[v0] Insufficient credits - balance:", balance, "needed:", creditsNeeded)
      return {
        success: false,
        error: `You need at least ${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""} to repost this job. Please purchase credits.`,
      }
    }

    console.log("[v0] Sufficient credits available, proceeding with repost...")

    // Only block deleted jobs
    if (job.status === "deleted") {
      console.log("[v0] Job is deleted")
      return { success: false, error: "Cannot repost a deleted job" }
    }

    console.log("[v0] Deducting", creditsNeeded, "credits...")
    const deductResult = await deductCredits(employerId, creditsNeeded)
    console.log("[v0] Deduct result:", deductResult)

    if (!deductResult.success) {
      return {
        success: false,
        error: deductResult.message || "Failed to deduct credits",
      }
    }

    console.log("[v0] Credits deducted, updating job status...")

    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + 30) // Extend 30 days from now

    const { data, error } = await supabase
      .from("job_postings")
      .update({
        status: "published",
        created_at: now.toISOString(), // Refresh posted date so job appears fresh
        updated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", jobId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error reposting job:", error)
      return { success: false, error: error.message }
    }

    console.log(`[v0] Job refreshed successfully, ${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""} deducted`)
    return { success: true, job: data }
  } catch (error) {
    console.error("[v0] Error in repostJob:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to repost job",
    }
  }
}
