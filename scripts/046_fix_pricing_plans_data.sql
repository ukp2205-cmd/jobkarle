-- Delete old plans and insert correct Classic, Premium, and Free plans
-- with proper pricing and features

-- Clear existing plans
DELETE FROM plans;

-- Insert Free Plan
INSERT INTO plans (
  name,
  slug,
  price,
  credits_allocated,
  billing_cycle,
  is_active,
  features,
  description,
  plan_type,
  restrictions
) VALUES (
  'Free Plan',
  'free',
  0,
  5,
  'lifetime',
  true,
  jsonb_build_array(
    '5 job postings (one-time)',
    'Single location per job',
    'Basic candidate visibility',
    '30 days job validity',
    'Email support',
    'Access to candidate database'
  ),
  'Perfect for trying out JobKarle platform',
  'free',
  jsonb_build_object(
    'max_locations', 1,
    'job_validity_days', 30,
    'applies_expiry_days', 30,
    'credits_expiry_days', null,
    'credit_deduction', 1
  )
);

-- Insert Classic Plan (₹400 + 18% GST = ₹472)
INSERT INTO plans (
  name,
  slug,
  price,
  credits_allocated,
  billing_cycle,
  is_active,
  features,
  description,
  plan_type,
  restrictions
) VALUES (
  'Classic Plan',
  'classic',
  400,
  1,
  'per_job',
  true,
  jsonb_build_array(
    '₹400 + GST per job (₹472 total)',
    'Single job location',
    'Unlimited candidate applications',
    '45 days application validity',
    'Full CV access',
    'Use credits within 90 days',
    '🎉 10% discount on 3+ jobs'
  ),
  'Perfect for small businesses and startups',
  'classic',
  jsonb_build_object(
    'max_locations', 1,
    'job_validity_days', 45,
    'applies_expiry_days', 45,
    'credits_expiry_days', 90,
    'credit_deduction', 1,
    'gst_rate', 18
  )
);

-- Insert Premium Plan (₹750 + 18% GST = ₹885)
INSERT INTO plans (
  name,
  slug,
  price,
  credits_allocated,
  billing_cycle,
  is_active,
  features,
  description,
  plan_type,
  restrictions
) VALUES (
  'Premium Plan',
  'premium',
  750,
  1,
  'per_job',
  true,
  jsonb_build_array(
    '₹750 + GST per job (₹885 total)',
    'Three job locations',
    '💎 Premium diamond badge',
    'Unlimited candidate applications',
    '60 days application validity',
    '30 days job validity',
    'Full CV access',
    'Use credits within 90 days',
    '🎉 10% discount on 3+ jobs',
    'Priority listing in search'
  ),
  'Best for growing businesses with multiple locations',
  'premium',
  jsonb_build_object(
    'max_locations', 3,
    'job_validity_days', 30,
    'applies_expiry_days', 60,
    'credits_expiry_days', 90,
    'credit_deduction', 2,
    'gst_rate', 18,
    'has_premium_badge', true
  )
);
