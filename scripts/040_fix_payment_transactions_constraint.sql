-- Remove the restrictive plan_type CHECK constraint and add a new one that allows any non-empty value
-- This allows all plan types from the plans table (free, starter, classic, premium, etc.)

ALTER TABLE payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_plan_type_check;

ALTER TABLE payment_transactions 
ADD CONSTRAINT payment_transactions_plan_type_check 
CHECK (plan_type IS NOT NULL AND plan_type != '');
