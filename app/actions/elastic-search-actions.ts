// Client-side action to search jobs via Elasticsearch API with fallback to Supabase
"use server"

export async function searchJobsWithElastic(
  query: string,
  filters?: {
    city?: string
    min_experience?: number
    max_experience?: number
    min_salary?: number
    max_salary?: number
    employment_type?: string
    work_mode?: string
  },
) {
  try {
    const requestBody: any = {
      page: 1,
      limit: 50,
    }

    // Add keyword search
    if (query && query.trim()) {
      requestBody.keyword = query.trim()
    }

    // Add city filter
    if (filters?.city) {
      requestBody.city = filters.city
    }

    // Add experience filter
    if (filters?.min_experience !== undefined || filters?.max_experience !== undefined) {
      requestBody.experience = {
        min: filters?.min_experience,
        max: filters?.max_experience,
      }
    }

    // Add salary filter
    if (filters?.min_salary !== undefined || filters?.max_salary !== undefined) {
      requestBody.salary = {
        min: filters?.min_salary,
        max: filters?.max_salary,
      }
    }

    console.log("[v0] === Elasticsearch Search Attempt ===")
    console.log("[v0] Request body:", requestBody)

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/jobs/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    })

    console.log("[v0] API Response status:", response.status)

    if (!response.ok) {
      console.log("[v0] ⚠️ Elasticsearch unavailable, falling back to Supabase search")
      return await fallbackToSupabaseSearch(query, filters)
    }

    const data = await response.json()

    if (!data.success) {
      console.log("[v0] ⚠️ Elasticsearch returned failure, falling back to Supabase search")
      return await fallbackToSupabaseSearch(query, filters)
    }

    console.log("[v0] ✓ Elasticsearch search successful - Jobs:", data.jobs?.length || 0)
    return {
      success: true,
      jobs: data.jobs || [],
      total: data.total || 0,
      source: "elasticsearch",
      jobsCount: data.jobs?.length || 0,
    }
  } catch (error: any) {
    console.log("[v0] ⚠️ Elasticsearch error, falling back to Supabase search:", error.message)
    return await fallbackToSupabaseSearch(query, filters)
  }
}

async function fallbackToSupabaseSearch(
  query: string,
  filters?: {
    city?: string
    min_experience?: number
    max_experience?: number
    min_salary?: number
    max_salary?: number
    employment_type?: string
    work_mode?: string
  },
) {
  try {
    console.log("[v0] === Using Supabase Search Fallback ===")

    // Convert filters to Supabase search format
    const supabaseFilters: any = {}

    if (filters?.city) {
      supabaseFilters.locations = [filters.city]
    }

    if (filters?.min_experience !== undefined) {
      supabaseFilters.minExperience = filters.min_experience
    }

    if (filters?.max_experience !== undefined) {
      supabaseFilters.maxExperience = filters.max_experience
    }

    if (filters?.min_salary !== undefined) {
      supabaseFilters.minSalary = filters.min_salary
    }

    if (filters?.max_salary !== undefined) {
      supabaseFilters.maxSalary = filters.max_salary
    }

    if (filters?.employment_type) {
      supabaseFilters.employmentTypes = [filters.employment_type]
    }

    if (filters?.work_mode) {
      supabaseFilters.workModes = [filters.work_mode]
    }

    // Call existing Supabase search with relevance scoring
    const { searchJobs } = await import("@/app/actions/candidate-search-actions")
    const result = await searchJobs(query, supabaseFilters)

    if (!result.success) {
      throw new Error(result.error || "Supabase search failed")
    }

    console.log("[v0] ✓ Supabase fallback search successful - Jobs:", result.jobs?.length || 0)

    return {
      success: true,
      jobs: result.jobs || [],
      total: result.jobs?.length || 0,
      source: "supabase_fallback",
      jobsCount: result.jobs?.length || 0,
    }
  } catch (error: any) {
    console.error("[v0] ✗ Supabase fallback also failed:", error.message)
    return {
      success: false,
      error: error.message,
      jobs: [],
      total: 0,
      source: "all_failed",
      jobsCount: 0,
    }
  }
}

// Original function for advanced search (kept for backward compatibility)
export async function searchJobsAdvanced(params: {
  keyword?: string
  city?: string | string[]
  experience?: { min?: number; max?: number }
  salary?: { min?: number; max?: number }
  page?: number
  limit?: number
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/jobs/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Search failed")
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error("[Elastic Search] Error:", error)
    return {
      success: false,
      error: error.message,
      jobs: [],
      total: 0,
    }
  }
}

export async function getAutocompleteSuggestions(keyword: string, field = "title") {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/jobs/search?keyword=${encodeURIComponent(keyword)}&field=${field}`,
      {
        method: "GET",
        cache: "no-store",
      },
    )

    if (!response.ok) {
      throw new Error("Autocomplete failed")
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error("[Elastic Autocomplete] Error:", error)
    return {
      success: false,
      error: error.message,
      suggestions: [],
    }
  }
}
