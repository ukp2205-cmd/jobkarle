-- Update payment_transactions table billing_cycle constraint to support per-job pricing
-- Current constraint only allows 'monthly' and 'annual', but we need 'per_job' for job posting plans

-- Drop the old constraint
ALTER TABLE payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_billing_cycle_check;

-- Add new constraint that includes 'per_job' and 'one_time' options
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_billing_cycle_check 
CHECK (billing_cycle IN ('monthly', 'annual', 'per_job', 'one_time'));

-- Add comment for documentation
COMMENT ON COLUMN payment_transactions.billing_cycle IS 'Billing cycle: monthly, annual, per_job (single job posting), or one_time (one-time purchase)';
