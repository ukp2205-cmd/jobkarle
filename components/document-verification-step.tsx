"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { validateCompanyEmail, uploadEmployerDocument, saveEmployerDocuments } from "@/app/actions/employer-document-actions"

interface DocumentVerificationStepProps {
  employerId: string
  onComplete: () => void
  onBack?: () => void
}

export default function DocumentVerificationStep({ employerId, onComplete, onBack }: DocumentVerificationStepProps) {
  const [verificationMethod, setVerificationMethod] = useState<"documents" | "email" | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Document upload states
  const [panCard, setPanCard] = useState<{ file: File | null; url: string; uploading: boolean }>({
    file: null,
    url: "",
    uploading: false,
  })
  const [gstCertificate, setGstCertificate] = useState<{ file: File | null; url: string; uploading: boolean }>({
    file: null,
    url: "",
    uploading: false,
  })
  const [incorporationCert, setIncorporationCert] = useState<{ file: File | null; url: string; uploading: boolean }>({
    file: null,
    url: "",
    uploading: false,
  })
  
  // Company email state
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyEmailError, setCompanyEmailError] = useState("")

  const handleFileUpload = async (file: File, documentType: "pan" | "gst" | "incorporation") => {
    console.log("[v0] Uploading document:", documentType, file.name)
    
    const setters = {
      pan: setPanCard,
      gst: setGstCertificate,
      incorporation: setIncorporationCert,
    }
    const setter = setters[documentType]
    
    setter((prev) => ({ ...prev, uploading: true }))
    setError("")
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", documentType)
      formData.append("employerId", employerId)
      
      const result = await uploadEmployerDocument(formData)
      
      if (result.success && result.url) {
        setter({ file, url: result.url, uploading: false })
        console.log("[v0] Document uploaded:", result.url)
      } else {
        setError(result.message || "Failed to upload document")
        setter((prev) => ({ ...prev, uploading: false }))
      }
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      setError(err.message || "Failed to upload document")
      setter((prev) => ({ ...prev, uploading: false }))
    }
  }

  const handleCompanyEmailValidation = async (email: string) => {
    setCompanyEmail(email)
    setCompanyEmailError("")
    
    if (email && email.includes("@")) {
      const result = await validateCompanyEmail(email)
      if (!result.valid) {
        setCompanyEmailError(result.message || "Invalid email")
      }
    }
  }

  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    
    try {
      // Validate based on selected method
      if (verificationMethod === "documents") {
        if (!panCard.url || !gstCertificate.url || !incorporationCert.url) {
          setError("Please upload all required documents")
          setLoading(false)
          return
        }
        
        const result = await saveEmployerDocuments({
          employerId,
          panCardUrl: panCard.url,
          gstCertificateUrl: gstCertificate.url,
          incorporationCertificateUrl: incorporationCert.url,
        })
        
        if (result.success) {
          onComplete()
        } else {
          setError(result.message || "Failed to save documents")
        }
      } else if (verificationMethod === "email") {
        const validation = await validateCompanyEmail(companyEmail)
        
        if (!validation.valid) {
          setCompanyEmailError(validation.message || "Invalid email")
          setLoading(false)
          return
        }
        
        const result = await saveEmployerDocuments({
          employerId,
          companyEmail,
        })
        
        if (result.success) {
          onComplete()
        } else {
          setError(result.message || "Failed to save company email")
        }
      }
    } catch (err: any) {
      console.error("[v0] Submit error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Document Verification</h2>
        <p className="text-gray-600">Verify your company by uploading documents or using company email</p>
      </div>

      {!verificationMethod && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
            onClick={() => setVerificationMethod("documents")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <FileText className="w-12 h-12 text-blue-600 mx-auto" />
              <h3 className="font-semibold text-lg">Upload Documents</h3>
              <p className="text-sm text-gray-600">Upload PAN card, GST certificate, and incorporation certificate</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
            onClick={() => setVerificationMethod("email")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <h3 className="font-semibold text-lg">Company Email</h3>
              <p className="text-sm text-gray-600">Verify using your official company email address</p>
            </CardContent>
          </Card>
        </div>
      )}

      {verificationMethod === "documents" && (
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={() => setVerificationMethod(null)}>
            Change Method
          </Button>

          {/* PAN Card Upload */}
          <div className="space-y-2">
            <Label>PAN Card *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="pan-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "pan")}
                disabled={panCard.uploading}
              />
              <label htmlFor="pan-upload" className="cursor-pointer">
                {panCard.uploading ? (
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-2" />
                ) : panCard.url ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                ) : (
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                )}
                <p className="text-sm font-medium text-gray-700">
                  {panCard.uploading ? "Uploading..." : panCard.file ? panCard.file.name : "Click to upload PAN card"}
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
              </label>
            </div>
          </div>

          {/* GST Certificate Upload */}
          <div className="space-y-2">
            <Label>GST Certificate *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="gst-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "gst")}
                disabled={gstCertificate.uploading}
              />
              <label htmlFor="gst-upload" className="cursor-pointer">
                {gstCertificate.uploading ? (
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-2" />
                ) : gstCertificate.url ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                ) : (
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                )}
                <p className="text-sm font-medium text-gray-700">
                  {gstCertificate.uploading
                    ? "Uploading..."
                    : gstCertificate.file
                      ? gstCertificate.file.name
                      : "Click to upload GST certificate"}
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
              </label>
            </div>
          </div>

          {/* Incorporation Certificate Upload */}
          <div className="space-y-2">
            <Label>Company Incorporation Certificate *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="incorporation-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "incorporation")}
                disabled={incorporationCert.uploading}
              />
              <label htmlFor="incorporation-upload" className="cursor-pointer">
                {incorporationCert.uploading ? (
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-2" />
                ) : incorporationCert.url ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                ) : (
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                )}
                <p className="text-sm font-medium text-gray-700">
                  {incorporationCert.uploading
                    ? "Uploading..."
                    : incorporationCert.file
                      ? incorporationCert.file.name
                      : "Click to upload incorporation certificate"}
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
              </label>
            </div>
          </div>
        </div>
      )}

      {verificationMethod === "email" && (
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={() => setVerificationMethod(null)}>
            Change Method
          </Button>

          <div className="space-y-2">
            <Label htmlFor="company-email">Official Company Email *</Label>
            <Input
              id="company-email"
              type="email"
              value={companyEmail}
              onChange={(e) => handleCompanyEmailValidation(e.target.value)}
              placeholder="name@yourcompany.com"
              className={companyEmailError ? "border-red-500" : ""}
            />
            {companyEmailError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {companyEmailError}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Please use your official company email domain (not gmail, yahoo, zoho, etc.)
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between gap-4">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
            Back
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loading || !verificationMethod}
          className="ml-auto bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Complete Registration"
          )}
        </Button>
      </div>
    </div>
  )
}
