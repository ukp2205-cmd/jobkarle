-- Add profile_picture_url column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN candidates.profile_picture_url IS 'URL to the candidate profile picture stored in Vercel Blob storage';
