"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

// Session management
export async function getBusinessSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("business_session")

  if (!sessionCookie) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function checkBusinessSetup() {
  try {
    const supabase = await createServerClient()

    const { data: users, error } = await supabase.from("business_team").select("id").limit(1)

    if (error) {
      console.log("[v0] Business team table check error:", error.message)
      // If table doesn't exist, allow setup
      return { hasUsers: false, needsSetup: true }
    }

    return { hasUsers: users && users.length > 0, needsSetup: !users || users.length === 0 }
  } catch (error: any) {
    console.error("[v0] Business team table check error:", error?.message || error)
    // On any error, allow setup
    return { hasUsers: false, needsSetup: true }
  }
}

export async function registerBusinessUser(email: string, password: string, fullName: string, role = "super_admin") {
  try {
    console.log("[v0] Attempting to register business user:", email)
    const supabase = await createServerClient()

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    console.log("[v0] Password hashed successfully")

    // Insert user
    const { data: user, error } = await supabase
      .from("business_team")
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error registering business user:", error.message, error.code)
      if (error.code === "42P01") {
        return { success: false, error: "Business team table not found. Please contact support." }
      }
      if (error.code === "23505") {
        return { success: false, error: "Email already exists. Please use a different email or login." }
      }
      return { success: false, error: error.message || "Failed to register user" }
    }

    console.log("[v0] User registered successfully:", user?.id)
    return { success: true, user }
  } catch (error: any) {
    console.error("[v0] Error registering business user:", error?.message || error)
    return { success: false, error: "Failed to register user. Please try again." }
  }
}

export async function businessLogin(email: string, password: string) {
  try {
    console.log("[v0] Attempting business login for:", email)
    const supabase = await createServerClient()

    const { data: users, error } = await supabase
      .from("business_team")
      .select("id, email, full_name, role, password_hash")
      .eq("email", email)
      .eq("is_active", true)
      .limit(1)

    if (error) {
      console.error("[v0] Database error during login:", error.message)
      return { success: false, error: "Database connection error. Please try again." }
    }

    console.log("[v0] Users found:", users?.length || 0)

    if (!users || users.length === 0) {
      return { success: false, error: "Invalid credentials" }
    }

    const user = users[0]

    if (!user.password_hash) {
      console.log("[v0] No password hash found for user")
      return { success: false, error: "Invalid credentials" }
    }

    console.log("[v0] Compare passwords...")
    const isValid = await bcrypt.compare(password, user.password_hash)
    console.log("[v0] Password valid:", isValid)

    if (!isValid) {
      return { success: false, error: "Invalid credentials" }
    }

    // Update last login
    await supabase.from("business_team").update({ last_login: new Date().toISOString() }).eq("id", user.id)

    // Create session
    const session = {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      loginTime: new Date().toISOString(),
    }

    const cookieStore = await cookies()
    cookieStore.set("business_session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    console.log("[v0] Business login successful for:", email)
    return { success: true, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } }
  } catch (error: any) {
    console.error("[v0] Error during business login:", error?.message || error)
    return { success: false, error: "Login failed. Please try again." }
  }
}

export async function businessLogout() {
  const cookieStore = await cookies()
  cookieStore.delete("business_session")
  return { success: true }
}

