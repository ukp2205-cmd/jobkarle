-- Update candidates table to support multiple employment entries
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS employment_history JSONB DEFAULT '[]'::jsonb;

-- Create index for employment history JSONB
CREATE INDEX IF NOT EXISTS idx_candidates_employment_history ON candidates USING GIN (employment_history);

-- Update existing records to migrate single employment to array format
UPDATE candidates
SET employment_history = jsonb_build_array(
  jsonb_build_object(
    'currentlyEmployed', currently_employed,
    'companyName', company_name,
    'currentJobTitle', current_job_title,
    'currentCity', current_city,
    'currentState', current_state,
    'durationFrom', duration_from,
    'durationTo', duration_to,
    'annualSalary', annual_salary,
    'noticePeriod', notice_period
  )
)
WHERE company_name IS NOT NULL AND employment_history = '[]'::jsonb;
