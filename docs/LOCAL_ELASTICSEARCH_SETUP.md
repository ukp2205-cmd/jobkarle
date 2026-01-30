# Local Elasticsearch Setup & Testing Guide

This guide will help you set up and test Elasticsearch locally with your JobKarle application.

## Step 1: Set Environment Variables

Add this single variable to your Vercel project (or local .env file):

\`\`\`env
ELASTIC_URL=http://localhost:9200
\`\`\`

**Note:** For local Elasticsearch (free version), you don't need `ELASTIC_USERNAME` or `ELASTIC_PASSWORD`. Authentication is optional and only used if credentials are provided.

## Step 2: Verify Elasticsearch is Running

Open your browser or terminal and test:

\`\`\`bash
curl http://localhost:9200
\`\`\`

You should see something like:
\`\`\`json
{
  "name" : "node-1",
  "cluster_name" : "elasticsearch",
  "version" : {
    "number" : "8.x.x"
  }
}
\`\`\`

## Step 3: Create the Jobs Index

Run the setup script to create the index with proper mappings:

\`\`\`bash
npm run setup-elastic
\`\`\`

Expected output:
\`\`\`
[v0] Creating Elasticsearch index: jobs
[v0] Index created successfully with mappings
\`\`\`

## Step 4: Index Existing Jobs

Bulk import all existing jobs from Supabase:

\`\`\`bash
npm run reindex-jobs
\`\`\`

Expected output:
\`\`\`
[v0] Reindexing jobs from Supabase...
[v0] Found 150 active jobs
[v0] Successfully indexed 150 jobs to Elasticsearch
\`\`\`

## Step 5: Test the Search

### Option A: Test via UI

1. Go to your homepage at http://localhost:3000
2. Use the search bar to search for jobs:
   - Try: "Software Engineer"
   - Try: "React Developer"
   - Try: "Bangalore"

### Option B: Test via API

**Test basic search:**
\`\`\`bash
curl "http://localhost:3000/api/jobs/search?keyword=developer&page=1&limit=10"
\`\`\`

**Test with filters:**
\`\`\`bash
curl -X POST "http://localhost:3000/api/jobs/search" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "engineer",
    "city": ["Bangalore", "Mumbai"],
    "experience": {"min": 2, "max": 5},
    "page": 1,
    "limit": 20
  }'
\`\`\`

**Test autocomplete:**
\`\`\`bash
curl "http://localhost:3000/api/jobs/search?autocomplete=soft&field=title"
\`\`\`

### Option C: Test via Browser Console

Open your browser console on the homepage and run:

\`\`\`javascript
// Test search
fetch('/api/jobs/search?keyword=developer&page=1&limit=5')
  .then(r => r.json())
  .then(data => console.log('Search Results:', data))

// Test autocomplete
fetch('/api/jobs/search?autocomplete=soft&field=title')
  .then(r => r.json())
  .then(data => console.log('Suggestions:', data))
\`\`\`

## Step 6: Test Automatic Indexing

1. **Post a new job** through your employer dashboard
2. **Immediately search** for that job by title
3. **Verify it appears** in the search results

If it appears, automatic indexing is working!

## Step 7: Verify Index Contents

Check what's in your Elasticsearch index:

\`\`\`bash
# Count documents
curl "http://localhost:9200/jobs/_count"

# Get sample documents
curl "http://localhost:9200/jobs/_search?size=3&pretty"

# Search directly in Elasticsearch
curl "http://localhost:9200/jobs/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "title": "developer"
      }
    }
  }'
\`\`\`

## Troubleshooting

### Error: "Cannot connect to Elasticsearch"

**Check if Elasticsearch is running:**
\`\`\`bash
curl http://localhost:9200
\`\`\`

If not running, start Elasticsearch. Installation varies by OS:
- **Windows**: Run `elasticsearch.bat` from the bin folder
- **Mac/Linux**: Run `./bin/elasticsearch`
- **Docker**: `docker run -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.11.0`

### Error: "Index not found"

Run the setup script again:
\`\`\`bash
npm run setup-elastic
\`\`\`

### No search results

1. **Check if jobs exist in Supabase:**
\`\`\`sql
SELECT COUNT(*) FROM job_postings WHERE status = 'active';
\`\`\`

2. **Check if jobs are in Elasticsearch:**
\`\`\`bash
curl "http://localhost:9200/jobs/_count"
\`\`\`

3. **If count is 0, reindex:**
\`\`\`bash
npm run reindex-jobs
\`\`\`

### Jobs not auto-indexing

Check the console logs when posting a job. You should see:
\`\`\`
[v0] Indexing job to Elasticsearch: {job_id}
[v0] Job indexed successfully
\`\`\`

If you see errors, verify:
- `ELASTIC_URL` environment variable is set
- Elasticsearch is running
- Index exists (run setup script)

## Quick Test Checklist

- [ ] Environment variable `ELASTIC_URL` is set
- [ ] Elasticsearch is running on port 9200
- [ ] Index created successfully (`npm run setup-elastic`)
- [ ] Existing jobs indexed (`npm run reindex-jobs`)
- [ ] Search works via UI/API
- [ ] New job posts appear in search immediately
- [ ] Filters work (location, experience, salary)

## Next Steps

Once everything is working locally:

1. **Deploy to production** with a managed Elasticsearch service (Elastic Cloud, AWS OpenSearch)
2. **Add monitoring** to track search performance and indexing failures
3. **Implement analytics** to see popular searches and improve results
4. **Add more features** like saved searches, job alerts, and advanced filters

## Support

If you encounter issues:
1. Check the console logs for `[v0]` prefixed messages
2. Verify Elasticsearch logs for errors
3. Test the connection with the simple curl commands above
