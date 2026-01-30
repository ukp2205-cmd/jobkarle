-- Simplify candidate skills to a single 'skills' field
-- Merge skills_for_role and skills_you_know into one 'skills' column

-- Step 1: Add new 'skills' column
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing data - combine both skill fields into 'skills'
UPDATE candidates
SET skills = (
  SELECT jsonb_agg(DISTINCT skill)
  FROM (
    SELECT jsonb_array_elements_text(COALESCE(skills_for_role, '[]'::jsonb)) as skill
    UNION
    SELECT jsonb_array_elements_text(COALESCE(skills_you_know, '[]'::jsonb)) as skill
  ) combined_skills
  WHERE skill IS NOT NULL AND skill != ''
)
WHERE (skills_for_role IS NOT NULL AND skills_for_role != '[]'::jsonb)
   OR (skills_you_know IS NOT NULL AND skills_you_know != '[]'::jsonb);

-- Step 3: We keep the old columns for now (don't drop them) in case of rollback needs
-- They can be dropped later after confirming everything works
-- DROP COLUMN skills_for_role;
-- DROP COLUMN skills_you_know;

COMMENT ON COLUMN candidates.skills IS 'Unified skills field combining skills_for_role and skills_you_know';
