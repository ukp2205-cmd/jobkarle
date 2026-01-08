// One-time setup script to create Elasticsearch index with proper mappings
// Run this once: npm run setup-elastic

const ELASTIC_URL = process.env.ELASTIC_URL || "http://localhost:9200"
const INDEX_NAME = "job_postings"

async function setupJobsIndex() {
  try {
    if (!ELASTIC_URL) {
      console.error("[v0] ✗ ELASTIC_URL environment variable not set")
      return { success: false, error: "ELASTIC_URL not configured" }
    }

    console.log("[v0] Setting up Elasticsearch index...")
    console.log("[v0] Elasticsearch URL:", ELASTIC_URL)

    // Check if index already exists
    const existsResponse = await fetch(`${ELASTIC_URL}/${INDEX_NAME}`, { method: "HEAD" })

    if (existsResponse.ok) {
      console.log("[v0] Index already exists. Deleting old index...")
      await fetch(`${ELASTIC_URL}/${INDEX_NAME}`, { method: "DELETE" })
    }

    // Create index with mappings
    const createResponse = await fetch(`${ELASTIC_URL}/${INDEX_NAME}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              job_text_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "stop", "snowball"],
              },
            },
          },
        },
        mappings: {
          properties: {
            job_id: { type: "keyword" },
            title: {
              type: "text",
              analyzer: "job_text_analyzer",
              fields: { keyword: { type: "keyword" } },
            },
            skills: {
              type: "text",
              analyzer: "job_text_analyzer",
            },
            company_name: {
              type: "text",
              analyzer: "job_text_analyzer",
              fields: { keyword: { type: "keyword" } },
            },
            description: {
              type: "text",
              analyzer: "job_text_analyzer",
            },
            city: { type: "keyword" },
            min_experience: { type: "integer" },
            max_experience: { type: "integer" },
            min_salary: { type: "integer" },
            max_salary: { type: "integer" },
            employment_type: { type: "keyword" },
            work_mode: { type: "keyword" },
            status: { type: "keyword" },
            created_at: { type: "date" },
          },
        },
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      throw new Error(`Failed to create index: ${error}`)
    }

    console.log("[v0] ✓ Jobs index created successfully!")

    // Verify index creation
    const mappingResponse = await fetch(`${ELASTIC_URL}/${INDEX_NAME}/_mapping`)
    const mapping = await mappingResponse.json()
    console.log("[v0] Index mapping created:", Object.keys(mapping[INDEX_NAME]?.mappings?.properties || {}).join(", "))

    return { success: true }
  } catch (error: any) {
    console.error("[v0] ✗ Error setting up index:", error.message)
    return { success: false, error: error.message }
  }
}

// Run if called directly
setupJobsIndex()
  .then((result) => {
    console.log("[v0] Setup complete:", result.success ? "SUCCESS" : "FAILED")
    process.exit(result.success ? 0 : 1)
  })
  .catch((error) => {
    console.error("[v0] Setup failed:", error)
    process.exit(1)
  })
