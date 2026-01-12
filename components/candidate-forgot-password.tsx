"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { ArrowLeft, Mail, Briefcase, CheckCircle2 } from "lucide-react"
import { sendEmailViaMSG91 } from "@/app/actions/email-actions"
import { createBrowserClient } from "@supabase/ssr"

const PRODUCTION_DOMAIN = "https://jobkarle.com"

export default function CandidateForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (!email || !email.includes("@")) {
        setMessage({ type: "error", text: "Please enter a valid email address" })
        setIsLoading(false)
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      )

      const { data: candidate, error: queryError } = await supabase
        .from("candidates")
        .select("full_name, id")
        .eq("email", email)
        .single()

      if (queryError || !candidate) {
        setMessage({ type: "error", text: "Email not found in our system" })
        setIsLoading(false)
        return
      }

      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

      const { error: updateError } = await supabase
        .from("candidates")
        .update({
          reset_token: resetToken,
          reset_token_expires_at: resetTokenExpiry.toISOString(),
        })
        .eq("id", candidate.id)

      if (updateError) {
        setMessage({ type: "error", text: "Failed to generate reset link. Please try again." })
        setIsLoading(false)
        return
      }

      const generatedResetLink = `${PRODUCTION_DOMAIN}/candidate/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      const candidateName = candidate.full_name || "User"

      const emailResult = await sendEmailViaMSG91({
        to: email,
        subject: "Reset Your JobKarle Password",
        html: "",
        resetLink: generatedResetLink,
        name: candidateName,
      })

      if (emailResult.success) {
        setSentEmail(email)
        setIsSuccess(true)
        setEmail("")
      } else {
        setMessage({
          type: "error",
          text: emailResult.error || "Failed to send reset link. Please try again.",
        })
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50/30 p-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Check Your Email</h2>
            <p className="text-gray-500 text-sm mb-4">
              We've sent a reset link to <span className="font-medium text-gray-700">{sentEmail}</span>
            </p>

            <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-gray-600">
              Didn't receive it? Check spam folder or request a new link.
            </div>

            <Button
              onClick={() => setIsSuccess(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-lg font-medium text-sm mb-2"
            >
              Send Another Link
            </Button>

            <Link
              href="/candidate/login"
              className="block w-full py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50/30 p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-blue-600">JobKarle</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
            <p className="text-gray-500 text-sm">
              No worries! Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 focus:bg-white text-sm"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"} className="py-2">
                <AlertDescription className="text-xs">{message.text}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-lg font-semibold text-sm shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-3 text-gray-400 text-xs">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Back to Login */}
            <Link
              href="/candidate/login"
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 h-11 rounded-lg font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            {/* Employer Link */}
            <p className="text-center text-xs text-gray-500 pt-3 border-t border-gray-100">
              Employer?{" "}
              <Link href="/employer/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                Reset Employer Password
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
