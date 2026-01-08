-- Add availability_to_join column for freshers
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS availability_to_join character varying;

-- Add comment explaining the column
COMMENT ON COLUMN candidates.availability_to_join IS 'For freshers who do not have notice period, this field stores when they can join (e.g., Immediate, 15 days, 30 days, etc.)';
