"use client"

import type React from "react"
import Link from "next/link"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Briefcase, ArrowRight, CheckCircle2, Clock } from "lucide-react"
import { loginEmployer } from "@/app/actions/employer-auth-actions"

export default function EmployerLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const isTimeout = searchParams.get("timeout") === "true"

  useEffect(() => {
    if (isTimeout) {
      const timer = setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete("timeout")
        router.replace(url.pathname + url.search)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [isTimeout, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Attempting to login employer:", formData.email)
      const { loginEmployer } = await import("@/app/actions/employer-auth-actions")
      const { getActiveCredits } = await import("@/app/actions/credits-actions")
      
      const result = await loginEmployer(formData.email, formData.password)

      if (result.success) {
        console.log("[v0] Login successful, allocating free credits if needed")
        
        // Auto-allocate 10 free monthly credits on first login or if expired
        try {
          const employerId = result.session?.employerId
          
          // Only check/allocate credits if we have a valid employerId
          if (employerId) {
            const { allocateMonthlyFreeCredits, hasActiveFreeCredits } = await import("@/app/actions/free-credits-actions")
            const hasCredits = await hasActiveFreeCredits(employerId)
            
            if (!hasCredits) {
              console.log("[v0] No active free credits found, allocating 10 monthly free credits")
              await allocateMonthlyFreeCredits(employerId)
            } else {
              console.log("[v0] Employer already has active free credits")
            }
          } else {
            console.warn("[v0] No employerId in session, skipping free credits check")
          }
        } catch (error) {
          console.error("[v0] Error checking/allocating free credits:", error)
        }
        
        console.log("[v0] Checking for redirect parameters")
        
        // Check URL params for redirect and plan selection
        const urlParams = new URLSearchParams(window.location.search)
        const redirectUrl = urlParams.get("redirect")
        const planSlug = urlParams.get("plan")
        
        // If coming from pricing page with a selected plan, redirect to pricing with plan param
        if (redirectUrl === "/employer/pricing" && planSlug) {
          console.log("[v0] Redirecting back to pricing with selected plan:", planSlug)
          window.location.href = `/employer/pricing?selectedPlan=${planSlug}`
          return
        }
        
        // If there's a general redirect URL, use it
        if (redirectUrl) {
          console.log("[v0] Redirecting to:", redirectUrl)
          window.location.href = redirectUrl
          return
        }
        
        console.log("[v0] No redirect param, checking credits")
        
        // Check if employer has credits
        if (result.session?.employerId) {
          const creditBalance = await getActiveCredits(result.session.employerId)
          console.log("[v0] Credit balance:", creditBalance)
          
          // If no credits or insufficient credits (less than 2), redirect to pricing
          if (!creditBalance || creditBalance.remainingCredits < 2) {
            console.log("[v0] No sufficient credits, redirecting to pricing page")
            window.location.href = "/employer/pricing?source=login&reason=no_credits"
            return
          }
        }
        
        console.log("[v0] Credits available, redirecting to dashboard")
        window.location.href = "/employer/dashboard"
      } else {
        setError(result.error || "Login failed. Please try again.")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">JobKarle</h1>
                <p className="text-gray-600">Hire the Best Talent</p>
              </div>
            </Link>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Find Top Candidates Today</h2>
            <p className="text-lg text-gray-600">
              Join thousands of employers who have successfully hired qualified candidates through our platform.
            </p>

            <div className="space-y-4">
              {[
                "Access a vast pool of qualified candidates",
                "Post unlimited job openings",
                "Advanced candidate filtering and search",
                "Track applications and manage hiring pipeline",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="p-8 lg:p-10 shadow-2xl border-0 bg-white/80 backdrop-blur">
          <div className="space-y-6">
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Employer Login</h2>
              <p className="text-gray-600">Sign in to manage your job postings</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isTimeout && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Session Expired</h4>
                      <p className="text-sm text-red-700">Your session expired. Please login again to continue.</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
                  <span className="font-medium">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="h-12 px-4 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <a href="/employer/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="h-12 px-4 pr-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">New to JobKarle?</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-semibold text-base transition-all duration-200 bg-transparent"
                onClick={() => router.push("/employer/register")}
              >
                Create an Account
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>
                Looking for a job?{" "}
                <a href="/candidate/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Candidate Login
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
