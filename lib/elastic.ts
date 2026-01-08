// Elasticsearch client with dynamic loading to avoid build-time errors
// Uses dynamic import to load @elastic/elasticsearch only when needed

const ELASTIC_URL = process.env.ELASTIC_URL
const JOBS_INDEX = "job_postings"

let elasticClient: any = null
let clientInitialized = false

console.log("[v0] === Elasticsearch Configuration ===")
console.log("[v0] ELASTIC_URL from environment:", ELASTIC_URL || "NOT SET")

async function initializeElasticClient() {
  if (clientInitialized) {
    return elasticClient
  }

  if (!ELASTIC_URL || ELASTIC_URL.trim() === "") {
    console.warn(
      "[v0] ⚠ ELASTIC_URL not configured - Elasticsearch disabled. Set ELASTIC_URL=http://localhost:9200 in environment variables.",
    )
    clientInitialized = true
    return null
  }

  try {
    console.log("[v0] Loading @elastic/elasticsearch package dynamically...")

    // Dynamic import to avoid static import errors
    const { Client } = await import("@elastic/elasticsearch")

    console.log("[v0] ✓ @elastic/elasticsearch loaded successfully")
    console.log("[v0] Initializing Elasticsearch client with URL:", ELASTIC_URL)

    const hasAuth = process.env.ELASTIC_USERNAME && process.env.ELASTIC_PASSWORD

    elasticClient = new Client({
      node: ELASTIC_URL,
      ...(hasAuth && {
        auth: {
          username: process.env.ELASTIC_USERNAME!,
          password: process.env.ELASTIC_PASSWORD!,
        },
      }),
      requestTimeout: 30000,
      maxRetries: 3,
      tls: {
        rejectUnauthorized: false,
      },
    })

    console.log("[v0] ✓ Elasticsearch client initialized successfully")
    clientInitialized = true

    return elasticClient
  } catch (error: any) {
    console.error("[v0] ✗ Failed to initialize Elasticsearch client:")
    console.error("[v0]   Error:", error.message)
    console.error("[v0]   Stack:", error.stack)
    clientInitialized = true
    elasticClient = null
    return null
  }
}

// Get the client (initializes on first call)
async function getElasticClient() {
  if (!clientInitialized) {
    await initializeElasticClient()
  }
  return elasticClient
}

// Test connection
export async function testElasticConnection() {
  const client = await getElasticClient()

  if (!client) {
    console.error("[v0] Elasticsearch client not initialized")
    return {
      success: false,
      error: "Elasticsearch client not initialized - check ELASTIC_URL environment variable",
      elasticUrl: ELASTIC_URL || "NOT SET",
    }
  }

  try {
    const health = await client.cluster.health()
    console.log("[v0] ✓ Elasticsearch connection successful:", health)
    return { success: true, health }
  } catch (error: any) {
    console.error("[v0] ✗ Elasticsearch connection failed:", error.message)
    return {
      success: false,
      error: error.message,
      elasticUrl: ELASTIC_URL,
    }
  }
}

export { getElasticClient, JOBS_INDEX }
export type { Client } from "@elastic/elasticsearch"
