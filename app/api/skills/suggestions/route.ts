import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    const supabase = await createServerClient()

    // Fetch skills from the skills table that match the query
    let skillsQuery = supabase.from("skills").select("name").order("name", { ascending: true })

    if (query && query.trim()) {
      const queryLower = query.toLowerCase()
      // Using ilike for case-insensitive matching
      skillsQuery = skillsQuery.ilike("name", `%${queryLower}%`)
    }

    const { data: skillsData, error } = await skillsQuery.limit(10)

    if (error) {
      console.error("[v0] Error fetching skills:", error)
      return NextResponse.json({ success: false, suggestions: [], error: error.message })
    }

    const suggestions = skillsData.map((skill) => skill.name).filter(Boolean)

    console.log("[v0] Skill suggestions fetched:", suggestions.length, "for query:", query)

    return NextResponse.json({ success: true, suggestions })
  } catch (error) {
    console.error("[v0] Error in skills suggestions route:", error)
    return NextResponse.json({ success: false, suggestions: [], error: "Failed to fetch skills" }, { status: 500 })
  }
}
