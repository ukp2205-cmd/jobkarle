"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, Building2, Users, CheckCircle2, Upload } from "lucide-react"
import { createInitialEmployer, uploadEmployerLogo, completeEmployerRegistration } from "@/app/actions/employer-actions"
import { useRouter } from "next/navigation"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import Link from "next/link"

interface FormData {
  // Step 1
  username: string
  email: string
  password: string
  contactPerson: string
  mobileNumber: string
  companyName: string
  companyType: string
  industryType: string
  city: string

  // Step 2 - OTP Verification
  mobileVerified: boolean

  // Step 3
  website: string
  designation: string
  alias: string
  description: string
  yearEstablished: string
  employeeCount: string
  logoFile: File | null
  tanNumber: string
  gstin: string
  phoneNumber2: string
  addressLabel: string
  address: string
  country: string
  state: string
  stateDetail: string
  cityDetail: string
  pincode: string
  acceptTerms: boolean
  skills: string[]
  yearsOfExperience: string
  monthsOfExperience: string
  industry: string
  department: string
  roleCategory: string
  jobTitle: string
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  " Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]

const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Tirupati",
    "Rajahmundry",
    "Kadapa",
    "Kakinada",
    "Anantapur",
  ],
  Karnataka: [
    "Bengaluru",
    "Mysuru",
    "Hubballi",
    "Mangaluru",
    "Belagavi",
    "Davanagere",
    "Ballari",
    "Tumakuru",
    "Shivamogga",
    "Raichur",
  ],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Alappuzha",
    "Kannur",
    "Kottayam",
    "Malappuram",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Kolhapur",
    "Navi Mumbai",
    "Amravati",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Tiruppur",
    "Erode",
    "Vellore",
    "Thoothukudi",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Khammam",
    "Karimnagar",
    "Ramagundam",
    "Mahbubnagar",
    "Nalgonda",
    "Adilabad",
    "Suryapet",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Ghaziabad",
    "Agra",
    "Varanasi",
    "Meerut",
    "Prayagraj",
    "Bareilly",
    "Aligarh",
    "Moradabad",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Asansol",
    "Siliguri",
    "Bardhaman",
    "Malda",
    "Baharampur",
    "Raiganj",
    "Kharagpur",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Gandhinagar",
    "Anand",
    "Navsari",
  ],
  Rajasthan: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Purnia",
    "Darbhanga",
    "Bihar Sharif",
    "Arrah",
    "Begusarai",
    "Katihar",
  ],
  Punjab: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Pathankot",
    "Hoshiarpur",
    "Batala",
    "Moga",
  ],
  Haryana: [
    "Faridabad",
    "Gurugram",
    "Panipat",
    "Ambala",
    "Yamunanagar",
    "Rohtak",
    "Hisar",
    "Karnal",
    "Sonipat",
    "Panchkula",
  ],
  Delhi: [
    "New Delhi",
    "North Delhi",
    "South Delhi",
    "East Delhi",
    "West Delhi",
    "Central Delhi",
    "North East Delhi",
    "North West Delhi",
    "South West Delhi",
    "South East Delhi",
  ],
  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Nagaon",
    "Tinsukia",
    "Tezpur",
    "Diphu",
    "Bongaigaon",
    "Karimganj",
  ],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Berhampur",
    "Sambalpur",
    "Puri",
    "Balasore",
    "Bhadrak",
    "Baripada",
    "Jharsuguda",
  ],
  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Giridih",
    "Hazaribagh",
    "Ramgarh",
    "Medininagar",
    "Phusro",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Bilaspur",
    "Korba",
    "Durg",
    "Rajnandgaon",
    "Jagdalpur",
    "Raigarh",
    "Ambikapur",
    "Mahasamund",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rudrapur",
    "Kashipur",
    "Rishikesh",
    "Pithoragarh",
    "Ramnagar",
    "Kotdwar",
  ],
  Goa: [
    "Panaji",
    "Vasco da Gama",
    "Margao",
    "Mapusa",
    "Ponda",
    "Bicholim",
    "Curchorem",
    "Sanquelim",
    "Cuncolim",
    "Quepem",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Solan",
    "Dharamshala",
    "Mandi",
    "Palampur",
    "Baddi",
    "Nahan",
    "Kullu",
    "Hamirpur",
    "Una",
  ],
  "Arunachal Pradesh": [
    "Itanagar",
    "Naharlagun",
    "Pasighat",
    "Namsai",
    "Tawang",
    "Ziro",
    "Bomdila",
    "Tezu",
    "Roing",
    "Along",
  ],
  Manipur: [
    "Imphal",
    "Thoubal",
    "Bishnupur",
    "Churachandpur",
    "Kakching",
    "Ukhrul",
    "Senapati",
    "Tamenglong",
    "Jiribam",
    "Moirang",
  ],
  Meghalaya: [
    "Shillong",
    "Tura",
    "Nongstoin",
    "Jowai",
    "Baghmara",
    "Williamnagar",
    "Nongpoh",
    "Mairang",
    "Resubelpara",
    "Khliehriat",
  ],
  Mizoram: [
    "Aizawl",
    "Lunglei",
    "Saiha",
    "Champhai",
    "Kolasib",
    "Serchhip",
    "Lawngtlai",
    "Mamit",
    "Hnahthial",
    "Khawzawl",
  ],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Longleng", "Kiphire"],
  Sikkim: [
    "Gangtok",
    "Namchi",
    "Gyalshing",
    "Mangan",
    "Rangpo",
    "Jorethang",
    "Singtam",
    "Ravangla",
    "Yuksom",
    "Pelling",
  ],
  Tripura: [
    "Agartala",
    "Udaipur",
    "Dharmanagar",
    "Kailasahar",
    "Belonia",
    "Khowai",
    "Ambassa",
    "Teliamura",
    "Sabroom",
    "Sonamura",
  ],
}

