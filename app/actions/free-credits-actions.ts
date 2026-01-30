"use server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Allocate 10 free credits to employer on approval or first login
 * These credits renew monthly from approval date
 */
export async function allocateMonthlyFreeCredits(employerId: string) {
  try {
    // Validate employerId
    if (!employerId || employerId.trim() === "") {
      console.error("[v0] allocateMonthlyFreeCredits called with empty employerId")
      return { success: false, message: "Invalid employer ID" }
    }

    const supabase = createAdminClient()

    console.log("[v0] Allocating monthly free credits (10) to employer:", employerId)

    // Insert 10 free credits with 30-day validity
    const { data, error } = await supabase
      .from("employer_credits")
      .insert({
        employer_id: employerId,
        plan_type: "free",
        billing_cycle: "monthly",
        credits_allocated: 10,
        credits_used: 0,
        credits_remaining: 10,
        allocated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_expired: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Free credit allocation error:", error)
      return { success: false, message: error.message }
    }

    console.log("[v0] Free credits allocated successfully, credit ID:", data.id)
    return { success: true, creditId: data.id, creditsAllocated: 10 }
  } catch (error: any) {
    console.error("[v0] Free credit allocation exception:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Check if employer already has active free credits
 */
export async function hasActiveFreeCredits(employerId: string): Promise<boolean> {
  try {
    // Validate employerId before making database query
    if (!employerId || employerId.trim() === "") {
      console.warn("[v0] hasActiveFreeCredits called with empty employerId")
      return false
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("employer_credits")
      .select("id")
      .eq("employer_id", employerId)
      .eq("plan_type", "free")
      .eq("is_expired", false)
      .gt("credits_remaining", 0)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error checking free credits:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("[v0] Exception checking free credits:", error)
    return false
  }
}

/**
 * Get breakdown of free vs purchased credits
 */
export async function getCreditBreakdown(employerId: string) {
  try {
    const supabase = createAdminClient()

    // Get free credits
    const { data: freeCredits } = await supabase
      .from("employer_credits")
      .select("credits_remaining, expires_at")
      .eq("employer_id", employerId)
      .eq("plan_type", "free")
      .eq("is_expired", false)
      .gt("credits_remaining", 0)

    // Get purchased credits (classified, premium)
    const { data: purchasedCredits } = await supabase
      .from("employer_credits")
      .select("credits_remaining, expires_at, plan_type")
      .eq("employer_id", employerId)
      .neq("plan_type", "free")
      .eq("is_expired", false)
      .gt("credits_remaining", 0)

    const freeTotal = freeCredits?.reduce((sum, c) => sum + c.credits_remaining, 0) || 0
    const purchasedTotal = purchasedCredits?.reduce((sum, c) => sum + c.credits_remaining, 0) || 0

    console.log("[v0] Credit breakdown - Free:", freeTotal, "Purchased:", purchasedTotal)

    return {
      success: true,
      freeCredits: freeTotal,
      purchasedCredits: purchasedTotal,
      totalCredits: freeTotal + purchasedTotal,
      breakdown: {
        free: freeCredits || [],
        purchased: purchasedCredits || [],
      },
    }
  } catch (error: any) {
    console.error("[v0] Credit breakdown exception:", error)
    return {
      success: false,
      freeCredits: 0,
      purchasedCredits: 0,
      totalCredits: 0,
    }
  }
}
