"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Briefcase,
  Users,
  FileText,
  HelpCircle,
  Settings,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Info,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createJobPosting } from "@/app/actions/job-posting-actions"
import { getActiveCredits, type CreditBalance } from "@/app/actions/credits-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import HiringForSelectionModal from "@/components/hiring-for-selection-modal"
import { RichTextEditor } from "@/components/rich-text-editor"
import { searchCities } from "@/app/actions/location-actions"
import { searchSkills } from "@/app/actions/skill-actions" // Import searchSkills
import { searchIndustries } from "@/app/actions/industry-actions" // Import searchIndustries
import { getQualifications, type Qualification } from "@/app/actions/qualification-actions"
import { getTeamMemberSuggestions, saveTeamMemberEmail } from "@/app/actions/team-member-actions"

const steps = [
  { id: 1, name: "Job details", icon: Briefcase },
  { id: 2, name: "Preferred candidate details", icon: Users },
  { id: 3, name: "Job description", icon: FileText },
  { id: 4, name: "Screening questions", icon: HelpCircle },
  { id: 5, name: "Advanced options", icon: Settings },
]

const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  " Lucknow",
]

interface JobPostingFormProps {
  jobType?: string
  employerId: string // Added employerId to the interface
  logoUrl?: string // Company logo URL
}

