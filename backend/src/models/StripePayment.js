/**
 * Stripe Payment Model
 * Tracks online payment transactions through Stripe gateway
 * Separate from internal Payment model for booking/commission tracking
 */

const mongoose = require('mongoose');

const stripePaymentSchema = new mongoose.Schema(
  {
    // Multi-tenancy
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // References
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },

    // Stripe Integration
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeChargeId: {
      type: String,
      sparse: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripePaymentMethodId: {
      type: String,
    },

    // Payment Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['INR', 'USD', 'EUR'],
      default: 'INR',
    },
    
    // Status
    status: {
      type: String,
      enum: [
        'pending',       // Payment intent created, awaiting payment
        'processing',    // Payment is being processed
        'requires_action', // Requires customer action (3D Secure)
        'succeeded',     // Payment successful
        'failed',        // Payment failed
        'canceled',      // Payment canceled
        'refunded',      // Payment refunded
      ],
      default: 'pending',
      index: true,
    },

    // Payment Method Info
    paymentMethod: {
      type: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'bank_transfer'],
        default: 'card',
      },
      // Card details (last 4 digits, brand)
      card: {
        last4: String,
        brand: String, // visa, mastercard, amex, etc.
        expiryMonth: Number,
        expiryYear: Number,
        funding: String, // credit, debit, prepaid
      },
      // UPI details (for Indian payments)
      upi: {
        vpa: String, // Virtual Payment Address
      },
    },

    // Transaction Details
    receiptUrl: String,
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: String,
    
    // Timestamps
    paidAt: Date,
    failureReason: String,
    failureCode: String,

    // Refund Information
    refunded: {
      type: Boolean,
      default: false,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: Date,
    refundReason: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stripeRefundId: String,

    // Saved Payment Method
    savePaymentMethod: {
      type: Boolean,
      default: false,
    },

    // Metadata
    metadata: {
      type: Map,
      of: String,
    },

    // IP and User Agent for security
    ipAddress: String,
    userAgent: String,

    // Notes
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
stripePaymentSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });
stripePaymentSchema.index({ tenantId: 1, invoiceId: 1 });
stripePaymentSchema.index({ status: 1, createdAt: -1 });

// Generate receipt number before save
stripePaymentSchema.pre('save', async function (next) {
  if (!this.receiptNumber && this.status === 'succeeded') {
    const count = await mongoose.model('StripePayment').countDocuments({ tenantId: this.tenantId });
    this.receiptNumber = `RCP-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

// Virtual for formatted amount
stripePaymentSchema.virtual('formattedAmount').get(function () {
  const { formatAmount } = require('../config/stripe');
  return formatAmount(this.amount, this.currency);
});

// Methods
stripePaymentSchema.methods.markAsSucceeded = async function (chargeData) {
  this.status = 'succeeded';
  this.paidAt = new Date();
  this.stripeChargeId = chargeData.id;
  this.receiptUrl = chargeData.receipt_url;
  
  // Extract payment method details
  if (chargeData.payment_method_details?.card) {
    const card = chargeData.payment_method_details.card;
    this.paymentMethod.type = 'card';
    this.paymentMethod.card = {
      last4: card.last4,
      brand: card.brand,
      expiryMonth: card.exp_month,
      expiryYear: card.exp_year,
      funding: card.funding,
    };
  }
  
  await this.save();
};

stripePaymentSchema.methods.markAsFailed = async function (reason, code) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failureCode = code;
  await this.save();
};

stripePaymentSchema.methods.processRefund = async function (amount, reason, userId) {
  const { stripe } = require('../config/stripe');
  
  // Create refund in Stripe
  const refund = await stripe.refunds.create({
    payment_intent: this.stripePaymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined, // Partial or full
  });
  
  this.refunded = true;
  this.refundAmount = (this.refundAmount || 0) + (amount || this.amount);
  this.refundedAt = new Date();
  this.refundReason = reason;
  this.refundedBy = userId;
  this.stripeRefundId = refund.id;
  
  if (this.refundAmount >= this.amount) {
    this.status = 'refunded';
  }
  
  await this.save();
  return refund;
};

// Statics
stripePaymentSchema.statics.getByInvoice = function (invoiceId) {
  return this.find({ invoiceId }).sort({ createdAt: -1 });
};

stripePaymentSchema.statics.getByCustomer = function (customerId, tenantId) {
  return this.find({ customerId, tenantId }).sort({ createdAt: -1 });
};

stripePaymentSchema.statics.getSuccessfulPayments = function (tenantId, startDate, endDate) {
  const query = {
    tenantId,
    status: 'succeeded',
  };
  
  if (startDate || endDate) {
    query.paidAt = {};
    if (startDate) query.paidAt.$gte = startDate;
    if (endDate) query.paidAt.$lte = endDate;
  }
  
  return this.find(query).sort({ paidAt: -1 });
};

const StripePayment = mongoose.model('StripePayment', stripePaymentSchema);

module.exports = StripePayment;