export async function getDailyMetrics() {
  try {
    const supabase = await createServerClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // New candidate sign-ups today
    const { count: newCandidatesCount } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayISO)

    // New employer sign-ups today
    const { count: newEmployersCount } = await supabase
      .from("employers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayISO)

    // Total counts
    const { count: totalCandidatesCount } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })

    const { count: totalEmployersCount } = await supabase.from("employers").select("*", { count: "exact", head: true })

    // New jobs posted today
    const { count: newJobsCount } = await supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayISO)

    // Total jobs
    const { count: totalJobsCount } = await supabase.from("job_postings").select("*", { count: "exact", head: true })

    // Active jobs (published status)
    const { count: activeJobsCount } = await supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")

    // Jobs by status
    const { data: jobsByStatusData } = await supabase.from("job_postings").select("status")

    const jobsByStatus: Record<string, number> = {}
    jobsByStatusData?.forEach((job) => {
      const status = job.status || "unknown"
      jobsByStatus[status] = (jobsByStatus[status] || 0) + 1
    })

    // Applications submitted today
    const { count: newApplicationsCount } = await supabase
      .from("job_applications")
      .select("*", { count: "exact", head: true })
      .gte("applied_at", todayISO)

    // Total applications
    const { count: totalApplicationsCount } = await supabase
      .from("job_applications")
      .select("*", { count: "exact", head: true })

    // Jobs with applications
    const { data: jobsWithApps } = await supabase.from("job_applications").select("job_id")

    const uniqueJobsWithApps = new Set(jobsWithApps?.map((j) => j.job_id) || []).size
    const jobsWithNoApps = (totalJobsCount || 0) - uniqueJobsWithApps

    // Avg applications per job
    const avgApplicationsPerJob =
      totalJobsCount && totalJobsCount > 0 ? Number(((totalApplicationsCount || 0) / totalJobsCount).toFixed(1)) : 0

    // Total active users (candidates + employers)
    const totalActiveUsers = (totalCandidatesCount || 0) + (totalEmployersCount || 0)

    return {
      success: true,
      metrics: {
        userActivity: {
          newCandidates: newCandidatesCount || 0,
          newEmployers: newEmployersCount || 0,
          totalCandidates: totalCandidatesCount || 0,
          totalEmployers: totalEmployersCount || 0,
          totalActiveUsers,
        },
        jobActivity: {
          newJobsToday: newJobsCount || 0,
          totalJobs: totalJobsCount || 0,
          activeJobs: activeJobsCount || 0,
          jobsByStatus,
        },
        applicationFlow: {
          applicationsToday: newApplicationsCount || 0,
          totalApplications: totalApplicationsCount || 0,
          avgApplicationsPerJob,
          jobsWithNoApplications: jobsWithNoApps,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching daily metrics:", error)
    return {
      success: false,
      metrics: {
        userActivity: { newCandidates: 0, newEmployers: 0, totalCandidates: 0, totalEmployers: 0, totalActiveUsers: 0 },
        jobActivity: { newJobsToday: 0, totalJobs: 0, activeJobs: 0, jobsByStatus: {} },
        applicationFlow: {
          applicationsToday: 0,
          totalApplications: 0,
          avgApplicationsPerJob: 0,
          jobsWithNoApplications: 0,
        },
      },
    }
  }
}

export async function getWeeklyMetrics() {
  try {
    const supabase = await createServerClient()

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneWeekAgoISO = oneWeekAgo.toISOString()

    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksAgoISO = twoWeeksAgo.toISOString()

    // This week signups
    const { count: candidatesThisWeek } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgoISO)

    const { count: employersThisWeek } = await supabase
      .from("employers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgoISO)

    // Last week signups
    const { count: candidatesLastWeek } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twoWeeksAgoISO)
      .lt("created_at", oneWeekAgoISO)

    const { count: employersLastWeek } = await supabase
      .from("employers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twoWeeksAgoISO)
      .lt("created_at", oneWeekAgoISO)

    // Calculate growth percentages
    const candidateGrowth =
      candidatesLastWeek && candidatesLastWeek > 0
        ? Number(((((candidatesThisWeek || 0) - candidatesLastWeek) / candidatesLastWeek) * 100).toFixed(1))
        : 0

    const employerGrowth =
      employersLastWeek && employersLastWeek > 0
        ? Number(((((employersThisWeek || 0) - employersLastWeek) / employersLastWeek) * 100).toFixed(1))
        : 0

    // Active jobs this week (published status, created in last 7 days)
    const { count: activeJobsThisWeek } = await supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("created_at", oneWeekAgoISO)

    // Active jobs last week (published status, created between 14 and 7 days ago)
    const { count: activeJobsLastWeek } = await supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("created_at", twoWeeksAgoISO)
      .lt("created_at", oneWeekAgoISO)

    // Calculate active jobs growth percentage
    const activeJobsGrowth =
      activeJobsLastWeek && activeJobsLastWeek > 0
        ? Number(((((activeJobsThisWeek || 0) - activeJobsLastWeek) / activeJobsLastWeek) * 100).toFixed(1))
        : activeJobsThisWeek && activeJobsThisWeek > 0
          ? 100
          : 0

    // Total active jobs (published status)
    const { count: activeJobsCount } = await supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")

    // Active candidates (total for now)
    const { count: activeCandidatesCount } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })

    // Jobs to candidates ratio
    const jobsToCandidatesRatio =
      activeCandidatesCount && activeCandidatesCount > 0
        ? Number(((activeJobsCount || 0) / activeCandidatesCount).toFixed(2))
        : 0

    return {
      success: true,
      metrics: {
        growth: {
          weeklyNewCandidates: candidatesThisWeek || 0,
          weeklyNewEmployers: employersThisWeek || 0,
          candidateGrowthPercent: candidateGrowth,
          employerGrowthPercent: employerGrowth,
        },
        marketplace: {
          activeJobs: activeJobsCount || 0,
          activeJobsThisWeek: activeJobsThisWeek || 0,
          activeJobsGrowthPercent: activeJobsGrowth,
          activeCandidates: activeCandidatesCount || 0,
          jobsToCandidatesRatio,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching weekly metrics:", error)
    return {
      success: false,
      metrics: {
        growth: { weeklyNewCandidates: 0, weeklyNewEmployers: 0, candidateGrowthPercent: 0, employerGrowthPercent: 0 },
        marketplace: {
          activeJobs: 0,
          activeJobsThisWeek: 0,
          activeJobsGrowthPercent: 0,
          activeCandidates: 0,
          jobsToCandidatesRatio: 0,
        },
      },
    }
  }
}

// Management functions
export async function getAllEmployers(page = 1, limit = 10, search = "") {
  try {
    const supabase = await createServerClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from("employers")
      .select("id, email, company_name, contact_person, mobile_number, city, industry_type, created_at, otp_verified", {
        count: "exact",
      })

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const {
      data: employers,
      count,
      error,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      employers: employers || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error("Error fetching employers:", error)
    return {
      success: false,
      employers: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}

export async function getAllCandidates(page = 1, limit = 10, search = "") {
  try {
    const supabase = await createServerClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from("candidates")
      .select(
        "id, full_name, email, mobile_number, work_status, current_job_title, current_city, current_state, highest_qualification, total_experience_years, total_experience_months, annual_salary, skills_you_know, created_at, registration_completed",
        { count: "exact" },
      )

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,mobile_number.ilike.%${search}%`)
    }

    const {
      data: candidates,
      count,
      error,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / limit)

    console.log("[v0] Fetched candidates:", count, "Error:", error)

    return {
      success: true,
      candidates: candidates || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching candidates:", error)
    return {
      success: false,
      candidates: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}

export async function getAllJobs(page = 1, limit = 10, search = "") {
  try {
    const supabase = createAdminClient()
    const offset = (page - 1) * limit

    console.log("[v0] Fetching ALL jobs (including drafts) with admin client")

    let query = supabase.from("job_postings").select(
      `
        id, job_title, company_name, job_locations, status, created_at,
        employer_id, employment_type, min_salary, max_salary, work_mode, openings
      `,
      { count: "exact" },
    )

    if (search) {
      query = query.or(`job_title.ilike.%${search}%,company_name.ilike.%${search}%`)
    }

    const {
      data: jobs,
      count,
      error,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    if (error) throw error

    console.log("[v0] Fetched jobs:", jobs?.length || 0)
    console.log(
      "[v0] Job statuses:",
      jobs?.map((j: any) => ({ title: j.job_title, status: j.status })),
    )

    const jobIds = (jobs || []).map((job: Record<string, unknown>) => job.id)

    let applicationCounts: Record<string, number> = {}

    if (jobIds.length > 0) {
      console.log("[v0] Fetching applications for job IDs:", jobIds)

      const { data: applications, error: appError } = await supabase
        .from("job_applications")
        .select("job_id")
        .in("job_id", jobIds)

      console.log("[v0] Applications fetched:", applications?.length || 0, "Error:", appError)

      if (!appError && applications) {
        // Count applications per job
        applicationCounts = applications.reduce((acc: Record<string, number>, app: Record<string, unknown>) => {
          const jobId = app.job_id as string
          acc[jobId] = (acc[jobId] || 0) + 1
          return acc
        }, {})

        console.log("[v0] Application counts per job:", applicationCounts)
      }
    }

    const employerIds = [
      ...new Set((jobs || []).map((job: Record<string, unknown>) => job.employer_id).filter(Boolean)),
    ]
    let employerEmails: Record<string, string> = {}

    if (employerIds.length > 0) {
      const { data: employers } = await supabase.from("employers").select("id, email").in("id", employerIds)

      if (employers) {
        employerEmails = employers.reduce((acc: Record<string, string>, emp: Record<string, unknown>) => {
          acc[emp.id as string] = emp.email as string
          return acc
        }, {})
      }
    }

    const transformedJobs = (jobs || []).map((job: Record<string, unknown>) => ({
      ...job,
      application_count: applicationCounts[job.id as string] || 0,
      employer_email: employerEmails[job.employer_id as string] || "N/A",
    }))

    console.log(
      "[v0] Transformed jobs with application counts:",
      transformedJobs.map((j) => ({ id: j.id, title: j.job_title, apps: j.application_count })),
    )

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      jobs: transformedJobs,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return {
      success: false,
      jobs: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}

export async function deleteEmployer(id: string) {
  try {
    const supabase = createAdminClient()
    console.log("[v0] Deleting employer with ID:", id)
    const { error } = await supabase.from("employers").delete().eq("id", id)
    if (error) {
      console.error("[v0] Error deleting employer:", error)
      throw error
    }
    console.log("[v0] Employer deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("Error deleting employer:", error)
    return { success: false, error: "Failed to delete employer" }
  }
}

export async function updateEmployer(
  id: string,
  data: {
    username?: string
    company_name?: string
    contact_person?: string
    email?: string
    mobile_number?: string
    city?: string
    industry_type?: string
  },
) {
  try {
    const supabase = await createServerClient()

    const { data: employer, error } = await supabase
      .from("employers")
      .update({
        ...(data.username && { username: data.username }),
        ...(data.company_name && { company_name: data.company_name }),
        ...(data.contact_person && { contact_person: data.contact_person }),
        ...(data.email && { email: data.email }),
        ...(data.mobile_number && { mobile_number: data.mobile_number }),
        ...(data.city && { city: data.city }),
        ...(data.industry_type && { industry_type: data.industry_type }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return { success: true, employer }
  } catch (error) {
    console.error("Error updating employer:", error)
    return { success: false, error: "Failed to update employer" }
  }
}

export async function addEmployer(data: {
  username: string
  company_name: string
  contact_person: string
  email: string
  password: string
  mobile_number?: string
  city?: string
  industry_type?: string
}) {
  try {
    const supabase = await createServerClient()
    const passwordHash = await bcrypt.hash(data.password, 10)

    const { data: employer, error } = await supabase
      .from("employers")
      .insert({
        username: data.username,
        company_name: data.company_name,
        contact_person: data.contact_person,
        email: data.email,
        password_hash: passwordHash,
        mobile_number: data.mobile_number || null,
        city: data.city || null,
        industry_type: data.industry_type || null,
        otp_verified: true, // Admin-created accounts are auto-verified
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Email already exists" }
      }
      console.error("Error adding employer:", error.message)
      throw error
    }
    return { success: true, employer }
  } catch (error) {
    console.error("Error adding employer:", error)
    return { success: false, error: "Failed to add employer" }
  }
}

export async function getEmployerById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data: employer, error } = await supabase
      .from("employers")
      .select("id, email, company_name, contact_person, mobile_number, city, industry_type")
      .eq("id", id)
      .single()

    if (error) throw error
    return { success: true, employer }
  } catch (error) {
    console.error("Error fetching employer:", error)
    return { success: false, error: "Failed to fetch employer" }
  }
}

export async function deleteCandidate(id: string) {
  try {
    const supabase = createAdminClient()
    console.log("[v0] Deleting candidate with ID:", id)
    const { error } = await supabase.from("candidates").delete().eq("id", id)
    if (error) {
      console.error("[v0] Error deleting candidate:", error)
      throw error
    }
    console.log("[v0] Candidate deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("Error deleting candidate:", error)
    return { success: false, error: "Failed to delete candidate" }
  }
}

export async function deleteJob(id: string) {
  try {
    const supabase = createAdminClient()
    console.log("[v0] Deleting job with ID:", id)
    const { error } = await supabase.from("job_postings").delete().eq("id", id)
    if (error) {
      console.error("[v0] Error deleting job:", error)
      throw error
    }
    console.log("[v0] Job deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("Error deleting job:", error)
    return { success: false, error: "Failed to delete job" }
  }
}

export async function updateJobStatus(id: string, status: string) {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from("job_postings").update({ status }).eq("id", id)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error updating job status:", error)
    return { success: false, error: "Failed to update job status" }
  }
}

export async function getBusinessTeam(page = 1, limit = 10) {
  try {
    const supabase = await createServerClient()
    const offset = (page - 1) * limit

    const {
      data: team,
      count,
      error,
    } = await supabase
      .from("business_team")
      .select("id, email, full_name, role, is_active, created_at, last_login", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      team: team || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error("Error fetching business team:", error)
    return {
      success: false,
      team: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}

export async function addBusinessTeamMember(email: string, password: string, fullName: string, role: string) {
  return registerBusinessUser(email, password, fullName, role)
}

export async function deleteBusinessTeamMember(id: string) {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from("business_team").delete().eq("id", id)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting team member:", error)
    return { success: false, error: "Failed to delete team member" }
  }
}

export const addTeamMember = addBusinessTeamMember

export async function getCandidateById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("candidates").select("*").eq("id", id).single()

    if (error) throw error
    return { success: true, candidate: data }
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return { success: false, error: "Failed to fetch candidate" }
  }
}

export async function addCandidate(candidateData: {
  full_name: string
  email: string
  mobile_number: string
  password: string
  gender?: string
  work_status: string
  current_job_title?: string
  company_name?: string
  total_experience_years?: number
  total_experience_months?: number
  annual_salary?: string
  notice_period?: string
  highest_qualification?: string
  course?: string
  specialization?: string
  university?: string
  passing_year?: string
  current_city?: string
  current_state?: string
  skills_you_know?: string[]
  preferred_locations?: string[]
}) {
  try {
    const supabase = await createServerClient()
    const bcrypt = await import("bcryptjs")
    const password_hash = await bcrypt.hash(candidateData.password, 10)

    const { data, error } = await supabase
      .from("candidates")
      .insert({
        full_name: candidateData.full_name,
        email: candidateData.email,
        mobile_number: candidateData.mobile_number,
        password_hash,
        gender: candidateData.gender || null,
        work_status: candidateData.work_status,
        current_job_title: candidateData.current_job_title || null,
        company_name: candidateData.company_name || null,
        total_experience_years: candidateData.total_experience_years || 0,
        total_experience_months: candidateData.total_experience_months || 0,
        annual_salary: candidateData.annual_salary || null,
        notice_period: candidateData.notice_period || null,
        highest_qualification: candidateData.highest_qualification || null,
        course: candidateData.course || null,
        specialization: candidateData.specialization || null,
        university: candidateData.university || null,
        passing_year: candidateData.passing_year || null,
        current_city: candidateData.current_city || null,
        current_state: candidateData.current_state || null,
        skills_you_know: candidateData.skills_you_know || [],
        preferred_locations: candidateData.preferred_locations || [],
        registration_completed: true,
        current_registration_step: 5,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, candidate: data }
  } catch (error: unknown) {
    console.error("Error adding candidate:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to add candidate"
    return { success: false, error: errorMessage }
  }
}

export async function updateCandidate(
  id: string,
  candidateData: {
    full_name?: string
    email?: string
    mobile_number?: string
    gender?: string
    work_status?: string
    current_job_title?: string
    company_name?: string
    total_experience_years?: number
    total_experience_months?: number
    annual_salary?: string
    notice_period?: string
    highest_qualification?: string
    course?: string
    specialization?: string
    university?: string
    passing_year?: string
    current_city?: string
    current_state?: string
    skills_you_know?: string[]
    preferred_locations?: string[]
  },
) {
  try {
    const supabase = await createServerClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (candidateData.full_name) updateData.full_name = candidateData.full_name
    if (candidateData.email) updateData.email = candidateData.email
    if (candidateData.mobile_number) updateData.mobile_number = candidateData.mobile_number
    if (candidateData.gender) updateData.gender = candidateData.gender
    if (candidateData.work_status) updateData.work_status = candidateData.work_status
    if (candidateData.current_job_title !== undefined) updateData.current_job_title = candidateData.current_job_title
    if (candidateData.company_name !== undefined) updateData.company_name = candidateData.company_name
    if (candidateData.total_experience_years !== undefined)
      updateData.total_experience_years = candidateData.total_experience_years
    if (candidateData.total_experience_months !== undefined)
      updateData.total_experience_months = candidateData.total_experience_months
    if (candidateData.annual_salary !== undefined) updateData.annual_salary = candidateData.annual_salary
    if (candidateData.notice_period !== undefined) updateData.notice_period = candidateData.notice_period
    if (candidateData.highest_qualification !== undefined)
      updateData.highest_qualification = candidateData.highest_qualification
    if (candidateData.course !== undefined) updateData.course = candidateData.course
    if (candidateData.specialization !== undefined) updateData.specialization = candidateData.specialization
    if (candidateData.university !== undefined) updateData.university = candidateData.university
    if (candidateData.passing_year !== undefined) updateData.passing_year = candidateData.passing_year
    if (candidateData.current_city !== undefined) updateData.current_city = candidateData.current_city
    if (candidateData.current_state !== undefined) updateData.current_state = candidateData.current_state
    if (candidateData.skills_you_know !== undefined) updateData.skills_you_know = candidateData.skills_you_know
    if (candidateData.preferred_locations !== undefined)
      updateData.preferred_locations = candidateData.preferred_locations

    const { error } = await supabase.from("candidates").update(updateData).eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error: unknown) {
    console.error("Error updating candidate:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update candidate"
    return { success: false, error: errorMessage }
  }
}

export async function getJobById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("job_postings").select("*").eq("id", id).single()

    if (error) throw error
    return { success: true, job: data }
  } catch (error) {
    console.error("Error fetching job:", error)
    return { success: false, error: "Failed to fetch job" }
  }
}

export async function addJob(jobData: {
  job_title: string
  company_name: string
  employer_id: string
  job_description?: string
  employment_type?: string
  work_mode?: string
  min_salary?: number
  max_salary?: number
  min_experience?: number
  max_experience?: number
  openings?: number
  job_locations?: string[]
  required_skills?: string[]
  status?: string
}) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("job_postings")
      .insert({
        job_title: jobData.job_title,
        company_name: jobData.company_name,
        employer_id: jobData.employer_id,
        job_description: jobData.job_description || null,
        employment_type: jobData.employment_type || "full-time",
        work_mode: jobData.work_mode || "on-site",
        min_salary: jobData.min_salary || null,
        max_salary: jobData.max_salary || null,
        min_experience: jobData.min_experience || 0,
        max_experience: jobData.max_experience || null,
        openings: jobData.openings || 1,
        job_locations: jobData.job_locations || [],
        required_skills: jobData.required_skills || [],
        status: jobData.status || "draft",
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, job: data }
  } catch (error: unknown) {
    console.error("Error adding job:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to add job"
    return { success: false, error: errorMessage }
  }
}

export async function updateJob(
  id: string,
  jobData: {
    job_title?: string
    company_name?: string
    job_description?: string
    employment_type?: string
    work_mode?: string
    min_salary?: number
    max_salary?: number
    min_experience?: number
    max_experience?: number
    openings?: number
    job_locations?: string[]
    required_skills?: string[]
    status?: string
  },
) {
  try {
    const supabase = await createServerClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (jobData.job_title) updateData.job_title = jobData.job_title
    if (jobData.company_name) updateData.company_name = jobData.company_name
    if (jobData.job_description !== undefined) updateData.job_description = jobData.job_description
    if (jobData.employment_type) updateData.employment_type = jobData.employment_type
    if (jobData.work_mode) updateData.work_mode = jobData.work_mode
    if (jobData.min_salary !== undefined) updateData.min_salary = jobData.min_salary
    if (jobData.max_salary !== undefined) updateData.max_salary = jobData.max_salary
    if (jobData.min_experience !== undefined) updateData.min_experience = jobData.min_experience
    if (jobData.max_experience !== undefined) updateData.max_experience = jobData.max_experience
    if (jobData.openings !== undefined) updateData.openings = jobData.openings
    if (jobData.job_locations !== undefined) updateData.job_locations = jobData.job_locations
    if (jobData.required_skills !== undefined) updateData.required_skills = jobData.required_skills
    if (jobData.status) updateData.status = jobData.status

    const { error } = await supabase.from("job_postings").update(updateData).eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error: unknown) {
    console.error("Error updating job:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update job"
    return { success: false, error: errorMessage }
  }
}
