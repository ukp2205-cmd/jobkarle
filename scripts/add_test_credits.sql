-- Updated plan_type from 'test' to 'free' to match the CHECK constraint
-- Add 10 test credits to all employers for testing job posting
-- This will allocate credits that expire in 30 days

INSERT INTO employer_credits (
  employer_id,
  credits_allocated,
  credits_used,
  credits_remaining,
  allocated_at,
  expires_at,
  plan_type
)
SELECT 
  id as employer_id,
  10 as credits_allocated,
  0 as credits_used,
  10 as credits_remaining,
  NOW() as allocated_at,
  NOW() + INTERVAL '30 days' as expires_at,
  'free' as plan_type
FROM employers
WHERE id NOT IN (
  SELECT DISTINCT employer_id FROM employer_credits WHERE credits_remaining > 0 AND employer_id IS NOT NULL
);

-- Update existing employers with low credits (for testing)
UPDATE employer_credits
SET 
  credits_allocated = credits_allocated + 10,
  credits_remaining = credits_remaining + 10
WHERE credits_remaining < 2 AND is_expired = false;
