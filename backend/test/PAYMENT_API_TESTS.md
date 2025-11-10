# Payment API Integration Tests

## Test Scenarios

### 1. Create Payment Intent
**Endpoint:** `POST /api/v1/customer/payments/create-intent`
**Auth:** Customer token required

#### Test Case 1.1: Successful payment intent creation
```json
Request:
{
  "invoiceId": "65f8a9b3c464bf35e0adede29",
  "amount": 1000,
  "currency": "INR",
  "saveCard": false
}

Expected Response (201):
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "paymentId": "...",
    "clientSecret": "pi_test_..._secret_...",
    "amount": 1000,
    "currency": "INR",
    "formattedAmount": "₹1,000.00"
  }
}
```

#### Test Case 1.2: Amount exceeds invoice balance
```json
Request:
{
  "invoiceId": "65f8a9b3c464bf35e0adede29",
  "amount": 999999,
  "currency": "INR"
}

Expected Response (500):
{
  "success": false,
  "message": "Payment amount (999999) exceeds outstanding balance (...)"
}
```

#### Test Case 1.3: Invalid currency
```json
Request:
{
  "invoiceId": "65f8a9b3c464bf35e0adede29",
  "amount": 1000,
  "currency": "JPY"
}

Expected Response (400):
{
  "success": false,
  "message": "Currency JPY is not supported"
}
```

#### Test Case 1.4: Amount below minimum
```json
Request:
{
  "invoiceId": "65f8a9b3c464bf35e0adede29",
  "amount": 50,
  "currency": "INR"
}

Expected Response (400):
{
  "success": false,
  "message": "Amount 50 is below minimum 100 for INR"
}
```

### 2. Payment History
**Endpoint:** `GET /api/v1/customer/payments/history`
**Auth:** Customer token required

#### Test Case 2.1: Get customer payment history
```
Request: GET /api/v1/customer/payments/history

Expected Response (200):
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "...",
        "amount": 1000,
        "currency": "INR",
        "formattedAmount": "₹1,000.00",
        "status": "succeeded",
        "paymentMethod": { "type": "card", "card": {...} },
        "receiptNumber": "RCP-...",
        "paidAt": "2024-01-15T10:30:00Z",
        "invoice": {
          "id": "...",
          "number": "INV-001",
          "total": 2000
        }
      }
    ],
    "total": 1
  }
}
```

### 3. Invoice Payments
**Endpoint:** `GET /api/v1/customer/payments/invoice/:invoiceId`
**Auth:** Customer token required

#### Test Case 3.1: Get payments for specific invoice
```
Request: GET /api/v1/customer/payments/invoice/65f8a9b3c464bf35e0adede29

Expected Response (200):
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "...",
        "amount": 500,
        "currency": "INR",
        "formattedAmount": "₹500.00",
        "status": "succeeded",
        "paymentMethod": {...},
        "receiptNumber": "RCP-...",
        "paidAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-15T10:25:00Z"
      }
    ],
    "total": 1
  }
}
```

### 4. Stripe Webhook Events
**Endpoint:** `POST /api/v1/payments/webhook`
**Auth:** Stripe signature verification

#### Test Case 4.1: Payment succeeded webhook
```json
Stripe Event:
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_test_123",
      "amount": 100000,
      "currency": "inr",
      "status": "succeeded",
      "charges": {
        "data": [{
          "id": "ch_test_123",
          "receipt_url": "https://...",
          "payment_method_details": {
            "type": "card",
            "card": {
              "brand": "visa",
              "last4": "4242",
              "exp_month": 12,
              "exp_year": 2025
            }
          }
        }]
      }
    }
  }
}

Expected: 
- Payment status updated to "succeeded"
- Invoice updated (amountPaid, balance, status)
- Payment receipt generated
```

#### Test Case 4.2: Payment failed webhook
```json
Stripe Event:
{
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_test_123",
      "last_payment_error": {
        "message": "Your card was declined",
        "code": "card_declined"
      }
    }
  }
}

Expected:
- Payment status updated to "failed"
- Failure reason and code saved
```

### 5. Agent Payment Management
**Endpoint:** `GET /api/v1/agent-payments`
**Auth:** Agent/Admin token required

#### Test Case 5.1: Get all payments for tenant
```
Request: GET /api/v1/agent-payments?status=succeeded&startDate=2024-01-01

Expected Response (200):
{
  "success": true,
  "data": {
    "payments": [...],
    "summary": {
      "total": 10,
      "totalAmount": 15000,
      "totalRefunded": 500,
      "netAmount": 14500,
      "currency": "INR"
    }
  }
}
```

### 6. Refund Processing
**Endpoint:** `POST /api/v1/agent-payments/:id/refund`
**Auth:** Agent/Admin token required

#### Test Case 6.1: Full refund
```json
Request:
{
  "amount": 1000,
  "reason": "Customer cancellation"
}

Expected Response (200):
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "payment": {
      "id": "...",
      "status": "refunded",
      "refunded": true,
      "refundAmount": 1000,
      "formattedRefundAmount": "₹1,000.00",
      "refundedAt": "2024-01-15T11:00:00Z",
      "refundReason": "Customer cancellation"
    },
    "refund": {
      "id": "re_test_123",
      "status": "succeeded"
    }
  }
}
```

#### Test Case 6.2: Partial refund
```json
Request:
{
  "amount": 500,
  "reason": "Partial service cancellation"
}

Expected: Similar to above with refundAmount: 500
```

## Stripe Test Cards

Use these test cards for testing different payment scenarios:

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Insufficient Funds:** 4000 0000 0000 9995
- **3D Secure Required:** 4000 0025 0000 3155
- **Processing Error:** 4000 0000 0000 0119

## Manual Testing Checklist

- [ ] Create payment intent with valid invoice
- [ ] Try payment with amount exceeding balance
- [ ] Test multi-currency (INR, USD, EUR)
- [ ] Test partial payment on invoice
- [ ] Complete payment flow with test card
- [ ] Verify invoice status updates after payment
- [ ] Check payment history displays correctly
- [ ] Test webhook event handling (use Stripe CLI)
- [ ] Process refund and verify invoice updates
- [ ] Test payment with 3D Secure card
- [ ] Verify receipt generation
- [ ] Check saved payment methods (if enabled)

## Stripe CLI Testing

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/v1/payments/webhook

# Trigger test webhook events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```
