-- Add verified flag to phone_verifications table
ALTER TABLE phone_verifications
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_verified 
ON phone_verifications(phone_number, verified);
