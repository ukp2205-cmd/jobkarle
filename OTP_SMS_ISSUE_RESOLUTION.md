# OTP SMS Delivery Issue - Action Required

## Problem
OTPs are being sent successfully via the 2Factor.in API, but users are receiving **voice calls** instead of **SMS text messages**.

## Root Cause
The 2Factor.in template "OTP1" (Sender ID: JOBKAR) is configured for voice delivery or has voice as a fallback when SMS fails.

## Solution - Contact 2Factor Support

### Email Template

**To:** support@2factor.in  
**Subject:** Configure Template OTP1 for SMS-Only Delivery (No Voice Calls)

**Body:**
```
Hello 2Factor Support Team,

Account Details:
- Email: umakanta.patro@careerguideline.co.in
- API Key: c7f445c1-d69f-11f0-a6b2-0200cd936042
- Phone: 9337951988
- Template Name: OTP1
- Sender ID: JOBKAR

Issue: All OTPs are being delivered via VOICE CALLS instead of SMS text messages.

API Endpoint Being Used:
https://2factor.in/API/V1/{API_KEY}/SMS/{phone}/{otp}/OTP1

Request: Please configure template "OTP1" to:
1. Send OTPs ONLY via SMS (text message)
2. Use Transactional SMS credits (Balance: 200+)
3. DISABLE voice call delivery completely
4. Never fall back to voice calls under any circumstances

The API returns Success status, but users receive voice calls. We need 
SMS delivery only for better user experience.

Please confirm once this is configured.

Thank you.
```

## Alternative: Create New SMS-Only Template

If the above doesn't work, ask 2Factor to create a NEW template specifically for SMS:

1. Template Name: `OTP_SMS_ONLY`
2. Delivery Method: **SMS Only** (no voice fallback)
3. Message: `XXXX is your OTP for JobKarle registration. Valid for 5 minutes. Do not share.`
4. Sender ID: `JOBKAR`

Then update the code to use `OTP_SMS_ONLY` instead of `OTP1`.

## Temporary Workaround

While waiting for 2Factor support response:
- Test with non-DND numbers (corporate numbers work better)
- Users can still enter the OTP received via voice call
- The OTP verification logic is working correctly

## Technical Details

The issue is NOT in our code. Our implementation:
- ✅ Formats phone numbers correctly (+917204543387)
- ✅ Sends manual OTP (not AUTOGEN) with template
- ✅ Uses approved template "OTP1"
- ✅ Gets Success response from 2Factor API
- ✅ Stores OTP hash correctly in database
- ✅ Verifies OTP correctly
- ✅ Sets otp_verified=true after successful verification

The problem is 2Factor's template configuration on their server side.
