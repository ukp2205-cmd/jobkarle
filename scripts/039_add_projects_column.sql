-- Add projects column to candidates table
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_candidates_projects ON candidates USING GIN (projects);

-- Add comment
COMMENT ON COLUMN candidates.projects IS 'Array of project objects with title, description, role, technologies, start_date, end_date, and url';
