import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Cron job to allocate monthly recurring credits to approved free plan employers
 * Runs daily to check and allocate 10 credits to eligible employers
 * 
 * Vercel Cron: 0 0 * * * (Daily at midnight UTC)
 * 
 * Security: Protected by Vercel Cron Secret
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[v0] Unauthorized cron job access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Monthly credits allocation cron job started")

    const supabase = createAdminClient()

    // Find all approved employers who registered for FREE plan
    // Check if they have not received credits in the current month
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Get all approved employers
    const { data: employers, error: employersError } = await supabase
      .from("employers")
      .select("id, email, company_name, approved_at")
      .eq("approval_status", "approved")
      .not("approved_at", "is", null)

    if (employersError) {
      console.error("[v0] Error fetching approved employers:", employersError)
      return NextResponse.json({ error: "Failed to fetch employers" }, { status: 500 })
    }

    console.log(`[v0] Found ${employers?.length || 0} approved employers`)

    let creditsAllocated = 0
    let errors = 0

    for (const employer of employers || []) {
      try {
        const approvalDate = new Date(employer.approved_at)
        const monthsSinceApproval = Math.floor(
          (today.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )

        console.log(
          `[v0] Checking employer ${employer.id} - Approved: ${approvalDate.toISOString()}, Months since: ${monthsSinceApproval}`
        )

        // Check if employer already received credits this month
        const { data: existingCredits, error: creditsCheckError } = await supabase
          .from("employer_credits")
          .select("id, allocated_at")
          .eq("employer_id", employer.id)
          .eq("plan_type", "free")
          .gte("allocated_at", firstDayOfMonth.toISOString())

        if (creditsCheckError) {
          console.error(`[v0] Error checking credits for employer ${employer.id}:`, creditsCheckError)
          errors++
          continue
        }

        if (existingCredits && existingCredits.length > 0) {
          console.log(`[v0] Employer ${employer.id} already received credits this month - skipping`)
          continue
        }

        // Calculate days from approval date to check if it's time for monthly allocation
        const daysSinceApproval = Math.floor((today.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24))
        const approvalDay = approvalDate.getDate()
        const todayDay = today.getDate()

        // Allocate credits on the same day of month as approval date (or last day of month if approval day doesn't exist)
        const shouldAllocate =
          daysSinceApproval >= 30 && (todayDay === approvalDay || (todayDay === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() && approvalDay > todayDay))

        if (!shouldAllocate) {
          console.log(
            `[v0] Not time to allocate for employer ${employer.id} - Approval day: ${approvalDay}, Today: ${todayDay}`
          )
          continue
        }

        // Allocate 10 free monthly credits
        console.log(`[v0] Allocating 10 monthly credits to employer ${employer.id}`)

        const { data: creditRecord, error: creditError } = await supabase
          .from("employer_credits")
          .insert({
            employer_id: employer.id,
            plan_type: "free",
            credits_allocated: 10,
            credits_used: 0,
            credits_remaining: 10,
            allocated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days expiry
            is_expired: false,
            billing_cycle: "monthly",
          })
          .select()
          .single()

        if (creditError) {
          console.error(`[v0] Error allocating credits to employer ${employer.id}:`, creditError)
          errors++
          continue
        }

        console.log(
          `[v0] Successfully allocated 10 monthly credits to ${employer.company_name} (${employer.email}), credit ID: ${creditRecord?.id}`
        )
        creditsAllocated++
      } catch (error) {
        console.error(`[v0] Exception processing employer ${employer.id}:`, error)
        errors++
      }
    }

    console.log(`[v0] Monthly credits allocation completed - Allocated: ${creditsAllocated}, Errors: ${errors}`)

    return NextResponse.json(
      {
        success: true,
        message: "Monthly credits allocation completed",
        creditsAllocated,
        errors,
        processedEmployers: employers?.length || 0,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: error.message || "Cron job failed" }, { status: 500 })
  }
}
