# Custom Authentication System for Employers

## Overview

The JobKarle platform uses a **custom authentication system** for employers that stores credentials directly in the `employers` table, without using Supabase Auth's `auth.users` table.

## Architecture

### Database Structure

**employers table:**
- `id` (uuid) - Primary key
- `email` (varchar) - Unique email address
- `password_hash` (text) - Bcrypt hashed password
- `mobile_number` (varchar) - Unique mobile number
- `otp_verified` (boolean) - Whether OTP verification is complete
- Additional employer profile fields...

### Authentication Flow

#### Registration Process

1. **Step 1: Basic Info**
   - User enters username, email, password, contact info, company details
   - `createInitialEmployer()` action:
     - Hashes password with bcrypt
     - Creates record in `employers` table
     - Sets `otp_verified = false`

2. **Step 2: OTP Verification**
   - System sends OTP to mobile number
   - User enters 6-digit OTP
   - On successful verification:
     - Sets `otp_verified = true` in employers table
     - Moves to Step 3

3. **Step 3: Complete Profile**
   - User enters additional company details and uploads logo
   - `completeEmployerRegistration()` updates employer record
   - Redirects to login page

#### Login Process

1. **User enters email and password**
2. `loginEmployer()` action:
   - Queries `employers` table by email
   - Verifies `otp_verified = true`
   - Compares password with stored hash using bcrypt
   - On success:
     - Creates session cookie with employer data
     - Returns success with user info

3. **Session Management**
   - Session stored in HTTP-only cookie: `employer_session`
   - Contains: `{ employerId, email, companyName, loginTime }`
   - Expires after 7 days
   - Secure in production, httpOnly to prevent XSS

#### Session Verification

Protected routes use `getEmployerSession()` to verify authentication:

```typescript
const { success, session } = await getEmployerSession()
if (!success || !session) {
  // Redirect to login
}
```

## Key Files

### Actions
- `app/actions/employer-auth-actions.ts` - Login, logout, session management
- `app/actions/employer-actions.ts` - Registration and profile updates

### Components
- `components/employer-login.tsx` - Login UI
- `components/employer-registration.tsx` - Multi-step registration UI

### Pages
- `app/employer/login/page.tsx` - Login page
- `app/employer/register/page.tsx` - Registration page
- `app/employer/post-job/page.tsx` - Protected route (requires session)

## Security Features

1. **Password Hashing**: Bcrypt with salt rounds of 10
2. **HTTP-only Cookies**: Session data not accessible via JavaScript
3. **Secure Cookies**: HTTPS-only in production
4. **OTP Verification**: Mobile number verification required
5. **Session Expiry**: 7-day automatic logout

## Why Not Supabase Auth?

The decision to use custom authentication instead of Supabase Auth was made to:
- Have complete control over the authentication flow
- Simplify the employer registration process
- Store all employer data in a single table
- Avoid complexity of syncing between auth.users and employers tables
- Provide custom session management tailored to employer needs

## Usage Examples

### Login
```typescript
const result = await loginEmployer(email, password)
if (result.success) {
  // Redirect to dashboard
}
```

### Check Session
```typescript
const { success, session } = await getEmployerSession()
if (success && session) {
  console.log("Employer:", session.email)
}
```

### Logout
```typescript
await logoutEmployer()
// Redirect to login
```

## Important Notes

- Employers do NOT exist in `auth.users` table
- All authentication happens against the `employers` table
- Session management uses cookies, not Supabase Auth tokens
- Protected routes must use `getEmployerSession()`, not `supabase.auth.getUser()`
