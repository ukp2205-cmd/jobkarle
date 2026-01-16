# Google OAuth Setup for Candidate Login

## Step 1: Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to configure
5. Enable the Google provider
6. Add your credentials:
   - **Client ID**: `92551279196-1988194felgep14d3t7p4ahhsdlm9rg5.apps.googleusercontent.com`
   - **Client Secret**: (You need to get this from your Google Cloud Console)

## Step 2: Get Google Client Secret (if you don't have it)

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your project (or create one if needed)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one ending in ...apps.googleusercontent.com)
5. Click on it to view details
6. Copy the **Client Secret**
7. Paste it into Supabase (Step 1)

## Step 3: Configure Authorized Redirect URIs in Google Cloud Console

In Google Cloud Console, under your OAuth 2.0 Client:

1. Add these Authorized Redirect URIs:
   ```
   https://mxituunnxqkarqivusil.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback/candidate (for local testing)
   ```

2. Save the changes

## Step 4: Test the Login

1. Go to your candidate login page: `/candidate/login`
2. Click "Continue with Google"
3. You should be redirected to Google's login screen
4. After successful login, you'll be redirected back to your app

## Troubleshooting

If login still doesn't work:

1. Check browser console for errors
2. Verify the callback URL in Supabase matches: `http://localhost:3000/auth/callback/candidate`
3. Make sure both Client ID and Client Secret are correctly entered in Supabase
4. Ensure the redirect URIs in Google Cloud Console match Supabase's callback URL

## Current Status

- ✅ Google OAuth button implemented in candidate login
- ✅ OAuth callback route created at `/auth/callback/candidate`
- ✅ Candidate creation/login logic implemented
- ⏳ **PENDING**: Configure Google provider in Supabase Dashboard (Step 1-3 above)
