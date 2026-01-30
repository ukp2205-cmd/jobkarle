-- Update Classic plan monthly pricing to 5 rupees for testing
-- This allows testing the complete payment flow with a minimal amount

UPDATE plans
SET 
  price = 5,
  updated_at = NOW()
WHERE slug = 'classic' AND billing_cycle = 'monthly';

-- Verify the update
SELECT 
  id,
  name,
  slug,
  billing_cycle,
  price,
  credits_allocated,
  is_active
FROM plans
WHERE slug = 'classic' AND billing_cycle = 'monthly';
