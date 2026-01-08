-- Create phone_verifications table for OTP storage
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster phone number lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone 
ON phone_verifications(phone_number);

-- Add index for expiry cleanup
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires 
ON phone_verifications(expires_at);

-- Enable Row Level Security
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for OTP generation)
CREATE POLICY "Allow public OTP insert" ON phone_verifications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public select (for OTP verification)
CREATE POLICY "Allow public OTP select" ON phone_verifications
  FOR SELECT
  TO public
  USING (true);

-- Allow public update (for OTP updates)
CREATE POLICY "Allow public OTP update" ON phone_verifications
  FOR UPDATE
  TO public
  USING (true);

-- Allow public delete (for cleanup after verification)
CREATE POLICY "Allow public OTP delete" ON phone_verifications
  FOR DELETE
  TO public
  USING (true);

-- Create function to automatically delete expired OTPs
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_verifications
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
