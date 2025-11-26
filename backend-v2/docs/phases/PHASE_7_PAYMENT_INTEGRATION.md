# Phase 7: Payment Gateway Integration

**Status:** 🟡 Partial (30% Complete)  
**Priority:** P0 (Critical - Blocking Revenue)  
**Estimated Time:** 5-6 days  
**Dependencies:** Phase 5 (Booking Management), Phase 6 (Quotes)

## Overview

Complete payment gateway integration with Stripe, Razorpay, and PayPal webhooks, refund processing, invoice generation, and accounting ledger.

## Current Implementation Status

### ✅ Implemented (30%)
- [x] Payment model with basic fields
- [x] Payment transaction tracking
- [x] Gateway fields (Stripe, PayPal, Square)
- [x] Auto-generated transaction IDs
- [x] Payment controller with CRUD
- [x] Payment routes
- [x] Basic validation schemas

### ❌ Missing (70%)
- [ ] **Stripe integration** (payment intents, webhooks)
- [ ] **Razorpay integration** (orders, webhooks)
- [ ] **PayPal integration** (orders, webhooks)
- [ ] **Webhook signature verification**
- [ ] **Idempotency handling**
- [ ] **Refund processing** (full/partial)
- [ ] **Invoice generation** with numbering
- [ ] **Invoice PDFs**
- [ ] **Ledger system** (AR/AP)
- [ ] **Commission settlement**
- [ ] **Multi-currency** support with FX rates
- [ ] **Payment failure handling**
- [ ] **Retry logic** for failed payments
- [ ] **3D Secure** support
- [ ] **Payment disputes** handling

## Database Models

### Invoice Schema (NEW - To Implement)

```javascript
const invoiceSchema = new mongoose.Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Invoice identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Related entities
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },

  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    index: true,
  },

  customer: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    taxId: String, // GST/VAT number
  },

  // Invoice details
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now,
  },

  dueDate: {
    type: Date,
    required: true,
  },

  // Line items
  lineItems: [{
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    taxRate: Number,
    taxAmount: Number,
  }],

  // Pricing
  subtotal: {
    type: Number,
    required: true,
  },

  discountTotal: {
    type: Number,
    default: 0,
  },

  taxTotal: {
    type: Number,
    required: true,
  },

  grandTotal: {
    type: Number,
    required: true,
  },

  currency: {
    type: String,
    default: 'USD',
  },

  // Payment tracking
  amountPaid: {
    type: Number,
    default: 0,
  },

  balance: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
    default: 'draft',
    index: true,
  },

  // PDF
  pdfUrl: String,
  pdfGeneratedAt: Date,

  // Notes
  notes: String,
  termsAndConditions: String,

  // Tracking
  sentAt: Date,
  paidAt: Date,
  cancelledAt: Date,

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
invoiceSchema.index({ tenant: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenant: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ 'customer.email': 1 });

// Static: Generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function(tenantId) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await this.countDocuments({
    tenant: tenantId,
    invoiceNumber: new RegExp(`^INV-${year}${month}-`),
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};

// Method: Mark as paid
invoiceSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paidAt = new Date();
  this.amountPaid = this.grandTotal;
  this.balance = 0;
};

// Method: Record partial payment
invoiceSchema.methods.recordPayment = function(amount) {
  this.amountPaid += amount;
  this.balance = this.grandTotal - this.amountPaid;
  
  if (this.balance <= 0) {
    this.status = 'paid';
    this.paidAt = new Date();
  } else {
    this.status = 'partial';
  }
};
```

### Ledger Schema (NEW - To Implement)

```javascript
const ledgerSchema = new mongoose.Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Entry identification
  entryNumber: {
    type: String,
    required: true,
    unique: true,
  },

  // Entry type
  entryType: {
    type: String,
    required: true,
    enum: ['payment', 'refund', 'commission', 'adjustment', 'settlement'],
    index: true,
  },

  // Related entities
  entityType: {
    type: String,
    required: true,
    enum: ['booking', 'payment', 'invoice', 'supplier', 'agent'],
    index: true,
  },

  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },

  // Double-entry bookkeeping
  debit: {
    account: {
      type: String,
      required: true,
      enum: ['cash', 'accounts_receivable', 'accounts_payable', 'commission_payable', 'revenue', 'refunds'],
    },
    amount: {
      type: Number,
      required: true,
    },
  },

  credit: {
    account: {
      type: String,
      required: true,
      enum: ['cash', 'accounts_receivable', 'accounts_payable', 'commission_payable', 'revenue', 'refunds'],
    },
    amount: {
      type: Number,
      required: true,
    },
  },

  // Currency
  currency: {
    type: String,
    default: 'USD',
  },

  fxRate: Number, // If multi-currency

  // Description
  description: {
    type: String,
    required: true,
  },

  notes: String,

  // Date
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },

  // Reference
  referenceNumber: String,

  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false,
  },

  reconciledAt: Date,

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
ledgerSchema.index({ tenant: 1, transactionDate: 1 });
ledgerSchema.index({ tenant: 1, entryType: 1, entityType: 1 });
```

