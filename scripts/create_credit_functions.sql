-- Function to get active credits for an employer
CREATE OR REPLACE FUNCTION public.get_active_credits(p_employer_id UUID)
RETURNS TABLE (
  total_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  expires_soon BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(credits_allocated), 0)::INTEGER as total_credits,
    COALESCE(SUM(credits_used), 0)::INTEGER as used_credits,
    COALESCE(SUM(credits_remaining), 0)::INTEGER as remaining_credits,
    BOOL_OR(expires_at <= NOW() + INTERVAL '7 days') as expires_soon
  FROM employer_credits
  WHERE employer_id = p_employer_id
    AND is_expired = false
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to allocate credits to an employer
CREATE OR REPLACE FUNCTION public.allocate_credits(
  p_employer_id UUID,
  p_plan_type VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_credits INTEGER;
  v_credit_id UUID;
BEGIN
  -- Determine credits based on plan type
  v_credits := CASE p_plan_type
    WHEN 'free' THEN 5
    WHEN 'classic' THEN 15
    WHEN 'premium' THEN 25
    ELSE 5
  END;

  -- Insert new credit allocation
  INSERT INTO employer_credits (
    id,
    employer_id,
    plan_type,
    credits_allocated,
    credits_used,
    credits_remaining,
    allocated_at,
    expires_at,
    is_expired
  ) VALUES (
    gen_random_uuid(),
    p_employer_id,
    p_plan_type,
    v_credits,
    0,
    v_credits,
    NOW(),
    NOW() + INTERVAL '30 days',
    false
  ) RETURNING id INTO v_credit_id;

  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits when posting a job
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_employer_id UUID,
  p_credits_to_deduct INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_credits INTEGER;
  v_credits_needed INTEGER;
  v_credit_record RECORD;
BEGIN
  -- Check total available credits
  SELECT COALESCE(SUM(credits_remaining), 0) INTO v_available_credits
  FROM employer_credits
  WHERE employer_id = p_employer_id
    AND is_expired = false
    AND expires_at > NOW();

  -- If insufficient credits, return false
  IF v_available_credits < p_credits_to_deduct THEN
    RETURN false;
  END IF;

  -- Deduct credits from oldest allocations first (FIFO)
  v_credits_needed := p_credits_to_deduct;
  
  FOR v_credit_record IN 
    SELECT id, credits_remaining
    FROM employer_credits
    WHERE employer_id = p_employer_id
      AND is_expired = false
      AND expires_at > NOW()
      AND credits_remaining > 0
    ORDER BY allocated_at ASC
  LOOP
    IF v_credits_needed <= 0 THEN
      EXIT;
    END IF;

    IF v_credit_record.credits_remaining >= v_credits_needed THEN
      -- This record has enough credits
      UPDATE employer_credits
      SET 
        credits_used = credits_used + v_credits_needed,
        credits_remaining = credits_remaining - v_credits_needed,
        updated_at = NOW()
      WHERE id = v_credit_record.id;
      
      v_credits_needed := 0;
    ELSE
      -- Use all remaining credits from this record
      UPDATE employer_credits
      SET 
        credits_used = credits_used + v_credit_record.credits_remaining,
        credits_remaining = 0,
        updated_at = NOW()
      WHERE id = v_credit_record.id;
      
      v_credits_needed := v_credits_needed - v_credit_record.credits_remaining;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old credits (can be called by cron)
CREATE OR REPLACE FUNCTION public.expire_old_credits()
RETURNS void AS $$
BEGIN
  UPDATE employer_credits
  SET 
    is_expired = true,
    updated_at = NOW()
  WHERE expires_at <= NOW()
    AND is_expired = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
