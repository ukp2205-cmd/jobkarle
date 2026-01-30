-- Create table for tracking manual credit assignments by admins
-- This provides an audit trail for all manual credit operations

CREATE TABLE IF NOT EXISTS manual_credit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  credits_assigned INTEGER NOT NULL CHECK (credits_assigned > 0),
  reason TEXT NOT NULL,
  assigned_by UUID NOT NULL REFERENCES business_team(id),
  credit_record_id UUID REFERENCES employer_credits(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_manual_credit_assignments_employer 
  ON manual_credit_assignments(employer_id);

CREATE INDEX IF NOT EXISTS idx_manual_credit_assignments_assigned_by 
  ON manual_credit_assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_manual_credit_assignments_assigned_at 
  ON manual_credit_assignments(assigned_at DESC);

-- Add comments for documentation
COMMENT ON TABLE manual_credit_assignments IS 'Audit log for manual credit assignments by business team members';
COMMENT ON COLUMN manual_credit_assignments.employer_id IS 'Reference to the employer who received credits';
COMMENT ON COLUMN manual_credit_assignments.credits_assigned IS 'Number of credits manually assigned';
COMMENT ON COLUMN manual_credit_assignments.reason IS 'Reason for manual credit assignment';
COMMENT ON COLUMN manual_credit_assignments.assigned_by IS 'Business team member who assigned the credits';
COMMENT ON COLUMN manual_credit_assignments.credit_record_id IS 'Reference to the created credit record in employer_credits table';
