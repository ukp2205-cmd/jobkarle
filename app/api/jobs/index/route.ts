// API route to index a job into Elasticsearch after successful Supabase creation
// This endpoint should be called after a job is created in Supabase

import { type NextRequest, NextResponse } from "next/server"
import { indexJob, deleteJob, isElasticsearchConfigured } from "@/lib/elastic-fetch"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    console.log("[v0] Indexing job:", jobId)

    if (!isElasticsearchConfigured()) {
      console.log("[v0] ⚠️ Elasticsearch not configured, skipping indexing")
      return NextResponse.json({ success: true, message: "Elasticsearch not configured, skipped" })
    }

    // Fetch job data from Supabase (source of truth)
    const supabase = createAdminClient()
    const { data: job, error: dbError } = await supabase.from("job_postings").select("*").eq("id", jobId).single()

    if (dbError || !job) {
      console.error("[v0] Error fetching job from Supabase:", dbError)
      return NextResponse.json({ success: false, error: "Job not found in database" }, { status: 404 })
    }

    // Only index published jobs
    if (job.status !== "published") {
      console.log("[v0] Skipping non-published job:", jobId)
      return NextResponse.json({ success: true, message: "Job not published, skipping indexing" })
    }

    // Prepare document for Elasticsearch
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

    console.log("[v0] Indexing document:", document)

    const success = await indexJob(document)

    if (success) {
      return NextResponse.json({ success: true, message: "Job indexed successfully" })
    } else {
      return NextResponse.json({ success: false, error: "Failed to index job" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Error indexing job:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating job:", jobId)

    if (!isElasticsearchConfigured()) {
      console.log("[v0] ⚠️ Elasticsearch not configured, skipping update")
      return NextResponse.json({ success: true, message: "Elasticsearch not configured, skipped" })
    }

    // Fetch updated job data from Supabase
    const supabase = createAdminClient()
    const { data: job, error: dbError } = await supabase.from("job_postings").select("*").eq("id", jobId).single()

    if (dbError || !job) {
      console.error("[v0] Error fetching job from Supabase:", dbError)
      return NextResponse.json({ success: false, error: "Job not found in database" }, { status: 404 })
    }

    // If job is not published, remove from index
    if (job.status !== "published") {
      await deleteJob(jobId)
      return NextResponse.json({ success: true, message: "Job removed from index (not published)" })
    }

    // Prepare document
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

    const success = await indexJob(document)

    if (success) {
      return NextResponse.json({ success: true, message: "Job updated successfully" })
    } else {
      return NextResponse.json({ success: false, error: "Failed to update job" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Error updating job:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    console.log("[v0] Deleting job:", jobId)

    if (!isElasticsearchConfigured()) {
      console.log("[v0] ⚠️ Elasticsearch not configured, skipping delete")
      return NextResponse.json({ success: true, message: "Elasticsearch not configured, skipped" })
    }

    const success = await deleteJob(jobId)

    if (success) {
      return NextResponse.json({ success: true, message: "Job deleted successfully" })
    } else {
      return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Error deleting job:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
