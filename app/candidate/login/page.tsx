import { CandidateLoginForm } from "@/components/candidate-login"

export default function CandidateLoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <CandidateLoginForm redirectUrl={searchParams.redirect} />
    </div>
  )
}
