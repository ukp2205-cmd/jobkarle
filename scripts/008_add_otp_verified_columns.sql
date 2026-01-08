-- Add otp_verified column to employers table
ALTER TABLE employers ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;

-- The candidates table already has is_mobile_verified, but let's ensure consistency
-- by adding otp_verified as well for clarity
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employers_mobile ON employers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_employers_otp_verified ON employers(otp_verified);
CREATE INDEX IF NOT EXISTS idx_candidates_otp_verified ON candidates(otp_verified);
