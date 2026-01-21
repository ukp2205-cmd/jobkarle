"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  fetchJobPostsAnalytics,
  fetchCandidateRegistrationsAnalytics,
  fetchEmployerRegistrationsAnalytics,
  fetchRevenueAnalytics,
  type TimeRange,
} from "@/app/actions/analytics-actions"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily")
  const [loading, setLoading] = useState(false)
  const [jobPostsData, setJobPostsData] = useState<any[]>([])
  const [candidateData, setCandidateData] = useState<any[]>([])
  const [employerData, setEmployerData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])

  const fetchAllAnalytics = async () => {
    setLoading(true)
    try {
      const [jobPosts, candidates, employers, revenue] = await Promise.all([
        fetchJobPostsAnalytics(timeRange),
        fetchCandidateRegistrationsAnalytics(timeRange),
        fetchEmployerRegistrationsAnalytics(timeRange),
        fetchRevenueAnalytics(timeRange),
      ])

      if (jobPosts.success) setJobPostsData(jobPosts.data)
      if (candidates.success) setCandidateData(candidates.data)
      if (employers.success) setEmployerData(employers.data)
      if (revenue.success) setRevenueData(revenue.data)
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAllAnalytics()
  }, [timeRange])

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-sm text-gray-600 mt-1">View detailed statistics and trends</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Time Range Tabs */}
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)} className="mb-6">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Charts Grid */}
        <div className="grid gap-6">
          {/* Row 1: Job Posts & Candidate Registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Job Posts */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Daily Job Posts</CardTitle>
                <CardDescription className="text-sm text-gray-500">Active and inactive job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={jobPostsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="active" fill="#3b82f6" name="Active Jobs" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inactive" fill="#10b981" name="Inactive Jobs" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Candidate Registrations */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Daily Candidate Registrations</CardTitle>
                <CardDescription className="text-sm text-gray-500">New candidate sign-ups</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={candidateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                      name="New Candidates"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Employer Registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Employer Registrations */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Daily Employer Registrations</CardTitle>
                <CardDescription className="text-sm text-gray-500">New employer sign-ups</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={employerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ fill: "#06b6d4", r: 4 }}
                      name="New Employers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Revenue - Full Width */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Daily Revenue (₹)</CardTitle>
              <CardDescription className="text-sm text-gray-500">Revenue from credit purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [`₹${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
