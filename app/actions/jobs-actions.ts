"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export interface JobsByIndustry {
  industry: string
  jobs: Array<{
    id: string
    job_title: string
    company_name: string
    job_locations: string[]
    min_experience: number
    max_experience: number
    min_salary: number
    max_salary: number
    employment_type: string
    work_mode: string
    created_at: string
    category: string // Added category field for displaying Premium/Urgent Hiring tag
  }>
}

export async function getJobsByIndustry() {
  try {
    const supabase = createAdminClient()

    // Fetch all published jobs
    const { data: jobs, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching jobs:", error)
      return { success: false, error: error.message, jobsByIndustry: [] }
    }

    // Group jobs by industry
    const industryMap = new Map<string, any[]>()

    jobs?.forEach((job) => {
      const industries = Array.isArray(job.candidate_industries) ? job.candidate_industries : []

      if (industries.length === 0) {
        // Add to "Other" category if no industry specified
        if (!industryMap.has("Other")) {
          industryMap.set("Other", [])
        }
        industryMap.get("Other")!.push({
          id: job.id,
          job_title: job.job_title,
          company_name: job.company_name,
          job_locations: job.job_locations || [],
          min_experience: job.min_experience || 0,
          max_experience: job.max_experience || 0,
          min_salary: job.min_salary || 0,
          max_salary: job.max_salary || 0,
          employment_type: job.employment_type,
          work_mode: job.work_mode,
          created_at: job.created_at,
          category: job.category, // Added category field for displaying Premium/Urgent Hiring tag
        })
      } else {
        // Add job to each of its industries
        industries.forEach((industry: string) => {
          if (!industryMap.has(industry)) {
            industryMap.set(industry, [])
          }
          industryMap.get(industry)!.push({
            id: job.id,
            job_title: job.job_title,
            company_name: job.company_name,
            job_locations: job.job_locations || [],
            min_experience: job.min_experience || 0,
            max_experience: job.max_experience || 0,
            min_salary: job.min_salary || 0,
            max_salary: job.max_salary || 0,
            employment_type: job.employment_type,
            work_mode: job.work_mode,
            created_at: job.created_at,
            category: job.category, // Added category field for displaying Premium/Urgent Hiring tag
          })
        })
      }
    })

    // Convert map to array and sort by industry name
    const jobsByIndustry: JobsByIndustry[] = Array.from(industryMap.entries())
      .map(([industry, jobs]) => ({
        industry,
        jobs,
      }))
      .sort((a, b) => {
        // Put "Other" at the end
        if (a.industry === "Other") return 1
        if (b.industry === "Other") return -1
        return a.industry.localeCompare(b.industry)
      })

    console.log("[v0] Grouped jobs into", jobsByIndustry.length, "industries")

    return { success: true, jobsByIndustry }
  } catch (error: any) {
    console.error("[v0] Error in getJobsByIndustry:", error)
    return { success: false, error: error.message, jobsByIndustry: [] }
  }
}
