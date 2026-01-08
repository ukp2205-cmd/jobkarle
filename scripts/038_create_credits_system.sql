-- Create credits table to track employer credits with 30-day expiry
CREATE TABLE IF NOT EXISTS employer_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'classic', 'premium')),
  credits_allocated INTEGER NOT NULL,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER NOT NULL,
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure remaining credits don't go negative
  CONSTRAINT check_credits_remaining CHECK (credits_remaining >= 0),
  -- Ensure used credits don't exceed allocated
  CONSTRAINT check_credits_used CHECK (credits_used <= credits_allocated)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_employer_id ON employer_credits(employer_id);
CREATE INDEX IF NOT EXISTS idx_credits_expires_at ON employer_credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_credits_active ON employer_credits(employer_id, is_expired, expires_at);

-- Enable RLS
ALTER TABLE employer_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Employers can view own credits"
ON employer_credits FOR SELECT
USING (true);

CREATE POLICY "Allow credit allocation"
ON employer_credits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow credit updates"
ON employer_credits FOR UPDATE
USING (true);

-- Function to auto-expire credits after 30 days
CREATE OR REPLACE FUNCTION expire_old_credits()
RETURNS void AS $$
BEGIN
  UPDATE employer_credits
  SET is_expired = TRUE,
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND is_expired = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to allocate credits based on plan
CREATE OR REPLACE FUNCTION allocate_credits(
  p_employer_id UUID,
  p_plan_type VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
  v_credits INTEGER;
  v_credit_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine credits based on plan type
  CASE p_plan_type
    WHEN 'free' THEN v_credits := 5;
    WHEN 'classic' THEN v_credits := 15;
    WHEN 'premium' THEN v_credits := 25;
    ELSE RAISE EXCEPTION 'Invalid plan type: %', p_plan_type;
  END CASE;
  
  -- Set expiry date to 30 days from now
  v_expires_at := NOW() + INTERVAL '30 days';
  
  -- Insert credit record
  INSERT INTO employer_credits (
    employer_id,
    plan_type,
    credits_allocated,
    credits_used,
    credits_remaining,
    allocated_at,
    expires_at
  ) VALUES (
    p_employer_id,
    p_plan_type,
    v_credits,
    0,
    v_credits,
    NOW(),
    v_expires_at
  )
  RETURNING id INTO v_credit_id;
  
  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get active (non-expired) credits for an employer
CREATE OR REPLACE FUNCTION get_active_credits(p_employer_id UUID)
RETURNS TABLE (
  total_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  expires_soon BOOLEAN
) AS $$
BEGIN
  -- First expire any old credits
  PERFORM expire_old_credits();
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ec.credits_allocated), 0)::INTEGER as total_credits,
    COALESCE(SUM(ec.credits_used), 0)::INTEGER as used_credits,
    COALESCE(SUM(ec.credits_remaining), 0)::INTEGER as remaining_credits,
    EXISTS(
      SELECT 1 FROM employer_credits 
      WHERE employer_id = p_employer_id 
        AND is_expired = FALSE 
        AND expires_at < NOW() + INTERVAL '7 days'
    ) as expires_soon
  FROM employer_credits ec
  WHERE ec.employer_id = p_employer_id
    AND ec.is_expired = FALSE
    AND ec.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credits when posting a job
CREATE OR REPLACE FUNCTION deduct_credits(
  p_employer_id UUID,
  p_credits_to_deduct INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_credits INTEGER;
  v_credits_remaining INTEGER;
  v_credit_record RECORD;
BEGIN
  -- First expire any old credits
  PERFORM expire_old_credits();
  
  -- Check if employer has enough credits
  SELECT COALESCE(SUM(credits_remaining), 0) INTO v_available_credits
  FROM employer_credits
  WHERE employer_id = p_employer_id
    AND is_expired = FALSE
    AND expires_at > NOW();
  
  IF v_available_credits < p_credits_to_deduct THEN
    RETURN FALSE; -- Not enough credits
  END IF;
  
  -- Deduct credits from oldest allocations first (FIFO)
  v_credits_remaining := p_credits_to_deduct;
  
  FOR v_credit_record IN
    SELECT id, credits_remaining
    FROM employer_credits
    WHERE employer_id = p_employer_id
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
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE employer_credits IS 'Tracks employer credits allocated per plan with 30-day expiry';
COMMENT ON COLUMN employer_credits.plan_type IS 'Plan type: free (5 credits), classic (15 credits), premium (25 credits)';
COMMENT ON COLUMN employer_credits.expires_at IS 'Credits expire 30 days after allocation';
COMMENT ON FUNCTION allocate_credits IS 'Allocates credits to an employer based on their plan type';
COMMENT ON FUNCTION get_active_credits IS 'Returns active (non-expired) credit summary for an employer';
COMMENT ON FUNCTION deduct_credits IS 'Deducts credits when employer posts a job (FIFO)';