export function JobPostingForm({ employerId, jobType, logoUrl }: JobPostingFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [showHiringForModal, setShowHiringForModal] = useState(true)
  const [hiringForType, setHiringForType] = useState<"own_company" | "client">("own_company")
  const [employerCompanyName, setEmployerCompanyName] = useState("")
  const [credits, setCredits] = useState<CreditBalance | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)

  const [filteredCities, setFilteredCities] = useState<string[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]) // State for skill suggestions
  const [industriesSuggestions, setIndustriesSuggestions] = useState<string[]>([]) // State for industry suggestions
  const [industryInput, setIndustryInput] = useState("") // State for industry input
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [loadingQualifications, setLoadingQualifications] = useState(true)
  const [specializationOptions, setSpecializationOptions] = useState<string[]>([])
  const [educationNameOptions, setEducationNameOptions] = useState<string[]>([])
  const [popularSkills, setPopularSkills] = useState<string[]>([])
  const [relatedSkills, setRelatedSkills] = useState<string[]>([])

  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)

  const [formData, setFormData] = useState<any>({
    // Job Details (Step 1)
    companyName: "",
    hiringForType: "own_company",
    hiringForCompanyName: "",
    jobTitle: "",
    category: jobType || "classified",
    employmentType: "",
    shifts: "",
    workMode: "",
    jobLocations: [],
    minExperience: "",
    maxExperience: "",
    minSalary: "",
    maxSalary: "",
    salaryRange: "",
    openings: "",
    teamMembers: [],
    hideCompanyInfo: false, // Added for consistency
    includeRelocation: false, // Added for consistency

    // Preferred Candidate Details (Step 2)
    requiredSkills: [],
    educationalQualifications: "",
    specialization: "", // Added specialization field
    educationName: "",
    candidateIndustries: "",
    videoProfileRequired: false,

    // Job Description (Step 3)
    jobDescription: "",
    profileHeadline: "",
    roleDescription: "",
    keyResponsibilities: "",
    requiredQualifications: "",
    perks: [],
    customPerks: "",

    // Diversity Hiring (Step 3.5)
    diversityHiring: "",

    // Screening Questions (Step 4)
    screeningQuestions: [],

    // Advanced Options (Step 5)
    isWalkIn: false,
    referenceCode: "",
    enableAutoRefresh: false,
    refreshFrequency: "",
    refreshDuration: "",
    emailNotificationPreference: "",
  })
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [locationInput, setLocationInput] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skillDuplicateError, setSkillDuplicateError] = useState("")
  const [questionInput, setQuestionInput] = useState("")
  const [teamMemberEmail, setTeamMemberEmail] = useState("")

  const [showCandidateProfile, setShowCandidateProfile] = useState(false)
  const [showPerks, setShowPerks] = useState(false)
  const [showReferenceCode, setShowReferenceCode] = useState(false)
  const [showAutoRefresh, setShowAutoRefresh] = useState(false)

  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const getJobTypeLabel = () => {
    switch (jobType) {
      case "premium":
        return "Premium Job"
      case "classified":
        return "Classified Job"
      case "internship":
        return "Internship"
      default:
        return "Standard Job"
    }
  }

  useEffect(() => {
    loadCreditBalance()
  }, [employerId])

  useEffect(() => {
    if (jobType) {
      setFormData((prev: any) => ({ ...prev, category: jobType }))
    }
  }, [jobType])

  useEffect(() => {
    const loadQualifications = async () => {
      setLoadingQualifications(true)
      const data = await getQualifications()
      setQualifications(data)
      setLoadingQualifications(false)
    }
    loadQualifications()
    loadPopularSkills()
  }, [])

  useEffect(() => {
    if (formData.educationalQualifications) {
      const selectedQual = qualifications.find(
        (q) => q.level.toLowerCase().replace(/\s+/g, "-") === formData.educationalQualifications,
      )
      setSpecializationOptions(selectedQual?.specializations || [])
      setEducationNameOptions(selectedQual?.education_names || [])
    } else {
      setSpecializationOptions([])
      setEducationNameOptions([])
    }
  }, [formData.educationalQualifications, qualifications])

  const loadCreditBalance = async () => {
    setLoadingCredits(true)
    const balance = await getActiveCredits(employerId)
    setCredits(balance)
    setLoadingCredits(false)
  }

  useEffect(() => {
    const fetchEmployerInfo = async () => {
      try {
        const response = await fetch("/api/employer-session")
        if (response.ok) {
          const data = await response.json()
          setEmployerCompanyName(data.companyName || "")

          // If hiring for own company, pre-fill company name
          if (hiringForType === "own_company") {
            setFormData((prev: any) => ({
              ...prev,
              companyName: data.companyName || "",
            }))
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching employer info:", error)
      }
    }
    fetchEmployerInfo()
  }, [hiringForType])

  const formatIndianNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "")
    if (!digits) return ""
    const num = Number.parseInt(digits)
    return num.toLocaleString("en-IN")
  }

  const handleSalaryChange = (field: "minSalary" | "maxSalary", value: string) => {
    const numberValue = convertLacsToNumber(value)
    setFormData({ ...formData, [field]: numberValue })
  }

  const salaryOptions = [
    "1lac",
    "1.25lac",
    "1.5lac",
    "1.75lac",
    "2lac",
    "2.25lac",
    "2.5lac",
    "2.75lac",
    "3lac",
    "3.25lac",
    "3.5lac",
    "3.75lac",
    "4lac",
    "4.5lac",
    "5lac",
    "6lac",
    "7lac",
    "8lac",
    "9lac",
    "10lac",
    "12lac",
    "15lac",
    "20lac",
    "25lac",
    "30lac",
    "40lac",
    "50lac",
  ]

  const convertLacsToNumber = (lacsValue: string): string => {
    const numLacs = Number.parseFloat(lacsValue.replace("lac", "").replace("lacs", ""))
    return (numLacs * 100000).toString()
  }

  const convertNumberToLacs = (numberValue: string): string => {
    if (!numberValue) return ""
    const numValue = Number.parseInt(numberValue)
    const lacs = numValue / 100000
    return lacs === Math.floor(lacs) ? `${Math.floor(lacs)}lac` : `${lacs}lac`
  }

  const handleSalaryRangeChange = (value: string) => {
    const ranges: { [key: string]: { min: string; max: string } } = {
      "1-1.25": { min: "100000", max: "125000" },
      "1.25-1.5": { min: "125000", max: "150000" },
      "1.5-1.75": { min: "150000", max: "175000" },
      "1.75-2": { min: "175000", max: "200000" },
      "2-2.25": { min: "200000", max: "225000" },
      "2.25-2.5": { min: "225000", max: "250000" },
      "2.5-2.75": { min: "250000", max: "275000" },
      "2.75-3": { min: "275000", max: "300000" },
      "3-3.5": { min: "300000", max: "350000" },
      "3.5-4": { min: "350000", max: "400000" },
      "4-4.5": { min: "400000", max: "450000" },
      "4.5-5": { min: "450000", max: "500000" },
      "5-6": { min: "500000", max: "600000" },
      "6-7": { min: "600000", max: "700000" },
      "7-8": { min: "700000", max: "800000" },
      "8-9": { min: "800000", max: "900000" },
      "9-10": { min: "900000", max: "1000000" },
      "10-12": { min: "1000000", max: "1200000" },
      "12-15": { min: "1200000", max: "1500000" },
      "15-20": { min: "1500000", max: "2000000" },
      "20-25": { min: "2000000", max: "2500000" },
      "25+": { min: "2500000", max: "5000000" },
    }

    const selectedRange = ranges[value]
    if (selectedRange) {
      setFormData({
        ...formData,
        salaryRange: value,
        minSalary: selectedRange.min,
        maxSalary: selectedRange.max,
      })
    }
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        const isValid = !!(
          (
            formData.companyName &&
            formData.jobTitle &&
            formData.category &&
            formData.employmentType &&
            formData.workMode &&
            formData.jobLocations.length > 0 &&
            formData.minExperience !== "" &&
            formData.maxExperience !== "" &&
            formData.minSalary && // Check for minSalary
            formData.maxSalary
          ) // Check for maxSalary // Ensure salaryRange is selected
        )
        console.log("[v0] Step 1 validation:", {
          isValid,
          companyName: !!formData.companyName,
          jobTitle: !!formData.jobTitle,
          category: !!formData.category,
          employmentType: !!formData.employmentType,
          workMode: !!formData.workMode,
          jobLocations: formData.jobLocations.length,
          minExperience: formData.minExperience,
          maxExperience: formData.maxExperience,
          minSalary: !!formData.minSalary,
          maxSalary: !!formData.maxSalary,
        })
        return isValid
      case 2:
        return !!(formData.requiredSkills.length > 0 && formData.educationalQualifications)
      case 3:
        return !!(formData.jobDescription && formData.jobDescription.length >= 50)
      case 4:
        return true // Optional step
      case 5:
        return true // Optional step
      default:
        return false
    }
  }

  const handleNextStep = () => {
    if (isStepValid(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep])
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId === currentStep) return
    if (stepId < currentStep || completedSteps.includes(stepId - 1)) {
      setCurrentStep(stepId)
    }
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addLocation = (location: string) => {
    if (location && !formData.jobLocations.includes(location) && formData.jobLocations.length < 3) {
      setFormData({ ...formData, jobLocations: [...formData.jobLocations, location] })
      setLocationInput("")
    }
  }

  const removeLocation = (location: string) => {
    setFormData({
      ...formData,
      jobLocations: formData.jobLocations.filter((loc: string) => loc !== location),
    })
  }

  const loadPopularSkills = async () => {
    try {
      const response = await searchSkills("")
      if (response.success && response.skills && Array.isArray(response.skills)) {
        const topSkills = response.skills.slice(0, 15).map((skill: any) => skill.skill_name)
        setPopularSkills(topSkills)
      }
    } catch (error) {
      console.error("Error loading popular skills:", error)
    }
  }

  const fetchRelatedSkills = async (addedSkill: string) => {
    try {
      const response = await searchSkills(addedSkill)
      if (response.success && response.skills && Array.isArray(response.skills)) {
        const related = response.skills
          .slice(0, 10)
          .map((skill: any) => skill.skill_name)
          .filter(
            (skill: string) =>
              skill.toLowerCase() !== addedSkill.toLowerCase() && !formData.requiredSkills.includes(skill),
          )
        setRelatedSkills(related)
      }
    } catch (error) {
      console.error("Error fetching related skills:", error)
    }
  }

  const addSkill = () => {
    if (skillInput && formData.requiredSkills.includes(skillInput)) {
      setSkillDuplicateError("Skill already added")
      setTimeout(() => setSkillDuplicateError(""), 3000)
      return
    }

    if (skillInput && !formData.requiredSkills.includes(skillInput) && formData.requiredSkills.length < 10) {
      setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, skillInput] })
      fetchRelatedSkills(skillInput)
      setSkillInput("")
      setSkillSuggestions([])
      setSkillDuplicateError("")
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, requiredSkills: formData.requiredSkills.filter((s: string) => s !== skill) })
  }

  const addQuestion = () => {
    if (questionInput && formData.screeningQuestions.length < 5) {
      setFormData({ ...formData, screeningQuestions: [...formData.screeningQuestions, questionInput] })
      setQuestionInput("")
    }
  }

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      screeningQuestions: formData.screeningQuestions.filter((_: string, i: number) => i !== index),
    })
  }

  const addPerk = (perk: string) => {
    if (perk && !formData.perks.includes(perk)) {
      setFormData({ ...formData, perks: [...formData.perks, perk] })
    }
  }

  const removePerk = (perk: string) => {
    setFormData({ ...formData, perks: formData.perks.filter((p: string) => p !== perk) })
  }

  const addTeamMember = (email: string) => {
    if (email.trim() && email.includes("@") && !formData.teamMembers.includes(email.trim())) {
      setFormData((prev) => ({
        ...prev,
        teamMembers: [...(prev.teamMembers || []), email.trim()],
      }))
    }
  }

  const fetchEmailSuggestions = async (searchTerm: string) => {
    if (searchTerm.length === 0) {
      // Show all previously used emails if no search term
      const suggestions = await getTeamMemberSuggestions(employerId, "")
      setEmailSuggestions(suggestions)
      return
    }

    const suggestions = await getTeamMemberSuggestions(employerId, searchTerm)
    setEmailSuggestions(suggestions)
  }

  const handleAddTeamMember = async () => {
    if (teamMemberEmail.trim() && teamMemberEmail.includes("@")) {
      addTeamMember(teamMemberEmail)

      // Save email to database for future autocomplete
      await saveTeamMemberEmail(employerId, teamMemberEmail.trim())

      setTeamMemberEmail("")
      setShowEmailSuggestions(false)
      setEmailSuggestions([])
    }
  }

  const handleSelectEmailSuggestion = async (email: string) => {
    if (!formData.teamMembers.includes(email)) {
      addTeamMember(email)
      await saveTeamMemberEmail(employerId, email)
    }
    setTeamMemberEmail("")
    setShowEmailSuggestions(false)
    setEmailSuggestions([])
  }

  // Function to remove a team member
  const handleRemoveTeamMember = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_: string, index: number) => index !== indexToRemove),
    }))
  }

  const handleHiringForSelect = (type: "own_company" | "client") => {
    setHiringForType(type)
    setFormData((prev: any) => ({
      ...prev,
      hiringForType: type,
      // Auto-fill company name if hiring for own company
      companyName: type === "own_company" ? employerCompanyName : "",
      hiringForCompanyName: type === "client" ? prev.companyName : "", // This might need adjustment based on desired behavior
    }))
    setShowHiringForModal(false) // Close modal after selection
  }

  const handleSaveAsDraft = async () => {
    if (isSubmitting) {
      console.log("[v0] Save already in progress, ignoring duplicate request")
      return
    }

    setLoading(true)
    setIsSubmitting(true)
    console.log("[v0] Saving job as draft...")

    try {
      const result = await createJobPosting({
        ...formData,
        status: "draft",
        hiringForType,
        hiringForCompanyName: hiringForType === "client" ? formData.companyName : null,
      })

      if (result.success) {
        console.log("[v0] Job saved as draft successfully")
        alert("Job saved as draft successfully!")
        router.push("/employer/dashboard?tab=drafts") // Corrected push
      } else {
        console.error("[v0] Failed to save draft:", result.error)
        alert(result.error || "Failed to save job as draft")
      }
    } catch (error) {
      console.error("[v0] Error saving draft:", error)
      alert("An error occurred while saving the draft")
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const handlePublishJob = async () => {
    if (isSubmitting) {
      console.log("[v0] Publish already in progress, ignoring duplicate request")
      return
    }

    // Validate credits with detailed error messages
    if (!credits || credits.remainingCredits < 2) {
      const remainingCredits = credits?.remainingCredits || 0
      const message =
        remainingCredits === 0
          ? "You have 0 credits. Minimum 2 credits required to post a job. Redirecting to purchase credits..."
          : `Insufficient credits. You have ${remainingCredits} credit${remainingCredits === 1 ? "" : "s"} but need 2 to post a job. Redirecting to purchase credits...`

      alert(message)
      router.push("/employer/pricing?from=job-posting")
      return
    }

    // Add validation for required steps
    const requiredSteps = [1, 2, 3]
    for (const step of requiredSteps) {
      if (!isStepValid(step)) {
        setCurrentStep(step) // Navigate to the invalid step
        alert(`Please complete all required fields for Step ${step}.`)
        return
      }
    }

    setLoading(true)
    setIsSubmitting(true)
    const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log("[v0] [Submission ID:", submissionId, "] Publishing job posting...")
    console.log("[v0] [Submission ID:", submissionId, "] Current credits:", credits.remainingCredits)

    try {
      const result = await createJobPosting({
        ...formData,
        status: "published",
        hiringForType,
        hiringForCompanyName: hiringForType === "client" ? formData.companyName : null,
      })

      if (result.success) {
        console.log("[v0] [Submission ID:", submissionId, "] Job published successfully, ID:", result.jobPosting.id)
        alert("Job published successfully! 2 credits have been deducted from your account.")
        await loadCreditBalance()
        router.push("/employer/dashboard")
      } else {
        console.error("[v0] [Submission ID:", submissionId, "] Failed to publish job:", result.error)
        if (result.errorType === "insufficient_credits") {
          alert(result.error || "Insufficient credits to post job")
          router.push("/employer/pricing")
        } else {
          alert(result.error || "Failed to publish job")
        }
      }
    } catch (error) {
      console.error("[v0] [Submission ID:", submissionId, "] Error publishing job:", error)
      alert("An error occurred while publishing the job")
    } finally {
      setLoading(false)
      setIsSubmitting(false)
      console.log("[v0] [Submission ID:", submissionId, "] Publish operation completed")
    }
  }

  const renderPreview = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Preview Your Job Posting</h3>
          <Button onClick={() => setShowPreview(false)} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Job Title and Company */}
          <div className="border-b pb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{formData.jobTitle || "Job Title"}</h2>
            {!formData.hideCompanyInfo && (
              <p className="text-lg text-gray-600">
                {hiringForType === "own_company"
                  ? formData.companyName || "Company Name"
                  : `Hiring for: ${formData.hiringForCompanyName || formData.companyName || "Client Company"}`}
              </p>
            )}
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Employment Type</p>
              <p className="font-medium capitalize">{formData.employmentType?.replace("-", " ") || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Work Mode</p>
              <p className="font-medium capitalize">{formData.workMode?.replace("-", " ") || "Not specified"}</p>
            </div>
            {formData.shifts && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Shift</p>
                <p className="font-medium capitalize">{formData.shifts}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="font-medium">
                {formData.minExperience || 0} - {formData.maxExperience || 0} years
              </p>
            </div>
            {formData.openings && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Number of Openings</p>
                <p className="font-medium">{formData.openings}</p>
              </div>
            )}
            {(formData.minSalary || formData.maxSalary) && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Salary</p>
                <p className="font-medium">
                  ₹{convertNumberToLacs(formData.minSalary)} - ₹{convertNumberToLacs(formData.maxSalary)}
                </p>
              </div>
            )}
            {/* Display Job Category in Preview */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Job Category</p>
              <p className="font-medium capitalize">{formData.category?.replace("-", " ") || "Not specified"}</p>
            </div>
          </div>

          {/* Locations */}
          {formData.jobLocations && formData.jobLocations.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Locations</p>
              <div className="flex flex-wrap gap-2">
                {formData.jobLocations.map((location: string) => (
                  <span key={location} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {location}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required Skills */}
          {formData.requiredSkills && formData.requiredSkills.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {formData.requiredSkills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          {formData.jobDescription && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Job Details</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: formData.jobDescription }}
              />
            </div>
          )}

          {/* Diversity Hiring */}
          {formData.diversityHiring && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Diversity Hiring</p>
              <p className="font-medium capitalize">{formData.diversityHiring.replace("-", " ") || "Not specified"}</p>
            </div>
          )}

          {/* Candidate Profile Details */}
          {(formData.profileHeadline ||
            formData.roleDescription ||
            formData.keyResponsibilities ||
            formData.requiredQualifications) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Profile</h3>
              {formData.profileHeadline && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Profile Headline</p>
                  <p className="text-gray-700">{formData.profileHeadline}</p>
                </div>
              )}
              {formData.roleDescription && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Role Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.roleDescription}</p>
                </div>
              )}
              {formData.keyResponsibilities && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Key Responsibilities</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.keyResponsibilities}</p>
                </div>
              )}
              {formData.requiredQualifications && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Required Qualifications</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.requiredQualifications}</p>
                </div>
              )}
            </div>
          )}

          {/* Perks and Benefits */}
          {formData.perks && formData.perks.length > 0 && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Perks and Benefits</p>
              <div className="flex flex-wrap gap-2">
                {formData.perks.map((perk: string) => (
                  <span key={perk} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                    {perk}
                  </span>
                ))}
              </div>
              {formData.customPerks && <p className="text-gray-700 mt-3 text-sm">{formData.customPerks}</p>}
            </div>
          )}

          {/* Screening Questions */}
          {formData.screeningQuestions && formData.screeningQuestions.length > 0 && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Screening Questions</p>
              <ol className="list-decimal list-inside space-y-2">
                {formData.screeningQuestions.map((question: string, index: number) => (
                  <li key={index} className="text-gray-700">
                    {question}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button onClick={() => setShowPreview(false)} variant="outline" size="lg">
            Edit Job Posting
          </Button>
          <Button
            onClick={handleSaveAsDraft} // Use handleSaveAsDraft
            disabled={loading}
            variant="outline"
            size="lg"
            className="min-w-[150px] bg-transparent"
          >
            {loading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button onClick={handlePublishJob} disabled={loading} size="lg" className="min-w-[200px]">
            {loading ? "Publishing..." : "Publish Job Posting"}
          </Button>
        </div>
      </div>
    )
  }

  const handleFinalStepNext = () => {
    if (currentStep === 5) {
      setShowPreview(true)
    } else {
      handleNextStep()
    }
  }

  const handleLocationInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocationInput(value)

    if (value.trim()) {
      try {
        const result = await searchCities(value)
        if (result.success && result.cities) {
          const cityNames = result.cities.map((city: any) => city.name)
          setFilteredCities(cityNames)
          setShowLocationSuggestions(true)
        } else {
          setFilteredCities([])
          setShowLocationSuggestions(false)
        }
      } catch (error) {
        console.error("[v0] Error searching cities:", error)
        setFilteredCities([])
        setShowLocationSuggestions(false)
      }
    } else {
      setFilteredCities([])
      setShowLocationSuggestions(false)
    }
  }

  const handleLocationSuggestionClick = (city: string) => {
    addLocation(city)
    setLocationInput("")
    setShowLocationSuggestions(false)
    setFilteredCities([])
  }

  // New function to fetch skill suggestions
  const fetchSkillSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSkillSuggestions([])
      return
    }
    try {
      console.log("[v0] Fetching skills for query:", query)
      const response = await searchSkills(query)
      console.log("[v0] Skills response:", response)
      if (response.success && response.skills && Array.isArray(response.skills)) {
        const skillNames = response.skills.map((skill: any) => skill.skill_name)
        console.log("[v0] Skill suggestions:", skillNames)
        setSkillSuggestions(skillNames)
      } else {
        console.log("[v0] No skills found or error in response")
        setSkillSuggestions([])
      }
    } catch (error) {
      console.error("[v0] Exception in fetchSkillSuggestions:", error)
      setSkillSuggestions([])
    }
  }

  // Function to fetch industry suggestions
  const fetchIndustriesSuggestions = async (query: string) => {
    if (!query.trim()) {
      setIndustriesSuggestions([])
      return
    }

    try {
      const response = await searchIndustries(query)
      console.log("[v0] Industries search response:", response)

      if (response.success && response.industries) {
        setIndustriesSuggestions(response.industries.map((ind: { name: string }) => ind.name))
      } else {
        setIndustriesSuggestions([])
      }
    } catch (error) {
      console.error("[v0] Error fetching industries:", error)
      setIndustriesSuggestions([])
    }
  }

  // Removed static specializationOptions and now using state populated from useEffect
  // const specializationOptions: Record<string, string[]> = {
  //   "10th": [],
  //   "12th": ["Science", "Commerce", "Arts"],
  //   "any-graduate": ["Any Specialization"],
  //   "b-tech": [
  //     "Computer Science",
  //     "Information Technology",
  //     "Electronics & Communication",
  //     "Electrical Engineering",
  //     "Mechanical Engineering",
  //     "Civil Engineering",
  //     "Chemical Engineering",
  //     "Biotechnology",
  //     "Aerospace Engineering",
  //     "Other Engineering",
  //   ],
  //   mba: [
  //     "Finance",
  //     "Marketing",
  //     "Human Resources",
  //     "Operations",
  //     "International Business",
  //     "Information Technology",
  //     "Healthcare Management",
  //     "General Management",
  //   ],
  //   "m-tech": [
  //     "Computer Science",
  //     "Information Technology",
  //     "Electronics & Communication",
  //     "Electrical Engineering",
  //     "Mechanical Engineering",
  //     "Other Engineering",
  //   ],
  //   "post-graduate": ["Science", "Commerce", "Arts", "Management", "Other"],
  //   doctorate: ["Engineering", "Science", "Management", "Arts & Humanities", "Medical", "Other"],
  // }

  return (
    <>
      <HiringForSelectionModal
        open={showHiringForModal}
        onClose={() => setShowHiringForModal(false)}
        onSelect={handleHiringForSelect}
        companyName={employerCompanyName}
      />

      {/* Updated the main container for better layout and removed fixed width */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="bg-white border-b px-4 md:px-8 py-3 md:py-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">Post a Job</h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">Create a new job posting for your company</p>
                {jobType && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200">
                    Job Type: {getJobTypeLabel()}
                  </div>
                )}
              </div>
                  <Link
                    href="/employer/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
                  >
                    <Briefcase className="h-4 w-4 text-white" />
                    <span className="text-base md:text-xl font-bold text-white">JobKarle</span>
                  </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar - Steps */}
            <div className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-3 sm:p-4 md:p-6 overflow-y-auto">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 sm:mb-4">
                Job Posting Steps
              </h2>
              <nav className="space-y-1 sm:space-y-2">
                {steps.map((step) => {
                  const Icon = step.icon
                  const isCompleted = completedSteps.includes(step.id)
                  const isCurrent = currentStep === step.id
                  const isAccessible = step.id <= currentStep || completedSteps.includes(step.id - 1)

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isAccessible && step.id !== 1}
                      className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
                        isCurrent
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : isCompleted
                            ? "text-gray-700 hover:bg-gray-50"
                            : isAccessible
                              ? "text-gray-500 hover:bg-gray-50"
                              : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isCurrent
                              ? "bg-blue-600 text-white ring-2 ring-blue-200"
                              : isAccessible
                                ? "bg-gray-200 text-gray-600"
                                : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                        ) : isCurrent ? (
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full" />
                        ) : (
                          <Icon className="w-3 h-3 md:w-4 md:h-4" />
                        )}
                      </div>
                      <span className="text-left leading-tight flex-1 break-words">{step.name}</span>
                      {!isCompleted && !isCurrent && !isAccessible && (
                        <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-gray-300 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </nav>

              <div className="mt-6 md:mt-8 p-3 md:p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-900 mb-1">Need Help?</p>
                    <p className="text-xs text-blue-700">
                      Complete all required fields to proceed to the next step. Optional fields can be filled later.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Updated the main container for better layout and removed fixed width */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {showPreview ? (
                  renderPreview()
                ) : (
                  <>
                    {/* Step 1: Job Details */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Job details</h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Begin from scratch or{" "}
                            <button className="text-blue-600 hover:underline">Prefill from previous jobs</button>
                          </p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                          <div>
                            <Label htmlFor="companyName" className="text-xs sm:text-sm font-medium mb-2">
                              {hiringForType === "own_company" ? "Company name" : "Hiring for company"}
                            </Label>
                            <div className="flex items-center gap-4">
                              <Input
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                placeholder={
                                  hiringForType === "own_company"
                                    ? "Company name (auto-filled from profile)"
                                    : "Enter client company name"
                                }
                                disabled={hiringForType === "own_company"}
                                className="h-9 sm:h-10 text-sm flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => setShowHiringForModal(true)}
                                className="text-xs sm:text-sm text-blue-600 hover:underline whitespace-nowrap"
                              >
                                Change
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              {hiringForType === "own_company"
                                ? "Posting for your company: " + employerCompanyName
                                : "Posting as recruitment consultant for client"}
                            </p>
                            <div className="mt-2">
                              <Checkbox
                                id="hideCompany"
                                checked={formData.hideCompanyInfo}
                                onCheckedChange={(checked) => setFormData({ ...formData, hideCompanyInfo: checked })}
                              />
                              <label htmlFor="hideCompany" className="ml-2 text-xs sm:text-sm text-gray-600">
                                Hide this information
                              </label>
                            </div>
                          </div>

                          {/* Updated Row 1: Job Title and Job Category */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="jobTitle" className="text-xs sm:text-sm font-medium mb-2">
                                Job title *
                              </Label>
                              <Input
                                id="jobTitle"
                                value={formData.jobTitle}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                placeholder="e.g. Senior Software Engineer"
                                className="h-9 sm:h-10 text-sm max-w-2xl"
                              />
                            </div>

                            <div>
                              <Label htmlFor="jobCategory" className="text-xs sm:text-sm font-medium mb-2">
                                Job category *
                              </Label>
                              <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                              >
                                <SelectTrigger id="jobCategory" className="h-9 sm:h-10 text-sm">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="classified">Classified</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Updated Row 2: Employment Type and Shift */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="employmentType" className="text-xs sm:text-sm font-medium mb-2">
                                Employment type *
                              </Label>
                              <Select
                                value={formData.employmentType}
                                onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                              >
                                <SelectTrigger id="employmentType" className="h-9 sm:h-10 text-sm">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full-time">Full Time</SelectItem>
                                  <SelectItem value="part-time">Part Time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="internship">Internship</SelectItem>
                                  <SelectItem value="freelance">Freelance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="shift" className="text-xs sm:text-sm font-medium mb-2">
                                Shift *
                              </Label>
                              <Select
                                value={formData.shifts}
                                onValueChange={(value) => setFormData({ ...formData, shifts: value })}
                              >
                                <SelectTrigger id="shift" className="h-9 sm:h-10 text-sm">
                                  <SelectValue placeholder="Select shift" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="day">Day</SelectItem>
                                  <SelectItem value="night">Night</SelectItem>
                                  <SelectItem value="flexible">Flexible</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Updated Row 3: Work Mode and Number of Openings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                              <Label className="text-xs sm:text-sm font-medium mb-3 block">Work Mode *</Label>
                              <RadioGroup
                                value={formData.workMode}
                                onValueChange={(value) => setFormData({ ...formData, workMode: value })}
                                className="flex flex-wrap gap-3"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="onsite" id="onsite" />
                                  <Label htmlFor="onsite" className="text-xs sm:text-sm font-normal cursor-pointer">
                                    Onsite
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="remote" id="remote" />
                                  <Label htmlFor="remote" className="text-xs sm:text-sm font-normal cursor-pointer">
                                    Remote
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="hybrid" id="hybrid" />
                                  <Label htmlFor="hybrid" className="text-xs sm:text-sm font-normal cursor-pointer">
                                    Hybrid
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>

                            <div>
                              <Label htmlFor="openings" className="text-xs sm:text-sm font-medium mb-2">
                                Number of openings
                              </Label>
                              <Input
                                id="openings"
                                type="number"
                                value={formData.openings}
                                onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                                placeholder="e.g. 5"
                                className="h-9 sm:h-10 text-sm max-w-[120px]"
                                min="1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2">Job location (max. 3) *</Label>
                            <div className="flex flex-col gap-2">
                              <div className="relative flex-1 max-w-md">
                                <Input
                                  value={locationInput}
                                  onChange={handleLocationInputChange}
                                  onFocus={() => {
                                    if (locationInput.trim()) {
                                      setShowLocationSuggestions(true)
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => setShowLocationSuggestions(false), 200)
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      if (filteredCities.length > 0) {
                                        handleLocationSuggestionClick(filteredCities[0])
                                      } else {
                                        addLocation(locationInput)
                                      }
                                    }
                                  }}
                                  placeholder="Type a city name"
                                  className="h-9 sm:h-10 text-sm w-full"
                                />

                                {showLocationSuggestions && filteredCities.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {filteredCities.map((city) => (
                                      <button
                                        key={city}
                                        type="button"
                                        onClick={() => handleLocationSuggestionClick(city)}
                                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-blue-50 text-xs sm:text-sm text-gray-800 border-b border-gray-100 last:border-b-0"
                                      >
                                        {city}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {formData.jobLocations.length >= 3 && (
                                <p className="mt-2 text-xs text-red-600 font-medium">Maximum 3 locations reached</p>
                              )}

                              {formData.jobLocations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {formData.jobLocations.map((location: string) => (
                                    <div
                                      key={location}
                                      className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm"
                                    >
                                      {location}
                                      <button
                                        onClick={() => removeLocation(location)}
                                        className="hover:bg-blue-100 rounded-full p-0.5"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <Checkbox
                                  checked={formData.includeRelocation}
                                  onCheckedChange={(checked) =>
                                    setFormData({ ...formData, includeRelocation: checked })
                                  }
                                />
                                Include candidates willing to relocate to above location(s)
                              </label>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2">Work experience *</Label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                              <Select
                                value={formData.minExperience}
                                onValueChange={(value) => setFormData({ ...formData, minExperience: value })}
                              >
                                <SelectTrigger className="h-9 sm:h-10 w-full sm:flex-1 text-sm">
                                  <SelectValue placeholder="Min exp." />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                                    <SelectItem key={year} value={String(year)}>
                                      {year} {year === 1 ? "year" : "years"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-gray-500 text-xs sm:text-sm self-center">to</span>
                              <Select
                                value={formData.maxExperience}
                                onValueChange={(value) => setFormData({ ...formData, maxExperience: value })}
                              >
                                <SelectTrigger className="h-9 sm:h-10 w-full sm:flex-1 text-sm">
                                  <SelectValue placeholder="Max exp." />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((year) => (
                                    <SelectItem key={year} value={String(year)}>
                                      {year} {year === 1 ? "year" : "years"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2">Salary Range *</Label>
                            <div className="flex gap-2 items-center">
                              <Select
                                value={formData.minSalary ? convertNumberToLacs(formData.minSalary) : ""}
                                onValueChange={(value) => {
                                  handleSalaryChange("minSalary", value)
                                }}
                              >
                                <SelectTrigger className="h-9 sm:h-10 text-sm flex-1">
                                  <SelectValue placeholder="Min Salary" />
                                </SelectTrigger>
                                <SelectContent>
                                  {salaryOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <span className="text-gray-600 text-sm font-medium">to</span>

                              <Select
                                value={formData.maxSalary ? convertNumberToLacs(formData.maxSalary) : ""}
                                onValueChange={(value) => {
                                  handleSalaryChange("maxSalary", value)
                                }}
                              >
                                <SelectTrigger className="h-9 sm:h-10 text-sm flex-1">
                                  <SelectValue placeholder="Max Salary" />
                                </SelectTrigger>
                                <SelectContent>
                                  {salaryOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button
                            onClick={handleNextStep}
                            disabled={!isStepValid(1)}
                            className="px-8 h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Preferred Candidate Details */}
                    {currentStep === 2 && (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                            Preferred candidate details
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">Add details about your ideal candidate</p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2">Required skills (max. 10) *</Label>
                            <div className="flex flex-col gap-2 max-w-md">
                              <div className="relative flex gap-2">
                                <Input
                                  value={skillInput}
                                  onChange={(e) => {
                                    setSkillInput(e.target.value)
                                    if (e.target.value.trim()) {
                                      fetchSkillSuggestions(e.target.value)
                                    } else {
                                      setSkillSuggestions([])
                                    }
                                    setSkillDuplicateError("")
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      addSkill()
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => setSkillSuggestions([]), 200)
                                  }}
                                  placeholder="e.g. JavaScript, React"
                                  className="h-9 sm:h-10 flex-1 text-sm"
                                  autoComplete="off"
                                />
                                {skillSuggestions.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {skillSuggestions.map((suggestion) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                          if (formData.requiredSkills.includes(suggestion)) {
                                            setSkillDuplicateError("Skill already added")
                                            setTimeout(() => setSkillDuplicateError(""), 3000)
                                          } else if (formData.requiredSkills.length < 10) {
                                            setFormData({
                                              ...formData,
                                              requiredSkills: [...formData.requiredSkills, suggestion],
                                            })
                                            fetchRelatedSkills(suggestion)
                                            setSkillDuplicateError("")
                                          }
                                          setSkillInput("")
                                          setSkillSuggestions([])
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {skillDuplicateError && (
                                <p className="text-red-600 text-sm font-medium">{skillDuplicateError}</p>
                              )}
                            </div>

                            {formData.requiredSkills.length >= 10 && (
                              <p className="mt-2 text-xs text-red-600 font-medium">Maximum 10 skills reached</p>
                            )}

                            {formData.requiredSkills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {formData.requiredSkills.map((skill: string) => (
                                  <div
                                    key={skill}
                                    className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm"
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => removeSkill(skill)}
                                      className="hover:bg-blue-100 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {formData.requiredSkills.length < 10 && (
                            <div>
                              {relatedSkills.length > 0 ? (
                                <>
                                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                    Related skills you might know:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {relatedSkills.map((skill) => (
                                      <button
                                        key={skill}
                                        type="button"
                                        onClick={() => {
                                          if (formData.requiredSkills.length < 10) {
                                            setFormData({
                                              ...formData,
                                              requiredSkills: [...formData.requiredSkills, skill],
                                            })
                                            setRelatedSkills(relatedSkills.filter((s) => s !== skill))
                                            fetchRelatedSkills(skill)
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full text-xs sm:text-sm transition-colors border border-gray-200 hover:border-blue-300"
                                      >
                                        + {skill}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : popularSkills.length > 0 ? (
                                <>
                                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Popular skills:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {popularSkills
                                      .filter((skill) => !formData.requiredSkills.includes(skill))
                                      .slice(0, 10)
                                      .map((skill) => (
                                        <button
                                          key={skill}
                                          type="button"
                                          onClick={() => {
                                            if (formData.requiredSkills.length < 10) {
                                              setFormData({
                                                ...formData,
                                                requiredSkills: [...formData.requiredSkills, skill],
                                              })
                                              fetchRelatedSkills(skill)
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full text-xs sm:text-sm transition-colors border border-gray-200 hover:border-blue-300"
                                        >
                                          + {skill}
                                        </button>
                                      ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                            <div>
                              <Label
                                htmlFor="educationalQualifications"
                                className="text-xs sm:text-sm font-medium mb-2"
                              >
                                Highest Qualification *
                              </Label>
                              <Select
                                value={formData.educationalQualifications}
                                onValueChange={(value) => {
                                  setFormData({
                                    ...formData,
                                    educationalQualifications: value,
                                    specialization: "", // Reset specialization when qualification changes
                                    educationName: "",
                                  })
                                }}
                              >
                                <SelectTrigger className="h-9 sm:h-10 text-sm">
                                  <SelectValue placeholder="Select Qualification" />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingQualifications ? (
                                    <SelectItem value="loading" disabled>
                                      Loading...
                                    </SelectItem>
                                  ) : qualifications.length > 0 ? (
                                    qualifications.map((qual) => (
                                      <SelectItem key={qual.id} value={qual.level.toLowerCase().replace(/\s+/g, "-")}>
                                        {qual.level}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-data" disabled>
                                      No qualifications available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            {formData.educationalQualifications &&
                              formData.educationalQualifications !== "10th" &&
                              educationNameOptions.length > 0 && (
                                <div>
                                  <Label htmlFor="educationName" className="text-xs sm:text-sm font-medium mb-2">
                                    Education Name
                                  </Label>
                                  <Select
                                    value={formData.educationName}
                                    onValueChange={(value) => setFormData({ ...formData, educationName: value })}
                                  >
                                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                                      <SelectValue placeholder="Select Education" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {educationNameOptions.map((name) => (
                                        <SelectItem key={name} value={name}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                          </div>

                          {formData.educationalQualifications && specializationOptions.length > 0 && (
                            <div className="max-w-md">
                              <Label htmlFor="specialization" className="text-xs sm:text-sm font-medium mb-2">
                                Specialization
                              </Label>
                              <Select
                                value={formData.specialization}
                                onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                              >
                                <SelectTrigger className="h-9 sm:h-10 text-sm">
                                  <SelectValue placeholder="Select Specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                  {specializationOptions.map((spec) => (
                                    <SelectItem key={spec} value={spec.toLowerCase().replace(/\s+/g, "-")}>
                                      {spec}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2 break-words">
                              Candidate's industry you are looking to hire from (Optional)
                            </Label>
                            <div className="relative w-full max-w-md">
                              <Input
                                value={industryInput}
                                onChange={(e) => {
                                  setIndustryInput(e.target.value)
                                  fetchIndustriesSuggestions(e.target.value)
                                }}
                                onBlur={() => setTimeout(() => setIndustriesSuggestions([]), 200)}
                                placeholder="e.g. IT, E-commerce"
                                className="h-9 sm:h-10 text-sm"
                              />
                              {industriesSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                  {industriesSuggestions.map((suggestion) => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      onClick={() => {
                                        setIndustryInput(suggestion)
                                        setFormData({ ...formData, candidateIndustries: suggestion })
                                        setIndustriesSuggestions([])
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2 break-words">
                              Video profile needed from candidates
                            </Label>
                            <div className="flex gap-2 sm:gap-3">
                              {["Yes", "No"].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => setFormData({ ...formData, videoProfileRequired: option === "Yes" })}
                                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                                    (formData.videoProfileRequired && option === "Yes") ||
                                    (!formData.videoProfileRequired && option === "No")
                                      ? "bg-blue-600 text-white"
                                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            onClick={() => setCurrentStep(1)}
                            variant="outline"
                            className="px-8 h-9 sm:h-10 text-xs sm:text-sm"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                          <Button
                            onClick={handleNextStep}
                            disabled={!isStepValid(2)}
                            className="px-8 h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Job Description */}
                    {currentStep === 3 && (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Job description</h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Outline the activities a person in this role will perform on a regular basis
                          </p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                          <div>
                            <Label htmlFor="jobDescription" className="text-xs sm:text-sm font-medium mb-2">
                              Job details
                            </Label>
                            <RichTextEditor
                              value={formData.jobDescription}
                              onChange={(value) => setFormData({ ...formData, jobDescription: value })}
                              placeholder="Role & responsibilities:
Outline the day-to-day responsibilities of this role

Preferred candidate profile:
Specify required role expertise, previous role experiences, or relevant call-outs"
                              className=""
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {formData.jobDescription?.length || 0} characters
                            </p>
                          </div>

                          {/* Diversity Hiring Section */}
                          <div>
                            <Label htmlFor="diversityHiring" className="text-sm sm:text-base font-medium mb-2">
                              Diversity Hiring
                            </Label>
                            <Select
                              value={formData.diversityHiring}
                              onValueChange={(value) => setFormData({ ...formData, diversityHiring: value })}
                            >
                              <SelectTrigger className="h-9 sm:h-10 text-sm">
                                <SelectValue placeholder="Select diversity preference" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open-to-all">Open to All</SelectItem>
                                <SelectItem value="women-only">Women Only</SelectItem>
                                <SelectItem value="pwd-friendly">Persons with Disabilities (PWD)</SelectItem>
                                <SelectItem value="lgbtq-friendly">LGBTQ+ Friendly</SelectItem>
                                <SelectItem value="veterans-preferred">Veterans Preferred</SelectItem>
                                <SelectItem value="senior-citizens">Senior Citizens Welcome</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              Specify if this position is targeted towards diverse candidate groups
                            </p>
                          </div>

                          <div className="border-t pt-3 sm:pt-6">
                            <button
                              onClick={() => setShowCandidateProfile(!showCandidateProfile)}
                              className="flex items-center gap-2 text-blue-600 hover:underline text-xs sm:text-sm font-medium"
                            >
                              <Plus
                                className={`w-4 h-4 transition-transform ${showCandidateProfile ? "rotate-45" : ""}`}
                              />
                              Add candidate profile details (Optional)
                            </button>

                            {showCandidateProfile && (
                              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <Label htmlFor="profileHeadline" className="text-xs sm:text-sm font-medium mb-2">
                                    Profile headline
                                  </Label>
                                  <Input
                                    id="profileHeadline"
                                    value={formData.profileHeadline}
                                    onChange={(e) => setFormData({ ...formData, profileHeadline: e.target.value })}
                                    placeholder="e.g. Experienced Sales Manager"
                                    className="h-9 sm:h-10 text-sm"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="roleDescription" className="text-xs sm:text-sm font-medium mb-2">
                                    Role description
                                  </Label>
                                  <Textarea
                                    id="roleDescription"
                                    value={formData.roleDescription}
                                    onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
                                    placeholder="Describe what makes an ideal candidate for this role"
                                    className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="keyResponsibilities" className="text-xs sm:text-sm font-medium mb-2">
                                    Key responsibilities
                                  </Label>
                                  <Textarea
                                    id="keyResponsibilities"
                                    value={formData.keyResponsibilities}
                                    onChange={(e) => setFormData({ ...formData, keyResponsibilities: e.target.value })}
                                    placeholder="List the main responsibilities (one per line)"
                                    className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                                  />
                                </div>

                                <div>
                                  <Label
                                    htmlFor="requiredQualifications"
                                    className="text-xs sm:text-sm font-medium mb-2"
                                  >
                                    Required qualifications
                                  </Label>
                                  <Textarea
                                    id="requiredQualifications"
                                    value={formData.requiredQualifications}
                                    onChange={(e) =>
                                      setFormData({ ...formData, requiredQualifications: e.target.value })
                                    }
                                    placeholder="List required qualifications (one per line)"
                                    className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-3 sm:pt-6">
                            <button
                              onClick={() => setShowPerks(!showPerks)}
                              className="flex items-center gap-2 text-blue-600 hover:underline text-xs sm:text-sm font-medium"
                            >
                              <Plus className={`w-4 h-4 transition-transform ${showPerks ? "rotate-45" : ""}`} />
                              Perks and Benefits (Optional)
                            </button>

                            {showPerks && (
                              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <Label className="text-xs sm:text-sm font-medium mb-2">
                                    Select perks and benefits
                                  </Label>
                                  <div className="space-y-2">
                                    {[
                                      "Health Insurance",
                                      "Life Insurance",
                                      "Paid Time Off",
                                      "Work From Home",
                                      "Flexible Hours",
                                      "Performance Bonus",
                                      "Employee Stock Options",
                                      "Professional Development",
                                      "Gym Membership",
                                      "Free Meals",
                                      "Transportation Allowance",
                                      "Retirement Benefits",
                                    ].map((perk) => (
                                      <div key={perk} className="flex items-center gap-2">
                                        <Checkbox
                                          id={perk}
                                          checked={formData.perks?.includes(perk)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              addPerk(perk)
                                            } else {
                                              removePerk(perk)
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor={perk}
                                          className="text-xs sm:text-sm text-gray-700 cursor-pointer"
                                        >
                                          {perk}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="customPerks" className="text-xs sm:text-sm font-medium mb-2">
                                    Additional benefits (Optional)
                                  </Label>
                                  <Textarea
                                    id="customPerks"
                                    value={formData.customPerks}
                                    onChange={(e) => setFormData({ ...formData, customPerks: e.target.value })}
                                    placeholder="Describe any other benefits or perks"
                                    className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            onClick={() => setCurrentStep(2)}
                            variant="outline"
                            className="px-8 h-9 sm:h-10 text-xs sm:text-sm"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                          <Button
                            onClick={handleNextStep}
                            disabled={!isStepValid(3)}
                            className="px-8 h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Screening Questions */}
                    {currentStep === 4 && (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Screening questions</h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Add questions to screen candidates effectively (max. 5)
                          </p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                          <div>
                            <div className="flex gap-2">
                              <Input
                                value={questionInput}
                                onChange={(e) => setQuestionInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    addQuestion()
                                  }
                                }}
                                placeholder="Add a question"
                                className="h-9 sm:h-10 flex-1 text-sm"
                              />
                              <Button
                                onClick={addQuestion}
                                disabled={!questionInput.trim() || formData.screeningQuestions.length >= 5}
                                className="h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                            {formData.screeningQuestions.length >= 5 && (
                              <p className="mt-2 text-xs text-red-600 font-medium">Maximum 5 questions reached</p>
                            )}
                          </div>

                          {formData.screeningQuestions.length > 0 && (
                            <div className="space-y-3">
                              {formData.screeningQuestions.map((question: string, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                  <span className="text-sm flex-1">{question}</span>
                                  <button
                                    onClick={() => removeQuestion(index)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="border-t pt-3 sm:pt-6">
                            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Suggested questions:</p>
                            <div className="space-y-2">
                              {[
                                "What is your current CTC in Lacs per annum?",
                                "What is your expected CTC in Lacs per annum?",
                                "What is your notice period?",
                                "How many years of experience do you have in BPO Customer Service?",
                                "Are you currently residing in Mumbai (All Areas) or willing to relocate to Mumbai?",
                              ].map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    if (!formData.screeningQuestions.includes(suggestion)) {
                                      setFormData({
                                        ...formData,
                                        screeningQuestions: [...formData.screeningQuestions, suggestion],
                                      })
                                    }
                                  }}
                                  className="flex items-start gap-2 w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <Plus className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-700">{suggestion}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            onClick={() => setCurrentStep(3)}
                            variant="outline"
                            className="px-8 h-9 sm:h-10 text-xs sm:text-sm"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                          <Button
                            onClick={handleNextStep}
                            className="px-8 h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Advanced Options */}
                    {currentStep === 5 && (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Advanced options</h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Configure additional settings for your job posting
                          </p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2">Is this a walk-in job?</Label>
                            <div className="flex gap-3">
                              {["Yes", "No"].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => setFormData({ ...formData, isWalkIn: option === "Yes" })}
                                  className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                                    (formData.isWalkIn && option === "Yes") || (!formData.isWalkIn && option === "No")
                                      ? "bg-blue-600 text-white"
                                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border-t pt-3 sm:pt-6">
                            <div className="max-w-xl">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                                    Collaborate with team members to manage responses
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    Add or remove team members who will be able to manage this job and its responses
                                  </p>
                                </div>
                              </div>

                              {/* Display existing team members */}
                              {formData.teamMembers && formData.teamMembers.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  {formData.teamMembers.map((email, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                          <span className="text-xs font-medium text-blue-600">
                                            {email.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <span className="text-xs sm:text-sm text-gray-700">{email}</span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveTeamMember(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add new team member */}
                              <div className="flex gap-2 mt-3">
                                <div className="relative flex-1">
                                  <Input
                                    type="email"
                                    placeholder="Enter team member email"
                                    value={teamMemberEmail}
                                    onChange={async (e) => {
                                      const value = e.target.value
                                      setTeamMemberEmail(value)

                                      // Show suggestions when typing
                                      if (value.length > 0) {
                                        await fetchEmailSuggestions(value)
                                        setShowEmailSuggestions(true)
                                      } else {
                                        // Show all previously used emails when field is focused but empty
                                        await fetchEmailSuggestions("")
                                        setShowEmailSuggestions(true)
                                      }
                                    }}
                                    onFocus={async () => {
                                      // Show all previously used emails on focus
                                      await fetchEmailSuggestions(teamMemberEmail)
                                      setShowEmailSuggestions(true)
                                    }}
                                    onBlur={() => {
                                      // Delay hiding to allow clicking on suggestions
                                      setTimeout(() => setShowEmailSuggestions(false), 200)
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleAddTeamMember()
                                      }
                                    }}
                                    className="flex-1 h-9 sm:h-10 text-sm"
                                  />

                                  {/* Email suggestions dropdown */}
                                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                      {emailSuggestions
                                        .filter((email) => !formData.teamMembers.includes(email))
                                        .map((email) => (
                                          <button
                                            key={email}
                                            type="button"
                                            onClick={() => handleSelectEmailSuggestion(email)}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                          >
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                              <span className="text-xs font-medium text-blue-600">
                                                {email.charAt(0).toUpperCase()}
                                              </span>
                                            </div>
                                            <span className="truncate">{email}</span>
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  onClick={handleAddTeamMember}
                                  disabled={!teamMemberEmail.trim() || !teamMemberEmail.includes("@")}
                                  variant="outline"
                                  className="h-9 sm:h-10 text-xs sm:text-sm bg-transparent"
                                >
                                  Add Member
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-3 sm:pt-6">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3">
                              Receive responses over email
                            </h4>
                            <Select
                              value={formData.emailNotificationPreference}
                              onValueChange={(value) =>
                                setFormData({ ...formData, emailNotificationPreference: value })
                              }
                            >
                              <SelectTrigger className="h-9 sm:h-10 text-sm">
                                <SelectValue placeholder="On every new response" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="every-response">On every new response</SelectItem>
                                <SelectItem value="daily-digest">Daily digest</SelectItem>
                                <SelectItem value="weekly-digest">Weekly digest</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Only you will receive responses</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Email notifications will be sent for:{" "}
                                <span className="text-blue-600">AI-recommended applicants</span>
                              </p>
                            </div>
                          </div>

                          <div className="border-t pt-3 sm:pt-6">
                            <button
                              onClick={() => setShowReferenceCode(!showReferenceCode)}
                              className="flex items-center justify-between w-full text-left"
                            >
                              <span className="text-xs sm:text-sm font-medium text-gray-900">
                                Reference code to distinctly identify this job
                              </span>
                              <Plus
                                className={`w-5 h-5 text-gray-400 transition-transform ${showReferenceCode ? "rotate-45" : ""}`}
                              />
                            </button>

                            {showReferenceCode && (
                              <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <Label htmlFor="referenceCode" className="text-xs sm:text-sm font-medium mb-2">
                                    Enter reference code
                                  </Label>
                                  <Input
                                    id="referenceCode"
                                    value={formData.referenceCode}
                                    onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
                                    placeholder="e.g. JOB-2025-001"
                                    className="h-9 sm:h-10 text-sm"
                                    maxLength={50}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    This code will help you identify and track this job posting internally
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-3 sm:pt-6">
                            <button
                              onClick={() => setShowAutoRefresh(!showAutoRefresh)}
                              className="flex items-center justify-between w-full text-left"
                            >
                              <span className="text-xs sm:text-sm font-medium text-gray-900">
                                Schedule job for automatic refresh
                              </span>
                              <Plus
                                className={`w-5 h-5 text-gray-400 transition-transform ${showAutoRefresh ? "rotate-45" : ""}`}
                              />
                            </button>

                            {showAutoRefresh && (
                              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <Label className="text-xs sm:text-sm font-medium mb-2">
                                    Enable automatic refresh
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="enableAutoRefresh"
                                      checked={formData.enableAutoRefresh}
                                      onCheckedChange={(checked) =>
                                        setFormData({ ...formData, enableAutoRefresh: checked })
                                      }
                                    />
                                    <label
                                      htmlFor="enableAutoRefresh"
                                      className="text-xs sm:text-sm text-gray-700 cursor-pointer"
                                    >
                                      Automatically refresh this job posting
                                    </label>
                                  </div>
                                </div>

                                {formData.enableAutoRefresh && (
                                  <>
                                    <div>
                                      <Label htmlFor="refreshFrequency" className="text-xs sm:text-sm font-medium mb-2">
                                        Refresh frequency
                                      </Label>
                                      <Select
                                        value={formData.refreshFrequency}
                                        onValueChange={(value) => setFormData({ ...formData, refreshFrequency: value })}
                                      >
                                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                                          <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="daily">Daily</SelectItem>
                                          <SelectItem value="weekly">Weekly</SelectItem>
                                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                          <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label htmlFor="refreshDuration" className="text-xs sm:text-sm font-medium mb-2">
                                        Refresh for how long?
                                      </Label>
                                      <Select
                                        value={formData.refreshDuration}
                                        onValueChange={(value) => setFormData({ ...formData, refreshDuration: value })}
                                      >
                                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                                          <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1-month">1 Month</SelectItem>
                                          <SelectItem value="2-months">2 Months</SelectItem>
                                          <SelectItem value="3-months">3 Months</SelectItem>
                                          <SelectItem value="6-months">6 Months</SelectItem>
                                          <SelectItem value="until-filled">Until position is filled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="p-3 bg-blue-50 rounded-lg">
                                      <p className="text-xs text-gray-600">
                                        <span className="font-medium">Note:</span> Automatic refresh will keep your job
                                        posting at the top of search results and increase visibility to potential
                                        candidates.
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                          {currentStep > 1 && (
                            <Button
                              onClick={prevStep}
                              variant="outline"
                              size="lg"
                              className="h-10 text-sm bg-transparent"
                            >
                              <ChevronLeft className="w-4 h-4 mr-2" />
                              Back
                            </Button>
                          )}
                          <Button
                            onClick={handleFinalStepNext}
                            disabled={!isStepValid(currentStep)}
                            size="lg"
                            className="ml-auto h-10 text-sm"
                          >
                            {currentStep === 5 ? "Preview & Publish" : "Next"}
                            {currentStep < 5 && <ChevronRight className="w-4 h-4 ml-2" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Preview Your Job Posting</h2>
              <Button variant="outline" onClick={() => setShowPreview(false)} className="h-8 sm:h-9 text-xs sm:text-sm">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Back to Edit
              </Button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">
                      {formData.jobTitle}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 break-words">
                      {hiringForType === "own_company"
                        ? formData.companyName || "Company Name"
                        : `Hiring for: ${formData.hiringForCompanyName || formData.companyName || "Client Company"}`}
                    </p>
                  </div>
                  
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    <img
                      src={logoUrl || "/jobkarle-logo.png"}
                      alt="Company logo"
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg object-cover border-2 border-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Employment Type</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 break-words">
                      {formData.employmentType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Work Mode</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{formData.workMode}</p>
                  </div>
                  {formData.shifts && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Shift</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{formData.shifts}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Experience</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">
                      {formData.minExperience} - {formData.maxExperience} years
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Category */}
              {formData.category && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Job Category</p>
                  <p className="text-sm sm:text-base text-gray-700 break-words capitalize">
                    {formData.category.replace("-", " ")}
                  </p>
                </div>
              )}

              {/* Salary Range - Moved here to appear right after Job Category */}
              {(formData.minSalary || formData.maxSalary) && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Salary Range</p>
                  <p className="text-sm sm:text-base text-gray-700">
                    ₹{convertNumberToLacs(formData.minSalary)} - ₹{convertNumberToLacs(formData.maxSalary)}
                  </p>
                </div>
              )}

              {/* Locations */}
              {formData.jobLocations.length > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.jobLocations.map((location, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm break-words"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {formData.requiredSkills.length > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm break-words"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.jobDescription && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Job Details</h3>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: formData.jobDescription }}
                  />
                </div>
              )}

              {/* Diversity Hiring */}
              {formData.diversityHiring && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Diversity Hiring</p>
                  <p className="text-sm sm:text-base text-gray-700 break-words capitalize">
                    {formData.diversityHiring.replace("-", " ")}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                  disabled={isSubmitting}
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handlePublishJob}
                  className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publishing..." : "Publish Job Posting"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
