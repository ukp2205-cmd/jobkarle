-- Restore to simple 3-plan structure (Classic, Premium, Enterprise)
-- Classic plan set to ₹5 for testing, others at original pricing

-- Clear existing plans
DELETE FROM plans;

-- Restore to original constraint (single unique slug)
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_slug_billing_cycle_key;
ALTER TABLE plans ADD CONSTRAINT plans_slug_key UNIQUE (slug);

-- Insert 3 simple plans with per_job billing
INSERT INTO plans (name, slug, billing_cycle, price, credits_allocated, created_at, updated_at)
VALUES 
  ('Classic', 'classic', 'per_job', 5.00, 10, NOW(), NOW()),
  ('Premium', 'premium', 'per_job', 999.00, 50, NOW(), NOW()),
  ('Enterprise', 'enterprise', 'per_job', 2999.00, 200, NOW(), NOW());

-- Verify the plans
SELECT id, name, slug, billing_cycle, price, credits_allocated FROM plans ORDER BY price;
