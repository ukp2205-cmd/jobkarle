"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Briefcase, Edit, Save, X, ArrowLeft, CheckCircle, XCircle, Clock, Upload } from "lucide-react"
import {
  getEmployerProfile,
  updateEmployerProfile,
  uploadEmployerProfileLogo,
} from "@/app/actions/employer-profile-actions"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmployerProfileProps {
  employerId: string
}

interface ProfileData {
  id: string
  username: string
  email: string
  contact_person: string
  mobile_number: string
  company_name: string
  company_type: string
  industry_type: string
  city: string
  website?: string
  designation?: string
  description?: string
  year_established?: string
  employee_count?: string
  logo_url?: string
  tan_number?: string
  gstin?: string
  phone_number_2?: string
  address_label?: string
  address?: string
  country?: string
  state?: string
  city_detail?: string
  pincode?: string
  created_at: string
}

interface JobStats {
  total: number
  active: number
  closed: number
  draft: number
}

export function EmployerProfile({ employerId }: EmployerProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [jobStats, setJobStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({})
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [employerId])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const result = await getEmployerProfile()
      if (result.success && result.profile) {
        setProfile(result.profile)
        setJobStats(result.jobStats)
        setEditedProfile(result.profile)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateEmployerProfile(editedProfile)
      if (result.success) {
        setProfile(result.profile)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile || {})
    setIsEditing(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadEmployerProfileLogo(formData)

      if (result.success && result.url) {
        setEditedProfile({ ...editedProfile, logo_url: result.url })
        setProfile({ ...profile!, logo_url: result.url })
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to upload logo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error uploading logo:", error)
      toast({
        title: "Error",
        description: "An error occurred while uploading logo",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/employer/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Employer Profile</h1>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Summary & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Summary Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    {profile?.logo_url ? (
                      <img
                        src={profile.logo_url || "/placeholder.svg"}
                        alt={profile.company_name}
                        className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                        {profile?.company_name?.charAt(0) || "C"}
                      </div>
                    )}
                    {isEditing && (
                      <label
                        htmlFor="logo-upload"
                        className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 shadow-lg"
                      >
                        <Upload className="w-4 h-4" />
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-4">{profile?.company_name}</h2>
                  <p className="text-sm text-gray-600 mt-1">{profile?.contact_person}</p>
                  <p className="text-sm text-gray-500">{profile?.designation}</p>
                  {isEditing && <p className="text-xs text-gray-500 mt-2">Click the upload icon to change logo</p>}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Member since {profile && new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Total Jobs</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{jobStats?.total || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Active Jobs</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{jobStats?.active || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Draft Jobs</span>
                  </div>
                  <span className="text-xl font-bold text-gray-600">{jobStats?.draft || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">Closed Jobs</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{jobStats?.closed || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="company">Company Info</TabsTrigger>
                <TabsTrigger value="contact">Contact Details</TabsTrigger>
                <TabsTrigger value="additional">Additional Info</TabsTrigger>
              </TabsList>

              {/* Company Info Tab */}
              <TabsContent value="company">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company Name *</Label>
                        {isEditing ? (
                          <Input
                            id="company_name"
                            value={editedProfile.company_name || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, company_name: e.target.value })}
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.company_name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="company_type">Company Type</Label>
                        {isEditing ? (
                          <Select
                            value={editedProfile.company_type || ""}
                            onValueChange={(value) => setEditedProfile({ ...editedProfile, company_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Private Limited">Private Limited</SelectItem>
                              <SelectItem value="Public Limited">Public Limited</SelectItem>
                              <SelectItem value="Partnership">Partnership</SelectItem>
                              <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                              <SelectItem value="LLP">LLP</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.company_type || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="industry_type">Industry Type</Label>
                        {isEditing ? (
                          <Input
                            id="industry_type"
                            value={editedProfile.industry_type || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, industry_type: e.target.value })}
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.industry_type || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="year_established">Year Established</Label>
                        {isEditing ? (
                          <Input
                            id="year_established"
                            value={editedProfile.year_established || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, year_established: e.target.value })}
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.year_established || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="employee_count">Employee Count</Label>
                        {isEditing ? (
                          <Select
                            value={editedProfile.employee_count || ""}
                            onValueChange={(value) => setEditedProfile({ ...editedProfile, employee_count: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10</SelectItem>
                              <SelectItem value="11-50">11-50</SelectItem>
                              <SelectItem value="51-200">51-200</SelectItem>
                              <SelectItem value="201-500">201-500</SelectItem>
                              <SelectItem value="501+">501+</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.employee_count || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="website">Website</Label>
                        {isEditing ? (
                          <Input
                            id="website"
                            value={editedProfile.website || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                            placeholder="https://example.com"
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.website || "N/A"}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Company Description</Label>
                      {isEditing ? (
                        <Textarea
                          id="description"
                          value={editedProfile.description || ""}
                          onChange={(e) => setEditedProfile({ ...editedProfile, description: e.target.value })}
                          rows={4}
                          placeholder="Tell us about your company..."
                        />
                      ) : (
                        <p className="mt-2 text-gray-900 whitespace-pre-wrap">{profile.description || "N/A"}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Details Tab */}
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_person">Contact Person *</Label>
                        {isEditing ? (
                          <Input
                            id="contact_person"
                            value={editedProfile.contact_person || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, contact_person: e.target.value })}
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.contact_person}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="designation">Designation</Label>
                        {isEditing ? (
                          <Input
                            id="designation"
                            value={editedProfile.designation || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, designation: e.target.value })}
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.designation || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <p className="mt-2 text-gray-900">{profile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <Label htmlFor="mobile_number">Mobile Number *</Label>
                        {isEditing ? (
                          <Input
                            id="mobile_number"
                            value={editedProfile.mobile_number || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, mobile_number: e.target.value })}
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.mobile_number}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone_number_2">Alternate Phone</Label>
                        {isEditing ? (
                          <Input
                            id="phone_number_2"
                            value={editedProfile.phone_number_2 || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, phone_number_2: e.target.value })}
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.phone_number_2 || "N/A"}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-semibold mb-4">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="address_label">Address Label</Label>
                          {isEditing ? (
                            <Input
                              id="address_label"
                              value={editedProfile.address_label || ""}
                              onChange={(e) => setEditedProfile({ ...editedProfile, address_label: e.target.value })}
                              placeholder="e.g., Head Office"
                            />
                          ) : (
                            <p className="mt-2 text-gray-900">{profile.address_label || "N/A"}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="city">City *</Label>
                          {isEditing ? (
                            <Input
                              id="city"
                              value={editedProfile.city || ""}
                              onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                            />
                          ) : (
                            <p className="mt-2 text-gray-900">{profile.city}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="state">State</Label>
                          {isEditing ? (
                            <Input
                              id="state"
                              value={editedProfile.state || ""}
                              onChange={(e) => setEditedProfile({ ...editedProfile, state: e.target.value })}
                            />
                          ) : (
                            <p className="mt-2 text-gray-900">{profile.state || "N/A"}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          {isEditing ? (
                            <Input
                              id="pincode"
                              value={editedProfile.pincode || ""}
                              onChange={(e) => setEditedProfile({ ...editedProfile, pincode: e.target.value })}
                            />
                          ) : (
                            <p className="mt-2 text-gray-900">{profile.pincode || "N/A"}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="country">Country</Label>
                          {isEditing ? (
                            <Input
                              id="country"
                              value={editedProfile.country || ""}
                              onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                            />
                          ) : (
                            <p className="mt-2 text-gray-900">{profile.country || "N/A"}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="address">Full Address</Label>
                          {isEditing ? (
                            <Textarea
                              id="address"
                              value={editedProfile.address || ""}
                              onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                              rows={3}
                            />
                          ) : (
                            <p className="mt-2 text-gray-900 whitespace-pre-wrap">{profile.address || "N/A"}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Additional Info Tab */}
              <TabsContent value="additional">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tan_number">TAN Number</Label>
                        {isEditing ? (
                          <Input
                            id="tan_number"
                            value={editedProfile.tan_number || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, tan_number: e.target.value })}
                            placeholder="ABCD12345E"
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.tan_number || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="gstin">GSTIN</Label>
                        {isEditing ? (
                          <Input
                            id="gstin"
                            value={editedProfile.gstin || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, gstin: e.target.value })}
                            placeholder="22AAAAA0000A1Z5"
                          />
                        ) : (
                          <p className="mt-2 text-gray-900">{profile.gstin || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="username">Username</Label>
                        <p className="mt-2 text-gray-900">{profile.username}</p>
                        <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
