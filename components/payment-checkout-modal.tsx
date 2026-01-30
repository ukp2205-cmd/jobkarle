"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Mail, Lock, X } from "lucide-react"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { useRouter } from "next/navigation"
import { PaymentCheckoutForm } from "@/components/payment-checkout-form"

interface PaymentCheckoutModalProps {
  planType: string
  billingCycle?: "monthly" | "annual"
  amount: number
  onClose: () => void
}

export function PaymentCheckoutModal({ planType, billingCycle = "monthly", amount, onClose }: PaymentCheckoutModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<"login" | "payment">("login")
  const [loading, setLoading] = useState(true)
  const [employerData, setEmployerData] = useState<any>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { success, session } = await getEmployerSession()
    if (success && session) {
      setEmployerData(session)
      setStep("payment")
    }
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError("")

    try {
      const response = await fetch("/api/employer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const result = await response.json()

      if (result.success) {
        const userData = {
          employerId: result.user.id,
          email: result.user.email,
          companyName: result.user.companyName,
          contactPerson: result.user.contactPerson,
          mobileNumber: result.user.mobileNumber,
        }
        setEmployerData(userData)
        setStep("payment")
      } else {
        setLoginError(result.message || "Login failed")
      }
    } catch (error) {
      setLoginError("An error occurred during login")
    } finally {
      setLoggingIn(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-0 shadow-2xl overflow-hidden p-0" showCloseButton={false}>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white flex items-center justify-between relative">
          <div>
            <h2 className="text-2xl font-bold">{step === "login" ? "Login to Continue" : `Complete Payment`}</h2>
            {step === "login" && (
              <p className="text-blue-100 text-sm mt-1">
                Please login to your employer account to proceed with payment.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="employer@company.com"
                    required
                    className="pl-10 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pl-10 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
                  />
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login & Continue"
                )}
              </Button>
            </form>
          ) : (
            <PaymentCheckoutForm
              employerId={employerData.employerId}
              planType={planType}
              billingCycle={billingCycle}
              employerName={employerData.companyName}
              employerEmail={employerData.email}
              employerPhone={employerData.mobileNumber}
              amount={amount}
            />
          )}

          {step === "login" && (
            <div className="mt-6 text-center border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    onClose()
                    router.push("/employer/register")
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  Register here
                </button>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
