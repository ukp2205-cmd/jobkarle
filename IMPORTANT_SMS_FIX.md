# SMS vs Voice Call Issue - CRITICAL FIX

## Problem
Even with approved template, OTPs are being delivered via voice calls instead of SMS.

## Root Cause
2Factor.in may deliver OTPs via voice call if:
1. The recipient's number is on DND (Do Not Disturb) register
2. The template is not configured for SMS-only delivery
3. Manual OTP endpoint doesn't guarantee SMS delivery

## Solution Attempted
Changed from manual OTP endpoint to AUTOGEN endpoint:

**Before (Manual OTP):**
\`\`\`
https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}/OTP1
\`\`\`

**After (AUTOGEN):**
\`\`\`
https://2factor.in/API/V1/{api_key}/SMS/{phone}/AUTOGEN/OTP1
\`\`\`

## AUTOGEN Endpoint Behavior
- 2Factor generates and sends the OTP automatically
- More reliable for SMS delivery
- Template must be approved (✓ Already done: OTP1)

## IMPORTANT: Code Change Required

Since we're now using AUTOGEN, 2Factor generates the OTP. This means:
1. We DON'T send our generated OTP to 2Factor
2. We NEED to get the OTP from the API response
3. The response will include a `Details` field with the OTP or session ID

**However**, this creates a problem: We can't hash and store an OTP we don't know!

## Two Options:

### Option 1: Contact 2Factor Support (RECOMMENDED)
1. Email: support@2factor.in
2. Subject: "Template OTP1 delivering via voice call - need SMS only"
3. Provide:
   - API Key: c7f445c1-d69f-11f0-a6b2-0200cd936042  
   - Template Name: OTP1
   - Request: Enable SMS-only delivery for this template
4. They can configure your template to force SMS delivery

### Option 2: Keep Manual OTP but check DND
The issue might be the recipient's phone is on DND register. Test with:
- Different phone numbers
- Numbers from different carriers (Airtel, Jio, VI, BSNL)
- Non-DND numbers

## Additional Configuration in 2Factor Dashboard
1. Login to https://2factor.in/CP/
2. Go to "SMS OTP" → "OTP Templates" 
3. Find your "OTP1" template
4. Check if there's an option for "Delivery Method" or "SMS Type"
5. Ensure it's set to "Transactional SMS" not "Voice OTP"

## Test Numbers
- Try with multiple test numbers
- Ensure test numbers are NOT on National Do Not Disturb Registry
- Check: https://www.nccptrai.gov.in/nccpregistry/search.misc

</parameter>
