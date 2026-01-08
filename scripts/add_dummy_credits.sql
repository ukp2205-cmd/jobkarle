-- Add dummy credits for testing
-- This script allocates 10 credits to all employers for testing purposes

INSERT INTO employer_credits (employer_id, credits_allocated, credits_used, allocated_at, expires_at)
SELECT 
  id as employer_id,
  10 as credits_allocated,
  0 as credits_used,
  NOW() as allocated_at,
  NOW() + INTERVAL '30 days' as expires_at
FROM employers
ON CONFLICT (employer_id, allocated_at) 
DO NOTHING;
