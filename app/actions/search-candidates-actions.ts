"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server" // Declare the variable before using it

export async function getAllCandidatesForEmployer(employerId: string, filters: {
  keywords?: string
  skills?: string
  locations?: string
  expMin?: string
  expMax?: string
  salaryMin?: string
  salaryMax?: string
  education?: string
  noticePeriod?: string
}) {
  try {
    const supabase = await createClient()

    // Parse filters
    const keywordsArray = filters.keywords ? filters.keywords.split(",") : []
    const skillsArray = filters.skills ? filters.skills.split(",") : []
    const locationsArray = filters.locations ? filters.locations.split(",") : []

    console.log("[v0] Fetching candidates for employer:", employerId, "with filters:", filters)

    // First, get all jobs for this employer
    const { data: employerJobs, error: jobsError } = await supabase
      .from("job_postings")
      .select("id")
      .eq("employer_id", employerId)

    if (jobsError) {
      console.error("[v0] Error fetching employer jobs:", jobsError)
      return { success: false, error: "Failed to fetch jobs", candidates: [] }
    }

    if (!employerJobs || employerJobs.length === 0) {
      console.log("[v0] No jobs found for employer")
      return { success: true, candidates: [] }
    }

    const jobIds = employerJobs.map(job => job.id)

    // Fetch all applications for these jobs with candidate details
    let query = supabase
      .from("job_applications")
      .select(`
        id,
        candidate_id,
        job_id,
        status,
        applied_at,
        candidates!job_applications_candidate_id_fkey (
          full_name,
          email,
          mobile_number,
          current_job_title,
          company_name,
          skills_for_role,
          skills_you_know,
          preferred_locations,
          preferred_salary,
          annual_salary,
          notice_period,
          availability_to_join,
          total_experience_years,
          total_experience_months,
          current_city,
          highest_qualification,
          resume_headline
        ),
        job_postings!job_applications_job_id_fkey (
          job_title,
          company_name
        )
      `)
      .in("job_id", jobIds)

    const { data: applications, error: applicationsError } = await query

    if (applicationsError) {
      console.error("[v0] Error fetching applications:", applicationsError)
      return { success: false, error: "Failed to fetch candidates", candidates: [] }
    }

    console.log("[v0] Fetched applications count:", applications?.length || 0)

    if (!applications || applications.length === 0) {
      return { success: true, candidates: [] }
    }

    // Filter candidates based on search criteria
    const filteredApplications = applications.filter((app: any) => {
      const candidate = app.candidates

      if (!candidate) return false

      // If no filters, return all
      if (keywordsArray.length === 0 && skillsArray.length === 0 && locationsArray.length === 0) {
        return true
      }

      // Check keywords (search in name, job title, company, headline)
      if (keywordsArray.length > 0) {
        const candidateText = [
          candidate.full_name,
          candidate.current_job_title,
          candidate.company_name,
          candidate.resume_headline,
        ].filter(Boolean).join(" ").toLowerCase()

        const keywordMatch = keywordsArray.some(keyword => 
          candidateText.includes(keyword.toLowerCase())
        )
        
        if (keywordMatch) return true
      }

      // Check skills
      if (skillsArray.length > 0) {
        // Safely extract skills with proper null/undefined handling
        const skillsForRole = Array.isArray(candidate.skills_for_role) ? candidate.skills_for_role : []
        const skillsYouKnow = Array.isArray(candidate.skills_you_know) ? candidate.skills_you_know : []
        
        const candidateSkills = [...skillsForRole, ...skillsYouKnow]
          .filter(Boolean) // Remove null/undefined
          .map(s => typeof s === 'string' ? s.toLowerCase().trim() : '')
          .filter(Boolean) // Remove empty strings

        console.log("[v0] Candidate:", candidate.full_name, "Skills:", candidateSkills, "Searching for:", skillsArray)

        const skillMatch = skillsArray.some(skill => {
          const searchSkill = skill.toLowerCase().trim()
          return candidateSkills.some(cs => {
            // Exact match or partial match (contains)
            return cs === searchSkill || 
                   cs.includes(searchSkill) || 
                   searchSkill.includes(cs) ||
                   // Word boundary match for multi-word skills like "Big Data"
                   cs.split(/\s+/).some(word => word === searchSkill) ||
                   searchSkill.split(/\s+/).some(word => cs.includes(word))
          })
        })
        
        if (skillMatch) {
          console.log("[v0] ✓ MATCH found for:", candidate.full_name)
          return true
        } else {
          console.log("[v0] ✗ NO match for:", candidate.full_name)
        }
      }

      // Check locations
      if (locationsArray.length > 0 && candidate.current_city) {
        const locationMatch = locationsArray.some(loc => 
          candidate.current_city.toLowerCase().includes(loc.toLowerCase())
        )
        
        if (locationMatch) return true
      }

      return false
    })

    console.log("[v0] Filtered candidates count:", filteredApplications.length)

    // Transform to match expected format
    const transformedCandidates = filteredApplications.map((app: any) => ({
      id: app.id,
      candidate_id: app.candidate_id,
      job_id: app.job_id,
      status: app.status,
      applied_at: app.applied_at,
      candidate: app.candidates,
      job_postings: app.job_postings,
    }))

    return {
      success: true,
      candidates: transformedCandidates,
    }
  } catch (error) {
    console.error("[v0] Error in getAllCandidatesForEmployer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      candidates: [],
    }
  }
}
