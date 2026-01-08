# OTP Verification Setup Guide

This guide explains how to set up the manual OTP verification system using 2Factor.in API.

## Prerequisites

1. **2Factor.in Account**: Sign up at [2factor.in](https://2factor.in/)
2. **API Key**: You have been provided with the API key: `c7f445c1-d69f-11f0-a6b2-0200cd936042`

## ✅ Template Status: APPROVED

Your OTP template is now **APPROVED** and ready to use!

- **Template Name**: OTP1
- **Company Name**: Career guideline
- **Sender ID**: JOBKAR
- **Website**: https://careerguideline.co.in/
- **Template**: XXXX is your OTP for JobKarle registration. Valid for 5 minutes. Do not share with anyone.
- **Status**: APPROVED (2025-12-15)

## Environment Variables

Add the following environment variable to your project:

\`\`\`bash
TWO_FACTOR_API_KEY=c7f445c1-d69f-11f0-a6b2-0200cd936042
\`\`\`

**For local development (.env.local):**
\`\`\`
TWO_FACTOR_API_KEY=c7f445c1-d69f-11f0-a6b2-0200cd936042
\`\`\`

**For Vercel deployment:**
Add this variable in your Vercel project settings under Environment Variables or in the Vars section of the v0 in-chat sidebar.

## Database Setup

1. Run the SQL script to create the `phone_verifications` table:
   \`\`\`bash
   # Execute scripts/006_create_phone_verifications.sql in your Supabase project
   \`\`\`

2. The table structure:
   - `id`: UUID primary key
   - `phone_number`: TEXT (unique, format: +91XXXXXXXXXX)
   - `otp_hash`: TEXT (bcrypt hashed OTP)
   - `expires_at`: TIMESTAMPTZ (5 minutes from creation)
   - `created_at`: TIMESTAMPTZ (auto-set)

## API Endpoints

### 1. Send OTP
**POST** `/api/send-otp`

Request:
\`\`\`json
{
  "phoneNumber": "9876543210"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "message": "OTP sent successfully to your phone",
  "sessionId": "otp-session"
}
\`\`\`

### 2. Verify OTP
**POST** `/api/verify-otp`

Request:
\`\`\`json
{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "message": "Phone number verified successfully!"
}
\`\`\`

### 3. Resend OTP
**POST** `/api/resend-otp`

Request:
\`\`\`json
{
  "phoneNumber": "9876543210"
}
\`\`\`

Response: Same as send-otp

**Note**: 30-second cooldown between resend requests.

## Phone Number Format

The system accepts various formats and automatically normalizes them:
- `9876543210` → `+919876543210`
- `919876543210` → `+919876543210`
- `+919876543210` → `+919876543210`

Only valid Indian mobile numbers (starting with 6-9) are accepted.

## Security Features

1. **OTP Hashing**: All OTPs are hashed using bcrypt before storage
2. **Expiry**: OTPs expire after 5 minutes
3. **Auto-cleanup**: Expired OTPs are deleted automatically
4. **Rate Limiting**: 30-second cooldown between resend requests
5. **One-time Use**: OTPs are deleted after successful verification

## Testing

1. **Send OTP**:
   \`\`\`bash
   curl -X POST http://localhost:3000/api/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "9876543210"}'
   \`\`\`

2. **Verify OTP**:
   \`\`\`bash
   curl -X POST http://localhost:3000/api/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "9876543210", "otp": "123456"}'
   \`\`\`

3. **Resend OTP**:
   \`\`\`bash
   curl -X POST http://localhost:3000/api/resend-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "9876543210"}'
   \`\`\`

## Error Handling

The system handles various error scenarios:
- Invalid phone number format
- Expired OTP
- Wrong OTP
- SMS sending failure (deletes stored OTP)
- Rate limiting (cooldown period)
- Database errors

## 2Factor.in API Details

**Endpoint**: `https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/{OTP}/OTP1`

- Method: **GET**
- Phone format: 91XXXXXXXXXX (without +)
- OTP: 6-digit number
- Template: **OTP1** (APPROVED)
- Response: JSON with Status and Details

### ✅ SMS Template - APPROVED

Your approved template details:
- **Template Name**: OTP1
- **Sender ID**: JOBKAR
- **Message**: XXXX is your OTP for JobKarle registration. Valid for 5 minutes. Do not share with anyone.

The code is already configured to use this template. SMS messages will now be delivered instead of voice calls.

## Integration with Candidate Registration

The OTP verification can be integrated into your candidate registration form at Step 2 (Mobile Verification). The form already has the structure in place - just connect it to these API endpoints.

## Testing the SMS Flow

1. **Test with your own number**: Use your personal mobile number to verify SMS delivery
2. **Expected behavior**: SMS should arrive within 5-30 seconds
3. **Check server logs**: Look for `[v0] send-otp:` messages to see API responses
4. **Verify API balance**: Log in to 2Factor.in to check remaining SMS credits

## Success Indicators

When working correctly, you should see:
- ✅ SMS arrives within 5-30 seconds (not voice call)
- ✅ Message shows sender ID "JOBKAR"
- ✅ Message text matches approved template
- ✅ Server logs show `Status: "Success"`
- ✅ OTP verification completes without errors
- ✅ Phone number gets marked as verified in the database

## Troubleshooting

1. **Still receiving voice calls**: 
   - Verify template is approved in 2Factor.in dashboard
   - Check that template name in code matches exactly: "OTP1"
   - Ensure sufficient SMS credits in your account
   
2. **SMS not received**: 
   - Check 2Factor.in account balance
   - Verify phone number format (must be 10 digits starting with 6-9)
   - Check server logs for API error messages
   
3. **Template error**: Template is approved, so this should not occur
   
4. **Database errors**: Verify Supabase connection and table creation

5. **Rate limiting**: Wait 30 seconds between resend attempts
