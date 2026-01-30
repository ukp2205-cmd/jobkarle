-- Create employer_searches table for storing recent and saved searches
CREATE TABLE IF NOT EXISTS employer_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  search_name TEXT,
  keywords TEXT,
  filters JSONB,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employer_searches_employer_id ON employer_searches(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_searches_is_saved ON employer_searches(is_saved);
CREATE INDEX IF NOT EXISTS idx_employer_searches_created_at ON employer_searches(created_at DESC);

-- Add RLS policies
ALTER TABLE employer_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view their own searches"
  ON employer_searches FOR SELECT
  USING (employer_id = auth.uid()::uuid);

CREATE POLICY "Employers can insert their own searches"
  ON employer_searches FOR INSERT
  WITH CHECK (employer_id = auth.uid()::uuid);

CREATE POLICY "Employers can delete their own searches"
  ON employer_searches FOR DELETE
  USING (employer_id = auth.uid()::uuid);
