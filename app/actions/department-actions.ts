"use server"

import { createClient } from "@/lib/supabase/server"

export interface Department {
  id: string
  department_name: string
  industry_id: string
  description: string | null
  is_active: boolean
}

export async function getDepartmentsByIndustry(industryId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("industry_id", industryId)
      .eq("is_active", true)
      .order("department_name")

    if (error) {
      console.error("[v0] Error fetching departments:", error)
      return { success: false, error: error.message, departments: [] }
    }

    console.log(`[v0] Fetched ${data?.length || 0} departments for industry ${industryId}`)
    return { success: true, departments: data || [] }
  } catch (error) {
    console.error("[v0] Exception fetching departments:", error)
    return { success: false, error: "Failed to fetch departments", departments: [] }
  }
}

export async function saveCustomDepartment(departmentName: string, industryId: string) {
  try {
    const supabase = await createClient()

    // Check if department already exists for this industry
    const { data: existing } = await supabase
      .from("departments")
      .select("id")
      .eq("department_name", departmentName.trim())
      .eq("industry_id", industryId)
      .single()

    if (existing) {
      return { success: true, departmentId: existing.id }
    }

    // Insert new custom department
    const { data, error } = await supabase
      .from("departments")
      .insert({
        department_name: departmentName.trim(),
        industry_id: industryId,
        description: "Custom department added by candidate",
        is_active: true,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[v0] Error saving custom department:", error)
      return { success: false, error: error.message }
    }

    console.log(`[v0] Saved custom department: ${departmentName}`)
    return { success: true, departmentId: data.id }
  } catch (error) {
    console.error("[v0] Exception saving custom department:", error)
    return { success: false, error: "Failed to save custom department" }
  }
}
