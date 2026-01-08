-- Add cv_score column to job_applications table
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS cv_score DECIMAL(3,1) DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_applications_cv_score ON job_applications(cv_score DESC);

-- Add comment
COMMENT ON COLUMN job_applications.cv_score IS 'CV match score from 0-10 based on skills, location, experience, etc.';
