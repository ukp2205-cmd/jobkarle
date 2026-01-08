-- Clean up duplicate records before adding unique constraints
-- Delete duplicate candidates, keeping only the most recent record for each mobile number
WITH ranked_candidates AS (
  SELECT id, mobile_number, email,
         ROW_NUMBER() OVER (PARTITION BY mobile_number ORDER BY created_at DESC) as rn
  FROM candidates
  WHERE mobile_number IS NOT NULL
)
DELETE FROM candidates
WHERE id IN (
  SELECT id FROM ranked_candidates WHERE rn > 1
);

-- Delete duplicate candidates by email, keeping only the most recent
WITH ranked_by_email AS (
  SELECT id, email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM candidates
  WHERE email IS NOT NULL
)
DELETE FROM candidates
WHERE id IN (
  SELECT id FROM ranked_by_email WHERE rn > 1
);

-- Now add unique constraints (safe to do after cleanup)
ALTER TABLE candidates ADD CONSTRAINT unique_candidate_mobile UNIQUE (mobile_number);
ALTER TABLE candidates ADD CONSTRAINT unique_candidate_email UNIQUE (email);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_mobile ON candidates(mobile_number);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
