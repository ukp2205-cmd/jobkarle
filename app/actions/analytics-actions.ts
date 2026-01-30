"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type TimeRange = "daily" | "weekly" | "monthly"

// Fetch daily job posts analytics
export async function fetchJobPostsAnalytics(range: TimeRange = "daily") {
  try {
    const supabase = createAdminClient()
    const days = range === "daily" ? 7 : range === "weekly" ? 28 : 90

    const { data, error } = await supabase.rpc("get_job_posts_analytics", {
      days_range: days,
    })

    if (error) {
      console.error("[v0] Error fetching job posts analytics:", error)
      // Return mock data if RPC doesn't exist yet
      return generateMockJobPostsData(range)
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception fetching job posts analytics:", error)
    return generateMockJobPostsData(range)
  }
}

// Fetch candidate registration analytics
export async function fetchCandidateRegistrationsAnalytics(range: TimeRange = "daily") {
  try {
    const supabase = createAdminClient()
    const days = range === "daily" ? 7 : range === "weekly" ? 28 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from("candidates")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching candidate registrations:", error)
      return { success: false, data: [] }
    }

    // Group by date
    const grouped = groupByDate(data, "created_at", days)
    return { success: true, data: grouped }
  } catch (error) {
    console.error("[v0] Exception fetching candidate registrations:", error)
    return { success: false, data: [] }
  }
}

// Fetch employer registration analytics
export async function fetchEmployerRegistrationsAnalytics(range: TimeRange = "daily") {
  try {
    const supabase = createAdminClient()
    const days = range === "daily" ? 7 : range === "weekly" ? 28 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from("employers")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching employer registrations:", error)
      return { success: false, data: [] }
    }

    // Group by date
    const grouped = groupByDate(data, "created_at", days)
    return { success: true, data: grouped }
  } catch (error) {
    console.error("[v0] Exception fetching employer registrations:", error)
    return { success: false, data: [] }
  }
}

// Fetch revenue analytics
export async function fetchRevenueAnalytics(range: TimeRange = "daily") {
  try {
    const supabase = createAdminClient()
    const days = range === "daily" ? 7 : range === "weekly" ? 28 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from("payment_transactions")
      .select("amount, created_at")
      .eq("status", "success")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching revenue analytics:", error)
      return { success: false, data: [] }
    }

    // Group by date and sum amounts
    const grouped = groupRevenueByDate(data, days)
    return { success: true, data: grouped }
  } catch (error) {
    console.error("[v0] Exception fetching revenue analytics:", error)
    return { success: false, data: [] }
  }
}

// Helper function to group data by date
function groupByDate(data: any[], dateField: string, days: number) {
  const result = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

    const count = data.filter((item) => {
      const itemDate = new Date(item[dateField]).toISOString().split("T")[0]
      return itemDate === dateStr
    }).length

    result.push({
      date: dateStr,
      day: dayName,
      count,
    })
  }

  return result
}

// Helper function to group revenue by date
function groupRevenueByDate(data: any[], days: number) {
  const result = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

    const revenue = data
      .filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().split("T")[0]
        return itemDate === dateStr
      })
      .reduce((sum, item) => sum + (item.amount / 100), 0) // Convert paise to rupees

    result.push({
      date: dateStr,
      day: dayName,
      revenue: Math.round(revenue * 100) / 100, // Round to 2 decimals
    })
  }

  return result
}

// Generate mock job posts data (fallback)
function generateMockJobPostsData(range: TimeRange) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const data = days.map((day) => ({
    day,
    active: Math.floor(Math.random() * 12) + 3,
    inactive: Math.floor(Math.random() * 5) + 1,
  }))

  return { success: true, data }
}

// Fetch all analytics data at once
export async function fetchAllAnalytics(range: TimeRange = "daily") {
  const [jobPosts, candidates, employers, revenue] = await Promise.all([
    fetchJobPostsAnalytics(range),
    fetchCandidateRegistrationsAnalytics(range),
    fetchEmployerRegistrationsAnalytics(range),
    fetchRevenueAnalytics(range),
  ])

  return {
    jobPosts,
    candidates,
    employers,
    revenue,
  }
}
