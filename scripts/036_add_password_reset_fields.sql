-- Add password reset fields to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Add password reset fields to employers table
ALTER TABLE employers ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Create indexes for faster token lookups
CREATE INDEX IF NOT EXISTS idx_candidates_reset_token ON candidates(reset_token);
CREATE INDEX IF NOT EXISTS idx_employers_reset_token ON employers(reset_token);

COMMENT ON COLUMN candidates.reset_token IS 'Temporary token for password reset (hashed)';
COMMENT ON COLUMN candidates.reset_token_expires_at IS 'Password reset token expiration timestamp';
COMMENT ON COLUMN employers.reset_token IS 'Temporary token for password reset (hashed)';
COMMENT ON COLUMN employers.reset_token_expires_at IS 'Password reset token expiration timestamp';
