# PayU Payment Gateway Integration Guide

## Overview

JobKarle now supports payment processing through PayU, India's leading payment gateway. Employers can purchase Classic and Premium credit plans using various payment methods including credit cards, debit cards, UPI, net banking, and digital wallets.

## Setup Instructions

### 1. Get PayU Credentials

1. Sign up for a PayU merchant account at [https://payu.in/](https://payu.in/)
2. Complete the KYC verification process
3. Get your merchant credentials:
   - Merchant Key
   - Merchant Salt
4. Test credentials are available in the PayU dashboard for development

### 2. Configure Environment Variables

Add the following to your `.env` file:

\`\`\`env
# PayU Payment Gateway Configuration
PAYU_MERCHANT_KEY=your_merchant_key_here
PAYU_MERCHANT_SALT=your_merchant_salt_here
PAYU_API_URL=https://secure.payu.in/_payment
NEXT_PUBLIC_APP_URL=https://yourdomain.com
\`\`\`

For testing, use:
\`\`\`env
PAYU_API_URL=https://test.payu.in/_payment
\`\`\`

### 3. Run Database Migration

Execute the payment transactions table migration:

\`\`\`bash
# Run the SQL script in Supabase SQL Editor
# File: scripts/043_create_payment_transactions_table.sql
\`\`\`

This creates:
- `payment_transactions` table
- Indexes for performance
- Row Level Security policies
- Links to `employer_credits` table

## How It Works

### Payment Flow

1. **Plan Selection**
   - Employer visits pricing page
   - Selects Classic or Premium plan
   - Chooses monthly or annual billing

2. **Login/Authentication**
   - If not logged in, employer must login first
   - Modal prompts for credentials
   - After login, proceeds to payment

3. **Payment Initiation**
   - System creates payment transaction record
   - Generates unique merchant transaction ID
   - Calculates PayU hash for security
   - Redirects to PayU payment page

4. **Payment Processing**
   - Employer completes payment on PayU
   - PayU processes the transaction
   - Returns callback to verification endpoint

5. **Payment Verification**
   - System verifies PayU response hash
   - Validates transaction authenticity
   - Updates transaction status

6. **Credit Allocation**
   - On successful payment:
     - Allocates credits based on plan
     - Links credits to payment transaction
     - Updates employer account
   - On failed payment:
     - Records failure reason
     - No credits allocated

7. **Redirect & Confirmation**
   - Success: Redirects to success page with transaction ID
   - Failure: Redirects to failure page with error message

### Payment Transaction States

- **pending**: Initial state when payment initiated
- **success**: Payment completed and credits allocated
- **failed**: Payment failed or was declined
- **cancelled**: Payment cancelled by user

## Testing

### Test Payment

1. Start development server: `npm run dev`
2. Navigate to pricing page: `/employer/pricing`
3. Select a paid plan (Classic or Premium)
4. Login with test employer account
5. Use PayU test cards:
   - **Success**: Card Number `5123456789012346`, CVV `123`, Any future expiry
   - **Failure**: Card Number `4000000000000002`, CVV `123`, Any future expiry

### Test Credentials

PayU provides test credentials in their dashboard:
- Test Merchant Key
- Test Merchant Salt
- Use `https://test.payu.in/_payment` for test transactions

## API Endpoints

### POST `/api/payment/initiate`

Initiates a payment transaction.

**Request:**
\`\`\`json
{
  "employerId": "uuid",
  "planType": "classic" | "premium",
  "billingCycle": "monthly" | "annual",
  "employerName": "Company Name",
  "employerEmail": "email@company.com",
  "employerPhone": "9876543210"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "paymentParams": {
    "key": "merchant_key",
    "txnid": "transaction_id",
    "amount": "4999",
    ...
  },
  "paymentUrl": "https://secure.payu.in/_payment",
  "transactionId": "JOBKARLE_xxx"
}
\`\`\`

### POST `/api/payment/verify`

Verifies payment callback from PayU (internal endpoint).

**Handles:**
- Hash verification
- Transaction validation
- Credit allocation
- Redirect to success/failure pages

## Security Features

1. **Hash Verification**
   - Every payment request includes SHA-512 hash
   - Callback responses are verified against hash
   - Prevents tampering with payment data

2. **Transaction Validation**
   - Unique transaction IDs prevent duplicates
   - Amount validation against plan pricing
   - Employer ID verification

3. **Row Level Security**
   - Employers can only view their own transactions
   - System-level operations for payment processing

## Credit Allocation

### Plan Pricing

| Plan | Credits | Monthly Price | Annual Price |
|------|---------|---------------|--------------|
| Free | 5 | ₹0 | ₹0 |
| Classic | 15 | ₹4,999 | ₹49,990 |
| Premium | 25 | ₹14,999 | ₹1,49,990 |

### Credit Lifecycle

1. **Allocation**: Credits allocated on successful payment
2. **Validity**: 30 days from allocation date
3. **Usage**: 2 credits deducted per job posting
4. **Expiry**: Auto-expired after 30 days

## Monitoring & Debugging

### Check Transaction Status

Query payment transactions table:
\`\`\`sql
SELECT * FROM payment_transactions 
WHERE employer_id = 'employer_uuid' 
ORDER BY created_at DESC;
\`\`\`

### Check Credit Allocation

\`\`\`sql
SELECT * FROM employer_credits 
WHERE employer_id = 'employer_uuid' 
AND is_expired = false;
\`\`\`

### Payment Logs

Server logs include:
- `[v0] Payment initiation...`
- `[v0] Payment callback received...`
- `[v0] Payment hash verified...`
- `[v0] Credits allocated...`

## Troubleshooting

### Payment Failed But Amount Deducted

1. Check `payment_transactions` table for transaction status
2. If status is `pending`, check PayU dashboard
3. If PayU shows success but credits not allocated:
   - Manually run credit allocation
   - Update transaction status
   - Contact support for refund if needed

### Hash Mismatch Error

- Verify `PAYU_MERCHANT_SALT` is correct
- Ensure no extra spaces in environment variables
- Check PayU dashboard for correct credentials

### Credits Not Allocated

1. Check payment transaction status in database
2. Verify `allocated_credit_id` is set
3. Check `employer_credits` table for new record
4. Review server logs for errors

## Support

For PayU-related issues:
- PayU Support: [https://payu.in/support](https://payu.in/support)
- PayU Documentation: [https://docs.payu.in/](https://docs.payu.in/)

For JobKarle integration issues:
- Check server logs
- Review database transaction records
- Contact technical support

## Production Checklist

- [ ] PayU merchant account verified and approved
- [ ] Production merchant key and salt configured
- [ ] `PAYU_API_URL` set to production URL
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Database migration executed on production
- [ ] Payment flow tested end-to-end
- [ ] Webhook/callback URLs whitelisted in PayU
- [ ] SSL certificate active on domain
- [ ] Error handling and logging configured
- [ ] Refund process documented
- [ ] Support team trained on payment issues
