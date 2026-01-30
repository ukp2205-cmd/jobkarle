import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getEmployerSession } from "@/app/actions/employer-auth-actions"
import { SearchResultsContent } from "@/components/search-results-content"

interface SearchResultsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function SearchResultsWrapper({ searchParams }: SearchResultsPageProps) {
  const params = await searchParams
  const { success, session } = await getEmployerSession()

  if (!success || !session) {
    redirect("/employer/login")
  }

  // Parse search params on server side
  const filters = {
    keywords: (params.keywords as string) || "",
    skills: (params.skills as string)?.split(",").filter(Boolean) || [],
    excludeKeywords: (params.excludeKeywords as string) || "",
    locations: (params.locations as string)?.split(",").filter(Boolean) || [],
    includeRelocate: params.includeRelocate === "true",
    experienceMin: Number(params.expMin) || 0,
    experienceMax: Number(params.expMax) || 30,
    salaryMin: Number(params.salaryMin) || 0,
    salaryMax: Number(params.salaryMax) || 100,
    noticePeriod: (params.noticePeriod as string)?.split(",").filter(Boolean) || [],
    education: (params.education as string)?.split(",").filter(Boolean) || [],
    industry: (params.industry as string)?.split(",").filter(Boolean) || [],
    department: (params.department as string)?.split(",").filter(Boolean) || [],
    company: (params.company as string) || "",
    activeIn: (params.activeIn as string) || "6months",
    gender: params.gender ? [params.gender as string] : [],
    diversity: (params.diversity as string)?.split(",").filter(Boolean) || [],
    jobType: (params.jobType as string)?.split(",").filter(Boolean) || [],
    employmentType: (params.employmentType as string)?.split(",").filter(Boolean) || [],
    showOnly: (params.showOnly as string)?.split(",").filter(Boolean) || [],
  }

  return <SearchResultsContent employerId={session.employerId} filters={filters} />
}

export default function SearchResultsPage({ searchParams }: SearchResultsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-500">Loading search results...</p>
          </div>
        </div>
      }
    >
      <SearchResultsWrapper searchParams={searchParams} />
    </Suspense>
  )
}
