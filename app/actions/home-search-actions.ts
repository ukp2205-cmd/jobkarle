"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function getSearchSuggestions() {
  try {
    const supabase = await createServerClient()

    // Fetch unique job titles (designations)
    const { data: jobTitles, error: titlesError } = await supabase
      .from("job_postings")
      .select("job_title")
      .eq("status", "published")
      .not("job_title", "is", null)

    if (titlesError) {
      console.error("[v0] Error fetching job titles:", titlesError)
    }

    // Fetch unique company names
    const { data: companies, error: companiesError } = await supabase
      .from("job_postings")
      .select("company_name")
      .eq("status", "published")
      .not("company_name", "is", null)

    if (companiesError) {
      console.error("[v0] Error fetching companies:", companiesError)
    }

    // Extract and deduplicate
    const uniqueTitles = [...new Set((jobTitles || []).map((j) => j.job_title).filter(Boolean))]
    const uniqueCompanies = [...new Set((companies || []).map((c) => c.company_name).filter(Boolean))]

    return {
      designations: uniqueTitles.sort(),
      companies: uniqueCompanies.sort(),
    }
  } catch (error) {
    console.error("[v0] Error in getSearchSuggestions:", error)
    return {
      designations: [],
      companies: [],
    }
  }
}
