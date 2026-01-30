# Elasticsearch Connection Guide

## Current Issue

You're seeing "Failed to fetch" error because `ELASTIC_URL=http://localhost:9200` only works when Elasticsearch is running locally on the same machine.

## Why This Happens

- **Vercel Deployment**: Your app runs in Vercel's cloud, not on your local machine
- **localhost**: The `localhost` URL refers to Vercel's server, not your local Elasticsearch
- **Result**: Vercel cannot reach your local Elasticsearch instance

## Solutions

### Option 1: Local Development Only (Recommended for Testing)

Use Elasticsearch only when running locally:

1. **Start Elasticsearch locally:**
   \`\`\`bash
   # If using Docker:
   docker run -d -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0
   
   # Or if installed directly:
   elasticsearch
   \`\`\`

2. **Run Next.js locally:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Access at:** `http://localhost:3000`

Now Elasticsearch will work because both are on the same machine.

### Option 2: Cloud Elasticsearch (Production)

For production deployment on Vercel, use a cloud Elasticsearch service:

#### A. Elastic Cloud (Official, Free Trial)

1. Go to https://cloud.elastic.co
2. Create free trial account
3. Create deployment
4. Get the Cloud ID and create API key
5. Update Vercel environment variables:
   \`\`\`
   ELASTIC_URL=https://your-deployment.es.us-central1.gcp.cloud.es.io:9243
   \`\`\`

#### B. AWS OpenSearch

1. Create OpenSearch cluster in AWS
2. Get the endpoint URL
3. Set ELASTIC_URL in Vercel

#### C. Bonsai.io (Simple, Free tier)

1. Go to https://bonsai.io
2. Create free Elasticsearch cluster
3. Get the URL with credentials
4. Set in Vercel

### Option 3: Disable Elasticsearch (Quick Fix)

If you don't need Elasticsearch right now:

1. Remove ELASTIC_URL from Vercel environment variables
2. The app will automatically fall back to Supabase search
3. You'll still get search results, just without advanced relevance ranking

## Checking Connection

Use the health check endpoint:
\`\`\`
https://your-app.vercel.app/api/jobs/search/health
\`\`\`

This will show:
- Whether ELASTIC_URL is set
- Whether connection succeeds
- Detailed error messages if it fails

## Current Behavior

With the fallback system:
- ✅ App continues working with Supabase search
- ⚠️ Logs show Elasticsearch connection failure
- ℹ️ Search results have lower relevance ranking

Choose the option that fits your use case!
