-- Create job_postings table with all fields from the job posting form
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
  
  -- Step 1: Basic job details
  company_name VARCHAR(255),
  hide_company_info BOOLEAN DEFAULT FALSE,
  job_title VARCHAR(255) NOT NULL,
  employment_type VARCHAR(100),
  shift VARCHAR(50), -- Day, Night, Flexible
  work_mode VARCHAR(50), -- In office, Hybrid, Remote
  job_locations JSONB DEFAULT '[]'::jsonb, -- Array of locations
  include_relocation BOOLEAN DEFAULT FALSE,
  
  -- Step 2: Preferred candidate details - Experience and qualifications
  min_experience INTEGER,
  max_experience INTEGER,
  required_skills JSONB DEFAULT '[]'::jsonb, -- Array of skill names
  educational_qualifications JSONB DEFAULT '[]'::jsonb, -- Array of qualifications
  candidate_industries JSONB DEFAULT '[]'::jsonb, -- Array of preferred industries
  video_profile_required BOOLEAN DEFAULT FALSE,
  
  -- Step 3: Job description and details
  job_description TEXT, -- Main job description
  candidate_profile_headline TEXT, -- Candidate profile section
  role_description TEXT,
  key_responsibilities TEXT,
  required_qualifications TEXT,
  
  -- Step 3: Perks and benefits
  perks JSONB DEFAULT '[]'::jsonb, -- Array of selected perks
  custom_perks TEXT, -- Additional custom perks text
  
  -- Step 4: Screening questions
  screening_questions JSONB DEFAULT '[]'::jsonb, -- Array of questions
  
  -- Step 5: Advanced options
  is_walk_in BOOLEAN DEFAULT FALSE,
  team_members JSONB DEFAULT '[]'::jsonb, -- Array of team member emails
  email_notification_preference VARCHAR(100),
  reference_code VARCHAR(100), -- Unique reference code for job
  enable_auto_refresh BOOLEAN DEFAULT FALSE,
  refresh_frequency VARCHAR(50), -- Daily, Weekly, Monthly
  refresh_duration VARCHAR(50), -- Duration in days/weeks/months
  
  -- Salary information (if added)
  min_salary DECIMAL(12, 2),
  max_salary DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  
  -- Status and timestamps
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, closed
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id ON job_postings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_title ON job_postings(job_title);

-- Enable RLS (Row Level Security)
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employers
CREATE POLICY "Allow employers to insert own job postings"
  ON job_postings FOR INSERT
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Allow employers to view own job postings"
  ON job_postings FOR SELECT
  USING (employer_id = auth.uid());

CREATE POLICY "Allow employers to update own job postings"
  ON job_postings FOR UPDATE
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Allow employers to delete own job postings"
  ON job_postings FOR DELETE
  USING (employer_id = auth.uid());

-- RLS Policy for public to view published jobs
CREATE POLICY "Allow public to view published job postings"
  ON job_postings FOR SELECT
  USING (status = 'published');

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
