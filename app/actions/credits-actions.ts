"use server"

// Credits management system for JobKarle platform
// All pricing calculations moved to lib/pricing-utils.ts

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type PlanType = "classic" | "premium"

export interface CreditBalance {
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  expiresSoon: boolean
}

export interface PlanRestrictions {
  maxLocations: number
  jobValidityDays: number
  appliesExpiryDays: number
}

/**
 * Allocate credits to an employer based on their plan
 * Classic: 1 credit, 1 location, 45 day validity
 * Premium: 1 credit, 3 locations, 30 day job validity, 60 day applies validity
 * Credits expire after 90 days
 */
export async function allocateCredits(employerId: string, planType: PlanType) {
  try {
    const supabase = await createServerClient()

    console.log(`[v0] Allocating ${planType} plan credits to employer:`, employerId)

    const { data, error } = await supabase.rpc("allocate_credits", {
      p_employer_id: employerId,
      p_plan_type: planType,
    })

    if (error) {
      console.error("[v0] Credit allocation error:", error)
      return { success: false, message: error.message }
    }

    console.log("[v0] Credits allocated successfully, credit ID:", data)
    return { success: true, creditId: data }
  } catch (error: any) {
    console.error("[v0] Credit allocation exception:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Get active (non-expired) credit balance for an employer
 */
export async function getActiveCredits(employerId: string): Promise<CreditBalance | null> {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Fetching active credits for employer:", employerId)

    const { data, error } = await supabase.rpc("get_active_credits", {
      p_employer_id: employerId,
    })

    if (error) {
      console.error("[v0] Error fetching credits:", error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        expiresSoon: false,
      }
    }

    const creditData = data[0]

    return {
      totalCredits: creditData.total_credits || 0,
      usedCredits: creditData.used_credits || 0,
      remainingCredits: creditData.remaining_credits || 0,
      expiresSoon: creditData.expires_soon || false,
    }
  } catch (error: any) {
    console.error("[v0] Get credits exception:", error)
    return null
  }
}

/**
 * Deduct credits when an employer posts a job with plan-specific validation
 * Classic: Deducts 1 credit, allows max 1 location
 * Premium: Deducts 2 credits, allows max 3 locations
 */
export async function deductCreditsWithPlanCheck(employerId: string, planType: PlanType, jobLocationsCount: number) {
  try {
    const supabase = await createServerClient()

    console.log(
      `[v0] Attempting to deduct credits for ${planType} plan with ${jobLocationsCount} location(s) from employer:`,
      employerId,
    )

    const { data, error } = await supabase.rpc("deduct_credits_with_plan_check", {
      p_employer_id: employerId,
      p_plan_type: planType,
      p_job_locations_count: jobLocationsCount,
    })

    if (error) {
      console.error("[v0] Credit deduction error:", error)
      return { success: false, message: error.message }
    }

    if (!data || data.length === 0) {
      return { success: false, message: "No response from credit deduction" }
    }

    const result = data[0]

    if (!result.success) {
      console.log("[v0] Credit deduction failed:", result.error_message)
      return {
        success: false,
        message: result.error_message,
        maxLocations: result.max_locations,
      }
    }

    console.log("[v0] Credits deducted successfully:", result.credits_deducted)
    return {
      success: true,
      creditsDeducted: result.credits_deducted,
      maxLocations: result.max_locations,
    }
  } catch (error: any) {
    console.error("[v0] Credit deduction exception:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Get plan restrictions for an employer based on their active credits
 */
export async function getEmployerPlanRestrictions(employerId: string): Promise<PlanRestrictions | null> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("employer_credits")
      .select("plan_type, max_locations, job_validity_days, applies_expiry_days")
      .eq("employer_id", employerId)
      .eq("is_expired", false)
      .gt("expires_at", new Date().toISOString())
      .gt("credits_remaining", 0)
      .order("allocated_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.log("[v0] No active plan found for employer")
      return null
    }

    return {
      maxLocations: data.max_locations || 1,
      jobValidityDays: data.job_validity_days || 45,
      appliesExpiryDays: data.applies_expiry_days || 45,
    }
  } catch (error: any) {
    console.error("[v0] Get plan restrictions exception:", error)
    return null
  }
}

/**
 * Deduct credits when an employer posts a job
 * Returns true if credits were successfully deducted, false if insufficient credits
 */
export async function deductCredits(employerId: string, creditsToDeduct = 1) {
  try {
    const supabase = await createServerClient()

    console.log(`[v0] Attempting to deduct ${creditsToDeduct} credits from employer:`, employerId)

    const { data, error } = await supabase.rpc("deduct_credits", {
      p_employer_id: employerId,
      p_credits_to_deduct: creditsToDeduct,
    })

    if (error) {
      console.error("[v0] Credit deduction error:", error)
      return { success: false, message: error.message }
    }

    if (data === false) {
      console.log("[v0] Insufficient credits for job posting")
      return { success: false, message: "Insufficient credits to post job" }
    }

    console.log("[v0] Credits deducted successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Credit deduction exception:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Get detailed credit history for an employer
 */
export async function getCreditHistory(employerId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("employer_credits")
      .select("*")
      .eq("employer_id", employerId)
      .order("allocated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching credit history:", error)
      return { success: false, message: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Credit history exception:", error)
    return { success: false, message: error.message, data: [] }
  }
}

/**
 * Check if employer has sufficient credits before posting a job
 */
export async function hasEnoughCredits(employerId: string, requiredCredits = 1): Promise<boolean> {
  const balance = await getActiveCredits(employerId)
  if (!balance) return false
  return balance.remainingCredits >= requiredCredits
}

/**
 * Expire old credits (called by cron job or manually)
 */
export async function expireOldCredits() {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.rpc("expire_old_credits")

    if (error) {
      console.error("[v0] Error expiring credits:", error)
      return { success: false, message: error.message }
    }

    console.log("[v0] Old credits expired successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Expire credits exception:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Refund credits to an employer (used when job posting fails after credit deduction)
 */
export async function refundCredits(employerId: string, creditsToRefund = 1) {
  try {
    const supabase = createAdminClient()

    console.log(`[v0] Attempting to refund ${creditsToRefund} credits to employer:`, employerId)

    const { data, error } = await supabase.rpc("refund_credits", {
      p_employer_id: employerId,
      p_credits_to_refund: creditsToRefund,
    })

    if (error) {
      console.error("[v0] Credit refund error:", error)
      return { success: false, message: error.message }
    }

    console.log("[v0] Credits refunded successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Credit refund exception:", error)
    return { success: false, message: error.message }
  }
}

// All functions in this file are async server actions
// Pricing utilities are in lib/pricing-utils.ts
