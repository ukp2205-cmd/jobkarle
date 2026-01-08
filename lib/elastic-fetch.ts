const ELASTIC_URL = process.env.ELASTIC_URL || ""
const INDEX_NAME = "job_postings"
const CONNECTION_TIMEOUT = 5000 // 5 seconds

interface ElasticsearchHit {
  _id: string
  _score: number
  _source: {
    job_id: string
    title: string
    company_name: string
    city: string
    min_experience: number
    max_experience: number
    min_salary: number | null
    max_salary: number | null
    employment_type: string
    work_mode: string
    skills: string[]
    description: string
    created_at: string
    category?: string
    urgent_hiring?: boolean
    company_logo_url?: string
  }
}

interface ElasticsearchResponse {
  hits: {
    total: { value: number }
    hits: ElasticsearchHit[]
  }
}

export interface ElasticSearchParams {
  keyword?: string
  city?: string
  minExperience?: number
  maxExperience?: number
  minSalary?: number
  maxSalary?: number
  employmentType?: string
  workMode?: string
  page?: number
  limit?: number
}

/**
 * Check if Elasticsearch is configured
 */
export function isElasticsearchConfigured(): boolean {
  const configured = Boolean(ELASTIC_URL && ELASTIC_URL.trim() !== "")
  console.log("[v0] Elasticsearch configured:", configured, "URL:", ELASTIC_URL || "NOT SET")
  return configured
}

/**
 * Test Elasticsearch connection
 */
