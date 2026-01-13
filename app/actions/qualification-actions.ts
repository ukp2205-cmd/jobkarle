"use server"

import { createClient } from "@/lib/supabase/server"

export interface Qualification {
  id: number
  level: string
  display_order: number
  specializations?: string[] // Array of specialization options
  education_names?: string[] // Array of education/degree names for this qualification
}

export async function getEducationNamesByLevel(educationLevel: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("educations")
      .select("education_name")
      .eq("education_level", educationLevel)
      .order("education_name", { ascending: true })

    if (error) {
      console.error("Error fetching education names:", error)
      return []
    }

    return data?.map((item) => item.education_name) || []
  } catch (error) {
    console.error("Error in getEducationNamesByLevel:", error)
    return []
  }
}

export async function getQualifications() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("highest_qualifications")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching qualifications:", error)
      return []
    }

    const qualificationsWithEducationNames = await Promise.all(
      (data || []).map(async (qual) => {
        const educationNames = await getEducationNamesByLevel(qual.level)
        return {
          ...qual,
          education_names: educationNames,
        }
      }),
    )

    return qualificationsWithEducationNames
  } catch (error) {
    console.error("Error in getQualifications:", error)
    return []
  }
}
