# Storage Setup Instructions

The SQL script for creating storage buckets requires special permissions. Instead, please create the storage bucket manually through the Supabase Dashboard:

## Option 1: Manual Setup (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mxituunnxqkarqivusil
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `resume_storage`
   - **Public bucket**: Toggle ON (so resume URLs are publicly accessible)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: 
     - application/pdf
     - application/msword
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - application/rtf
5. Click **Create bucket**

## Option 2: Programmatic Setup

Run the setup script once:

\`\`\`bash
npm run setup-storage
\`\`\`

This will create the bucket using the Supabase JavaScript SDK.

## Storage Policies (Applied Automatically)

The following RLS policies will be automatically applied when you create a public bucket:

- **Public read access**: Anyone can download resumes via the public URL
- **Authenticated upload**: Users can upload files during registration
- **Owner update/delete**: Users can update/delete their own files

## Verification

After setup, you should see the `resume_storage` bucket in your Storage section, and the resume upload feature will work correctly in the candidate registration form.
