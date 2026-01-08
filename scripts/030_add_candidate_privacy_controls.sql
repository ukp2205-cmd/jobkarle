-- Add privacy control columns to candidates table
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'hidden', 'private')),
ADD COLUMN IF NOT EXISTS is_profile_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_profile_visibility ON candidates(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_candidates_is_active ON candidates(is_profile_active);

-- Add comment for documentation
COMMENT ON COLUMN candidates.profile_visibility IS 'public: visible to all employers, hidden: not visible in search, private: only visible to applied jobs';
COMMENT ON COLUMN candidates.is_profile_active IS 'true: profile active, false: profile deactivated';
COMMENT ON COLUMN candidates.deactivated_at IS 'Timestamp when profile was deactivated';
COMMENT ON COLUMN candidates.deactivation_reason IS 'Reason provided by candidate for deactivation';
