-- Add resume_url column to job_applications table
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Add comment
COMMENT ON COLUMN job_applications.resume_url IS 'URL to the candidate resume at time of application';
