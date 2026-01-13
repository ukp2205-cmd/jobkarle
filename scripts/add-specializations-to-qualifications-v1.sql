-- Add specializations column to highest_qualifications table
ALTER TABLE highest_qualifications
ADD COLUMN IF NOT EXISTS specializations jsonb DEFAULT '[]'::jsonb;

-- Update each qualification with relevant specializations
UPDATE highest_qualifications
SET specializations = '[]'::jsonb
WHERE level = '10th';

UPDATE highest_qualifications
SET specializations = '[]'::jsonb
WHERE level = '12th';

UPDATE highest_qualifications
SET specializations = '[
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics Engineering",
  "Computer Engineering",
  "IT & Networking",
  "Automobile Engineering",
  "Other Diploma"
]'::jsonb
WHERE level = 'Diploma';

UPDATE highest_qualifications
SET specializations = '[
  "Computer Science/IT",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Commerce/Accounting",
  "Business Administration",
  "Arts/Humanities",
  "Science (Physics/Chemistry/Math)",
  "Hotel Management",
  "Other"
]'::jsonb
WHERE level = 'Graduate';

UPDATE highest_qualifications
SET specializations = '[
  "MBA/PGDM (Management)",
  "MCA (Computer Applications)",
  "M.Tech/M.E. (Engineering)",
  "M.Sc (Science)",
  "M.Com (Commerce)",
  "MA (Arts)",
  "LLM (Law)",
  "Other PG"
]'::jsonb
WHERE level = 'Post Graduate';

UPDATE highest_qualifications
SET specializations = '[
  "Ph.D. in Engineering",
  "Ph.D. in Science",
  "Ph.D. in Management",
  "Ph.D. in Arts/Humanities",
  "Other Doctorate"
]'::jsonb
WHERE level = 'Doctorate';

-- Add comment to column
COMMENT ON COLUMN highest_qualifications.specializations IS 'Array of specializations available for this qualification level';
