"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAllSkills() {
  try {
    const supabase = await createClient()

    const { data: skills, error } = await supabase.from("skills").select("id, skill_name").order("skill_name")

    if (error) {
      console.error("[v0] Error fetching all skills:", error)
      return { success: false, error: error.message, skills: [] }
    }

    return { success: true, skills: skills || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getAllSkills:", error)
    return { success: false, error: error.message, skills: [] }
  }
}

export async function searchSkills(query: string) {
  try {
    const supabase = await createClient()

    const { data: skills, error } = await supabase
      .from("skills")
      .select("id, skill_name")
      .ilike("skill_name", `%${query}%`)
      .order("skill_name")
      .limit(10)

    if (error) {
      console.error("[v0] Error searching skills:", error)
      return { success: false, error: error.message, skills: [] }
    }

    return { success: true, skills: skills || [] }
  } catch (error: any) {
    console.error("[v0] Exception in searchSkills:", error)
    return { success: false, error: error.message, skills: [] }
  }
}
