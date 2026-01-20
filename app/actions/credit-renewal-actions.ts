"use server"

import { createAdminClient } from "@/lib/supabase-server"

/**
 * Check and renew monthly free credits for approved employers
 * This should be called on employer login/dashboard access
 */
export async function checkAndRenewMonthlyCredits(employerId: string) {
  try {
    console.log("[v0] ========== CHECKING MONTHLY CREDIT RENEWAL ==========")
    console.log("[v0] Employer ID:", employerId)

    const supabase = createAdminClient()

    // Get employer details
    const { data: employer, error: employerError } = await supabase
      .from("employers")
      .select("id, email, company_name, approval_status, approved_at")
      .eq("id", employerId)
      .single()

    if (employerError || !employer) {
      console.error("[v0] Employer not found:", employerId)
      return { success: false, error: "Employer not found" }
    }

    // Only process approved employers
    if (employer.approval_status !== "approved" || !employer.approved_at) {
      console.log("[v0] Employer not approved, skipping credit renewal")
      return { success: false, error: "Employer not approved" }
    }

    const approvedDate = new Date(employer.approved_at)
    const today = new Date()
    const dayOfMonth = approvedDate.getDate() // Day they were approved (e.g., 15 for 15th of month)

    console.log("[v0] Approved on:", approvedDate.toISOString())
    console.log("[v0] Today:", today.toISOString())
    console.log("[v0] Monthly renewal day:", dayOfMonth)

    // Get the most recent free credit allocation
    const { data: latestCredit, error: creditError } = await supabase
      .from("employer_credits")
      .select("id, allocated_at, expires_at, credits_remaining, is_expired")
      .eq("employer_id", employerId)
      .eq("plan_type", "free")
      .order("allocated_at", { ascending: false })
      .limit(1)
      .single()

    if (creditError && creditError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine for first-time users
      console.error("[v0] Error fetching latest credit:", creditError)
      return { success: false, error: "Failed to check credits" }
    }

    // If no credits exist at all, allocate initial 10 free credits
    if (!latestCredit) {
      console.log("[v0] No free credits found, allocating initial 10 credits")
      
      const { data: newCredit, error: insertError } = await supabase
        .from("employer_credits")
        .insert({
          employer_id: employerId,
          plan_type: "free",
          credits_allocated: 10,
          credits_used: 0,
          credits_remaining: 10,
          allocated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          is_expired: false,
          billing_cycle: "monthly",
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] ❌ Error allocating initial credits:", insertError)
        return { success: false, error: "Failed to allocate credits" }
      }

      console.log("[v0] ✓ Successfully allocated 10 initial free credits!")
      console.log("[v0] ========== CREDIT RENEWAL COMPLETE ==========")
      return { success: true, creditsAdded: 10, isRenewal: false }
    }

    // Check if it's time to renew (monthly on joining anniversary day)
    const lastAllocationDate = new Date(latestCredit.allocated_at)
    const monthsSinceLastAllocation = 
      (today.getFullYear() - lastAllocationDate.getFullYear()) * 12 +
      (today.getMonth() - lastAllocationDate.getMonth())

    console.log("[v0] Last allocation:", lastAllocationDate.toISOString())
    console.log("[v0] Months since last allocation:", monthsSinceLastAllocation)

    // Renew if:
    // 1. At least 1 month has passed since last allocation
    // 2. Today's date >= the monthly renewal day
    const shouldRenew = 
      monthsSinceLastAllocation >= 1 && 
      today.getDate() >= dayOfMonth

    if (!shouldRenew) {
      console.log("[v0] Not yet time for renewal, skipping")
      console.log("[v0] ========== CREDIT RENEWAL COMPLETE ==========")
      return { success: true, creditsAdded: 0, isRenewal: false, message: "Not due for renewal" }
    }

    // Check if we already renewed this month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), dayOfMonth)
    if (lastAllocationDate >= thisMonthStart) {
      console.log("[v0] Already renewed this month, skipping")
      console.log("[v0] ========== CREDIT RENEWAL COMPLETE ==========")
      return { success: true, creditsAdded: 0, isRenewal: false, message: "Already renewed this month" }
    }

    // Renew 10 free credits
    console.log("[v0] 🎁 Time to renew monthly credits!")
    
    const { data: renewedCredit, error: renewError } = await supabase
      .from("employer_credits")
      .insert({
        employer_id: employerId,
        plan_type: "free",
        credits_allocated: 10,
        credits_used: 0,
        credits_remaining: 10,
        allocated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_expired: false,
        billing_cycle: "monthly",
      })
      .select()
      .single()

    if (renewError) {
      console.error("[v0] ❌ Error renewing credits:", renewError)
      return { success: false, error: "Failed to renew credits" }
    }

    console.log("[v0] ✓ Successfully renewed 10 free credits!")
    console.log("[v0] Credit Record ID:", renewedCredit?.id)
    console.log("[v0] Expires At:", renewedCredit?.expires_at)
    console.log("[v0] ========== CREDIT RENEWAL COMPLETE ==========")

    return { success: true, creditsAdded: 10, isRenewal: true }
  } catch (error) {
    console.error("[v0] Exception in credit renewal:", error)
    return { success: false, error: "Failed to check/renew credits" }
  }
}
