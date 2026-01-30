# Google OAuth Direct Implementation Setup

This project uses **direct Google OAuth 2.0** (not Supabase Auth) for candidate login.

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project or create a new one
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. Choose **"Web application"**
5. Configure:
   - **Name**: JobKarle Candidate Login
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback/google` (development)
     - `https://your-production-domain.com/auth/callback/google` (production)

### 2. Get Your Credentials

After creating, you'll see:
- **Client ID**: `92551279196-1988194felgep14d3t7p4ahhsdlm9rg5.apps.googleusercontent.com` (already configured)
- **Client Secret**: Copy this value

### 3. Add Environment Variable

Add to your `.env.local` or Vercel environment variables:

```
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production:
```
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

## How It Works

1. **User clicks "Continue with Google"**
   - Browser redirects to Google OAuth consent screen
   - Google OAuth URL: `https://accounts.google.com/o/oauth2/v2/auth`

2. **User authorizes the app**
   - Google redirects back to: `/auth/callback/google?code=...`

3. **Backend exchanges code for tokens**
   - Calls Google's token endpoint
   - Gets user info (email, name, picture)

4. **Creates or logs in candidate**
   - Checks if email exists in `candidates` table
   - Creates new account if needed
   - Sets session cookie

5. **Redirects to appropriate page**
   - New users: `/register?step=2` (complete registration)
   - Existing users: `/candidate/dashboard`

## Testing

1. Click "Continue with Google" on `/candidate/login`
2. Choose your Google account
3. Grant permissions
4. You should be redirected to dashboard or registration

## Security

- Uses `state` parameter for CSRF protection
- Session stored in HTTP-only secure cookies
- Client secret never exposed to frontend
- Access token only used server-side

## Troubleshooting

**"redirect_uri_mismatch"**
- Make sure redirect URI in Google Console matches exactly: `http://localhost:3000/auth/callback/google`

**"invalid_client"**
- Check that Client ID and Client Secret are correct in environment variables

**"access_denied"**
- User canceled the OAuth flow - this is normal
