// Script to reindex all published jobs from Supabase to Elasticsearch
// Run this after setting up the Elasticsearch index: npm run reindex-jobs

import { createClient } from "@supabase/supabase-js"

const ELASTIC_URL = process.env.ELASTIC_URL || "http://localhost:9200"
const INDEX_NAME = "job_postings"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

async function reindexAllJobs() {
  try {
    if (!ELASTIC_URL) {
      console.error("[v0] ✗ ELASTIC_URL environment variable not set")
      return { success: false, error: "ELASTIC_URL not configured" }
    }

    console.log("[v0] Fetching published jobs from Supabase...")

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Fetch all published jobs
    const { data: jobs, error } = await supabase.from("job_postings").select("*").eq("status", "published")

    if (error) {
      throw new Error(error.message)
    }

    if (!jobs || jobs.length === 0) {
      console.log("[v0] No published jobs to index")
      return { success: true, indexed: 0 }
    }

    console.log(`[v0] Found ${jobs.length} published jobs. Starting bulk indexing...`)

    // Prepare bulk request
    const bulkBody: string[] = []
    let indexed = 0

    for (const job of jobs) {
      const document = {
        job_id: job.id,
        title: job.job_title || "",
        company_name: job.company_name || "",
        city: job.job_locations?.[0]?.city?.toLowerCase() || "",
        min_experience: job.min_experience || 0,
        max_experience: job.max_experience || 0,
        min_salary: job.min_salary ? Number(job.min_salary) : null,
        max_salary: job.max_salary ? Number(job.max_salary) : null,
        employment_type: job.employment_type?.toLowerCase() || "",
        work_mode: job.work_mode?.toLowerCase() || "",
        skills: job.required_skills || [],
        description: job.job_description || "",
        created_at: job.created_at,
      }

      bulkBody.push(JSON.stringify({ index: { _index: INDEX_NAME, _id: job.id } }))
      bulkBody.push(JSON.stringify(document))
      indexed++
    }

    // Send bulk request
    const bulkResponse = await fetch(`${ELASTIC_URL}/_bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/x-ndjson" },
      body: bulkBody.join("\n") + "\n",
    })

    if (!bulkResponse.ok) {
      const error = await bulkResponse.text()
      throw new Error(`Bulk indexing failed: ${error}`)
    }

    const result = await bulkResponse.json()

    if (result.errors) {
      console.error("[v0] ✗ Some documents failed to index")
      const errorItems = result.items.filter((item: any) => item.index?.error)
      console.error("[v0] Errors:", errorItems.length)
    }

    console.log(`[v0] ✓ Successfully indexed ${indexed} jobs`)

    return { success: true, indexed }
  } catch (error: any) {
    console.error("[v0] ✗ Reindex error:", error.message)
    return { success: false, error: error.message }
  }
}

// Run if called directly
reindexAllJobs()
  .then((result) => {
    console.log("[v0] Reindex complete:", result.success ? `${result.indexed} jobs indexed` : "FAILED")
    process.exit(result.success ? 0 : 1)
  })
  .catch((error) => {
    console.error("[v0] Reindex failed:", error)
    process.exit(1)
  })
