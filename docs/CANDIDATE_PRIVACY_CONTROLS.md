# Candidate Privacy Controls - Implementation Guide

## Overview
The candidate privacy controls feature provides comprehensive privacy management for candidates, including profile visibility settings, company blocking, and profile deactivation capabilities.

## Features Implemented

### 1. Profile Visibility Control
Candidates can choose from three visibility modes:

- **Public**: Profile visible to all employers in search results and job recommendations
- **Hidden**: Profile not visible in employer searches, but candidates can still apply to jobs
- **Private**: Profile only visible to employers for jobs the candidate has applied to

**Implementation:**
- Database column: `profile_visibility` (VARCHAR with CHECK constraint)
- Default: `'public'`
- Updates in real-time via `updateProfileVisibility()` server action
- UI: Radio button selection with descriptions
- Employer search filters out non-public profiles automatically

### 2. Block Companies
Candidates can search for and block specific companies from viewing their profile and seeing their job applications.

**Features:**
- Dynamic company search from `job_postings` table (searches actual posted companies)
- Real-time search with debouncing (300ms delay)
- Add companies to block list with reason selection
- 7 predefined reasons + custom "Other" option with text input
- View all blocked companies with reasons and timestamps
- Unblock companies easily
- Jobs from blocked companies automatically filtered out

**Implementation:**
- Database table: `blocked_employers` (separate table for better scalability)
- Columns:
  - `id` (UUID, primary key)
  - `candidate_id` (UUID, references candidates)
  - `company_name` (VARCHAR, the blocked company name)
  - `employer_id` (UUID, optional reference to employers table)
  - `reason` (VARCHAR, predefined reason)
  - `custom_reason` (TEXT, if reason is "Other")
  - `blocked_at` (TIMESTAMP)
- Server actions:
  - `searchCompanies(query)` - Search companies from job_postings table
  - `blockCompany(candidateId, companyName, reason, customReason?)` - Add to block list
  - `unblockCompany(candidateId, companyName)` - Remove from block list
- Job filtering in both recommendations and search results

**Blocking Reasons:**
1. Poor work culture
2. Low compensation
3. Bad interview experience
4. Unprofessional communication
5. Previously worked there
6. Not interested in company
7. Other (with custom text input)

### 3. Profile Deactivation
Candidates can temporarily deactivate their profile with optional reason.

**When deactivated:**
- Profile hidden from all employers
- No job recommendations received
- Employers cannot contact the candidate
- Can reactivate anytime by returning to settings

**Implementation:**
- Database columns:
  - `is_profile_active` (BOOLEAN, default: true)
  - `deactivated_at` (TIMESTAMP WITH TIME ZONE)
  - `deactivation_reason` (TEXT, optional)
- Server actions:
  - `deactivateProfile(candidateId, reason?)` - Deactivate with optional reason
  - `reactivateProfile(candidateId)` - Reactivate and clear deactivation data
- Confirmation dialog before deactivation
- Visual warning banner when profile is deactivated

## Database Schema

```sql
-- Migration script: scripts/030_add_candidate_privacy_controls.sql
-- Adds privacy columns to candidates table

ALTER TABLE candidates
ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'public' 
  CHECK (profile_visibility IN ('public', 'hidden', 'private')),
ADD COLUMN is_profile_active BOOLEAN DEFAULT true,
ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deactivation_reason TEXT;

CREATE INDEX idx_candidates_profile_visibility ON candidates(profile_visibility);
CREATE INDEX idx_candidates_is_active ON candidates(is_profile_active);
```

```sql
-- Migration script: scripts/031_create_blocked_employers_table.sql
-- Creates separate table for blocked employers

CREATE TABLE blocked_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  reason VARCHAR(255) NOT NULL,
  custom_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_blocked_employers_candidate_id ON blocked_employers(candidate_id);
CREATE INDEX idx_blocked_employers_company_name ON blocked_employers(company_name);
CREATE UNIQUE INDEX idx_blocked_employers_unique_block 
  ON blocked_employers(candidate_id, company_name);

-- RLS Policies
ALTER TABLE blocked_employers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own blocked employers"
ON blocked_employers FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM candidates WHERE id = candidate_id));

CREATE POLICY "Candidates can block employers"
ON blocked_employers FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM candidates WHERE id = candidate_id));

CREATE POLICY "Candidates can unblock employers"
ON blocked_employers FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM candidates WHERE id = candidate_id));
```

