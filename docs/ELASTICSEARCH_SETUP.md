# Elasticsearch Setup Guide

This guide explains how to set up and use Elasticsearch for job search in the JobKarle application.

## Prerequisites

1. **Elasticsearch 8.x installed and running**
   - Download from: https://www.elastic.co/downloads/elasticsearch
   - Or use Docker: `docker run -d -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.11.0`

2. **Environment variables configured**
   - `ELASTIC_URL` - Elasticsearch endpoint (e.g., http://localhost:9200)
   - `ELASTIC_USERNAME` - Username (default: elastic)
   - `ELASTIC_PASSWORD` - Your Elasticsearch password
   - `NEXT_PUBLIC_BASE_URL` - Your app URL (for API calls)

## Setup Steps

### 1. Install Dependencies

The required package `@elastic/elasticsearch` is already included in package.json.

### 2. Create Elasticsearch Index

Run the setup script to create the jobs index with proper mappings:

```bash
npx tsx scripts/setup-elasticsearch-index.ts
```

This creates an index called `jobs` with the following mappings:
- Full-text fields: `title`, `skills`, `company_name`, `description`
- Keyword fields: `job_id`, `city`, `state`, `job_type`, `work_mode`, `employment_type`, `category`, `status`
- Numeric fields: `experience_min`, `experience_max`, `salary_min`, `salary_max`
- Date fields: `created_at`, `published_at`

### 3. Index Existing Jobs

After creating the index, you can bulk-index existing jobs from Supabase:

```typescript
// Run this in a server action or API route
import { createAdminClient } from "@/lib/supabase/admin"

const supabase = createAdminClient()
const { data: jobs } = await supabase
  .from("job_postings")
  .select("*")
  .eq("status", "published")

// Index each job
for (const job of jobs || []) {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: job.id })
  })
}
```

## Usage

### Automatic Indexing

When a job is created or updated via `createJobPosting()` or `updateJobPosting()`, it automatically:
1. Saves to Supabase (source of truth)
2. Indexes to Elasticsearch (for search)

### Manual Indexing

If you need to manually index/update a job:

**Index a job:**
```typescript
POST /api/jobs/index
Body: { jobId: "uuid-here" }
```

**Update a job:**
```typescript
PUT /api/jobs/index
Body: { jobId: "uuid-here" }
```

**Delete a job:**
```typescript
DELETE /api/jobs/index
Body: { jobId: "uuid-here" }
```

### Searching Jobs

Use the server action in your components:

```typescript
import { searchJobsWithElastic } from "@/app/actions/elastic-search-actions"

// In your component
const results = await searchJobsWithElastic({
  keyword: "React Developer",
  city: ["Mumbai", "Bangalore"],
  experience: { min: 2, max: 5 },
  salary: { min: 500000, max: 1000000 },
  page: 1,
  limit: 20
})

// Results format
{
  success: true,
  jobs: [...],
  total: 150,
  page: 1,
  limit: 20,
  totalPages: 8
}
```

### Autocomplete

Get suggestions as users type:

```typescript
import { getAutocompleteSuggestions } from "@/app/actions/elastic-search-actions"

const suggestions = await getAutocompleteSuggestions("java", "title")
// Returns: [{ value: "Java Developer", id: "..." }, ...]
```

## Search Features

### 1. Keyword Search with Boosting
- **Title** is boosted 3x (most important)
- **Skills** are boosted 2x
- **Company name** is boosted 2x
- **Description** has normal weight

### 2. Fuzzy Matching
- Automatically handles typos (e.g., "develper" → "developer")
- Uses Elasticsearch's AUTO fuzziness

### 3. Multi-Field Filters
- **City**: Filter by one or multiple cities
- **Experience**: Range query with overlap detection
- **Salary**: Range query with overlap detection
- **Status**: Only published jobs are searchable

### 4. Relevance Sorting
- Results are sorted by:
  1. Relevance score (if keyword search)
  2. Latest created date

### 5. Highlighting
- Search terms are highlighted in results
- Wrapped in `<mark>` tags for easy styling

## Architecture

### Data Flow

```
User Action → Supabase (Save) → Elasticsearch (Index)
                ↓
         Source of Truth
                
User Search → Elasticsearch API → Results
```

### Why This Approach?

1. **Supabase as Source of Truth**: All job data lives in Supabase
2. **Elasticsearch for Search**: Fast, relevant search results
3. **Server-Side Only**: Elasticsearch client never exposed to browser
4. **Automatic Sync**: Jobs auto-index on create/update

## Production Considerations

### 1. Error Handling
- Job creation succeeds even if Elasticsearch fails
- Elasticsearch errors are logged but don't break the user flow
- Failed indexing can be retried later

### 2. Scaling
- Use Elasticsearch cluster for high availability
- Implement connection pooling
- Add caching layer (Redis) for frequent searches

### 3. Monitoring
- Monitor Elasticsearch health
- Track indexing failures
- Set up alerts for sync issues

### 4. Security
- Never expose Elasticsearch credentials to frontend
- Use environment variables for all config
- Implement rate limiting on search API

### 5. Backup & Recovery
- Supabase is the source of truth (already backed up)
- Elasticsearch index can be rebuilt from Supabase
- Regular snapshots recommended for large datasets

## Troubleshooting

### Index not found
```bash
# Re-run setup script
npx tsx scripts/setup-elasticsearch-index.ts
```

### Jobs not appearing in search
```typescript
// Check job status
const { data } = await supabase
  .from("job_postings")
  .select("id, status")
  .eq("id", "job-id")

// Manually re-index
await fetch("/api/jobs/index", {
  method: "POST",
  body: JSON.stringify({ jobId: "job-id" })
})
```

### Connection errors
- Verify `ELASTIC_URL` is correct
- Check Elasticsearch is running: `curl http://localhost:9200`
- Verify credentials are correct

## Testing

Test the setup:

```typescript
// Test connection
import { testElasticConnection } from "@/lib/elastic"
await testElasticConnection()

// Test search
const results = await searchJobsWithElastic({
  keyword: "developer",
  page: 1,
  limit: 10
})

console.log(`Found ${results.total} jobs`)
```

## API Reference

### POST /api/jobs/index
Index a single job from Supabase to Elasticsearch.

**Request:**
```json
{ "jobId": "uuid" }
```

**Response:**
```json
{
  "success": true,
  "message": "Job indexed successfully",
  "elasticId": "uuid"
}
```

### PUT /api/jobs/index
Update a job in Elasticsearch index.

**Request:**
```json
{ "jobId": "uuid" }
```

**Response:**
```json
{
  "success": true,
  "message": "Job updated successfully"
}
```

### DELETE /api/jobs/index
Remove a job from Elasticsearch index.

**Request:**
```json
{ "jobId": "uuid" }
```

**Response:**
```json
{
  "success": true,
  "message": "Job deleted from index successfully"
}
```

### POST /api/jobs/search
Search for jobs with filters.

**Request:**
```json
{
  "keyword": "React Developer",
  "city": ["Mumbai", "Bangalore"],
  "experience": { "min": 2, "max": 5 },
  "salary": { "min": 500000, "max": 1000000 },
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "uuid",
      "title": "React Developer",
      "company_name": "Tech Corp",
      "score": 2.5,
      "highlights": {
        "title": ["<mark>React</mark> <mark>Developer</mark>"]
      },
      "..."
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### GET /api/jobs/search?keyword=java&field=title
Get autocomplete suggestions.

**Response:**
```json
{
  "success": true,
  "suggestions": [
    { "value": "Java Developer", "id": "uuid" },
    { "value": "JavaScript Developer", "id": "uuid" }
  ]
}
