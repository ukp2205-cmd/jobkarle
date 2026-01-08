import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service | JobKarle",
  description: "JobKarle Terms of Service - Rules and guidelines for using the Job Karle Platform",
}

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Job Karle Platform</p>

          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-xs sm:text-sm">
              By accessing or using the Job Karle Platform (including mobile applications, websites, and web
              applications) operated by Job Karle and its affiliates, including Upedge Job Karle Private Limited ("Job
              Karle India"), you agree to be bound by these Terms of Service and our Privacy Policy. These terms govern
              your use of the Platform as a Job Poster and any related services ("Job Karle Services").
            </p>
            <p className="text-xs sm:text-sm">
              Job Karle reserves the right to modify these Terms at any time by posting updated versions on the
              Platform. Continued use after changes constitutes acceptance. Job Karle may notify Job Posters of material
              changes via email or account notification. Failure to object within the specified timeframe constitutes
              acceptance.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              2. Platform Usage and Job Posting
            </h2>
            <p className="text-xs sm:text-sm">
              Job Posters may use the Platform to post job listings, view candidate profiles, schedule interviews, and
              engage with potential hires. Job Posters must provide accurate and complete job details, including role,
              schedule, salary range, required experience, and education. Job Posters represent that all information is
              truthful, non‑discriminatory, and compliant with applicable laws.
            </p>
            <p className="text-xs sm:text-sm">
              Job applications remain accessible for 60 days from submission, after which they are archived and no
              longer visible to Job Posters. Candidates may re‑apply after this period.
            </p>
            <p className="text-xs sm:text-sm">Job Posters must adhere to the Employer Code of Conduct at all times.</p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              3. Platform Management and Termination
            </h2>
            <p className="text-xs sm:text-sm">Job Karle may, at its sole discretion:</p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>Restrict, suspend, or terminate access to the Platform or Services;</li>
              <li>Modify, suspend, or discontinue any part of the Platform or Services;</li>
              <li>Remove or reject any content submitted by a Job Poster;</li>
              <li>Deactivate accounts and related data;</li>
              <li>Establish usage limits and practices;</li>
              <li>Assign its rights and obligations to affiliated entities.</li>
            </ul>
            <p className="text-xs sm:text-sm">
              Job Karle may take these actions without prior notice if a Job Poster breaches these Terms, uses the
              Platform improperly, or violates applicable laws.
            </p>
            <p className="text-xs sm:text-sm">
              If Job Karle suspends or terminates an account due to its own negligence, any prepaid platform fees will
              be refunded. No refunds will be provided if suspension or termination results from Job Poster's breach,
              misconduct, or circumstances beyond Job Karle's control.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              4. Intellectual Property
            </h2>
            <p className="text-xs sm:text-sm">
              All software, content, graphics, logos, and materials on the Platform are owned by Job Karle or its
              licensors and are protected by intellectual property laws. Job Posters may not copy, modify, distribute,
              or create derivative works without express written permission.
            </p>
            <p className="text-xs sm:text-sm">
              Job Posters retain rights to content they upload ("Job Poster Content") but grant Job Karle a worldwide,
              royalty‑free, sub‑licensable license to use, display, distribute, and store such content for Platform
              operation, candidate matching, and service delivery.
            </p>
            <p className="text-xs sm:text-sm">
              Job Posters warrant that their content does not infringe third‑party rights and agree to indemnify Job
              Karle against any related claims, including legal costs.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              5. Third‑Party Services and Content
            </h2>
            <p className="text-xs sm:text-sm">
              The Platform may contain links to third‑party sites or services. Job Karle is not responsible for
              third‑party content, services, or transactions. Engagement with third parties is at the Job Poster's own
              risk and subject to the third party's terms.
            </p>
            <p className="text-xs sm:text-sm">
              Job Karle does not guarantee the accuracy, quality, or legality of third‑party content, including
              candidate‑provided information.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              6. Data Privacy and Confidentiality
            </h2>
            <p className="text-xs sm:text-sm">
              Job Poster information is handled in accordance with our{" "}
              <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              . Job Karle may share information as described therein and as necessary for service delivery.
            </p>
            <p className="text-xs sm:text-sm">
              Job Posters are responsible for securing candidate personal data received via the Platform and may only
              use it for recruitment purposes. Misuse may result in immediate account termination.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              7. Job Poster Responsibilities
            </h2>
            <p className="text-xs sm:text-sm">Job Posters agree to:</p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>Provide accurate, current, and complete registration and job data;</li>
              <li>Maintain account security and notify Job Karle of unauthorized use;</li>
              <li>Use the Platform in compliance with all applicable laws and regulations;</li>
              <li>
                Refrain from unauthorized scraping, data mining, automation, or interference with Platform operations;
              </li>
              <li>Avoid posting false, misleading, discriminatory, harassing, or illegal content;</li>
              <li>Not use the Platform for unauthorized commercial activities, spamming, or fraud.</li>
            </ul>
            <p className="text-xs sm:text-sm">
              Job Karle may remove usernames or content deemed inappropriate and suspend or terminate accounts for
              violations.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">8. Eligibility</h2>
            <p className="text-xs sm:text-sm">
              The Platform is available only to individuals aged 18 or older residing in India with a valid email
              address and/or mobile number. Job Posters must register successfully to post jobs. Job Karle may bar
              access for violations of these Terms or the Code of Conduct.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">9. Dispute Resolution</h2>
            <p className="text-xs sm:text-sm">
              Any dispute arising from these Terms or the Services ("Dispute") shall first be settled amicably within 30
              days of written notice. Failing amicable resolution, the Dispute shall be referred to arbitration by a
              sole arbitrator under the Delhi International Arbitration Centre (DIAC) Rules, seated in New Delhi,
              governed by Indian law.
            </p>
            <p className="text-xs sm:text-sm">
              Nothing prevents either party from seeking interim injunctive relief from courts in New Delhi.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              10. Limitation of Liability and Indemnification
            </h2>
            <p className="text-xs sm:text-sm">
              Job Posters use the Platform at their own risk. To the fullest extent permitted by law, Job Karle is not
              liable for any direct, indirect, incidental, or consequential damages arising from Platform use, including
              but not limited to data loss, service interruptions, or third‑party actions.
            </p>
            <p className="text-xs sm:text-sm">
              Job Posters agree to indemnify and hold harmless Job Karle, its affiliates, and their respective officers,
              directors, and employees from any claims, damages, or losses arising from the Job Poster's use of the
              Platform, violation of these Terms, or infringement of third‑party rights.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              11. Service Disclaimers
            </h2>
            <p className="text-xs sm:text-sm">
              Job Karle provides the Platform "as is" and makes no warranties regarding uninterrupted, error‑free, or
              secure operation. Job Karle is not liable for service interruptions, data loss, or inaccuracies. Job
              Posters download and use materials at their own risk.
            </p>
            <p className="text-xs sm:text-sm">
              Job Karle reserves the right to correct errors, including via adjustment of account balances, with notice
              to the Job Poster.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
              12. Grievance Redressal
            </h2>
            <p className="text-xs sm:text-sm">
              Complaints regarding content or Platform access may be submitted in writing to:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mt-3">
              <p className="mb-1 text-xs sm:text-sm">
                <strong>Grievance Officer:</strong> Ramakant
              </p>
              <p className="mb-1 text-xs sm:text-sm">
                <strong>Email:</strong>{" "}
                <a href="mailto:Ramakant@jobkarle.com" className="text-blue-600 hover:underline">
                  Ramakant@jobkarle.com
                </a>
              </p>
              <p className="text-xs sm:text-sm">
                <strong>Address:</strong> 305, Oxford House, Rustumbaug Road, Old Airport Road, Bangalore- 560017
              </p>
            </div>
            <p className="mt-3 text-xs sm:text-sm">
              Complaints must include complainant details, description of the issue, and a statement of good faith. Job
              Karle will investigate and take appropriate action at its discretion.
            </p>
            <p className="text-xs sm:text-sm">
              For intellectual property infringement notices, please provide the information specified in Section 11 of
              these Terms.
            </p>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">13. Paid Services</h2>
            <p className="text-xs sm:text-sm">
              Paid Services, including Job Posts, Database Views, Subscription Plans, Job Karle Credits, and Job Karle
              Coins, are subject to specific terms communicated at purchase. Job Karle reserves the right to modify,
              suspend, or discontinue Paid Services without prior notice.
            </p>
            <p className="text-xs sm:text-sm">
              All sales are final except where required by law. Refunds, if any, are provided at Job Karle's sole
              discretion and only on a pro‑rata basis for unused portions. Credits and Coins are non‑transferable and
              expire 360 days from purchase.
            </p>
            <p className="text-xs sm:text-sm">
              Job Karle does not guarantee candidate responses, profile relevance, or hiring outcomes. Enterprise
              Account administrators are responsible for Designated User compliance and data accuracy.
            </p>

            <div className="border-t border-gray-200 mt-8 pt-4">
              <p className="text-xs text-gray-600 italic">Last Updated: 23.12.2025</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
