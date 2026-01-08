"use server"

import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { formatPhoneNumber } from "@/lib/otp-utils"

export async function createInitialEmployer(data: {
  username: string
  email: string
  password: string
  contactPerson: string
  mobileNumber: string
  companyName: string
  companyType: string
  industryType: string
  city: string
}) {
  try {
    const supabase = await createServerClient()
    const formattedMobile = formatPhoneNumber(data.mobileNumber)

    console.log("[v0] createInitialEmployer: Checking for existing employer")

    const { data: existingVerified, error: emailCheckError } = await supabase
      .from("employers")
      .select("id, email, otp_verified")
      .eq("email", data.email)
      .eq("otp_verified", true)
      .maybeSingle()

    if (emailCheckError) {
      console.error("[v0] createInitialEmployer: Error checking email:", emailCheckError)
      return { success: false, message: emailCheckError.message }
    }

    if (existingVerified) {
      console.log("[v0] createInitialEmployer: Email already registered and verified")
      return {
        success: false,
        message:
          "An employer with this email already exists. Please use a different email or login to your existing account.",
      }
    }

    const { data: existingUnverified, error: unverifiedCheckError } = await supabase
      .from("employers")
      .select("id, email, otp_verified")
      .eq("email", data.email)
      .eq("otp_verified", false)
      .maybeSingle()

    if (existingUnverified) {
      console.log("[v0] Found unverified registration, deleting old record:", existingUnverified.id)
      const { error: deleteError } = await supabase.from("employers").delete().eq("id", existingUnverified.id)

      if (deleteError) {
        console.error("[v0] Error deleting unverified registration:", deleteError)
        return { success: false, message: "Failed to clear previous incomplete registration" }
      }
    }

    console.log("[v0] createInitialEmployer: Creating new employer record")

    const passwordHash = await bcrypt.hash(data.password, 10)

    const { data: inserted, error: insertError } = await supabase
      .from("employers")
      .insert({
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        contact_person: data.contactPerson,
        mobile_number: formattedMobile,
        company_name: data.companyName,
        company_type: data.companyType,
        industry_type: data.industryType,
        city: data.city,
        otp_verified: false, // Explicitly set to false
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] createInitialEmployer: Insert error:", insertError)
      return { success: false, message: insertError.message }
    }

    console.log("[v0] createInitialEmployer: Success, new employer ID:", inserted.id)
    return { success: true, employer: inserted }
  } catch (error: any) {
    console.error("[v0] createInitialEmployer: Exception:", error)
    return { success: false, message: error.message }
  }
}

export async function completeEmployerRegistration(email: string, password: string, additionalData: any) {
  try {
    const supabase = await createServerClient()

    console.log("[v0] completeEmployerRegistration: Getting employer data for:", email)

    // Get the employer record
    const { data: employer, error: employerError } = await supabase
      .from("employers")
      .select("*")
      .eq("email", email)
      .single()

    if (employerError || !employer) {
      console.error("[v0] completeEmployerRegistration: Employer not found:", employerError)
      return { success: false, message: "Employer not found" }
    }

    console.log("[v0] completeEmployerRegistration: Updating employer with additional data...")

    const { data: updated, error: updateError } = await supabase
      .from("employers")
      .update({
        website: additionalData.website,
        designation: additionalData.designation,
        alias: additionalData.alias,
        description: additionalData.description,
        year_established: additionalData.yearEstablished,
        employee_count: additionalData.employeeCount,
        logo_url: additionalData.logoUrl,
        tan_number: additionalData.tanNumber,
        gstin: additionalData.gstin,
        phone_number_2: additionalData.phoneNumber2,
        address_label: additionalData.addressLabel,
        address: additionalData.address,
        country: additionalData.country,
        state: additionalData.state,
        city_detail: additionalData.cityDetail,
        pincode: additionalData.pincode,
      })
      .eq("email", email)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] completeEmployerRegistration: Update error:", updateError)
      return { success: false, message: updateError.message }
    }

    console.log("[v0] completeEmployerRegistration: Registration completed successfully")
    return { success: true, employer: updated }
  } catch (error: any) {
    console.error("[v0] completeEmployerRegistration: Exception:", error)
    return { success: false, message: error.message }
  }
}

