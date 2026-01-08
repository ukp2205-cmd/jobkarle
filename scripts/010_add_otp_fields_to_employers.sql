-- Add OTP storage fields to employers table
ALTER TABLE employers ADD COLUMN IF NOT EXISTS otp_hash TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- Add same fields to candidates table for consistency
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS otp_hash TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- Create index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_employers_mobile_number ON employers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_candidates_mobile_number ON candidates(mobile_number);

COMMENT ON COLUMN employers.otp_hash IS 'Temporary storage for OTP hash during verification';
COMMENT ON COLUMN employers.otp_expires_at IS 'OTP expiration timestamp';
COMMENT ON COLUMN candidates.otp_hash IS 'Temporary storage for OTP hash during verification';
COMMENT ON COLUMN candidates.otp_expires_at IS 'OTP expiration timestamp';
