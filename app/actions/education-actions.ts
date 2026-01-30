"use server"

import { createClient } from "@/lib/supabase/server"

export async function getEducationsByLevel(educationLevel: string) {
  try {
    const supabase = await createClient()

    // Map qualification level text to ID
    const levelMapping: Record<string, number> = {
      "10th": 1,
      "12th": 2,
      Diploma: 3,
      Graduate: 4,
      "Graduation/Diploma": 4, // Map to Graduate
      "Post Graduate": 5,
      "Post Graduation/Masters": 5, // Map to Post Graduate
      Doctorate: 6,
    }

    const qualificationId = levelMapping[educationLevel]

    if (!qualificationId) {
      console.error("[v0] Unknown qualification level:", educationLevel)
      return { success: false, error: "Invalid qualification level", educations: [] }
    }

    // Query using the new qualification_id column
    const { data, error } = await supabase
      .from("educations")
      .select("id, education_name, qualification_id")
      .eq("qualification_id", qualificationId)
      .order("education_name")

    if (error) {
      console.error("[v0] Error fetching educations:", error)
      return { success: false, error: error.message, educations: [] }
    }

    console.log(`[v0] Fetched ${data?.length || 0} courses for qualification ID ${qualificationId} (${educationLevel})`)

    return { success: true, educations: data || [] }
  } catch (error) {
    console.error("[v0] Exception in getEducationsByLevel:", error)
    return { success: false, error: "Failed to fetch educations", educations: [] }
  }
}

export async function getSpecializationsByEducation(educationId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("education_specializations")
      .select("id, specialization_name, description")
      .eq("education_id", educationId)
      .order("specialization_name")

    if (error) {
      console.error("[v0] Error fetching specializations:", error)
      return { success: false, error: error.message, specializations: [] }
    }

    console.log(`[v0] Fetched ${data?.length || 0} specializations for education ID ${educationId}`)

    return { success: true, specializations: data || [] }
  } catch (error) {
    console.error("[v0] Exception in getSpecializationsByEducation:", error)
    return { success: false, error: "Failed to fetch specializations", specializations: [] }
  }
}
