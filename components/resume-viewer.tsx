"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertCircle, Loader2, MessageCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ResumeViewerProps {
  resumeUrl: string
  candidateName: string
  candidatePhone?: string // Added optional phone number prop for WhatsApp
}

export default function ResumeViewer({ resumeUrl, candidateName, candidatePhone }: ResumeViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fileExtension = resumeUrl.split(".").pop()?.toLowerCase()
  const isPDF = fileExtension === "pdf"
  const isWord = fileExtension === "doc" || fileExtension === "docx"

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

  const handleLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleError = () => {
    setLoading(false)
    setError("Failed to load resume preview. Please try downloading the file.")
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 mb-4">
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
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        )}
      </div>

      <div className="relative w-full h-[800px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading resume preview...</p>
            </div>
          </div>
        )}

        {isPDF ? (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`}
            className="w-full h-full"
            title="Resume Preview"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : isWord ? (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeUrl)}`}
            className="w-full h-full"
            title="Resume Preview"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
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
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Preview shows the first page. Click "Download" above to view the complete resume.
      </p>
    </>
  )
}
