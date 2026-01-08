"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MonthYearPickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MonthYearPicker({ value, onChange, placeholder = "Select month", disabled }: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false)
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  // Parse the value (YYYY-MM format) if it exists
  const parseValue = (val?: string) => {
    if (!val) return { year: currentYear, month: currentDate.getMonth() }
    const [year, month] = val.split("-")
    return { year: Number.parseInt(year), month: Number.parseInt(month) - 1 }
  }

  const { year: selectedYear, month: selectedMonth } = parseValue(value)
  const [displayYear, setDisplayYear] = React.useState(selectedYear || currentYear)

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i)

  const handleMonthSelect = (monthIndex: number) => {
    const formattedDate = `${displayYear}-${String(monthIndex + 1).padStart(2, "0")}`
    onChange(formattedDate)
    setOpen(false)
  }

  const formatDisplay = (val?: string) => {
    if (!val) return placeholder
    const { year, month } = parseValue(val)
    return `${months[month]} ${year}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 px-3",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplay(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <div className="p-4 space-y-4">
          {/* Year Selector */}
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => setDisplayYear(displayYear - 1)}
            >
              ‹
            </Button>
            <select
              value={displayYear}
              onChange={(e) => setDisplayYear(Number.parseInt(e.target.value))}
              className="flex-1 h-8 px-2 border rounded-md text-sm font-medium"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => setDisplayYear(displayYear + 1)}
            >
              ›
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const isSelected = selectedYear === displayYear && selectedMonth === index
              return (
                <Button
                  key={month}
                  type="button"
                  variant="ghost"
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    "h-9 text-sm font-normal",
                    isSelected && "bg-blue-600 text-white hover:bg-blue-700 hover:text-white",
                  )}
                >
                  {month.slice(0, 3)}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
