-- Add hiring_for_type column to track if posting is for own company or client
ALTER TABLE job_postings
ADD COLUMN IF NOT EXISTS hiring_for_type VARCHAR(50) DEFAULT 'own_company'; -- 'own_company' or 'client'

-- Add hiring_for_company_name for when employer is hiring for a client
ALTER TABLE job_postings
ADD COLUMN IF NOT EXISTS hiring_for_company_name VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN job_postings.hiring_for_type IS 'Indicates if employer is hiring for their own company or for a client';
COMMENT ON COLUMN job_postings.hiring_for_company_name IS 'Company name when hiring for client (manpower consultant/staffing company)';
