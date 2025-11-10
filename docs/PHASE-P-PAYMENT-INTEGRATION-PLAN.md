# Phase P: Payment Integration Implementation Plan

## Overview
Integrate Stripe payment gateway to enable customers to pay invoices directly through the customer portal. This completes the booking-to-payment cycle and enables automated revenue collection.

## Business Value
- **Direct Revenue**: Customers can pay invoices instantly online
- **Reduced Manual Work**: No more manual payment tracking and follow-ups
- **Faster Cash Flow**: Immediate payment processing and confirmation
- **Better Customer Experience**: Self-service payment from anywhere
- **Professional Image**: Modern, secure payment processing

---

## Phase P.1: Stripe Payment Integration

### P.1.1: Setup & Configuration

**Backend Dependencies:**
```bash
npm install stripe
```

**Frontend Dependencies:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Environment Variables (.env):**
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=USD
```

**Stripe Account Setup:**
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Set up webhook endpoint for payment events
4. Configure webhook secret

---

### P.1.2: Backend Implementation

#### Payment Model Schema
**File:** `backend/src/models/Payment.js`

```javascript
const paymentSchema = new mongoose.Schema({
  tenantId: { type: ObjectId, ref: 'Tenant', required: true },
  invoiceId: { type: ObjectId, ref: 'Invoice', required: true },
  customerId: { type: ObjectId, ref: 'Customer', required: true },
  
  // Stripe details
  stripePaymentIntentId: { type: String, unique: true },
  stripeChargeId: String,
  
  // Payment info
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Payment method
  paymentMethod: {
    type: { type: String }, // card, bank_transfer, etc.
    last4: String,
    brand: String, // visa, mastercard, etc.
  },
  
  // Transaction details
  receiptUrl: String,
  receiptNumber: String,
  paidAt: Date,
  failureReason: String,
  
  // Refund info
  refunded: { type: Boolean, default: false },
  refundAmount: Number,
  refundedAt: Date,
  refundReason: String,
  
  metadata: Object,
}, { timestamps: true });
```

#### Payment Controller
**File:** `backend/src/controllers/paymentController.js`

**Key Endpoints:**
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/confirm` - Confirm payment success
- `POST /payments/webhook` - Handle Stripe webhooks
- `GET /payments/:id` - Get payment details
- `GET /payments/invoice/:invoiceId` - Get payments for invoice
- `POST /payments/:id/refund` - Process refund (agent only)

#### Payment Routes
**File:** `backend/src/routes/paymentRoutes.js`

```javascript
// Customer routes (protected with customerAuth)
router.post('/create-intent', customerAuth, paymentController.createPaymentIntent);
router.post('/confirm', customerAuth, paymentController.confirmPayment);
router.get('/invoice/:invoiceId', customerAuth, paymentController.getInvoicePayments);
router.get('/:id', customerAuth, paymentController.getPaymentDetails);

// Webhook (no auth - verified by Stripe signature)
router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);

// Agent routes (protected with auth)
router.post('/:id/refund', auth, paymentController.processRefund);
```

---

### P.1.3: Frontend Implementation

#### Payment Service
**File:** `frontend/src/services/paymentAPI.js`

```javascript
export const createPaymentIntent = async (invoiceId, amount) => {
  const response = await customerAPI.post('/payments/create-intent', {
    invoiceId,
    amount,
  });
  return response.data;
};

export const confirmPayment = async (paymentIntentId) => {
  const response = await customerAPI.post('/payments/confirm', {
    paymentIntentId,
  });
  return response.data;
};

export const getPaymentHistory = async (invoiceId) => {
  const response = await customerAPI.get(`/payments/invoice/${invoiceId}`);
  return response.data;
};
```

#### Payment Component
**File:** `frontend/src/components/customer/PaymentForm.jsx`

**Features:**
- Stripe Elements integration
- Card input with validation
- Payment processing indicator
- Error handling
- Success confirmation

#### Invoice Page Updates
**File:** `frontend/src/pages/customer/Invoices.jsx`

**Add:**
- "Pay Now" button for unpaid/partially paid invoices
- Payment modal with Stripe checkout
- Payment history section
- Receipt download links

---

### P.1.4: Payment Flow

