"use server"

import { createClient } from "@/lib/supabase/server"

export async function fetchInstitutions(searchQuery = "") {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("institutes")
      .select("id, institute_name, Affiliated_University, state, district")
      .eq("is_active", true)
      .order("institute_name", { ascending: true })

    // If search query provided, filter by name
    if (searchQuery.trim()) {
      query = query.ilike("institute_name", `%${searchQuery}%`)
    }

    // Limit to 100 results for performance
    query = query.limit(100)

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching institutions:", error)
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [], error: null }
  } catch (error: any) {
    console.error("[v0] Exception fetching institutions:", error)
    return { success: false, data: [], error: error.message }
  }
}

export async function addCustomInstitution(instituteName: string) {
  try {
    const supabase = await createClient()

    // Check if institution already exists
    const { data: existingInst, error: checkError } = await supabase
      .from("institutes")
      .select("id, institute_name")
      .ilike("institute_name", instituteName)
      .single()

    if (existingInst) {
      console.log("[v0] Institution already exists:", existingInst.institute_name)
      return { success: true, data: existingInst, alreadyExists: true }
    }

    // Insert new institution
    const { data, error } = await supabase
      .from("institutes")
      .insert({
        institute_name: instituteName.trim(),
        is_active: true,
      })
      .select("id, institute_name")
      .single()

    if (error) {
      console.error("[v0] Error adding custom institution:", error)
      return { success: false, data: null, error: error.message }
    }

    console.log("[v0] Custom institution added successfully:", data.institute_name)
    return { success: true, data, alreadyExists: false }
  } catch (error: any) {
    console.error("[v0] Exception adding custom institution:", error)
    return { success: false, data: null, error: error.message }
  }
}
