"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface MultiSelectInputProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  onInputChange?: (value: string) => void
}

export function MultiSelectInput({
  options,
  value,
  onChange,
  placeholder,
  className,
  onInputChange,
}: MultiSelectInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(
    (option) => option.toLowerCase().startsWith(inputValue.toLowerCase()) && !value.includes(option),
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (inputRef.current) {
      ;(inputRef.current as any).getCurrentInputValue = () => inputValue
    }
  }, [inputValue])

  const handleSelect = (option: string) => {
    if (!value.includes(option)) {
      onChange([...value, option])
    }
    setInputValue("")
    onInputChange?.("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleRemove = (option: string) => {
    onChange(value.filter((v) => v !== option))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredOptions.length > 0) {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[selectedIndex])
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0])
      } else if (inputValue.trim()) {
        // Add custom skill if no exact match
        handleSelect(inputValue.trim())
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last skill when backspace is pressed and input is empty
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`flex flex-wrap gap-1.5 px-2 py-1.5 border rounded-md bg-white ${className || ""}`}>
        {value.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1 px-1.5 py-0.5 text-[10px] lg:text-xs"
          >
            {skill}
            <button type="button" onClick={() => handleRemove(skill)} className="hover:bg-blue-300 rounded-full p-0.5">
              <X className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            onInputChange?.(e.target.value)
            setShowSuggestions(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] lg:min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
        />
      </div>

      {showSuggestions && inputValue && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.slice(0, 50).map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                index === selectedIndex ? "bg-gray-100" : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
