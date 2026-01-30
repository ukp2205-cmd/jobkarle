import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 })
  }

  try {
    // Fetch the PDF from the original URL
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: response.status })
    }

    const pdfBuffer = await response.arrayBuffer()

    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[v0] Error proxying PDF:", error)
    return NextResponse.json({ error: "Failed to proxy PDF" }, { status: 500 })
  }
}
