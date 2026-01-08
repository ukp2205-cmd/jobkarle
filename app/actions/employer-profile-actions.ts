"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getEmployerSession } from "./employer-auth-actions"

export async function getEmployerProfile() {
  try {
    const { success, session } = await getEmployerSession()

    if (!success || !session) {
      return { success: false, error: "Not authenticated" }
    }

    const supabase = await createServerClient()

    // Fetch employer profile data
    const { data: employer, error } = await supabase.from("employers").select("*").eq("id", session.employerId).single()

    if (error) {
      console.error("[v0] Error fetching employer profile:", error)
      return { success: false, error: error.message }
    }

    // Fetch job statistics
    const { data: jobs, error: jobsError } = await supabase
      .from("job_postings")
      .select("id, status, created_at")
      .eq("employer_id", session.employerId)

    if (jobsError) {
      console.error("[v0] Error fetching jobs:", jobsError)
    }

    const jobStats = {
      total: jobs?.length || 0,
      active: jobs?.filter((j) => j.status === "published" || j.status === "active").length || 0,
      closed: jobs?.filter((j) => j.status === "closed").length || 0,
      draft: jobs?.filter((j) => j.status === "draft").length || 0,
    }

    return {
      success: true,
      profile: employer,
      jobStats,
    }
  } catch (error: any) {
    console.error("[v0] Exception in getEmployerProfile:", error)
    return { success: false, error: error.message }
  }
}

export async function updateEmployerProfile(profileData: any) {
  try {
    const { success, session } = await getEmployerSession()

    if (!success || !session) {
      return { success: false, error: "Not authenticated" }
    }

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("employers")
      .update({
        contact_person: profileData.contact_person,
        mobile_number: profileData.mobile_number,
        company_name: profileData.company_name,
        company_type: profileData.company_type,
        industry_type: profileData.industry_type,
        city: profileData.city,
        website: profileData.website,
        designation: profileData.designation,
        description: profileData.description,
        year_established: profileData.year_established,
        employee_count: profileData.employee_count,
        tan_number: profileData.tan_number,
        gstin: profileData.gstin,
        phone_number_2: profileData.phone_number_2,
        address_label: profileData.address_label,
        address: profileData.address,
        country: profileData.country,
        state: profileData.state,
        city_detail: profileData.city_detail,
        pincode: profileData.pincode,
      })
      .eq("id", session.employerId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating employer profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data }
  } catch (error: any) {
    console.error("[v0] Exception in updateEmployerProfile:", error)
    return { success: false, error: error.message }
  }
}
