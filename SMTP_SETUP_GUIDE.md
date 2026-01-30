# SMTP Email Setup Guide for JobKarle

This guide will help you set up email sending using your own domain's SMTP server.

## Required Environment Variables

Add these to your Vercel project's environment variables (Settings > Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | Your SMTP server hostname | `mail.jobkarle.com` or `smtp.jobkarle.com` |
| `SMTP_PORT` | SMTP port number | `587` (TLS) or `465` (SSL) |
| `SMTP_SECURE` | Use SSL connection | `false` for port 587, `true` for port 465 |
| `SMTP_USER` | Email account username | `noreply@jobkarle.com` |
| `SMTP_PASSWORD` | Email account password | Your email password |
| `SMTP_FROM_EMAIL` | From email address | `noreply@jobkarle.com` |
| `SMTP_FROM_NAME` | From display name | `JobKarle` |

## Step-by-Step Setup

### Step 1: Get SMTP Credentials from Your Hosting Provider

If you have a domain (e.g., jobkarle.com), you likely have email hosting. Here's how to find SMTP settings:

#### For cPanel/WHM Hosting (Most Common):
1. Log into your cPanel
2. Go to **Email Accounts** > Create a new email (e.g., `noreply@jobkarle.com`)
3. Click **Connect Devices** or **Set Up Mail Client**
4. Look for **Outgoing Server (SMTP)** settings:
   - Server: `mail.yourdomain.com` or `yourdomain.com`
   - Port: 587 (with TLS) or 465 (with SSL)
   - Username: Full email address
   - Password: The email account password

#### For Hostinger:
1. Log into Hostinger panel
2. Go to **Emails** > **Email Accounts**
3. Create email account (e.g., `noreply@jobkarle.com`)
4. SMTP Settings:
   - Server: `smtp.hostinger.com`
   - Port: 587 (TLS) or 465 (SSL)
   - Username: Full email address
   - Password: Email password

#### For GoDaddy:
1. Log into GoDaddy Email & Office
2. Create Professional Email account
3. SMTP Settings:
   - Server: `smtpout.secureserver.net`
   - Port: 587 or 465
   - Username: Full email address
   - Password: Email password

#### For Namecheap:
1. Log into Namecheap cPanel
2. Go to **Email Accounts** > Create email
3. SMTP Settings:
   - Server: `mail.yourdomain.com`
   - Port: 587 (TLS) or 465 (SSL)
   - Username: Full email address
   - Password: Email password

#### For Zoho Mail:
1. Log into Zoho Mail Admin Console
2. Create user account
3. SMTP Settings:
   - Server: `smtp.zoho.com` (or `smtp.zoho.in` for India)
   - Port: 587 (TLS) or 465 (SSL)
   - Username: Full email address
   - Password: App-specific password (recommended)

### Step 2: Add Environment Variables to Vercel

1. Go to your Vercel Dashboard
2. Select your JobKarle project
3. Go to **Settings** > **Environment Variables**
4. Add each variable:

\`\`\`
SMTP_HOST=mail.jobkarle.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@jobkarle.com
SMTP_PASSWORD=your_email_password_here
SMTP_FROM_EMAIL=noreply@jobkarle.com
SMTP_FROM_NAME=JobKarle
\`\`\`

5. Click **Save** for each variable
6. **Redeploy** your application for changes to take effect

### Step 3: Test Your Configuration

After deploying, test the forgot password feature:
1. Go to `/candidate/forgot-password` or `/employer/forgot-password`
2. Enter a valid email address
3. Check the application logs in Vercel for success/error messages

## Common SMTP Ports

| Port | Security | Description |
|------|----------|-------------|
| 25 | None | Default SMTP (often blocked by ISPs) |
| 587 | STARTTLS | Recommended for submission (most common) |
| 465 | SSL/TLS | Implicit TLS (older but still used) |
| 2525 | STARTTLS | Alternative port (if 587 is blocked) |

## Troubleshooting

### Error: "Connection refused"
- Check if your hosting firewall allows outbound SMTP
- Try different ports (587, 465, 2525)
- Verify SMTP_HOST is correct

### Error: "Authentication failed"
- Verify username is the full email address
- Check password is correct (no extra spaces)
- Some providers require app-specific passwords

### Error: "Certificate error"
- The code already handles self-signed certificates
- If issues persist, try `SMTP_SECURE=false` with port 587

### Emails going to spam
- Set up SPF record in DNS: `v=spf1 include:_spf.yourdomain.com ~all`
- Set up DKIM in your hosting control panel
- Use a consistent "From" address
- Avoid spam trigger words in subject/body

## DNS Records for Better Deliverability

Add these DNS records to improve email deliverability:

### SPF Record (TXT)
\`\`\`
Host: @
Type: TXT
Value: v=spf1 a mx include:_spf.yourdomain.com ~all
\`\`\`

### DMARC Record (TXT)
\`\`\`
Host: _dmarc
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:admin@jobkarle.com
\`\`\`

## Alternative: Use a Transactional Email Service

If your hosting doesn't provide reliable SMTP, consider:

1. **SendGrid** (Free tier: 100 emails/day)
   - SMTP Host: `smtp.sendgrid.net`
   - Port: 587
   - Username: `apikey`
   - Password: Your API key

2. **Mailgun** (Free tier: 5,000 emails/month for 3 months)
   - SMTP Host: `smtp.mailgun.org`
   - Port: 587

3. **AWS SES** (Very cheap: $0.10 per 1,000 emails)
   - Requires AWS account setup

## Need Help?

Contact your hosting provider's support for specific SMTP settings for your domain. They can provide the exact configuration needed.
