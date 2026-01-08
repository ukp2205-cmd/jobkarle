"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Eye, EyeOff, Shield, Ban, AlertTriangle, Save } from "lucide-react"
import {
  getCandidatePrivacySettings,
  updateProfileVisibility,
  blockCompany,
  unblockCompany,
  deactivateProfile,
  reactivateProfile,
  searchCompanies,
} from "@/app/actions/candidate-privacy-actions"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type PrivacySettings = {
  profile_visibility: "public" | "hidden" | "private"
  blocked_companies: string[]
  is_profile_active: boolean
  deactivated_at: string | null
  deactivation_reason: string | null
}

type BlockedCompany = {
  id: string
  company_name: string
  reason: string
  custom_reason?: string
  blocked_at: string
}

type SearchCompany = {
  company_name: string
  employer_id: string
}

export function CandidateSettingsView({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [settings, setSettings] = useState<PrivacySettings | null>(null)
  const [blockedCompanies, setBlockedCompanies] = useState<BlockedCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [companySearchQuery, setCompanySearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchCompany[]>([])
  const [deactivationReason, setDeactivationReason] = useState("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedCompanyToBlock, setSelectedCompanyToBlock] = useState<SearchCompany | null>(null)
  const [blockReason, setBlockReason] = useState("")
  const [customBlockReason, setCustomBlockReason] = useState("")

  useEffect(() => {
    loadSettings()
  }, [candidateId])

  const loadSettings = async () => {
    setIsLoading(true)
    const result = await getCandidatePrivacySettings(candidateId)
    if (result.success && result.data) {
      setSettings(result.data.settings)
      setBlockedCompanies(result.data.blockedCompanies)
    }
    setIsLoading(false)
  }

  const handleVisibilityChange = async (visibility: "public" | "hidden" | "private") => {
    setIsSaving(true)
    const result = await updateProfileVisibility(candidateId, visibility)
    if (result.success) {
      setSettings((prev) => (prev ? { ...prev, profile_visibility: visibility } : null))
      setSuccessMessage("Profile visibility updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setIsSaving(false)
  }

  useEffect(() => {
    if (companySearchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearchCompanies()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [companySearchQuery])

  const handleSearchCompanies = async () => {
    console.log("[v0] Searching for companies with query:", companySearchQuery)

    if (!companySearchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const result = await searchCompanies(companySearchQuery)
      console.log("[v0] Company search result:", result)

      if (result.success && result.companies) {
        setSearchResults(result.companies)
        console.log("[v0] Found companies:", result.companies.length)
      } else {
        console.log("[v0] No companies found or error:", result.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error("[v0] Error searching companies:", error)
      setSearchResults([])
    }
  }

  const handleSelectCompanyToBlock = (company: SearchCompany) => {
    setSelectedCompanyToBlock(company)
    setBlockReason("")
    setCustomBlockReason("")
  }

  const handleConfirmBlock = async () => {
    if (!selectedCompanyToBlock || !blockReason) return

    const finalReason = blockReason === "Other" ? customBlockReason : blockReason

    if (!finalReason.trim()) {
      return
    }

    setIsSaving(true)
    const result = await blockCompany(candidateId, selectedCompanyToBlock.company_name, blockReason, customBlockReason)
    if (result.success) {
      await loadSettings()
      setCompanySearchQuery("")
      setSearchResults([])
      setSelectedCompanyToBlock(null)
      setBlockReason("")
      setCustomBlockReason("")
      setSuccessMessage("Company blocked successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setIsSaving(false)
  }

  const handleUnblockCompany = async (companyName: string) => {
    setIsSaving(true)
    const result = await unblockCompany(candidateId, companyName)
    if (result.success) {
      await loadSettings()
      setSuccessMessage("Company unblocked successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setIsSaving(false)
  }

  const handleDeactivateProfile = async () => {
    setIsSaving(true)
    const result = await deactivateProfile(candidateId, deactivationReason)
    if (result.success) {
      router.push("/candidate/login")
    }
    setIsSaving(false)
  }

  const handleReactivateProfile = async () => {
    setIsSaving(true)
    const result = await reactivateProfile(candidateId)
    if (result.success) {
      await loadSettings()
      setSuccessMessage("Profile reactivated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/candidate/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">JK</span>
              </div>
              <span className="text-lg font-semibold text-blue-600">JobKarle</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy & Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your profile visibility and privacy preferences</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Save className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Deactivation Warning */}
          {settings && !settings.is_profile_active && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Profile Deactivated
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Your profile was deactivated on {new Date(settings.deactivated_at!).toLocaleDateString()}
                  {settings.deactivation_reason && `. Reason: ${settings.deactivation_reason}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleReactivateProfile}
                  disabled={isSaving}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isSaving ? "Reactivating..." : "Reactivate Profile"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Profile Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Profile Visibility
              </CardTitle>
              <CardDescription>Control who can see your profile in search results</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={settings?.profile_visibility}
                onValueChange={handleVisibilityChange}
                disabled={isSaving || !settings?.is_profile_active}
              >
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="public" id="public" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="public" className="text-sm font-medium cursor-pointer">
                        Public
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Your profile is visible to all employers in search results and job recommendations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="hidden" id="hidden" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="hidden" className="text-sm font-medium cursor-pointer">
                        Hidden
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Your profile won't appear in search results, but you can still apply to jobs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="private" id="private" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="private" className="text-sm font-medium cursor-pointer">
                        Private
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Only employers you've applied to can view your profile details
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
              <Button
                onClick={() => handleVisibilityChange(settings.profile_visibility)}
                disabled={isSaving}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 mt-4"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>

          {/* Block Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                Block Companies
              </CardTitle>
              <CardDescription>Prevent specific companies from viewing your profile or contacting you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search for companies */}
              <div className="space-y-2">
                <Label htmlFor="company-search" className="text-sm font-medium">
                  Search Company to Block
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="company-search"
                    placeholder="Enter company name..."
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    disabled={!settings?.is_profile_active}
                    className="h-11 rounded-full px-4 text-sm"
                  />
                </div>
                {companySearchQuery.trim() && searchResults.length === 0 && (
                  <p className="text-xs text-gray-500">Searching...</p>
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search Results</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((company, index) => (
                      <div
                        key={`${company.company_name}-${index}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium">{company.company_name}</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSelectCompanyToBlock(company)}
                          disabled={isSaving}
                        >
                          Block
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocked companies list */}
              {blockedCompanies.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Blocked Companies ({blockedCompanies.length})</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {blockedCompanies.map((company, index) => (
                      <div
                        key={`${company.company_name}-${index}`}
                        className="flex flex-col gap-2 p-3 border rounded-lg bg-red-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Ban className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{company.company_name}</p>
                              <p className="text-xs text-gray-600 mt-0.5">Reason: {company.reason}</p>
                              {company.custom_reason && (
                                <p className="text-xs text-gray-500">Custom Reason: {company.custom_reason}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Blocked on {new Date(company.blocked_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblockCompany(company.company_name)}
                            disabled={isSaving || !settings?.is_profile_active}
                            className="ml-2 flex-shrink-0"
                          >
                            Unblock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {blockedCompanies.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-4">No companies blocked yet</p>
              )}
            </CardContent>
          </Card>

          {/* Deactivate Profile */}
          {settings?.is_profile_active && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <Shield className="w-5 h-5" />
                  Deactivate Profile
                </CardTitle>
                <CardDescription>
                  Temporarily deactivate your profile. You can reactivate it anytime by logging back in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deactivation-reason" className="text-sm font-medium">
                    Reason for deactivation (optional)
                  </Label>
                  <Textarea
                    id="deactivation-reason"
                    placeholder="Let us know why you're deactivating your profile..."
                    value={deactivationReason}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isSaving}>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Deactivate Profile
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to deactivate your profile?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>When you deactivate your profile:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Your profile will be hidden from all employers</li>
                          <li>You won't receive job recommendations</li>
                          <li>Employers won't be able to contact you</li>
                          <li>You can reactivate anytime by logging back in</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeactivateProfile} className="bg-red-600 hover:bg-red-700">
                        {isSaving ? "Deactivating..." : "Yes, Deactivate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Block Company Dialog */}
      <AlertDialog open={!!selectedCompanyToBlock} onOpenChange={(open) => !open && setSelectedCompanyToBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {selectedCompanyToBlock?.company_name}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Please select a reason for blocking this company:</p>

              <div className="space-y-3">
                <Label htmlFor="block-reason" className="text-sm font-medium text-gray-900">
                  Reason for blocking
                </Label>
                <Select value={blockReason} onValueChange={setBlockReason}>
                  <SelectTrigger id="block-reason" className="w-full">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Poor work culture">Poor work culture</SelectItem>
                    <SelectItem value="Low compensation">Low compensation</SelectItem>
                    <SelectItem value="Bad interview experience">Bad interview experience</SelectItem>
                    <SelectItem value="Unprofessional communication">Unprofessional communication</SelectItem>
                    <SelectItem value="Previously worked there">Previously worked there</SelectItem>
                    <SelectItem value="Not interested in company">Not interested in company</SelectItem>
                    <SelectItem value="Other">Other (specify below)</SelectItem>
                  </SelectContent>
                </Select>

                {blockReason === "Other" && (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="custom-reason" className="text-sm font-medium text-gray-900">
                      Please specify your reason
                    </Label>
                    <Textarea
                      id="custom-reason"
                      placeholder="Enter your reason for blocking this company..."
                      value={customBlockReason}
                      onChange={(e) => setCustomBlockReason(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-yellow-800">
                  Once blocked, you won't see any job postings from this company in your recommendations or search
                  results.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              disabled={!blockReason || (blockReason === "Other" && !customBlockReason.trim()) || isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? "Blocking..." : "Block Company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
