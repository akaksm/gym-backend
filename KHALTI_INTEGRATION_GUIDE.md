# Khalti Payment Integration Guide

## Overview
This gym management system integrates Khalti wallet for online payments in Nepal. The integration supports payment initiation, verification, webhooks, and refunds.

## Required Environment Variables

Add these to your `.env` file:

```env
# Khalti Payment Gateway Configuration
KHALTI_BASE_URL=https://a.khalti.com/api/v2
KHALTI_SECRET_KEY=your_khalti_secret_key_here
KHALTI_PUBLIC_KEY=your_khalti_public_key_here
KHALTI_WEBHOOK_SECRET=your_khalti_webhook_secret_here

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### 1. Initiate Payment
```
POST /api/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "membershipTypeId": "membership_type_id",
  "userId": "user_id"
}
```

### 2. Verify Payment (Frontend Callback)
```
GET /api/payments/verify?token=<khalti_token>
```

### 3. Khalti Webhook
```
POST /api/payments/webhook/khalti
Content-Type: application/json
X-Khalti-Secret: <webhook_signature>

{
  "token": "khalti_payment_token",
  "transaction_id": "khalti_transaction_id",
  "status": "Completed"
}
```

### 4. Get User Payments
```
GET /api/payments/user/:userId
Authorization: Bearer <token>
```

### 5. Get Payment Details
```
GET /api/payments/:id
Authorization: Bearer <token>
```

### 6. Process Refund (Admin)
```
POST /api/payments/refund/:paymentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "refundAmount": 1000,
  "reason": "Customer request"
}
```

## Payment Flow

1. **Initiate Payment**: User selects membership → System creates payment record → Khalti payment URL generated
2. **User Payment**: User redirected to Khalti → Completes payment → Redirected back to success page
3. **Verification**: System verifies payment with Khalti → Updates payment status → Activates membership
4. **Webhook**: Khalti sends instant notification → System processes webhook → Double verification
5. **Refund**: Admin can process refunds → Khalti refund API called → Membership deactivated

## Security Features

- ✅ Webhook signature verification
- ✅ Payment token validation
- ✅ Double verification (callback + webhook)
- ✅ Amount validation
- ✅ Transaction ID tracking
- ✅ Error handling and logging

## Testing

### Test Mode
For testing, use Khalti's test credentials:
- Test Public Key: `test_public_key_<merchant_id>`
- Test Secret Key: `test_secret_key_<merchant_id>`

### Test Card Numbers
- Success: `9800000001`
- Failure: `9800000002`

## Common Issues & Solutions

### 1. Webhook Not Receiving
- Check webhook URL in Khalti dashboard
- Verify webhook secret matches
- Ensure server is accessible from internet

### 2. Payment Verification Fails
- Check Khalti credentials
- Verify amount conversion (NPR to paisa)
- Check transaction token validity

### 3. Redirect Issues
- Verify FRONTEND_URL environment variable
- Check CORS configuration
- Ensure proper URL encoding

## Production Checklist

- [ ] Use production Khalti credentials
- [ ] Set up SSL certificate
- [ ] Configure proper webhook URL
- [ ] Set up monitoring and logging
- [ ] Test all payment scenarios
- [ ] Implement proper error handling
- [ ] Set up backup verification methods

## Support

For Khalti API issues, refer to:
- [Khalti API Documentation](https://docs.khalti.com/)
- [Khalti Developer Portal](https://developer.khalti.com/) 