"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Briefcase, ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { requestEmployerPasswordReset } from "@/app/actions/password-reset-actions"

export default function EmployerForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [resetUrl, setResetUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setResetUrl("")
    setIsLoading(true)

    try {
      const result = await requestEmployerPasswordReset(email)

      if (result.success) {
        setMessage(result.message || "Password reset link sent to your email.")
        if (result.resetUrl) {
          setResetUrl(result.resetUrl)
        }
      } else {
        setError(result.error || "Failed to send reset link")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">JobKarle</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
              <p className="text-gray-600">
                No worries! Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {message && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-green-700 font-medium">{message}</p>
                      {resetUrl && (
                        <div className="mt-3 p-3 bg-white rounded border border-green-200">
                          <p className="text-xs text-gray-600 mb-2">Development Mode - Reset Link:</p>
                          <a href={resetUrl} className="text-xs text-blue-600 hover:text-blue-700 break-all underline">
                            {resetUrl}
                          </a>
                        </div>
                      )}
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
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-12 pl-10 pr-4 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Link href="/employer/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-semibold transition-all bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>
                Candidate?{" "}
                <a href="/candidate/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  Reset Candidate Password
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
