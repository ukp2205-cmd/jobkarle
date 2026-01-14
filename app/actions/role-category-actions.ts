"use server"

import { createClient } from "@/utils/supabase/server"

export interface RoleCategory {
  id: string
  department_id: string
  role_category_name: string
  description: string | null
  is_active: boolean
}

export async function getRoleCategoriesByDepartment(departmentId: string) {
  try {
    const supabase = await createClient()

    console.log("[v0] Fetching role categories for department ID:", departmentId)

    const { data, error } = await supabase
      .from("role_categories")
      .select("*")
      .eq("department_id", departmentId)
      .eq("is_active", true)
      .order("role_category_name")

    if (error) {
      console.error("[v0] Error fetching role categories:", error)
      return { success: false, data: [], error: error.message }
    }

    console.log(`[v0] Fetched ${data?.length || 0} role categories for department ${departmentId}`)
    return { success: true, data: data as RoleCategory[], error: null }
  } catch (error) {
    console.error("[v0] Exception fetching role categories:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function saveCustomRoleCategory(departmentId: string, roleCategoryName: string) {
  try {
    const supabase = await createClient()

    console.log("[v0] Saving custom role category:", roleCategoryName, "for department:", departmentId)

    const { data, error } = await supabase
      .from("role_categories")
      .insert({
        department_id: departmentId,
        role_category_name: roleCategoryName,
        description: "Custom role category added by user",
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving custom role category:", error)
      return { success: false, data: null, error: error.message }
    }

    console.log("[v0] Custom role category saved successfully:", data.id)
    return { success: true, data: data as RoleCategory, error: null }
  } catch (error) {
    console.error("[v0] Exception saving custom role category:", error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
