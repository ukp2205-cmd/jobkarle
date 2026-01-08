-- Update pricing plans with proper Classic and Premium features as specified
-- Update pricing plans to Classic (₹400) and Premium (₹750) with GST and new restrictions

-- First, deactivate existing plans
UPDATE plans SET is_active = FALSE WHERE slug IN ('free', 'classic', 'premium');

-- Create Classic Plan (₹400 + GST)
INSERT INTO plans (
  name,
  slug,
  description,
  price,
  credits_allocated,
  billing_cycle,
  currency,
  features,
  is_active,
  max_locations,
  job_validity_days,
  applies_expiry_days,
  credits_validity_days,
  credits_per_post
) VALUES (
  'Classic Job Posting',
  'classic',
  'Perfect for small businesses - Post quality jobs at affordable rates',
  400, -- Base price ₹400 (GST calculated at payment = ₹472)
  1, -- 1 credit allocated
  'one-time',
  'INR',
  jsonb_build_array(
    jsonb_build_object('name', '₹400 + GST per job', 'included', true),
    jsonb_build_object('name', 'Single job posting', 'included', true),
    jsonb_build_object('name', 'One location per job', 'included', true),
    jsonb_build_object('name', 'Unlimited candidate applies', 'included', true),
    jsonb_build_object('name', 'Applies expire in 45 days', 'included', true),
    jsonb_build_object('name', 'Full visibility of CVs', 'included', true),
    jsonb_build_object('name', 'Use credits within 90 days', 'included', true),
    jsonb_build_object('name', '10% discount on 3+ jobs', 'included', true),
    jsonb_build_object('name', 'Premium diamond badge', 'included', false),
    jsonb_build_object('name', 'Multiple locations (up to 3)', 'included', false),
    jsonb_build_object('name', 'Job validity 30 days', 'included', false),
    jsonb_build_object('name', 'Priority listing', 'included', false)
  ),
  true,
  1, -- Max 1 location
  45, -- Job validity
  45, -- Applies expiry
  90, -- Credits expire in 90 days
  1 -- Deducts 1 credit per post
),
(
  'Premium Job Posting',
  'premium',
  'Best for growing companies - Get more visibility and reach',
  750, -- Base price ₹750 (GST calculated at payment = ₹885)
  1, -- 1 credit allocated
  'one-time',
  'INR',
  jsonb_build_array(
    jsonb_build_object('name', '₹750 + GST per job', 'included', true),
    jsonb_build_object('name', 'Single job posting', 'included', true),
    jsonb_build_object('name', 'Three locations per job', 'included', true),
    jsonb_build_object('name', 'Unlimited candidate applies', 'included', true),
    jsonb_build_object('name', 'Applies expire in 60 days', 'included', true),
    jsonb_build_object('name', 'Job validity 30 days', 'included', true),
    jsonb_build_object('name', 'Full visibility of CVs', 'included', true),
    jsonb_build_object('name', 'Use credits within 90 days', 'included', true),
    jsonb_build_object('name', '💎 Premium diamond badge', 'included', true),
    jsonb_build_object('name', '10% discount on 3+ jobs', 'included', true),
    jsonb_build_object('name', 'Priority listing', 'included', true),
    jsonb_build_object('name', 'Featured job highlight', 'included', true)
  ),
  true,
  3, -- Max 3 locations
  30, -- Job validity
  60, -- Applies expiry
  90, -- Credits expire in 90 days
  2 -- Deducts 2 credits per post
);

-- Add plan restrictions columns to plans table if they don't exist
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS job_validity_days INTEGER DEFAULT 45,
ADD COLUMN IF NOT EXISTS applies_expiry_days INTEGER DEFAULT 45,
ADD COLUMN IF NOT EXISTS credits_validity_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS credits_per_post INTEGER DEFAULT 1;

-- Update employer_credits table to track plan restrictions
ALTER TABLE employer_credits
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS job_validity_days INTEGER DEFAULT 45,
ADD COLUMN IF NOT EXISTS applies_expiry_days INTEGER DEFAULT 45;

COMMENT ON COLUMN plans.max_locations IS 'Maximum number of locations allowed per job post';
COMMENT ON COLUMN plans.job_validity_days IS 'Number of days the job posting remains active';
COMMENT ON COLUMN plans.applies_expiry_days IS 'Number of days candidate applications remain valid';
COMMENT ON COLUMN plans.credits_validity_days IS 'Number of days credits remain valid after allocation';
COMMENT ON COLUMN plans.credits_per_post IS 'Number of credits deducted per job post (1 for classic, 2 for premium)';
