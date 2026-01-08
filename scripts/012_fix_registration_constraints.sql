-- Fix registration constraints to allow incomplete registrations with same email/mobile
-- Only enforce unique constraints for completed registrations

-- Drop existing unique constraints on candidates
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_email_key;

-- Create partial unique index for candidates - only for completed registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_email_completed 
ON candidates(email) 
WHERE registration_completed = TRUE;

-- Add comment for clarity
COMMENT ON INDEX idx_candidates_email_completed IS 'Unique email constraint only applies to completed registrations';

-- Do the same for employers
ALTER TABLE employers DROP CONSTRAINT IF EXISTS employers_email_unique;

-- Create partial unique index for employers - only for verified registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_employers_email_verified 
ON employers(email) 
WHERE otp_verified = TRUE;

-- Add comment
COMMENT ON INDEX idx_employers_email_verified IS 'Unique email constraint only applies to verified registrations';
