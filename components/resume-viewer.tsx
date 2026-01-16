"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertCircle, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ResumeViewerProps {
  resumeUrl: string
  candidateName: string
  candidatePhone?: string
  jobRequiredSkills?: string[]
  candidateSkills?: string[]
}

export default function ResumeViewer({
  resumeUrl,
  candidateName,
  candidatePhone,
  jobRequiredSkills = [],
  candidateSkills = [],
}: ResumeViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const highlightLayerRef = useRef<HTMLDivElement>(null)

  const fileExtension = resumeUrl.split(".").pop()?.toLowerCase()
  const isPDF = fileExtension === "pdf"
  const isWord = fileExtension === "doc" || fileExtension === "docx"
  const shouldHighlight = isPDF && jobRequiredSkills.length > 0

  useEffect(() => {
    if (shouldHighlight && !pdfLoadFailed) {
      loadPDFWithHighlighting()
    } else {
      setLoading(false)
    }
  }, [resumeUrl, shouldHighlight, pdfLoadFailed])

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage(pageNum)
    }
  }, [pdfDoc, pageNum, scale])

  const loadPDFWithHighlighting = async () => {
    try {
      setLoading(true)
      setError(null)

      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      // Use our proxy API to fetch the PDF (avoids CORS issues)
      const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(resumeUrl)}`

      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch PDF via proxy")
      }

      const arrayBuffer = await response.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      setPdfDoc(pdf)
      setNumPages(pdf.numPages)
      setLoading(false)

      console.log("[v0] PDF loaded successfully via proxy with", pdf.numPages, "pages")
      console.log("[v0] Skills to highlight:", jobRequiredSkills)
    } catch (err) {
      console.error("[v0] Error loading PDF:", err)
      setPdfLoadFailed(true)
      setLoading(false)
      setPdfDoc(null)
    }
  }

  const renderPage = async (num: number) => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      const page = await pdfDoc.getPage(num)
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      // Clear highlight layer
      if (highlightLayerRef.current) {
        highlightLayerRef.current.innerHTML = ""
        highlightLayerRef.current.style.width = `${viewport.width}px`
        highlightLayerRef.current.style.height = `${viewport.height}px`
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      await page.render(renderContext).promise

      // Get text content and create highlight overlays
      if (jobRequiredSkills.length > 0) {
        const textContent = await page.getTextContent()
        createHighlightOverlays(textContent, viewport)
      }
    } catch (err) {
      console.error("[v0] Error rendering page:", err)
    }
  }

  const createHighlightOverlays = (textContent: any, viewport: any) => {
    if (!highlightLayerRef.current) return

    const skillsLowerCase = jobRequiredSkills.map((s) => s.toLowerCase().trim())

    textContent.items.forEach((item: any) => {
      if (!item.str || !item.str.trim()) return

      const itemTextLower = item.str.toLowerCase()

      skillsLowerCase.forEach((skill) => {
        // Check if the skill is found in this text item
        if (
          itemTextLower.includes(skill) ||
          skill.split(" ").some((word) => word.length > 3 && itemTextLower.includes(word))
        ) {
          // Get transform values for positioning
          const transform = item.transform
          const fontSize = Math.abs(transform[0]) || 12

          // PDF coordinates: origin is bottom-left, convert to top-left
          const x = transform[4] * scale
          const y = viewport.height - transform[5] * scale - fontSize * scale

          // Create bright yellow highlight overlay div
          const highlightDiv = document.createElement("div")
          highlightDiv.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${(item.width || fontSize * item.str.length * 0.6) * scale}px;
            height: ${fontSize * scale * 1.3}px;
            background-color: #FFFF00;
            opacity: 0.6;
            border-radius: 2px;
            pointer-events: none;
            mix-blend-mode: multiply;
          `

          highlightLayerRef.current?.appendChild(highlightDiv)
        }
      })
    })
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(resumeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${candidateName.replace(/\s+/g, "_")}_Resume.${fileExtension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("[v0] Resume download failed:", err)
    }
  }

  const handleWhatsApp = () => {
    if (candidatePhone) {
      const phoneNumber = candidatePhone.replace(/\D/g, "")
      window.open(`https://wa.me/${phoneNumber}`, "_blank")
    }
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))

  const renderContent = () => {
    if (shouldHighlight && pdfDoc && !pdfLoadFailed) {
      return (
        <div className="w-full h-full overflow-auto bg-gray-100 flex flex-col items-center p-4">
          <div className="relative">
            <canvas ref={canvasRef} className="shadow-lg bg-white" />
            {/* Highlight overlay layer positioned on top of canvas */}
            <div ref={highlightLayerRef} className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 10 }} />
          </div>

          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 bg-white px-4 py-2 rounded-lg shadow">
              <Button
                onClick={() => setPageNum((prev) => Math.max(prev - 1, 1))}
                disabled={pageNum === 1}
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-700 font-medium">
                Page {pageNum} of {numPages}
              </span>
              <Button
                onClick={() => setPageNum((prev) => Math.min(prev + 1, numPages))}
                disabled={pageNum === numPages}
                size="sm"
                variant="outline"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )
    }

    // Fallback to iframe viewers
    if (isPDF) {
      return (
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`}
          className="w-full h-full"
          title="Resume Preview"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError("Failed to load resume preview.")
          }}
        />
      )
    }

    if (isWord) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeUrl)}`}
          className="w-full h-full"
          title="Resume Preview"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError("Failed to load resume preview.")
          }}
        />
      )
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Preview not available for this file type</p>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download Resume
        </Button>
        {candidatePhone && (
          <Button
            onClick={handleWhatsApp}
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50 bg-transparent"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </Button>
        )}
        {shouldHighlight && pdfDoc && !pdfLoadFailed && (
          <>
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <Button onClick={zoomOut} variant="outline" size="sm" disabled={scale <= 0.5}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-600 px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
            <Button onClick={zoomIn} variant="outline" size="sm" disabled={scale >= 3}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      <div className="relative w-full h-[800px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">
                Loading resume{shouldHighlight ? " and analyzing skills..." : "..."}
              </p>
            </div>
          </div>
        )}

        {renderContent()}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        {jobRequiredSkills.length > 0
          ? "Skills matching the job description are highlighted in yellow. Downloaded resume will not include highlights."
          : "Resume preview. Some formatting may vary from the original document."}
      </p>
    </>
  )
}
