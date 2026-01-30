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
                href="https://www.linkedin.com/company/111237147/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61586522034394"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/jobkarle09/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://x.com/JobKarleofficia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter / X"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
                <span>Bangalore, Karnataka, 560017, India</span>
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
