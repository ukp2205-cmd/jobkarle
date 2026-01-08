"use client"

import { useState } from "react"
import {
  Briefcase,
  Users,
  FileText,
  HelpCircle,
  Settings,
  Plus,
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateJobPosting } from "@/app/actions/job-posting-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  "Lucknow",
]

interface EditJobFormProps {
  job: any
  employerId: string
}

function EditJobForm({ job, employerId }: EditJobFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<any>({
    hiringForType: job.hiring_for_type || "own_company",
    hiringForCompanyName: job.hiring_for_company_name || "",
    companyName: job.company_name || "",
    hideCompanyInfo: job.hide_company_info || false,
    jobTitle: job.job_title || "",
    category: job.category || "classified",
    urgentHiring: job.urgent_hiring || false,
    employmentType: job.employment_type || "",
    shifts: job.shift || "",
    workMode: job.work_mode || "",
    jobLocations: job.job_locations || [],
    includeRelocation: job.include_relocation || false,
    minExperience: String(job.min_experience || ""),
    maxExperience: String(job.max_experience || ""),
    minSalary: job.min_salary ? String(job.min_salary) : "",
    maxSalary: job.max_salary ? String(job.max_salary) : "",
    openings: job.openings ? String(job.openings) : "",
    requiredSkills: job.required_skills || [],
    educationalQualifications: job.educational_qualifications || "",
    candidateIndustries: job.candidate_industries || "",
    videoProfileRequired: job.video_profile_required || false,
    jobDescription: job.job_description || "",
    profileHeadline: job.candidate_profile_headline || "",
    roleDescription: job.role_description || "",
    keyResponsibilities: job.key_responsibilities || "",
    requiredQualifications: job.required_qualifications || "",
    perks: job.perks || [],
    customPerks: job.custom_perks || "",
    screeningQuestions: job.screening_questions || [],
    isWalkIn: job.is_walk_in || false,
    teamMembers: job.team_members || [],
    referenceCode: job.reference_code || "",
    enableAutoRefresh: job.enable_auto_refresh || false,
    refreshFrequency: job.refresh_frequency || "",
    refreshDuration: job.refresh_duration || "",
    emailNotificationPreference: job.email_notification_preference || "",
  })

  const [locationInput, setLocationInput] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [questionInput, setQuestionInput] = useState("")
  const [teamMemberEmail, setTeamMemberEmail] = useState("")
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2, 3, 4, 5])

  const formatIndianNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "")
    if (!digits) return ""
    const num = Number.parseInt(digits)
    return num.toLocaleString("en-IN")
  }

  const handleSalaryChange = (field: "minSalary" | "maxSalary", value: string) => {
    const formatted = formatIndianNumber(value)
    setFormData({ ...formData, [field]: formatted })
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.companyName &&
          formData.jobTitle &&
          formData.category &&
          formData.employmentType &&
          formData.workMode &&
          formData.jobLocations.length > 0 &&
          formData.minExperience !== "" &&
          formData.maxExperience !== ""
        )
      case 2:
        return !!(formData.requiredSkills.length > 0)
      case 3:
        return !!(formData.jobDescription && formData.jobDescription.length >= 50)
      case 4:
        return true
      case 5:
        return true
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
    setCurrentStep(stepId)
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addLocation = (location: string) => {
    if (location && !formData.jobLocations.includes(location) && formData.jobLocations.length < 9) {
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

  const addSkill = () => {
    if (skillInput && !formData.requiredSkills.includes(skillInput)) {
      setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, skillInput] })
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, requiredSkills: formData.requiredSkills.filter((s: string) => s !== skill) })
  }

  const addQuestion = () => {
    if (questionInput) {
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

  const handleAddTeamMember = () => {
    if (teamMemberEmail.trim() && teamMemberEmail.includes("@")) {
      setFormData({
        ...formData,
        teamMembers: [...(formData.teamMembers || []), teamMemberEmail.trim()],
      })
      setTeamMemberEmail("")
    }
  }

  const handleRemoveTeamMember = (index: number) => {
    const updatedMembers = formData.teamMembers.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, teamMembers: updatedMembers })
  }

  const handleSaveChanges = async () => {
    setLoading(true)
    try {
      const updateData = {
        hiring_for_type: formData.hiringForType,
        hiring_for_company_name: formData.hiringForCompanyName,
        company_name: formData.companyName,
        hide_company_info: formData.hideCompanyInfo,
        job_title: formData.jobTitle,
        category: formData.category,
        urgent_hiring: formData.urgentHiring,
        employment_type: formData.employmentType,
        shift: formData.shifts,
        work_mode: formData.workMode,
        job_locations: formData.jobLocations,
        include_relocation: formData.includeRelocation,
        min_experience: Number(formData.minExperience),
        max_experience: Number(formData.maxExperience),
        required_skills: formData.requiredSkills,
        educational_qualifications: formData.educationalQualifications,
        candidate_industries: formData.candidateIndustries,
        video_profile_required: formData.videoProfileRequired,
        job_description: formData.jobDescription,
        candidate_profile_headline: formData.profileHeadline,
        role_description: formData.roleDescription,
        key_responsibilities: formData.keyResponsibilities,
        required_qualifications: formData.requiredQualifications,
        perks: formData.perks,
        custom_perks: formData.customPerks,
        screening_questions: formData.screeningQuestions,
        is_walk_in: formData.isWalkIn,
        team_members: formData.teamMembers,
        email_notification_preference: formData.emailNotificationPreference,
        reference_code: formData.referenceCode,
        enable_auto_refresh: formData.enableAutoRefresh,
        refresh_frequency: formData.refreshFrequency,
        refresh_duration: formData.refreshDuration,
        min_salary: formData.minSalary ? Number(formData.minSalary.replace(/,/g, "")) : null,
        max_salary: formData.maxSalary ? Number(formData.maxSalary.replace(/,/g, "")) : null,
        openings: formData.openings ? Number(formData.openings) : null,
      }

      const result = await updateJobPosting(job.id, updateData)
      if (result.success) {
        alert("Job updated successfully!")
        router.push(`/employer/job-responses/${job.id}`)
      } else {
        alert(result.error || "Failed to update job")
      }
    } catch (error) {
      console.error("Error updating job:", error)
      alert("An error occurred while updating the job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/employer/job-responses/${job.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Responses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>
          <p className="text-gray-600 mt-2">Update your job posting details</p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={`flex items-center space-x-3 ${
                    currentStep === step.id
                      ? "text-blue-600"
                      : completedSteps.includes(step.id)
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep === step.id
                        ? "bg-blue-100"
                        : completedSteps.includes(step.id)
                          ? "bg-green-100"
                          : "bg-gray-100"
                    }`}
                  >
                    {completedSteps.includes(step.id) && step.id !== currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-medium hidden md:block">{step.name}</span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${completedSteps.includes(step.id) ? "bg-green-300" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Step 1: Job Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Job Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classified">Classified</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.category === "premium" && (
                  <div className="flex items-center space-x-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <Checkbox
                      id="urgentHiring"
                      checked={formData.urgentHiring}
                      onCheckedChange={(checked) => setFormData({ ...formData, urgentHiring: checked as boolean })}
                    />
                    <Label htmlFor="urgentHiring" className="cursor-pointer flex items-center gap-2">
                      <span className="font-semibold text-orange-700">Mark as Urgent Hiring</span>
                      <span className="text-sm text-orange-600">(Shows "URGENT HIRING" badge to candidates)</span>
                    </Label>
                  </div>
                )}

                <div>
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workMode">Work Mode *</Label>
                  <Select
                    value={formData.workMode}
                    onValueChange={(value) => setFormData({ ...formData, workMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-office">In Office</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shifts">Shift</Label>
                  <Select
                    value={formData.shifts}
                    onValueChange={(value) => setFormData({ ...formData, shifts: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day">Day</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="minExperience">Minimum Experience (years) *</Label>
                  <Select
                    value={formData.minExperience}
                    onValueChange={(value) => setFormData({ ...formData, minExperience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select min experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year} {year === 1 ? "year" : "years"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxExperience">Maximum Experience (years) *</Label>
                  <Select
                    value={formData.maxExperience}
                    onValueChange={(value) => setFormData({ ...formData, maxExperience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select max experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year} {year === 1 ? "year" : "years"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="openings">Number of Openings</Label>
                  <Input
                    id="openings"
                    type="number"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                    placeholder="e.g. 5"
                    className="max-w-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="minSalary">Minimum Salary</Label>
                  <Input
                    id="minSalary"
                    value={formData.minSalary}
                    onChange={(e) => handleSalaryChange("minSalary", e.target.value)}
                    placeholder="e.g. 5,00,000"
                  />
                </div>

                <div>
                  <Label htmlFor="maxSalary">Maximum Salary</Label>
                  <Input
                    id="maxSalary"
                    value={formData.maxSalary}
                    onChange={(e) => handleSalaryChange("maxSalary", e.target.value)}
                    placeholder="e.g. 8,00,000"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Job Locations * (Max 9)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="Enter city"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addLocation(locationInput)
                        }
                      }}
                    />
                    <Button type="button" onClick={() => addLocation(locationInput)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {INDIAN_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => addLocation(city)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.jobLocations.map((location: string) => (
                      <div key={location} className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                        <span className="text-sm">{location}</span>
                        <button type="button" onClick={() => removeLocation(location)} className="text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preferred Candidate Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferred Candidate Details</h2>

              <div>
                <Label>Required Skills *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Enter a skill"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill: string) => (
                    <div key={skill} className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                      <span className="text-sm">{skill}</span>
                      <button type="button" onClick={() => removeSkill(skill)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="educationalQualifications">Educational Qualifications</Label>
                <Input
                  id="educationalQualifications"
                  value={formData.educationalQualifications}
                  onChange={(e) => setFormData({ ...formData, educationalQualifications: e.target.value })}
                  placeholder="e.g. Bachelor's in Computer Science"
                />
              </div>

              <div>
                <Label htmlFor="candidateIndustries">Preferred Industries</Label>
                <Input
                  id="candidateIndustries"
                  value={formData.candidateIndustries}
                  onChange={(e) => setFormData({ ...formData, candidateIndustries: e.target.value })}
                  placeholder="e.g. IT, Software"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="videoProfileRequired"
                  checked={formData.videoProfileRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, videoProfileRequired: checked })}
                />
                <Label htmlFor="videoProfileRequired" className="cursor-pointer">
                  Require video profile from candidates
                </Label>
              </div>
            </div>
          )}

          {/* Step 3: Job Description */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Description</h2>

              <div>
                <Label htmlFor="jobDescription">Job Description * (Minimum 50 characters)</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  rows={6}
                  placeholder="Describe the job role, responsibilities, and requirements..."
                />
                <p className="text-sm text-gray-500 mt-1">{formData.jobDescription.length} / 50 characters minimum</p>
              </div>

              <div>
                <Label htmlFor="profileHeadline">Candidate Profile Headline</Label>
                <Input
                  id="profileHeadline"
                  value={formData.profileHeadline}
                  onChange={(e) => setFormData({ ...formData, profileHeadline: e.target.value })}
                  placeholder="e.g. Experienced Full Stack Developer"
                />
              </div>

              <div>
                <Label htmlFor="roleDescription">Role Description</Label>
                <Textarea
                  id="roleDescription"
                  value={formData.roleDescription}
                  onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
                  rows={4}
                  placeholder="Describe the role in detail..."
                />
              </div>

              <div>
                <Label htmlFor="keyResponsibilities">Key Responsibilities</Label>
                <Textarea
                  id="keyResponsibilities"
                  value={formData.keyResponsibilities}
                  onChange={(e) => setFormData({ ...formData, keyResponsibilities: e.target.value })}
                  rows={4}
                  placeholder="List the main responsibilities..."
                />
              </div>

              <div>
                <Label htmlFor="requiredQualifications">Required Qualifications</Label>
                <Textarea
                  id="requiredQualifications"
                  value={formData.requiredQualifications}
                  onChange={(e) => setFormData({ ...formData, requiredQualifications: e.target.value })}
                  rows={4}
                  placeholder="List required qualifications..."
                />
              </div>

              <div>
                <Label>Perks and Benefits</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {[
                    "Health Insurance",
                    "Work From Home",
                    "Flexible Hours",
                    "Free Snacks",
                    "Gym Membership",
                    "Learning Budget",
                  ].map((perk) => (
                    <button
                      key={perk}
                      type="button"
                      onClick={() => (formData.perks.includes(perk) ? removePerk(perk) : addPerk(perk))}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        formData.perks.includes(perk)
                          ? "bg-purple-50 border-purple-300 text-purple-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {perk}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={formData.customPerks}
                  onChange={(e) => setFormData({ ...formData, customPerks: e.target.value })}
                  placeholder="Any additional perks..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 4: Screening Questions */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Screening Questions (Optional)</h2>

              <div>
                <Label>Add Screening Questions</Label>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Enter a screening question"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addQuestion()
                      }
                    }}
                  />
                  <Button type="button" onClick={addQuestion}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.screeningQuestions.map((question: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm">{question}</span>
                      <button type="button" onClick={() => removeQuestion(index)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Advanced Options */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Options (Optional)</h2>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isWalkIn"
                  checked={formData.isWalkIn}
                  onCheckedChange={(checked) => setFormData({ ...formData, isWalkIn: checked })}
                />
                <Label htmlFor="isWalkIn" className="cursor-pointer">
                  This is a walk-in position
                </Label>
              </div>

              <div>
                <Label>Team Members (Add email addresses)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={teamMemberEmail}
                    onChange={(e) => setTeamMemberEmail(e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                  />
                  <Button type="button" onClick={handleAddTeamMember}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.teamMembers.map((email: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm">{email}</span>
                      <button type="button" onClick={() => handleRemoveTeamMember(index)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="referenceCode">Reference Code</Label>
                <Input
                  id="referenceCode"
                  value={formData.referenceCode}
                  onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
                  placeholder="Enter reference code"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableAutoRefresh"
                  checked={formData.enableAutoRefresh}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableAutoRefresh: checked })}
                />
                <Label htmlFor="enableAutoRefresh" className="cursor-pointer">
                  Enable auto-refresh for this job
                </Label>
              </div>

              {formData.enableAutoRefresh && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="refreshFrequency">Refresh Frequency</Label>
                    <Select
                      value={formData.refreshFrequency}
                      onValueChange={(value) => setFormData({ ...formData, refreshFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="refreshDuration">Duration</Label>
                    <Input
                      id="refreshDuration"
                      value={formData.refreshDuration}
                      onChange={(e) => setFormData({ ...formData, refreshDuration: e.target.value })}
                      placeholder="e.g. 30 days"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="emailNotificationPreference">Email Notification Preference</Label>
                <Select
                  value={formData.emailNotificationPreference}
                  onValueChange={(value) => setFormData({ ...formData, emailNotificationPreference: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                    <SelectItem value="none">No Notifications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < 5 ? (
                <Button type="button" onClick={handleNextStep} disabled={!isStepValid(currentStep)}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSaveChanges} disabled={loading || !isStepValid(currentStep)}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditJobForm
