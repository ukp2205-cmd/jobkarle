# Elasticsearch Quick Start Guide

## Problem Solved
You were getting "require is not defined" errors because `@elastic/elasticsearch` package needs Node.js runtime, not Edge runtime.

## Solution Implemented
1. **Fixed Import**: Changed from `require()` to ES6 `import` statement
2. **Added Node.js Runtime**: Added `export const runtime = 'nodejs'` to API route
3. **Better Error Handling**: Clear messages guide you to set `ELASTIC_URL`

## Setup Steps (3 minutes)

### Step 1: Add Environment Variable
Add this to your Vercel project (Vars section in sidebar):
```
ELASTIC_URL=http://localhost:9200
```

**Important:** After adding the environment variable, **redeploy your app** for changes to take effect.

### Step 2: Setup Elasticsearch Index
Run these commands in order:
```bash
npm run setup-elastic    # Creates job_postings index
npm run reindex-jobs     # Imports existing jobs
```

### Step 3: Test Search
1. Open your homepage
2. Search for "developer" or any job title  
3. Results should now come from Elasticsearch with better relevance

## How It Works Now

```
User Search → Home Component → Elasticsearch Action → API Route (Node.js) → Elasticsearch Client → Elasticsearch Server
                                                          ↓
                                                   Returns ranked results
```

**Key Features:**
- **Title Boost (3x)**: Jobs with "developer" in title rank higher
- **Skills Boost (2x)**: Jobs requiring specific skills rank second  
- **Fuzzy Matching**: Handles typos automatically
- **Multi-field Search**: Searches title, skills, company, description

## Troubleshooting

### "ELASTIC_URL not set"
- Add `ELASTIC_URL=http://localhost:9200` to Vercel environment variables
- Redeploy your app after adding

### "Cannot connect to Elasticsearch"
- Make sure Elasticsearch is running: `curl http://localhost:9200`
- Check if port 9200 is accessible

### No search results
- Run `npm run reindex-jobs` to import jobs
- Check if jobs exist in Supabase with `status = 'published'`

## Testing the Fix

1. Check health: Visit `/api/jobs/search/health`
2. Search works: Homepage search returns results
3. Relevance works: "developer" search shows developer jobs first, not "Underwriter"

## What Changed

**Before:**
- Used `require()` → Failed in Next.js
- Edge runtime → Incompatible with Elasticsearch package
- Irrelevant results → "Underwriter" for "develop" search

**After:**  
- ES6 `import` → Works in Next.js
- Node.js runtime → Compatible with Elasticsearch
- Relevant results → Developer jobs ranked by title/skills match
