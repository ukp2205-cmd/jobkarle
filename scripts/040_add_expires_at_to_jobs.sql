-- Add expires_at column to job_postings table for tracking job validity
ALTER TABLE job_postings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Set expires_at for existing active jobs to 30 days from now
UPDATE job_postings
SET expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
WHERE status = 'published' AND expires_at IS NULL;

-- Create index for efficient querying of expired jobs
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at 
ON job_postings(expires_at) WHERE expires_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN job_postings.expires_at IS 'Job posting expiry date, set to 30 days from posting/reposting';
