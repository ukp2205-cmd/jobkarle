"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface AutocompleteInputProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AutocompleteInput({
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [filteredOptions, setFilteredOptions] = React.useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (inputValue) {
      const filtered = options.filter((option) => option.toLowerCase().startsWith(inputValue.toLowerCase()))
      setFilteredOptions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredOptions([])
      setShowSuggestions(false)
    }
  }, [inputValue, options])

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setHighlightedIndex(-1)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    onChange(suggestion)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault()
      handleSuggestionClick(filteredOptions[highlightedIndex])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (filteredOptions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        placeholder={placeholder}
        className={cn("w-full", className)}
        disabled={disabled}
      />
      {showSuggestions && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={option}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm",
                highlightedIndex === index ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-900",
              )}
              onClick={() => handleSuggestionClick(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
