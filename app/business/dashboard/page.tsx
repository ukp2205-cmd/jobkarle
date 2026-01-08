import { redirect } from "next/navigation"
import { getBusinessSession } from "@/app/actions/business-dashboard-actions"
import { BusinessDashboard } from "@/components/business-dashboard"

export default async function BusinessDashboardPage() {
  const session = await getBusinessSession()

  if (!session) {
    redirect("/business/login")
  }

  return <BusinessDashboard session={session} />
}
