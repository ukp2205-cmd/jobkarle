"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getCandidateProfile(candidateId: string) {
  try {
    console.log("[v0] Fetching candidate profile for ID:", candidateId)

    const supabase = createAdminClient()

    const { data: candidate, error } = await supabase
      .from("candidates")
      .select(`
        id,
        full_name,
        email,
        mobile_number,
        profile_picture_url,
        resume_url,
        resume_headline,
        gender,
        current_city,
        current_state,
        work_status,
        currently_employed,
        total_experience_years,
        total_experience_months,
        company_name,
        current_job_title,
        annual_salary,
        notice_period,
        availability_to_join,
        employment_history,
        skills_for_role,
        skills_you_know,
        industry,
        department,
        role_category,
        job_role,
        preferred_salary,
        preferred_locations,
        highest_qualification,
        course,
        course_type,
        specialization,
        university,
        starting_year,
        passing_year,
        date_of_birth,
        marital_status,
        languages_known,
        certifications,
        projects,
        created_at
      `)
      .eq("id", candidateId)
      .single()

    if (error) {
      console.error("[v0] Error fetching candidate:", error)
      return { success: false, error: error.message }
    }

    if (!candidate) {
      return { success: false, error: "Candidate not found" }
    }

    console.log("[v0] Candidate profile loaded:", candidate.full_name)
    return { success: true, candidate }
  } catch (error: any) {
    console.error("[v0] Exception in getCandidateProfile:", error)
    return { success: false, error: error.message }
  }
}
