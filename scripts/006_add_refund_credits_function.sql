-- Create refund_credits function for atomic credit refunds
CREATE OR REPLACE FUNCTION refund_credits(
  p_employer_id UUID,
  p_credits_to_refund INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record_id UUID;
BEGIN
  -- Find the most recent active credit record for this employer
  SELECT id INTO v_record_id
  FROM employer_credits
  WHERE employer_id = p_employer_id
    AND expires_at > NOW()
  ORDER BY allocated_at DESC
  LIMIT 1;

  -- If no active credits found, return false
  IF v_record_id IS NULL THEN
    RAISE NOTICE 'No active credit record found for employer %', p_employer_id;
    RETURN FALSE;
  END IF;

  -- Refund the credits (add back to used credits and increase remaining)
  UPDATE employer_credits
  SET 
    credits_used = GREATEST(0, credits_used - p_credits_to_refund),
    credits_remaining = LEAST(credits_allocated, credits_remaining + p_credits_to_refund),
    updated_at = NOW()
  WHERE id = v_record_id;

  RAISE NOTICE 'Refunded % credits to employer %', p_credits_to_refund, p_employer_id;
  RETURN TRUE;
END;
$$;
