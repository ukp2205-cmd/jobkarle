"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ColumnPreference {
  key: string
  label: string
  selected: boolean
}

export async function saveColumnPreferences(
  employerId: string,
  jobId: string,
  preferences: { columnKey: string; label: string; isSelected: boolean; order: number | null }[],
) {
  const supabase = await createClient()

  console.log("[v0] Saving column preferences for employer:", employerId, "job:", jobId)

  const { error } = await supabase.from("employer_column_preferences").upsert(
    {
      employer_id: employerId,
      job_id: jobId,
      column_order: preferences,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "employer_id,job_id",
    },
  )

  if (error) {
    console.error("[v0] Error saving column preferences:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Column preferences saved successfully")
  revalidatePath(`/employer/job-responses/${jobId}`)
  return { success: true }
}

export async function getColumnPreferences(employerId: string, jobId: string) {
  const supabase = await createClient()

  console.log("[v0] Loading column preferences for employer:", employerId, "job:", jobId)

  const { data, error } = await supabase
    .from("employer_column_preferences")
    .select("column_order")
    .eq("employer_id", employerId)
    .eq("job_id", jobId)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error fetching column preferences:", error)
    return []
  }

  if (!data || !data.column_order) {
    console.log("[v0] No preferences found, using defaults")
    return []
  }

  console.log("[v0] Loaded column preferences:", data.column_order)
  return data.column_order
}
