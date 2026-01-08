import Link from "next/link"
import { ArrowLeft, AlertTriangle, ShieldAlert, Phone, Mail } from "lucide-react"

export const metadata = {
  title: "Fraud Alert | JobKarle",
  description: "JobKarle Fraud Alert - Stay safe from fraudulent job offers and scams",
}

export default function FraudAlertPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6 md:p-10">
          {/* Alert Banner */}
          <div className="flex items-start gap-4 mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-1">Important Safety Notice</h2>
              <p className="text-sm text-red-800">
                Job Karle NEVER asks for money. If anyone asks you to pay for job registration, interviews, or offers,
                it is a FRAUD.
              </p>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-red-600" />
            Fraud Alert
          </h1>
          <p className="text-sm text-gray-600 mb-8">Protect Yourself from Job Scams - Stay Safe with Job Karle</p>

          <div className="space-y-6 text-gray-700">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 1: No Fees Policy</h3>
              <p className="text-sm">
                Job Karle <span className="font-semibold text-red-600">NEVER</span> asks for money for job registration,
                interviews, job offers, training, or joining.
              </p>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 2: No Payment Requests</h3>
              <p className="text-sm">
                If anyone asks you to pay fees for offer letters, document verification, ID cards, or fast joining,{" "}
                <span className="font-semibold text-red-600">IT IS A FRAUD</span>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 3: Official Communication Only</h3>
              <p className="text-sm mb-2">
                Job Karle contacts candidates only through official company phone numbers and verified email IDs.
              </p>
              <p className="text-sm font-semibold text-orange-700">
                Do not trust messages from personal WhatsApp numbers or free email IDs.
              </p>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 4: Interview Process Is Mandatory</h3>
              <p className="text-sm mb-1">Every genuine job will have a proper interview.</p>
              <p className="text-sm font-semibold text-red-600">Offers without interviews are FAKE.</p>
            </div>

            {/* Step 5 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 5: Protect Your Personal Information</h3>
              <p className="text-sm">
                Do not share OTPs, passwords, bank details, Aadhaar, PAN, or CV with unknown persons.
              </p>
            </div>

            {/* Step 6 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 6: No Agents or Middlemen</h3>
              <p className="text-sm">
                Job Karle does not authorize any agent, consultant, or third party to collect money on its behalf.
              </p>
            </div>

            {/* Step 7 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 7: Verify Before You Proceed</h3>
              <p className="text-sm">
                Always check recruiter details and job information on the official Job Karle platform before moving
                forward.
              </p>
            </div>

            {/* Step 8 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 8: Report Fraud Immediately</h3>
              <p className="text-sm">
                If you receive any suspicious call, message, or email, report it to Job Karle support immediately.
              </p>
            </div>

            {/* Step 9 */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 9: User Responsibility</h3>
              <p className="text-sm">
                Job Karle is not responsible for losses caused by payments made to unauthorized individuals.
              </p>
            </div>

            {/* Report Fraud Section */}
            <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Report Suspicious Activity
              </h3>
              <p className="text-sm mb-4 text-gray-700">
                If you encounter any fraudulent activity or receive suspicious communication claiming to be from Job
                Karle, please contact us immediately:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Email Support</p>
                    <a
                      href="mailto:support@jobkarle.com"
                      className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      support@jobkarle.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Call Support</p>
                    <a
                      href="tel:+919337951988"
                      className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      +91 93379 51988
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="mt-8 bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Safety Tips</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Always verify job postings on the official Job Karle website or app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Check the email domain - it should end with @jobkarle.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Never share banking information during the application process</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Research the company independently before applying</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Trust your instincts - if it seems too good to be true, it probably is</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
