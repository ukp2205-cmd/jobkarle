"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Briefcase } from "lucide-react"

interface HiringForSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelect: (type: "own_company" | "client") => void
  companyName: string
}

export default function HiringForSelectionModal({
  open,
  onClose,
  onSelect,
  companyName,
}: HiringForSelectionModalProps) {
  const [selectedType, setSelectedType] = useState<"own_company" | "client">("own_company")

  const handleContinue = () => {
    onSelect(selectedType)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center space-y-6 py-6">
          {/* JobKarle Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              JobKarle
            </span>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              JobKarle welcomes all direct recruiters, small companies and recruitment consultants.
            </p>
          </div>

          {/* Question */}
          <div className="w-full space-y-4">
            <h3 className="text-lg font-semibold text-center text-gray-900">Whom are you hiring staff for?</h3>

            <RadioGroup
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as "own_company" | "client")}
              className="space-y-3"
            >
              {/* Option 1: Your own company */}
              <div
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedType === "own_company"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedType("own_company")}
              >
                <RadioGroupItem value="own_company" id="own_company" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="own_company" className="cursor-pointer">
                    <div className="font-medium text-gray-900">Your own company</div>
                    <div className="text-sm text-gray-500">(enterprise, business owners)</div>
                    {selectedType === "own_company" && (
                      <div className="mt-2 text-sm text-blue-600 font-medium">Company: {companyName}</div>
                    )}
                  </Label>
                </div>
              </div>

              {/* Option 2: Your clients */}
              <div
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedType === "client" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedType("client")}
              >
                <RadioGroupItem value="client" id="client" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="client" className="cursor-pointer">
                    <div className="font-medium text-gray-900">Your clients</div>
                    <div className="text-sm text-gray-500">(manpower consultants, staffing companies)</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Continue Button */}
          <Button onClick={handleContinue} className="w-full bg-blue-600 hover:bg-blue-700">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
