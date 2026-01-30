import Link from "next/link"
import { ArrowLeft, Target, Users, Award, TrendingUp, Shield, Heart } from "lucide-react"

export const metadata = {
  title: "About Us | JobKarle",
  description: "Learn about JobKarle - India's leading job portal connecting talented professionals with top employers",
}

export default function AboutPage() {
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
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              About JobKarle
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Empowering careers and connecting talent with opportunities across India
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 md:p-8 mb-10">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  At JobKarle, we believe that every professional deserves the opportunity to find meaningful work, and
                  every employer deserves access to the best talent. We are committed to bridging the gap between job
                  seekers and employers by providing a transparent, efficient, and user-friendly platform that makes the
                  hiring process seamless for everyone involved.
                </p>
              </div>
            </div>
          </div>

          {/* Story Section */}
          <div className="prose prose-sm max-w-none space-y-6 text-gray-700 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p>
              Founded with a vision to transform the job search and recruitment landscape in India, JobKarle was born
              from the understanding that finding the right job or the right candidate shouldn't be a daunting task. We
              recognized the challenges faced by both job seekers and employers in navigating the traditional
              recruitment process, and we set out to create a solution that would make this journey simpler, faster, and
              more effective.
            </p>
            <p>
              Since our inception, we have grown into one of India's most trusted job portals, serving thousands of
              candidates and employers across various industries. Our platform leverages cutting-edge technology,
              including AI-powered matching algorithms, to ensure that the right talent meets the right opportunity at
              the right time.
            </p>
          </div>

          {/* Values Grid */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 p-5 bg-blue-50 rounded-lg border border-blue-100">
                <div className="bg-blue-600 p-2.5 rounded-lg h-fit">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Trust & Transparency</h3>
                  <p className="text-sm text-gray-600">
                    We operate with complete transparency, ensuring secure and authentic connections between candidates
                    and employers. Your trust is our foundation.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-purple-50 rounded-lg border border-purple-100">
                <div className="bg-purple-600 p-2.5 rounded-lg h-fit">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Innovation</h3>
                  <p className="text-sm text-gray-600">
                    We continuously evolve our platform with the latest technology and features to provide the best user
                    experience for job seekers and employers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-green-50 rounded-lg border border-green-100">
                <div className="bg-green-600 p-2.5 rounded-lg h-fit">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">User-Centric</h3>
                  <p className="text-sm text-gray-600">
                    Every feature we build is designed with our users in mind. Your success is our success, and we're
                    committed to making your journey smooth.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-amber-50 rounded-lg border border-amber-100">
                <div className="bg-amber-600 p-2.5 rounded-lg h-fit">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Excellence</h3>
                  <p className="text-sm text-gray-600">
                    We strive for excellence in everything we do, from our platform's performance to our customer
                    support, ensuring quality at every touchpoint.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What We Offer Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Offer</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-1">For Job Seekers</h3>
                <p className="text-sm text-gray-600">
                  Access thousands of job opportunities across industries, create professional profiles, upload resumes,
                  apply with one click, track applications, and receive personalized job recommendations powered by AI.
                </p>
              </div>

              <div className="border-l-4 border-purple-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-1">For Employers</h3>
                <p className="text-sm text-gray-600">
                  Post job openings, search our extensive candidate database, use advanced filters to find the perfect
                  match, manage applications efficiently, and connect with pre-screened, qualified professionals ready
                  to contribute to your organization.
                </p>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 md:p-8 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose JobKarle?</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full p-1 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  <strong>Verified Opportunities:</strong> All job postings and employer profiles are verified to
                  prevent fraud and ensure authenticity.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full p-1 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  <strong>Smart Matching:</strong> Our AI-powered algorithms match candidates with jobs based on skills,
                  experience, and preferences.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full p-1 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  <strong>Free for Job Seekers:</strong> Creating a profile and applying for jobs is completely free for
                  all candidates.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full p-1 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  <strong>Dedicated Support:</strong> Our customer support team is always ready to assist you with any
                  queries or concerns.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full p-1 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  <strong>Mobile-Friendly:</strong> Access JobKarle anytime, anywhere with our responsive platform
                  optimized for all devices.
                </span>
              </li>
            </ul>
          </div>

          {/* Commitment Section */}
          <div className="flex gap-4 p-6 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl border-2 border-rose-200">
            <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-3 rounded-lg h-fit">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Our Commitment</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                JobKarle is more than just a job portal—it's a community dedicated to professional growth and success.
                We are committed to:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>Providing a safe, fraud-free platform for all users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>Continuously improving our services based on user feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>Protecting your personal information and privacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>Supporting career development through resources and guidance</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-10 text-center p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
            <h2 className="text-2xl font-bold mb-3">Join the JobKarle Community Today</h2>
            <p className="mb-6 text-blue-100">
              Whether you're looking for your next opportunity or searching for top talent, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/candidate/register"
                className="px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Register as Candidate
              </Link>
              <Link
                href="/employer/register"
                className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Register as Employer
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <div className="space-y-2 text-gray-700">
              <p className="text-sm">
                <strong>Email:</strong>{" "}
                <a href="mailto:support@jobkarle.com" className="text-blue-600 hover:underline">
                  support@jobkarle.com
                </a>
              </p>
              <p className="text-sm">
                <strong>Phone:</strong>{" "}
                <a href="tel:+919337951988" className="text-blue-600 hover:underline">
                  +91 93379 51988
                </a>
              </p>
              <p className="text-sm">
                <strong>Address:</strong> Mumbai, Maharashtra, India
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
