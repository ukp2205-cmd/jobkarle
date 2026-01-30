-- Remove dummy credits for sreenivas123@gmail.com account
-- This script will reset the employer's credits to 0

-- First, get the employer_id for sreenivas123@gmail.com
DO $$
DECLARE
    v_employer_id UUID;
BEGIN
    -- Find the employer ID
    SELECT id INTO v_employer_id
    FROM employers
    WHERE email = 'sreenivas123@gmail.com';
    
    IF v_employer_id IS NOT NULL THEN
        -- Delete all credits for this employer
        DELETE FROM employer_credits
        WHERE employer_id = v_employer_id;
        
        RAISE NOTICE 'Successfully removed all credits for employer: %', v_employer_id;
    ELSE
        RAISE NOTICE 'Employer with email sreenivas123@gmail.com not found';
    END IF;
END $$;
