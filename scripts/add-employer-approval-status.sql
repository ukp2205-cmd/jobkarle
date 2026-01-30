-- Add approval status field to employers table for admin approval workflow
ALTER TABLE employers 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval metadata fields
ALTER TABLE employers 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES business_team(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Set existing employers to approved status (grandfather existing accounts)
UPDATE employers 
SET approval_status = 'approved', 
    approved_at = created_at 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Create index for faster approval queries
CREATE INDEX IF NOT EXISTS idx_employers_approval_status ON employers(approval_status);

COMMENT ON COLUMN employers.approval_status IS 'Admin approval status: pending (awaiting approval), approved (can login), rejected (denied access)';
COMMENT ON COLUMN employers.approved_at IS 'Timestamp when employer was approved by admin';
COMMENT ON COLUMN employers.approved_by IS 'Business team member who approved this employer';
COMMENT ON COLUMN employers.rejection_reason IS 'Reason provided if employer application was rejected';
