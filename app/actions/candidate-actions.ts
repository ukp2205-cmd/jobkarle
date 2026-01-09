"use server"

import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { formatPhoneNumber } from "@/lib/otp-utils"

export type CandidateRegistrationData = {
  fullName: string
  email: string
  password: string
  mobileNumber: string
  workStatus: "experienced" | "fresher" | ""
  resumeUrl?: string
  currentlyEmployed: "yes" | "no" | ""
  totalExperienceYears: string
  totalExperienceMonths: string
  companyName: string
  currentJobTitle: string
  currentCity: string
  currentState: string
  durationFrom: string
  durationTo: string
  annualSalary: string
  noticePeriod: string
  skillsForRole: string[]
  skillsYouKnow: string[]
  industry: string
  department: string
  roleCategory: string
  jobRole: string
  highestQualification: string
  course: string
  courseType: string
  specialization: string
  university: string
  startingYear: string
  passingYear: string
  resumeHeadline: string
  preferredLocations: string[]
  preferredSalary: string
  gender: string
  availabilityToJoin?: string
  // New fields
  dateOfBirth?: string
  languagesKnown?: Array<{ language: string; read: boolean; write: boolean; speak: boolean }>
  certifications?: Array<{ name: string; issuer: string; issueDate: string; expiryDate?: string }>
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | "prefer_not_to_say"
  projects?: Array<{
    title: string
    description: string
    role: string
    technologies: string[]
    startDate: string
    endDate?: string
    url?: string
  }>
}

