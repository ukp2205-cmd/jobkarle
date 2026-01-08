"use server"

import { createClient } from "@/lib/supabase/server"

export async function getStates() {
  try {
    const supabase = await createClient()

    const { data: states, error } = await supabase.from("states").select("id, name").order("name")

    if (error) {
      console.error("[v0] Error fetching states:", error)
      return { success: false, error: error.message, states: [] }
    }

    return { success: true, states: states || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getStates:", error)
    return { success: false, error: error.message, states: [] }
  }
}

export async function getCitiesByState(stateName: string) {
  try {
    const supabase = await createClient()

    const { data: state, error: stateError } = await supabase.from("states").select("id").eq("name", stateName).single()

    if (stateError || !state) {
      console.error("[v0] Error fetching state:", stateError)
      return { success: false, error: "State not found", cities: [] }
    }

    const { data: cities, error } = await supabase
      .from("cities")
      .select("id, name")
      .eq("state_id", state.id)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching cities:", error)
      return { success: false, error: error.message, cities: [] }
    }

    return { success: true, cities: cities || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getCitiesByState:", error)
    return { success: false, error: error.message, cities: [] }
  }
}

export async function getAllCities() {
  try {
    const supabase = await createClient()

    const { data: cities, error } = await supabase.from("cities").select("id, name").order("name")

    if (error) {
      console.error("[v0] Error fetching all cities:", error)
      return { success: false, error: error.message, cities: [] }
    }

    return { success: true, cities: cities || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getAllCities:", error)
    return { success: false, error: error.message, cities: [] }
  }
}

export async function searchCities(query: string) {
  try {
    const supabase = await createClient()

    const { data: cities, error } = await supabase
      .from("cities")
      .select("id, name")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(50)

    if (error) {
      console.error("[v0] Error searching cities:", error)
      return { success: false, error: error.message, cities: [] }
    }

    return { success: true, cities: cities || [] }
  } catch (error: any) {
    console.error("[v0] Exception in searchCities:", error)
    return { success: false, error: error.message, cities: [] }
  }
}
