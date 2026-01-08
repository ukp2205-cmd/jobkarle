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
  candidateId: string | null // Added to store candidate ID

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
  startingYear: string // Now removed in favor of passingYear
  passingYear: string
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
    candidateId: null, // Initialize candidateId to null
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
    startingYear: "", // This field is effectively removed from the form logic
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
  const Step4EducationAndProjects = ({ formData, updateFormData, nextStep, prevStep, isLoading }: StepProps) => {
    const [showOtherCourseType, setShowOtherCourseType] = React.useState(false)

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Education Details</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Share your educational background</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Highest Qualification */}
          <div className="space-y-2">
            <Label htmlFor="highestQualification">
              Highest Qualification <span className="text-red-500">*</span>
            </Label>
            <select
              id="highestQualification"
              value={formData.highestQualification}
              onChange={(e) => updateFormData("highestQualification", e.target.value)}
              className="flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
            >
              <option value="">Select qualification</option>
              <option value="10th">10th</option>
              <option value="12th">12th</option>
              <option value="Diploma">Diploma</option>
              <option value="Graduate">Graduate</option>
              <option value="Post Graduate">Post Graduate</option>
              <option value="Doctorate">Doctorate</option>
            </select>
          </div>

          {/* Course and Course Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                placeholder="e.g., B.Tech, MBA, BCA"
                value={formData.course}
                onChange={(e) => updateFormData("course", e.target.value)}
                className="rounded-full h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseType">Course Type</Label>
              <select
                id="courseType"
                value={formData.courseType}
                onChange={(e) => {
                  updateFormData("courseType", e.target.value)
                  setShowOtherCourseType(e.target.value === "Other")
                }}
                className="flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="">Select type</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Distance Learning">Distance Learning</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              placeholder="e.g., Computer Science, Marketing"
              value={formData.specialization}
              onChange={(e) => updateFormData("specialization", e.target.value)}
              className="rounded-full h-10"
            />
          </div>

          {/* University */}
          <div className="space-y-2">
            <Label htmlFor="university">University/Institute</Label>
            <Input
              id="university"
              placeholder="Enter university or institute name"
              value={formData.university}
              onChange={(e) => updateFormData("university", e.target.value)}
              className="rounded-full h-10"
            />
          </div>

          {/* Year Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startingYear">Starting Year</Label>
              <select
                id="startingYear"
                value={formData.startingYear}
                onChange={(e) => updateFormData("startingYear", e.target.value)}
                className="flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="">Select year</option>
                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passingYear">Passing Year</Label>
              <select
                id="passingYear"
                value={formData.passingYear}
                onChange={(e) => updateFormData("passingYear", e.target.value)}
                className="flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="">Select year</option>
                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
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
              onClick={nextStep}
              disabled={isLoading}
            >
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Placeholder for Step5PersonalAndPreferences component
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
  // const Step4EducationCombined = Step4EducationAndProjects // Original assignment kept for reference if needed elsewhere

  const renderStep = () => {
    switch (step) {
      case 1:
        // Renamed Step1Initial to Step1BasicInfo
        return <Step1BasicInfo {...stepProps} />
      case 2:
        return <Step2OTP {...stepProps} />
      case 3:
        // Only render employment step if not a fresher
        // Renamed the component to Step3EmploymentAndSkills for clarity
        return <Step3EmploymentAndSkills {...stepProps} />
      case 4:
        // RENDER STEP 4 EDUCATION HERE
        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-2xl font-bold">Education Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Share your educational background and achievements.</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                {/* Highest Qualification and Course in one row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highestQualification" className="text-sm">
                      Highest Qualification <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="highestQualification"
                      value={formData.highestQualification || ""}
                      onChange={(e) => {
                        updateFormData("highestQualification", e.target.value)
                        // Reset course and specialization when qualification changes
                        updateFormData("course", "")
                        updateFormData("courseType", "")
                        updateFormData("specialization", "")
                      }}
                      className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Qualification</option>
                      <option value="10th">10th</option>
                      <option value="12th">12th</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate/PhD">Doctorate/PhD</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="course" className="text-sm">
                      Course <span className="text-red-500">*</span>
                    </Label>
                    {formData.highestQualification === "10th" || formData.highestQualification === "12th" ? (
                      <select
                        id="course"
                        value={formData.course || ""}
                        onChange={(e) => updateFormData("course", e.target.value)}
                        className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select Stream</option>
                        <option value="Arts">Arts</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Science">Science</option>
                      </select>
                    ) : (
                      <Input
                        id="course"
                        type="text"
                        value={formData.course || ""}
                        onChange={(e) => updateFormData("course", e.target.value)}
                        placeholder="e.g., B.Tech, MBA, M.Sc"
                        className="mt-1 h-10 rounded-full"
                      />
                    )}
                  </div>
                </div>

                {/* Course Type and Specialization in one row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="courseType" className="text-sm">
                      Course Type
                    </Label>
                    <select
                      id="courseType"
                      value={formData.courseType || ""}
                      onChange={(e) => updateFormData("courseType", e.target.value)}
                      className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Distance Learning">Distance Learning</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="specialization" className="text-sm">
                      Specialization
                    </Label>
                    <Input
                      id="specialization"
                      type="text"
                      value={formData.specialization || ""}
                      onChange={(e) => updateFormData("specialization", e.target.value)}
                      placeholder="e.g., Computer Science, Finance"
                      className="mt-1 h-10 rounded-full"
                    />
                  </div>
                </div>

                {/* University and Year */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="university" className="text-sm">
                      University/Board <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="university"
                      type="text"
                      value={formData.university || ""}
                      onChange={(e) => updateFormData("university", e.target.value)}
                      placeholder="Enter university/board name"
                      className="mt-1 h-10 rounded-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="passingYear" className="text-sm">
                      Passing Year <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="passingYear"
                      value={formData.passingYear || ""}
                      onChange={(e) => updateFormData("passingYear", e.target.value)}
                      className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Percentage/Grade */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percentage" className="text-sm">
                      Percentage/CGPA
                    </Label>
                    <Input
                      id="percentage"
                      type="text"
                      value={formData.percentage || ""}
                      onChange={(e) => updateFormData("percentage", e.target.value)}
                      placeholder="e.g., 85% or 8.5 CGPA"
                      className="mt-1 h-10 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
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
                  onClick={nextStep}
                  disabled={isLoading}
                >
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      case 5: // Combined step for preferences
        return <Step5HeadlineAndPreferences {...stepProps} />
      // case 6: // This case is no longer needed due to combining steps
      //   // This case might not be reached if step 5 is combined.
      //   // If it is still needed for some logic, ensure it uses the correct component or redirect.
      //   // For the purpose of this merge, we'll map step 6 to the combined component if needed.
      //   return <Step5HeadlineAndPreferences {...stepProps} />
      default:
        return <Step1BasicInfo {...stepProps} />
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
                      <Check className="w-3 h-3" /> Strong password
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
  const [showCurrentEmploymentForm, setShowCurrentEmploymentForm] = useState<boolean>(
    formData.currentEmployment !== null,
  ) // State to control the visibility of the current employment form

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
          durationTo: "",
          annualSalary: "",
          noticePeriod: "",
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
        updateFormData("workStatus", "experienced") // Assuming if they are not currently employed, they are experienced
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
    industry.toLowerCase().includes(industrySearch.toLowerCase()),
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
    // Add more industries, departments, roles, and job titles as needed
  }

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
    // setShowCityDropdown(true) // Assuming this is for department/role dropdowns, needs review for accurate state management
  }

  const handleRoleCategorySelect = (roleCategory: string) => {
    updateFormData("roleCategory", roleCategory)
    updateFormData("jobRole", "") // Reset job role
  }

  const handleJobRoleSelect = (jobRole: string) => {
    updateFormData("jobRole", jobRole)
  }

  const handleCitySelect = (city: string, state: string) => {
    handleInputChange("current", null, "currentCity", city)
    handleInputChange("current", null, "currentState", state)
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
    // The actual first input field is now within the skills section.
    // Assigning the ref to the skills input.
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [])

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
            <div className="relative">
              <Input
                id="skills"
                type="text"
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value)
                  setShowSkillDropdown(e.target.value.length > 0)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && skillSearch.trim()) {
                    e.preventDefault()
                    if (!formData.skillsYouKnow.includes(skillSearch.trim())) {
                      updateFormData("skillsYouKnow", [...formData.skillsYouKnow, skillSearch.trim()])
                    }
                    setSkillSearch("")
                    setShowSkillDropdown(false)
                  }
                }}
                placeholder="Type to search or add custom skill"
                className="mt-1 h-10 rounded-full"
                ref={firstInputRef}
              />
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
                            if (!formData.skillsYouKnow.includes(skillSearch.trim())) {
                              updateFormData("skillsYouKnow", [...formData.skillsYouKnow, skillSearch.trim()])
                            }
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
              {formData.skillsYouKnow.map((skill) => (
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

            {/* Predefined Skills for Quick Selection */}
            {formData.skillsYouKnow.length === 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Popular skills:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "JavaScript",
                    "Python",
                    "Java",
                    "React",
                    "Node.js",
                    "SQL",
                    "AWS",
                    "Communication",
                    "Leadership",
                    "Project Management",
                  ].map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (!formData.skillsYouKnow.includes(skill)) {
                          updateFormData("skillsYouKnow", [...formData.skillsYouKnow, skill])
                        }
                      }}
                      className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related Skills based on first selected skill */}
            {formData.skillsYouKnow.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Related skills you might know:</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const firstSkill = formData.skillsYouKnow[0].toLowerCase()
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
                      .filter((skill) => !formData.skillsYouKnow.includes(skill))
                      .slice(0, 5)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            if (!formData.skillsYouKnow.includes(skill)) {
                              updateFormData("skillsYouKnow", [...formData.skillsYouKnow, skill])
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
                      companyName: "",
                      currentJobTitle: "",
                      currentCity: "",
                      currentState: "",
                      durationFrom: "",
                      durationTo: "",
                      annualSalary: "",
                      noticePeriod: "",
                      industry: "", // Reset industry
                      department: "", // Reset department
                      roleCategory: "", // Reset roleCategory
                      jobRole: "", // Reset jobRole
                      currentlyEmployed: "yes", // Explicitly set to 'yes'
                    })
                    // updateFormData("workStatus", "experienced") // This line was causing an issue if workStatus was already set to fresher
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

            {formData.currentEmployment !== null && (
              <div className="space-y-4 mt-4">
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
                    />
                  </div>
                </div>

                {/* Current City & State */}
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
                      placeholder="Enter city"
                      className="rounded-full h-10"
                    />
                    {showCityDropdown && formData.currentEmployment?.currentCity && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {indianCities
                          .filter((loc) =>
                            loc.city
                              .toLowerCase()
                              .includes((formData.currentEmployment?.currentCity || "").toLowerCase()),
                          )
                          .map((loc) => (
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
                      className="flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
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
                      onChange={(e) => handleInputChange("current", null, "durationFrom", e.target.value)}
                      className="rounded-full h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationTo">Duration To</Label>
                    <Input
                      id="durationTo"
                      type="month"
                      value={formData.currentEmployment?.durationTo || ""}
                      onChange={(e) => handleInputChange("current", null, "durationTo", e.target.value)}
                      className="rounded-full h-10"
                      placeholder="Leave blank if currently working"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={async () => {
                      console.log("[v0] Saving current employment")
                      try {
                        // Update candidates table with employment data
                        const { createClient } = await import("@/lib/supabase/client")
                        const supabase = createClient()

                        const { error } = await supabase
                          .from("candidates")
                          .update({
                            currently_employed: formData.currentEmployment?.currentlyEmployed,
                            company_name: formData.currentEmployment?.companyName,
                            current_job_title: formData.currentEmployment?.currentJobTitle,
                            current_city: formData.currentEmployment?.currentCity,
                            current_state: formData.currentEmployment?.currentState,
                            duration_from: formData.currentEmployment?.durationFrom,
                            duration_to: formData.currentEmployment?.durationTo,
                            annual_salary: formData.currentEmployment?.annualSalary,
                            notice_period: formData.currentEmployment?.noticePeriod,
                            industry: formData.currentEmployment?.industry,
                            department: formData.currentEmployment?.department,
                            role_category: formData.currentEmployment?.roleCategory,
                            job_role: formData.currentEmployment?.jobRole,
                            employment_history: formData.additionalEmployment,
                            updated_at: new Date().toISOString(),
                          })
                          .eq("id", formData.candidateId as string) // Ensure candidateId is not null

                        if (error) {
                          console.error("[v0] Error saving employment:", error)
                          alert("Failed to save employment details")
                        } else {
                          console.log("[v0] Employment saved successfully")
                          alert("Employment details saved successfully!")
                        }
                      } catch (error) {
                        console.error("[v0] Error:", error)
                        alert("An error occurred while saving")
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 h-10"
                  >
                    Save Current Employment
                  </Button>
                </div>
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
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
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
                      <div>
                        <Label htmlFor={`additionalFromDate-${index}`} className="text-xs">
                          From (MM/YY)
                        </Label>
                        <Input
                          id={`additionalFromDate-${index}`}
                          type="month"
                          value={job.fromDate}
                          onChange={(e) => handleInputChange("additional", index, "fromDate", e.target.value)}
                          placeholder="MM/YY"
                          className="mt-1 h-9 rounded-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`additionalToDate-${index}`} className="text-xs">
                          To (MM/YY)
                        </Label>
                        <Input
                          id={`additionalToDate-${index}`}
                          type="month"
                          value={job.toDate}
                          onChange={(e) => handleInputChange("additional", index, "toDate", e.target.value)}
                          placeholder="MM/YY"
                          className="mt-1 h-9 rounded-full"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdditionalEmployment(index)}
                      className="mt-3 rounded-full text-xs"
                    >
                      Remove
                    </Button>
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
            {/* Industry Field - Autosuggest */}
            <div className="relative">
              <Label htmlFor="industry" className="text-sm">
                Industry <span className="text-red-500">*</span>
              </Label>
              <Input
                id="industry"
                type="text"
                value={formData.industry}
                onChange={(e) => {
                  updateFormData("industry", e.target.value)
                  setShowIndustryDropdown(e.target.value.length > 0)
                  // Reset cascading fields when industry changes
                  updateFormData("department", "")
                  updateFormData("roleCategory", "")
                  updateFormData("jobRole", "")
                }}
                placeholder="Type to search industries"
                className="mt-1 h-10 rounded-full"
              />
              {showIndustryDropdown && formData.industry.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {industries
                    .filter((ind) => ind.toLowerCase().includes(formData.industry.toLowerCase()))
                    .map((ind) => (
                      <div
                        key={ind}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          updateFormData("industry", ind)
                          setShowIndustryDropdown(false)
                        }}
                      >
                        {ind}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Department - Only shows after Industry is selected */}
            {formData.industry && (
              <div>
                <Label htmlFor="department" className="text-sm">
                  Department <span className="text-red-500">*</span>
                </Label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => {
                    updateFormData("department", e.target.value)
                    // Reset child fields
                    updateFormData("roleCategory", "")
                    updateFormData("jobRole", "")
                  }}
                  className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select Department</option>
                  {getDepartments(formData.industry).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Category - Only shows after Department is selected */}
            {formData.department && (
              <div>
                <Label htmlFor="roleCategory" className="text-sm">
                  Role Category <span className="text-red-500">*</span>
                </Label>
                <select
                  id="roleCategory"
                  value={formData.roleCategory}
                  onChange={(e) => {
                    updateFormData("roleCategory", e.target.value)
                    // Reset child field
                    updateFormData("jobRole", "")
                  }}
                  className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select Role Category</option>
                  {getRoles(formData.industry, formData.department).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Job Title - Only shows after Role Category is selected */}
            {formData.roleCategory && (
              <div>
                <Label htmlFor="jobRole" className="text-sm">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <select
                  id="jobRole"
                  value={formData.jobRole}
                  onChange={(e) => updateFormData("jobRole", e.target.value)}
                  className="mt-1 h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select Job Title</option>
                  {getJobTitles(formData.industry, formData.department, formData.roleCategory).map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" className="rounded-full px-8 bg-transparent" onClick={prevStep}>
            Back
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8"
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
