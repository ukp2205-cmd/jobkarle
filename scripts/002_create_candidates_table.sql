-- Create candidates table with all registration form fields
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Step 1: Basic Registration
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  work_status VARCHAR(20) CHECK (work_status IN ('experienced', 'fresher')),
  resume_url TEXT,
  
  -- Step 2: OTP Verification
  is_mobile_verified BOOLEAN DEFAULT FALSE,
  
  -- Step 3: Employment Details
  currently_employed VARCHAR(10) CHECK (currently_employed IN ('yes', 'no')),
  total_experience_years INTEGER,
  total_experience_months INTEGER,
  company_name VARCHAR(255),
  current_job_title VARCHAR(255),
  current_city VARCHAR(100),
  current_state VARCHAR(100),
  duration_from VARCHAR(20),
  duration_to VARCHAR(20),
  annual_salary VARCHAR(50),
  notice_period VARCHAR(50),
  
  -- Skills (stored as JSON arrays)
  skills_for_role JSONB DEFAULT '[]'::jsonb,
  skills_you_know JSONB DEFAULT '[]'::jsonb,
  
  -- Industry & Role
  industry VARCHAR(255),
  department VARCHAR(255),
  role_category VARCHAR(255),
  job_role VARCHAR(255),
  
  -- Step 4: Education Details
  highest_qualification VARCHAR(100),
  course VARCHAR(255),
  course_type VARCHAR(50),
  specialization VARCHAR(255),
  university VARCHAR(255),
  starting_year VARCHAR(10),
  passing_year VARCHAR(10),
  
  -- Step 5-6: Preferences
  resume_headline TEXT,
  preferred_locations JSONB DEFAULT '[]'::jsonb,
  preferred_salary VARCHAR(50),
  gender VARCHAR(20),
  
  -- Registration status
  registration_completed BOOLEAN DEFAULT FALSE,
  current_registration_step INTEGER DEFAULT 1
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_mobile ON candidates(mobile_number);
CREATE INDEX IF NOT EXISTS idx_candidates_city ON candidates(current_city);
CREATE INDEX IF NOT EXISTS idx_candidates_industry ON candidates(industry);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN (skills_for_role);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for new registrations (public)
CREATE POLICY "Allow public registration insert" ON candidates
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow candidates to read their own data
CREATE POLICY "Allow candidates to read own data" ON candidates
  FOR SELECT
  USING (true);

-- Policy: Allow candidates to update their own data
CREATE POLICY "Allow candidates to update own data" ON candidates
  FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
