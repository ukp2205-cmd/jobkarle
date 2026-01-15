"use client"

import React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Eye, EyeOff, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  createCandidate,
  checkEmailExists,
  uploadResume,
  updatePreferencesAndComplete,
  updateEmploymentDetails,
  updateEducationDetails,
} from "@/app/actions/candidate-actions"
import { fetchInstitutions, addCustomInstitution as saveCustomInstitution } from "@/app/actions/institution-actions"
import { getEducationsByLevel, getSpecializationsByEducation } from "@/app/actions/education-actions"
import { getDepartmentsByIndustry, saveCustomDepartment } from "@/app/actions/department-actions"
import { getRoleCategoriesByDepartment, saveCustomRoleCategory } from "@/app/actions/role-category-actions"

import Link from "next/link"

const qualificationCourseSpecializationMapping: Record<
  string,
  {
    courses: string[]
    specializations: Record<string, string[]>
  }
> = {
  "10th": {
    courses: ["CBSE", "ICSE", "State Board", "NIOS", "Other"],
    specializations: {},
  },
  "12th": {
    courses: ["Science", "Commerce", "Arts"],
    specializations: {},
  },
  Diploma: {
    courses: [
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
      "Electronics Engineering",
      "Computer Engineering",
      "Information Technology",
      "Automobile Engineering",
      "Chemical Engineering",
      "Textile Engineering",
      "Other",
    ],
    specializations: {
      "Mechanical Engineering": ["CAD/CAM", "Thermal Engineering", "Production", "Automobile", "General"],
      "Civil Engineering": ["Structural", "Transportation", "Environmental", "Geotechnical", "General"],
      "Electrical Engineering": ["Power Systems", "Control Systems", "Electronics", "General"],
      "Electronics Engineering": ["VLSI", "Embedded Systems", "Communication", "General"],
      "Computer Engineering": ["Software Development", "Networking", "Database", "General"],
      "Information Technology": ["Web Development", "Mobile Apps", "Cloud Computing", "General"],
      "Automobile Engineering": ["Design", "Manufacturing", "Maintenance", "General"],
      "Chemical Engineering": ["Process Engineering", "Petrochemical", "General"],
      "Textile Engineering": ["Fabric Technology", "Apparel Design", "General"],
      Other: ["General"],
    },
  },
  "Graduation/Diploma": {
    courses: ["B.Tech/B.E.", "B.Sc", "BCA", "BBA", "B.Com", "BA", "LLB", "B.Pharm", "B.Arch", "Other"],
    specializations: {
      "B.Tech/B.E.": [
        "Computer Science",
        "IT",
        "Mechanical",
        "Civil",
        "Electrical",
        "Electronics",
        "Chemical",
        "Other",
      ],
      "B.Sc": ["Physics", "Chemistry", "Mathematics", "Computer Science", "Biology", "Other"],
      BCA: ["General", "Cloud Computing", "Data Science"],
      BBA: ["Finance", "Marketing", "HR", "Operations", "General"],
      "B.Com": ["General", "Accounting", "Finance"],
      BA: ["English", "Economics", "Psychology", "Sociology", "Other"],
      LLB: ["Corporate Law", "Criminal Law", "General"],
      "B.Arch": ["General", "Urban Design"],
      Other: ["General"],
    },
  },
  "Post Graduation/Masters": {
    courses: ["M.Tech/M.E.", "M.Sc", "MCA", "MBA", "M.Com", "MA", "LLM", "M.Pharm", "Other"],
    specializations: {
      "M.Tech/M.E.": [
        "Computer Science",
        "IT",
        "Mechanical",
        "Civil",
        "Electrical",
        "Electronics",
        "Data Science",
        "AI/ML",
        "Other",
      ],
      "M.Sc": ["Physics", "Chemistry", "Mathematics", "Computer Science", "Data Science", "Other"],
      MCA: ["General", "Cloud Computing", "Data Science", "AI/ML"],
      MBA: ["Finance", "Marketing", "HR", "Operations", "Strategy", "General"],
      "M.Com": ["General", "Accounting", "Finance"],
      MA: ["English", "Economics", "Psychology", "Sociology", "Other"],
      LLM: ["Corporate Law", "Criminal Law", "IP Law", "General"],
      "M.Pharm": ["General", "Clinical Pharmacy", "Pharmacology"],
      Other: ["General"],
    },
  },
  "Doctorate/PhD": {
    courses: ["PhD Computer Science", "PhD Engineering", "PhD Management", "PhD Science", "PhD Arts", "Other"],
    specializations: {
      "PhD Computer Science": ["AI/ML", "Data Science", "Cybersecurity", "General"],
      "PhD Engineering": ["Mechanical", "Civil", "Electrical", "Chemical", "General"],
      "PhD Management": ["Finance", "Marketing", "Strategy", "General"],
      "PhD Science": ["Physics", "Chemistry", "Biology", "Mathematics", "General"],
      "PhD Arts": ["Literature", "History", "Philosophy", "General"],
      Other: ["General"],
    },
  },
}

const NOTICE_PERIOD_OPTIONS = ["Immediate", "15 Days", "1 Month", "2 Months", "3 Months", "More than 3 Months"]

const getSupabase = () => createClient()

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("At least 8 characters")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("At least 1 uppercase letter")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("At least 1 number")
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("At least 1 special character (!@#$%^&*)")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

const formatIndianNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""

  // Format with Indian comma system (XX,XX,XXX)
  const num = Number.parseInt(digits)
  return num.toLocaleString("en-IN")
}

type EmploymentEntry = {
  currentlyEmployed: "yes" | "no" | ""
  companyName: string
  currentJobTitle: string
  currentCity: string
  currentState: string
  durationFrom: string
  durationTo: string
  annualSalary: string
  noticePeriod: string
  industry?: string // Added to EmploymentEntry
  department?: string // Added to EmploymentEntry
  roleCategory?: string // Added to EmploymentEntry
  jobRole?: string // Added to EmploymentEntry
}

type AdditionalEmploymentEntry = {
  companyName: string
  jobTitle: string
  fromDate: string // MM/YY format - Changed to 'durationFrom' for consistency
  toDate: string // MM/YY format - Changed to 'durationTo' for consistency
}

type RegistrationData = {
  // Step 1: Basic Registration
  fullName: string
  email: string
  password: string
  mobileNumber: string
  mobileVerified: boolean // Added to track mobile verification status
  workStatus: "experienced" | "fresher" | ""
  resume: File | null
  resumeUrl: string
  candidateId: string | null // Added to store candidate ID

  // Step 2: OTP (not stored, just verified)
  otp: string

  // Step 3: Employment Details (combined with skills) - now supports multiple entries
  currentEmployment: EmploymentEntry | null // First/current employment with full details
  additionalEmployment: AdditionalEmploymentEntry[] // Additional employment with simplified fields
  totalExperienceYears: string
  totalExperienceMonths: string
  skills: string[]
  industry: string
  department: string
  roleCategory: string
  jobRole: string

  // Step 4: Education & Certifications
  highestQualification: string
  course: string
  courseType: string
  specialization: string
  university: string
  startingYear: string // Now removed in favor of passingYear
  passingYear: string
  passingYearFrom: string // Added for year range
  passingYearTo: string // Added for year range
  percentage?: string // Added for percentage/grade
  certifications: Array<{
    name: string
    issuer: string
    issueDate: string
    expiryDate?: string
  }>

  // Step 5-6: Preferences & Personal Details
  resumeHeadline: string
  preferredLocations: string[]
  preferredSalary: string
  gender: string
  currentCity: string
  currentState: string
  availabilityToJoin: string
  dateOfBirth: string
  maritalStatus: "single" | "married" | ""
  languagesKnown: Array<{
    language: string
    read: boolean
    write: boolean
    speak: boolean
  }>
  projects: Array<{
    title: string
    description: string
    role: string
    startDate: string
    endDate?: string
    technologies?: string
  }>
}

type StepProps = {
  formData: RegistrationData
  updateFormData: (field: keyof RegistrationData, value: any) => void
  nextStep: () => void
  prevStep?: () => void // Added prevStep prop
  setFormData?: any
  setIsLoading?: (loading: boolean) => void
  isLoading?: boolean
  handleCompleteRegistration?: () => void // Added for completion handler
}

type Skill = {
  id: number
  skill_name: string
  category: string
}

const calculateTotalExperienceFromEmployment = (
  formData: RegistrationData,
  updateFormData: (field: keyof RegistrationData, value: any) => void,
) => {
  let totalMonths = 0

  console.log("[v0] Calculating total experience...")

  // Calculate from current employment
  if (formData.currentEmployment?.durationFrom) {
    const fromDateParts = formData.currentEmployment.durationFrom.split("-")
    const fromDate = new Date(Number(fromDateParts[0]), Number(fromDateParts[1]) - 1, 1)

    let toDate: Date
    if (formData.currentEmployment.durationTo === "Present" || !formData.currentEmployment.durationTo) {
      toDate = new Date()
    } else {
      const toDateParts = formData.currentEmployment.durationTo.split("-")
      toDate = new Date(Number(toDateParts[0]), Number(toDateParts[1]) - 1, 1)
    }

    if (toDate < fromDate) {
      console.warn("[v0] Current employment 'To' date is before 'From' date")
    } else {
      const months = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())
      console.log(
        "[v0] Current employment:",
        formData.currentEmployment.durationFrom,
        "to",
        formData.currentEmployment.durationTo,
        "=",
        months,
        "months",
      )
      totalMonths += Math.max(0, months)
    }
  }

  // Calculate from previous employments
  formData.additionalEmployment.forEach((emp, index) => {
    if (emp.fromDate && emp.toDate) {
      const fromDateParts = emp.fromDate.split("-")
      const fromDate = new Date(Number(fromDateParts[0]), Number(fromDateParts[1]) - 1, 1)

      const toDateParts = emp.toDate.split("-")
      const toDate = new Date(Number(toDateParts[0]), Number(toDateParts[1]) - 1, 1)

      if (toDate < fromDate) {
        console.warn(`[v0] Previous employment #${index + 1} 'To' date is before 'From' date`)
      } else {
        const months = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())
        console.log(`[v0] Previous employment #${index + 1}:`, emp.fromDate, "to", emp.toDate, "=", months, "months")
        totalMonths += Math.max(0, months)
      }
    }
  })

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  console.log("[v0] Total experience:", totalMonths, "months =", years, "years", months, "months")

  updateFormData("totalExperienceYears", String(years))
  updateFormData("totalExperienceMonths", String(months))
}

