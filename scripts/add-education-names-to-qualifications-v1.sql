-- Add education_names column to highest_qualifications table and populate with degree names

-- Add the education_names column (jsonb array)
ALTER TABLE highest_qualifications
ADD COLUMN IF NOT EXISTS education_names jsonb DEFAULT '[]'::jsonb;

-- Update each qualification with appropriate education names
-- 10th: Empty array (disabled)
UPDATE highest_qualifications
SET education_names = '[]'::jsonb
WHERE level = '10th';

-- 12th: Empty array (no specific degrees)
UPDATE highest_qualifications
SET education_names = '[]'::jsonb
WHERE level = '12th';

-- Diploma: Various diploma programs
UPDATE highest_qualifications
SET education_names = '[
  "Diploma in Engineering",
  "Diploma in Computer Science",
  "Diploma in Information Technology",
  "Diploma in Mechanical Engineering",
  "Diploma in Civil Engineering",
  "Diploma in Electrical Engineering",
  "Diploma in Electronics",
  "Diploma in Business Management",
  "Diploma in Hotel Management",
  "Diploma in Pharmacy"
]'::jsonb
WHERE level = 'Diploma';

-- Graduate: Bachelor degrees
UPDATE highest_qualifications
SET education_names = '[
  "B.A. (Bachelor of Arts)",
  "B.Com (Bachelor of Commerce)",
  "B.Sc (Bachelor of Science)",
  "B.Tech (Bachelor of Technology)",
  "B.E. (Bachelor of Engineering)",
  "BCA (Bachelor of Computer Applications)",
  "BBA (Bachelor of Business Administration)",
  "B.Pharm (Bachelor of Pharmacy)",
  "MBBS (Bachelor of Medicine, Bachelor of Surgery)",
  "BDS (Bachelor of Dental Surgery)",
  "B.Arch (Bachelor of Architecture)",
  "LLB (Bachelor of Laws)",
  "B.Ed (Bachelor of Education)"
]'::jsonb
WHERE level = 'Graduate';

-- Post Graduate: Master degrees
UPDATE highest_qualifications
SET education_names = '[
  "M.A. (Master of Arts)",
  "M.Com (Master of Commerce)",
  "M.Sc (Master of Science)",
  "M.Tech (Master of Technology)",
  "M.E. (Master of Engineering)",
  "MCA (Master of Computer Applications)",
  "MBA (Master of Business Administration)",
  "M.Pharm (Master of Pharmacy)",
  "MD (Doctor of Medicine)",
  "MS (Master of Surgery)",
  "M.Arch (Master of Architecture)",
  "LLM (Master of Laws)",
  "M.Ed (Master of Education)"
]'::jsonb
WHERE level = 'Post Graduate';

-- Doctorate: Doctoral degrees
UPDATE highest_qualifications
SET education_names = '[
  "Ph.D. (Doctor of Philosophy)",
  "D.Sc (Doctor of Science)",
  "D.Litt (Doctor of Literature)",
  "DM (Doctorate of Medicine)",
  "M.Ch (Master of Chirurgiae)"
]'::jsonb
WHERE level = 'Doctorate';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_highest_qualifications_education_names 
ON highest_qualifications USING gin(education_names);