export async function testElasticsearchConnection(): Promise<boolean> {
  if (!isElasticsearchConfigured()) {
    console.log("[v0] ✗ Elasticsearch not configured")
    return false
  }

  try {
    const response = await fetch(`${ELASTIC_URL}/_cluster/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    const isHealthy = response.ok
    console.log("[v0] Elasticsearch health check:", isHealthy ? "✓ Connected" : "✗ Failed", "Status:", response.status)
    return isHealthy
  } catch (error) {
    console.error("[v0] ✗ Elasticsearch connection test failed:", error)
    return false
  }
}

/**
 * Build Elasticsearch query from search parameters
 */
function buildElasticsearchQuery(params: ElasticSearchParams) {
  const { keyword, city, minExperience, maxExperience, minSalary, maxSalary, employmentType, workMode } = params

  const must: any[] = []
  const filter: any[] = []

  // Keyword search with boosting
  if (keyword && keyword.trim()) {
    must.push({
      multi_match: {
        query: keyword,
        fields: [
          "title^3", // Title boosted 3x
          "skills^2", // Skills boosted 2x
          "company_name^1.5", // Company boosted 1.5x
          "description", // Description normal weight
        ],
        fuzziness: "AUTO",
        operator: "or",
      },
    })
  }

  // City filter
  if (city) {
    filter.push({
      term: { "city.keyword": city.toLowerCase() },
    })
  }

  // Experience range filter
  if (minExperience !== undefined || maxExperience !== undefined) {
    const experienceFilter: any = { range: { min_experience: {}, max_experience: {} } }

    if (maxExperience !== undefined) {
      experienceFilter.range.min_experience.lte = maxExperience
    }
    if (minExperience !== undefined) {
      experienceFilter.range.max_experience.gte = minExperience
    }

    filter.push(experienceFilter)
  }

  // Salary range filter
  if (minSalary !== undefined || maxSalary !== undefined) {
    const salaryFilter: any = { range: {} }

    if (minSalary !== undefined) {
      salaryFilter.range.max_salary = { gte: minSalary }
    }
    if (maxSalary !== undefined) {
      salaryFilter.range.min_salary = { lte: maxSalary }
    }

    filter.push(salaryFilter)
  }

  // Employment type filter
  if (employmentType) {
    filter.push({
      term: { "employment_type.keyword": employmentType.toLowerCase() },
    })
  }

  // Work mode filter
  if (workMode) {
    filter.push({
      term: { "work_mode.keyword": workMode.toLowerCase() },
    })
  }

  // Build final query
  const query: any = {
    bool: {
      must: must.length > 0 ? must : [{ match_all: {} }],
      filter,
    },
  }

  return query
}

/**
 * Search jobs using Elasticsearch with direct HTTP fetch
 */
export async function searchJobsWithElasticsearch(
  params: ElasticSearchParams,
): Promise<{ success: boolean; jobs: any[]; total: number; error?: string }> {
  console.log("[v0] === Elasticsearch Fetch Search ===")
  console.log("[v0] Search params:", JSON.stringify(params, null, 2))

  if (!isElasticsearchConfigured()) {
    return {
      success: false,
      jobs: [],
      total: 0,
      error: "Elasticsearch not configured - ELASTIC_URL not set",
    }
  }

  const { page = 1, limit = 50 } = params
  const from = (page - 1) * limit

  try {
    const query = buildElasticsearchQuery(params)
    const searchBody = {
      query,
      from,
      size: limit,
      sort: [
        { "category.keyword": { order: "desc", missing: "_last" } }, // Premium first
        { urgent_hiring: { order: "desc", missing: "_last" } }, // Urgent hiring next
        { _score: "desc" }, // Then by relevance
        { created_at: "desc" }, // Finally by date
      ],
    }

    console.log("[v0] Elasticsearch query:", JSON.stringify(searchBody, null, 2))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT)

    try {
      const response = await fetch(`${ELASTIC_URL}/${INDEX_NAME}/_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] ✗ Elasticsearch search failed:", response.status, errorText)
        return {
          success: false,
          jobs: [],
          total: 0,
          error: `Elasticsearch search failed with status ${response.status}`,
        }
      }

      const data: ElasticsearchResponse = await response.json()
      console.log("[v0] ✓ Elasticsearch search successful - Total hits:", data.hits.total.value)

      const jobs = data.hits.hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
      }))

      console.log("[v0] ✓ Premium jobs sorted first in results")

      return {
        success: true,
        jobs,
        total: data.hits.total.value,
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        console.error("[v0] ✗ Elasticsearch connection timeout after", CONNECTION_TIMEOUT, "ms")
        return {
          success: false,
          jobs: [],
          total: 0,
          error: `Cannot reach Elasticsearch at ${ELASTIC_URL} (timeout after ${CONNECTION_TIMEOUT}ms). Is Elasticsearch running?`,
        }
      }

      if (fetchError.message === "Failed to fetch") {
        console.error("[v0] ✗ Failed to connect to Elasticsearch at:", ELASTIC_URL)
        return {
          success: false,
          jobs: [],
          total: 0,
          error: `Cannot connect to Elasticsearch at ${ELASTIC_URL}. For local development, ensure Elasticsearch is running. For production, use a cloud Elasticsearch URL accessible from Vercel.`,
        }
      }

      throw fetchError
    }
  } catch (error: any) {
    console.error("[v0] ✗ Elasticsearch search error:", error.message || error)
    return {
      success: false,
      jobs: [],
      total: 0,
      error: error.message || "Unknown Elasticsearch error",
    }
  }
}

/**
 * Index a single job in Elasticsearch
 */
export async function indexJob(jobData: any): Promise<boolean> {
  if (!isElasticsearchConfigured()) {
    console.log("[v0] ⚠️ Elasticsearch not configured, skipping index")
    return false
  }

  try {
    const response = await fetch(`${ELASTIC_URL}/${INDEX_NAME}/_doc/${jobData.job_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    })

    if (response.ok) {
      console.log("[v0] ✓ Job indexed successfully:", jobData.job_id)
      return true
    } else {
      const errorText = await response.text()
      console.error("[v0] ✗ Failed to index job:", response.status, errorText)
      return false
    }
  } catch (error) {
    console.error("[v0] ✗ Error indexing job:", error)
    return false
  }
}

/**
 * Delete a job from Elasticsearch
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  if (!isElasticsearchConfigured()) {
    return false
  }

  try {
    const response = await fetch(`${ELASTIC_URL}/${INDEX_NAME}/_doc/${jobId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      console.log("[v0] ✓ Job deleted from index:", jobId)
      return true
    }
    return false
  } catch (error) {
    console.error("[v0] ✗ Error deleting job:", error)
    return false
  }
}
