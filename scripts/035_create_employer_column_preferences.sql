-- Create table to store employer's column preferences for job responses
CREATE TABLE IF NOT EXISTS employer_column_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  -- Changed column_order to preferences to match the action file
  preferences JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employer_id, job_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employer_column_preferences_employer_job 
ON employer_column_preferences(employer_id, job_id);

-- Enable RLS
ALTER TABLE employer_column_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Employers can only read/write their own preferences
CREATE POLICY employer_column_preferences_policy ON employer_column_preferences
  FOR ALL
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());
