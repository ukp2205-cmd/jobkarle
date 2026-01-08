-- Create education specialization table (Finance, Accounting, etc. for B.Com)
CREATE TABLE IF NOT EXISTS public.education_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_id UUID NOT NULL REFERENCES public.educations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(education_id, name)
);

-- Enable RLS
ALTER TABLE public.education_specializations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to education_specializations"
  ON public.education_specializations
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert/update (admin management)
CREATE POLICY "Allow authenticated insert to education_specializations"
  ON public.education_specializations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to education_specializations"
  ON public.education_specializations
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX idx_education_specializations_education_id ON public.education_specializations(education_id);
