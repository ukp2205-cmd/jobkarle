-- Restore the original 3-plan structure as shown in the pricing image
-- Free, Classified (₹5 for testing), Premium (₹750)

-- Delete existing plans
DELETE FROM plans;

-- Reset sequence if needed
ALTER SEQUENCE IF EXISTS plans_id_seq RESTART WITH 1;

-- Insert Free Plan
INSERT INTO plans (name, slug, billing_cycle, price, credits_allocated, job_validity_days, features, created_at, updated_at)
VALUES 
  ('Free', 'free', 'one_time', 0.00, 2, 15, 
   '["2 Job Credits (Valid for 90 days)", "Single location per job", "Unlimited candidate applications", "Applications expire in 30 days", "Full CV access", "Job validity: 15 days", "Basic support"]'::jsonb,
   NOW(), NOW());

-- Insert Classified Plan (₹5 for testing payment flow)
INSERT INTO plans (name, slug, billing_cycle, price, credits_allocated, job_validity_days, features, created_at, updated_at)
VALUES 
  ('Classified', 'classified', 'per_job', 5.00, 1, 30,
   '["Price: ₹400 + GST", "Single job posting", "One location per job", "Unlimited candidate applications", "Applications expire in 45 days", "Full CV visibility", "Job validity: 30 days", "Use credits within 90 days"]'::jsonb,
   NOW(), NOW());

-- Insert Premium Plan
INSERT INTO plans (name, slug, billing_cycle, price, credits_allocated, job_validity_days, features, created_at, updated_at)
VALUES 
  ('Premium', 'premium', 'per_job', 750.00, 1, 30,
   '["Price: ₹750 + GST", "Single job posting", "Three locations per job", "Unlimited candidate applications", "Applications expire in 60 days", "Full CV visibility", "Job validity: 30 days", "💎 Premium Diamond Badge"]'::jsonb,
   NOW(), NOW());

-- Verify the plans
SELECT id, name, slug, billing_cycle, price, credits_allocated FROM plans ORDER BY price;
