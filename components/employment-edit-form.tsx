"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Save, X } from "lucide-react"
import { Card } from "@/components/ui/card"

type EmploymentEntry = {
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
}

type EmploymentEditFormProps = {
  employmentHistory: EmploymentEntry[]
  onSave: (history: EmploymentEntry[]) => Promise<void>
  onCancel: () => void
}

export default function EmploymentEditForm({ employmentHistory, onSave, onCancel }: EmploymentEditFormProps) {
  const [entries, setEntries] = useState<EmploymentEntry[]>(
    employmentHistory.length > 0
      ? employmentHistory
      : [
          {
            job_title: "",
            company_name: "",
            employment_type: "full-time",
            start_date: "",
            end_date: "",
            is_current: false,
          },
        ],
  )
  const [saving, setSaving] = useState(false)

  const handleAddEntry = () => {
    setEntries([
      ...entries,
      {
        job_title: "",
        company_name: "",
        employment_type: "full-time",
        start_date: "",
        end_date: "",
        is_current: false,
      },
    ])
  }

  const handleRemoveEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const handleEntryChange = (index: number, field: keyof EmploymentEntry, value: any) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }

    // If marking as current, clear end date
    if (field === "is_current" && value === true) {
      updated[index].end_date = ""
    }

    setEntries(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(entries)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <Card key={index} className="p-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Employment {index + 1}</h4>
            {entries.length > 1 && (
              <Button
                onClick={() => handleRemoveEntry(index)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Job Title *</Label>
              <Input
                value={entry.job_title || entry.currentJobTitle || ""}
                onChange={(e) => handleEntryChange(index, "job_title", e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div>
              <Label>Company Name *</Label>
              <Input
                value={entry.company_name || entry.companyName || ""}
                onChange={(e) => handleEntryChange(index, "company_name", e.target.value)}
                placeholder="e.g. TCS"
              />
            </div>

            <div>
              <Label>Employment Type</Label>
              <Select
                value={entry.employment_type || "full-time"}
                onValueChange={(value) => handleEntryChange(index, "employment_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Start Date *</Label>
              <Input
                type="month"
                value={entry.start_date || entry.durationFrom || ""}
                onChange={(e) => handleEntryChange(index, "start_date", e.target.value)}
              />
            </div>

            <div>
              <Label>End Date {(entry.is_current || entry.currently_working) && "(Current)"}</Label>
              <Input
                type="month"
                value={entry.end_date || entry.durationTo || ""}
                onChange={(e) => handleEntryChange(index, "end_date", e.target.value)}
                disabled={entry.is_current || entry.currently_working}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id={`current-${index}`}
                checked={entry.is_current || entry.currently_working || false}
                onCheckedChange={(checked) => handleEntryChange(index, "is_current", checked)}
              />
              <Label htmlFor={`current-${index}`} className="cursor-pointer">
                I currently work here
              </Label>
            </div>
          </div>
        </Card>
      ))}

      <Button onClick={handleAddEntry} variant="outline" className="w-full bg-transparent">
        <Plus className="w-4 h-4 mr-2" />
        Add Another Employment
      </Button>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save Changes"}
          {!saving && <Save className="w-4 h-4 ml-2" />}
        </Button>
        <Button onClick={onCancel} variant="outline" disabled={saving}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