#### Customer Payment Flow:
1. Customer views invoice with outstanding balance
2. Clicks "Pay Now" button
3. Payment modal opens with Stripe card form
4. Customer enters card details
5. Submits payment
6. Backend creates payment intent
7. Stripe processes payment
8. Webhook updates payment status
9. Invoice status updated (if fully paid)
10. Payment confirmation email sent
11. Customer redirected to success page

#### Webhook Events to Handle:
- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed
- `payment_intent.canceled` - Payment canceled

---

### P.1.5: Email Notifications

#### Payment Confirmation Email
**Template:** `backend/src/templates/emails/paymentConfirmation.js`

**Content:**
- Payment amount and date
- Invoice number and details
- Receipt download link
- Remaining balance (if partial payment)
- Contact information

#### Payment Failed Email
**Template:** `backend/src/templates/emails/paymentFailed.js`

**Content:**
- Failure reason
- Retry payment link
- Alternative payment methods
- Support contact

---

### P.1.6: Security Considerations

**Backend:**
- Validate webhook signatures from Stripe
- Verify payment amounts match invoice amounts
- Check customer owns the invoice being paid
- Prevent duplicate payments (idempotency)
- Log all payment attempts and results

**Frontend:**
- Never expose secret keys (use publishable key only)
- Use Stripe Elements for PCI compliance
- Validate amounts before submission
- Handle card errors gracefully
- Show clear payment status

---

### P.1.7: Testing Strategy

**Test with Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
3D Secure: 4000 0025 0000 3155
```

**Test Scenarios:**
1. Successful payment (full amount)
2. Successful payment (partial amount)
3. Failed payment (declined card)
4. Failed payment (insufficient funds)
5. Payment with 3D Secure authentication
6. Webhook delivery and processing
7. Invoice status updates
8. Email notifications
9. Receipt generation
10. Refund processing (agent side)

---

## Phase P.2: Payment Management (Future)

### Features:
- Payment history page for customers
- Download receipts/invoices as PDF
- Save payment methods for future use
- Set up recurring payments
- Split payments across multiple cards
- Payment reminders and notifications
- Refund request system
- Payment analytics for agents

---

## Phase P.3: Additional Payment Gateways (Future)

### Potential Gateways:
- **PayPal** - Popular alternative
- **Razorpay** - India market
- **Square** - North America
- **Authorize.Net** - Traditional merchants
- **Bank Transfer** - Manual verification
- **Cryptocurrency** - Modern option

---

## Implementation Timeline

**Week 1:**
- Day 1-2: Setup Stripe account, install packages, configure environment
- Day 3-4: Build backend payment models and controllers
- Day 5: Create payment routes and webhook handling

**Week 2:**
- Day 1-2: Build frontend payment components with Stripe Elements
- Day 3: Integrate payment flow into invoice page
- Day 4: Create success/failure pages and email templates
- Day 5: Testing with test cards and webhook events

**Week 3:**
- Day 1-2: Bug fixes and refinements
- Day 3: Production Stripe account setup
- Day 4: Deploy and monitor
- Day 5: Documentation and team training

---

## Success Metrics

**Technical:**
- ✅ Payment success rate > 95%
- ✅ Webhook processing < 2 seconds
- ✅ Zero duplicate charges
- ✅ PCI compliance maintained

**Business:**
- ✅ 50%+ of invoices paid online
- ✅ Average payment time reduced by 5+ days
- ✅ Customer satisfaction improved
- ✅ Manual payment processing reduced by 80%

---

## Documentation

### For Customers:
- How to pay an invoice online
- Supported payment methods
- Security and PCI compliance
- Receipt and invoice downloads
- Payment troubleshooting

### For Agents:
- How to process refunds
- How to handle payment disputes
- Payment reconciliation process
- Stripe dashboard overview

---

## Next Steps

1. **Get Approval** - Confirm go-ahead for Stripe integration
2. **Create Stripe Account** - Set up test account
3. **Start with P.1.1** - Install packages and configure environment
4. **Build Incrementally** - Complete each phase before moving to next
5. **Test Thoroughly** - Use all test card scenarios
6. **Document Everything** - Keep records of API calls and webhooks

---

## Questions to Answer Before Starting:

1. Do you have a Stripe account, or should we create one?
2. What currency/currencies do you want to support?
3. Do you want to support partial payments?
4. Should customers be able to save cards for future use?
5. Do you need payment plans/installments?
6. What's your refund policy?

---

**Ready to start? Let's begin with Phase P.1.1! 🚀**
