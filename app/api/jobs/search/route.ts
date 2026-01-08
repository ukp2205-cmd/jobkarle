// API route for job search using Elasticsearch
// This endpoint handles all search queries from the frontend

import { type NextRequest, NextResponse } from "next/server"
import { searchJobsWithElasticsearch, isElasticsearchConfigured } from "@/lib/elastic-fetch"

export const runtime = "nodejs"

console.log("[v0] 🚀 API route /api/jobs/search is being loaded...")

export async function POST(request: NextRequest) {
  console.log("[v0] ========================================")
  console.log("[v0] ✓✓✓ API ROUTE LOADED AND EXECUTING ✓✓✓")
  console.log("[v0] API /api/jobs/search called at:", new Date().toISOString())
  console.log("[v0] ========================================")

  try {
    console.log("[v0] === Elasticsearch Search API Called ===")
    console.log("[v0] ELASTIC_URL:", process.env.ELASTIC_URL || "NOT SET")

    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      console.error("[v0] Failed to parse request body:", jsonError.message)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { keyword, city, experience, salary, page = 1, limit = 50 } = body

    console.log("[v0] Search request:", { keyword, city, experience, salary, page, limit })

    // Check if Elasticsearch is configured
    if (!isElasticsearchConfigured()) {
      console.log("[v0] ✗ Elasticsearch not configured - ELASTIC_URL not set")
      return NextResponse.json(
        {
          success: false,
          error: "Elasticsearch not configured",
          message: "Please set ELASTIC_URL environment variable in Vercel project settings",
        },
        { status: 503 },
      )
    }

    // Build search parameters
    const searchParams: any = {
      keyword,
      page,
      limit,
    }

    // Add city filter
    if (city) {
      searchParams.city = city
    }

    // Add experience filter
    if (experience) {
      if (experience.min !== undefined) searchParams.minExperience = experience.min
      if (experience.max !== undefined) searchParams.maxExperience = experience.max
    }

    // Add salary filter
    if (salary) {
      if (salary.min !== undefined) searchParams.minSalary = salary.min
      if (salary.max !== undefined) searchParams.maxSalary = salary.max
    }

    // Execute search using fetch-based client
    const result = await searchJobsWithElasticsearch(searchParams)

    if (!result.success) {
      console.error("[v0] ✗ Elasticsearch search failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          elasticsearchUrl: process.env.ELASTIC_URL, // Help user debug connection issues
          hint: process.env.ELASTIC_URL?.includes("localhost")
            ? "localhost URLs only work in local development. For production, use a cloud Elasticsearch instance (Elastic Cloud, AWS, etc.)"
            : "Ensure Elasticsearch is accessible from Vercel and check firewall rules",
        },
        { status: 503 },
      )
    }

    console.log("[v0] ✓ Search successful - Total:", result.total, "Returned:", result.jobs.length)

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    })
  } catch (error: any) {
    console.error("[v0] ✗ Search API error:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Autocomplete/suggestions endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get("keyword") || ""
    const field = searchParams.get("field") || "title"

    if (!keyword) {
      return NextResponse.json({ success: true, suggestions: [] })
    }

    console.log("[Elasticsearch] Autocomplete request:", { keyword, field })

    // Use match query for autocomplete
    const response = await searchJobsWithElasticsearch({
      keyword,
      field,
      limit: 10,
    })

    if (!response.success) {
      console.error("[Elasticsearch] Autocomplete error:", response.error)
      return NextResponse.json(
        {
          success: false,
          error: response.error,
        },
        { status: 500 },
      )
    }

    const suggestions = response.jobs.map((job: any) => ({
      value: job[field],
      id: job.id,
    }))

    // Remove duplicates
    const uniqueSuggestions = Array.from(new Map(suggestions.map((item: any) => [item.value, item])).values())

    return NextResponse.json({
      success: true,
      suggestions: uniqueSuggestions,
    })
  } catch (error: any) {
    console.error("[Elasticsearch] Autocomplete error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Autocomplete failed",
      },
      { status: 500 },
    )
  }
}