### Update Payment Model (Enhancements)

```javascript
// Add to existing Payment model:

// Stripe fields
stripe: {
  paymentIntentId: String,
  clientSecret: String,
  chargeId: String,
  refundId: String,
},

// Razorpay fields
razorpay: {
  orderId: String,
  paymentId: String,
  signature: String,
  refundId: String,
},

// PayPal fields
paypal: {
  orderId: String,
  captureId: String,
  refundId: String,
},

// 3D Secure
threeDSecure: {
  required: Boolean,
  status: String,
  redirectUrl: String,
},

// Refund tracking
refunds: [{
  refundId: String,
  amount: Number,
  reason: String,
  status: String,
  processedAt: Date,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}],

// Disputes
disputes: [{
  disputeId: String,
  reason: String,
  amount: Number,
  status: String,
  evidence: [String],
  resolvedAt: Date,
}],

// Webhook tracking
webhookEvents: [{
  eventId: String,
  eventType: String,
  receivedAt: Date,
  processed: Boolean,
}],

// Idempotency
idempotencyKey: {
  type: String,
  index: true,
  sparse: true,
},
```

## API Endpoints

```javascript
// ========== Payment Gateway Configuration ==========

// Configure Stripe
POST /finance/gateways/stripe/configure
Body: { publishableKey, secretKey, webhookSecret }

// Configure Razorpay
POST /finance/gateways/razorpay/configure
Body: { keyId, keySecret, webhookSecret }

// Configure PayPal
POST /finance/gateways/paypal/configure
Body: { clientId, clientSecret, webhookId }

// Get active gateways
GET /finance/gateways

// ========== Payment Intents/Orders ==========

// Create Stripe payment intent
POST /finance/payments/stripe/create-intent
Body: { bookingId, amount, currency, metadata }

// Create Razorpay order
POST /finance/payments/razorpay/create-order
Body: { bookingId, amount, currency }

// Create PayPal order
POST /finance/payments/paypal/create-order
Body: { bookingId, amount, currency }

// Confirm payment (after client-side completion)
POST /finance/payments/:id/confirm

// ========== Webhooks ==========

// Stripe webhook endpoint
POST /finance/webhooks/stripe

// Razorpay webhook endpoint
POST /finance/webhooks/razorpay

// PayPal webhook endpoint
POST /finance/webhooks/paypal

// ========== Refunds ==========

// Process refund
POST /finance/payments/:id/refund
Body: { amount (optional for partial), reason }

// Get refund status
GET /finance/refunds/:refundId

// List refunds
GET /finance/refunds

// ========== Invoices ==========

// Create invoice
POST /finance/invoices/create
Body: { bookingId, paymentId, customer, lineItems, dueDate }

// Get invoice
GET /finance/invoices/:id

// List invoices
GET /finance/invoices
Query: status, customerId, dateFrom, dateTo

// Generate invoice PDF
POST /finance/invoices/:id/generate-pdf

// Send invoice via email
POST /finance/invoices/:id/send

// Mark invoice as paid
POST /finance/invoices/:id/mark-paid

// Record partial payment
POST /finance/invoices/:id/record-payment
Body: { amount }

// ========== Ledger ==========

// Get ledger entries
GET /finance/ledger
Query: entityType, entityId, dateFrom, dateTo, account

// Get balance sheet
GET /finance/ledger/balance-sheet
Query: asOfDate

// Get profit & loss
GET /finance/ledger/profit-loss
Query: dateFrom, dateTo

// Reconcile entry
POST /finance/ledger/:id/reconcile

// ========== Multi-Currency ==========

// Get FX rates
GET /finance/fx-rates
Query: from, to, date

// Convert amount
POST /finance/fx-convert
Body: { amount, from, to }
```

## Implementation Steps

### Step 1: Stripe Integration (1.5 days)
- [ ] Install: `npm install stripe`
- [ ] Create `src/services/stripeService.js`
- [ ] Implement `createPaymentIntent()`
- [ ] Implement `confirmPayment()`
- [ ] Implement `processRefund()`
- [ ] Implement webhook handler
- [ ] Implement signature verification
- [ ] Handle webhook events (payment_intent.succeeded, payment_intent.failed, charge.refunded)
- [ ] Store credentials in env/vault

### Step 2: Razorpay Integration (1 day)
- [ ] Install: `npm install razorpay`
- [ ] Create `src/services/razorpayService.js`
- [ ] Implement `createOrder()`
- [ ] Implement `verifySignature()`
- [ ] Implement `processRefund()`
- [ ] Implement webhook handler
- [ ] Handle webhook events

### Step 3: PayPal Integration (1 day)
- [ ] Install: `npm install @paypal/checkout-server-sdk`
- [ ] Create `src/services/paypalService.js`
- [ ] Implement `createOrder()`
- [ ] Implement `captureOrder()`
- [ ] Implement `processRefund()`
- [ ] Implement webhook handler
- [ ] Verify webhook signatures

