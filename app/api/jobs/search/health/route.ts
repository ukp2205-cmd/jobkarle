import { NextResponse } from "next/server"
import { isElasticsearchConfigured, testElasticsearchConnection } from "@/lib/elastic-fetch"

export async function GET() {
  console.log("[v0] ========================================")
  console.log("[v0] Health check endpoint called")
  console.log("[v0] ========================================")

  const isConfigured = isElasticsearchConfigured()

  const healthData: any = {
    timestamp: new Date().toISOString(),
    environment: {
      ELASTIC_URL: process.env.ELASTIC_URL || "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    },
    elasticConfigured: isConfigured,
  }

  // Try to test connection
  if (isConfigured) {
    try {
      const connectionOk = await testElasticsearchConnection()
      healthData.connectionTest = {
        success: connectionOk,
        message: connectionOk ? "Connected successfully" : "Connection failed",
      }
    } catch (error: any) {
      healthData.connectionTest = {
        success: false,
        error: error.message,
      }
    }
  } else {
    healthData.connectionTest = {
      success: false,
      error: "Elasticsearch not configured - set ELASTIC_URL environment variable",
    }
  }

  console.log("[v0] Health check result:", JSON.stringify(healthData, null, 2))

  return NextResponse.json(healthData, {
    status: healthData.connectionTest?.success ? 200 : 503,
  })
}
