-- Update credit allocation function to support new plan restrictions and 90-day expiry

CREATE OR REPLACE FUNCTION allocate_credits(
  p_employer_id UUID,
  p_plan_type VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
  v_credits INTEGER;
  v_credit_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_max_locations INTEGER;
  v_job_validity_days INTEGER;
  v_applies_expiry_days INTEGER;
BEGIN
  -- Determine credits and restrictions based on plan type
  CASE p_plan_type
    WHEN 'classic' THEN 
      v_credits := 1;
      v_max_locations := 1;
      v_job_validity_days := 45;
      v_applies_expiry_days := 45;
    WHEN 'premium' THEN 
      v_credits := 1;
      v_max_locations := 3;
      v_job_validity_days := 30;
      v_applies_expiry_days := 60;
    ELSE 
      RAISE EXCEPTION 'Invalid plan type: %. Only classic and premium are supported.', p_plan_type;
  END CASE;
  
  -- Set expiry date to 90 days from now (as per new plan structure)
  v_expires_at := NOW() + INTERVAL '90 days';
  
  -- Insert credit record with plan restrictions
  INSERT INTO employer_credits (
    employer_id,
    plan_type,
    credits_allocated,
    credits_used,
    credits_remaining,
    allocated_at,
    expires_at,
    max_locations,
    job_validity_days,
    applies_expiry_days
  ) VALUES (
    p_employer_id,
    p_plan_type,
    v_credits,
    0,
    v_credits,
    NOW(),
    v_expires_at,
    v_max_locations,
    v_job_validity_days,
    v_applies_expiry_days
  )
  RETURNING id INTO v_credit_id;
  
  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql;

-- Update deduct_credits function to support variable credit deduction (1 for classic, 2 for premium)
CREATE OR REPLACE FUNCTION deduct_credits_with_plan_check(
  p_employer_id UUID,
  p_plan_type VARCHAR(50),
  p_job_locations_count INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  credits_deducted INTEGER,
  max_locations INTEGER
) AS $$
DECLARE
  v_credits_to_deduct INTEGER;
  v_available_credits INTEGER;
  v_max_locations INTEGER;
  v_credits_remaining INTEGER;
  v_credit_record RECORD;
BEGIN
  -- Determine credits to deduct based on plan type
  CASE p_plan_type
    WHEN 'classic' THEN 
      v_credits_to_deduct := 1;
      v_max_locations := 1;
    WHEN 'premium' THEN 
      v_credits_to_deduct := 2;
      v_max_locations := 3;
    ELSE 
      RETURN QUERY SELECT FALSE, 'Invalid plan type'::TEXT, 0, 0;
      RETURN;
  END CASE;
  
  -- Validate location count
  IF p_job_locations_count > v_max_locations THEN
    RETURN QUERY SELECT 
      FALSE, 
      format('Classic plan allows only %s location per job. Please upgrade to Premium for multiple locations.', v_max_locations),
      0,
      v_max_locations;
    RETURN;
  END IF;
  
  -- First expire any old credits
  PERFORM expire_old_credits();
  
  -- Check if employer has enough credits of the specified plan type
  SELECT COALESCE(SUM(credits_remaining), 0) INTO v_available_credits
  FROM employer_credits
  WHERE employer_id = p_employer_id
    AND plan_type = p_plan_type
    AND is_expired = FALSE
    AND expires_at > NOW();
  
  IF v_available_credits < v_credits_to_deduct THEN
    RETURN QUERY SELECT 
      FALSE, 
      format('Insufficient %s credits. You have %s credit(s) but need %s to post a job.', 
             UPPER(p_plan_type), v_available_credits, v_credits_to_deduct),
      0,
      v_max_locations;
    RETURN;
  END IF;
  
  -- Deduct credits from oldest allocations first (FIFO) for the specific plan type
  v_credits_remaining := v_credits_to_deduct;
  
  FOR v_credit_record IN
    SELECT id, credits_remaining
    FROM employer_credits
    WHERE employer_id = p_employer_id
      AND plan_type = p_plan_type
      AND is_expired = FALSE
      AND expires_at > NOW()
      AND credits_remaining > 0
    ORDER BY allocated_at ASC
  LOOP
    IF v_credits_remaining <= 0 THEN
      EXIT;
    END IF;
    
    IF v_credit_record.credits_remaining >= v_credits_remaining THEN
      -- This record has enough credits
      UPDATE employer_credits
      SET credits_used = credits_used + v_credits_remaining,
          credits_remaining = credits_remaining - v_credits_remaining,
          updated_at = NOW()
      WHERE id = v_credit_record.id;
      
      v_credits_remaining := 0;
    ELSE
      -- Use all remaining credits from this record
      UPDATE employer_credits
      SET credits_used = credits_used + v_credit_record.credits_remaining,
          credits_remaining = 0,
          updated_at = NOW()
      WHERE id = v_credit_record.id;
      
      v_credits_remaining := v_credits_remaining - v_credit_record.credits_remaining;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_credits_to_deduct, v_max_locations;
END;
$$ LANGUAGE plpgsql;

-- Fixed duplicate parameter name error by renaming output columns to avoid conflict with input parameter
-- Function to calculate GST (18%)
CREATE OR REPLACE FUNCTION calculate_price_with_gst(p_base_price DECIMAL)
RETURNS TABLE (
  price_before_gst DECIMAL,
  gst_amount DECIMAL,
  total_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY SELECT 
    p_base_price as price_before_gst,
    ROUND(p_base_price * 0.18, 2) as gst_amount,
    ROUND(p_base_price * 1.18, 2) as total_price;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate bulk discount (10% on 3+ jobs)
CREATE OR REPLACE FUNCTION calculate_bulk_discount(p_quantity INTEGER, p_unit_price DECIMAL)
RETURNS TABLE (
  qty INTEGER,
  unit_price DECIMAL,
  discount_percentage DECIMAL,
  discount_amount DECIMAL,
  subtotal DECIMAL,
  gst_amount DECIMAL,
  total_price DECIMAL
) AS $$
DECLARE
  v_discount_pct DECIMAL := 0;
  v_subtotal DECIMAL;
  v_discount_amount DECIMAL;
  v_final_subtotal DECIMAL;
  v_gst DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Apply 10% discount for 3 or more jobs
  IF p_quantity >= 3 THEN
    v_discount_pct := 0.10;
  END IF;
  
  -- Calculate subtotal before discount
  v_subtotal := p_unit_price * p_quantity;
  
  -- Calculate discount amount
  v_discount_amount := ROUND(v_subtotal * v_discount_pct, 2);
  
  -- Calculate final subtotal after discount
  v_final_subtotal := v_subtotal - v_discount_amount;
  
  -- Calculate GST (18%)
  v_gst := ROUND(v_final_subtotal * 0.18, 2);
  
  -- Calculate total
  v_total := v_final_subtotal + v_gst;
  
  RETURN QUERY SELECT 
    p_quantity as qty,
    p_unit_price,
    v_discount_pct,
    v_discount_amount,
    v_final_subtotal,
    v_gst,
    v_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION allocate_credits IS 'Allocates credits with plan-specific restrictions (Classic: 1 location, Premium: 3 locations)';
COMMENT ON FUNCTION deduct_credits_with_plan_check IS 'Deducts credits based on plan type (1 credit for classic, 2 for premium) with location validation';
COMMENT ON FUNCTION calculate_price_with_gst IS 'Calculates total price including 18% GST';
COMMENT ON FUNCTION calculate_bulk_discount IS 'Calculates pricing with 10% discount for 3+ job purchases';
