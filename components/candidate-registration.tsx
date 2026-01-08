"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Eye, EyeOff, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createCandidate, checkEmailExists, uploadResume } from "@/app/actions/candidate-actions"
import Link from "next/link"

const getSupabase = () => createClient()

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

  // Placeholder for Step4EducationCombined component
  const Step4EducationAndProjects = ({}: StepProps) => {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Education Details & Projects</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Provide details about your education and projects.</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Education and Projects form fields will go here */}
          <div className="text-center text-muted-foreground">Education and Projects details coming soon...</div>
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" className="rounded-full px-8 bg-transparent" onClick={prevStep}>
              Back
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8" onClick={nextStep}>
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Placeholder for Step5HeadlineAndPreferences component
  const Step5PersonalAndPreferences = ({}: StepProps) => {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Personal Details & Preferences</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Provide your personal details and job preferences.</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Personal details and preferences form fields will go here */}
          <div className="text-center text-muted-foreground">Personal Details & Preferences coming soon...</div>
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" className="rounded-full px-8 bg-transparent" onClick={prevStep}>
              Back
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8" onClick={nextStep}>
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
  const [showCityDropdown, setShowCityDropdown] = useState(false) // This state is used for multiple dropdowns, might need renaming for clarity
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

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [industrySearch, setIndustrySearch] = useState("")

  // Updated industry and department structure to include roles and departments within industries
  const industries = [
    {
      name: "IT Services & Consulting",
      departments: [
        "Software Development",
        "Web Development",
        "Mobile Development",
        "Cloud Services",
        "IT Support",
        "Consulting",
        "System Administration",
        "Network Administration",
      ],
      roles: [
        {
          department: "Software Development",
          category: "Software Development",
          titles: [
            "Software Engineer",
            "Senior Software Engineer",
            "Tech Lead",
            "Principal Engineer",
            "Software Architect",
          ],
        },
        {
          department: "Web Development",
          category: "Web Development",
          titles: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Web Developer"],
        },
        {
          department: "IT Support",
          category: "Customer Service",
          titles: ["IT Support Specialist", "Help Desk Technician"],
        },
      ],
    },
    {
      name: "Software Product",
      departments: [
        "Product Development",
        "Software Engineering",
        "QA/Testing",
        "DevOps",
        "Product Management",
        "Technical Support",
      ],
      roles: [
        {
          department: "Product Development",
          category: "Software Development",
          titles: ["Software Engineer", "Senior Software Engineer"],
        },
        {
          department: "Product Management",
          category: "Product Management",
          titles: ["Product Manager", "Senior Product Manager"],
        },
      ],
    },
    {
      name: "Internet",
      departments: [
        "Digital Marketing",
        "Content Development",
        "Web Development",
        "Product Management",
        "Business Development",
      ],
      roles: [
        {
          department: "Digital Marketing",
          category: "Digital Marketing",
          titles: [
            "Digital Marketing Executive",
            "SEO Specialist",
            "SEM Specialist",
            "Social Media Manager",
            "Head - Digital Marketing",
          ],
        },
        { department: "Product Management", category: "Product Management", titles: ["Product Manager"] },
      ],
    },
    {
      name: "Banking",
      departments: [
        "Retail Banking",
        "Corporate Banking",
        "Investment Banking",
        "Credit & Risk",
        "Operations",
        "Compliance",
        "Customer Service",
      ],
      roles: [
        { department: "Retail Banking", category: "Banking Operations", titles: ["Bank Teller", "Loan Officer"] },
        { department: "Credit & Risk", category: "Risk Management", titles: ["Credit Analyst", "Risk Manager"] },
        { department: "Customer Service", category: "Customer Service", titles: ["Customer Service Representative"] },
      ],
    },
    {
      name: "Financial Services",
      departments: [
        "Financial Analysis",
        "Portfolio Management",
        "Trading",
        "Risk Management",
        "Compliance",
        "Operations",
      ],
      roles: [
        {
          department: "Financial Analysis",
          category: "Financial Analysis",
          titles: ["Financial Analyst", "Senior Financial Analyst"],
        },
        { department: "Risk Management", category: "Risk Management", titles: ["Risk Analyst"] },
      ],
    },
    {
      name: "Insurance",
      departments: [
        "Underwriting",
        "Claims Processing",
        "Sales & Distribution",
        "Actuarial",
        "Risk Management",
        "Customer Service",
      ],
      roles: [
        {
          department: "Underwriting",
          category: "Insurance Underwriting",
          titles: ["Underwriter", "Senior Underwriter"],
        },
        { department: "Claims Processing", category: "Claims Management", titles: ["Claims Adjuster"] },
      ],
    },
    {
      name: "BPO / Call Centre",
      departments: [
        "Customer Service",
        "Technical Support",
        "Sales",
        "Back Office Operations",
        "Quality Assurance",
        "Training",
      ],
      roles: [
        {
          department: "Customer Service",
          category: "Customer Service",
          titles: ["Customer Service Representative", "Call Center Agent"],
        },
        { department: "Technical Support", category: "Technical Support", titles: ["Technical Support Specialist"] },
      ],
    },
    {
      name: "Analytics / KPO / Research",
      departments: [
        "Data Analysis",
        "Business Intelligence",
        "Market Research",
        "Financial Analysis",
        "Research & Development",
      ],
      roles: [
        {
          department: "Data Analysis",
          category: "Data Analysis",
          titles: ["Data Analyst", "Senior Data Analyst", "Analytics Manager", "Data Scientist"],
        },
        { department: "Market Research", category: "Market Research", titles: ["Market Research Analyst"] },
      ],
    },
    {
      name: "Healthcare",
      departments: ["Clinical Services", "Nursing", "Diagnostics", "Pharmacy", "Administration", "Medical Records"],
      roles: [
        {
          department: "Clinical Services",
          category: "Healthcare Professionals",
          titles: ["Doctor", "Nurse Practitioner"],
        },
        { department: "Administration", category: "Healthcare Administration", titles: ["Hospital Administrator"] },
      ],
    },
    {
      name: "Pharmaceutical",
      departments: [
        "Research & Development",
        "Quality Control",
        "Regulatory Affairs",
        "Production",
        "Sales & Marketing",
      ],
      roles: [
        { department: "Research & Development", category: "R&D", titles: ["Research Scientist"] },
        { department: "Sales & Marketing", category: "Pharma Sales", titles: ["Medical Representative"] },
      ],
    },
    {
      name: "Medical Devices",
      departments: [
        "Research & Development",
        "Quality Assurance",
        "Regulatory Affairs",
        "Manufacturing",
        "Sales & Marketing",
      ],
      roles: [
        { department: "Research & Development", category: "R&D", titles: ["R&D Engineer"] },
        { department: "Sales & Marketing", category: "Medical Sales", titles: ["Medical Device Sales Representative"] },
      ],
    },
    {
      name: "Manufacturing",
      departments: ["Production", "Quality Control", "Supply Chain", "Maintenance", "Planning", "Engineering"],
      roles: [
        { department: "Production", category: "Operations", titles: ["Production Supervisor", "Plant Manager"] },
        { department: "Engineering", category: "Engineering", titles: ["Mechanical Engineer", "Electrical Engineer"] },
      ],
    },
    {
      name: "Automobile",
      departments: [
        "Design & Development",
        "Manufacturing",
        "Quality Control",
        "Sales & Marketing",
        "After Sales Service",
      ],
      roles: [
        {
          department: "Design & Development",
          category: "Automotive Engineering",
          titles: ["Automotive Design Engineer"],
        },
        { department: "Sales & Marketing", category: "Automotive Sales", titles: ["Car Sales Executive"] },
      ],
    },
    {
      name: "Consumer Electronics",
      departments: [
        "Product Development",
        "Manufacturing",
        "Quality Control",
        "Sales & Marketing",
        "Technical Support",
      ],
      roles: [
        {
          department: "Product Development",
          category: "Electronics Engineering",
          titles: ["Product Development Engineer"],
        },
        { department: "Sales & Marketing", category: "Sales", titles: ["Sales Associate"] },
      ],
    },
    {
      name: "FMCG",
      departments: ["Sales & Marketing", "Supply Chain", "Production", "Quality Control", "Brand Management"],
      roles: [
        { department: "Sales & Marketing", category: "Sales", titles: ["Sales Executive", "Field Sales Manager"] },
        {
          department: "Brand Management",
          category: "Brand Management",
          titles: ["Brand Manager", "Senior Brand Manager", "Brand Head"],
        },
      ],
    },
    {
      name: "Retail",
      departments: [
        "Store Operations",
        "Merchandising",
        "Visual Merchandising",
        "Customer Service",
        "Inventory Management",
      ],
      roles: [
        {
          department: "Store Operations",
          category: "Retail Operations",
          titles: ["Store Manager", "Assistant Store Manager"],
        },
        { department: "Customer Service", category: "Customer Service", titles: ["Retail Associate"] },
      ],
    },
    {
      name: "E-commerce",
      departments: ["Operations", "Marketing", "Customer Service", "Logistics", "Product Management", "Technology"],
      roles: [
        { department: "Operations", category: "Operations", titles: ["E-commerce Operations Manager"] },
        { department: "Marketing", category: "Digital Marketing", titles: ["E-commerce Marketing Specialist"] },
      ],
    },
    {
      name: "Telecommunications",
      departments: ["Network Operations", "Customer Service", "Sales", "Technical Support", "IT Infrastructure"],
      roles: [
        { department: "Network Operations", category: "Network Engineering", titles: ["Network Engineer"] },
        { department: "Customer Service", category: "Customer Service", titles: ["Telecom Customer Support"] },
      ],
    },
    {
      name: "Media & Entertainment",
      departments: ["Content Creation", "Production", "Marketing", "Distribution", "Digital Media"],
      roles: [
        { department: "Content Creation", category: "Content", titles: ["Content Creator", "Scriptwriter"] },
        { department: "Marketing", category: "Marketing", titles: ["Marketing Manager"] },
      ],
    },
    {
      name: "Education",
      departments: ["Teaching", "Administration", "Curriculum Development", "Student Services", "IT Support"],
      roles: [
        { department: "Teaching", category: "Teaching", titles: ["Teacher", "Professor"] },
        { department: "Administration", category: "Educational Administration", titles: ["School Administrator"] },
      ],
    },
    {
      name: "Real Estate",
      departments: ["Sales", "Marketing", "Property Management", "Project Management", "Legal & Compliance"],
      roles: [
        { department: "Sales", category: "Real Estate Sales", titles: ["Real Estate Agent"] },
        { department: "Property Management", category: "Property Management", titles: ["Property Manager"] },
      ],
    },
    {
      name: "Construction",
      departments: ["Project Management", "Civil Engineering", "Quality Control", "Safety", "Procurement"],
      roles: [
        {
          department: "Project Management",
          category: "Construction Management",
          titles: ["Project Manager", "Site Engineer"],
        },
        { department: "Civil Engineering", category: "Engineering", titles: ["Civil Engineer"] },
      ],
    },
    {
      name: "Travel & Tourism",
      departments: ["Sales & Reservations", "Operations", "Tour Operations", "Customer Service", "Marketing"],
      roles: [
        { department: "Sales & Reservations", category: "Travel Sales", titles: ["Travel Agent"] },
        { department: "Tour Operations", category: "Tour Management", titles: ["Tour Operator"] },
      ],
    },
    {
      name: "Hospitality",
      departments: ["Front Office", "Food & Beverage", "Housekeeping", "Kitchen", "Sales & Marketing"],
      roles: [
        { department: "Front Office", category: "Hotel Management", titles: ["Front Desk Manager"] },
        { department: "Food & Beverage", category: "Culinary", titles: ["Chef", "F&B Manager"] },
      ],
    },
    {
      name: "Logistics & Supply Chain",
      departments: ["Warehousing", "Transportation", "Inventory Management", "Procurement", "Supply Planning"],
      roles: [
        { department: "Warehousing", category: "Logistics Operations", titles: ["Warehouse Manager"] },
        { department: "Transportation", category: "Transportation Management", titles: ["Logistics Coordinator"] },
      ],
    },
    {
      name: "Oil & Gas",
      departments: ["Exploration", "Production", "Refining", "Operations", "Engineering", "Safety"],
      roles: [
        { department: "Production", category: "Oil & Gas Operations", titles: ["Field Operations Manager"] },
        { department: "Engineering", category: "Petroleum Engineering", titles: ["Petroleum Engineer"] },
      ],
    },
    {
      name: "Power & Energy",
      departments: ["Operations", "Maintenance", "Engineering", "Project Management", "Safety"],
      roles: [
        { department: "Operations", category: "Power Plant Operations", titles: ["Plant Operator"] },
        { department: "Engineering", category: "Power Systems Engineering", titles: ["Power Systems Engineer"] },
      ],
    },
    {
      name: "Government / PSU",
      departments: ["Administration", "Public Relations", "Finance", "Human Resources", "Technical Services"],
      roles: [
        { department: "Administration", category: "Public Administration", titles: ["Administrative Officer"] },
        { department: "Finance", category: "Government Finance", titles: ["Accountant"] },
      ],
    },
    {
      name: "NGO / Non-Profit",
      departments: ["Program Management", "Fund Raising", "Communications", "Field Operations", "Administration"],
      roles: [
        { department: "Program Management", category: "Program Management", titles: ["Program Manager"] },
        { department: "Fund Raising", category: "Fundraising", titles: ["Fundraiser"] },
      ],
    },
    {
      name: "Legal",
      departments: ["Corporate Law", "Litigation", "Compliance", "Legal Advisory", "Contracts"],
      roles: [
        { department: "Corporate Law", category: "Corporate Law", titles: ["Corporate Lawyer"] },
        { department: "Litigation", category: "Litigation", titles: ["Litigation Lawyer"] },
      ],
    },
  ]

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
    { city: "Lucknow", state: "Uttar Pradesh" },
    { city: "Kanpur", state: "Uttar Pradesh" },
    { city: "Nagpur", state: "Maharashtra" },
    { city: "Indore", state: "Madhya Pradesh" },
    { city: "Thane", state: "Maharashtra" },
    { city: "Bhopal", state: "Madhya Pradesh" },
    { city: "Visakhapatnam", state: "Andhra Pradesh" },
  ]

  const handleInputChange = (type: "current" | "additional", index: number | null, field: string, value: string) => {
    if (type === "current") {
      updateFormData("currentEmployment", {
        ...(formData.currentEmployment || {
          currentlyEmployed: "yes",
          companyName: "",
          currentJobTitle: "",
          currentCity: "",
          currentState: "",
          durationFrom: "",
          durationTo: "",
          annualSalary: "",
          noticePeriod: "",
        }),
        [field]: value,
      })
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
            fromDate: "",
            toDate: "",
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
    if (!formData.skillsYouKnow.includes(skill.skill_name)) {
      updateFormData("skillsYouKnow", [...formData.skillsYouKnow, skill.skill_name])
    }
    setSkillSearch("")
    setShowSkillDropdown(false)
  }

  const removeSkill = (skillToRemove: string) => {
    updateFormData(
      "skillsYouKnow",
      formData.skillsYouKnow.filter((skill) => skill !== skillToRemove),
    )
  }

  const handleSaveStep3 = async () => {
    if (isSaving) return
    setIsSaving(true)
    setIsLoading?.(true)

    try {
      // Prepare data for saving (consider what needs to be saved to backend)
      const dataToSave = {
        totalExperienceYears: formData.totalExperienceYears,
        totalExperienceMonths: formData.totalExperienceMonths,
        skillsYouKnow: formData.skillsYouKnow,
        // Include currentEmployment and additionalEmployment if they need to be directly saved here,
        // or if they are part of a larger candidate profile update.
        currentEmployment: formData.currentEmployment,
        additionalEmployment: formData.additionalEmployment,
        industry: formData.industry,
        department: formData.department,
        roleCategory: formData.roleCategory,
        jobRole: formData.jobRole,
      }

      // In a real application, you would call an API here to save this data.
      // For this example, we'll assume it's part of the overall registration process
      // and will be saved with other steps, or you can add a specific API call.

      console.log("Step 3 data saved (simulated):", dataToSave)
      nextStep()
    } catch (error) {
      console.error("Error saving Step 3 data:", error)
      alert("Failed to save employment details. Please try again.")
    } finally {
      setIsSaving(false)
      setIsLoading?.(false)
    }
  }

  const filteredIndustries = industries.filter((industry) =>
    industry.name.toLowerCase().includes(industrySearch.toLowerCase()),
  )

  const selectedIndustryData = industries.find((ind) => ind.name === formData.industry)
  const departmentsInSelectedIndustry = selectedIndustryData?.departments || []

  const selectedDepartmentData = selectedIndustryData?.roles.find((role) => role.department === formData.department)
  // This line was originally trying to get role categories but was incorrectly using `titles`
  // const roleCategoriesInSelectedDepartment = selectedDepartmentData?.titles || [];

  // Extract unique role categories from the selected department's roles
  const uniqueRoleCategories =
    selectedDepartmentData?.titles.reduce((acc, role) => {
      const category = selectedIndustryData?.roles.find((r) => r.titles.includes(role))?.category
      if (category && !acc.includes(category)) {
        acc.push(category)
      }
      return acc
    }, [] as string[]) || []

  // This line was incorrect as it was trying to find a title in the `titles` array as if it were a single role object
  // const selectedCategoryData = selectedDepartmentData?.titles.find(title => title === formData.jobRole);
  // Correctly get job roles based on department and role category
  const jobRolesInSelectedCategory =
    selectedIndustryData?.roles
      .filter((role) => role.department === formData.department && uniqueRoleCategories.includes(role.category))
      .flatMap((role) => role.titles.filter((title) => title.toLowerCase().includes(formData.jobRole.toLowerCase()))) ||
    []

  const handleIndustrySelect = (industryName: string) => {
    updateFormData("industry", industryName)
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
    setShowCityDropdown(true) // Assuming this is for department/role dropdowns, needs review for accurate state management
  }

  const handleRoleCategorySelect = (roleCategory: string) => {
    updateFormData("roleCategory", roleCategory)
    updateFormData("jobRole", "") // Reset job role
  }

  const handleJobRoleSelect = (jobRole: string) => {
    updateFormData("jobRole", jobRole)
  }

  const handleCitySelect = (city: string, state: string) => {
    updateFormData("currentCity", city)
    updateFormData("currentState", state)
    setShowCityDropdown(false)
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
  const firstInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 md:p-8">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-2xl font-bold">Employment Details & Skills</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Tell us about your experience and the skills you possess.</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Experience */}
          <div>
            <Label htmlFor="totalExperienceYears" className="text-sm">
              Total Experience
            </Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 relative">
                <Input
                  id="totalExperienceYears"
                  type="text"
                  value={formData.totalExperienceYears}
                  onChange={(e) => handleTotalExperienceChange("years", e.target.value)}
                  placeholder="Years"
                  className="h-10 rounded-lg pl-3"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Years</span>
              </div>
              <div className="flex-1 relative">
                <Input
                  id="totalExperienceMonths"
                  type="text"
                  value={formData.totalExperienceMonths}
                  onChange={(e) => handleTotalExperienceChange("months", e.target.value)}
                  placeholder="Months"
                  className="h-10 rounded-lg pl-3"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Months</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              For example, if you have 2 years and 5 months of experience, enter 2 and 5.
            </p>
          </div>

          {/* Industry */}
          <div className="relative">
            <Label htmlFor="industry" className="text-sm">
              Industry<span className="text-red-500">*</span>
            </Label>
            <Input
              id="industry"
              type="text"
              value={formData.industry}
              onChange={(e) => {
                updateFormData("industry", e.target.value)
                setIndustrySearch(e.target.value) // Update search term for filtering
              }}
              onFocus={() => setShowIndustryDropdown(true)}
              placeholder="Select your industry"
              className="mt-1 h-10 rounded-lg"
            />
            {showIndustryDropdown && filteredIndustries.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredIndustries.map((industry) => (
                  <div
                    key={industry.name}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleIndustrySelect(industry.name)}
                  >
                    {industry.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department */}
          <div className="relative">
            <Label htmlFor="department" className="text-sm">
              Department<span className="text-red-500">*</span>
            </Label>
            <Input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => handleDepartmentSelect(e.target.value)}
              onFocus={() => {
                if (formData.industry) setShowCityDropdown(true) // Assuming this meant to toggle a department/role dropdown
              }}
              placeholder={formData.industry ? "Select your department" : "Select industry first"}
              disabled={!formData.industry}
              className="mt-1 h-10 rounded-lg"
            />
            {formData.industry && showCityDropdown && departmentsInSelectedIndustry.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {departmentsInSelectedIndustry.map((dept) => (
                  <div
                    key={dept}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleDepartmentSelect(dept)}
                  >
                    {dept}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Category */}
          <div className="relative">
            <Label htmlFor="roleCategory" className="text-sm">
              Role Category<span className="text-red-500">*</span>
            </Label>
            <Input
              id="roleCategory"
              type="text"
              value={formData.roleCategory}
              onChange={(e) => handleRoleCategorySelect(e.target.value)}
              onFocus={() => {
                if (formData.department) setShowCityDropdown(true) // Assuming this meant to toggle a role category dropdown
              }}
              placeholder={formData.department ? "Select your role category" : "Select department first"}
              disabled={!formData.department}
              className="mt-1 h-10 rounded-lg"
            />
            {formData.department && showCityDropdown && uniqueRoleCategories.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {uniqueRoleCategories.map((category) => (
                  <div
                    key={category}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleRoleCategorySelect(category)}
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job Role */}
          <div className="relative">
            <Label htmlFor="jobRole" className="text-sm">
              Job Role<span className="text-red-500">*</span>
            </Label>
            <Input
              id="jobRole"
              type="text"
              value={formData.jobRole}
              onChange={(e) => handleJobRoleSelect(e.target.value)}
              onFocus={() => {
                if (formData.roleCategory) setShowCityDropdown(true) // Assuming this meant to toggle a job role dropdown
              }}
              placeholder={formData.roleCategory ? "Select your job role" : "Select role category first"}
              disabled={!formData.roleCategory}
              className="mt-1 h-10 rounded-lg"
            />
            {formData.roleCategory && showCityDropdown && jobRolesInSelectedCategory.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {jobRolesInSelectedCategory.map((role) => (
                  <div
                    key={role}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleJobRoleSelect(role)}
                  >
                    {role}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Employment Details (if experienced) */}
          {formData.workStatus === "experienced" && (
            <>
              {/* Company Name */}
              <div>
                <Label htmlFor="currentCompanyName" className="text-sm">
                  Current Company Name
                </Label>
                <Input
                  id="currentCompanyName"
                  type="text"
                  value={formData.currentEmployment?.companyName || ""}
                  onChange={(e) => handleInputChange("current", null, "companyName", e.target.value)}
                  placeholder="Enter company name"
                  className="mt-1 h-10 rounded-lg"
                />
              </div>

              {/* Current Job Title */}
              <div>
                <Label htmlFor="currentJobTitle" className="text-sm">
                  Current Job Title
                </Label>
                <Input
                  id="currentJobTitle"
                  type="text"
                  value={formData.currentEmployment?.currentJobTitle || ""}
                  onChange={(e) => handleInputChange("current", null, "currentJobTitle", e.target.value)}
                  placeholder="Enter job title"
                  className="mt-1 h-10 rounded-lg"
                />
              </div>

              {/* Current City & State */}
              <div className="relative">
                <Label htmlFor="currentCity" className="text-sm">
                  Current Location (City, State)
                </Label>
                <Input
                  id="currentCity"
                  type="text"
                  value={`${formData.currentEmployment?.currentCity || ""}${formData.currentEmployment?.currentCity && formData.currentEmployment?.currentState ? ", " : ""}${formData.currentEmployment?.currentState || ""}`}
                  onChange={(e) => {
                    const [city, state] = e.target.value.split(",").map((s) => s.trim())
                    handleInputChange("current", null, "currentCity", city)
                    handleInputChange("current", null, "currentState", state)
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder="Enter city and state"
                  className="mt-1 h-10 rounded-lg"
                />
                {showCityDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {indianCities.map((loc) => (
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

              {/* Duration From */}
              <div>
                <Label htmlFor="durationFrom" className="text-sm">
                  Duration From (MM/YY)
                </Label>
                <Input
                  id="durationFrom"
                  type="text"
                  value={formData.currentEmployment?.durationFrom || ""}
                  onChange={(e) => handleInputChange("current", null, "durationFrom", e.target.value)}
                  placeholder="MM/YY"
                  className="mt-1 h-10 rounded-lg"
                />
              </div>

              {/* Duration To */}
              <div>
                <Label htmlFor="durationTo" className="text-sm">
                  Duration To (MM/YY)
                </Label>
                <Input
                  id="durationTo"
                  type="text"
                  value={formData.currentEmployment?.durationTo || ""}
                  onChange={(e) => handleInputChange("current", null, "durationTo", e.target.value)}
                  placeholder="MM/YY"
                  className="mt-1 h-10 rounded-lg"
                />
              </div>

              {/* Annual Salary */}
              <div>
                <Label htmlFor="annualSalary" className="text-sm">
                  Annual Salary (INR)
                </Label>
                <Input
                  id="annualSalary"
                  type="text"
                  value={formData.currentEmployment?.annualSalary || ""}
                  onChange={(e) =>
                    handleInputChange("current", null, "annualSalary", formatIndianNumber(e.target.value))
                  }
                  placeholder="Enter salary"
                  className="mt-1 h-10 rounded-lg"
                />
              </div>

              {/* Notice Period */}
              <div>
                <Label htmlFor="noticePeriod" className="text-sm">
                  Notice Period
                </Label>
                <Input
                  id="noticePeriod"
                  type="text"
                  value={formData.currentEmployment?.noticePeriod || ""}
                  onChange={(e) => handleInputChange("current", null, "noticePeriod", e.target.value)}
                  placeholder="e.g., 30 days, 60 days"
                  className="mt-1 h-10 rounded-lg"
                />
              </div>
            </>
          )}

          {/* Skills You Know */}
          <div className="md:col-span-2 relative">
            <Label htmlFor="skillsYouKnow" className="text-sm">
              Skills You Know
            </Label>
            <Input
              id="skillsYouKnow"
              type="text"
              value={skillSearch}
              onChange={(e) => {
                setSkillSearch(e.target.value)
                setShowSkillDropdown(true)
              }}
              onFocus={() => setShowSkillDropdown(true)}
              placeholder="Search and add skills"
              className="mt-1 h-10 rounded-lg"
              ref={firstInputRef} // Assign ref to the first input field
            />
            {showSkillDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {loadingSkills ? (
                  <div className="px-4 py-2 text-gray-500">Loading skills...</div>
                ) : allSkills.length === 0 ? (
                  <div className="px-4 py-2 text-gray-500">No skills found.</div>
                ) : (
                  allSkills
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
                    ))
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skillsYouKnow.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 font-semibold hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Additional Employment History (if experienced) */}
          {formData.workStatus === "experienced" && (
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm">Additional Employment History</Label>
                <Button variant="outline" onClick={addAdditionalEmployment} className="h-8 px-3 bg-transparent">
                  Add Job
                </Button>
              </div>
              {formData.additionalEmployment.map((job, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4 last:mb-0">
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
                        className="mt-1 h-9 rounded-lg"
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
                        className="mt-1 h-9 rounded-lg"
                      />
                    </div>
                    {/* From Date */}
                    <div>
                      <Label htmlFor={`additionalFromDate-${index}`} className="text-xs">
                        From (MM/YY)
                      </Label>
                      <Input
                        id={`additionalFromDate-${index}`}
                        type="text"
                        value={job.fromDate}
                        onChange={(e) => handleInputChange("additional", index, "fromDate", e.target.value)}
                        placeholder="MM/YY"
                        className="mt-1 h-9 rounded-lg"
                      />
                    </div>
                    {/* To Date */}
                    <div>
                      <Label htmlFor={`additionalToDate-${index}`} className="text-xs">
                        To (MM/YY)
                      </Label>
                      <Input
                        id={`additionalToDate-${index}`}
                        type="text"
                        value={job.toDate}
                        onChange={(e) => handleInputChange("additional", index, "toDate", e.target.value)}
                        placeholder="MM/YY"
                        className="mt-1 h-9 rounded-lg"
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAdditionalEmployment(index)}
                    className="mt-3"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" className="rounded-full px-8 bg-transparent" onClick={prevStep}>
            Back
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
            onClick={handleSaveStep3}
            disabled={isSaving || isLoading}
          >
            {isSaving || isLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
