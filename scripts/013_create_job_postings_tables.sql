-- This script creates the job_applications table which is required for candidates to apply to jobs
-- Run this script to enable the job application functionality

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  -- Application Details
  screening_answers JSONB, -- Answers to screening questions from the job posting
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'applied', -- applied, shortlisted, rejected, hired
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate applications
  UNIQUE(job_id, candidate_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_applications

-- Allow candidates to create their own applications
CREATE POLICY "Candidates can create applications"
  ON job_applications FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow candidates to view their own applications
CREATE POLICY "Candidates can view their applications"
  ON job_applications FOR SELECT
  TO public
  USING (true);

-- Allow employers to view applications for their job postings
CREATE POLICY "Employers can view applications for their jobs"
  ON job_applications FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE job_postings.id = job_applications.job_id
    )
  );

-- Allow employers to update application status (shortlist/reject)
CREATE POLICY "Employers can update application status"
  ON job_applications FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE job_postings.id = job_applications.job_id
    )
  );
