"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X, ArrowLeft, Sparkles, ChevronDown, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PaymentCheckoutModal } from "@/components/payment-checkout-modal"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { getActivePlans } from "@/app/actions/plans-actions"
import { useRouter, useSearchParams } from "next/navigation"
import type { Plan } from "@/app/actions/plans-actions"

export default function EmployerPricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ planType: string; amount: number } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [planQuantities, setPlanQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    checkEmployerSession()
    loadPlans()
  }, [])

  useEffect(() => {
    if (plans.length > 0) {
      const initialQuantities: Record<string, number> = {}
      plans.forEach((plan) => {
        initialQuantities[plan.id] = 1
      })
      setPlanQuantities(initialQuantities)
    }
  }, [plans])

  async function loadPlans() {
    setPlansLoading(true)
    try {
      const fetchedPlans = await getActivePlans()
      console.log("[v2.1.0] Loaded plans:", fetchedPlans)
      setPlans(fetchedPlans)
    } catch (error) {
      console.error("[v2.1.0] Error loading plans:", error)
    } finally {
      setPlansLoading(false)
    }
  }

  async function checkEmployerSession() {
    try {
      const { success, session } = await getEmployerSession()
      if (success && session) {
        setIsAuthenticated(true)
        const fromJobPosting = searchParams.get("from") === "job-posting"
        if (fromJobPosting && plans.length > 0) {
          const premiumPlan = plans.find((p) => p.slug === "premium")
          if (premiumPlan) {
            setSelectedPlan({ planType: "premium", amount: premiumPlan.price })
            setShowPaymentModal(true)
          }
        }
      }
    } catch (error) {
      console.error("[v2.1.0] Error checking employer session:", error)
    } finally {
      setSessionLoading(false)
    }
  }

  const handlePlanSelection = (plan: Plan) => {
    const quantity = planQuantities[plan.id] || 1
    const totalAmount = calculateTotalPrice(plan.price, quantity)
    setSelectedPlan({ planType: plan.slug, amount: totalAmount })
    setShowPaymentModal(true)
  }

  const calculateTotalPrice = (basePrice: number, quantity: number) => {
    return basePrice * quantity
  }

  const getPlanDisplayName = (plan: Plan) => {
    if (plan.slug === "free") return "Free"
    if (plan.slug === "classic") return "Classified"
    if (plan.slug === "premium") return "Premium"
    return plan.name
  }

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">JK</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobKarle
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    Employer
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/employer/login" className="w-full cursor-pointer">
                      Employer Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/employer/pricing" className="w-full cursor-pointer">
                      Employer Plans
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-white/80 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose the Right Plan for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Hiring Needs
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find top talent faster with JobKarle's comprehensive recruitment solutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const quantity = planQuantities[plan.id] || 1
            const basePrice = plan.price
            const totalPrice = calculateTotalPrice(basePrice, quantity)
            const displayName = getPlanDisplayName(plan)

            return (
              <Card
                key={plan.id}
                className={`relative p-6 hover:shadow-xl transition-shadow flex flex-col ${
                  plan.slug === "premium" ? "border-2 border-blue-600" : ""
                } ${plan.slug === "free" ? "bg-gradient-to-br from-green-50 to-green-100" : ""}`}
              >
                {plan.slug === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{displayName}</h3>
                  {plan.slug === "free" && <p className="text-sm text-gray-600">Job Posting</p>}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-gray-500">₹</span>
                    <span
                      className={`text-3xl font-bold ${
                        plan.slug === "premium"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                          : plan.slug === "free"
                            ? "text-green-600"
                            : "text-gray-900"
                      }`}
                    >
                      {plan.slug === "free" ? "Free" : Math.round(totalPrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {plan.slug !== "free" && <p className="text-xs text-gray-500 mt-1">*GST as applicable</p>}
                </div>

                <div className="mb-6 flex-grow">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">KEY FEATURES</p>
                  <div className="space-y-2">
                    {Array.isArray(plan.features) &&
                      plan.features.slice(0, 8).map((feature, index) => {
                        const featureName = typeof feature === "string" ? feature : feature.name
                        const isIncluded = typeof feature === "string" ? true : feature.included

                        return (
                          <div key={index} className="flex items-start gap-2">
                            {isIncluded ? (
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={`text-xs ${isIncluded ? "text-gray-700" : "text-gray-400"}`}>
                              {featureName}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {plan.job_validity_days && (
                  <div className="mb-4 text-center">
                    <p className="text-sm text-gray-600">
                      Job validity <span className="font-semibold">{plan.job_validity_days} days</span>
                    </p>
                  </div>
                )}

                {plan.slug !== "free" && quantity >= 5 && (
                  <div className="mb-4 flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-lg py-2 px-3">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700">
                      Flat 10% OFF on {quantity} Job Postings or more
                    </span>
                  </div>
                )}

                <div className="space-y-3 mt-auto">
                  {plan.slug !== "free" && (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-20 justify-between bg-transparent">
                            {quantity.toString().padStart(2, "0")}
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <DropdownMenuItem
                              key={num}
                              onClick={() => setPlanQuantities({ ...planQuantities, [plan.id]: num })}
                            >
                              {num.toString().padStart(2, "0")}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        onClick={() => handlePlanSelection(plan)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                        size="lg"
                      >
                        Buy now
                      </Button>
                    </div>
                  )}
                  {plan.slug === "free" && (
                    <Button
                      onClick={() => router.push("/employer/register")}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                      size="lg"
                    >
                      Post a free job
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Need a custom plan for your enterprise? Contact our sales team for tailored solutions.
          </p>
          <Link href="/employer/register">
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-gray-600">
                Yes, you can purchase more credits at any time. Credits from Classic and Premium plans are valid for 90
                days.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, UPI, net banking, and digital wallets through our secure
                payment gateway.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Is there a free trial available?</h3>
              <p className="text-gray-600">
                Yes, new employers get a free plan with 2 credits to explore our platform and post their first jobs at
                no cost.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What's the difference between Classified and Premium?</h3>
              <p className="text-gray-600">
                Classified allows 1 location per job (45 days application validity), while Premium supports 3 locations
                with a diamond badge (60 days validity). Premium jobs also get better visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Find Your Perfect Hire?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of employers hiring on JobKarle today</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/employer/register">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/employer/login">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {showPaymentModal && selectedPlan && (
        <PaymentCheckoutModal
          planType={selectedPlan.planType}
          billingCycle="monthly"
          amount={selectedPlan.amount}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
        />
      )}
    </div>
  )
}
