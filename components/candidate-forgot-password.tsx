"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { ArrowLeft, Mail, Briefcase } from "lucide-react"
import { sendEmailViaMSG91 } from "@/app/actions/email-actions"
import { createBrowserClient } from "@supabase/ssr"

const PRODUCTION_DOMAIN = "https://jobkarle.com"

export default function CandidateForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
        console.error("[v0] Failed to save reset token:", updateError)
        setMessage({ type: "error", text: "Failed to generate reset link. Please try again." })
        setIsLoading(false)
        return
      }

      const generatedResetLink = `${PRODUCTION_DOMAIN}/candidate/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      const candidateName = candidate.full_name || "User"

      const emailOptions = {
        to: email,
        subject: "Reset Your JobKarle Password",
        html: "",
        resetLink: generatedResetLink,
        name: candidateName,
      }

      const emailResult = await sendEmailViaMSG91(emailOptions)

      if (emailResult.success) {
        setMessage({
          type: "success",
          text: "Password reset link has been sent to your email. Please check your inbox.",
        })
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">JobKarle</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-center text-gray-600 mb-8">
            No worries! Enter your email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-2.5 border border-gray-300 rounded-lg"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <Link
              href="/candidate/login"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            <div className="text-center text-sm text-gray-600 mt-6">
              Employer?{" "}
              <Link href="/employer/forgot-password" className="text-blue-500 hover:underline font-medium">
                Reset Employer Password
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
