"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getEmployerSession } from "./employer-auth-actions"
import { deductCredits, getActiveCredits } from "./credits-actions"

export async function createJobPosting(data: any) {
  const supabase = createAdminClient()

  try {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log("[v0] [Request ID:", requestId, "] Creating job posting with data:", JSON.stringify(data, null, 2))

    const { success: sessionSuccess, session } = await getEmployerSession()

    if (!sessionSuccess || !session) {
      console.error("[v0] [Request ID:", requestId, "] Authentication error: No employer session found")
      return { success: false, error: "You must be logged in to create a job posting" }
    }

    console.log("[v0] [Request ID:", requestId, "] Authenticated employer ID:", session.employerId)

    // Validate credits BEFORE any processing for published jobs
    if (data.status === "published") {
      console.log("[v0] [Request ID:", requestId, "] Checking if employer has sufficient credits for job posting")

      // Get current credit balance for detailed validation
      console.log("[v0] [Request ID:", requestId, "] DEBUG: Starting credit check")
      const creditBalance = await getActiveCredits(session.employerId)
      console.log("[v0] [Request ID:", requestId, "] DEBUG: Credit balance returned:", JSON.stringify(creditBalance))

      if (!creditBalance) {
        console.log("[v0] [Request ID:", requestId, "] DEBUG: Credit balance is null - RPC call likely failed")
        return {
          success: false,
          error: "Unable to check credits. Please try again.",
          errorType: "credit_check_failed",
        }
      }

      if (creditBalance.remainingCredits < 2) {
        const remainingCredits = creditBalance.remainingCredits || 0
        console.log("[v0] [Request ID:", requestId, "] Insufficient credits - has", remainingCredits, "but needs 2")
        return {
          success: false,
          error:
            remainingCredits === 0
              ? "You have 0 credits. Minimum 2 credits required to post a job. Please purchase credits."
              : `Insufficient credits. You have ${remainingCredits} credit${remainingCredits === 1 ? "" : "s"} but need 2 to post a job. Please purchase more credits.`,
          errorType: "insufficient_credits",
          remainingCredits,
        }
      }

      console.log(
        "[v0] [Request ID:",
        requestId,
        "] Employer has",
        creditBalance.remainingCredits,
        "credits, proceeding with deduction",
      )

      // Deduct credits BEFORE job creation for atomic transaction
      console.log("[v0] [Request ID:", requestId, "] Deducting 2 credits BEFORE job creation")
      const deductResult = await deductCredits(session.employerId, 2)

      if (!deductResult.success) {
        console.error("[v0] [Request ID:", requestId, "] Failed to deduct credits:", deductResult.message)
        return {
          success: false,
          error: "Failed to deduct credits. Please try again.",
          errorType: "credit_deduction_failed",
        }
      }
      console.log("[v0] [Request ID:", requestId, "] Successfully deducted 2 credits from employer")
    }

    const insertData: any = {
      employer_id: session.employerId,

      hiring_for_type: data.hiringForType || "own_company",
      hiring_for_company_name: data.hiringForType === "client" ? data.hiringForCompanyName : null,

      // Step 1: Basic job details
      company_name: data.hiringForType === "own_company" ? session.companyName : data.companyName,
      hide_company_info: data.hideCompanyInfo || false,
      job_title: data.jobTitle,
      category: data.category || "classified",
      employment_type: data.employmentType,
      shift: data.shift,
      work_mode: data.workMode,
      job_locations: data.jobLocations || [],
      include_relocation: data.includeRelocation || false,

      // Step 2: Preferred candidate details
      min_experience: Number.parseInt(data.minExperience) || null,
      max_experience: Number.parseInt(data.maxExperience) || null,
      required_skills: data.requiredSkills || [],
      educational_qualifications: data.educationalQualifications || [],
      candidate_industries: data.candidateIndustries || [],
      video_profile_required: data.videoProfileRequired || false,

      // Step 3: Job description
      job_description: data.jobDescription,
      candidate_profile_headline: data.candidateProfileHeadline,
      role_description: data.roleDescription,
      key_responsibilities: data.keyResponsibilities,
      required_qualifications: data.requiredQualifications,

      // Step 3: Perks and benefits
      perks: data.perks || [],
      custom_perks: data.customPerks,

      // Diversity hiring
      diversity_hiring: data.diversityHiring,

      // Step 4: Screening questions
      screening_questions: data.screeningQuestions || [],

      // Step 5: Advanced options
      is_walk_in: data.isWalkIn || false,
      team_members: data.teamMembers || [],
      email_notification_preference: data.emailNotificationPreference,
      reference_code: data.referenceCode,
      enable_auto_refresh: data.enableAutoRefresh || false,
      refresh_frequency: data.refreshFrequency,
      refresh_duration: data.refreshDuration,

      // Salary (optional)
      min_salary: Number.parseFloat(data.minSalary) || null,
      max_salary: Number.parseFloat(data.maxSalary) || null,

      status: data.status || "published",
      urgent_hiring: data.urgentHiring !== undefined ? data.urgentHiring : data.urgent_hiring,
    }

    // Set published_at if status is published
    if (insertData.status === "published") {
      insertData.published_at = new Date().toISOString()
    }

    console.log("[v0] [Request ID:", requestId, "] Inserting job into database...")
    const { data: jobPosting, error } = await supabase.from("job_postings").insert(insertData).select().single()

    if (error) {
      console.error("[v0] [Request ID:", requestId, "] createJobPosting error:", error)

      // Refund credits if job creation fails after deduction
      if (insertData.status === "published") {
        console.log("[v0] [Request ID:", requestId, "] Job creation failed, attempting to refund 2 credits...")

        try {
          // Refund by adding credits back using admin client
          const { error: refundError } = await supabase.rpc("refund_credits", {
            p_employer_id: session.employerId,
            p_credits_to_refund: 2,
          })

          if (refundError) {
            console.error(
              "[v0] [Request ID:",
              requestId,
              "] CRITICAL: Failed to refund credits after job creation failure:",
              refundError,
            )
            console.error(
              "[v0] [Request ID:",
              requestId,
              "] MANUAL INTERVENTION REQUIRED - Employer ID:",
              session.employerId,
              "needs 2 credits refunded",
            )
          } else {
            console.log("[v0] [Request ID:", requestId, "] Successfully refunded 2 credits to employer")
          }
        } catch (refundException) {
          console.error("[v0] [Request ID:", requestId, "] CRITICAL: Exception during credit refund:", refundException)
          console.error(
            "[v0] [Request ID:",
            requestId,
            "] MANUAL INTERVENTION REQUIRED - Employer ID:",
            session.employerId,
            "needs 2 credits refunded",
          )
        }
      }

      let errorMessage = error.message

      // Check for category constraint violation
      if (error.message.includes("job_postings_category_check") || error.message.includes("category")) {
        errorMessage = "Invalid job category. Please select either 'Classified' or 'Premium'."
      }
      // Check for duplicate job posting
      else if (error.code === "23505") {
        errorMessage = "A job posting with similar details already exists. Please modify your job details."
      }

      return { success: false, error: errorMessage }
    }

    console.log("[v0] [Request ID:", requestId, "] Job posting created successfully:", jobPosting.id)

    if (insertData.status === "published") {
      try {
        console.log("[v0] [Request ID:", requestId, "] Indexing job in Elasticsearch:", jobPosting.id)
        const indexResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/jobs/index`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: jobPosting.id }),
        })

        if (!indexResponse.ok) {
          console.error("[v0] [Request ID:", requestId, "] Failed to index job in Elasticsearch")
        } else {
          console.log("[v0] [Request ID:", requestId, "] Job indexed in Elasticsearch successfully")
        }
      } catch (elasticError) {
        console.error("[v0] [Request ID:", requestId, "] Elasticsearch indexing error:", elasticError)
        // Don't fail the job posting if Elasticsearch indexing fails
      }
    }

    return { success: true, jobPosting }
  } catch (error: any) {
    console.error("[v0] createJobPosting exception:", error)
    return { success: false, error: error.message }
  }
}

export async function updateJobPosting(jobId: string, data: any) {
  const supabase = createAdminClient()

  try {
    const { data: jobPosting, error } = await supabase
      .from("job_postings")
      .update({
        ...data,
        urgent_hiring: data.urgentHiring !== undefined ? data.urgentHiring : data.urgent_hiring,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select()
      .single()

    if (error) {
      console.error("[v0] updateJobPosting error:", error)
      return { success: false, error: error.message }
    }

    try {
      console.log("[v0] Updating job in Elasticsearch:", jobId)
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/jobs/index`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })

      if (!updateResponse.ok) {
        console.error("[v0] Failed to update job in Elasticsearch")
      } else {
        console.log("[v0] Job updated in Elasticsearch successfully")
      }
    } catch (elasticError) {
      console.error("[v0] Elasticsearch update error:", elasticError)
    }

    return { success: true, jobPosting }
  } catch (error: any) {
    console.error("[v0] updateJobPosting exception:", error)
    return { success: false, error: error.message }
  }
}

export async function publishJobPosting(jobId: string) {
  const supabase = createAdminClient()

  try {
    const { data: jobPosting, error } = await supabase
      .from("job_postings")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select()
      .single()

    if (error) {
      console.error("[v0] publishJobPosting error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, jobPosting }
  } catch (error: any) {
    console.error("[v0] publishJobPosting exception:", error)
    return { success: false, error: error.message }
  }
}

export async function getEmployerJobPostings(employerId: string) {
  const supabase = createAdminClient()

  try {
    const { data: jobPostings, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] getEmployerJobPostings error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, jobPostings }
  } catch (error: any) {
    console.error("[v0] getEmployerJobPostings exception:", error)
    return { success: false, error: error.message }
  }
}
