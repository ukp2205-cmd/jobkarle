"use server"

import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

// Validate company email domain (not gmail, yahoo, zoho, etc.)
export async function validateCompanyEmail(email: string): Promise<{ valid: boolean; message?: string }> {
  const blockedDomains = [
    "gmail.com",
    "yahoo.com",
    "yahoo.co.in",
    "hotmail.com",
    "outlook.com",
    "zoho.com",
    "rediffmail.com",
    "aol.com",
    "protonmail.com",
    "icloud.com",
    "mail.com",
    "gmx.com",
    "yandex.com",
  ]

  const domain = email.split("@")[1]?.toLowerCase()

  if (!domain) {
    return { valid: false, message: "Invalid email format" }
  }

  if (blockedDomains.includes(domain)) {
    return {
      valid: false,
      message: "Please use your official company email address, not a personal email (gmail, yahoo, etc.)",
    }
  }

  return { valid: true }
}

// Upload employer document (PAN, GST, Incorporation Certificate)
export async function uploadEmployerDocument(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string // 'pan', 'gst', 'incorporation'
    const employerId = formData.get("employerId") as string

    console.log("[v0] Uploading employer document - Type:", documentType, "Employer:", employerId)

    if (!file) {
      return { success: false, message: "No file provided" }
    }

    if (!employerId) {
      return { success: false, message: "Employer ID is required" }
    }

    // Validate file type (only PDF, JPG, PNG allowed)
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: "Invalid file type. Only PDF, JPG, and PNG files are allowed",
      }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: "File size too large. Maximum file size is 5MB",
      }
    }

    // Create filename
    const fileExt = file.name.split(".").pop()
    const fileName = `employer-docs/${employerId}/${documentType}_${Date.now()}.${fileExt}`

    console.log("[v0] Uploading to Vercel Blob:", fileName)

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log("[v0] Document uploaded successfully:", blob.url)

    return {
      success: true,
      url: blob.url,
      documentType,
    }
  } catch (error: any) {
    console.error("[v0] Document upload error:", error)
    return {
      success: false,
      message: error.message || "Failed to upload document",
    }
  }
}

// Save employer documents to database
export async function saveEmployerDocuments(data: {
  employerId: string
  panCardUrl?: string
  gstCertificateUrl?: string
  incorporationCertificateUrl?: string
  companyEmail?: string
}) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] Saving employer documents for:", data.employerId)

    // Check if documents record already exists
    const { data: existing, error: checkError } = await supabase
      .from("employer_documents")
      .select("id")
      .eq("employer_id", data.employerId)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking existing documents:", checkError)
      return { success: false, message: checkError.message }
    }

    const documentData = {
      employer_id: data.employerId,
      pan_card_url: data.panCardUrl,
      gst_certificate_url: data.gstCertificateUrl,
      incorporation_certificate_url: data.incorporationCertificateUrl,
      company_email: data.companyEmail,
      document_status: "pending",
      submitted_at: new Date().toISOString(),
    }

    if (existing) {
      // Update existing record
      console.log("[v0] Updating existing document record:", existing.id)
      const { error: updateError } = await supabase
        .from("employer_documents")
        .update(documentData)
        .eq("id", existing.id)

      if (updateError) {
        console.error("[v0] Error updating documents:", updateError)
        return { success: false, message: updateError.message }
      }
    } else {
      // Insert new record
      console.log("[v0] Creating new document record")
      const { error: insertError } = await supabase.from("employer_documents").insert(documentData)

      if (insertError) {
        console.error("[v0] Error inserting documents:", insertError)
        return { success: false, message: insertError.message }
      }
    }

    // Update employer table to mark documents as submitted
    await supabase
      .from("employers")
      .update({
        documents_submitted: true,
      })
      .eq("id", data.employerId)

    console.log("[v0] Employer documents saved successfully")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Save documents error:", error)
    return {
      success: false,
      message: error.message || "Failed to save documents",
    }
  }
}

// Get employer documents
export async function getEmployerDocuments(employerId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("employer_documents")
      .select("*")
      .eq("employer_id", employerId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching documents:", error)
      return { success: false, message: error.message }
    }

    return {
      success: true,
      documents: data,
    }
  } catch (error: any) {
    console.error("[v0] Get documents error:", error)
    return {
      success: false,
      message: error.message,
    }
  }
}
