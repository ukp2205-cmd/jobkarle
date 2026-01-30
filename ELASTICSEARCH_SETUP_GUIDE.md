# Elasticsearch Setup Guide for JobKarle

## Current Status
Your Elasticsearch integration is **fully implemented** but not yet configured. The system is currently using Supabase search as a fallback (which is working correctly).

## Issue Identified
\`\`\`
[v0] ELASTIC_URL from environment: NOT SET
[v0] ✗ Elasticsearch client not initialized - missing ELASTIC_URL
\`\`\`

The `ELASTIC_URL` environment variable is missing from your Vercel project.

## Solution: Add Environment Variable

### Step 1: Add ELASTIC_URL to Vercel

1. **In v0 Interface:**
   - Click the **"Vars"** section in the left sidebar
   - Click **"+ Add Variable"**
   - Add the following:
     \`\`\`
     Key: ELASTIC_URL
     Value: http://localhost:9200
     \`\`\`
   - Click **"Save"**

2. **Or in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to **Environment Variables**
   - Add:
     \`\`\`
     ELASTIC_URL=http://localhost:9200
     \`\`\`
   - Save and redeploy your project

### Step 2: Ensure Elasticsearch is Running Locally

Since you're using the free version at `localhost:9200`, make sure Elasticsearch is running:

\`\`\`bash
# Check if Elasticsearch is running
curl http://localhost:9200

# Expected response:
# {
#   "name" : "...",
#   "cluster_name" : "elasticsearch",
#   "version" : { ... }
# }
\`\`\`

### Step 3: Initialize Elasticsearch Index

Once the environment variable is set and your app is redeployed:

\`\`\`bash
# Create the job_postings index with proper mappings
npm run setup-elastic

# Import all existing jobs from Supabase
npm run reindex-jobs
\`\`\`

### Step 4: Test the Integration

1. **Health Check:**
   Visit: `https://your-app.vercel.app/api/jobs/search/health`
   
   Should return:
   \`\`\`json
   {
     "status": "healthy",
     "elasticsearch": {
       "connected": true,
       "elasticUrl": "http://localhost:9200"
     }
   }
   \`\`\`

2. **Search Test:**
   - Go to your home page
   - Search for "developer"
   - Check console logs - should see:
     \`\`\`
     [v0] ✓ Elasticsearch search successful - Jobs: X
     \`\`\`

## How It Works

### Current Architecture

\`\`\`
User Search → Home Page → Elasticsearch Action → API Route → Elasticsearch
                                                                    ↓
                                                              (if fails)
                                                                    ↓
                                                         Supabase Fallback
\`\`\`

1. **Primary:** Elasticsearch (fast, relevant results with boosting)
2. **Fallback:** Supabase (reliable backup if Elasticsearch is down)

### Relevance Boosting

When Elasticsearch is active, search results are ranked by:
- Title matches: **3x boost** (highest priority)
- Skills matches: **2x boost**
- Company name: **1.5x boost**
- Description: Standard relevance

This means searching for "developer" will show jobs with "Developer" in the title first, even if "Underwriter" mentions "develop" in the description.

## Troubleshooting

### Issue: "Cannot connect to Elasticsearch"
**Solution:** Ensure Elasticsearch is running at `http://localhost:9200`
\`\`\`bash
# Start Elasticsearch (depends on your installation method)
# Using Docker:
docker run -d -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0
\`\`\`

### Issue: "Index not found"
**Solution:** Run the setup script
\`\`\`bash
npm run setup-elastic
\`\`\`

### Issue: "No search results"
**Solution:** Import jobs from Supabase
\`\`\`bash
npm run reindex-jobs
\`\`\`

### Issue: Still seeing fallback message
**Solution:** 
1. Verify `ELASTIC_URL` is set in Vercel
2. Redeploy your app (environment variables require redeployment)
3. Check the health endpoint

## Production Considerations

For production, you should:

1. **Use a managed Elasticsearch service:**
   - Elastic Cloud (free trial available)
   - AWS Elasticsearch Service
   - Bonsai Elasticsearch

2. **Update ELASTIC_URL to production endpoint:**
   \`\`\`
   ELASTIC_URL=https://your-production-elasticsearch.com:9200
   \`\`\`

3. **Add authentication (if required):**
   \`\`\`
   ELASTIC_USERNAME=your_username
   ELASTIC_PASSWORD=your_password
   \`\`\`

## Why Elasticsearch?

Benefits you get once configured:
- **Better relevance:** "develop" search returns developers, not underwriters
- **Faster search:** Optimized for full-text search (vs SQL LIKE queries)
- **Fuzzy matching:** Handles typos automatically ("develper" finds "developer")
- **Scalability:** Handles millions of jobs efficiently
- **Faceted search:** Easy to add filters (location, salary, skills)

## Current Status: Functional Fallback

Your search is currently working via Supabase fallback, which is returning correct results. However, you're missing the enhanced relevance ranking that Elasticsearch provides. Once you add the `ELASTIC_URL` environment variable and complete the setup steps above, you'll get the full benefits of Elasticsearch search.
