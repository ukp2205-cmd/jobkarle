import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: job, error } = await supabase
      .from("job_postings")
      .select("id, job_title, required_skills, job_locations, min_experience, max_experience")
      .eq("id", jobId)
      .single()

    if (error || !job) {
      console.error("[v0] Error fetching job details:", error)
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.job_title,
        required_skills: job.required_skills || [],
        locations: job.job_locations || [],
        min_experience: job.min_experience,
        max_experience: job.max_experience,
      },
    })
  } catch (error: any) {
    console.error("[v0] Exception in job details API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
