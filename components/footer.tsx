import Link from "next/link"
import { Briefcase, UserCircle, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              JobKarle
            </h3>
            <p className="text-gray-300 text-sm">
              Connecting talented professionals with leading employers across India.
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
            </div>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-400" />
              For Candidates
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/candidate/login"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Candidate Login
                </Link>
              </li>
              <li>
                <Link
                  href="/candidate/register"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Register as Candidate
                </Link>
              </li>
              <li>
                <Link
                  href="/candidate/dashboard"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/resume-builder"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link
                  href="/career-advice"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Career Advice
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              For Employers
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/employer/login"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Employer Login
                </Link>
              </li>
              <li>
                <Link
                  href="/employer/register"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Register as Employer
                </Link>
              </li>
              <li>
                <Link
                  href="/employer/post-job"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Post a Job
                </Link>
              </li>
              <li>
                <Link
                  href="/employer/search-candidates"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Search Candidates
                </Link>
              </li>
              <li>
                <Link
                  href="/employer/pricing"
                  className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="mailto:support@jobkarle.com" className="hover:text-white transition-colors">
                  support@jobkarle.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="tel:+919337951988" className="hover:text-white transition-colors">
                  +91 93379 51988
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} JobKarle. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center w-full sm:w-auto">
            <Link href="/privacy-policy" className="hover:text-white transition-colors py-1">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors py-1">
              Terms of Service
            </Link>
            <Link href="/fraud-alert" className="hover:text-white transition-colors py-1">
              Fraud Alert
            </Link>
            <Link href="/about" className="hover:text-white transition-colors py-1">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
