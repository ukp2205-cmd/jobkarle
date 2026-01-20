-- Clear existing plans and create proper subscription-based plans
-- This replaces the per_job pricing with monthly/yearly subscription plans

-- Drop the unique constraint on slug to allow multiple billing cycles
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_slug_key;

-- Create a composite unique constraint on slug + billing_cycle
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_slug_billing_cycle_key;
ALTER TABLE plans ADD CONSTRAINT plans_slug_billing_cycle_key UNIQUE (slug, billing_cycle);

-- Delete existing plans
DELETE FROM plans;

-- Insert Classic Plan (Monthly and Yearly)
INSERT INTO plans (name, slug, billing_cycle, price, credits_allocated, created_at, updated_at)
VALUES 
  ('Classic Monthly', 'classic', 'monthly', 5.00, 10, NOW(), NOW()),
  ('Classic Yearly', 'classic', 'yearly', 50.00, 120, NOW(), NOW());

-- Insert Premium Plan (Monthly and Yearly)
INSERT INTO plans (name, slug, billing_cycle, price, credits_allocated, created_at, updated_at)
VALUES 
  ('Premium Monthly', 'premium', 'monthly', 499.00, 50, NOW(), NOW()),
  ('Premium Yearly', 'premium', 'yearly', 4999.00, 600, NOW(), NOW());

-- Insert Enterprise Plan (Monthly and Yearly)
INSERT INTO plans (name, slug, billing_cycle, price, credits_allocated, created_at, updated_at)
VALUES 
  ('Enterprise Monthly', 'enterprise', 'monthly', 2999.00, 200, NOW(), NOW()),
  ('Enterprise Yearly', 'enterprise', 'yearly', 29999.00, 2500, NOW(), NOW());

-- Verify the data
SELECT id, name, slug, billing_cycle, price, credits_allocated FROM plans ORDER BY slug, billing_cycle;
