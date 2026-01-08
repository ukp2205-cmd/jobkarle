-- Add viewed_by_employer column to job_applications table
-- This column tracks whether the employer has viewed each application

ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS viewed_by_employer BOOLEAN DEFAULT false;

-- Create index for better query performance when filtering by viewed status
CREATE INDEX IF NOT EXISTS idx_job_applications_viewed_by_employer 
ON job_applications(viewed_by_employer);

-- Add comment for documentation
COMMENT ON COLUMN job_applications.viewed_by_employer IS 'Flag to track whether the employer has viewed this application';
