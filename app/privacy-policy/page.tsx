import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | JobKarle",
  description: "JobKarle Privacy Policy - How we collect, use, and protect your data",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Effective Date: 23.12.2025</p>

          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <p className="text-xs sm:text-sm">
              Upedge Jobkarle Pvt. Ltd. ("Jobkarle", "Company", "we", "us", or "our") is committed to maintaining a
              robust and secure environment for our users. This Privacy Policy outlines our practices regarding the
              collection, use, and protection of data acquired through http://jobkarle.com (the "Platform") and our
              associated offerings (the "Services").
            </p>
            <p className="text-xs sm:text-sm">
              By accessing our Platform or utilizing our Services, you ("User", "you", or "your") acknowledge that you
              have read and expressly consent to the data practices described herein. This Policy should be read in
              conjunction with our Terms & Conditions.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              1. Scope and Objective
            </h2>
            <p className="text-xs sm:text-sm">
              This Policy applies to all Users of the Platform. Our objective is to leverage data to provide a
              high-quality, personalized professional experience while ensuring compliance with applicable Indian laws.
              We reserve the right to supplement this Policy with service-specific terms as our portfolio of offerings
              expands.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">2. Data Acquisition</h2>
            <p className="text-xs sm:text-sm">
              To provide a seamless professional ecosystem, Jobkarle collects "Personal Data"—information that
              identifies you directly or indirectly.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>User-Provided Information:</strong> Includes names, contact details (email, mobile, address),
                professional location, and any files or inputs uploaded during the use of our Services.
              </li>
              <li>
                <strong>Automated Usage Data:</strong> We collect technical telemetry, including IP addresses, device
                identifiers (make/model/OS), browser types, and engagement patterns via cookies and server logs.
              </li>
              <li>
                <strong>Enhanced Functionality Data:</strong> To optimize Service delivery, we may request access to
                GPS/location data, camera, microphone, and media galleries. Users may manage these permissions via
                device settings, though restriction may limit Service performance.
              </li>
              <li>
                <strong>Third-Party & Public Sources:</strong> We may aggregate data from affiliates, marketing
                partners, vendors, and publicly available professional profiles (e.g., social media) to enhance User
                profiles.
              </li>
            </ul>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              3. Business-Driven Data Utilization
            </h2>
            <p className="text-xs sm:text-sm">
              Jobkarle utilizes Personal Data to drive operational excellence and product innovation. Purposes include:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Service Delivery & Optimization:</strong> Facilitating core functions, troubleshooting, and
                maintaining Platform integrity.
              </li>
              <li>
                <strong>Product Development & AI Training:</strong> We use collected data to develop, train, and refine
                our proprietary algorithms, Artificial Intelligence models, and new product features.
              </li>
              <li>
                <strong>Strategic Communications:</strong> Delivering tailored marketing, promotional offers, and
                updates regarding Services that align with your professional interests.
              </li>
              <li>
                <strong>Corporate Operations:</strong> Facilitating internal security, legal compliance, and corporate
                restructuring (mergers/acquisitions).
              </li>
              <li>
                <strong>Safety & Defense:</strong> Protecting the rights, property, and safety of Jobkarle, our Users,
                and the public, and defending against legal liabilities.
              </li>
            </ul>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-xs sm:text-sm">
              Jobkarle does not sell your Personal Data. However, we may share information with:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Service Providers:</strong> Trusted third-party vendors and analytics partners who assist in
                operating our Platform.
              </li>
              <li>
                <strong>Affiliates:</strong> Group companies for seamless service integration.
              </li>
              <li>
                <strong>Legal Compliance:</strong> Regulatory authorities when required by law or to protect our legal
                interests.
              </li>
              <li>
                <strong>Third-Party Links:</strong> Our Platform may contain links to external sites. Jobkarle is not
                responsible for the privacy practices of third-party entities.
              </li>
            </ul>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              5. Your Data Rights and Management
            </h2>
            <p className="text-xs sm:text-sm">We provide Users with reasonable control over their information:</p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Access & Correction:</strong> Users may request updates to inaccurate data via
                support@jobkarle.com.
              </li>
              <li>
                <strong>Data Accuracy:</strong> The User is responsible for the authenticity of the data provided.
                Jobkarle reserves the right to restrict access if data is found to be fraudulent or obsolete.
              </li>
              <li>
                <strong>Erasure:</strong> You may request account closure. Please note that Jobkarle will retain certain
                data as required by law or for legitimate business interests (e.g., fraud prevention, audit trails).
              </li>
              <li>
                <strong>Processing Time:</strong> We aim to respond to data requests within 15 business days.
                Administrative fees may apply for excessive or repetitive requests.
              </li>
            </ul>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              6. Security and Risk Acknowledgement
            </h2>
            <p className="text-xs sm:text-sm">
              Jobkarle employs industry-standard encryption (SSL) and security protocols to safeguard data. However, as
              no digital transmission is 100% secure, Users acknowledge that they provide information at their own risk.
              In the event of a security breach, we will comply with legal notification requirements to mitigate
              potential impact.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              7. Use of Artificial Intelligence (AI)
            </h2>
            <p className="text-xs sm:text-sm">
              Our Services leverage advanced AI technology. Interactions with AI-powered agents are recorded and
              processed to improve response accuracy and service quality, governed by the same protections outlined in
              this Policy.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              8. Cookies and Tracking
            </h2>
            <p className="text-xs sm:text-sm">
              We use cookies to enhance usability, remember preferences, and analyze traffic. While you may disable
              cookies via your browser, doing so may degrade the functionality of the Platform.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">9. Eligibility</h2>
            <p className="text-xs sm:text-sm">
              Our Services are intended for professional use by individuals aged 18 and older. We do not knowingly
              collect data from minors.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">10. Policy Evolution</h2>
            <p className="text-xs sm:text-sm">
              Jobkarle reserves the right to modify this Privacy Policy at our discretion to reflect changes in law or
              our business model. Continued use of the Platform following updates constitutes acceptance of the revised
              terms.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">11. Contact</h2>
            <p className="text-xs sm:text-sm">
              For inquiries regarding these practices, please contact our Data Privacy Liaison at:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mt-3">
              <p className="mb-1 text-xs sm:text-sm">
                <strong>Email:</strong>{" "}
                <a href="mailto:support@jobkarle.com" className="text-blue-600 hover:underline">
                  support@jobkarle.com
                </a>
              </p>
              <p className="text-xs sm:text-sm">
                <strong>Address:</strong> 305, Oxford House, Rustumbaug Road, Old Airport Road, Bangalore- 560017
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
