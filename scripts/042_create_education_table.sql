-- Create education table for storing education qualifications (B.Com, B.A., M.Tech, etc.)
CREATE TABLE IF NOT EXISTS public.educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  education_level VARCHAR(50), -- e.g., "Bachelor", "Master", "Diploma"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to educations"
  ON public.educations
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert/update (admin management)
CREATE POLICY "Allow authenticated insert to educations"
  ON public.educations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to educations"
  ON public.educations
  FOR UPDATE
  USING (auth.role() = 'authenticated');
