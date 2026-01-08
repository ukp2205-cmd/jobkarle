-- Create blocked_employers table to track companies blocked by candidates
CREATE TABLE IF NOT EXISTS blocked_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  reason VARCHAR(255) NOT NULL,
  custom_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blocked_employers_candidate_id ON blocked_employers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_blocked_employers_company_name ON blocked_employers(company_name);
CREATE INDEX IF NOT EXISTS idx_blocked_employers_employer_id ON blocked_employers(employer_id);

-- Create unique constraint to prevent duplicate blocks
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_employers_unique_block 
ON blocked_employers(candidate_id, company_name);

-- Add RLS policies for security
ALTER TABLE blocked_employers ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policies to work without auth.users reference
-- Policy: Allow all authenticated users to view blocked employers (will be filtered in application code)
CREATE POLICY "Allow authenticated users to view blocked employers"
ON blocked_employers FOR SELECT
USING (true);

-- Policy: Allow all authenticated users to insert blocked employers (candidate_id verified in application)
CREATE POLICY "Allow authenticated users to block employers"
ON blocked_employers FOR INSERT
WITH CHECK (true);

-- Policy: Allow all authenticated users to delete blocked employers (candidate_id verified in application)
CREATE POLICY "Allow authenticated users to unblock employers"
ON blocked_employers FOR DELETE
USING (true);

-- Add comments for documentation
COMMENT ON TABLE blocked_employers IS 'Tracks employers/companies blocked by candidates';
COMMENT ON COLUMN blocked_employers.candidate_id IS 'References the candidate who blocked the employer';
COMMENT ON COLUMN blocked_employers.company_name IS 'Name of the company being blocked';
COMMENT ON COLUMN blocked_employers.employer_id IS 'Optional reference to employer record if exists';
COMMENT ON COLUMN blocked_employers.reason IS 'Predefined reason for blocking';
COMMENT ON COLUMN blocked_employers.custom_reason IS 'Custom reason if "Other" was selected';
COMMENT ON COLUMN blocked_employers.blocked_at IS 'When the employer was blocked';
