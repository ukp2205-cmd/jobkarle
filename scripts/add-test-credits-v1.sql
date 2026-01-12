-- Add 20 credits to sreenivas123@gmail.com employer account for testing
-- Classic jobs cost 1 credit, Premium jobs cost 2 credits

DO $$
DECLARE
  v_employer_id uuid;
BEGIN
  -- Get the employer ID for sreenivas123@gmail.com
  SELECT id INTO v_employer_id
  FROM employers
  WHERE email = 'sreenivas123@gmail.com';

  IF v_employer_id IS NULL THEN
    RAISE EXCEPTION 'Employer with email sreenivas123@gmail.com not found';
  END IF;

  -- Check if credits already exist
  IF EXISTS (
    SELECT 1 FROM employer_credits 
    WHERE employer_id = v_employer_id 
    AND plan_type = 'test_credits'
  ) THEN
    -- Update existing test credits
    UPDATE employer_credits
    SET 
      credits_allocated = 20,
      credits_remaining = 20,
      credits_used = 0,
      expires_at = NOW() + INTERVAL '30 days',
      is_expired = false,
      updated_at = NOW()
    WHERE employer_id = v_employer_id
    AND plan_type = 'test_credits';
    
    RAISE NOTICE 'Updated existing test credits for employer %', v_employer_id;
  ELSE
    -- Insert new test credits
    INSERT INTO employer_credits (
      id,
      employer_id,
      credits_allocated,
      credits_used,
      credits_remaining,
      plan_type,
      billing_cycle,
      allocated_at,
      expires_at,
      is_expired,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_employer_id,
      20,
      0,
      20,
      'test_credits',
      'one_time',
      NOW(),
      NOW() + INTERVAL '30 days',
      false,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Added 20 test credits for employer %', v_employer_id;
  END IF;
END $$;

-- Verify the credits
SELECT 
  e.email,
  e.company_name,
  ec.credits_allocated,
  ec.credits_used,
  ec.credits_remaining,
  ec.plan_type,
  ec.expires_at
FROM employer_credits ec
JOIN employers e ON ec.employer_id = e.id
WHERE e.email = 'sreenivas123@gmail.com';
