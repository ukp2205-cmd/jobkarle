"use client"

export function CompanyLogoMarquee() {
  // Popular company logos - using placeholder images with company names
  const companies = [
    { name: "TCS", logo: "/generic-tech-logo.png" },
    { name: "Infosys", logo: "/infosys-logo.png" },
    { name: "Wipro", logo: "/wipro-logo.png" },
    { name: "HCL", logo: "/generic-tech-logo.png" },
    { name: "Tech Mahindra", logo: "/tech-mahindra-logo.png" },
    { name: "Amazon", logo: "/amazon-logo.png" },
    { name: "Flipkart", logo: "/flipkart-logo.png" },
    { name: "Google", logo: "/google-logo.png" },
    { name: "Microsoft", logo: "/microsoft-logo.png" },
    { name: "IBM", logo: "/ibm-logo.png" },
    { name: "Accenture", logo: "/accenture-logo.jpg" },
    { name: "Cognizant", logo: "/cognizant-logo.png" },
  ]

  // Duplicate the array for seamless loop
  const duplicatedCompanies = [...companies, ...companies]

  return (
    <div className="w-full bg-white py-8 sm:py-12 border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-center text-lg sm:text-xl font-semibold text-gray-700 mb-6 sm:mb-8">
          Trusted by Leading Companies
        </h3>

        {/* Marquee Container */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Scrolling Content */}
          <div className="flex gap-8 sm:gap-12 animate-marquee pause-marquee">
            {duplicatedCompanies.map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="flex-shrink-0 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
              >
                <img
                  src={company.logo || "/placeholder.svg"}
                  alt={`${company.name} logo`}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
