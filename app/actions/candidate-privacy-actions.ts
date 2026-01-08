"use server"

import { createClient } from "@/lib/supabase/server"

export async function getCandidatePrivacySettings(candidateId: string) {
  try {
    const supabase = await createClient()

    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("profile_visibility, is_profile_active, deactivated_at, deactivation_reason")
      .eq("id", candidateId)
      .single()

    if (error) {
      console.error("[v0] Error fetching privacy settings:", error)
      return { success: false, error: error.message }
    }

    const { data: blockedCompanies, error: blockedError } = await supabase
      .from("blocked_employers")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("blocked_at", { ascending: false })

    if (blockedError) {
      console.error("[v0] Error fetching blocked companies:", blockedError)
    }

    return {
      success: true,
      data: {
        settings: candidate,
        blockedCompanies: blockedCompanies || [],
      },
    }
  } catch (error) {
    console.error("[v0] Error in getCandidatePrivacySettings:", error)
    return { success: false, error: "Failed to fetch privacy settings" }
  }
}

export async function updateProfileVisibility(candidateId: string, visibility: "public" | "hidden" | "private") {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("candidates").update({ profile_visibility: visibility }).eq("id", candidateId)

    if (error) {
      console.error("[v0] Error updating profile visibility:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Profile visibility updated to:", visibility)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateProfileVisibility:", error)
    return { success: false, error: "Failed to update profile visibility" }
  }
}

export async function searchCompanies(query: string) {
  try {
    console.log("[v0] searchCompanies called with query:", query)
    const supabase = await createClient()

    const { data: jobs, error } = await supabase
      .from("job_postings")
      .select("company_name, employer_id")
      .ilike("company_name", `${query}%`)
      .eq("status", "published")
      .limit(50)

    console.log("[v0] Query result - jobs:", jobs?.length || 0, "error:", error)

    if (error) {
      console.error("[v0] Error searching companies:", error)
      return { success: false, error: error.message, companies: [] }
    }

    // Get unique companies by employer_id
    const uniqueCompanies = Array.from(
      new Map(
        (jobs || [])
          .filter((job) => job.employer_id) // Only include jobs with employer_id
          .map((job) => [job.employer_id, { company_name: job.company_name, employer_id: job.employer_id }]),
      ).values(),
    )

    console.log("[v0] Returning", uniqueCompanies.length, "unique companies with employer_ids:", uniqueCompanies)
    return { success: true, companies: uniqueCompanies }
  } catch (error) {
    console.error("[v0] Error in searchCompanies:", error)
    return { success: false, error: "Failed to search companies", companies: [] }
  }
}

export async function blockCompany(
  candidateId: string,
  companyName: string,
  employerId: string,
  reason: string,
  customReason?: string,
) {
  try {
    console.log("[v0] blockCompany called:", { candidateId, companyName, employerId, reason, customReason })
    const supabase = await createClient()

    const { data: existing, error: checkError } = await supabase
      .from("blocked_employers")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("employer_id", employerId)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking blocked status:", checkError)
      return { success: false, error: checkError.message }
    }

    if (existing) {
      return { success: false, error: "Company is already blocked" }
    }

    const { error: insertError } = await supabase.from("blocked_employers").insert({
      candidate_id: candidateId,
      employer_id: employerId,
      company_name: companyName,
      reason: reason === "Other" ? "Other" : reason,
      custom_reason: reason === "Other" ? customReason : null,
      blocked_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[v0] Error blocking company:", insertError)
      return { success: false, error: insertError.message }
    }

    console.log("[v0] Company blocked successfully:", companyName, "employer_id:", employerId)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in blockCompany:", error)
    return { success: false, error: "Failed to block company" }
  }
}

export async function unblockCompany(candidateId: string, employerId: string) {
  try {
    const supabase = await createClient()

    const { error: deleteError } = await supabase
      .from("blocked_employers")
      .delete()
      .eq("candidate_id", candidateId)
      .eq("employer_id", employerId)

    if (deleteError) {
      console.error("[v0] Error unblocking company:", deleteError)
      return { success: false, error: deleteError.message }
    }

    console.log("[v0] Company unblocked successfully, employer_id:", employerId)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in unblockCompany:", error)
    return { success: false, error: "Failed to unblock company" }
  }
}

export async function deactivateProfile(candidateId: string, reason?: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("candidates")
      .update({
        is_profile_active: false,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason || null,
      })
      .eq("id", candidateId)

    if (error) {
      console.error("[v0] Error deactivating profile:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Profile deactivated successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deactivateProfile:", error)
    return { success: false, error: "Failed to deactivate profile" }
  }
}

export async function reactivateProfile(candidateId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("candidates")
      .update({
        is_profile_active: true,
        deactivated_at: null,
        deactivation_reason: null,
      })
      .eq("id", candidateId)

    if (error) {
      console.error("[v0] Error reactivating profile:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Profile reactivated successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in reactivateProfile:", error)
    return { success: false, error: "Failed to reactivate profile" }
  }
}
