-- Add diversity_hiring column to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS diversity_hiring VARCHAR(50) DEFAULT 'open-to-all';

-- Add comment to explain the column
COMMENT ON COLUMN job_postings.diversity_hiring IS 'Diversity hiring preference: open-to-all, women-only, pwd-friendly, lgbtq-friendly, veterans-preferred, senior-citizens';
