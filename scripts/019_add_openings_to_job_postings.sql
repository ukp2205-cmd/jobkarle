-- Add openings column to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS openings integer;

-- Add a comment to describe the column
COMMENT ON COLUMN job_postings.openings IS 'Number of positions/vacancies available for this job posting';
