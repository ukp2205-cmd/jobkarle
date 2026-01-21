"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  fetchJobPostsAnalytics,
  fetchCandidateRegistrationsAnalytics,
  fetchEmployerRegistrationsAnalytics,
  fetchRevenueAnalytics,
  type TimeRange,
} from "@/app/actions/analytics-actions"

export function BusinessAnalyticsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily")
  const [jobPostsData, setJobPostsData] = useState<any[]>([])
  const [candidatesData, setCandidatesData] = useState<any[]>([])
  const [employersData, setEmployersData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [jobPosts, candidates, employers, revenue] = await Promise.all([
        fetchJobPostsAnalytics(timeRange),
        fetchCandidateRegistrationsAnalytics(timeRange),
        fetchEmployerRegistrationsAnalytics(timeRange),
        fetchRevenueAnalytics(timeRange),
      ])

      if (jobPosts.success) setJobPostsData(jobPosts.data)
      if (candidates.success) setCandidatesData(candidates.data)
      if (employers.success) setEmployersData(employers.data)
      if (revenue.success) setRevenueData(revenue.data)
    } catch (error) {
      console.error("[v0] Error loading analytics:", error)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">View detailed statistics and trends</p>
        </div>

        {/* Time Range Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={timeRange === "daily" ? "default" : "outline"}
            onClick={() => setTimeRange("daily")}
            className={timeRange === "daily" ? "" : "bg-white"}
          >
            Daily
          </Button>
          <Button
            variant={timeRange === "weekly" ? "default" : "outline"}
            onClick={() => setTimeRange("weekly")}
            className={timeRange === "weekly" ? "" : "bg-white"}
          >
            Weekly
          </Button>
          <Button
            variant={timeRange === "monthly" ? "default" : "outline"}
            onClick={() => setTimeRange("monthly")}
            className={timeRange === "monthly" ? "" : "bg-white"}
          >
            Monthly
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row - Job Posts and Registrations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Job Posts */}
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {timeRange === "daily" ? "Daily" : timeRange === "weekly" ? "Weekly" : "Monthly"} Job Posts
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={jobPostsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="active" fill="#3b82f6" name="Active" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="inactive" fill="#10b981" name="Inactive" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Candidate Registrations */}
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {timeRange === "daily" ? "Daily" : timeRange === "weekly" ? "Weekly" : "Monthly"} Candidate
                    Registrations
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={candidatesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
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

            {/* Bottom Row - Revenue and Employer Registrations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue */}
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {timeRange === "daily" ? "Daily" : timeRange === "weekly" ? "Weekly" : "Monthly"} Revenue (₹)
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [`₹${value}`, "Revenue"]}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Employer Registrations */}
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {timeRange === "daily" ? "Daily" : timeRange === "weekly" ? "Weekly" : "Monthly"} Employer
                    Registrations
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={employersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="count" fill="#06b6d4" name="New Employers" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