### Step 4: Invoice System (1 day)
- [ ] Create Invoice model
- [ ] Create `src/controllers/invoiceController.js`
- [ ] Implement CRUD operations
- [ ] Implement PDF generation
- [ ] Implement email delivery
- [ ] Implement payment tracking

### Step 5: Ledger System (1 day)
- [ ] Create Ledger model
- [ ] Create `src/controllers/ledgerController.js`
- [ ] Implement double-entry recording
- [ ] Implement balance sheet calculation
- [ ] Implement P&L calculation
- [ ] Implement reconciliation

### Step 6: Multi-Currency (0.5 day)
- [ ] Integrate FX rates API (e.g., exchangerate-api.com)
- [ ] Create `src/services/fxService.js`
- [ ] Implement rate caching
- [ ] Implement conversion

### Step 7: Refund & Disputes (0.5 day)
- [ ] Implement refund processing
- [ ] Add refund tracking to payments
- [ ] Implement dispute handling
- [ ] Add notifications for disputes

### Step 8: Testing (1 day)
- [ ] Create `tests/integration/payment-gateways.test.js`
- [ ] Test Stripe integration (use test mode)
- [ ] Test webhook handling with idempotency
- [ ] Test refund processing
- [ ] Test invoice generation
- [ ] Test ledger entries
- [ ] Test multi-currency conversion

## Testing Strategy

### Unit Tests
- [ ] Test webhook signature verification
- [ ] Test idempotency key handling
- [ ] Test double-entry ledger balance
- [ ] Test FX rate caching
- [ ] Test invoice numbering

### Integration Tests
- [ ] Test complete payment flow (create intent → confirm → webhook)
- [ ] Test refund flow (full and partial)
- [ ] Test invoice creation and PDF generation
- [ ] Test multi-currency payments
- [ ] Test duplicate webhook handling (idempotency)
- [ ] Test payment failures
- [ ] Test 3D Secure flow

### Webhook Tests
- [ ] Test Stripe webhook events
- [ ] Test Razorpay webhook events
- [ ] Test PayPal webhook events
- [ ] Test invalid signatures rejected
- [ ] Test duplicate events ignored

## Acceptance Criteria

- [ ] Stripe payment intents create successfully
- [ ] Razorpay orders create successfully
- [ ] PayPal orders create successfully
- [ ] Webhooks verify signatures correctly
- [ ] Duplicate webhooks are idempotent
- [ ] Refunds process correctly (full and partial)
- [ ] Invoices generate with sequential numbering
- [ ] Invoice PDFs include all required fields
- [ ] Ledger maintains double-entry balance
- [ ] Multi-currency payments store FX rate
- [ ] Payment failures are logged
- [ ] 3D Secure redirects work
- [ ] All tests pass (>80% coverage)

## TODO Checklist

### Stripe
- [ ] Install Stripe SDK
- [ ] Create stripeService.js
- [ ] Payment intent creation
- [ ] Webhook handler
- [ ] Signature verification
- [ ] Refund processing
- [ ] Test mode integration

### Razorpay
- [ ] Install Razorpay SDK
- [ ] Create razorpayService.js
- [ ] Order creation
- [ ] Signature verification
- [ ] Webhook handler
- [ ] Refund processing

### PayPal
- [ ] Install PayPal SDK
- [ ] Create paypalService.js
- [ ] Order creation
- [ ] Order capture
- [ ] Webhook handler
- [ ] Refund processing

### Invoices
- [ ] Create Invoice model
- [ ] Create invoiceController.js
- [ ] Invoice numbering
- [ ] PDF generation
- [ ] Email delivery
- [ ] Payment tracking

### Ledger
- [ ] Create Ledger model
- [ ] Create ledgerController.js
- [ ] Double-entry recording
- [ ] Balance sheet
- [ ] Profit & loss
- [ ] Reconciliation

### Multi-Currency
- [ ] FX rates API integration
- [ ] Create fxService.js
- [ ] Rate caching
- [ ] Conversion logic

### Testing
- [ ] Payment gateway tests
- [ ] Webhook tests
- [ ] Refund tests
- [ ] Invoice tests
- [ ] Ledger tests
- [ ] Multi-currency tests

### Documentation
- [ ] Update API docs
- [ ] Payment flow diagrams
- [ ] Webhook setup guide
- [ ] Test mode credentials

## Dependencies

**NPM Packages:**
```bash
npm install stripe razorpay @paypal/checkout-server-sdk
```

**Environment Variables:**
```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_MODE=sandbox

# FX Rates
FX_RATES_API_KEY=...
FX_RATES_CACHE_TTL=86400
```

## Notes

- Always use test mode during development
- Webhook signatures MUST be verified
- Implement idempotency for all webhooks
- Store all webhook events for audit
- Refunds can take 5-10 days to process
- Monitor failed payments and retry
- Keep ledger balanced at all times
- FX rates should be cached (update daily)
- PCI compliance: Never store card numbers
