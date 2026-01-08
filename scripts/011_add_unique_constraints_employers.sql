-- Add unique constraints to employers table to prevent duplicates
-- This ensures data integrity at the database level

-- Add unique constraint on mobile_number
ALTER TABLE employers
ADD CONSTRAINT employers_mobile_number_unique UNIQUE (mobile_number);

-- Add unique constraint on email
ALTER TABLE employers
ADD CONSTRAINT employers_email_unique UNIQUE (email);

-- Add unique constraint on username
ALTER TABLE employers
ADD CONSTRAINT employers_username_unique UNIQUE (username);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employers_mobile_number ON employers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_employers_email ON employers(email);
