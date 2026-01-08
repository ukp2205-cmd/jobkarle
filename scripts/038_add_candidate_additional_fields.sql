-- Add new fields to candidates table

-- Date of birth
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Languages known with proficiency levels (read/write/speak)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS languages_known JSONB DEFAULT '[]'::jsonb;
-- Example structure: [{"language":"English","read":true,"write":true,"speak":true}]

-- Certifications list
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
-- Example structure: [{"name":"AWS Certified","issuer":"AWS","issueDate":"2023-01","expiryDate":"2025-01"}]

-- Marital status
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50) 
  CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'));

-- Create indexes for new JSONB fields
CREATE INDEX IF NOT EXISTS idx_candidates_languages ON candidates USING GIN (languages_known);
CREATE INDEX IF NOT EXISTS idx_candidates_certifications ON candidates USING GIN (certifications);

-- Add comment to describe the structure
COMMENT ON COLUMN candidates.languages_known IS 'Array of objects: [{"language":"English","read":true,"write":true,"speak":true}]';
COMMENT ON COLUMN candidates.certifications IS 'Array of objects: [{"name":"AWS Certified","issuer":"AWS","issueDate":"2023-01","expiryDate":"2025-01"}]';
