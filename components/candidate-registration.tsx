"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Eye, EyeOff, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  createCandidate,
  updateEmploymentDetails,
  checkEmailExists,
  uploadResume,
  updateEducationDetails,
  updatePreferencesAndComplete,
} from "@/app/actions/candidate-actions"
import { MonthYearPicker } from "@/components/ui/date-picker"
import Link from "next/link"

const getSupabase = () => createClient()

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
}

type AdditionalEmploymentEntry = {
  companyName: string
  jobTitle: string
  fromDate: string // MM/YY format
  toDate: string // MM/YY format
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

  // Step 2: OTP (not stored, just verified)
  otp: string

  // Step 3: Employment Details (combined with skills) - now supports multiple entries
  currentEmployment: EmploymentEntry | null // First/current employment with full details
  additionalEmployment: AdditionalEmploymentEntry[] // Additional employment with simplified fields
  totalExperienceYears: string
  totalExperienceMonths: string
  skillsForRole: string[]
  skillsYouKnow: string[]
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
  startingYear: string
  passingYear: string
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
}

type Skill = {
  id: number
  skill_name: string
  category: string
}

export default function CandidateRegistration() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<RegistrationData>({
    fullName: "",
    email: "",
    password: "",
    mobileNumber: "",
    mobileVerified: false, // Initialize mobileVerified to false
    workStatus: "",
    resume: null,
    resumeUrl: "",
    otp: "",
    currentEmployment: null,
    additionalEmployment: [],

    totalExperienceYears: "",
    totalExperienceMonths: "",
    skillsForRole: [],
    skillsYouKnow: [],
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

  const formatIndianNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    if (!digits) return ""

    // Format with Indian comma system (XX,XX,XXX)
    const num = Number.parseInt(digits)
    return num.toLocaleString("en-IN")
  }

  const handleSalaryChange = (value: string) => {
    // Remove existing commas and format
    const formatted = formatIndianNumber(value)
    updateFormData("preferredSalary", formatted)
  }

  const currentStep = step // Alias for clarity
  const setStepState = (step: number) => {
    // Renamed to avoid conflict with the original setStep
    console.log("[v0] In setStep, prev:", currentStep, "isFresher:", isFresher)
    const maxStep = 5
    console.log("[v0] maxStep:", maxStep, "prev:", currentStep)

    if (step === 3 && currentStep === 2 && isFresher) {
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
      if (prev === 3 && formData.mobileVerified) {
        return 1 // Skip step 2 (OTP) and go directly to step 1
      }
      if (isFresher && prev === 4) {
        return 3 // Go back to Step 3 (Skills & Employment) from Step 4 (Education)
      }
      return Math.max(prev - 1, 1)
    })
  }

  const getDisplayStep = (stepNumber: number) => {
    if (!isFresher) return stepNumber
    // For fresher: 1->1, 2->2, 4->3, 5->4, 6->5
    if (stepNumber <= 2) return stepNumber
    return stepNumber - 1
  }

  const stepProps = {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    setFormData,
    setIsLoading,
    isLoading,
  }

  // Import Step4EducationCombined and Step5HeadlineAndPreferences here
  // Assuming these components are defined elsewhere and need to be imported.
  // If they are in the same file, they should be declared above.
  // For now, let's assume they exist.
  // Placeholder imports, replace with actual import paths if necessary
  // const Step4EducationCombined = ({}: StepProps) => <div>Education Step</div>
  // const Step5HeadlineAndPreferences = ({}: StepProps) => <div>Preferences Step</div>

  // Placeholder for Step4EducationCombined component
  const Step4EducationCombinedPlaceholder = ({}: StepProps) => {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Education Details</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Provide details about your educational qualifications.</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Education form fields will go here */}
          <div className="text-center text-muted-foreground">Education details coming soon...</div>
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" className="rounded-full px-8 bg-transparent">
              Back
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">Save & Continue</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Placeholder for Step5HeadlineAndPreferences component
  const Step5HeadlineAndPreferencesPlaceholder = ({}: StepProps) => {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Headline & Preferences</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Refine your profile and set your job preferences.</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Headline and preferences form fields will go here */}
          <div className="text-center text-muted-foreground">Headline & Preferences coming soon...</div>
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" className="rounded-full px-8 bg-transparent">
              Back
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
              Complete Registration
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Corrected assignments for Step4 and Step5 components
  const Step5HeadlineAndPreferences = Step5PersonalAndPreferences
  const Step4EducationCombined = Step4EducationAndProjects

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Initial {...stepProps} />
      case 2:
        return <Step2OTP {...stepProps} />
      case 3:
        // Only render employment step if not a fresher
        // Renamed the component to Step3EmploymentAndSkills for clarity
        return <Step3EmploymentAndSkills {...stepProps} />
      case 4:
        return <Step4EducationCombined {...stepProps} />
      case 5: // Combined step for preferences
        return <Step5HeadlineAndPreferences {...stepProps} />
      // case 6: // This case is no longer needed due to combining steps
      //   // This case might not be reached if step 5 is combined.
      //   // If it is still needed for some logic, ensure it uses the correct component or redirect.
      //   // For the purpose of this merge, we'll map step 6 to the combined component if needed.
      //   return <Step5HeadlineAndPreferences {...stepProps} />
      default:
        return <Step1Initial {...stepProps} />
    }
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
        { step: 3, label: "Skills", description: "Tell us your core skills" },
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
        renderStep()
      ) : (
        <div className="flex flex-col lg:flex-row max-w-6xl mx-auto mt-4 md:mt-8 px-4">
          {/* Sidebar */}
          <div className="w-full lg:w-64 lg:pr-8 mb-6 lg:mb-0">
            <div className="relative">
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
                {getStepLabels().map((item, index, arr) => {
                  const isCompleted = step > item.step
                  const isActive = step === item.step
                  const displayIndex = index + 1

                  return (
                    <div key={item.step} className="flex items-start mb-0 lg:mb-8 flex-shrink-0 mr-6 lg:mr-0">
                      <div className="flex flex-col items-center mr-2 lg:mr-4">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? "bg-green-500"
                              : isActive
                                ? "border-2 border-green-500 bg-white"
                                : "border-2 border-gray-300 bg-white"
                          }`}
                        >
                          {isCompleted && <Check className="w-4 h-4 text-white" />}
                        </div>
                        {index < arr.length - 1 && (
                          <div
                            className={`hidden lg:block w-0.5 h-16 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`}
                          />
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-medium text-sm lg:text-base whitespace-nowrap lg:whitespace-normal ${isActive ? "text-green-600" : isCompleted ? "text-gray-900" : "text-gray-500"}`}
                        >
                          {item.label}
                        </div>
                        {item.description && isActive && (
                          <div className="text-xs lg:text-sm text-gray-500 mt-1 hidden lg:block">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">{renderStep()}</div>
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

function Step1Initial({
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

  // Updated handleSubmit
  const handleSubmit = async () => {
    if (isLoading) return

    setIsLoading(true)
    console.log("[v0] Step1 handleSubmit called")

    try {
      // Check if email already exists
      const emailCheck = await checkEmailExists(formData.email)
      if (emailCheck.exists) {
        alert("Email already registered")
        setIsLoading(false)
        return
      }

      let resumeUrl = ""

      // Upload resume if provided
      if (formData.resume) {
        console.log("[v0] Uploading resume file...")
        const uploadResult = await uploadResume(formData.resume, formData.email)

        if (!uploadResult.success) {
          alert(`Failed to upload resume: ${uploadResult.error}`)
          setIsLoading(false)
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
        nextStep()
      } else {
        alert(result.error || "Registration failed")
      }
    } catch (error) {
      console.error("[v0] Error in handleSubmit:", error)
      alert("An error occurred during registration")
    } finally {
      setIsLoading(false)
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
    // For now, just store file name - actual upload would be to Supabase Storage
    // updateFormData("resumeUrl", file.name) // This line is now handled by the upload logic in handleSubmit
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-5xl mx-auto px-4">
      {/* Left Side - Illustration */}
      <div className="flex-1 order-2 lg:order-1">
        <Card className="p-4 md:p-6">
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
              <span>Start your job search now</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Create your profile & apply instantly</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 order-1 lg:order-2">
        <Card className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-center text-primary mb-4 md:mb-6">
            Start your career Journey with JobKarle Now !
          </h2>
          <p> India’s top jobs, one platform. </p>
          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.form}
            </div>
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
              <p className="text-xs text-gray-500 mt-1">We’ll notify you about matching jobs and updates here</p>
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
                  onChange={(e) => updateFormData("password", e.target.value)}
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
              {formData.password && formData.password.length >= 6 && (
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  keep your account protected and secure. <Check className="w-3 h-3" />
                </p>
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
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-2">
                <button
                  onClick={() => updateFormData("workStatus", "experienced")}
                  className={`flex-1 p-3 md:p-4 border rounded-lg text-left transition-all ${
                    formData.workStatus === "experienced"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-medium text-sm md:text-base">I'm experienced</div>
                      <div className="text-xs md:text-sm text-blue-500">
                        I have work experience (excluding internships)
                      </div>
                    </div>
                    <img
                      src="/briefcase-icon.png"
                      alt="Experienced"
                      className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                    />
                  </div>
                </button>
                <button
                  onClick={() => updateFormData("workStatus", "fresher")}
                  className={`flex-1 p-3 md:p-4 border rounded-lg text-left transition-all ${
                    formData.workStatus === "fresher"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-medium text-sm md:text-base">I'm a fresher</div>
                      <div className="text-xs md:text-sm text-blue-500">
                        I am a student/ Haven't worked after graduation
                      </div>
                    </div>
                    <img
                      src="/graduation-cap-icon.png"
                      alt="Fresher"
                      className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                    />
                  </div>
                </button>
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
              // onClick={handleRegister} // Original onClick
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full px-8"
            >
              {isLoading ? "Registering..." : "Register now"}
            </Button>
          </div>
        </Card>

        {/* Google Sign In */}
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
      </div>
    </div>
  )
}

function Step2OTP({ formData, updateFormData, nextStep, prevStep, setIsLoading, isLoading }: StepProps) {
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
}: StepProps) {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [skillSearch, setSkillSearch] = useState("")
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [loadingSkills, setLoadingSkills] = useState(true)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [isSaving, setIsSaving] = React.useState(false) // Added for saving state
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>("") // Added for the fix

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

  const indianCities = [
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
    { city: "Visakhakhakhapatnam", state: "Andhra Pradesh" },
    { city: "Patna", state: "Bihar" },
    { city: "Vadodara", state: "Gujarat" },
    { city: "Ghaziabad", state: "Uttar Pradesh" },
  ]

  const industries = [
    "IT Services & Consulting",
    "Software Product",
    "Internet",
    "Banking",
    "Financial Services",
    "Insurance",
    "BPO / Call Centre",
    "Analytics / KPO / Research",
    "Healthcare",
    "Pharmaceutical",
    "Medical Devices",
    "Manufacturing",
    "Automobile",
    "Consumer Electronics",
    "FMCG",
    "Retail",
    "E-commerce",
    "Telecommunications",
    "Media & Entertainment",
    "Education",
    "Real Estate",
    "Construction",
    "Travel & Tourism",
    "Hospitality",
    "Logistics & Supply Chain",
    "Oil & Gas",
    "Power & Energy",
    "Government / PSU",
    "NGO / Non-Profit",
    "Legal",
  ]

  const departments: Record<string, string[]> = {
    "IT Services & Consulting": [
      "Software Development",
      "Web Development",
      "Mobile Development",
      "Cloud Services",
      "IT Support",
      "Consulting",
      "System Administration",
      "Network Administration",
    ],
    "Software Product": [
      "Product Development",
      "Software Engineering",
      "QA/Testing",
      "DevOps",
      "Product Management",
      "Technical Support",
    ],
    Internet: [
      "Digital Marketing",
      "SEO/SEM",
      "Content Development",
      "Web Development",
      "Product Management",
      "Business Development",
    ],
    Banking: [
      "Retail Banking",
      "Corporate Banking",
      "Investment Banking",
      "Credit & Risk",
      "Operations",
      "Compliance",
      "Customer Service",
    ],
    "Financial Services": [
      "Financial Analysis",
      "Portfolio Management",
      "Trading",
      "Risk Management",
      "Compliance",
      "Operations",
    ],
    Insurance: [
      "Underwriting",
      "Claims Processing",
      "Sales & Distribution",
      "Actuarial",
      "Risk Management",
      "Customer Service",
    ],
    "BPO / Call Centre": [
      "Customer Service",
      "Technical Support",
      "Sales",
      "Back Office Operations",
      "Quality Assurance",
      "Training",
    ],
    "Analytics / KPO / Research": [
      "Data Analysis",
      "Business Intelligence",
      "Market Research",
      "Financial Analysis",
      "Research & Development",
    ],
    Healthcare: ["Clinical Services", "Nursing", "Diagnostics", "Pharmacy", "Administration", "Medical Records"],
    Pharmaceutical: [
      "Research & Development",
      "Quality Control",
      "Regulatory Affairs",
      "Production",
      "Sales & Marketing",
    ],
    "Medical Devices": [
      "Research & Development",
      "Quality Assurance",
      "Regulatory Affairs",
      "Manufacturing",
      "Sales & Marketing",
    ],
    Manufacturing: ["Production", "Quality Control", "Supply Chain", "Maintenance", "Planning", "Engineering"],
    Automobile: [
      "Design & Development",
      "Manufacturing",
      "Quality Control",
      "Sales & Marketing",
      "After Sales Service",
    ],
    "Consumer Electronics": [
      "Product Development",
      "Manufacturing",
      "Quality Control",
      "Sales & Marketing",
      "Technical Support",
    ],
    FMCG: ["Sales & Marketing", "Supply Chain", "Production", "Quality Control", "Brand Management"],
    Retail: ["Store Operations", "Merchandising", "Visual Merchandising", "Customer Service", "Inventory Management"],
    "E-commerce": ["Operations", "Marketing", "Customer Service", "Logistics", "Product Management", "Technology"],
    Telecommunications: ["Network Operations", "Customer Service", "Sales", "Technical Support", "IT Infrastructure"],
    "Media & Entertainment": ["Content Creation", "Production", "Marketing", "Distribution", "Digital Media"],
    Education: ["Teaching", "Administration", "Curriculum Development", "Student Services", "IT Support"],
    "Real Estate": ["Sales", "Marketing", "Property Management", "Project Management", "Legal & Compliance"],
    Construction: ["Project Management", "Civil Engineering", "Quality Control", "Safety", "Procurement"],
    "Travel & Tourism": ["Sales & Reservations", "Operations", "Tour Operations", "Customer Service", "Marketing"],
    Hospitality: ["Front Office", "Food & Beverage", "Housekeeping", "Kitchen", "Sales & Marketing"],
    "Logistics & Supply Chain": [
      "Warehousing",
      "Transportation",
      "Inventory Management",
      "Procurement",
      "Supply Planning",
    ],
    "Oil & Gas": ["Exploration", "Production", "Refining", "Operations", "Engineering", "Safety"],
    "Power & Energy": ["Operations", "Maintenance", "Engineering", "Project Management", "Safety"],
    "Government / PSU": ["Administration", "Public Relations", "Finance", "Human Resources", "Technical Services"],
    "NGO / Non-Profit": ["Program Management", "Fund Raising", "Communications", "Field Operations", "Administration"],
    Legal: ["Corporate Law", "Litigation", "Compliance", "Legal Advisory", "Contracts"],
  }

  const rolesByCategory: Record<string, string[]> = {
    "Software Development": [
      "Software Engineer",
      "Senior Software Engineer",
      "Tech Lead",
      "Principal Engineer",
      "Software Architect",
    ],
    "Web Development": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Web Developer"],
    "Digital Marketing": [
      "Digital Marketing Executive",
      "SEO Specialist",
      "SEM Specialist",
      "Social Media Manager",
      "Head - Digital Marketing",
    ],
    "Brand Management": ["Brand Manager", "Senior Brand Manager", "Brand Head"],
    Recruitment: ["Recruiter", "Senior Recruiter", "Talent Acquisition Manager", "HR Business Partner"],
    "Data Analysis": ["Data Analyst", "Senior Data Analyst", "Analytics Manager", "Data Scientist"],
    Accounting: ["Accountant", "Senior Accountant", "Accounts Manager", "Finance Controller"],
    "Customer Service": ["Customer Support Executive", "Customer Success Manager", "Support Team Lead"],
    "UI/UX Design": ["UI Designer", "UX Designer", "Product Designer", "Design Lead"],
    "Inside Sales": ["Sales Executive", "Inside Sales Representative", "Sales Manager"],
    "Field Sales": ["Territory Sales Manager", "Regional Sales Manager", "Area Sales Manager"],
  }

  const availableDepartments = formData.industry
    ? departments[formData.industry] || [
        "Operations",
        "Sales & Marketing",
        "Finance",
        "Human Resources",
        "Administration",
        "IT",
        "Customer Service",
      ]
    : []

  const filteredSkills = allSkills.filter(
    (skill) =>
      skill.skill_name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !formData.skillsForRole.includes(skill.skill_name),
  )

  const suggestedSkills = allSkills.filter((skill) => !formData.skillsForRole.includes(skill.skill_name)).slice(0, 10)

  const addSkill = (skillName: string) => {
    if (!formData.skillsForRole.includes(skillName)) {
      updateFormData("skillsForRole", [...formData.skillsForRole, skillName])
    }
    setSkillSearch("")
    setShowSkillDropdown(false)
  }

  const removeSkill = (skillName: string) => {
    updateFormData(
      "skillsForRole",
      formData.skillsForRole.filter((s) => s !== skillName),
    )
  }

  // State for current employment entry being edited/added
  const [currentEntry, setCurrentEntry] = useState<EmploymentEntry>({
    currentlyEmployed: "",
    companyName: "",
    currentJobTitle: "",
    currentCity: "",
    currentState: "",
    durationFrom: "",
    durationTo: "",
    annualSalary: "",
    noticePeriod: "",
  })

  // State for additional employment entries being edited/added
  const [currentAdditionalEntry, setCurrentAdditionalEntry] = useState<AdditionalEmploymentEntry>({
    companyName: "",
    jobTitle: "",
    fromDate: "",
    toDate: "",
  })
  const [editingCurrentIndex, setEditingCurrentIndex] = useState<number | null>(null) // This state is not strictly needed for single current employment but kept for consistency if expanded
  const [editingAdditionalIndex, setEditingAdditionalIndex] = useState<number | null>(null)
  const [showCurrentEmploymentForm, setShowCurrentEmploymentForm] = useState(formData.currentEmployment === null)
  const [showAdditionalEmploymentForm, setShowAdditionalEmploymentForm] = useState(false)

  const handleSaveCurrentEmployment = () => {
    // Basic validation could be added here
    updateFormData("currentEmployment", currentEntry)
    setShowCurrentEmploymentForm(false)
    // If editing, reset index
    if (editingCurrentIndex !== null) {
      setEditingCurrentIndex(null)
    }
    // Reset form
    setCurrentEntry({
      currentlyEmployed: "",
      companyName: "",
      currentJobTitle: "",
      currentCity: "",
      currentState: "",
      durationFrom: "",
      durationTo: "",
      annualSalary: "",
      noticePeriod: "",
    })
  }

  const editCurrentEmploymentEntry = () => {
    // This function is called when the 'Edit' button is clicked for current employment.
    // It sets the form to be visible and pre-fills the current employment data.
    if (formData.currentEmployment) {
      setCurrentEntry(formData.currentEmployment)
      // setEditingCurrentIndex(0); // Assuming we edit the first (and only) current employment entry.
      setShowCurrentEmploymentForm(true)
    }
  }

  const handleSaveAdditionalEmployment = () => {
    // Basic validation could be added here
    if (editingAdditionalIndex !== null) {
      // Update existing
      const updated = [...formData.additionalEmployment]
      updated[editingAdditionalIndex] = currentAdditionalEntry
      updateFormData("additionalEmployment", updated)
      setEditingAdditionalIndex(null)
    } else {
      // Add new
      updateFormData("additionalEmployment", [...formData.additionalEmployment, currentAdditionalEntry])
    }
    // Reset form
    setCurrentAdditionalEntry({
      companyName: "",
      jobTitle: "",
      fromDate: "",
      toDate: "",
    })
    setShowAdditionalEmploymentForm(false)
  }

  const editAdditionalEmploymentEntry = (index: number) => {
    setCurrentAdditionalEntry(formData.additionalEmployment[index])
    setEditingAdditionalIndex(index)
    setShowAdditionalEmploymentForm(true)
  }

  const deleteAdditionalEmploymentEntry = (index: number) => {
    const updated = formData.additionalEmployment.filter((_, i) => i !== index)
    updateFormData("additionalEmployment", updated)
  }

  // Updated validation for Step 3 - Made skills, industry, department mandatory for both experienced AND freshers
  const handleSaveAndContinue = async () => {
    if (!formData.skillsForRole || formData.skillsForRole.length === 0) {
      alert("Please add at least one key skill")
      return
    }

    if (!formData.industry) {
      alert("Please select an industry")
      return
    }

    if (!formData.department) {
      alert("Please select a department")
      return
    }

    if (formData.workStatus === "experienced") {
      // Changed currentEmployment?.currentCompany to currentEmployment?.companyName to match the type
      if (!formData.currentEmployment?.companyName) {
        alert("Please enter your current/last company name")
        return
      }

      if (!formData.currentEmployment?.currentJobTitle) {
        alert("Please enter your current job title")
        return
      }

      if (!formData.totalExperienceYears || Number.parseInt(formData.totalExperienceYears) === 0) {
        alert("Please enter your total years of experience")
        return
      }

      if (!formData.roleCategory) {
        alert("Please select a role category")
        return
      }

      if (!formData.jobRole) {
        alert("Please select a job role")
        return
      }
    }

    // Freshers automatically get 0 experience years
    if (formData.workStatus === "fresher") {
      updateFormData("totalExperienceYears", "0")
      updateFormData("totalExperienceMonths", "0")
    }

    if (isLoading || isSaving) {
      console.log("[v0] Step3 Already saving, ignoring duplicate call. isSaving:", isSaving, "isLoading:", isLoading)
      return
    }

    console.log("[v0] Step3 handleSaveAndContinue called")

    setIsSaving(true)
    setIsLoading?.(true)
    try {
      console.log("[v0] Calling updateEmploymentDetails")
      const employmentData = {
        // Added candidateId to employmentData
        // candidateId: formData.candidateId, // Assuming candidateId is available on formData
        currentEmployment: formData.workStatus === "experienced" ? formData.currentEmployment : null,
        additionalEmployment: formData.workStatus === "experienced" ? formData.additionalEmployment : [],
        totalExperienceYears:
          formData.workStatus === "fresher" ? 0 : Number.parseInt(formData.totalExperienceYears) || 0,
        totalExperienceMonths:
          formData.workStatus === "fresher" ? 0 : Number.parseInt(formData.totalExperienceMonths) || 0,
        skillsForRole: formData.skillsForRole,
        skillsYouKnow: formData.skillsYouKnow, // Keep skillsYouKnow if it's used elsewhere
        industry: formData.industry,
        department: formData.department,
        roleCategory: formData.roleCategory || "",
        jobRole: formData.jobRole || "",
      }

      // Pass the employmentData object to updateEmploymentDetails
      const result = await updateEmploymentDetails(formData.email, employmentData)

      console.log("[v0] updateEmploymentDetails result:", result)

      if (result.success) {
        console.log("[v0] Success, calling nextStep")
        await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay
        nextStep?.()
        console.log("[v0] nextStep called")
      } else {
        console.log("[v0] Failed:", result.error)
        alert(result.error || "Failed to save employment details")
      }
    } catch (error) {
      console.error("[v0] Error saving employment:", error)
      alert("An error occurred while saving employment details")
    } finally {
      console.log("[v0] Finally block, setting states to false")
      setTimeout(() => {
        setIsLoading?.(false)
        setIsSaving(false)
      }, 200)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              {formData.workStatus === "fresher" ? "Skills & Preferences" : "Employment & Skills"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {/* Updated description for freshers */}
              {formData.workStatus === "fresher"
                ? "Tell us about your skills and career interests to help us recommend relevant jobs"
                : "Share details about your work experience to help us recommend jobs suited to you"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 max-h-[600px] overflow-y-auto">
        {formData.workStatus !== "fresher" && (
          <>
            {/* Current Employment Form */}
            {showCurrentEmploymentForm && (
              <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {formData.currentEmployment ? "Edit Current Employment" : "Your Current Employment"}
                  </h3>
                  {formData.currentEmployment && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCurrentEmploymentForm(false)
                        setEditingCurrentIndex(null)
                        setCurrentEntry({
                          currentlyEmployed: "",
                          companyName: "",
                          currentJobTitle: "",
                          currentCity: "",
                          currentState: "",
                          durationFrom: "",
                          durationTo: "",
                          annualSalary: "",
                          noticePeriod: "",
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm" htmlFor="currentlyEmployed">
                    Are you currently employed?*
                  </Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={currentEntry.currentlyEmployed === "yes" ? "default" : "outline"}
                      onClick={() => setCurrentEntry({ ...currentEntry, currentlyEmployed: "yes" })}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={currentEntry.currentlyEmployed === "no" ? "default" : "outline"}
                      onClick={() => setCurrentEntry({ ...currentEntry, currentlyEmployed: "no" })}
                    >
                      No
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="companyName">
                      {currentEntry.currentlyEmployed === "yes" ? "Current company" : "Previous company"}*
                    </Label>
                    <Input
                      id="companyName"
                      value={currentEntry.companyName}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, companyName: e.target.value })}
                      placeholder="Eg. Amazon"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="currentJobTitle">
                      {currentEntry.currentlyEmployed === "yes" ? "Current job title" : "Previous job title"}*
                    </Label>
                    <Input
                      id="currentJobTitle"
                      value={currentEntry.currentJobTitle}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, currentJobTitle: e.target.value })}
                      placeholder="Eg. Software Developer"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <Label className="text-sm" htmlFor="currentCity">
                    Current city*
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentCity"
                      value={currentEntry.currentCity}
                      onChange={(e) => {
                        setCurrentEntry({ ...currentEntry, currentCity: e.target.value })
                        setShowCityDropdown(true)
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      placeholder="Select city"
                      className="h-10 text-sm"
                    />
                    {currentEntry.currentCity && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentEntry({ ...currentEntry, currentCity: "", currentState: "" })
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showCityDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {indianCities
                        .filter((c) => c.city.toLowerCase().includes(currentEntry.currentCity.toLowerCase()))
                        .map((c) => (
                          <button
                            key={c.city}
                            type="button"
                            onClick={() => {
                              setCurrentEntry({ ...currentEntry, currentCity: c.city, currentState: c.state })
                              setShowCityDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                          >
                            {c.city}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {currentEntry.currentState && (
                  <div className="space-y-2">
                    <Label className="text-sm">State</Label>
                    <Input value={currentEntry.currentState} disabled className="h-10 text-sm text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm">Duration*</Label>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <MonthYearPicker
                      value={currentEntry.durationFrom}
                      onChange={(value) => setCurrentEntry({ ...currentEntry, durationFrom: value })}
                      placeholder="Start date"
                      className="h-10 text-sm"
                    />
                    <span className="text-xs text-muted-foreground font-medium">To</span>
                    <MonthYearPicker
                      value={currentEntry.durationTo}
                      onChange={(value) => setCurrentEntry({ ...currentEntry, durationTo: value })}
                      placeholder="Present"
                      disabled={currentEntry.currentlyEmployed === "yes"}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Annual salary*</Label>
                  <div className="flex gap-2">
                    <select className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>₹</option>
                    </select>
                    <Input
                      id="annualSalary"
                      type="number"
                      value={currentEntry.annualSalary}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, annualSalary: e.target.value })}
                      placeholder="Eg. 5,64,000"
                      className="flex-1 h-10 text-sm"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">per year</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Notice period*</Label>
                  <div className="flex flex-wrap gap-2">
                    {["15 Days or less", "1 Month", "2 Months", "3 Months", "More than 3 Months"].map((period) => (
                      <Button
                        key={period}
                        type="button"
                        variant={currentEntry.noticePeriod === period ? "default" : "outline"}
                        onClick={() => setCurrentEntry({ ...currentEntry, noticePeriod: period })}
                        className="rounded-full text-sm px-3 py-1.5"
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button type="button" onClick={handleSaveCurrentEmployment} className="w-full h-10">
                  {formData.currentEmployment ? "Update Employment Entry" : "Save Current Employment"}
                </Button>
              </div>
            )}

            {/* Display current employment if it exists and form is hidden */}
            {!showCurrentEmploymentForm && formData.currentEmployment && (
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{formData.currentEmployment.currentJobTitle}</p>
                    <p className="text-xs text-muted-foreground">{formData.currentEmployment.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.currentEmployment.currentCity}, {formData.currentEmployment.currentState}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.currentEmployment.durationFrom} to{" "}
                      {formData.currentEmployment.currentlyEmployed === "yes"
                        ? "Present"
                        : formData.currentEmployment.durationTo}
                    </p>
                    <p className="text-xs">₹ {formData.currentEmployment.annualSalary} per year</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={editCurrentEmploymentEntry}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Employment Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Previous Employment</h3>
              {formData.additionalEmployment.length > 0 && (
                <div className="space-y-4">
                  {formData.additionalEmployment.map((entry, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{entry.jobTitle}</p>
                          <p className="text-xs text-muted-foreground">{entry.companyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.fromDate} to {entry.toDate}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editAdditionalEmploymentEntry(index)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAdditionalEmploymentEntry(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit additional employment form */}
              {showAdditionalEmploymentForm && (
                <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">
                      {editingAdditionalIndex !== null ? "Edit Previous Employment" : "Add Previous Employment"}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAdditionalEmploymentForm(false)
                        setEditingAdditionalIndex(null)
                        setCurrentAdditionalEntry({
                          companyName: "",
                          jobTitle: "",
                          fromDate: "",
                          toDate: "",
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="companyName">
                        Company name*
                      </Label>
                      <Input
                        id="companyName"
                        value={currentAdditionalEntry.companyName}
                        onChange={(e) =>
                          setCurrentAdditionalEntry({ ...currentAdditionalEntry, companyName: e.target.value })
                        }
                        placeholder="Eg. Microsoft"
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="jobTitle">
                        Job title*
                      </Label>
                      <Input
                        id="jobTitle"
                        value={currentAdditionalEntry.jobTitle}
                        onChange={(e) =>
                          setCurrentAdditionalEntry({ ...currentAdditionalEntry, jobTitle: e.target.value })
                        }
                        placeholder="Eg. Senior Developer"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Duration*</Label>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                      <MonthYearPicker
                        value={currentAdditionalEntry.fromDate}
                        onChange={(value) => setCurrentAdditionalEntry({ ...currentAdditionalEntry, fromDate: value })}
                        placeholder="Start date"
                        className="h-10 text-sm"
                      />
                      <span className="text-xs text-muted-foreground font-medium">To</span>
                      <MonthYearPicker
                        value={currentAdditionalEntry.toDate}
                        onChange={(value) => setCurrentAdditionalEntry({ ...currentAdditionalEntry, toDate: value })}
                        placeholder="End date"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <Button type="button" onClick={handleSaveAdditionalEmployment} className="w-full h-10">
                    {editingAdditionalIndex !== null ? "Update Previous Employment" : "Add Previous Employment"}
                  </Button>
                </div>
              )}

              {!showAdditionalEmploymentForm && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdditionalEmploymentForm(true)}
                  className="w-full h-10"
                >
                  + Add Previous Employment
                </Button>
              )}
            </div>
          </>
        )}

        {/* Total experience */}
        <div className="space-y-2">
          <Label className="text-sm">Total work experience*</Label>
          <div className="flex gap-3">
            <select
              value={formData.totalExperienceYears}
              onChange={(e) => updateFormData("totalExperienceYears", e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
            >
              <option value="">Select year</option>
              {Array.from({ length: 51 }, (_, i) => (
                <option key={i} value={i}>
                  {i} Year{i !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <select
              value={formData.totalExperienceMonths}
              onChange={(e) => updateFormData("totalExperienceMonths", e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
            >
              <option value="">Select month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {i} Month{i !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Skills - MANDATORY FOR ALL */}
        <div>
          <Label className="text-sm">
            Key skills<span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-gray-500 mb-2">
            {/* Updated description for freshers */}
            {formData.workStatus === "fresher"
              ? "Add skills you've learned through education, projects, or self-study"
              : "Add skills relevant to your current or desired role"}
          </p>
          {formData.skillsForRole.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {formData.skillsForRole.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {skill}
                  <X className="w-4 h-4 cursor-pointer hover:text-blue-900" onClick={() => removeSkill(skill)} />
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Input
              value={skillSearch}
              onChange={(e) => {
                setSkillSearch(e.target.value)
                setShowSkillDropdown(true)
              }}
              className="relative h-10 text-sm"
              onFocus={() => setShowSkillDropdown(true)}
              placeholder="Search or add skills..."
            />
            {skillSearch && (
              <button
                type="button"
                onClick={() => {
                  setSkillSearch("")
                  setShowSkillDropdown(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSkillDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {loadingSkills ? (
                  <div className="p-3 text-center text-gray-500 text-sm">Loading skills...</div>
                ) : filteredSkills.length > 0 ? (
                  filteredSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => addSkill(skill.skill_name)}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                    >
                      {skill.skill_name}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500 text-sm">No skills found.</div>
                )}
                {/* Add a button to manually add a skill if it doesn't exist */}
                {skillSearch &&
                  !filteredSkills.some((s) => s.skill_name.toLowerCase() === skillSearch.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => addSkill(skillSearch)}
                      className="w-full text-left px-4 py-2 hover:bg-muted font-semibold text-blue-600 text-sm"
                    >
                      + Add "{skillSearch}"
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Display suggested skills */}
          {!skillSearch && suggestedSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedSkills.map((skill) => (
                <Button
                  key={skill.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addSkill(skill.skill_name)}
                  className="rounded-full text-xs px-3 py-1.5"
                >
                  {skill.skill_name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label className="text-sm">
            Industry<span className="text-red-500">*</span>
          </Label>
          <select
            value={formData.industry}
            onChange={(e) => {
              updateFormData("industry", e.target.value)
              updateFormData("department", "") // Reset department when industry changes
              updateFormData("roleCategory", "") // Reset roleCategory
              updateFormData("jobRole", "") // Reset jobRole
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        {formData.industry && (
          <div className="space-y-2">
            <Label className="text-sm">
              Department<span className="text-red-500">*</span>
            </Label>
            <select
              id="department"
              value={formData.department}
              onChange={(e) => {
                updateFormData("department", e.target.value)
                updateFormData("roleCategory", "")
                updateFormData("jobRole", "")
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
              disabled={!formData.industry}
            >
              <option value="">Select department</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {!formData.industry && <p className="text-xs text-muted-foreground">Please select an industry first</p>}
          </div>
        )}

        {/* Role Category */}
        {formData.department && (
          <div className="space-y-2">
            <Label className="text-sm">
              Role category<span className="text-red-500">*</span>
            </Label>
            <select
              value={formData.roleCategory}
              onChange={(e) => {
                updateFormData("roleCategory", e.target.value)
                updateFormData("jobRole", "") // Reset jobRole
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
            >
              <option value="">Select role category</option>
              {Object.keys(rolesByCategory).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Job Role */}
        {formData.roleCategory && (
          <div className="space-y-2">
            <Label className="text-sm">
              Job role<span className="text-red-500">*</span>
            </Label>
            <select
              value={formData.jobRole}
              onChange={(e) => updateFormData("jobRole", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
            >
              <option value="">Select job role</option>
              {rolesByCategory[formData.roleCategory]?.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" onClick={prevStep} variant="outline" className="rounded-full px-8 bg-transparent h-10">
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-10"
          >
            {isLoading || isSaving ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Step4EducationAndProjects({ formData, updateFormData, nextStep, prevStep, setIsLoading }: StepProps) {
  const qualificationOptions = [
    "Below 10th",
    "10th Pass",
    "12th Pass",
    "Diploma",
    "Graduated", // Added Graduated option
    "Bachelor's Degree",
    "Master's Degree",
    "PhD/Doctorate",
  ]

  const courseOptions = [
    "B.Tech/B.E.",
    "B.Sc",
    "B.Com",
    "B.A.",
    "BBA",
    "BCA",
    "M.Tech/M.E.",
    "M.Sc",
    "M.Com",
    "M.A.",
    "MBA",
    "MCA",
    "MBBS",
    "B.Pharma",
    "M.Pharma",
    "Arts",
    "Commerce",
    "Science",
  ]

  const specializationOptions = [
    "Computer Science",
    "Information Technology",
    "Electronics and Communication",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Artificial Intelligence",
    "Data Science",
    "Machine Learning",
    "Cybersecurity",
    "Finance",
    "Marketing",
    "Human Resources",
    "Operations Management",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
  ]

  const [customCourse, setCustomCourse] = useState("")
  const [customSpecialization, setCustomSpecialization] = useState("")
  const [showCourseDropdown, setShowCourseDropdown] = useState(false)
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveEducation = async () => {
    if (isSaving) return

    setIsSaving(true)
    setIsLoading?.(true)

    try {
      console.log("[v0] Saving education details...")
      const result = await updateEducationDetails(formData.email, {
        highestQualification: formData.highestQualification,
        course: formData.course,
        courseType: formData.courseType,
        specialization: formData.specialization,
        university: formData.university,
        startingYear: formData.startingYear,
        passingYear: formData.passingYear,
        certifications: formData.certifications,
      })

      if (result.success) {
        console.log("[v0] Education saved successfully")
        nextStep?.()
      } else {
        alert(result.error || "Failed to save education details")
      }
    } catch (error) {
      console.error("[v0] Error saving education:", error)
      alert("An error occurred while saving education details")
    } finally {
      setIsLoading?.(false)
      setIsSaving(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl">Education & Projects</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Detail your educational background and showcase your key projects.
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Start of Education Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Educational Qualifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="highestQualification">
                Highest Qualification
              </Label>
              <select
                id="highestQualification"
                value={formData.highestQualification}
                onChange={(e) => updateFormData("highestQualification", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
              >
                <option value="">Select qualification</option>
                {qualificationOptions.map((qual) => (
                  <option key={qual} value={qual}>
                    {qual}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="course">
                Course
              </Label>
              <div className="relative">
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => {
                    updateFormData("course", e.target.value)
                    setShowCourseDropdown(true)
                  }}
                  onFocus={() => setShowCourseDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
                  placeholder="Select or type course"
                  className="h-10 text-sm"
                />
                {showCourseDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {courseOptions
                      .filter((course) => course.toLowerCase().includes(formData.course.toLowerCase()))
                      .map((course) => (
                        <button
                          key={course}
                          type="button"
                          onClick={() => {
                            updateFormData("course", course)
                            setShowCourseDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                        >
                          {course}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="courseType">
                Course Type
              </Label>
              <select
                id="courseType"
                value={formData.courseType}
                onChange={(e) => updateFormData("courseType", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
              >
                <option value="">Select type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="online">Online</option>
                <option value="distance">Distance</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="specialization">
                Specialization
              </Label>
              <div className="relative">
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => {
                    updateFormData("specialization", e.target.value)
                    setShowSpecializationDropdown(true)
                  }}
                  onFocus={() => setShowSpecializationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSpecializationDropdown(false), 200)}
                  placeholder="Select or type specialization"
                  className="h-10 text-sm"
                />
                {showSpecializationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {specializationOptions
                      .filter((spec) => spec.toLowerCase().includes(formData.specialization.toLowerCase()))
                      .map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => {
                            updateFormData("specialization", spec)
                            setShowSpecializationDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                        >
                          {spec}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="university">
                University/Board
              </Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => updateFormData("university", e.target.value)}
                placeholder="Eg. University of Mumbai"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="startingYear">
                Starting Year
              </Label>
              <Input
                id="startingYear"
                type="number"
                value={formData.startingYear}
                onChange={(e) => updateFormData("startingYear", e.target.value)}
                placeholder="2018"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="passingYear">
                Passing Year
              </Label>
              <Input
                id="passingYear"
                type="number"
                value={formData.passingYear}
                onChange={(e) => updateFormData("passingYear", e.target.value)}
                placeholder="2022"
                className="h-10 text-sm"
              />
            </div>
          </div>
        </div>
        {/* End of Education Fields */}

        <div className="space-y-4 border-t pt-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Certifications</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                updateFormData("certifications", [
                  ...formData.certifications,
                  { name: "", issuer: "", issueDate: "", expiryDate: "" },
                ])
              }}
            >
              + Add Certification
            </Button>
          </div>

          {formData.certifications.map((cert, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Certification {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateFormData(
                      "certifications",
                      formData.certifications.filter((_, i) => i !== index),
                    )
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Certification Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={cert.name}
                    onChange={(e) => {
                      const updated = [...formData.certifications]
                      updated[index].name = e.target.value
                      updateFormData("certifications", updated)
                    }}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Issuing Organization<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={cert.issuer}
                    onChange={(e) => {
                      const updated = [...formData.certifications]
                      updated[index].issuer = e.target.value
                      updateFormData("certifications", updated)
                    }}
                    placeholder="e.g., Amazon Web Services"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Issue Date<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="month"
                    value={cert.issueDate}
                    onChange={(e) => {
                      const updated = [...formData.certifications]
                      updated[index].issueDate = e.target.value
                      updateFormData("certifications", updated)
                    }}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Expiry Date (Optional)</Label>
                  <Input
                    type="month"
                    value={cert.expiryDate || ""}
                    onChange={(e) => {
                      const updated = [...formData.certifications]
                      updated[index].expiryDate = e.target.value
                      updateFormData("certifications", updated)
                    }}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          {formData.certifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No certifications added yet. Click "Add Certification" to add your professional certifications.
            </p>
          )}
        </div>

        <div className="space-y-4 border-t pt-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Projects</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                updateFormData("projects", [
                  ...formData.projects,
                  { title: "", description: "", role: "", startDate: "", endDate: "", technologies: "" },
                ])
              }}
            >
              + Add Project
            </Button>
          </div>

          {formData.projects.map((project, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Project {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateFormData(
                      "projects",
                      formData.projects.filter((_, i) => i !== index),
                    )
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Project Title<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={project.title}
                    onChange={(e) => {
                      const updated = [...formData.projects]
                      updated[index].title = e.target.value
                      updateFormData("projects", updated)
                    }}
                    placeholder="e.g., E-Commerce Platform Development"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Description<span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={project.description}
                    onChange={(e) => {
                      const updated = [...formData.projects]
                      updated[index].description = e.target.value
                      updateFormData("projects", updated)
                    }}
                    placeholder="Briefly describe the project, your contributions, and achievements"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Your Role<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={project.role}
                      onChange={(e) => {
                        const updated = [...formData.projects]
                        updated[index].role = e.target.value
                        updateFormData("projects", updated)
                      }}
                      placeholder="e.g., Full Stack Developer"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Technologies Used</Label>
                    <Input
                      value={project.technologies || ""}
                      onChange={(e) => {
                        const updated = [...formData.projects]
                        updated[index].technologies = e.target.value
                        updateFormData("projects", updated)
                      }}
                      placeholder="e.g., React, Node.js, MongoDB"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Start Date<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="month"
                      value={project.startDate}
                      onChange={(e) => {
                        const updated = [...formData.projects]
                        updated[index].startDate = e.target.value
                        updateFormData("projects", updated)
                      }}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">End Date</Label>
                    <Input
                      type="month"
                      value={project.endDate || ""}
                      onChange={(e) => {
                        const updated = [...formData.projects]
                        updated[index].endDate = e.target.value
                        updateFormData("projects", updated)
                      }}
                      placeholder="Leave empty if ongoing"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {formData.projects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No projects added yet. Click "Add Project" to showcase your work.
            </p>
          )}
        </div>
        {/* End of Projects Section */}

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" onClick={prevStep} variant="outline" className="rounded-full px-8 bg-transparent h-10">
            Back
          </Button>
          <Button
            onClick={handleSaveEducation} // Save education before moving to next step
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-10"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Step5PersonalAndPreferences({
  formData,
  updateFormData,
  nextStep,
  prevStep,
  setIsLoading,
  isLoading,
}: StepProps) {
  const [showPreferredLocationsDropdown, setShowPreferredLocationsDropdown] = useState(false)
  const [locationSearchTerm, setLocationSearchTerm] = useState("") // Add search term state
  const locationInputRef = useRef<HTMLInputElement>(null) // Add ref for click outside detection

  const indianCities = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Surat",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane",
    "Bhopal",
    "Visakhakhapatnam",
    "Patna",
    "Vadodara",
    "Ghaziabad",
  ]

  const handleAddPreferredLocation = (city: string) => {
    if (!formData.preferredLocations.includes(city)) {
      updateFormData("preferredLocations", [...formData.preferredLocations, city])
    }
    setLocationSearchTerm("") // Clear search after selection
    setShowPreferredLocationsDropdown(false) // Close dropdown after selection
  }

  const handleRemovePreferredLocation = (city: string) => {
    updateFormData(
      "preferredLocations",
      formData.preferredLocations.filter((loc) => loc !== city),
    )
  }

  const handleSaveAndComplete = async () => {
    if (isLoading) return

    setIsLoading?.(true)

    try {
      console.log("[v0] Completing registration with data:", {
        resumeHeadline: formData.resumeHeadline,
        preferredLocations: formData.preferredLocations,
        preferredSalary: formData.preferredSalary,
        languagesKnown: formData.languagesKnown,
        certifications: formData.certifications,
        projects: formData.projects,
        dateOfBirth: formData.dateOfBirth,
        maritalStatus: formData.maritalStatus,
      })

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
      })

      if (result.success) {
        console.log("[v0] Registration completed successfully")
        alert("Registration complete! Please login to continue.")
        window.location.href = "/candidate/login"
      } else {
        console.error("[v0] Registration failed:", result.error)
        alert(result.error || "Failed to complete registration")
        setIsLoading?.(false)
      }
    } catch (error) {
      console.error("[v0] Error completing registration:", error)
      alert("An error occurred while completing registration")
      setIsLoading?.(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl">Personal Details & Preferences</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Share your preferences and personal details to complete your profile.
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Resume Headline */}
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="resumeHeadline">
            Resume Headline
          </Label>
          <Input
            id="resumeHeadline"
            value={formData.resumeHeadline}
            onChange={(e) => updateFormData("resumeHeadline", e.target.value)}
            placeholder="Eg. Experienced Software Engineer with expertise in AI/ML"
            className="h-10 text-sm"
          />
          <p className="text-xs text-gray-500">A brief summary highlighting your key skills and experience.</p>
        </div>

        {/* Preferred Salary */}
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="preferredSalary">
            Expected Salary
          </Label>
          <div className="flex gap-2">
            <select className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>₹</option>
            </select>
            <Input
              id="preferredSalary"
              value={formData.preferredSalary}
              onChange={(e) => updateFormData("preferredSalary", e.target.value)} // Handle formatting in Step 3 if needed, or here
              placeholder="Eg. 10,00,000"
              className="flex-1 h-10 text-sm"
            />
            <span className="flex items-center text-sm text-muted-foreground">per year</span>
          </div>
        </div>

        {/* Preferred Locations */}
        <div className="space-y-2">
          <Label className="text-sm">Preferred Job Locations</Label>
          <div className="relative">
            <Input
              ref={locationInputRef}
              value={locationSearchTerm}
              onChange={(e) => {
                setLocationSearchTerm(e.target.value)
                setShowPreferredLocationsDropdown(true)
              }}
              onFocus={() => setShowPreferredLocationsDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowPreferredLocationsDropdown(false), 200)
              }}
              placeholder="Search for locations..."
              className="h-10 text-sm"
            />
            {formData.preferredLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.preferredLocations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {location}
                    <X
                      className="w-4 h-4 cursor-pointer hover:text-blue-900"
                      onClick={() => handleRemovePreferredLocation(location)}
                    />
                  </span>
                ))}
              </div>
            )}

            {showPreferredLocationsDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {indianCities
                  .filter(
                    (city) =>
                      city.toLowerCase().includes(locationSearchTerm.toLowerCase()) &&
                      !formData.preferredLocations.includes(city),
                  )
                  .slice(0, 10)
                  .map((city) => (
                    <button
                      key={city}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleAddPreferredLocation(city)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                    >
                      {city}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Select up to 3 locations you are interested in.</p>
        </div>

        {/* Availability to Join */}
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="availabilityToJoin">
            When can you join?
          </Label>
          <select
            id="availabilityToJoin"
            value={formData.availabilityToJoin}
            onChange={(e) => updateFormData("availabilityToJoin", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
          >
            <option value="">Select availability</option>
            <option value="immediate">Immediate</option>
            <option value="15-days">Within 15 days</option>
            <option value="1-month">Within 1 month</option>
            <option value="2-months">Within 2 months</option>
            <option value="3-months">Within 3 months</option>
            <option value="more-than-3-months">More than 3 months</option>
          </select>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-4 border-t pt-4 mt-6">
          <h3 className="text-lg font-medium">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="dateOfBirth">
                Date of Birth<span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="h-10 text-sm"
              />
            </div>

            {/* Marital Status */}
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="maritalStatus">
                Marital Status<span className="text-red-500">*</span>
              </Label>
              <select
                id="maritalStatus"
                value={formData.maritalStatus}
                onChange={(e) => updateFormData("maritalStatus", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
              >
                <option value="">Select marital status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
              </select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="gender">
                Gender<span className="text-red-500">*</span>
              </Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => updateFormData("gender", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Languages Known */}
          <div className="space-y-4 border-t pt-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Languages Known</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFormData("languagesKnown", [
                    ...formData.languagesKnown,
                    { language: "", read: false, write: false, speak: false },
                  ])
                }}
              >
                + Add Language
              </Button>
            </div>

            {formData.languagesKnown.map((lang, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm">Language</Label>
                    <Input
                      value={lang.language}
                      onChange={(e) => {
                        const updated = [...formData.languagesKnown]
                        updated[index].language = e.target.value
                        updateFormData("languagesKnown", updated)
                      }}
                      placeholder="e.g., English, Hindi, Tamil"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = formData.languagesKnown.filter((_, i) => i !== index)
                      updateFormData("languagesKnown", updated)
                    }}
                  >
                    Remove
                  </Button>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lang.read}
                      onChange={(e) => {
                        const updated = [...formData.languagesKnown]
                        updated[index].read = e.target.checked
                        updateFormData("languagesKnown", updated)
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Read</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lang.write}
                      onChange={(e) => {
                        const updated = [...formData.languagesKnown]
                        updated[index].write = e.target.checked
                        updateFormData("languagesKnown", updated)
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Write</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lang.speak}
                      onChange={(e) => {
                        const updated = [...formData.languagesKnown]
                        updated[index].speak = e.target.checked
                        updateFormData("languagesKnown", updated)
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Speak</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" onClick={prevStep} variant="outline" className="rounded-full px-8 bg-transparent h-10">
            Back
          </Button>
          <Button
            onClick={handleSaveAndComplete} // Use proper save function
            className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full px-8"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Complete Registration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
