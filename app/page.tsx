"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Briefcase, Users, TrendingUp, Award, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomeSearchResults } from "@/components/home-search-results"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { MultiSelectInput } from "@/components/ui/multi-select-input"
import { getSearchSuggestions } from "@/app/actions/home-search-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { getJobsByIndustry } from "@/app/actions/jobs-actions"

export default function HomePage() {
  const [showResults, setShowResults] = useState(false)
  const [searchParams, setSearchParams] = useState({
    skills: [] as string[],
    experience: "",
    location: "",
  })
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [currentInputValue, setCurrentInputValue] = useState("")
  const [industries, setIndustries] = useState<string[]>([])

  useEffect(() => {
    const loadSuggestions = async () => {
      const { designations, companies } = await getSearchSuggestions()
      const combined = [...POPULAR_SKILLS, ...designations, ...companies]
      const uniqueSuggestions = [...new Set(combined)].sort()
      setSearchSuggestions(uniqueSuggestions)
    }
    loadSuggestions()
  }, [])

  useEffect(() => {
    const loadIndustries = async () => {
      const { jobsByIndustry } = await getJobsByIndustry()
      const industryNames = jobsByIndustry.map((item) => item.industry)
      setIndustries(industryNames)
    }
    loadIndustries()
  }, [])

  const handleSearch = () => {
    const skillsToSearch = [...searchParams.skills]
    if (currentInputValue.trim() && !skillsToSearch.includes(currentInputValue.trim())) {
      skillsToSearch.push(currentInputValue.trim())
    }

    if (skillsToSearch.length > 0 || searchParams.experience || searchParams.location) {
      setSearchParams({ ...searchParams, skills: skillsToSearch })
      setShowResults(true)
      setCurrentInputValue("")
    }
  }

  const handleResetSearch = () => {
    setShowResults(false)
    setSearchParams({ skills: [], experience: "", location: "" })
    setCurrentInputValue("")
  }

  const POPULAR_SKILLS = [
    "React",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "Python",
    "Java",
    "Angular",
    "Vue.js",
    "CSS",
    "HTML",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "Git",
    "REST API",
    "GraphQL",
    "Express.js",
    "Next.js",
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "C++",
    "C#",
    ".NET",
    "Django",
    "Flask",
    "Spring Boot",
    "Machine Learning",
    "Data Science",
    "AI",
    "DevOps",
    "Agile",
    "Scrum",
    "UI/UX Design",
    "Figma",
    "Photoshop",
    "Android Development",
    "iOS Development",
    "Nursing",
    "Medical Coding",
    "Pharmacy",
    "Physiotherapy",
    "Radiology",
    "Medical Transcription",
    "Healthcare Management",
    "Patient Care",
    "Clinical Research",
    "Medical Laboratory",
    "Dental Care",
    "Emergency Medicine",
    "Surgery",
    "Anesthesia",
    "Cardiology",
    "Orthopedics",
    "Pediatrics",
    "Gynecology",
    "Neurology",
    "Banking Operations",
    "Loan Processing",
    "Credit Analysis",
    "Financial Analysis",
    "Investment Banking",
    "Risk Management",
    "Auditing",
    "Taxation",
    "GST",
    "Accounting",
    "Tally",
    "QuickBooks",
    "SAP FICO",
    "Treasury Management",
    "Portfolio Management",
    "Insurance",
    "Stock Market",
    "Mutual Funds",
    "KYC",
    "Customer Support",
    "Technical Support",
    "Call Center",
    "Tele-calling",
    "Email Support",
    "Chat Support",
    "Voice Process",
    "Non-Voice Process",
    "Customer Relationship Management",
    "CRM Software",
    "Salesforce",
    "Client Servicing",
    "Lead Generation",
    "Telesales",
    "Quality Analyst",
    "Sales",
    "Marketing",
    "Digital Marketing",
    "SEO",
    "Social Media Marketing",
    "Content Marketing",
    "Email Marketing",
    "Brand Management",
    "Business Development",
    "Market Research",
    "Advertising",
    "Google Ads",
    "Facebook Ads",
    "Lead Management",
    "B2B Sales",
    "B2C Sales",
    "Retail Sales",
    "Channel Sales",
    "Inside Sales",
    "Recruitment",
    "HR Operations",
    "Payroll",
    "Employee Relations",
    "Training & Development",
    "Performance Management",
    "HRIS",
    "Talent Acquisition",
    "Compensation & Benefits",
    "Labor Laws",
    "Onboarding",
    "Exit Management",
    "HR Policies",
    "Employee Engagement",
    "Production Planning",
    "Quality Control",
    "Quality Assurance",
    "Supply Chain",
    "Inventory Management",
    "Warehouse Management",
    "Logistics",
    "Operations Management",
    "Lean Manufacturing",
    "Six Sigma",
    "Industrial Engineering",
    "Process Optimization",
    "Safety Management",
    "Maintenance",
    "Assembly",
    "Packaging",
    "Forklift Operation",
    "Retail Management",
    "Store Operations",
    "Merchandising",
    "Visual Merchandising",
    "Cashier",
    "Inventory Control",
    "E-commerce",
    "Marketplace Management",
    "Order Fulfillment",
    "Product Listing",
    "Amazon Seller",
    "Flipkart",
    "Shopify",
    "Hotel Management",
    "Front Office",
    "Housekeeping",
    "Food & Beverage",
    "Restaurant Management",
    "Chef",
    "Bartending",
    "Travel & Tourism",
    "Event Management",
    "Guest Relations",
    "Catering",
    "Hotel Reservation",
    "Teaching",
    "Training",
    "Curriculum Development",
    "Academic Counseling",
    "Education Administration",
    "E-learning",
    "Content Development",
    "Tutoring",
    "Classroom Management",
    "Educational Technology",
    "Subject Matter Expert",
    "Legal Compliance",
    "Contract Management",
    "Corporate Law",
    "Legal Research",
    "Litigation",
    "Documentation",
    "Regulatory Compliance",
    "Legal Advisory",
    "IPR",
    "Company Secretary",
    "Legal Writing",
    "Court Procedures",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
    "Electronics",
    "Automobile Engineering",
    "AutoCAD",
    "SolidWorks",
    "CATIA",
    "Project Management",
    "Site Supervision",
    "MEP",
    "HVAC",
    "CAD Design",
    "Content Writing",
    "Copywriting",
    "Journalism",
    "Video Editing",
    "Graphic Design",
    "Photography",
    "Public Relations",
    "Corporate Communication",
    "Social Media Management",
    "Broadcasting",
    "Film Making",
    "Animation",
    "Voice Over",
    "Anchoring",
    "Administration",
    "Office Management",
    "Data Entry",
    "MS Office",
    "MS Excel",
    "Documentation",
    "Receptionist",
    "Secretary",
    "Back Office",
    "File Management",
    "Typing",
    "Coordination",
    "Travel Arrangements",
    "Meeting Coordination",
    "Procurement",
    "Vendor Management",
    "Purchase",
    "Sourcing",
    "Negotiation",
    "Supply Chain Planning",
    "Import Export",
    "Customs",
    "Freight Forwarding",
    "Security Services",
    "Security Guard",
    "CCTV Monitoring",
    "Fire Safety",
    "Industrial Safety",
    "Loss Prevention",
    "Access Control",
    "Security Management",
  ]

  const TOP_CITIES = [
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Pune",
    "Kolkata",
    "Ahmedabad",
    "Gurugram",
    "Noida",
    "Jaipur",
    "Chandigarh",
    "Indore",
    "Kochi",
    "Coimbatore",
    "Lucknow",
    "Vadodara",
    "Visakhapatnam",
    "Nagpur",
    "Surat",
  ]

  if (showResults) {
    return <HomeSearchResults searchParams={searchParams} onBack={handleResetSearch} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">JK</span>
              </div>
              <span className="text-base sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobKarle
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-2 sm:ml-6 flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200">
                    Jobs
                    <ChevronDown className="w-4 h-4 sm:w-4 sm:h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 sm:w-72 max-h-[500px] overflow-y-auto">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/jobs"
                      className="w-full cursor-pointer text-sm sm:text-base font-semibold py-2.5 px-3 hover:bg-blue-50"
                    >
                      🔍 All Jobs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">
                    Browse by Industry
                  </DropdownMenuLabel>
                  {industries.map((industry) => (
                    <DropdownMenuItem key={industry} asChild>
                      <Link
                        href={`/jobs?industry=${encodeURIComponent(industry)}`}
                        className="w-full cursor-pointer text-sm sm:text-base py-2.5 px-3 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {industry}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Candidate
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/candidate/register" className="w-full cursor-pointer">
                      Register
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/candidate/login" className="w-full cursor-pointer">
                      Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Employer
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/employer/register" className="w-full cursor-pointer">
                      Register
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/employer/login" className="w-full cursor-pointer">
                      Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/employer/pricing" className="w-full cursor-pointer">
                      Pricing Plan
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-2">
            Where your talent meets{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              right job
            </span>
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl text-gray-600 mb-4 sm:mb-6 lg:mb-8 px-2">
            Connect with top employers across India
          </p>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr_1fr_auto] gap-2 lg:gap-3">
                <div className="flex gap-1.5 lg:contents">
                  <div className="flex-1 min-w-0 lg:w-auto">
                    <MultiSelectInput
                      options={searchSuggestions.length > 0 ? searchSuggestions : POPULAR_SKILLS}
                      value={searchParams.skills}
                      onChange={(value) => setSearchParams({ ...searchParams, skills: value })}
                      onInputChange={setCurrentInputValue}
                      placeholder="Skills / Designation / Company"
                      className="h-9 lg:h-12"
                    />
                  </div>
                  <div className="relative w-[100px] lg:w-auto flex-shrink-0">
                    <select
                      value={searchParams.experience}
                      onChange={(e) => setSearchParams({ ...searchParams, experience: e.target.value })}
                      className="h-9 lg:h-12 w-full text-[11px] lg:text-base px-1.5 lg:px-3 py-2 rounded-md border border-input bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="" disabled>
                        Experience
                      </option>
                      <option value="0">Fresher</option>
                      {Array.from({ length: 35 }, (_, i) => i + 1).map((year) => (
                        <option key={year} value={year.toString()}>
                          {year} {year === 1 ? "yr" : "yrs"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1 lg:right-3 top-1/2 -translate-y-1/2 h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <div className="flex-1 min-w-0 lg:w-auto">
                    <AutocompleteInput
                      options={TOP_CITIES}
                      value={searchParams.location}
                      onChange={(value) => setSearchParams({ ...searchParams, location: value })}
                      placeholder="Location"
                      className="h-9 lg:h-12 text-[11px] lg:text-base"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="w-full lg:w-auto h-10 lg:h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm lg:text-base font-semibold px-6 lg:px-8"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm sm:text-base h-10 sm:h-11"
              >
                Register as Candidate
              </Button>
            </Link>
            <Link href="/employer/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11 bg-transparent"
              >
                Register as Employer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Extensive Job Listings</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Discover diverse career opportunities tailored to your profile
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Top Employers</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Connect with leading employers across various industries
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Career Growth</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Unlock opportunities that match your skills and aspirations
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <Award className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Easy Applications</h3>
            <p className="text-sm sm:text-base text-gray-600">Apply to multiple jobs with just one click</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-2">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 px-2">
            Join thousands of job seekers and employers on JobKarle
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11">
                Register Now
              </Button>
            </Link>
            <Link href="/employer/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white hover:text-blue-600 text-sm sm:text-base h-10 sm:h-11"
              >
                Post a Job
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
