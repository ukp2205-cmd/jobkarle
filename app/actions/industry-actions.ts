"use server"

import { createClient } from "@/lib/supabase/server"

export async function searchIndustries(query: string) {
  try {
    const supabase = await createClient()

    const { data: industries, error } = await supabase
      .from("industries")
      .select("id, name")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10)

    if (error) {
      console.error("[v0] Error searching industries:", error)
      return { success: false, error: error.message, industries: [] }
    }

    return { success: true, industries: industries || [] }
  } catch (error: any) {
    console.error("[v0] Exception in searchIndustries:", error)
    return { success: false, error: error.message, industries: [] }
  }
}

export async function getAllIndustries() {
  try {
    const supabase = await createClient()

    const { data: industries, error } = await supabase.from("industries").select("id, name").order("name")

    if (error) {
      console.error("[v0] Error fetching all industries:", error)
      return { success: false, error: error.message, industries: [] }
    }

    return { success: true, industries: industries || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getAllIndustries:", error)
    return { success: false, error: error.message, industries: [] }
  }
}
