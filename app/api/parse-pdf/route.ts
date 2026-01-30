import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, skillsToHighlight } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ error: "PDF URL is required" }, { status: 400 })
    }

    // Fetch the PDF file
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 })
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Use pdf-parse to extract text
    const pdfParse = (await import("pdf-parse")).default
    const pdfData = await pdfParse(Buffer.from(pdfBuffer))

    const extractedText = pdfData.text || ""

    // Find which skills are present in the text
    const foundSkills: string[] = []
    const skillsArray = Array.isArray(skillsToHighlight) ? skillsToHighlight : []

    skillsArray.forEach((skill: string) => {
      if (skill && extractedText.toLowerCase().includes(skill.toLowerCase())) {
        foundSkills.push(skill)
      }
    })

    // Create highlighted HTML version of the text
    let highlightedText = extractedText
    foundSkills.forEach((skill) => {
      const regex = new RegExp(`(${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      highlightedText = highlightedText.replace(regex, '<mark class="skill-highlight">$1</mark>')
    })

    return NextResponse.json({
      success: true,
      extractedText,
      highlightedText,
      foundSkills,
      totalPages: pdfData.numpages || 1,
    })
  } catch (error) {
    console.error("[v0] Error parsing PDF:", error)
    return NextResponse.json(
      { error: "Failed to parse PDF", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