## File Structure

```
app/
  candidate/
    settings/
      page.tsx                          # Settings page route (server component)
  actions/
    candidate-privacy-actions.ts        # All privacy-related server actions
    candidate-dashboard-actions.ts      # Job recommendations (filters blocked companies)
    candidate-search-actions.ts         # Job search (filters blocked companies)

components/
  candidate-settings-view.tsx           # Main settings UI component (client component)
  candidate-dashboard.tsx               # Dashboard with Settings icon dropdown

scripts/
  030_add_candidate_privacy_controls.sql   # Adds privacy columns to candidates
  031_create_blocked_employers_table.sql   # Creates blocked_employers table
```

## User Flow

### Accessing Settings
1. Candidate logs in
2. Goes to dashboard (`/candidate/dashboard`)
3. Clicks Settings icon (⚙️) next to profile avatar
4. Dropdown menu appears with three options:
   - Profile Visibility
   - Blocked Companies
   - Deactivate Profile
5. Click any option to open corresponding dialog/modal

### Changing Visibility
1. Click "Profile Visibility" from settings dropdown
2. Dialog opens with current selection
3. Select desired visibility mode (Public/Hidden/Private)
4. Click "Save Changes"
5. Setting updates immediately in database
6. Success toast notification displayed

### Blocking Companies
1. Click "Blocked Companies" from settings dropdown
2. Dialog opens with search interface
3. Type company name in search box
4. Matching companies appear below (auto-search after 300ms)
5. Click "Block" next to desired company
6. Reason selection dialog appears
7. Choose reason from dropdown (or select "Other" and type custom reason)
8. Click "Block Company" to confirm
9. Company added to blocked list with reason and timestamp
10. Jobs from that company no longer appear in recommendations or search

### Viewing Blocked Companies
1. Open "Blocked Companies" dialog
2. Scroll down to see list of blocked companies
3. Each entry shows:
   - Company name
   - Reason for blocking
   - Date blocked
   - "Unblock" button

### Unblocking Companies
1. View blocked companies list in dialog
2. Click "Unblock" next to company name
3. Company removed from blocked list immediately
4. Success toast notification
5. Jobs from that company will now appear in search/recommendations

### Deactivating Profile
1. Click "Deactivate Profile" from settings dropdown
2. Dialog opens with deactivation form
3. Optionally enter reason for deactivation
4. Click "Deactivate Profile" button
5. Confirmation dialog appears
6. Click "Yes, Deactivate"
7. Profile deactivated and redirected to login

### Reactivating Profile
1. Login with deactivated account
2. Dashboard shows deactivation warning banner at top
3. Click "Reactivate Profile" button in banner
4. Profile reactivated immediately
5. Success toast notification
6. Banner disappears and full functionality restored

## Server Actions

### `getCandidatePrivacySettings(candidateId)`
Fetches all privacy settings and blocked employers for a candidate.

**Returns:**
```typescript
{
  success: boolean
  data?: {
    settings: {
      profile_visibility: 'public' | 'hidden' | 'private'
      is_profile_active: boolean
      deactivated_at: string | null
      deactivation_reason: string | null
    }
    blockedCompanies: Array<{
      id: string
      candidate_id: string
      company_name: string
      reason: string
      custom_reason?: string
      blocked_at: string
    }>
  }
}
```

### `updateProfileVisibility(candidateId, visibility)`
Updates the profile visibility setting.

### `searchCompanies(query)`
Searches companies from job_postings table by company name (case-insensitive, partial match).

**Returns:** Up to 50 unique companies with company_name and employer_id

### `blockCompany(candidateId, companyName, reason, customReason?)`
Adds a company to the candidate's blocked list with reason.

### `unblockCompany(candidateId, companyName)`
Removes a company from the candidate's blocked list.

### `deactivateProfile(candidateId, reason?)`
Deactivates the candidate profile with optional reason.

### `reactivateProfile(candidateId)`
Reactivates a deactivated profile and clears deactivation data.

