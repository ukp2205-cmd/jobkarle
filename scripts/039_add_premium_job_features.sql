-- Add premium job features to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS urgent_hiring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Create index for premium and urgent hiring jobs
CREATE INDEX IF NOT EXISTS idx_job_postings_premium_urgent 
ON job_postings(category, urgent_hiring, created_at DESC);

-- Update existing premium jobs to have urgent_hiring enabled by default
UPDATE job_postings 
SET urgent_hiring = TRUE 
WHERE category = 'premium' AND urgent_hiring IS NULL;

COMMENT ON COLUMN job_postings.urgent_hiring IS 'Flag to show urgent hiring badge on premium jobs';
COMMENT ON COLUMN job_postings.company_logo_url IS 'URL to company logo, falls back to JobKarle logo if null';
