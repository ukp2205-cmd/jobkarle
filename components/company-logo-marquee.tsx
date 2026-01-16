"use client"

import { useState, useEffect } from "react"

export function CompanyLogoMarquee() {
  const [currentSectorIndex, setCurrentSectorIndex] = useState(0)

  const sectors = [
    {
      name: "IT Companies",
      companies: [
        { name: "TCS", logo: "/tcs-logo.jpg" },
        { name: "Infosys", logo: "/infosys-logo.png" },
        { name: "Wipro", logo: "/wipro-logo.png" },
        { name: "HCL", logo: "/hcl-logo.jpg" },
        { name: "Tech Mahindra", logo: "/tech-mahindra-logo.png" },
        { name: "Amazon", logo: "/amazon-logo.png" },
        { name: "Google", logo: "/google-logo.png" },
        { name: "Microsoft", logo: "/microsoft-logo.png" },
        { name: "IBM", logo: "/ibm-logo.jpg" },
        { name: "Accenture", logo: "/accenture-logo.jpg" },
      ],
    },
    {
      name: "Pharma Companies",
      companies: [
        { name: "Sun Pharma", logo: "/sun-pharma-logo.jpg" },
        { name: "Cipla", logo: "/cipla-generic-logo.png" },
        { name: "Dr Reddy's", logo: "/dr-reddys-logo.jpg" },
        { name: "Lupin", logo: "/lupin-pharma-logo.jpg" },
        { name: "Biocon", logo: "/biocon-logo.jpg" },
        { name: "Cadila", logo: "/cadila-pharma-logo.jpg" },
        { name: "Aurobindo", logo: "/aurobindo-pharma-logo.jpg" },
        { name: "Glenmark", logo: "/glenmark-logo.jpg" },
      ],
    },
    {
      name: "FMCG Companies",
      companies: [
        { name: "HUL", logo: "/hindustan-unilever-logo.jpg" },
        { name: "ITC", logo: "/itc-limited-logo.jpg" },
        { name: "Nestle", logo: "/nestle-india-logo.jpg" },
        { name: "Britannia", logo: "/britannia-logo.jpg" },
        { name: "Dabur", logo: "/dabur-logo.jpg" },
        { name: "Marico", logo: "/marico-logo.jpg" },
        { name: "Parle", logo: "/parle-products-logo.jpg" },
        { name: "Amul", logo: "/amul-logo.jpg" },
      ],
    },
    {
      name: "Automobile Companies",
      companies: [
        { name: "Tata Motors", logo: "/tata-motors-logo.jpg" },
        { name: "Maruti Suzuki", logo: "/maruti-suzuki-logo.jpg" },
        { name: "Mahindra", logo: "/mahindra-logo.jpg" },
        { name: "Hyundai", logo: "/hyundai-logo.jpg" },
        { name: "Honda", logo: "/honda-logo.jpg" },
        { name: "Toyota", logo: "/toyota-logo.jpg" },
        { name: "Hero MotoCorp", logo: "/hero-motocorp-logo.jpg" },
        { name: "Bajaj Auto", logo: "/bajaj-auto-logo.jpg" },
      ],
    },
    {
      name: "Healthcare Companies",
      companies: [
        { name: "Apollo Hospitals", logo: "/apollo-hospitals-logo.jpg" },
        { name: "Fortis Healthcare", logo: "/fortis-healthcare-logo.jpg" },
        { name: "Max Healthcare", logo: "/max-healthcare-logo.jpg" },
        { name: "Manipal Hospitals", logo: "/manipal-hospitals-logo.jpg" },
        { name: "Narayana Health", logo: "/narayana-health-logo.jpg" },
        { name: "Medanta", logo: "/medanta-logo.jpg" },
        { name: "Fortis Memorial", logo: "/fortis-memorial-logo.jpg" },
        { name: "Columbia Asia", logo: "/columbia-asia-logo.jpg" },
      ],
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSectorIndex((prev) => (prev + 1) % sectors.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const currentSector = sectors[currentSectorIndex]
  const allCompanies = [...currentSector.companies, ...currentSector.companies, ...currentSector.companies]

  return (
    <div className="w-full bg-white py-8 sm:py-12 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-center text-lg sm:text-xl font-semibold text-gray-700 mb-6 sm:mb-8 transition-all duration-500">
          Trusted by Leading {currentSector.name}
        </h3>

        <div className="relative overflow-hidden">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Scrolling Content */}
          <div className="flex gap-8 sm:gap-12 animate-marquee hover:pause-marquee">
            {allCompanies.map((company, index) => (
              <div
                key={`${currentSector.name}-${company.name}-${index}`}
                className="flex-shrink-0 flex items-center justify-center hover:scale-110 transition-transform duration-300"
              >
                <img
                  src={company.logo || "/placeholder.svg"}
                  alt={`${company.name} logo`}
                  className="h-10 sm:h-12 w-auto object-contain grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
