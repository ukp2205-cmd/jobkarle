# Email Setup Guide for Password Reset

## Quick Start: Gmail SMTP (Recommended)

The easiest way to get password reset emails working is using Gmail SMTP.

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### Step 2: Add Environment Variables

Add these to your Vercel environment variables (or `.env.local` for development):

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

### Step 3: Test

1. Go to `/candidate/forgot-password` or `/employer/forgot-password`
2. Enter a registered email address
3. Check your email inbox for the reset link
4. Click the link to reset your password

## Alternative: Custom SMTP Server

If you have a custom SMTP server (like your hosting provider's SMTP):

```
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

## Troubleshooting

### Emails not sending?

1. Check console logs for error messages
2. Verify environment variables are set correctly
3. For Gmail: Make sure you're using an App Password, not your regular password
4. Check spam/junk folder
5. Try a different email address to test

### "Missing API key" error?

You can safely ignore Resend-related errors. The system now uses nodemailer instead.

## Production Deployment

When deploying to Vercel:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `EMAIL_USER`, `EMAIL_PASSWORD`, and `EMAIL_FROM`
4. Redeploy your application

## Email Template

The password reset email includes:
- Professional HTML design with JobKarle branding
- Secure reset button
- 30-minute expiration notice
- Plain text fallback
- Security warnings

## Flow Summary

1. User enters email on forgot password page
2. System checks if email exists in database
3. If exists, generates secure token and sends email
4. User clicks link in email
5. Opens reset password page with token
6. User enters new password
7. Password is hashed and saved to database
8. User is redirected to login page
9. User logs in with new password

## Security Features

- Tokens are hashed before storage (bcrypt)
- Tokens expire after 30 minutes
- Original plaintext token never stored
- No indication if email exists (prevents enumeration)
- Secure password hashing with bcrypt