const industryDepartmentRoleMapping: Record<string, Record<string, Record<string, string[]>>> = {
  "IT Services & Consulting": {
    Engineering: {
      "Software Development": [
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Mobile App Developer",
        "DevOps Engineer",
      ],
      "Quality Assurance": ["QA Engineer", "Test Automation Engineer", "Manual Tester", "Performance Tester"],
      "Data & Analytics": ["Data Scientist", "Data Engineer", "Data Analyst", "ML Engineer", "AI Specialist"],
    },
    "Product Management": {
      "Product Strategy": ["Product Manager", "Senior Product Manager", "Product Owner", "Technical Product Manager"],
      "Product Operations": ["Product Operations Manager", "Product Analyst"],
    },
    Design: {
      "UI/UX Design": ["UI Designer", "UX Designer", "Product Designer", "UX Researcher", "Interaction Designer"],
      "Graphic Design": ["Graphic Designer", "Visual Designer", "Brand Designer"],
    },
  },
  Banking: {
    Operations: {
      "Branch Operations": ["Branch Manager", "Operations Manager", "Customer Service Manager"],
      Treasury: ["Treasury Manager", "Treasury Analyst", "Dealer"],
    },
    "Risk & Compliance": {
      "Risk Management": ["Risk Manager", "Credit Risk Analyst", "Market Risk Analyst"],
      Compliance: ["Compliance Officer", "AML Officer", "KYC Analyst"],
    },
    "Sales & Business Development": {
      "Retail Banking": ["Relationship Manager", "Sales Officer", "Business Development Manager"],
      "Corporate Banking": ["Corporate Relationship Manager", "Corporate Sales Manager"],
    },
  },
  Healthcare: {
    "Medical Services": {
      Clinical: ["Doctor", "Specialist", "Consultant", "Physician", "Surgeon"],
      Nursing: ["Staff Nurse", "Senior Nurse", "Nursing Supervisor", "ICU Nurse"],
    },
    Operations: {
      "Hospital Administration": ["Hospital Administrator", "Operations Manager", "Facility Manager"],
      "Medical Records": ["Medical Records Officer", "Health Information Manager"],
    },
    Pharmacy: {
      Dispensing: ["Pharmacist", "Senior Pharmacist", "Clinical Pharmacist"],
      "Drug Information": ["Drug Information Specialist", "Pharmacy Manager"],
    },
  },
  Manufacturing: {
    Production: {
      "Production Management": ["Production Manager", "Production Supervisor", "Production Engineer"],
      "Shop Floor": ["Machine Operator", "Assembly Line Worker", "Quality Inspector"],
    },
    "Quality Control": {
      "Quality Assurance": ["QA Manager", "Quality Engineer", "QC Inspector"],
      "Process Improvement": ["Six Sigma Specialist", "Lean Manufacturing Specialist"],
    },
    "Supply Chain": {
      Procurement: ["Procurement Manager", "Purchase Officer", "Vendor Manager"],
      Logistics: ["Logistics Manager", "Warehouse Manager", "Supply Chain Analyst"],
    },
  },
  "E-commerce": {
    Technology: {
      Engineering: ["Software Engineer", "Full Stack Developer", "Mobile Developer", "Platform Engineer"],
      Product: ["Product Manager", "Technical Product Manager", "Product Analyst"],
    },
    Operations: {
      "Marketplace Operations": ["Operations Manager", "Category Manager", "Seller Management"],
      "Customer Support": ["Customer Support Manager", "Support Associate", "Customer Success Manager"],
    },
    Marketing: {
      "Digital Marketing": ["Digital Marketing Manager", "SEO Specialist", "SEM Specialist", "Social Media Manager"],
      "Content Marketing": ["Content Manager", "Content Writer", "Copy Writer"],
    },
  },
  Retail: {
    "Store Operations": {
      "Store Management": ["Store Manager", "Assistant Store Manager", "Department Manager"],
      Sales: ["Sales Associate", "Sales Executive", "Cashier"],
    },
    Merchandising: {
      "Visual Merchandising": ["Visual Merchandiser", "Display Designer"],
      Buying: ["Buyer", "Merchandise Planner", "Category Manager"],
    },
    "Customer Service": {
      "Service Desk": ["Customer Service Representative", "Service Desk Manager"],
      "Returns & Exchange": ["Returns Coordinator", "Exchange Specialist"],
    },
  },
  Telecommunications: {
    "Network Operations": {
      "Network Engineering": ["Network Engineer", "NOC Engineer", "Network Architect"],
      "Network Planning": ["Network Planner", "RF Engineer", "Transmission Engineer"],
    },
    "Customer Service": {
      "Customer Care": ["Customer Care Executive", "Technical Support Engineer", "Helpdesk Support"],
      Sales: ["Sales Executive", "Relationship Manager", "Enterprise Sales Manager"],
    },
    Technology: {
      "IT Operations": ["IT Manager", "System Administrator", "Database Administrator"],
      "Software Development": ["Software Developer", "Application Engineer", "Solutions Architect"],
    },
  },
}