export default function CandidateRegistration() {
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("candidateRegistrationStep")
      return saved ? Number.parseInt(saved, 10) : 1
    }
    return 1
  })
  const [isLoading, setIsLoading] = useState(false)

  // Removed state variables from here, they belong in Step3EmploymentAndSkills

  const [formData, setFormData] = useState<RegistrationData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("candidateRegistrationData")
        if (saved) {
          const parsed = JSON.parse(saved)
          // Validate that parsed data is an object
          if (parsed && typeof parsed === "object") {
            console.log("[v0] Loaded saved registration data from localStorage")
            // Don't restore password or OTP for security
            // Ensure essential fields are present, even if empty, to prevent runtime errors
            const defaultFormData = {
              fullName: "",
              email: "",
              password: "",
              mobileNumber: "",
              mobileVerified: false,
              workStatus: "",
              resume: null,
              resumeUrl: "",
              otp: "",
              candidateId: null,
              currentEmployment: null,
              additionalEmployment: [],
              totalExperienceYears: "",
              totalExperienceMonths: "",
              skills: [],
              industry: "",
              department: "",
              roleCategory: "",
              jobRole: "",
              highestQualification: "",
              course: "",
              courseType: "",
              specialization: "",
              university: "",
              startingYear: "",
              passingYear: "",
              passingYearFrom: "",
              passingYearTo: "",
              certifications: [],
              resumeHeadline: "",
              preferredLocations: [],
              preferredSalary: "",
              gender: "",
              currentCity: "",
              currentState: "",
              availabilityToJoin: "",
              dateOfBirth: "",
              maritalStatus: "",
              languagesKnown: [],
              projects: [],
            }
            return { ...defaultFormData, ...parsed, password: "", otp: "", resume: null }
          }
        }
      } catch (error) {
        console.error("[v0] Failed to parse saved registration data:", error)
        // Clear corrupted data
        localStorage.removeItem("candidateRegistrationData")
      }
    }
    return {
      fullName: "",
      email: "",
      password: "",
      mobileNumber: "",
      mobileVerified: false, // Initialize mobileVerified to false
      workStatus: "",
      resume: null,
      resumeUrl: "",
      otp: "",
      candidateId: null, // Initialize candidateId to null
      currentEmployment: null,
      additionalEmployment: [],

      totalExperienceYears: "",
      totalExperienceMonths: "",
      skills: [],
      industry: "",
      department: "",
      roleCategory: "",
      jobRole: "",
      highestQualification: "",
      course: "",
      courseType: "",
      specialization: "",
      university: "",
      startingYear: "", // This field is effectively removed from the form logic
      passingYear: "",
      passingYearFrom: "", // Initialize new fields
      passingYearTo: "", // Initialize new fields
      certifications: [],
      resumeHeadline: "",
      preferredLocations: [],
      preferredSalary: "",
      gender: "",
      currentCity: "",
      currentState: "",
      availabilityToJoin: "",
      dateOfBirth: "",
      maritalStatus: "",
      languagesKnown: [],
      projects: [],
    }
  })

  const isFresher = formData.workStatus === "fresher"
  // const totalSteps = isFresher ? 5 : 6 // Original line

  const getTotalSteps = () => {
    // Both experienced and freshers end at step 5 (the last step number)
    // Experienced: steps 1, 2, 3, 4, 5
    // Freshers: steps 1, 2, skip 3, 4, 5
    return 5
  }

  const updateFormData = (field: keyof RegistrationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSalaryChange = (value: string) => {
    // Remove existing commas and format
    const formatted = formatIndianNumber(value)
    updateFormData("preferredSalary", formatted)
  }

  const handleCompleteRegistration = async () => {
    if (isLoading) return
    setIsLoading?.(true)

    console.log("[v0] handleCompleteRegistration called")

    try {
      // Call the API to save all preferences and complete registration
      // Note: The function `updatePreferencesAndComplete` is expected to take the email of the candidate
      // to identify them and then the data object containing their preferences and other details.
      const result = await updatePreferencesAndComplete(formData.email, {
        resumeHeadline: formData.resumeHeadline,
        preferredLocations: formData.preferredLocations,
        preferredSalary: formData.preferredSalary,
        gender: formData.gender,
        currentCity: formData.currentCity,
        currentState: formData.currentState,
        availabilityToJoin: formData.availabilityToJoin,
        dateOfBirth: formData.dateOfBirth,
        languagesKnown: formData.languagesKnown,
        maritalStatus: formData.maritalStatus,
        projects: formData.projects,
        certifications: formData.certifications,
        skills: formData.skills,
      })

      if (result.success) {
        console.log("[v0] Registration completed successfully!")

        // Show success message
        alert("🎉 Registration Completed Successfully!\n\nYour profile has been created. Please login to continue.")

        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/candidate/login"
        }, 1000)
      } else {
        console.error("[v0] Error completing registration:", result.error)
        alert("Error completing registration: " + result.error)
        setIsLoading?.(false)
      }
    } catch (error) {
      console.error("[v0] Exception completing registration:", error)
      alert("An unexpected error occurred. Please try again.")
      setIsLoading?.(false)
    }
  }

  const setStepState = (step: number) => {
    // Renamed to avoid conflict with the original setStep
    console.log("[v0] In setStepState, prev:", step, "isFresher:", isFresher) // Corrected variable name here

    const maxStep = getTotalSteps() // Declare maxStep here

    if (step === 3 && step <= 2 && isFresher) {
      // This condition seems incorrect. It should likely be:
      // if (step === 3 && step_before === 2 && isFresher) or similar logic
      console.log("[v0] Fresher going to Step 3 to add skills (mandatory)")
    }

    if (step > 0 && step <= maxStep) {
      console.log("[v0] Moving to step:", step)
      setStep(step) // Use the original setStep here
    }
  }

  const nextStep = () => {
    console.log("[v0] nextStep called, current step:", step, "workStatus:", formData.workStatus)
    setStep((prev) => {
      const isFresher = formData.workStatus === "fresher"
      console.log("[v0] In setStep, prev:", prev, "isFresher:", isFresher)

      // All candidates (experienced and freshers) now go through all 5 steps
      const maxStep = 5
      console.log("[v0] maxStep:", maxStep, "prev:", prev)

      if (prev < maxStep) {
        const newStep = prev + 1
        console.log("[v0] Moving to step:", newStep)
        return newStep
      }
      console.log("[v0] At max step, staying at:", prev)
      return prev
    })
  }

  const prevStep = () => {
    setStep((prev) => {
      // The logic here is simplified. If the goal is always to go back one step,
      // this condition might need adjustment based on specific navigation rules.
      // For example, skipping a step if it was already completed or not applicable.
      // The original condition `formData.mobileVerified` for step 2 seems related to
      // skipping the OTP step if already verified, which might be handled differently now.
      // For now, general back navigation is implemented.
      return Math.max(prev - 1, 1)
    })
  }

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < step) return "completed"
    if (stepNumber === step) return "current"
    return "upcoming"
  }

  const getStepLabels = () => {
    if (isFresher) {
      return [
        { step: 1, label: "Basic details", description: "" },
        { step: 2, label: "Verification", description: "" },
        // Step 3 (Employment/Skills) is now mandatory for freshers, so it's included in the labels.
        { step: 3, label: "Skills & Experience", description: "Tell us about your skills and any experience" },
        { step: 4, label: "Education", description: "Employers prefer to know about your Education" },
        { step: 5, label: "Preferences", description: "" }, // Changed label to "Preferences"
      ]
    }
    return [
      { step: 1, label: "Basic details", description: "" },
      { step: 2, label: "Verification", description: "" },
      { step: 3, label: "Employment", description: "Your experience is your success story, talk about it" },
      { step: 4, label: "Education", description: "Employers prefer to know about your Education" },
      { step: 5, label: "Preferences", description: "" }, // Changed label to "Preferences"
    ]
  }

  const stepProps = {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    setFormData,
    setIsLoading,
    isLoading,
    handleCompleteRegistration, // Pass the new handler
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        // Renamed Step1Initial to Step1BasicInfo
        return <Step1BasicInfo {...stepProps} />
      case 2:
        return <Step2OTP {...stepProps} />
      case 3:
        // Only render employment step if not a fresher
        // Renamed the component to Step3EmploymentAndSkills to reflect its functionality
        return <Step3EmploymentAndSkills {...stepProps} />
      case 4:
        // RENDER STEP 4 EDUCATION HERE
        return <Step4EducationAndProjects {...stepProps} />
      case 5: // Combined step for preferences
        return <Step5HeadlineAndPreferences {...stepProps} />
      default:
        return <Step1BasicInfo {...stepProps} />
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("candidateRegistrationStep", step.toString())
    }
  }, [step])

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create a copy without sensitive data
      const dataToSave = {
        ...formData,
        password: "", // Don't save password
        otp: "", // Don't save OTP
        resume: null, // Can't serialize File objects
      }
      localStorage.setItem("candidateRegistrationData", JSON.stringify(dataToSave))
    }
  }, [formData])

  const clearRegistrationData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("candidateRegistrationStep")
      localStorage.removeItem("candidateRegistrationData")
    }
  }

  const getStepLabel = (stepNum: number) => {
    // This function is used for the stepper labels but the logic is in getStepLabels()
    // Returning it here for completeness in case it was intended to be modified
    const labels = getStepLabels()
    const stepInfo = labels.find((s) => s.step === stepNum)
    return stepInfo ? stepInfo.label : `Step ${stepNum}`
  }

  const maxStep = useMemo(() => {
    // Experienced: steps 1, 2, 3, 4, 5
    // Freshers: steps 1, 2, skip 3, 4, 5
    return 5
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - SHOW HEADER ON ALL STEPS INCLUDING STEP 1 */}
      <header className="bg-white px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">JK</span>
          </div>
          <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            JobKarle
          </span>
        </Link>
        {step > 1 && (
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-sm md:text-base text-gray-600 hidden sm:block">
              Welcome{formData.fullName ? `, ${formData.fullName}` : ""}
            </div>
            <a href="/" className="text-xs md:text-sm text-blue-600 hover:underline">
              Home
            </a>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {step === 1 ? (
        // Step 1: Show sidebar with registration form
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-7xl mx-auto px-4">
          {/* Left Side - Illustration */}
          <div className="lg:w-1/3 order-2 lg:order-1">
            <Card className="p-4 md:p-6 h-full">
              <div className="flex justify-center mb-4 md:mb-6">
                <img
                  src="/person-waving-with-briefcase-illustration.jpg"
                  alt="Registration illustration"
                  className="h-32 md:h-40"
                />
              </div>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Register now – it's free</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Sign up and get hired faster</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Join today and find your next job</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Create your profile & apply instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Start your job search now</span>
                </li>
              </ul>
            </Card>
          </div>
          {/* Right Side - Form */}
          <div className="lg:w-2/3 order-1 lg:order-2">{renderStep()}</div>
        </div>
      ) : (
        // Steps 2-5: Show vertical progress stepper on left and step content on right
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Side - Vertical Stepper */}
            <div className="lg:w-1/4 lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="space-y-1">
                  {getStepLabels().map((stepInfo, index) => {
                    const stepStatus = getStepStatus(stepInfo.step)
                    const isCompleted = stepStatus === "completed"
                    const isCurrent = stepStatus === "current"
                    const isUpcoming = stepStatus === "upcoming"

                    return (
                      <div key={stepInfo.step} className="relative">
                        {/* Connector Line */}
                        {index < getStepLabels().length - 1 && (
                          <div
                            className={`absolute left-4 top-8 w-0.5 h-12 ${
                              isCompleted ? "bg-green-500" : "bg-gray-200"
                            }`}
                          />
                        )}

                        {/* Step Item */}
                        <div className="flex items-start gap-3 py-2">
                          {/* Step Circle */}
                          <button
                            type="button"
                            onClick={() => isCompleted && setStep(stepInfo.step)}
                            disabled={!isCompleted}
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                              isCompleted
                                ? "bg-green-500 text-white cursor-pointer hover:bg-green-600 hover:scale-110"
                                : isCurrent
                                  ? "bg-purple-600 text-white ring-4 ring-purple-100"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4" /> : stepInfo.step}
                          </button>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-semibold text-sm ${
                                isCurrent ? "text-purple-600" : isCompleted ? "text-gray-900" : "text-gray-400"
                              }`}
                            >
                              {stepInfo.label}
                            </div>
                            {stepInfo.description && (
                              <div className="text-xs text-gray-500 mt-0.5">{stepInfo.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Side - Step Content */}
            <div className="lg:w-3/4">{renderStep()}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-blue-600">
            <a href="#" className="hover:underline">
              About Us
            </a>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <a href="#" className="hover:underline">
              Contact Us
            </a>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <a href="#" className="hover:underline">
              FAQs
            </a>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <a href="#" className="hover:underline">
              Terms and Conditions
            </a>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <a href="#" className="hover:underline">
              Report a Problem
            </a>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <a href="/employer/register" className="hover:underline">
              Employer Registration
            </a>
          </div>
          <div className="text-center text-xs md:text-sm text-gray-500 mt-2">
            All rights reserved © 2025 JobKarle Ltd.
          </div>
        </div>
      </footer>
    </div>
  )
}

// Renamed Step1Initial to Step1BasicInfo
function Step1BasicInfo({
  formData,
  updateFormData,
  nextStep,
  prevStep,
  setFormData,
  setIsLoading,
  isLoading,
}: StepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordValidation, setPasswordValidation] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: false,
    errors: [],
  })

  const handlePasswordChange = (value: string) => {
    updateFormData("password", value)
    setPasswordValidation(validatePassword(value))
  }

  // Updated handleSubmit
  const handleSubmit = async () => {
    if (isLoading) return

    // Validate password before submitting
    const { isValid: isPasswordValid } = validatePassword(formData.password)
    if (!isPasswordValid) {
      alert("Password does not meet the requirements. Please check the criteria.")
      setPasswordValidation(validatePassword(formData.password)) // Ensure validation message is shown
      return
    }

    setIsLoading?.(true)
    console.log("[v0] Step1 handleSubmit called")

    try {
      // Check if email already exists
      const emailCheck = await checkEmailExists(formData.email)
      if (emailCheck.exists) {
        alert("Email already registered")
        setIsLoading?.(false)
        return
      }

      let resumeUrl = ""

      // Upload resume if provided
      if (formData.resume) {
        console.log("[v0] Uploading resume file...")
        const uploadResult = await uploadResume(formData.resume, formData.email)

        if (!uploadResult.success) {
          alert(`Failed to upload resume: ${uploadResult.error}`)
          setIsLoading?.(false)
          return
        }

        resumeUrl = uploadResult.url || ""
        console.log("[v0] Resume uploaded successfully:", resumeUrl)
      }

      // Create candidate with resume URL
      const result = await createCandidate({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        mobileNumber: formData.mobileNumber,
        workStatus: formData.workStatus,
        resumeUrl: resumeUrl,
      })

      console.log("[v0] createCandidate result:", result)

      if (result.success) {
        // Store candidateId from the result
        updateFormData("candidateId", result.candidateId)
        nextStep()
      } else {
        alert(result.error || "Registration failed")
      }
    } catch (error) {
      console.error("[v0] Error in handleSubmit:", error)
      alert("An error occurred during registration")
    } finally {
      setIsLoading?.(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      alert("File size must be less than 5MB")
      e.target.value = "" // Reset input
      return
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, DOC, and DOCX files are allowed")
      e.target.value = "" // Reset input
      return
    }

    updateFormData("resume", file)
  }

  return (
    <>
      <Card className="p-4 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-center text-primary mb-4 md:mb-6">
          Start your career Journey with JobKarle Now !
        </h2>
        <p> India's top jobs, one platform. </p>
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{errors.form}</div>
        )}

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="text-sm">
              Full name<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => updateFormData("fullName", e.target.value)}
                placeholder="What is your name?"
                className={`mt-1 h-12 rounded-full px-4 text-sm ${errors.fullName ? "border-red-500" : ""}`}
                required
              />
              {formData.fullName && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm">
              Email ID<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="Tell us your Email ID"
                className={`mt-1 h-12 rounded-full px-4 text-sm ${errors.email ? "border-red-500" : ""}`}
                required
              />
              {formData.email && formData.email.includes("@") && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">We'll notify you about matching jobs and updates here</p>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-sm">
              Password<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Create a password"
                className={`mt-1 h-12 rounded-full px-4 pr-12 text-sm ${errors.password ? "border-red-500" : ""}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2 space-y-1">
                {passwordValidation.isValid ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Strong password
                  </p>
                ) : (
                  <div className="text-xs space-y-1">
                    <p className="text-gray-600 font-medium">Password must contain:</p>
                    {[
                      { met: formData.password.length >= 8, text: "At least 8 characters" },
                      { met: /[A-Z]/.test(formData.password), text: "At least 1 uppercase letter" },
                      { met: /[0-9]/.test(formData.password), text: "At least 1 number" },
                      {
                        met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
                        text: "At least 1 special character (!@#$%^&*)",
                      },
                    ].map((req, idx) => (
                      <p
                        key={idx}
                        className={`flex items-center gap-1 ${req.met ? "text-green-600" : "text-gray-500"}`}
                      >
                        {req.met ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span className="w-3 h-3 rounded-full border border-gray-300" />
                        )}
                        {req.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Mobile Number */}
          <div>
            <Label htmlFor="mobile" className="text-sm">
              Mobile number<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="mobile"
                value={formData.mobileNumber}
                onChange={(e) => updateFormData("mobileNumber", e.target.value)}
                placeholder="+91 Enter your mobile number"
                className={`mt-1 h-12 rounded-full px-4 text-sm ${errors.mobileNumber ? "border-red-500" : ""}`}
                required
              />
              {formData.mobileNumber && formData.mobileNumber.length >= 10 && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recruiters will use this number to contact you for job opportunities
            </p>
            {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
          </div>

          {/* Work Status */}
          <div>
            <Label className="text-sm">
              Work status<span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
              <div
                onClick={() => updateFormData("workStatus", "experienced")}
                className={`cursor-pointer p-4 border rounded-lg transition-all h-full ${
                  formData.workStatus === "experienced"
                    ? "border-l-4 border-l-purple-600 border-t border-r border-b border-gray-200 bg-purple-50"
                    : "border border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 pr-3">
                    <div className="font-semibold text-gray-900">I'm experienced</div>
                    <div className="text-sm text-blue-500 mt-1">I have work experience (excluding internships)</div>
                  </div>
                  <img src="/briefcase-work-icon.jpg" alt="Experienced" className="w-10 h-10 flex-shrink-0" />
                </div>
              </div>
              <div
                onClick={() => updateFormData("workStatus", "fresher")}
                className={`cursor-pointer p-4 border rounded-lg transition-all h-full ${
                  formData.workStatus === "fresher"
                    ? "border-l-4 border-l-purple-600 border-t border-r border-b border-gray-200 bg-purple-50"
                    : "border border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 pr-3">
                    <div className="font-semibold text-gray-900">I'm a fresher</div>
                    <div className="text-sm text-blue-500 mt-1">I am a student/ Haven't worked after graduation</div>
                  </div>
                  <img src="/graduation-cap-student-icon.jpg" alt="Fresher" className="w-10 h-10 flex-shrink-0" />
                </div>
              </div>
            </div>
            {errors.workStatus && <p className="text-red-500 text-xs mt-1">{errors.workStatus}</p>}
          </div>

          {/* Resume Upload */}
          <div>
            <Label className="text-sm">Resume</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
              <label className="cursor-pointer">
                <input type="file" className="hidden" accept=".doc,.docx,.pdf" onChange={handleFileUpload} />
                <span className="bg-orange-500 text-white px-3 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-orange-600 transition-colors inline-flex items-center gap-2">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  Upload Resume
                </span>
              </label>
              <span className="text-xs text-gray-500">DOC, DOCX, PDF | Max: 5 MB</span>
            </div>
            {formData.resume && <p className="text-xs text-green-600 mt-1">Selected: {formData.resume.name}</p>}
            <p className="text-xs text-gray-500 mt-1">Upload your resume to improve your chances of getting hired.</p>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2">
            <input type="checkbox" id="updates" className="mt-1" />
            <label htmlFor="updates" className="text-xs text-gray-600">
              Get important updates and offers on SMS, email, and WhatsApp
            </label>
          </div>

          <p className="text-xs text-gray-500">
            By registering, you accept the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms and Conditions
            </a>{" "}
            &{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>{" "}
            of JobKarle.com
          </p>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full px-8 h-12"
          >
            {isLoading ? "Registering..." : "Register now"}
          </Button>
        </div>
      </Card>

      {/* Google Sign In - Moved inside the return statement and wrapped in Fragment */}
      <div className="flex items-center justify-end mt-4 gap-2">
        <span className="text-gray-500 text-xs">Or</span>
        <span className="text-gray-600 text-xs">Continue with</span>
        <Button variant="outline" className="gap-2 bg-transparent h-9 px-4">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
      </div>
    </>
  )
}

function Step2OTP({ formData, updateFormData, nextStep, prevStep, setIsLoading, isLoading }: StepProps) {
  const [showPassword, setShowPassword] = useState(false) // This was duplicated from Step1BasicInfo and is not needed here. Removed.
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const [timer, setTimer] = useState(300) // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  useEffect(() => {
    if (timer > 0 && otpSent) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer, otpSent])

  useEffect(() => {
    if (!otpSent && formData.mobileNumber) {
      handleSendOTP()
    }
  }, [])

  const handleSendOTP = async () => {
    setIsLoading?.(true)
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formData.mobileNumber }),
      })

      const result = await response.json()

      if (result.success) {
        setOtpSent(true)
        setTimer(300) // Reset to 5 minutes
        setCanResend(false)
        alert(result.message)
      } else {
        alert(result.message || "Failed to send OTP")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      alert("Failed to send OTP. Please try again.")
    } finally {
      setIsLoading?.(false)
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return

    setIsLoading?.(true)
    try {
      const response = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formData.mobileNumber }),
      })

      const result = await response.json()

      if (result.success) {
        setOtp(["", "", "", "", "", ""])
        setTimer(300)
        setCanResend(false)
        alert(result.message)
      } else {
        alert(result.message || "Failed to resend OTP")
      }
    } catch (error) {
      console.error("Error resending OTP:", error)
      alert("Failed to resend OTP. Please try again.")
    } finally {
      setIsLoading?.(false)
    }
  }

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      updateFormData("otp", newOtp.join(""))

      if (value && index < 5) {
        inputRefs[index + 1].current?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleVerify = async () => {
    const otpValue = otp.join("")

    if (otpValue.length !== 6) {
      alert("Please enter the complete 6-digit OTP")
      return
    }

    setIsLoading?.(true)
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.mobileNumber,
          otp: otpValue,
          email: formData.email,
          userType: "candidate",
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Mark mobile as verified
        updateFormData("mobileVerified", true)
        alert(result.message)
        nextStep()
      } else {
        alert(result.message || "OTP verification failed")
        // Clear OTP on failure
        setOtp(["", "", "", "", "", ""])
        inputRefs[0].current?.focus()
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      alert("An error occurred during verification. Please try again.")
    } finally {
      setIsLoading?.(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Verify mobile number</h2>
      <p className="text-gray-600 mb-6">
        We just sent a text message with a 6-digit verification code to {formData.mobileNumber}
      </p>

      <div className="mb-6">
        <div className="flex gap-2 justify-center mb-4">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl border-2 border-blue-200 rounded-lg focus:border-blue-500"
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          {timer > 0 ? (
            <p className="text-sm text-gray-500">Your OTP will expire in {formatTime(timer)}</p>
          ) : (
            <p className="text-sm text-red-500">OTP has expired</p>
          )}

          {canResend ? (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-gray-400">Resend available after 30 seconds</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="rounded-full px-8 font-medium bg-transparent"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 font-medium"
        >
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </Card>
  )
}

// Renamed from Step3EmploymentCombined to Step3EmploymentAndSkills to reflect its functionality
function Step3EmploymentAndSkills({
  formData,
  updateFormData,
  nextStep,
  prevStep,
  setIsLoading,
  isLoading,
  setFormData,
}: StepProps) {
  const [isCurrentEmploymentSaved, setIsCurrentEmploymentSaved] = useState(false)
  const [isCurrentEmploymentEditable, setIsCurrentEmploymentEditable] = useState(true)

  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [skillSearch, setSkillSearch] = useState("")
  const [skillDuplicateError, setSkillDuplicateError] = useState("")
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [loadingSkills, setLoadingSkills] = useState(true)

  // State for dropdowns and search inputs related to industry, department, role, and job title
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [industrySearch, setIndustrySearch] = useState("")
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [departmentSearch, setDepartmentSearch] = useState("")

  // CHANGE Add state for departments and selected industry ID
  const [departments, setDepartments] = useState<Array<{ id: string; department_name: string }>>([])
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null)
  const [industriesData, setIndustriesData] = useState<Array<{ id: string; name: string }>>([])

  const [showRoleCategoryDropdown, setShowRoleCategoryDropdown] = useState(false)
  const [roleCategorySearch, setRoleCategorySearch] = useState("")
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false)
  const [jobTitleSearch, setJobTitleSearch] = useState("")
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [isSaving, setIsSaving] = React.useState(false) // Added for saving state
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>("") // Added for the fix
  const [showCurrentEmploymentForm, setShowCurrentEmploymentForm] = useState<boolean>(
    formData.workStatus === "experienced",
  ) // State to control the visibility of the current employment form
  const [additionalEmploymentCount, setAdditionalEmploymentCount] = useState(0)
  const [experienceInputs, setExperienceInputs] = useState<{
    [key: number]: { companyName: string; jobTitle: string; fromDate: string; toDate: string }
  }>({})
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [currentEmployment, setCurrentEmployment] = useState<EmploymentEntry>(
    formData.currentEmployment || {
      currentlyEmployed: "",
      companyName: "",
      currentJobTitle: "",
      currentCity: "",
      currentState: "",
      durationFrom: "",
      durationTo: "Present", // Set to "Present" by default
      annualSalary: "",
      noticePeriod: "",
      industry: "",
      department: "",
      roleCategory: "",
      jobRole: "",
    },
  )

  // CHANGE Fetch role categories when department changes
  const [roleCategories, setRoleCategories] = useState<Array<{ id: string; role_category_name: string }>>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)

  // Fetch skills from Supabase
  useState(() => {
    const fetchSkills = async () => {
      setLoadingSkills(true)
      const { data, error } = await getSupabase().from("skills").select("*").order("skill_name") // Corrected from supabase to getSupabase()
      if (error) {
        console.error("Error fetching skills:", error)
      } else {
        setAllSkills(data || [])
      }
      setLoadingSkills(false)
    }
    fetchSkills()
  })

  // CHANGE Fetch industries from database on component mount
  useEffect(() => {
    const fetchIndustriesFromDB = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase.from("industries").select("id, name").order("name")

        if (error) {
          console.error("[v0] Error fetching industries:", error)
          return
        }

        console.log(`[v0] Fetched ${data?.length || 0} industries from database`)
        setIndustriesData(data || [])
      } catch (error) {
        console.error("[v0] Exception fetching industries:", error)
      }
    }

    fetchIndustriesFromDB()
  }, [])

  // CHANGE Fetch departments when industry changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedIndustryId) {
        setDepartments([])
        return
      }

      console.log("[v0] Fetching departments for industry ID:", selectedIndustryId)
      const result = await getDepartmentsByIndustry(selectedIndustryId)

      if (result.success) {
        console.log("[v0] Loaded departments:", result.departments.length)
        setDepartments(result.departments)
      } else {
        console.error("[v0] Error loading departments:", result.error)
        setDepartments([])
      }
    }

    fetchDepartments()
  }, [selectedIndustryId])

  // CHANGE Fetch role categories when department changes
  useEffect(() => {
    const fetchRoleCategories = async () => {
      if (selectedDepartmentId) {
        console.log("[v0] Fetching role categories for department ID:", selectedDepartmentId)
        const result = await getRoleCategoriesByDepartment(selectedDepartmentId)
        if (result.success && result.data) {
          setRoleCategories(result.data)
          console.log("[v0] Loaded role categories:", result.data.length)
        } else {
          console.error("[v0] Failed to fetch role categories:", result.error)
          setRoleCategories([])
        }
      } else {
        setRoleCategories([])
      }
    }

    fetchRoleCategories()
  }, [selectedDepartmentId])

  const INDIAN_CITIES = [
    // Defined locally for Step3EmploymentAndSkills, used in Step5PersonalAndPreferences as well
    { city: "Mumbai", state: "Maharashtra" },
    { city: "Delhi", state: "Delhi" },
    { city: "Bangalore", state: "Karnataka" },
    { city: "Hyderabad", state: "Telangana" },
    { city: "Chennai", state: "Tamil Nadu" },
    { city: "Kolkata", state: "West Bengal" },
    { city: "Pune", state: "Maharashtra" },
    { city: "Ahmedabad", state: "Gujarat" },
    { city: "Jaipur", state: "Rajasthan" },
    { city: "Surat", state: "Gujarat" },
    { city: "Lucknow", state: "Uttar Pradesh" },
    { city: "Kanpur", state: "Uttar Pradesh" },
    { city: "Nagpur", state: "Maharashtra" },
    { city: "Indore", state: "Madhya Pradesh" },
    { city: "Thane", state: "Maharashtra" },
    { city: "Bhopal", state: "Madhya Pradesh" },
    { city: "Visakhapatnam", state: "Andhra Pradesh" },
  ]

  const getDepartments = (industry: string) => {
    return industryData[industry as keyof typeof industryData]?.departments || []
  }

  const getRoles = (industry: string, department: string) => {
    if (!industry || !department) return []
    return Object.keys(
      industryData[industry as keyof typeof industryData]?.roles[department as keyof typeof industryData.roles] || {},
    )
  }

  const getJobTitles = (industry: string, department: string, roleCategory: string) => {
    if (!industry || !department || !roleCategory) return []
    return (
      industryData[industry as keyof typeof industryData]?.roles[department as keyof typeof industryData.roles][
        roleCategory as keyof typeof industryData.roles.Engineering
      ] || []
    )
  }

  // CHANGE Update industry select handler to fetch departments
  const handleIndustrySelect = async (industryName: string, industryId: string) => {
    console.log("[v0] Selected industry:", industryName, "ID:", industryId)
    updateFormData("industry", industryName)
    setSelectedIndustryId(industryId)
    updateFormData("department", "") // Reset department when industry changes
    updateFormData("roleCategory", "") // Reset role category
    updateFormData("jobRole", "") // Reset job role
    setShowIndustryDropdown(false)
    setIndustrySearch("")
  }

  const handleDepartmentSelect = (departmentName: string) => {
    updateFormData("department", departmentName)
    updateFormData("roleCategory", "") // Reset role category
    updateFormData("jobRole", "") // Reset job role
    setShowDepartmentDropdown(false) // Close department dropdown
    setDepartmentSearch("") // Clear search
  }

  const handleRoleCategorySelect = (roleCategory: string) => {
    updateFormData("roleCategory", roleCategory)
    updateFormData("jobRole", "") // Reset job role
    setShowRoleCategoryDropdown(false) // Close role category dropdown
    setRoleCategorySearch("") // Clear search
  }

  const handleJobTitleSelect = (jobRole: string) => {
    updateFormData("jobRole", jobRole)
    setShowJobTitleDropdown(false) // Close job title dropdown
    setJobTitleSearch("") // Clear search
  }

  const handleCitySelect = (city: string, state: string) => {
    updateFormData("currentCity", city)
    updateFormData("currentState", state)
    setShowCityDropdown(false)
  }

  // CHANGE Add handler for custom department
  const addCustomDepartment = async (departmentName: string) => {
    if (!selectedIndustryId) {
      console.error("[v0] Cannot add department without selected industry")
      return
    }

    console.log("[v0] Adding custom department:", departmentName)
    const result = await saveCustomDepartment(departmentName, selectedIndustryId)

    if (result.success) {
      console.log("[v0] Custom department saved successfully")
      updateFormData("department", departmentName)
      setShowDepartmentDropdown(false)
      setDepartmentSearch("")
      // Refresh departments list
      const refreshResult = await getDepartmentsByIndustry(selectedIndustryId)
      if (refreshResult.success) {
        setDepartments(refreshResult.departments)
      }
    } else {
      console.error("[v0] Error saving custom department:", result.error)
    }
  }

  // CHANGE Add custom role category save function
  const addCustomRoleCategory = async (roleCategoryName: string) => {
    if (!selectedDepartmentId) {
      console.error("[v0] No department selected")
      return
    }

    const result = await saveCustomRoleCategory(selectedDepartmentId, roleCategoryName)
    if (result.success && result.data) {
      // Add to local state
      setRoleCategories((prev) => [...prev, result.data!])
      // Update form
      updateFormData("roleCategory", roleCategoryName)
      setRoleCategorySearch(roleCategoryName)
      setShowRoleCategoryDropdown(false)
      updateFormData("jobRole", "")
    } else {
      console.error("[v0] Failed to save custom role category:", result.error)
    }
  }

  // Calculate total experience
  const totalExperienceInMonths =
    Number.parseInt(formData.totalExperienceYears || "0") * 12 + Number.parseInt(formData.totalExperienceMonths || "0")

  const calculateYearsMonths = (totalMonths: number) => {
    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    return { years: isNaN(years) ? 0 : years, months: isNaN(months) ? 0 : months }
  }

  const handleTotalExperienceChange = (field: "years" | "months", value: string) => {
    const numericValue = Math.max(0, Number.parseInt(value.replace(/\D/g, "") || "0")) // Ensure non-negative integer

    if (field === "years") {
      const totalMonths = numericValue * 12 + Number.parseInt(formData.totalExperienceMonths || "0")
      const { years: newYears, months: newMonths } = calculateYearsMonths(totalMonths)
      updateFormData("totalExperienceYears", String(newYears))
      updateFormData("totalExperienceMonths", String(newMonths))
    } else {
      const totalMonths = Number.parseInt(formData.totalExperienceYears || "0") * 12 + numericValue
      const { years: newYears, months: newMonths } = calculateYearsMonths(totalMonths)
      updateFormData("totalExperienceYears", String(newYears))
      updateFormData("totalExperienceMonths", String(newMonths))
    }
  }

  // Focus the first input field when the component mounts
  useEffect(() => {
    // The actual first input field is now within the skills section.
    // Assigning the ref to the skills input.
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [])

  const handleInputChange = (type: "current" | "additional", index: number | null, field: string, value: string) => {
    if (type === "current") {
      // Ensure currentEmployment exists before trying to update it
      if (!formData.currentEmployment) {
        // Initialize if it's null, but this case should ideally be handled by the "Yes" button logic
        updateFormData("currentEmployment", {
          currentlyEmployed: "yes",
          companyName: "",
          currentJobTitle: "",
          currentCity: "",
          currentState: "",
          durationFrom: "",
          durationTo: "Present", // Set to "Present" by default
          annualSalary: "",
          noticePeriod: "",
          industry: "", // Reset industry
          department: "", // Reset department
          roleCategory: "", // Reset roleCategory
          jobRole: "", // Reset jobRole
          currentlyEmployed: "yes", // Explicitly set to 'yes'
        })
      }

      // Use a temporary object to hold updated currentEmployment
      const updatedCurrentEmployment = {
        ...(formData.currentEmployment || { currentlyEmployed: "yes" }), // Provide default if null
        [field]: value,
      }

      // If the field is 'currentlyEmployed', handle the transition to null if 'no' is selected
      if (field === "currentlyEmployed" && value === "no") {
        updateFormData("currentEmployment", null)
        // updateFormData("workStatus", "experienced") // This line was causing an issue if workStatus was already set to fresher
      } else {
        updateFormData("currentEmployment", updatedCurrentEmployment)
      }
    } else {
      const newAdditionalEmployment = [...formData.additionalEmployment]
      if (index !== null) {
        newAdditionalEmployment[index] = {
          ...newAdditionalEmployment[index],
          [field]: value,
        }
      } else {
        // Add new entry if index is null (e.g., adding a new job)
        if (!newAdditionalEmployment[0] || newAdditionalEmployment[0].companyName) {
          newAdditionalEmployment.push({
            companyName: "",
            jobTitle: "",
            fromDate: "", // Corresponds to durationFrom
            toDate: "", // Corresponds to durationTo
          })
        }
        // Handle updating the newly added entry
        const lastIndex = newAdditionalEmployment.length - 1
        newAdditionalEmployment[lastIndex] = {
          ...newAdditionalEmployment[lastIndex],
          [field]: value,
        }
      }
      updateFormData("additionalEmployment", newAdditionalEmployment)
    }
  }

  const addAdditionalEmployment = () => {
    updateFormData("additionalEmployment", [
      ...formData.additionalEmployment,
      { companyName: "", jobTitle: "", fromDate: "", toDate: "" },
    ])
  }

  const removeAdditionalEmployment = (index: number) => {
    updateFormData(
      "additionalEmployment",
      formData.additionalEmployment.filter((_, i) => i !== index),
    )
  }

  const handleSkillSelect = (skill: Skill) => {
    if (formData.skills.some((s) => s.toLowerCase() === skill.skill_name.toLowerCase())) {
      setSkillDuplicateError("Skill already added")
      setSkillSearch("")
      setShowSkillDropdown(false)
      return
    }
    updateFormData("skills", [...formData.skills, skill.skill_name])
    setSkillSearch("")
    setShowSkillDropdown(false)
  }

  const removeSkill = (skillToRemove: string) => {
    updateFormData(
      "skills",
      formData.skills.filter((skill) => skill !== skillToRemove),
    )
  }

  // CHANGE: Moved handleSaveAndContinue logic to this specific function
  const handleSaveAndContinue = async () => {
    // Helper function to get email from localStorage
    const getEmailFromStorage = (): string => {
      if (typeof window === "undefined") return ""
      try {
        const registrationData = localStorage.getItem("candidateRegistrationData")
        if (registrationData) {
          const parsed = JSON.JSON.parse(registrationData)
          if (parsed.email) return parsed.email
        }
      } catch (e) {
        console.error("[v0] Failed to get email from localStorage:", e)
      }
      return ""
    }

    const email = formData.email || getEmailFromStorage()

    if (!email) {
      alert("Email not found. Please start registration again.")
      setIsLoading?.(false)
      return
    }

    setIsLoading?.(true)
    console.log("[v0] Step3 saving employment data for email:", email)

    try {
      const result = await updateEmploymentDetails(email, {
        employmentHistory: formData.additionalEmployment, // Assuming this maps to previous jobs
        currentEmployment: formData.currentEmployment, // Assuming this is the current job details
        workStatus: formData.workStatus,
        totalExperienceYears: formData.totalExperienceYears,
        totalExperienceMonths: formData.totalExperienceMonths,
        // currentJobTitle: formData.currentJobTitle, // This seems redundant if currentEmployment.currentJobTitle is used
        skills: formData.skills,
        industry: formData.industry,
        department: formData.department,
        roleCategory: formData.roleCategory,
        jobRole: formData.jobRole,
      })

      if (!result.success) {
        alert(`Failed to save employment details: ${result.error}`)
        setIsLoading?.(false)
        return
      }

      console.log("[v0] Employment data saved successfully")
      nextStep()
    } catch (error) {
      console.error("[v0] Error saving employment data:", error)
      alert("An error occurred while saving your employment details")
    } finally {
      setIsLoading?.(false)
    }
  }

  const filteredIndustries = industriesData.filter((industry) =>
    industry.name.toLowerCase().includes(industrySearch.toLowerCase()),
  )

  // Placeholder data for departments, role categories, and job titles
  // In a real application, this would likely come from a backend or a more complex data structure
  const industryData = {
    "IT Services & Consulting": {
      departments: ["Engineering", "Sales", "Marketing", "HR", "Finance"],
      roles: {
        Engineering: {
          "Software Development": [
            "Frontend Developer",
            "Backend Developer",
            "Full Stack Developer",
            "DevOps Engineer",
          ],
          "Data Science": ["Data Scientist", "Data Analyst", "Machine Learning Engineer"],
          "Quality Assurance": ["QA Engineer", "Test Automation Engineer"],
        },
        Sales: {
          "Sales Operations": ["Sales Executive", "Account Manager", "Business Development Manager"],
          "Sales Management": ["Sales Manager", "Regional Sales Director"],
        },
        Marketing: {
          "Digital Marketing": ["SEO Specialist", "Content Marketer", "Social Media Manager"],
          "Product Marketing": ["Product Marketing Manager"],
        },
        HR: {
          "Talent Acquisition": ["Recruiter", "Talent Acquisition Specialist"],
          "HR Operations": ["HR Generalist", "HR Manager"],
        },
        Finance: {
          Accounting: ["Accountant", "Financial Analyst"],
          "Financial Planning": ["Finance Manager"],
        },
      },
    },
    "Software Product": {
      departments: ["Product Management", "Engineering", "Customer Success"],
      roles: {
        "Product Management": {
          "Product Strategy": ["Product Manager", "Product Owner"],
          "User Experience": ["UX Designer", "UI Designer"],
        },
        Engineering: {
          "Software Development": ["Software Engineer", "Senior Software Engineer"],
          "Quality Assurance": ["QA Tester"],
        },
        "Customer Success": {
          "Customer Support": ["Customer Support Representative", "Technical Support Engineer"],
        },
      },
    },
    Internet: {
      departments: ["Operations", "Business Development"],
      roles: {
        Operations: {
          "Platform Engineering": ["Site Reliability Engineer", "Platform Engineer"],
          "Content Moderation": ["Content Moderator"],
        },
        "Business Development": {
          Partnerships: ["Partnership Manager"],
        },
      },
    },
    "BPO / Call Centre": {
      departments: ["Customer Service", "Technical Support", "Sales", "Operations", "Quality Assurance"],
      roles: {
        "Customer Service": {
          "Voice Process": ["Customer Service Representative", "Customer Support Executive", "Call Center Agent"],
          "Non-Voice Process": ["Chat Support Executive", "Email Support Representative"],
          "Customer Relationship": ["CRM Executive", "Client Servicing Executive"],
        },
        "Technical Support": {
          "IT Support": ["Technical Support Executive", "Help Desk Support", "IT Support Specialist"],
          "Product Support": ["Technical Account Manager", "Product Support Engineer"],
        },
        Sales: {
          Telesales: ["Telesales Executive", "Inside Sales Representative", "Lead Generation Executive"],
          "Business Development": ["Business Development Executive", "Sales Coordinator"],
        },
        Operations: {
          "Process Management": ["Process Associate", "Operations Manager", "Team Leader"],
          "Workforce Management": ["Workforce Analyst", "Resource Manager"],
        },
        "Quality Assurance": {
          "Quality Audit": ["Quality Analyst", "Quality Auditor", "Quality Manager"],
          Training: ["Trainer", "Training Coordinator"],
        },
      },
    },
    // Add more industries, departments, roles, and job titles as needed
  }

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 md:p-8">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-2xl font-bold">Employment Details & Skills</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Tell us about your experience and the skills you possess.</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Skills section - NOW FIRST */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="skills" className="text-sm">
              Skills <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-500 mb-2">Select from suggestions or add your own</p>

            {/* Skill Input with Autosuggest */}
            <div className="relative max-w-md">
              <Input
                id="skills"
                type="text"
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value)
                  setShowSkillDropdown(true)
                  setSkillDuplicateError("")
                }}
                onFocus={() => setShowSkillDropdown(true)}
                onBlur={() => setTimeout(() => setShowSkillDropdown(false), 300)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const trimmedSkill = skillSearch.trim()
                    if (trimmedSkill) {
                      if (formData.skills.some((s) => s.toLowerCase() === trimmedSkill.toLowerCase())) {
                        setSkillDuplicateError("Skill already added")
                        return
                      }
                      updateFormData("skills", [...formData.skills, trimmedSkill])
                    }
                    setSkillSearch("")
                    setShowSkillDropdown(false)
                  }
                }}
                placeholder="Type to search or add custom skill"
                className="mt-1 h-10 rounded-full"
                ref={firstInputRef}
              />
              {skillDuplicateError && <p className="text-red-600 text-sm mt-1 font-medium">{skillDuplicateError}</p>}
              {showSkillDropdown && skillSearch.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingSkills ? (
                    <div className="px-4 py-2 text-gray-500">Loading skills...</div>
                  ) : allSkills.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">
                      No matching skills. Press Enter to add "{skillSearch}"
                    </div>
                  ) : (
                    <>
                      {allSkills
                        .filter((skill) => skill.skill_name.toLowerCase().includes(skillSearch.toLowerCase()))
                        .map((skill) => (
                          <div
                            key={skill.id}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                            onClick={() => handleSkillSelect(skill)}
                          >
                            <span>{skill.skill_name}</span>
                            <span className="text-xs text-gray-500">{skill.category}</span>
                          </div>
                        ))}
                      {skillSearch.trim() && (
                        <div
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-t text-blue-600"
                          onClick={() => {
                            const trimmedSkill = skillSearch.trim()
                            if (formData.skills.some((s) => s.toLowerCase() === trimmedSkill.toLowerCase())) {
                              setSkillDuplicateError("Skill already added")
                              setSkillSearch("")
                              setShowSkillDropdown(false)
                              return
                            }
                            updateFormData("skills", [...formData.skills, trimmedSkill])
                            setSkillSearch("")
                            setShowSkillDropdown(false)
                          }}
                        >
                          + Add "{skillSearch.trim()}" as custom skill
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Selected Skills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-blue-600 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Related Skills based on first selected skill */}
            {formData.skills.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Related skills you might know:</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const firstSkill = formData.skills[0].toLowerCase()
                    let relatedSkills: string[] = []

                    // Define related skill groups
                    if (["javascript", "js"].some((s) => firstSkill.includes(s))) {
                      relatedSkills = ["React", "Node.js", "TypeScript", "Vue.js", "Angular"]
                    } else if (firstSkill.includes("python")) {
                      relatedSkills = ["Django", "Flask", "Data Analysis", "Machine Learning", "Pandas"]
                    } else if (firstSkill.includes("java")) {
                      relatedSkills = ["Spring Boot", "Hibernate", "Maven", "Microservices"]
                    } else if (firstSkill.includes("react")) {
                      relatedSkills = ["JavaScript", "Redux", "Next.js", "React Native", "TypeScript"]
                    } else if (firstSkill.includes("node")) {
                      relatedSkills = ["Express.js", "MongoDB", "REST API", "Socket.io"]
                    } else if (firstSkill.includes("sql") || firstSkill.includes("database")) {
                      relatedSkills = ["MySQL", "PostgreSQL", "MongoDB", "Database Design"]
                    } else if (firstSkill.includes("aws") || firstSkill.includes("cloud")) {
                      relatedSkills = ["Docker", "Kubernetes", "Azure", "DevOps", "CI/CD"]
                    } else {
                      relatedSkills = ["Communication", "Team Collaboration", "Problem Solving", "Leadership"]
                    }

                    return relatedSkills
                      .filter((skill) => !formData.skills.includes(skill))
                      .slice(0, 5)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            if (!formData.skills.includes(skill)) {
                              updateFormData("skills", [...formData.skills, skill])
                            }
                          }}
                          className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          + {skill}
                        </button>
                      ))
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employment History</h3>

            {/* Are you currently employed question */}
            <div>
              <Label className="text-sm mb-3 block">
                Are you currently employed?<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.currentEmployment !== null ? "default" : "outline"}
                  onClick={() => {
                    updateFormData("currentEmployment", {
                      currentlyEmployed: "yes",
                      companyName: formData.currentEmployment?.companyName || "",
                      currentJobTitle: formData.currentEmployment?.currentJobTitle || "",
                      currentCity: formData.currentEmployment?.currentCity || "",
                      currentState: formData.currentEmployment?.currentState || "",
                      durationFrom: formData.currentEmployment?.durationFrom || "",
                      durationTo: "Present", // Always set to "Present" when Yes is clicked
                      annualSalary: formData.currentEmployment?.annualSalary || "",
                      noticePeriod: formData.currentEmployment?.noticePeriod || "",
                      industry: formData.currentEmployment?.industry || "",
                      department: formData.currentEmployment?.department || "",
                      roleCategory: formData.currentEmployment?.roleCategory || "",
                      jobRole: formData.currentEmployment?.jobRole || "",
                      currentlyEmployed: "yes",
                    })
                  }}
                  className="rounded-full"
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={
                    formData.currentEmployment === null && formData.workStatus === "experienced" ? "default" : "outline"
                  }
                  onClick={() => {
                    updateFormData("currentEmployment", null)
                    // updateFormData("workStatus", "experienced") // This line was causing an issue if workStatus was already set to fresher
                  }}
                  className="rounded-full"
                >
                  No
                </Button>
              </div>
            </div>

            {/* Current Employment Form - Conditionally rendered */}
            {formData.currentEmployment !== null && (
              <div className="space-y-4 mt-4 border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                {isCurrentEmploymentSaved && !isCurrentEmploymentEditable && (
                  <div className="flex justify-between items-center mb-4 pb-3 border-b">
                    <h3 className="font-semibold text-lg">Current Employment</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCurrentEmploymentEditable(true)}
                      className="h-8 px-4 rounded-full"
                    >
                      Edit
                    </Button>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentCompanyName">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="currentCompanyName"
                      type="text"
                      value={formData.currentEmployment?.companyName || ""}
                      onChange={(e) => handleInputChange("current", null, "companyName", e.target.value)}
                      placeholder="Enter company name"
                      className="rounded-full h-10"
                      disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentJobTitle">
                      Current Job Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="currentJobTitle"
                      type="text"
                      value={formData.currentEmployment?.currentJobTitle || ""}
                      onChange={(e) => handleInputChange("current", null, "currentJobTitle", e.target.value)}
                      placeholder="Enter job title"
                      className="rounded-full h-10"
                      disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="currentCity">
                      Current City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="currentCity"
                      type="text"
                      value={formData.currentEmployment?.currentCity || ""}
                      onChange={(e) => {
                        handleInputChange("current", null, "currentCity", e.target.value)
                        setShowCityDropdown(e.target.value.length > 0)
                      }}
                      onFocus={() => setShowCityDropdown(formData.currentEmployment?.currentCity?.length > 0)}
                      onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                      placeholder="Enter city"
                      className="rounded-full h-10"
                      disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                    />
                    {showCityDropdown && formData.currentEmployment?.currentCity && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {INDIAN_CITIES.filter(
                          (
                            loc, // Use the locally defined INDIAN_CITIES
                          ) =>
                            loc.city
                              .toLowerCase()
                              .includes((formData.currentEmployment?.currentCity || "").toLowerCase()),
                        ).map((loc) => (
                          <div
                            key={`${loc.city}-${loc.state}`}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleCitySelect(loc.city, loc.state)}
                          >
                            {loc.city}, {loc.state}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentState">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="currentState"
                      type="text"
                      value={formData.currentEmployment?.currentState || ""}
                      onChange={(e) => handleInputChange("current", null, "currentState", e.target.value)}
                      placeholder="Enter state"
                      className="rounded-full h-10"
                      disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="noticePeriod">
                      Notice Period <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="noticePeriod"
                      value={formData.currentEmployment?.noticePeriod || ""}
                      onChange={(e) => handleInputChange("current", null, "noticePeriod", e.target.value)}
                      className="flex h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                      disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                    >
                      <option value="">Select notice period</option>
                      {NOTICE_PERIOD_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualSalary">Annual Salary (INR)</Label>
                    <Input
                      id="annualSalary"
                      type="text"
                      value={formData.currentEmployment?.annualSalary || ""}
                      onChange={(e) =>
                        handleInputChange("current", null, "annualSalary", formatIndianNumber(e.target.value))
                      }
                      placeholder="e.g., 5,00,000"
                      className="rounded-full h-10"
                      disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="durationFrom">
                      Duration From <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="durationFrom"
                      type="month"
                      value={formData.currentEmployment?.durationFrom || ""}
                      onChange={(e) => {
                        handleInputChange("current", null, "durationFrom", e.target.value)
                        calculateTotalExperienceFromEmployment(formData, updateFormData)
                      }}
                      placeholder="YYYY/MM"
                      className="rounded-full h-10"
                      disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="durationTo">Duration To</Label>
                    <Input
                      id="durationTo"
                      type="month"
                      value={
                        formData.currentEmployment?.durationTo === "Present"
                          ? ""
                          : formData.currentEmployment?.durationTo || ""
                      }
                      onChange={(e) => {
                        handleInputChange("current", null, "durationTo", e.target.value)
                        calculateTotalExperienceFromEmployment(formData, updateFormData)
                      }}
                      disabled={
                        formData.currentEmployment?.durationTo === "Present" ||
                        (isCurrentEmploymentSaved && !isCurrentEmploymentEditable)
                      }
                      placeholder={formData.currentEmployment?.durationTo === "Present" ? "Present" : "YYYY/MM"}
                      className="rounded-full h-10"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="currentlyWorking"
                        checked={formData.currentEmployment?.durationTo === "Present"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange("current", null, "durationTo", "Present")
                          } else {
                            handleInputChange("current", null, "durationTo", "")
                          }
                          calculateTotalExperienceFromEmployment(formData, updateFormData)
                        }}
                        className="rounded"
                        disabled={isCurrentEmploymentSaved && !isCurrentEmploymentEditable}
                      />
                      <label htmlFor="currentlyWorking" className="text-sm text-gray-600">
                        I currently work here
                      </label>
                    </div>
                  </div>
                </div>

                {isCurrentEmploymentEditable && (
                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        console.log("[v0] Saving current employment to UI")
                        setIsCurrentEmploymentSaved(true)
                        setIsCurrentEmploymentEditable(false)
                        calculateTotalExperienceFromEmployment(formData, updateFormData)
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 h-10"
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
            )}

            {formData.workStatus === "experienced" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Previous Employment History</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdditionalEmployment}
                    className="h-8 px-3 rounded-full text-xs bg-transparent"
                  >
                    + Add
                  </Button>
                </div>
                {formData.additionalEmployment.map((job, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Company Name */}
                      <div>
                        <Label htmlFor={`additionalCompanyName-${index}`} className="text-xs">
                          Company Name
                        </Label>
                        <Input
                          id={`additionalCompanyName-${index}`}
                          type="text"
                          value={job.companyName}
                          onChange={(e) => handleInputChange("additional", index, "companyName", e.target.value)}
                          placeholder="Company Name"
                          className="mt-1 h-9 rounded-full"
                        />
                      </div>
                      {/* Job Title */}
                      <div>
                        <Label htmlFor={`additionalJobTitle-${index}`} className="text-xs">
                          Job Title
                        </Label>
                        <Input
                          id={`additionalJobTitle-${index}`}
                          type="text"
                          value={job.jobTitle}
                          onChange={(e) => handleInputChange("additional", index, "jobTitle", e.target.value)}
                          placeholder="Job Title"
                          className="mt-1 h-9 rounded-full"
                        />
                      </div>
                      {/* From Date */}
                      <div>
                        <Label htmlFor={`additionalFrom-${index}`} className="text-xs">
                          From (MM/YY)
                        </Label>
                        <Input
                          id={`additionalFrom-${index}`}
                          type="month"
                          value={job.fromDate || ""}
                          onChange={(e) => {
                            handleInputChange("additional", index, "fromDate", e.target.value)
                            calculateTotalExperienceFromEmployment(formData, updateFormData)
                          }}
                          placeholder="YYYY-MM"
                          className="rounded-full h-10"
                        />
                      </div>

                      {/* To Date */}
                      <div>
                        <Label htmlFor={`additionalTo-${index}`} className="text-xs">
                          To (MM/YY)
                        </Label>
                        <Input
                          id={`additionalTo-${index}`}
                          type="month"
                          value={job.toDate || ""}
                          onChange={(e) => {
                            handleInputChange("additional", index, "toDate", e.target.value)
                            calculateTotalExperienceFromEmployment(formData, updateFormData)
                          }}
                          placeholder="YYYY-MM"
                          className="rounded-full h-10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        type="button"
                        onClick={() => {
                          // Save this employment entry (mark as saved in state if needed)
                          calculateTotalExperienceFromEmployment(formData, updateFormData)
                          console.log(`[v0] Saved previous employment ${index + 1}`)
                        }}
                        className="rounded-full text-xs h-8 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdditionalEmployment(index)}
                        className="rounded-full text-xs h-8 px-4"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalExperienceYears" className="text-sm">
                  Years of Experience <span className="text-red-500">*</span>
                </Label>
                <select
                  id="totalExperienceYears"
                  value={formData.totalExperienceYears}
                  onChange={(e) => handleTotalExperienceChange("years", e.target.value)}
                  className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="0">0 Years</option>
                  {Array.from({ length: 51 }, (_, i) => i).map((year) => (
                    <option key={year} value={year}>
                      {year} {year === 1 ? "Year" : "Years"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="totalExperienceMonths" className="text-sm">
                  Months
                </Label>
                <select
                  id="totalExperienceMonths"
                  value={formData.totalExperienceMonths}
                  onChange={(e) => handleTotalExperienceChange("months", e.target.value)}
                  className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                    <option key={month} value={month}>
                      {month} {month === 1 ? "Month" : "Months"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Industry Field - Autosuggest */}
              <div className="max-w-md relative">
                <Label htmlFor="industry" className="text-sm">
                  Industry you work in <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="industry"
                  type="text"
                  value={formData.industry}
                  onChange={(e) => {
                    updateFormData("industry", e.target.value)
                    setIndustrySearch(e.target.value)
                    setShowIndustryDropdown(e.target.value.length > 0)
                    updateFormData("department", "")
                    updateFormData("roleCategory", "")
                    updateFormData("jobRole", "")
                    setSelectedIndustryId(null)
                  }}
                  onFocus={() => setShowIndustryDropdown(formData.industry.length > 0 || industrySearch.length > 0)}
                  onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
                  placeholder="Type to search industries"
                  className="mt-1 h-10 rounded-full"
                />
                {/* CHANGE Updated dropdown to use database industries */}
                {showIndustryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {industriesData
                      .filter((ind) =>
                        ind.name.toLowerCase().includes((industrySearch || formData.industry).toLowerCase()),
                      )
                      .map((ind) => (
                        <div
                          key={ind.id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleIndustrySelect(ind.name, ind.id)}
                        >
                          {ind.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Department - Shows after Industry is selected */}
              {formData.industry && (
                <div className="max-w-md relative">
                  <Label htmlFor="department" className="text-sm">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => {
                      updateFormData("department", e.target.value)
                      setDepartmentSearch(e.target.value)
                      setShowDepartmentDropdown(true)
                      updateFormData("roleCategory", "")
                      updateFormData("jobRole", "")
                    }}
                    onFocus={() => {
                      setDepartmentSearch(formData.department)
                      setShowDepartmentDropdown(true)
                    }}
                    onBlur={() => setTimeout(() => setShowDepartmentDropdown(false), 300)}
                    placeholder="Type to search or add custom department"
                    className="mt-1 h-10 rounded-full"
                  />
                  {/* CHANGE Updated dropdown to use database departments */}
                  {showDepartmentDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {departments
                        .filter((dept) =>
                          dept.department_name
                            .toLowerCase()
                            .includes((departmentSearch || formData.department).toLowerCase()),
                        )
                        .map((dept) => (
                          <div
                            key={dept.id}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              updateFormData("department", dept.department_name)
                              setDepartmentSearch(dept.department_name)
                              setShowDepartmentDropdown(false)
                              setSelectedDepartmentId(dept.id)
                              updateFormData("roleCategory", "")
                              updateFormData("jobRole", "")
                            }}
                          >
                            {dept.department_name}
                          </div>
                        ))}
                      {/* CHANGE Add custom department option */}
                      {departmentSearch &&
                        !departments.some(
                          (d) => d.department_name.toLowerCase() === departmentSearch.toLowerCase(),
                        ) && (
                          <div
                            className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-blue-600 border-t"
                            onClick={() => addCustomDepartment(departmentSearch)}
                          >
                            + Add "{departmentSearch}" as custom department
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {formData.department && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* Role Category - Only shows after Department is selected */}
              <div className="max-w-md relative">
                <Label htmlFor="roleCategory" className="text-sm">
                  Role Category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roleCategory"
                  type="text"
                  value={formData.roleCategory}
                  onChange={(e) => {
                    updateFormData("roleCategory", e.target.value)
                    setRoleCategorySearch(e.target.value)
                    setShowRoleCategoryDropdown(e.target.value.length > 0)
                    updateFormData("jobRole", "")
                  }}
                  onFocus={() => {
                    setRoleCategorySearch(formData.roleCategory)
                    setShowRoleCategoryDropdown(true)
                  }}
                  onBlur={() => setTimeout(() => setShowRoleCategoryDropdown(false), 300)}
                  placeholder="Type to search or add custom role category"
                  className="mt-1 h-10 rounded-full"
                />
                {showRoleCategoryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {roleCategories
                      .filter((role) =>
                        role.role_category_name
                          .toLowerCase()
                          .includes((roleCategorySearch || formData.roleCategory).toLowerCase()),
                      )
                      .map((role) => (
                        <div
                          key={role.id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            updateFormData("roleCategory", role.role_category_name)
                            setRoleCategorySearch(role.role_category_name)
                            setShowRoleCategoryDropdown(false)
                            updateFormData("jobRole", "")
                          }}
                        >
                          {role.role_category_name}
                        </div>
                      ))}
                    {roleCategorySearch &&
                      !roleCategories.some(
                        (role) => role.role_category_name.toLowerCase() === roleCategorySearch.toLowerCase(),
                      ) && (
                        <div
                          className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-blue-600 border-t"
                          onClick={() => addCustomRoleCategory(roleCategorySearch)}
                        >
                          + Add "{roleCategorySearch}" as custom role category
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Job Title - Only shows after Role Category is selected */}
              {formData.roleCategory && (
                <div className="max-w-md relative">
                  <Label htmlFor="jobRole" className="text-sm">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobRole"
                    type="text"
                    value={formData.jobRole}
                    onChange={(e) => {
                      updateFormData("jobRole", e.target.value)
                      setJobTitleSearch(e.target.value)
                      setShowJobTitleDropdown(e.target.value.length > 0)
                    }}
                    onFocus={() => {
                      setJobTitleSearch(formData.jobRole)
                      setShowJobTitleDropdown(true)
                    }}
                    onBlur={() => setTimeout(() => setShowJobTitleDropdown(false), 300)}
                    placeholder="Type to search or add custom job title"
                    className="mt-1 h-10 rounded-full"
                  />
                  {showJobTitleDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getJobTitles(formData.industry, formData.department, formData.roleCategory)
                        .filter((title) =>
                          title.toLowerCase().includes((jobTitleSearch || formData.jobRole).toLowerCase()),
                        )
                        .map((title) => (
                          <div
                            key={title}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              updateFormData("jobRole", title)
                              setJobTitleSearch(title)
                              setShowJobTitleDropdown(false)
                            }}
                          >
                            {title}
                          </div>
                        ))}
                      {formData.jobRole.trim() &&
                        !getJobTitles(formData.industry, formData.department, formData.roleCategory).some(
                          (title) => title.toLowerCase() === formData.jobRole.toLowerCase(),
                        ) && (
                          <div
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-t text-blue-600"
                            onClick={() => {
                              setShowJobTitleDropdown(false)
                            }}
                          >
                            + Add "{formData.jobRole.trim()}" as custom job title
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={prevStep} className="rounded-full px-8 bg-transparent">
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSaveAndContinue}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8"
        >
          {isLoading ? "Saving..." : "Save & Continue"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const Step4EducationAndProjects = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
  setIsLoading,
  isLoading,
  setFormData,
}: StepProps) => {
  const [availableCourses, setAvailableCourses] = useState<Array<{ id: string; education_name: string }>>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)

  const [availableSpecializations, setAvailableSpecializations] = useState<
    Array<{ id: string; specialization_name: string; description?: string }>
  >([])
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(false)
  const [selectedEducationId, setSelectedEducationId] = useState<string>("")

  useEffect(() => {
    const fetchCourses = async () => {
      if (!formData.highestQualification) {
        setAvailableCourses([])
        return
      }

      setIsLoadingCourses(true)
      const result = await getEducationsByLevel(formData.highestQualification)

      if (result.success && result.educations) {
        setAvailableCourses(result.educations)
      } else {
        console.error("[v0] Error fetching courses:", result.error)
        setAvailableCourses([])
      }
      setIsLoadingCourses(false)
    }

    fetchCourses()
  }, [formData.highestQualification])

  useEffect(() => {
    const fetchSpecializations = async () => {
      if (!selectedEducationId) {
        setAvailableSpecializations([])
        return
      }

      console.log("[v0] Fetching specializations for education ID:", selectedEducationId)
      setIsLoadingSpecializations(true)
      const result = await getSpecializationsByEducation(selectedEducationId)

      if (result.success && result.specializations) {
        setAvailableSpecializations(result.specializations)
        console.log("[v0] Loaded specializations:", result.specializations.length)
      } else {
        console.error("[v0] Error fetching specializations:", result.error)
        setAvailableSpecializations([])
      }
      setIsLoadingSpecializations(false)
    }

    fetchSpecializations()
  }, [selectedEducationId])

  const [institutionInput, setInstitutionInput] = useState("")
  const [institutionSuggestions, setInstitutionSuggestions] = useState<any[]>([])
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false)
  const [loadingInstitutions, setLoadingInstitutions] = useState(false)

  const [certInputs, setCertInputs] = useState<{
    [key: number]: { name: string; issuer: string }
  }>(() => {
    const initial: { [key: number]: { name: string; issuer: string } } = {}
    ;(formData.certifications || []).forEach((cert, index) => {
      initial[index] = { name: cert.name || "", issuer: cert.issuer || "" }
    })
    return initial
  })

  const [projectInputs, setProjectInputs] = useState<{
    [key: number]: { title: string; role: string; description: string; technologies: string }
  }>(() => {
    const initial: { [key: number]: { title: string; role: string; description: string; technologies: string } } = {}
    ;(formData.projects || []).forEach((proj, index) => {
      initial[index] = {
        title: proj.title || "",
        role: proj.role || "",
        description: proj.description || "",
        technologies: proj.technologies || "",
      }
    })
    return initial
  })

  const fetchInstitutionSuggestions = async (query: string) => {
    if (query.length < 2) {
      setInstitutionSuggestions([])
      return
    }

    setLoadingInstitutions(true)
    const result = await fetchInstitutions(query)

    if (result.success) {
      setInstitutionSuggestions(result.data)
    }
    setLoadingInstitutions(false)
  }

  const selectInstitution = (institutionName: string) => {
    setFormData({ ...formData, university: institutionName })
    setInstitutionInput("")
    setShowInstitutionDropdown(false)
    setInstitutionSuggestions([])
  }

  const addCustomInstitution = async () => {
    if (institutionInput.trim()) {
      console.log("[v0] Adding custom institution:", institutionInput.trim())

      // Save to database first
      const result = await saveCustomInstitution(institutionInput.trim())

      if (result.success) {
        if (result.alreadyExists) {
          console.log("[v0] Institution already exists in database")
        } else {
          console.log("[v0] New institution added to database successfully")
        }

        // Update form data with the institution name
        setFormData({ ...formData, university: institutionInput.trim() })
        setInstitutionInput("")
        setShowInstitutionDropdown(false)
        setInstitutionSuggestions([])
      } else {
        console.error("[v0] Failed to save institution:", result.error)
        alert("Failed to save institution. Please try again.")
      }
    }
  }

  const addCertification = () => {
    const certs = formData.certifications || []
    const newIndex = certs.length
    updateFormData("certifications", [...certs, { name: "", issuer: "", issueDate: "", expiryDate: "" }])
    setCertInputs({ ...certInputs, [newIndex]: { name: "", issuer: "" } })
  }

  const addProject = () => {
    const projects = formData.projects || []
    const newIndex = projects.length
    updateFormData("projects", [
      ...projects,
      { title: "", description: "", role: "", startDate: "", endDate: "", technologies: "" },
    ])
    setProjectInputs({
      ...projectInputs,
      [newIndex]: { title: "", role: "", description: "", technologies: "" },
    })
  }

  // Handle saving education details
  const handleSaveAndContinue = async () => {
    if (isLoading) return

    setIsLoading?.(true)
    console.log("[v0] Step4 saving education data...")

    try {
      const result = await updateEducationDetails(formData.email, {
        highestQualification: formData.highestQualification,
        course: formData.course,
        courseType: formData.courseType || "",
        specialization: formData.specialization,
        university: formData.university,
        passingYearFrom: formData.passingYearFrom,
        passingYearTo: formData.passingYearTo,
        certifications: formData.certifications || [],
        projects: formData.projects || [],
      })

      if (!result.success) {
        alert(`Failed to save education details: ${result.error}`)
        setIsLoading?.(false)
        return
      }

      console.log("[v0] Education data saved successfully")
      nextStep() // Proceed to the next step
    } catch (error) {
      console.error("[v0] Error saving education data:", error)
      alert("An error occurred while saving your education details")
    } finally {
      setIsLoading?.(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg p-6 md:p-8">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold">Education Details</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Share your educational background and achievements.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Education Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qualification" className="text-sm">
                Highest Qualification <span className="text-red-500">*</span>
              </Label>
              <select
                id="qualification"
                value={formData.highestQualification || ""}
                onChange={(e) => {
                  const qual = e.target.value
                  setFormData({
                    ...formData,
                    highestQualification: qual,
                    course: "",
                    courseType: "",
                    specialization: "",
                  })
                }}
                className="mt-1 w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select qualification</option>
                <option value="10th">10th</option>
                <option value="12th">12th</option>
                <option value="Diploma">Diploma</option>
                <option value="Graduation/Diploma">Any Graduated</option>
                <option value="Post Graduation/Masters">Post Graduation/Masters</option>
                <option value="Doctorate/PhD">Doctorate/PhD</option>
              </select>
            </div>

            {formData.highestQualification && formData.highestQualification !== "10th" && (
              <div>
                <Label htmlFor="course" className="text-sm font-medium">
                  Course / Degree name <span className="text-red-500">*</span>
                </Label>
                <select
                  id="course"
                  value={formData.course || ""}
                  onChange={(e) => {
                    const selectedCourseName = e.target.value
                    const selectedCourse = availableCourses.find((c) => c.education_name === selectedCourseName)

                    setFormData({
                      ...formData,
                      course: selectedCourseName,
                      specialization: "", // Reset specialization when course changes
                    })

                    if (selectedCourse) {
                      setSelectedEducationId(selectedCourse.id)
                      console.log("[v0] Selected course:", selectedCourseName, "ID:", selectedCourse.id)
                    }
                  }}
                  className="mt-1 w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={isLoadingCourses}
                >
                  <option value="">{isLoadingCourses ? "Loading courses..." : "Select course"}</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.education_name}>
                      {course.education_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.highestQualification && formData.course && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courseType" className="text-sm font-medium">
                  Degree Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="courseType"
                  value={formData.courseType || ""}
                  onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                  className="mt-1 w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select course type</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Distance Learning">Distance Learning</option>
                  <option value="Online">Online</option>
                  <option value="Correspondence">Correspondence</option>
                </select>
              </div>

              {formData.highestQualification !== "10th" && formData.highestQualification !== "12th" && (
                <div>
                  <Label htmlFor="specialization" className="text-sm font-medium">
                    Specialization <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="specialization"
                    value={formData.specialization || ""}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="mt-1 w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={isLoadingSpecializations || !formData.course}
                  >
                    <option value="">
                      {isLoadingSpecializations
                        ? "Loading specializations..."
                        : formData.course
                          ? "Select specialization"
                          : "Select a course first"}
                    </option>
                    {availableSpecializations.map((spec) => (
                      <option key={spec.id} value={spec.specialization_name}>
                        {spec.specialization_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Replace the university input field with autocomplete dropdown */}
          {formData.highestQualification && formData.course && (
            <div className="relative">
              <Label htmlFor="university" className="text-sm font-medium">
                University/Institution <span className="text-red-500">*</span>
              </Label>

              {formData.university ? (
                // Display selected institution with option to change
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-10 px-4 rounded-full border border-gray-300 bg-gray-50 flex items-center">
                    <span className="text-sm">{formData.university}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, university: "" })
                      setInstitutionInput("")
                    }}
                    className="rounded-full"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    id="university"
                    type="text"
                    value={institutionInput}
                    onChange={(e) => {
                      setInstitutionInput(e.target.value)
                      fetchInstitutionSuggestions(e.target.value)
                    }}
                    onFocus={() => {
                      setShowInstitutionDropdown(true)
                      if (institutionInput.length >= 2) {
                        fetchInstitutionSuggestions(institutionInput)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowInstitutionDropdown(false), 200)
                    }}
                    placeholder="Type to search institution..."
                    className="mt-1 h-10 rounded-full"
                    required
                  />

                  {showInstitutionDropdown && institutionInput.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingInstitutions ? (
                        <div className="p-3 text-sm text-gray-500">Loading institutions...</div>
                      ) : institutionSuggestions.length > 0 ? (
                        <>
                          {institutionSuggestions.map((inst) => (
                            <button
                              key={inst.id}
                              type="button"
                              onClick={() => selectInstitution(inst.institute_name)}
                              className="w-full text-left px-4 py-2 hover:bg-purple-50 focus:bg-purple-50 transition-colors"
                            >
                              <div className="text-sm font-medium text-gray-900">{inst.institute_name}</div>
                              {inst.state && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {inst.state}
                                  {inst.district ? `, ${inst.district}` : ""}
                                </div>
                              )}
                            </button>
                          ))}

                          {/* Add custom institution option */}
                          <button
                            type="button"
                            onClick={addCustomInstitution}
                            className="w-full text-left px-4 py-2 border-t border-gray-200 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            + Add "{institutionInput}" as custom institution
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={addCustomInstitution}
                          className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          + Add "{institutionInput}" as custom institution
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passingYearFrom" className="text-sm font-medium">
                Year From <span className="text-red-500">*</span>
              </Label>
              <select
                id="passingYearFrom"
                value={formData.passingYearFrom || ""}
                onChange={(e) => setFormData({ ...formData, passingYearFrom: e.target.value })}
                className="mt-1 w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select year</option>
                {Array.from({ length: 51 }, (_, i) => 2030 - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="passingYearTo" className="text-sm font-medium">
                Year To <span className="text-red-500">*</span>
              </Label>
              <select
                id="passingYearTo"
                value={formData.passingYearTo || ""}
                onChange={(e) => setFormData({ ...formData, passingYearTo: e.target.value })}
                className="mt-1 w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select year</option>
                {Array.from({ length: 51 }, (_, i) => 2030 - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Certifications (Optional)</h3>
              <p className="text-sm text-muted-foreground">Add any relevant certifications you've earned</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCertification}
              className="rounded-full bg-transparent"
            >
              + Add Certification
            </Button>
          </div>

          {formData.certifications && formData.certifications.length > 0 && (
            <div className="space-y-4">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm">Certification Name</Label>
                      <Input
                        value={certInputs[index]?.name || ""}
                        onChange={(e) => {
                          setCertInputs({
                            ...certInputs,
                            [index]: { ...certInputs[index], name: e.target.value },
                          })
                        }}
                        onBlur={(e) => {
                          const certs = [...(formData.certifications || [])]
                          certs[index].name = e.target.value
                          updateFormData("certifications", certs)
                        }}
                        placeholder="e.g., AWS Certified Solutions Architect"
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Issuing Organization</Label>
                      <Input
                        value={certInputs[index]?.issuer || ""}
                        onChange={(e) => {
                          setCertInputs({
                            ...certInputs,
                            [index]: { ...certInputs[index], issuer: e.target.value },
                          })
                        }}
                        onBlur={(e) => {
                          const certs = [...(formData.certifications || [])]
                          certs[index].issuer = e.target.value
                          updateFormData("certifications", certs)
                        }}
                        placeholder="e.g., Amazon Web Services"
                        className="rounded-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm">Issue Date</Label>
                      <Input
                        type="month"
                        value={cert.issueDate}
                        onChange={(e) => {
                          const certs = [...(formData.certifications || [])]
                          certs[index].issueDate = e.target.value
                          updateFormData("certifications", certs)
                        }}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Expiry Date (Optional)</Label>
                      <Input
                        type="month"
                        value={cert.expiryDate || ""}
                        onChange={(e) => {
                          const certs = [...(formData.certifications || [])]
                          certs[index].expiryDate = e.target.value
                          updateFormData("certifications", certs)
                        }}
                        className="rounded-full"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const certs = formData.certifications?.filter((_, i) => i !== index) || []
                      const newInputs = { ...certInputs }
                      delete newInputs[index]
                      // Re-index remaining inputs
                      const reindexed: { [key: number]: { name: string; issuer: string } } = {}
                      Object.keys(newInputs).forEach((key) => {
                        const oldIndex = Number.parseInt(key)
                        const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex
                        reindexed[newIndex] = newInputs[oldIndex]
                      })
                      setCertInputs(reindexed)
                      updateFormData("certifications", certs)
                    }}
                    className="rounded-full h-8 px-3 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-8 mt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Projects</h3>
              <p className="text-sm text-muted-foreground">Detail any significant projects you've worked on</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProject}
              className="rounded-full bg-transparent"
            >
              + Add Project
            </Button>
          </div>

          {formData.projects && formData.projects.length > 0 && (
            <div className="space-y-4">
              {formData.projects.map((project, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`projectTitle-${index}`} className="text-sm">
                        Project Title
                      </Label>
                      <Input
                        id={`projectTitle-${index}`}
                        value={projectInputs[index]?.title || ""}
                        onChange={(e) => {
                          setProjectInputs({
                            ...projectInputs,
                            [index]: { ...projectInputs[index], title: e.target.value },
                          })
                        }}
                        onBlur={(e) => {
                          const updatedProjects = [...formData.projects]
                          updatedProjects[index] = { ...updatedProjects[index], title: e.target.value }
                          updateFormData("projects", updatedProjects)
                        }}
                        placeholder="e.g., E-commerce Platform"
                        className="mt-1 h-10 rounded-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`projectRole-${index}`} className="text-sm">
                        Your Role
                      </Label>
                      <Input
                        id={`projectRole-${index}`}
                        value={projectInputs[index]?.role || ""}
                        onChange={(e) => {
                          setProjectInputs({
                            ...projectInputs,
                            [index]: { ...projectInputs[index], role: e.target.value },
                          })
                        }}
                        onBlur={(e) => {
                          const updatedProjects = [...formData.projects]
                          updatedProjects[index] = { ...updatedProjects[index], role: e.target.value }
                          updateFormData("projects", updatedProjects)
                        }}
                        placeholder="e.g., Lead Developer"
                        className="mt-1 h-10 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm">Start Date</Label>
                      <Input
                        type="month"
                        value={project.startDate}
                        onChange={(e) => {
                          const projects = [...(formData.projects || [])]
                          projects[index].startDate = e.target.value
                          updateFormData("projects", projects)
                        }}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">End Date (Optional)</Label>
                      <Input
                        type="month"
                        value={project.endDate || ""}
                        onChange={(e) => {
                          const projects = [...(formData.projects || [])]
                          projects[index].endDate = e.target.value
                          updateFormData("projects", projects)
                        }}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label htmlFor={`projectDescription-${index}`} className="text-sm">
                      Description
                    </Label>
                    <Input
                      id={`projectDescription-${index}`}
                      value={projectInputs[index]?.description || ""}
                      onChange={(e) => {
                        setProjectInputs({
                          ...projectInputs,
                          [index]: { ...projectInputs[index], description: e.target.value },
                        })
                      }}
                      onBlur={(e) => {
                        const updatedProjects = [...formData.projects]
                        updatedProjects[index] = { ...updatedProjects[index], description: e.target.value }
                        updateFormData("projects", updatedProjects)
                      }}
                      placeholder="Briefly describe the project and your contributions"
                      className="mt-1 h-10 rounded-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`projectTechnologies-${index}`} className="text-sm">
                      Technologies Used
                    </Label>
                    <Input
                      id={`projectTechnologies-${index}`}
                      value={projectInputs[index]?.technologies || ""}
                      onChange={(e) => {
                        setProjectInputs({
                          ...projectInputs,
                          [index]: { ...projectInputs[index], technologies: e.target.value },
                        })
                      }}
                      onBlur={(e) => {
                        const updatedProjects = [...formData.projects]
                        updatedProjects[index] = { ...updatedProjects[index], technologies: e.target.value }
                        updateFormData("projects", updatedProjects)
                      }}
                      placeholder="e.g., React, Node.js, MongoDB, AWS"
                      className="mt-1 h-10 rounded-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const projects = formData.projects?.filter((_, i) => i !== index) || []
                      const newInputs = { ...projectInputs }
                      delete newInputs[index]
                      // Re-index remaining inputs
                      const reindexed: {
                        [key: number]: { title: string; role: string; description: string; technologies: string }
                      } = {}
                      Object.keys(newInputs).forEach((key) => {
                        const oldIndex = Number.parseInt(key)
                        const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex
                        reindexed[newIndex] = newInputs[oldIndex]
                      })
                      setProjectInputs(reindexed)
                      updateFormData("projects", projects)
                    }}
                    className="rounded-full h-8 px-3 text-xs mt-4"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-8 bg-transparent"
            onClick={prevStep}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8"
            onClick={handleSaveAndContinue}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const Step5HeadlineAndPreferences = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
  setFormData,
  setIsLoading,
  isLoading,
  handleCompleteRegistration, // Receive the handler
}: StepProps) => {
  const [showHeadlineDropdown, setShowHeadlineDropdown] = useState(false)
  const [headlineInput, setHeadlineInput] = useState(formData.resumeHeadline || "")
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [locationInput, setLocationInput] = useState("")
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [cityInput, setCityInput] = useState(formData.currentCity || "")
  const [salaryInput, setSalaryInput] = useState(formData.preferredSalary || "")
  const [languageInputs, setLanguageInputs] = useState<{ [key: number]: string }>({
    ...(formData.languagesKnown || []).reduce((acc, lang, index) => ({ ...acc, [index]: lang.language || "" }), {}),
  })

  // Generate profile-relevant headline suggestions based on user's data
  const getProfileRelevantHeadlines = () => {
    const industry = formData.industry || ""
    const jobTitle = formData.jobRole || "" // Use jobRole from Step 3
    const yearsOfExp = formData.totalExperienceYears || 0
    const skills = (formData.skills || []).slice(0, 3).join(", ") // Use single skills field

    const relevantHeadlines = []

    // If user has job title and industry, create specific headlines
    if (jobTitle && industry) {
      relevantHeadlines.push(`${jobTitle} with ${yearsOfExp}+ years in ${industry}`)
      if (skills) {
        relevantHeadlines.push(`${jobTitle} skilled in ${skills}`)
      }
    }

    // Add generic but relevant headlines based on industry
    if (industry.includes("IT") || industry.includes("Technology")) {
      relevantHeadlines.push(
        "Experienced Software Engineer with full-stack development expertise",
        "Full Stack Developer proficient in modern technologies",
        "Senior Developer with strong problem-solving skills",
      )
    }
    if (industry.includes("BPO") || industry.includes("Call")) {
      relevantHeadlines.push(
        "Customer Service Professional with excellent communication skills",
        "Team Lead with proven track record in client satisfaction",
        "Quality Analyst focused on process improvement",
      )
    }
    if (industry.includes("Marketing") || industry.includes("Sales")) {
      relevantHeadlines.push(
        "Digital Marketing Specialist with data-driven approach",
        "Sales Professional with consistent target achievement",
        "Marketing Manager with proven ROI improvement",
      )
    }

    // Fallback generic headlines if no specific data
    if (relevantHeadlines.length === 0) {
      relevantHeadlines.push(
        `Professional with ${yearsOfExp}+ years of experience`,
        "Dedicated professional seeking new opportunities",
        "Results-oriented professional with strong work ethic",
        "Experienced professional with domain expertise",
      )
    }

    return relevantHeadlines.slice(0, 6) // Limit to 6 suggestions
  }

  const headlineSuggestions = getProfileRelevantHeadlines()

  const filteredHeadlines = headlineSuggestions.filter((h) => h.toLowerCase().includes(headlineInput.toLowerCase()))

  const [cities, setCities] = useState<Array<{ city: string; state: string }>>([])

  useEffect(() => {
    // Load cities from component constant (already defined in the file)
    const INDIAN_CITIES = [
      { city: "Mumbai", state: "Maharashtra" },
      { city: "Delhi", state: "Delhi" },
      { city: "Bangalore", state: "Karnataka" },
      { city: "Hyderabad", state: "Telangana" },
      { city: "Chennai", state: "Tamil Nadu" },
      { city: "Kolkata", state: "West Bengal" },
      { city: "Pune", state: "Maharashtra" },
      { city: "Ahmedabad", state: "Gujarat" },
      { city: "Jaipur", state: "Rajasthan" },
      { city: "Surat", state: "Gujarat" },
      { city: " Lucknow", state: "Uttar Pradesh" },
      { city: "Kanpur", state: "Uttar Pradesh" },
      { city: "Nagpur", state: "Maharashtra" },
      { city: "Indore", state: "Madhya Pradesh" },
      { city: "Thane", state: "Maharashtra" },
      { city: "Bhopal", state: "Madhya Pradesh" },
      { city: "Visakhapatnam", state: "Andhra Pradesh" },
    ]
    setCities(INDIAN_CITIES)
  }, [])

  const filteredCities = cities.filter(
    (c) =>
      c.city.toLowerCase().includes(cityInput.toLowerCase()) || c.state.toLowerCase().includes(cityInput.toLowerCase()),
  )

  const filteredLocations = cities.filter((c) => c.city.toLowerCase().includes(locationInput.toLowerCase()))

  const formatIndianSalary = (value: string) => {
    const num = value.replace(/,/g, "")
    if (!/^\d*$/.test(num)) return value

    if (num.length === 0) return ""

    const lastThree = num.substring(num.length - 3)
    const otherNumbers = num.substring(0, num.length - 3)
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (otherNumbers ? "," : "") + lastThree
    return formatted
  }

  const handleAddLocation = () => {
    if (locationInput.trim()) {
      const currentLocations = formData.preferredLocations || []
      if (!currentLocations.includes(locationInput.trim())) {
        updateFormData("preferredLocations", [...currentLocations, locationInput.trim()])
      }
      setLocationInput("")
      setShowLocationDropdown(false)
    }
  }

  const handleRemoveLocation = (index: number) => {
    const currentLocations = formData.preferredLocations || []
    updateFormData(
      "preferredLocations",
      currentLocations.filter((_, i) => i !== index),
    )
  }

  const handleAddLanguage = () => {
    const currentLanguages = formData.languagesKnown || []
    const newIndex = currentLanguages.length
    updateFormData("languagesKnown", [...currentLanguages, { language: "", read: false, write: false, speak: false }])
    setLanguageInputs({
      ...languageInputs,
      [newIndex]: "",
    })
  }

  const handleRemoveLanguage = (index: number) => {
    const currentLanguages = formData.languagesKnown || []
    updateFormData(
      "languagesKnown",
      currentLanguages.filter((_, i) => i !== index),
    )
    const newInputs = { ...languageInputs }
    delete newInputs[index]
    // Re-index remaining inputs
    const reindexed: { [key: number]: string } = {}
    Object.keys(newInputs).forEach((key) => {
      const oldIndex = Number.parseInt(key)
      const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex
      reindexed[newIndex] = newInputs[oldIndex]
    })
    setLanguageInputs(reindexed)
  }

  const handleLanguageChange = (index: number, field: string, value: any) => {
    const currentLanguages = formData.languagesKnown || []
    const updatedLanguages = [...currentLanguages]
    updatedLanguages[index] = { ...updatedLanguages[index], [field]: value }
    updateFormData("languagesKnown", updatedLanguages)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 md:p-8">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-2xl font-bold">Preferences</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Tell us about your job preferences</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Preferences</h3>

            <div className="mb-4">
              <Label htmlFor="resumeHeadline" className="text-sm">
                Resume Headline <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={headlineInput}
                  onChange={(e) => {
                    setHeadlineInput(e.target.value)
                    setShowHeadlineDropdown(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowHeadlineDropdown(headlineInput.length > 0)}
                  onBlur={() => {
                    setTimeout(() => {
                      updateFormData("resumeHeadline", headlineInput)
                      setShowHeadlineDropdown(false)
                    }, 200)
                  }}
                  placeholder="e.g., Experienced Software Engineer..."
                  className="rounded-full"
                />
                {showHeadlineDropdown && filteredHeadlines.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredHeadlines.map((headline, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                        onClick={() => {
                          setHeadlineInput(headline)
                          updateFormData("resumeHeadline", headline)
                          setShowHeadlineDropdown(false)
                        }}
                      >
                        {headline}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm">
                  Current City / State <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value)
                      setShowCityDropdown(e.target.value.length > 0)
                    }}
                    onFocus={() => setShowCityDropdown(cityInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                    placeholder="Type to search city"
                    className="rounded-full"
                  />
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCities.map((c, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setCityInput(`${c.city}, ${c.state}`)
                            updateFormData("currentCity", c.city)
                            updateFormData("currentState", c.state)
                            setShowCityDropdown(false)
                          }}
                        >
                          {c.city}, {c.state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm">
                  Availability to Join <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.availabilityToJoin}
                  onChange={(e) => updateFormData("availabilityToJoin", e.target.value)}
                  className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select availability</option>
                  <option value="Immediate">Immediate</option>
                  <option value="15 Days">15 Days</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm">
                  Preferred Locations <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value)
                      setShowLocationDropdown(e.target.value.length > 0)
                    }}
                    onFocus={() => setShowLocationDropdown(locationInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    placeholder="Type to search cities"
                    className="rounded-full"
                  />
                  {showLocationDropdown && filteredLocations.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredLocations.map((loc, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            const locs = formData.preferredLocations || []
                            if (!locs.includes(loc.city)) {
                              updateFormData("preferredLocations", [...locs, loc.city])
                            }
                            setLocationInput("")
                            setShowLocationDropdown(false)
                          }}
                        >
                          {loc.city}, {loc.state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.preferredLocations || []).map((loc, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {loc}
                      <button
                        onClick={() => {
                          const locs = formData.preferredLocations?.filter((_, i) => i !== idx) || []
                          updateFormData("preferredLocations", locs)
                        }}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">
                  Expected Salary (INR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={salaryInput}
                  onChange={(e) => {
                    // Only update local state, don't trigger formData update
                    setSalaryInput(e.target.value)
                  }}
                  onBlur={(e) => {
                    // Finalize the formatting and save to formData on blur
                    const formatted = formatIndianSalary(e.target.value)
                    setSalaryInput(formatted)
                    updateFormData("preferredSalary", formatted)
                  }}
                  placeholder="e.g., 10,00,000"
                  className="rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Personal Details (Optional)</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm">Marital Status</Label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => updateFormData("maritalStatus", e.target.value)}
                  className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                  className="rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Languages Known</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-transparent"
                  onClick={handleAddLanguage}
                >
                  + Add Language
                </Button>
              </div>

              {(formData.languagesKnown || []).map((lang, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <Input
                      value={languageInputs[index] || ""}
                      onChange={(e) => {
                        setLanguageInputs({
                          ...languageInputs,
                          [index]: e.target.value,
                        })
                      }}
                      onBlur={(e) => {
                        const langs = [...(formData.languagesKnown || [])]
                        langs[index].language = e.target.value
                        updateFormData("languagesKnown", langs)
                      }}
                      placeholder="Language name"
                      className="rounded-full"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const langs = formData.languagesKnown?.filter((_, i) => i !== index) || []
                        const newInputs = { ...languageInputs }
                        delete newInputs[index]
                        // Re-index remaining inputs
                        const reindexed: { [key: number]: string } = {}
                        Object.keys(newInputs).forEach((key) => {
                          const oldIndex = Number.parseInt(key)
                          const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex
                          reindexed[newIndex] = newInputs[oldIndex]
                        })
                        setLanguageInputs(reindexed)
                        updateFormData("languagesKnown", langs)
                      }}
                      className="rounded-full h-8 px-3 text-xs"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lang.read}
                        onChange={(e) => {
                          const langs = [...(formData.languagesKnown || [])]
                          langs[index].read = e.target.checked
                          updateFormData("languagesKnown", langs)
                        }}
                      />
                      <span className="text-sm">Read</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lang.write}
                        onChange={(e) => {
                          const langs = [...(formData.languagesKnown || [])]
                          langs[index].write = e.target.checked
                          updateFormData("languagesKnown", langs)
                        }}
                      />
                      <span className="text-sm">Write</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lang.speak}
                        onChange={(e) => {
                          const langs = [...(formData.languagesKnown || [])]
                          langs[index].speak = e.target.checked
                          updateFormData("languagesKnown", langs)
                        }}
                      />
                      <span className="text-sm">Speak</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            className="rounded-full px-8 bg-transparent"
            disabled={isLoading}
          >
            Previous
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8"
            onClick={async () => {
              setIsLoading(true)
              await handleCompleteRegistration()
            }}
            disabled={isLoading}
          >
            {isLoading ? "Completing Registration..." : "Complete Registration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
