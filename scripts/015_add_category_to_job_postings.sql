-- Add category column to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'classified' CHECK (category IN ('classified', 'premium'));

-- Update existing records to have 'classified' category
UPDATE job_postings 
SET category = 'classified' 
WHERE category IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_category ON job_postings(category);