// Create new candidate (Step 1)
export async function createCandidate(data: {
  fullName: string
  email: string
  password: string
  mobileNumber: string
  workStatus: string
  resumeUrl?: string
}) {
  const supabase = await createClient()

  const formattedMobile = formatPhoneNumber(data.mobileNumber)

  const { data: existingCompleted, error: emailCheckError } = await supabase
    .from("candidates")
    .select("id, email, registration_completed")
    .eq("email", data.email)
    .eq("registration_completed", true)
    .maybeSingle()

  if (emailCheckError) {
    console.error("[v0] Error checking email:", emailCheckError)
    return { success: false, error: emailCheckError.message }
  }

  if (existingCompleted) {
    console.log("[v0] Email already registered with completed registration")
    return {
      success: false,
      error: "This email is already registered. Please login or use a different email address.",
    }
  }

  const { data: existingIncomplete, error: incompleteCheckError } = await supabase
    .from("candidates")
    .select("id, email, registration_completed")
    .eq("email", data.email)
    .eq("registration_completed", false)
    .maybeSingle()

  if (existingIncomplete) {
    console.log("[v0] Found incomplete registration, deleting old record:", existingIncomplete.id)
    // Delete the incomplete registration to allow re-registration
    const { error: deleteError } = await supabase.from("candidates").delete().eq("id", existingIncomplete.id)

    if (deleteError) {
      console.error("[v0] Error deleting incomplete registration:", deleteError)
      return { success: false, error: "Failed to clear previous incomplete registration" }
    }
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(data.password, 10)

  const { data: candidate, error } = await supabase
    .from("candidates")
    .insert({
      full_name: data.fullName,
      email: data.email,
      password_hash: passwordHash,
      mobile_number: formattedMobile,
      work_status: data.workStatus || null,
      resume_url: data.resumeUrl || null,
      current_registration_step: 2,
      registration_completed: false, // Explicitly set to false
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating candidate:", error)
    return { success: false, error: error.message }
  }

  return { success: true, candidateId: candidate.id }
}

// Verify OTP (Step 2)
export async function verifyOTP(email: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("candidates")
    .update({
      is_mobile_verified: true,
      current_registration_step: 3,
    })
    .eq("email", email)

  if (error) {
    console.error("Error verifying OTP:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

type EmploymentEntry = {
  type: "current" | "additional"
  currentlyEmployed: "yes" | "no" | ""
  companyName: string
  currentJobTitle: string
  currentCity: string
  currentState: string
  durationFrom: string
  durationTo: string
  annualSalary: string
  noticePeriod: string
}

type AdditionalEmploymentEntry = Omit<EmploymentEntry, "type">

// Update employment details (Step 3)
export async function updateEmploymentDetails(
  email: string,
  data: {
    currentEmployment: EmploymentEntry | null
    additionalEmployment: AdditionalEmploymentEntry[]
    totalExperienceYears: string
    totalExperienceMonths: string
    skillsForRole: string[]
    industry: string
    department: string
    roleCategory: string
    jobRole: string
  },
) {
  const supabase = await createClient()

  const employmentHistory = []
  if (data.currentEmployment) {
    employmentHistory.push({
      type: "current",
      ...data.currentEmployment,
    })
  }
  if (data.additionalEmployment && data.additionalEmployment.length > 0) {
    data.additionalEmployment.forEach((entry) => {
      employmentHistory.push({
        type: "additional",
        ...entry,
      })
    })
  }

  console.log("[SERVER] updateEmploymentDetails called for email:", email)
  console.log("[SERVER] Employment history:", JSON.stringify(employmentHistory))
  console.log("[SERVER] Skills:", data.skillsForRole)

  const currentEmployment = data.currentEmployment

  const { data: updateResult, error } = await supabase
    .from("candidates")
    .update({
      employment_history: employmentHistory,
      currently_employed: currentEmployment?.currentlyEmployed || null,
      company_name: currentEmployment?.companyName || null,
      current_job_title: currentEmployment?.currentJobTitle || null,
      current_city: currentEmployment?.currentCity || null,
      current_state: currentEmployment?.currentState || null,
      duration_from: currentEmployment?.durationFrom || null,
      duration_to: currentEmployment?.durationTo || null,
      annual_salary: currentEmployment?.annualSalary || null,
      notice_period: currentEmployment?.noticePeriod || null,
      total_experience_years: data.totalExperienceYears ? Number.parseInt(data.totalExperienceYears) : null,
      total_experience_months: data.totalExperienceMonths ? Number.parseInt(data.totalExperienceMonths) : null,
      skills_for_role: data.skillsForRole,
      skills_you_know: data.skillsForRole, // Also populate skills_you_know column
      industry: data.industry || null,
      department: data.department || null,
      role_category: data.roleCategory || null,
      job_role: data.jobRole || null,
      current_registration_step: 4,
    })
    .eq("email", email)
    .select()

  console.log("[SERVER] Update result:", updateResult)
  console.log("[SERVER] Update error:", error)

  if (error) {
    console.error("[SERVER] Error updating employment details:", error)
    return { success: false, error: error.message }
  }

  if (!updateResult || updateResult.length === 0) {
    console.error("[SERVER] No rows updated for email:", email)
    return { success: false, error: "No candidate found with this email" }
  }

  console.log("[SERVER] Successfully updated employment for:", email)
  return { success: true }
}

// Update education details (Step 4)
export async function updateEducationDetails(
  email: string,
  data: {
    highestQualification: string
    course: string
    courseType: string
    specialization: string
    university: string
    startingYear: string
    passingYear: string
    certifications?: Array<{ name: string; issuer: string; issueDate: string; expiryDate?: string }>
  },
) {
  const supabase = await createClient()

  console.log("[SERVER] updateEducationDetails called for email:", email)
  console.log("[SERVER] Education data:", JSON.stringify(data))

  const { data: updateResult, error } = await supabase
    .from("candidates")
    .update({
      highest_qualification: data.highestQualification || null,
      course: data.course || null,
      course_type: data.courseType || null,
      specialization: data.specialization || null,
      university: data.university || null,
      starting_year: data.startingYear || null,
      passing_year: data.passingYear || null,
      certifications: data.certifications || [],
      current_registration_step: 5,
    })
    .eq("email", email)
    .select()

  console.log("[SERVER] Update result:", updateResult)
  console.log("[SERVER] Update error:", error)

  if (error) {
    console.error("[SERVER] Error updating education details:", error)
    return { success: false, error: error.message }
  }

  if (!updateResult || updateResult.length === 0) {
    console.error("[SERVER] No rows updated for email:", email)
    return { success: false, error: "No candidate found with this email" }
  }

  console.log("[SERVER] Successfully updated education for:", email)
  return { success: true }
}

// Update preferences and complete registration (Step 5-6)
export async function updatePreferencesAndComplete(
  email: string,
  data: {
    resumeHeadline: string
    preferredLocations: string[]
    preferredSalary: string
    gender: string
    currentCity?: string
    currentState?: string
    availabilityToJoin?: string
    dateOfBirth?: string
    languagesKnown?: Array<{ language: string; read: boolean; write: boolean; speak: boolean }>
    maritalStatus?: "single" | "married" | "divorced" | "widowed" | "prefer_not_to_say"
    projects?: Array<{
      title: string
      description: string
      role: string
      technologies: string[]
      startDate: string
      endDate?: string
      url?: string
    }>
    certifications?: Array<{ name: string; issuer: string; issueDate: string; expiryDate?: string }> // Added certifications parameter
  },
) {
  const supabase = await createClient()

  console.log("[SERVER] updatePreferencesAndComplete called for email:", email)
  console.log("[SERVER] Complete data being saved:", JSON.stringify(data, null, 2)) // Enhanced logging

  const updateData: Record<string, unknown> = {
    resume_headline: data.resumeHeadline || null,
    preferred_locations: data.preferredLocations || [],
    preferred_salary: data.preferredSalary || null,
    gender: data.gender || null,
    date_of_birth: data.dateOfBirth || null,
    languages_known: data.languagesKnown || [],
    marital_status: data.maritalStatus || null,
    projects: data.projects || [],
    certifications: data.certifications || [], // Added certifications to update data
    registration_completed: true,
    current_registration_step: 6,
  }

  console.log("[SERVER] Exact database update payload:", JSON.stringify(updateData, null, 2)) // Log exact payload

  const { data: updateResult, error } = await supabase.from("candidates").update(updateData).eq("email", email).select()

  console.log("[SERVER] Database update result:", updateResult)
  console.log("[SERVER] Database update error:", error)

  if (error) {
    console.error("[SERVER] Error completing registration:", error)
    return { success: false, error: error.message }
  }

  if (!updateResult || updateResult.length === 0) {
    console.error("[SERVER] No rows updated for email:", email)
    return { success: false, error: "No candidate found with this email" }
  }

  console.log("[SERVER] Successfully completed registration for:", email)
  console.log("[SERVER] Final saved data:", JSON.stringify(updateResult[0], null, 2)) // Log what was actually saved
  return { success: true }
}

// Check if email already exists
export async function checkEmailExists(email: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("candidates").select("id").eq("email", email).maybeSingle()

  if (error) {
    console.error("Error checking email:", error)
    return { exists: false, error: error.message }
  }

  return { exists: !!data }
}

// Get candidate by email
export async function getCandidateByEmail(email: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("candidates").select("*").eq("email", email).maybeSingle()

  if (error) {
    console.error("Error fetching candidate:", error)
    return { success: false, error: error.message }
  }

  return { success: true, candidate: data }
}

export async function uploadResume(
  file: File,
  email: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient()

  try {
    // Generate unique filename using email and timestamp
    const timestamp = Date.now()
    const fileExt = file.name.split(".").pop()
    const fileName = `${email.replace("@", "_").replace(".", "_")}_${timestamp}.${fileExt}`
    const filePath = `${fileName}`

    console.log("[SERVER] Uploading resume:", fileName)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resume_storage")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error("[SERVER] Error uploading resume:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("resume_storage").getPublicUrl(filePath)

    console.log("[SERVER] Resume uploaded successfully:", urlData.publicUrl)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error("[SERVER] Exception uploading resume:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Update candidate profile
export async function updateCandidateProfile(
  candidateId: string,
  data: Partial<{
    full_name: string
    mobile_number: string
    email: string
    resume_headline: string
    gender: string
    current_city: string
    current_state: string
    work_status: string
    current_job_title: string
    company_name: string
    industry: string
    department: string
    role_category: string
    job_role: string
    total_experience_years: number
    total_experience_months: number
    annual_salary: string
    notice_period: string
    currently_employed: string
    skills_for_role: string[]
    skills_you_know: string[]
    preferred_salary: string
    preferred_locations: string[]
    highest_qualification: string
    course: string
    specialization: string
    course_type: string
    university: string
    passing_year: string
    starting_year: string
    resume_url: string
    date_of_birth: string
    languages_known: Array<{ language: string; read: boolean; write: boolean; speak: boolean }>
    certifications: Array<{ name: string; issuer: string; issueDate: string; expiryDate?: string }>
    marital_status: "single" | "married" | "divorced" | "widowed" | "prefer_not_to_say"
    projects: Array<{
      title: string
      description: string
      role: string
      technologies: string[]
      startDate: string
      endDate?: string
      url?: string
    }>
    profile_picture_url: string
    employment_history: any[]
  }>,
) {
  const supabase = await createClient()

  console.log("[SERVER] updateCandidateProfile called for ID:", candidateId)
  console.log("[SERVER] Update data:", JSON.stringify(data))

  const { data: updateResult, error } = await supabase.from("candidates").update(data).eq("id", candidateId).select()

  if (error) {
    console.error("[SERVER] Error updating profile:", error)
    return { success: false, error: error.message }
  }

  if (!updateResult || updateResult.length === 0) {
    console.error("[SERVER] No rows updated for ID:", candidateId)
    return { success: false, error: "No candidate found with this ID" }
  }

  console.log("[SERVER] Successfully updated profile for:", candidateId)
  return { success: true, data: updateResult[0] }
}

// Update employment history
export async function updateEmploymentHistory(
  candidateId: string,
  employmentHistory: Array<{
    job_title?: string
    currentJobTitle?: string
    company_name?: string
    companyName?: string
    employment_type?: string
    start_date?: string
    durationFrom?: string
    end_date?: string
    durationTo?: string
    is_current?: boolean
    currently_working?: boolean
  }>,
) {
  const supabase = await createClient()

  console.log("[SERVER] updateEmploymentHistory called for ID:", candidateId)
  console.log("[SERVER] Employment data:", JSON.stringify(employmentHistory))

  // Normalize the employment history format
  const normalizedHistory = employmentHistory.map((entry) => ({
    job_title: entry.job_title || entry.currentJobTitle,
    company_name: entry.company_name || entry.companyName,
    employment_type: entry.employment_type || "full-time",
    start_date: entry.start_date || entry.durationFrom,
    end_date: entry.end_date || entry.durationTo,
    is_current: entry.is_current || entry.currently_working || false,
  }))

  const { data: updateResult, error } = await supabase
    .from("candidates")
    .update({
      employment_history: normalizedHistory,
    })
    .eq("id", candidateId)
    .select()

  if (error) {
    console.error("[SERVER] Error updating employment history:", error)
    return { success: false, error: error.message }
  }

  if (!updateResult || updateResult.length === 0) {
    console.error("[SERVER] No rows updated for ID:", candidateId)
    return { success: false, error: "No candidate found with this ID" }
  }

  console.log("[SERVER] Successfully updated employment history for:", candidateId)
  return { success: true, data: updateResult[0] }
}

// Get recommended jobs
export async function getRecommendedJobs(candidateId: string) {
  const supabase = await createClient()

  // Get candidate's skills and preferences
  const { data: candidate } = await supabase
    .from("candidates")
    .select("skills_for_role, preferred_locations")
    .eq("id", candidateId)
    .single()

  if (!candidate) {
    return { success: false, jobs: [] }
  }

  // Fetch published jobs
  const { data: jobs, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("[SERVER] Error fetching recommended jobs:", error)
    return { success: false, jobs: [] }
  }

  return { success: true, jobs: jobs || [] }
}

// Save job
export async function saveJob(candidateId: string, jobId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("saved_jobs").insert({ candidate_id: candidateId, job_id: jobId })

  if (error) {
    console.error("[SERVER] Error saving job:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get saved jobs
export async function getSavedJobs(candidateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("saved_jobs")
    .select("job_id, job_postings(*)")
    .eq("candidate_id", candidateId)

  if (error) {
    console.error("[SERVER] Error fetching saved jobs:", error)
    return { success: false, jobs: [] }
  }

  const jobs = data?.map((item) => item.job_postings).filter(Boolean) || []
  return { success: true, jobs }
}

// Unsave job
export async function unsaveJob(candidateId: string, jobId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("saved_jobs").delete().eq("candidate_id", candidateId).eq("job_id", jobId)

  if (error) {
    console.error("[SERVER] Error unsaving job:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get my applications
export async function getMyApplications(candidateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("job_applications")
    .select("*, job_postings(*)")
    .eq("candidate_id", candidateId)
    .order("applied_at", { ascending: false })

  if (error) {
    console.error("[SERVER] Error fetching applications:", error)
    return { success: false, applications: [] }
  }

  return { success: true, applications: data || [] }
}