export async function updateEmployerDetails(email: string, data: any) {
  try {
    const supabase = await createServerClient()

    console.log("[SERVER] Updating employer details for:", email)

    // Update employer with complete data
    const { data: employer, error } = await supabase
      .from("employers")
      .update({
        website: data.website,
        designation: data.designation,
        alias: data.alias,
        description: data.description,
        year_established: data.yearEstablished,
        employee_count: data.employeeCount,
        logo_url: data.logoUrl,
        tan_number: data.tanNumber,
        gstin: data.gstin,
        phone_number_2: data.phoneNumber2,
        address_label: data.addressLabel,
        address: data.address,
        country: data.country,
        state: data.state,
        city_detail: data.cityDetail,
        pincode: data.pincode,
      })
      .eq("email", email)
      .select()
      .single()

    if (error) {
      console.error("[SERVER] Employer update error:", error)
      return { success: false, message: error.message }
    }

    console.log("[SERVER] Employer details updated successfully:", employer.id)
    return { success: true, employer }
  } catch (error: any) {
    console.error("[SERVER] Employer update exception:", error)
    return { success: false, message: error.message }
  }
}

// This function is now replaced by createInitialEmployer + updateEmployerDetails
export async function createEmployer(data: any) {
  try {
    const supabase = await createServerClient()

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    const formattedPhone = formatPhoneNumber(data.mobileNumber)
    const { data: otpRecord } = await supabase
      .from("phone_verifications")
      .select("verified")
      .eq("phone_number", formattedPhone)
      .single()

    const isOtpVerified = otpRecord?.verified || false

    console.log("[SERVER] Creating employer with OTP verified status:", isOtpVerified)

    // Insert employer data
    const { data: employer, error } = await supabase
      .from("employers")
      .insert({
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        contact_person: data.contactPerson,
        mobile_number: data.mobileNumber,
        company_name: data.companyName,
        company_type: data.companyType,
        industry_type: data.industryType,
        city: data.city,
        website: data.website,
        designation: data.designation,
        alias: data.alias,
        description: data.description,
        year_established: data.yearEstablished,
        employee_count: data.employeeCount,
        logo_url: data.logoUrl,
        tan_number: data.tanNumber,
        gstin: data.gstin,
        phone_number_2: data.phoneNumber2,
        address_label: data.addressLabel,
        address: data.address,
        country: data.country,
        state: data.state,
        city_detail: data.cityDetail,
        pincode: data.pincode,
        otp_verified: isOtpVerified, // Set OTP verified status from phone verification
      })
      .select()
      .single()

    if (error) {
      console.error("[SERVER] Employer registration error:", error)
      return { success: false, message: error.message }
    }

    await supabase.from("phone_verifications").delete().eq("phone_number", formattedPhone)

    console.log("[SERVER] Employer registered successfully:", employer.id)
    return { success: true, employer }
  } catch (error: any) {
    console.error("[SERVER] Employer registration exception:", error)
    return { success: false, message: error.message }
  }
}

export async function uploadEmployerLogo(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const file = formData.get("file") as File
    const email = formData.get("email") as string

    if (!file || !email) {
      return { success: false, message: "File and email are required" }
    }

    // Create unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.${fileExt}`

    console.log("[SERVER] Uploading employer logo:", fileName)

    // Upload to employer_logo bucket
    const { data, error } = await supabase.storage.from("employer_logo").upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[SERVER] Logo upload error:", error)
      return { success: false, message: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("employer_logo").getPublicUrl(fileName)

    console.log("[SERVER] Logo uploaded successfully:", urlData.publicUrl)
    return { success: true, url: urlData.publicUrl }
  } catch (error: any) {
    console.error("[SERVER] Logo upload exception:", error)
    return { success: false, message: error.message }
  }
}
