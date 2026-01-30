"use server"

import { createClient } from "@/lib/supabase/server"

export async function getTeamMemberSuggestions(employerId: string, searchTerm = "") {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("team_members_history")
      .select("email, used_count")
      .eq("employer_id", employerId)
      .order("used_count", { ascending: false })
      .order("last_used_at", { ascending: false })
      .limit(20)

    // If there's a search term, filter by email
    if (searchTerm && searchTerm.length > 0) {
      query = query.ilike("email", `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching team member suggestions:", error)
      return []
    }

    return data?.map((item) => item.email) || []
  } catch (error) {
    console.error("Error in getTeamMemberSuggestions:", error)
    return []
  }
}

export async function saveTeamMemberEmail(employerId: string, email: string) {
  try {
    const supabase = await createClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from("team_members_history")
      .select("id, used_count")
      .eq("employer_id", employerId)
      .eq("email", email)
      .single()

    if (existing) {
      // Update existing record - increment used_count and update last_used_at
      const { error } = await supabase
        .from("team_members_history")
        .update({
          used_count: existing.used_count + 1,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) {
        console.error("Error updating team member:", error)
        return { success: false, error: error.message }
      }
    } else {
      // Insert new record
      const { error } = await supabase.from("team_members_history").insert({
        employer_id: employerId,
        email: email,
        used_count: 1,
      })

      if (error) {
        console.error("Error inserting team member:", error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in saveTeamMemberEmail:", error)
    return { success: false, error: error.message }
  }
}
