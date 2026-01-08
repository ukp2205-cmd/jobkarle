"use server"

import { createServerClient } from "@/lib/supabase/server"

export interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  credits_allocated: number
  billing_cycle: string
  currency: string
  features: any
  is_active: boolean
  max_locations?: number
  job_validity_days?: number
  applies_expiry_days?: number
  credits_validity_days?: number
  credits_per_post?: number
}

/**
 * Fetch all active plans from database, grouped by billing cycle
 */
export async function getActivePlansByBillingCycle(billingCycle: "monthly" | "annual"): Promise<Plan[]> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .eq("billing_cycle", billingCycle)
      .order("price", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching plans:", error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error("[v0] Plans fetch exception:", error)
    return []
  }
}

/**
 * Fetch all active plans from database
 * Classic: ₹400 + GST, 1 location, deducts 1 credit
 * Premium: ₹750 + GST, 3 locations, deducts 2 credits
 */
export async function getActivePlans(): Promise<Plan[]> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching plans:", error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error("[v0] Plans fetch exception:", error)
    return []
  }
}

/**
 * Get specific plan price for payment with GST
 */
export async function getPlanPriceWithGST(
  planSlug: string,
): Promise<{ basePrice: number; gstAmount: number; totalPrice: number } | null> {
  try {
    const supabase = await createServerClient()

    const normalizedSlug = (planSlug || "")
      .replace(/[-\s]+/g, "")
      .replace(/plan$/i, "")
      .toLowerCase()
      .trim()

    const { data, error } = await supabase
      .from("plans")
      .select("price")
      .eq("is_active", true)
      .ilike("slug", normalizedSlug)
      .single()

    if (error || !data) {
      console.error("[v0] Plan not found:", planSlug)
      return null
    }

    const basePrice = data.price
    const gstAmount = Math.round(basePrice * 0.18 * 100) / 100
    const totalPrice = basePrice + gstAmount

    return {
      basePrice,
      gstAmount,
      totalPrice,
    }
  } catch (error: any) {
    console.error("[v0] Plan price fetch exception:", error.message)
    return null
  }
}

/**
 * Get specific plan price for payment
 * Added better error handling with detailed logging
 */
export async function getPlanPrice(planSlug: string, billingCycle: "monthly" | "annual"): Promise<number> {
  try {
    const supabase = await createServerClient()

    const normalizedSlug = (planSlug || "")
      .replace(/[-\s]+/g, "") // Remove hyphens and spaces first
      .replace(/plan$/i, "") // Remove "plan" suffix
      .toLowerCase() // Then convert to lowercase
      .trim()

    console.log("[v0] Normalized plan slug:", planSlug, "→", normalizedSlug)

    const { data: allPlans, error: allPlansError } = await supabase
      .from("plans")
      .select("slug, price, billing_cycle, is_active")
      .eq("billing_cycle", billingCycle)
      .eq("is_active", true)

    if (!allPlansError && allPlans) {
      console.log("[v0] Available plans in DB for", billingCycle, ":", allPlans.map((p) => p.slug).join(", "))

      const normalizedDbSlugs = allPlans.map((p) => ({
        ...p,
        normalizedSlug: p.slug
          .replace(/[-\s]+/g, "") // Remove hyphens and spaces first
          .replace(/plan$/i, "") // Remove "plan" suffix
          .toLowerCase() // Then convert to lowercase
          .trim(),
      }))

      const matchedPlan = normalizedDbSlugs.find((p) => p.normalizedSlug === normalizedSlug)
      if (matchedPlan) {
        console.log("[v0] Found plan by normalized match:", matchedPlan.slug, "Amount:", matchedPlan.price)
        return Math.round(matchedPlan.price)
      }
    }

    console.error("[v0] Plan not found with any variation for:", planSlug)
    return 0
  } catch (error: any) {
    console.error("[v0] Plan price fetch exception:", error.message)
    return 0
  }
}

// Additional function to fetch plan details by slug
export async function getPlanDetailsBySlug(planSlug: string): Promise<Plan | null> {
  try {
    const supabase = await createServerClient()

    const normalizedSlug = (planSlug || "")
      .replace(/[-\s]+/g, "")
      .replace(/plan$/i, "")
      .toLowerCase()
      .trim()

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .ilike("slug", normalizedSlug)
      .single()

    if (error || !data) {
      console.error("[v0] Plan not found:", planSlug)
      return null
    }

    return data
  } catch (error: any) {
    console.error("[v0] Plan details fetch exception:", error.message)
    return null
  }
}
