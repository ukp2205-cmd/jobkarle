-- Create saved_jobs table for candidates to bookmark jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(job_id, candidate_id) -- One save per candidate per job
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate ON saved_jobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs(job_id);

-- Enable Row Level Security
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Updated RLS policies to work without Supabase authentication (using custom auth with cookies)
CREATE POLICY "Anyone can save jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view saved jobs"
  ON saved_jobs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can remove saved jobs"
  ON saved_jobs FOR DELETE
  USING (true);