## Job Filtering Implementation

Blocked companies are automatically filtered out in two places:

### 1. Job Recommendations (`getRecommendedJobs`)
```typescript
// Fetch blocked companies
const { data: blockedEmployers } = await supabase
  .from("blocked_employers")
  .select("company_name")
  .eq("candidate_id", candidateId)

// Filter out blocked companies
const blockedCompanyNames = blockedEmployers.map(b => b.company_name.toLowerCase())
const matchedJobs = jobs.filter(job => {
  const jobCompanyName = job.company_name?.toLowerCase()
  return !blockedCompanyNames.includes(jobCompanyName)
})
```

### 2. Job Search (`searchJobs`)
```typescript
// Same filtering logic applied to search results
if (candidateId) {
  const { data: blockedEmployers } = await supabase
    .from("blocked_employers")
    .select("company_name")
    .eq("candidate_id", candidateId)
  
  // Filter jobs before returning results
}
```

## Security Considerations

1. **Authentication Required**: All settings pages check for valid candidate session
2. **User-Specific Actions**: All server actions require candidateId parameter
3. **Row Level Security**: Supabase RLS policies on blocked_employers table
4. **Unique Constraints**: Prevents duplicate blocks (candidate_id + company_name)
5. **Cascade Deletion**: Blocked employers deleted when candidate is deleted
6. **Input Validation**: All user inputs validated before database operations
7. **Error Handling**: Comprehensive error handling with user-friendly messages

## UI/UX Features

- **Mobile Responsive**: All dialogs and components fully responsive
- **Inline Settings**: Settings accessed via dropdown, not separate page
- **Loading States**: Visual feedback during async operations
- **Success Toasts**: Confirmation messages for all actions
- **Error Handling**: User-friendly error messages
- **Confirmation Dialogs**: Important actions (deactivation, blocking) require confirmation
- **Visual Indicators**: Icons and colors for different states
- **Disabled States**: UI disabled when profile is deactivated
- **Real-time Updates**: Settings update immediately without page refresh
- **Auto-search**: Company search auto-triggers after 300ms of typing
- **Reason Required**: Cannot block without selecting a reason

## Testing Checklist

- [x] Run database migration scripts (030 and 031)
- [x] Login as candidate
- [x] Access settings from dashboard settings icon
- [x] Change visibility and verify database update
- [x] Search for companies and verify results from job_postings
- [x] Block a company with predefined reason
- [x] Block a company with "Other" reason and custom text
- [x] Verify blocked company appears in list with reason
- [x] Unblock a company and verify it's removed
- [x] Verify jobs from blocked companies don't appear in recommendations
- [x] Verify jobs from blocked companies don't appear in search
- [x] Deactivate profile and verify all features disabled
- [x] Reactivate profile and verify functionality restored
- [x] Test mobile responsiveness on all dialogs
- [x] Verify success toasts appear and disappear
- [x] Test with invalid data to verify error handling
- [x] Test RLS policies work correctly

## Database Migration Order

1. First run `030_add_candidate_privacy_controls.sql` to add columns to candidates table
2. Then run `031_create_blocked_employers_table.sql` to create the blocked_employers table

## Future Enhancements

1. **Analytics Dashboard**: Show candidates stats on blocked companies and profile views
2. **Block by Industry**: Allow blocking entire industries or company types
3. **Temporary Blocks**: Option to block companies for a specific time period
4. **Block Notifications**: Notify when a blocked company tries to view profile
5. **Export Data**: Allow candidates to export their privacy settings and blocked list
6. **Privacy Score**: Show privacy score based on settings configuration
7. **Smart Suggestions**: Suggest companies to block based on bad reviews or patterns
8. **Bulk Operations**: Block multiple companies at once
9. **Block Categories**: Organize blocked companies by reason categories
10. **Whitelist Feature**: Allow specific companies even if they match block criteria

## Support

If candidates face issues:
1. Check both migration scripts were run successfully
2. Verify Supabase connection is active
3. Check browser console for error messages
4. Verify candidate session is valid
5. Check RLS policies on candidates and blocked_employers tables
6. Verify job_postings table has data for company search

For additional support, direct users to: vercel.com/help
