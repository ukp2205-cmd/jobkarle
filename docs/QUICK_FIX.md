# Quick Fix for Elasticsearch

## The Problem
```
[v0] ✗ Elasticsearch client not initialized - missing ELASTIC_URL
```

## The Solution (2 Steps)

### 1. Add Environment Variable in Vercel

**In v0 Chat Interface:**
- Open the **Vars** section (left sidebar)
- Add new variable:
  - **Name:** `ELASTIC_URL`
  - **Value:** `http://localhost:9200`
- Click Save

### 2. Redeploy Your App

After adding the environment variable, your app needs to be redeployed for the change to take effect.

**That's it!** The integration is already fully implemented - it just needs the configuration.

## What Will Change

**Before (current):**
```
Search: "develop"
Results: Underwriter (because "develop" appears in description)
```

**After:**
```
Search: "develop"
Results: 
1. Senior Developer (title match - 3x boost)
2. Frontend Developer (title match - 3x boost)  
3. Backend Developer (title match - 3x boost)
```

Relevance ranking ensures actual developer jobs appear first.

## Verify It's Working

After setup, check the console logs when searching:
```
✓ Should see: [v0] ✓ Elasticsearch search successful
✗ Currently seeing: [v0] ⚠️ Elasticsearch unavailable, falling back to Supabase
