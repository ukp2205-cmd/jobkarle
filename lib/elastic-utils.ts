import { getElasticClient, JOBS_INDEX } from "./elastic"

/**
 * Check if a job exists in Elasticsearch index
 */
export async function jobExistsInIndex(jobId: string): Promise<boolean> {
  try {
    const client = await getElasticClient()
    if (!client) {
      console.warn("[Elasticsearch] Client not initialized, skipping job existence check")
      return false
    }
    const exists = await client.exists({
      index: JOBS_INDEX,
      id: jobId,
    })
    return exists
  } catch (error) {
    console.error("[Elasticsearch] Error checking job existence:", error)
    return false
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
  try {
    const client = await getElasticClient()
    if (!client) {
      return {
        success: false,
        error: "Elasticsearch client not initialized",
      }
    }
    const stats = await client.indices.stats({
      index: JOBS_INDEX,
    })
    return {
      success: true,
      stats: {
        totalDocs: stats._all?.total?.docs?.count || 0,
        indexSize: stats._all?.total?.store?.size_in_bytes || 0,
        indexName: JOBS_INDEX,
      },
    }
  } catch (error: any) {
    console.error("[Elasticsearch] Error getting index stats:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Bulk index multiple jobs at once
 * Useful for initial data migration or batch updates
 */
export async function bulkIndexJobs(jobs: any[]) {
  try {
    const client = await getElasticClient()
    if (!client) {
      return {
        success: false,
        error: "Elasticsearch client not initialized",
      }
    }
    const body = jobs.flatMap((job) => [
      { index: { _index: JOBS_INDEX, _id: job.id } },
      {
        job_id: job.id,
        title: job.job_title || "",
        skills: Array.isArray(job.required_skills) ? job.required_skills.join(" ") : "",
        company_name: job.company_name || "",
        description: job.job_description || "",
        city: (job.job_locations || []).map((loc: any) => loc.city).filter(Boolean),
        state: (job.job_locations || []).map((loc: any) => loc.state).filter(Boolean),
        experience_min: job.min_experience || 0,
        experience_max: job.max_experience || 0,
        salary_min: job.min_salary ? Number(job.min_salary) : 0,
        salary_max: job.max_salary ? Number(job.max_salary) : 0,
        job_type: job.category || "classified",
        work_mode: job.work_mode || "",
        employment_type: job.employment_type || "",
        category: job.category || "classified",
        urgent_hiring: job.urgent_hiring || false,
        company_logo_url: job.company_logo_url || null,
        status: job.status,
        created_at: job.created_at,
        published_at: job.published_at,
      },
    ])

    const response = await client.bulk({
      body,
      refresh: true,
    })

    if (response.errors) {
      const erroredDocuments = response.items.filter((item: any) => item.index?.error)
      console.error("[Elasticsearch] Bulk indexing errors:", erroredDocuments)
      return {
        success: false,
        error: "Some documents failed to index",
        errorCount: erroredDocuments.length,
      }
    }

    return {
      success: true,
      indexed: jobs.length,
    }
  } catch (error: any) {
    console.error("[Elasticsearch] Bulk indexing error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete all documents from index (use with caution!)
 */
export async function clearIndex() {
  try {
    const client = await getElasticClient()
    if (!client) {
      return {
        success: false,
        error: "Elasticsearch client not initialized",
      }
    }
    await client.deleteByQuery({
      index: JOBS_INDEX,
      body: {
        query: {
          match_all: {},
        },
      },
      refresh: true,
    })

    return { success: true, message: "Index cleared" }
  } catch (error: any) {
    console.error("[Elasticsearch] Error clearing index:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Reindex all published jobs from Supabase
 * This is useful for data migration or recovery
 */
export async function reindexAllJobs() {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()

    // Fetch all published jobs
    const { data: jobs, error } = await supabase.from("job_postings").select("*").eq("status", "published")

    if (error) {
      throw new Error(error.message)
    }

    if (!jobs || jobs.length === 0) {
      return {
        success: true,
        message: "No published jobs to index",
        indexed: 0,
      }
    }

    // Bulk index all jobs
    const result = await bulkIndexJobs(jobs)

    return result
  } catch (error: any) {
    console.error("[Elasticsearch] Reindex error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Search with aggregations for analytics
 */
export async function searchWithAggregations(query: any) {
  try {
    const client = await getElasticClient()
    if (!client) {
      return {
        success: false,
        error: "Elasticsearch client not initialized",
      }
    }
    const response = await client.search({
      index: JOBS_INDEX,
      body: {
        query: query || { match_all: {} },
        size: 0,
        aggs: {
          by_city: {
            terms: {
              field: "city",
              size: 20,
            },
          },
          by_job_type: {
            terms: {
              field: "job_type",
            },
          },
          by_work_mode: {
            terms: {
              field: "work_mode",
            },
          },
          salary_stats: {
            stats: {
              field: "salary_max",
            },
          },
          experience_stats: {
            stats: {
              field: "experience_max",
            },
          },
        },
      },
    })

    return {
      success: true,
      aggregations: response.aggregations,
    }
  } catch (error: any) {
    console.error("[Elasticsearch] Aggregation error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