const popularSkills = [
  "JavaScript",
  "Python",
  "Java",
  "React",
  "Node.js",
  "SQL",
  "AWS",
  "Docker",
  "Project Management",
  "Data Analysis",
  "Machine Learning",
  "Communication",
  "Leadership",
  "Problem Solving",
  "Team Management",
  "Sales",
  "Marketing",
  "Customer Service",
  "Financial Analysis",
  "Excel",
  "PowerPoint",
  "SAP",
]

function OTPVerificationStep({
  mobileNumber,
  email,
  onVerified,
  onBack,
  isLoading,
  setIsLoading,
}: {
  mobileNumber: string
  email: string
  onVerified: () => void
  onBack: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  useEffect(() => {
    const hasAllDigits = otp.every((digit) => digit !== "")
    if (hasAllDigits) {
      console.log("OTP entered:", otp.join(""))
    }
  }, [otp])

  const handleResendOtp = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: mobileNumber,
          userType: "employer",
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        setOtp(["", "", "", "", "", ""])
        inputRefs[0].current?.focus()
      } else {
        alert(result.message || "Failed to resend OTP")
      }
    } catch (error) {
      console.error("Error resending OTP:", error)
      alert("Failed to resend OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      if (value && index < 5) {
        inputRefs[index + 1].current?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleVerify = async () => {
    const otpValue = otp.join("")

    if (otpValue.length !== 6) {
      alert("Please enter the complete 6-digit OTP")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: mobileNumber,
          otp: otpValue,
          userType: "employer",
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        onVerified()
      } else {
        alert(result.message || "OTP verification failed")
        setOtp(["", "", "", "", "", ""])
        inputRefs[0].current?.focus()
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      alert("An error occurred during verification. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-center">
        We just sent a text message with a 6-digit verification code to <strong>{mobileNumber}</strong>
      </p>

      <div className="flex gap-2 justify-center mb-6">
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={inputRefs[index]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-xl border-2 border-green-200 rounded-lg focus:border-green-500"
          />
        ))}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex-1 h-12 bg-transparent"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
        >
          {isLoading ? "Verifying..." : "Verify & Continue"}
        </Button>
      </div>
    </div>
  )
}

export default function EmployerRegistration() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    contactPerson: "",
    mobileNumber: "",
    companyName: "",
    companyType: "",
    industryType: "",
    city: "",
    website: "",
    designation: "",
    alias: "",
    description: "",
    yearEstablished: "",
    employeeCount: "",
    logoFile: null,
    tanNumber: "",
    gstin: "",
    phoneNumber2: "",
    addressLabel: "",
    address: "",
    country: "India",
    state: "",
    stateDetail: "",
    cityDetail: "",
    pincode: "",
    acceptTerms: false,
    mobileVerified: false,
    skills: [],
    yearsOfExperience: "",
    monthsOfExperience: "",
    industry: "",
    department: "",
    roleCategory: "",
    jobTitle: "",
  })

  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedStateDetail, setSelectedStateDetail] = useState<string>("")
  const [skillSearch, setSkillSearch] = useState("")
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [industrySearch, setIndustrySearch] = useState("")
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    if (field === "state") {
      setSelectedState(value)
      setFormData((prev) => ({ ...prev, city: "", state: value }))
    } else if (field === "stateDetail") {
      setSelectedStateDetail(value)
      setFormData((prev) => ({ ...prev, cityDetail: "", stateDetail: value }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleStep1Submit = async () => {
    // Validate step 1 fields
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.contactPerson ||
      !formData.mobileNumber ||
      !formData.companyName ||
      !formData.companyType ||
      !formData.industryType ||
      !formData.city
    ) {
      alert("Please fill all required fields")
      return
    }

    setIsLoading(true)
    try {
      // Create initial employer record in database
      const result = await createInitialEmployer({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        contactPerson: formData.contactPerson,
        mobileNumber: formData.mobileNumber,
        companyName: formData.companyName,
        companyType: formData.companyType,
        industryType: formData.industryType,
        city: formData.city,
      })

      if (!result.success) {
        alert(result.message || "Failed to create employer account")
        return
      }

      console.log("[v0] Initial employer record created, sending OTP...")

      const otpResult = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.mobileNumber,
          userType: "employer",
        }),
      })

      const otpData = await otpResult.json()

      if (!otpData.success) {
        alert(otpData.message || "Failed to send OTP. Please try again.")
        return
      }

      console.log("[v0] OTP sent successfully, moving to OTP verification")
      setStep(2)
      // Move to OTP verification
    } catch (error) {
      console.error("Error creating initial employer:", error)
      alert("Failed to create employer account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackFromStep3 = () => {
    if (formData.mobileVerified) {
      setStep(1) // Skip OTP step and go directly to step 1
    } else {
      setStep(2) // Go back to OTP step if not verified yet
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let logoUrl = ""

    if (formData.logoFile) {
      const logoFormData = new FormData()
      logoFormData.append("file", formData.logoFile)
      logoFormData.append("email", formData.email)

      const uploadResult = await uploadEmployerLogo(logoFormData)
      if (uploadResult.success && uploadResult.url) {
        logoUrl = uploadResult.url
      } else {
        console.error("[v0] Logo upload failed:", uploadResult.message)
        alert("Logo upload failed. Please try again.")
        return
      }
    }

    if (!formData.logoFile && !formData.logoUrl) {
      // Changed condition to also check if logoUrl already exists
      alert("Please upload company logo")
      return
    }

    // Add validation for required fields in step 3
    if (!formData.industry || !formData.department || !formData.roleCategory || !formData.jobTitle) {
      alert("Please select Industry, Department, Role Category, and Job Title.")
      return
    }

    if (!formData.acceptTerms) {
      alert("Please accept the Terms and Conditions")
      return
    }

    setIsLoading(true)

    try {
      const result = await completeEmployerRegistration(formData.email, formData.password, {
        website: formData.website,
        designation: formData.designation,
        alias: formData.alias,
        description: formData.description,
        yearEstablished: formData.yearEstablished,
        employeeCount: formData.employeeCount,
        logoUrl: logoUrl || formData.logoUrl, // Use uploaded URL or existing if any
        tanNumber: formData.tanNumber,
        gstin: formData.gstin,
        phoneNumber2: formData.phoneNumber2,
        addressLabel: formData.addressLabel,
        address: formData.address,
        country: formData.country,
        state: formData.state,
        stateDetail: formData.stateDetail,
        cityDetail: formData.cityDetail,
        pincode: formData.pincode,
        // Pass new fields to the API
        skills: formData.skills,
        yearsOfExperience: formData.yearsOfExperience,
        monthsOfExperience: formData.monthsOfExperience,
        industry: formData.industry,
        department: formData.department,
        roleCategory: formData.roleCategory,
        jobTitle: formData.jobTitle,
      })

      if (result.success) {
        alert("Employer registration completed successfully! Please login to continue.")
        // Redirect to employer login page
        window.location.href = "/employer/login"
      } else {
        alert(result.message || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("An error occurred during registration. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // Added JobKarle logo header for employer registration
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">JK</span>
          </div>
          <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            JobKarle
          </span>
        </Link>
        <a href="/" className="text-xs md:text-sm text-blue-600 hover:underline">
          Home
        </a>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Side - Features */}
          <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-8 lg:p-12 flex-col justify-between text-white">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Job<span className="text-blue-400">Karle</span>
              </h1>
              <p className="text-indigo-200 text-xs lg:text-sm">Find the perfect talent for your team</p>
            </div>

            <div className="space-y-6 lg:space-y-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">What does JobKarle offer 👋</h2>
              </div>

              <div className="space-y-4 lg:space-y-6">
                <div className="flex gap-3 lg:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-1 lg:mb-2">Job Posting</h3>
                    <p className="text-indigo-200 text-xs lg:text-sm">A comprehensive platform for your hiring needs</p>
                    <ul className="mt-2 lg:mt-3 space-y-1.5 lg:space-y-2 text-xs lg:text-sm text-indigo-200">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 mt-0.5 flex-shrink-0" />
                        <span>AI-powered classic and premium job postings to get candidates at desired speed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 mt-0.5 flex-shrink-0" />
                        <span>Unlimited applications with 15 days job visibility on the platform</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 lg:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-1 lg:mb-2">Candidate Database</h3>
                    <p className="text-indigo-200 text-xs lg:text-sm">
                      Access to verified and quality candidates across India
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 lg:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-1 lg:mb-2">Employer Branding</h3>
                    <p className="text-indigo-200 text-xs lg:text-sm">
                      Build your company presence and attract top talent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 min-w-0 overflow-auto">
            <div className="w-full max-w-xl">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 px-1 sm:px-4">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                          step === 1
                            ? "bg-green-600 text-white ring-2 sm:ring-4 ring-green-100"
                            : step > 1
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : "1"}
                      </div>
                      <p
                        className={`text-[9px] sm:text-[10px] mt-1 sm:mt-1.5 font-medium ${step === 1 ? "text-green-600" : step > 1 ? "text-green-600" : "text-gray-400"}`}
                      >
                        Basic Info
                      </p>
                    </div>

                    {/* Progress Line */}
                    <div
                      className={`h-0.5 flex-1 mx-1 sm:mx-2 transition-all ${step > 1 ? "bg-green-600" : "bg-gray-200"}`}
                    />

                    {/* Step 2 - OTP */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                          step === 2
                            ? "bg-green-600 text-white ring-2 sm:ring-4 ring-green-100"
                            : step > 2
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step > 2 ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : "2"}
                      </div>
                      <p
                        className={`text-[9px] sm:text-[10px] mt-1 sm:mt-1.5 font-medium ${step === 2 ? "text-green-600" : step > 2 ? "text-green-600" : "text-gray-400"}`}
                      >
                        OTP Verify
                      </p>
                    </div>

                    {/* Progress Line */}
                    <div
                      className={`h-0.5 flex-1 mx-1 sm:mx-2 transition-all ${step > 2 ? "bg-green-600" : "bg-gray-200"}`}
                    />

                    {/* Step 3 - Company Details */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                          step === 3
                            ? "bg-green-600 text-white ring-2 sm:ring-4 ring-green-100"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        3
                      </div>

                      <p
                        className={`text-[9px] sm:text-[10px] mt-1 sm:mt-1.5 font-medium whitespace-nowrap ${step === 3 ? "text-green-600" : "text-gray-400"}`}
                      >
                        Company Details
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    {step === 1
                      ? "Let's get you started!"
                      : step === 2
                        ? "Verify mobile number"
                        : "Complete your profile"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {step === 1
                      ? "Create your employer account"
                      : step === 2
                        ? `We sent a code to ${formData.mobileNumber}`
                        : "Add your company details"}
                  </p>
                </div>

                {step === 1 ? (
                  <div className="space-y-3 sm:space-y-5">
                    <div>
                      <Label
                        htmlFor="username"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Username *
                      </Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        placeholder="Enter username"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="email"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Email for Communication *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter your email address"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="password"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Password *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Create a password"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="contactPerson"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Contact Person (Full Name) *
                      </Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                        placeholder="Enter your full name"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="mobileNumber"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Mobile Number *
                      </Label>
                      <Input
                        id="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                        placeholder="+91XXXXXXXXXX"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="companyName"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Company Name *
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        placeholder="e.g Swiggy"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label
                          htmlFor="companyType"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          Company Type *
                        </Label>
                        <Select
                          value={formData.companyType}
                          onValueChange={(value) => handleInputChange("companyType", value)}
                        >
                          <SelectTrigger className="h-9 sm:h-11 text-xs sm:text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Private Limited">Private Limited</SelectItem>
                            <SelectItem value="Public Limited">Public Limited</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                            <SelectItem value="LLP">LLP</SelectItem>
                            <SelectItem value="Startup">Startup</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="industryType"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          Industry Type *
                        </Label>
                        <Select
                          value={formData.industryType}
                          onValueChange={(value) => handleInputChange("industryType", value)}
                        >
                          <SelectTrigger className="h-9 sm:h-11 text-xs sm:text-sm">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IT/Software">IT/Software</SelectItem>
                            <SelectItem value="BPO/ITES">BPO/ITES</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Real Estate">Real Estate</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="stateSelect"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        State (Primary Office) *
                      </Label>
                      <AutocompleteInput
                        options={INDIAN_STATES}
                        value={formData.state || ""}
                        onChange={(value) => handleInputChange("state", value)}
                        placeholder="Type to search state..."
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    {selectedState && (
                      <div>
                        <Label
                          htmlFor="citySelect"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          City (Primary Office) *
                        </Label>
                        <AutocompleteInput
                          options={CITIES_BY_STATE[selectedState] || []}
                          value={formData.city || ""}
                          onChange={(value) => handleInputChange("city", value)}
                          placeholder="Type to search city..."
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleStep1Submit}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-10 sm:h-12 text-sm sm:text-base font-semibold mt-4 sm:mt-6"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Continue to Step 2"}
                    </Button>
                  </div>
                ) : step === 2 ? (
                  <OTPVerificationStep
                    mobileNumber={formData.mobileNumber}
                    email={formData.email}
                    onVerified={() => {
                      setFormData((prev) => ({ ...prev, mobileVerified: true }))
                      setStep(3)
                    }}
                    onBack={() => setStep(1)}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                      <Label className="mb-2 block font-medium text-gray-700 text-sm">Skills</Label>
                      <div className="space-y-3">
                        {/* Skill input with autosuggest */}
                        <div className="relative">
                          <Input
                            value={skillSearch}
                            onChange={(e) => {
                              setSkillSearch(e.target.value)
                              setShowSkillDropdown(e.target.value.length > 0)
                            }}
                            onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                            placeholder="Type a skill or select from popular skills..."
                            className="h-10 rounded-full text-sm"
                          />
                          {showSkillDropdown && skillSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                              {popularSkills
                                .filter(
                                  (skill) =>
                                    skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
                                    !formData.skills.includes(skill),
                                )
                                .map((skill) => (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => {
                                      if (!formData.skills.includes(skill)) {
                                        handleInputChange("skills", [...formData.skills, skill])
                                      }
                                      setSkillSearch("")
                                      setShowSkillDropdown(false)
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                  >
                                    {skill}
                                  </button>
                                ))}
                              {skillSearch && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (skillSearch && !formData.skills.includes(skillSearch)) {
                                      handleInputChange("skills", [...formData.skills, skillSearch])
                                    }
                                    setSkillSearch("")
                                    setShowSkillDropdown(false)
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-blue-600 border-t"
                                >
                                  + Add "{skillSearch}"
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Popular skills for quick selection */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Popular Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {popularSkills.slice(0, 8).map((skill) => (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => {
                                  if (!formData.skills.includes(skill)) {
                                    handleInputChange("skills", [...formData.skills, skill])
                                  }
                                }}
                                disabled={formData.skills.includes(skill)}
                                className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selected skills */}
                        {formData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                            {formData.skills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInputChange(
                                      "skills",
                                      formData.skills.filter((s) => s !== skill),
                                    )
                                  }
                                  className="ml-1 text-gray-500 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium text-gray-700 text-sm">Total Experience</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.yearsOfExperience}
                            onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)}
                            placeholder="Years"
                            className="h-10 rounded-full text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">Years</p>
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="0"
                            max="11"
                            value={formData.monthsOfExperience}
                            onChange={(e) => handleInputChange("monthsOfExperience", e.target.value)}
                            placeholder="Months"
                            className="h-10 rounded-full text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">Months</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium text-gray-700 text-sm">Industry *</Label>
                      <div className="relative">
                        <Input
                          value={industrySearch || formData.industry}
                          onChange={(e) => {
                            setIndustrySearch(e.target.value)
                            handleInputChange("industry", "")
                            handleInputChange("department", "")
                            handleInputChange("roleCategory", "")
                            handleInputChange("jobTitle", "")
                            setShowIndustryDropdown(e.target.value.length > 0)
                          }}
                          onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
                          placeholder="Type to search industry..."
                          className="h-10 rounded-full text-sm"
                        />
                        {showIndustryDropdown && industrySearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {Object.keys(industryDepartmentRoleMapping)
                              .filter((industry) => industry.toLowerCase().includes(industrySearch.toLowerCase()))
                              .map((industry) => (
                                <button
                                  key={industry}
                                  type="button"
                                  onClick={() => {
                                    handleInputChange("industry", industry)
                                    setIndustrySearch("")
                                    setShowIndustryDropdown(false)
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                >
                                  {industry}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.industry && (
                      <div>
                        <Label className="mb-2 block font-medium text-gray-700 text-sm">Department *</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => {
                            handleInputChange("department", value)
                            handleInputChange("roleCategory", "")
                            handleInputChange("jobTitle", "")
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-full text-sm">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(industryDepartmentRoleMapping[formData.industry] || {}).map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.department && formData.industry && (
                      <div>
                        <Label className="mb-2 block font-medium text-gray-700 text-sm">Role Category *</Label>
                        <Select
                          value={formData.roleCategory}
                          onValueChange={(value) => {
                            handleInputChange("roleCategory", value)
                            handleInputChange("jobTitle", "")
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-full text-sm">
                            <SelectValue placeholder="Select role category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(
                              industryDepartmentRoleMapping[formData.industry]?.[formData.department] || {},
                            ).map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.roleCategory && formData.department && formData.industry && (
                      <div>
                        <Label className="mb-2 block font-medium text-gray-700 text-sm">Job Title *</Label>
                        <Select
                          value={formData.jobTitle}
                          onValueChange={(value) => handleInputChange("jobTitle", value)}
                        >
                          <SelectTrigger className="h-10 rounded-full text-sm">
                            <SelectValue placeholder="Select job title" />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              industryDepartmentRoleMapping[formData.industry]?.[formData.department]?.[
                                formData.roleCategory
                              ] || []
                            ).map((title) => (
                              <SelectItem key={title} value={title}>
                                {title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label
                        htmlFor="website"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Company Website URL
                      </Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://www.example.com"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="designation"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Contact Person's Designation
                      </Label>
                      <Input
                        id="designation"
                        value={formData.designation}
                        onChange={(e) => handleInputChange("designation", e.target.value)}
                        placeholder="e.g. HR Manager"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="alias"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Alias
                      </Label>
                      <Input
                        id="alias"
                        value={formData.alias}
                        onChange={(e) => handleInputChange("alias", e.target.value)}
                        placeholder="Company short name or alias"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="description"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Company Description/About Us
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Tell us about your company..."
                        rows={3}
                        className="resize-none text-xs sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label
                          htmlFor="yearEstablished"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          Year of Establishment
                        </Label>
                        <Input
                          id="yearEstablished"
                          value={formData.yearEstablished}
                          onChange={(e) => handleInputChange("yearEstablished", e.target.value)}
                          placeholder="YYYY"
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="employeeCount"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          Employee Count
                        </Label>
                        <Select
                          value={formData.employeeCount}
                          onValueChange={(value) => handleInputChange("employeeCount", value)}
                        >
                          <SelectTrigger className="h-9 sm:h-11 text-xs sm:text-sm">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-50">0-50</SelectItem>
                            <SelectItem value="51-100">51-100</SelectItem>
                            <SelectItem value="101-300">101-300</SelectItem>
                            <SelectItem value="301-500">301-500</SelectItem>
                            <SelectItem value="501-1000">501-1000</SelectItem>
                            <SelectItem value="1000+">1000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="logo"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Company Logo
                      </Label>
                      <div className="mt-1.5 sm:mt-2 flex items-center gap-3">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleInputChange("logoFile", file)
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo"
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-xs"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">{formData.logoFile ? formData.logoFile.name : "Choose file"}</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">Max size: 2MB (PNG, JPG)</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label
                          htmlFor="tanNumber"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          TAN Number
                        </Label>
                        <Input
                          id="tanNumber"
                          value={formData.tanNumber}
                          onChange={(e) => handleInputChange("tanNumber", e.target.value)}
                          placeholder="ABCD12345E"
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="gstin"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          GSTIN
                        </Label>
                        <Input
                          id="gstin"
                          value={formData.gstin}
                          onChange={(e) => handleInputChange("gstin", e.target.value)}
                          placeholder="22AAAAA0000A1Z5"
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="phoneNumber2"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Phone Number 2 (Optional)
                      </Label>
                      <Input
                        id="phoneNumber2"
                        value={formData.phoneNumber2}
                        onChange={(e) => handleInputChange("phoneNumber2", e.target.value)}
                        placeholder="Alternate phone number"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="addressLabel"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Address Label
                      </Label>
                      <Input
                        id="addressLabel"
                        value={formData.addressLabel}
                        onChange={(e) => handleInputChange("addressLabel", e.target.value)}
                        placeholder="e.g. Head Office, Branch Office"
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="address"
                        className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                      >
                        Complete Address
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="Enter complete address"
                        rows={2}
                        className="resize-none text-xs sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label
                          htmlFor="stateDetail"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          State
                        </Label>
                        <AutocompleteInput
                          options={INDIAN_STATES}
                          value={formData.stateDetail || ""}
                          onChange={(value) => handleInputChange("stateDetail", value)}
                          placeholder="Type to search state..."
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label
                          htmlFor="cityDetail"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          City
                        </Label>
                        <AutocompleteInput
                          options={selectedStateDetail ? CITIES_BY_STATE[selectedStateDetail] || [] : []}
                          value={formData.cityDetail || ""}
                          onChange={(value) => handleInputChange("cityDetail", value)}
                          placeholder={selectedStateDetail ? "Type to search city..." : "Select state first"}
                          disabled={!selectedStateDetail}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="pincode"
                          className="mb-1.5 sm:mb-2 block font-medium text-gray-700 text-xs sm:text-sm"
                        >
                          Pincode
                        </Label>
                        <Input
                          id="pincode"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange("pincode", e.target.value)}
                          placeholder="Enter pincode"
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange("acceptTerms", e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <Label htmlFor="acceptTerms" className="text-xs sm:text-sm text-gray-600 cursor-pointer">
                        I agree to the Terms and Conditions and Privacy Policy
                      </Label>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        onClick={handleBackFromStep3}
                        variant="outline"
                        className="flex-1 h-10 sm:h-12 bg-transparent text-sm sm:text-base"
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 sm:h-12 text-sm sm:text-base font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? "Submitting..." : "Complete Registration"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
