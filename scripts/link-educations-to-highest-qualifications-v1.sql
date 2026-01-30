-- Migration: Link educations table to highest_qualifications table via foreign key
-- This creates a proper relational structure where education_level becomes a foreign key

-- Step 1: Add new column for the foreign key relationship
ALTER TABLE educations 
ADD COLUMN IF NOT EXISTS qualification_id INTEGER;

-- Step 2: Update existing records to map text education_level to qualification IDs
UPDATE educations SET qualification_id = 2 WHERE education_level = '12th';
UPDATE educations SET qualification_id = 3 WHERE education_level = 'Diploma';
UPDATE educations SET qualification_id = 4 WHERE education_level = 'Graduate';
UPDATE educations SET qualification_id = 5 WHERE education_level = 'Post Graduate';
UPDATE educations SET qualification_id = 6 WHERE education_level = 'Doctorate';

-- Step 3: Make the column NOT NULL after data migration
ALTER TABLE educations 
ALTER COLUMN qualification_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE educations 
ADD CONSTRAINT fk_educations_qualification 
FOREIGN KEY (qualification_id) 
REFERENCES highest_qualifications(id) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Step 5: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_educations_qualification_id 
ON educations(qualification_id);

-- Step 6: Rename old education_level column to keep as backup
ALTER TABLE educations 
RENAME COLUMN education_level TO education_level_old;

-- Step 7: Add view for backward compatibility (optional)
CREATE OR REPLACE VIEW educations_with_level AS
SELECT 
  e.id,
  e.education_name,
  e.qualification_id,
  hq.level as education_level,
  hq.display_order,
  e.created_at,
  e.updated_at
FROM educations e
INNER JOIN highest_qualifications hq ON e.qualification_id = hq.id;

-- Step 8: Grant appropriate permissions on the view
GRANT SELECT ON educations_with_level TO authenticated;
GRANT SELECT ON educations_with_level TO anon;

-- Verification query (uncomment to test):
-- SELECT 
--   e.education_name,
--   e.qualification_id,
--   e.education_level_old,
--   hq.level as new_education_level
-- FROM educations e
-- LEFT JOIN highest_qualifications hq ON e.qualification_id = hq.id
-- LIMIT 20;
