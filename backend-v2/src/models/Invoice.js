const mongoose = require('mongoose');
const Tenant = require('./Tenant');

/**
 * Invoice Model
 * Tracks invoices generated from bookings/quotes with payment status
 */

const invoiceSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Invoice number (auto-generated: INV-YYYY-XXXXX)
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Related entities
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },

    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      index: true,
    },

    // Customer information
    customer: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
    },

    // Line items
    lineItems: [
      {
        description: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },

    // Status workflow
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'],
      default: 'draft',
      index: true,
    },

    // Payment information
    paymentStatus: {
      amountPaid: {
        type: Number,
        default: 0,
        min: 0,
      },
      amountDue: {
        type: Number,
        required: true,
        min: 0,
      },
      lastPaymentDate: Date,
    },

    // Payment method used
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'cash', 'cheque', 'online', 'other'],
    },

    // Stripe payment information
    stripePaymentIntentId: {
      type: String,
      index: true,
    },

    stripePaymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled'],
    },

    // Dates
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    paidAt: {
      type: Date,
      index: true,
    },

    sentAt: Date,

    // PDF
    pdfUrl: String,

    // Notes
    notes: String,

    internalNotes: String,

    // Terms and conditions
    terms: String,

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Email tracking
    emailsSent: [
      {
        to: String,
        sentAt: {
          type: Date,
          default: Date.now,
        },
        template: String,
        status: {
          type: String,
          enum: ['sent', 'delivered', 'failed', 'bounced'],
          default: 'sent',
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
invoiceSchema.index({ tenant: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenant: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ tenant: 1, 'customer.email': 1 });
invoiceSchema.index({ booking: 1 });
invoiceSchema.index({ quote: 1 });

// Virtual: Is overdue
invoiceSchema.virtual('isOverdue').get(function () {
  if (this.status === 'paid' || this.status === 'cancelled' || this.status === 'refunded') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual: Days overdue
invoiceSchema.virtual('daysOverdue').get(function () {
  if (!this.isOverdue) {
    return 0;
  }
  const diffTime = Date.now() - this.dueDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual: Is partially paid
invoiceSchema.virtual('isPartiallyPaid').get(function () {
  return this.paymentStatus.amountPaid > 0 && this.paymentStatus.amountPaid < this.total;
});

/**
 * Generate invoice number using tenant settings
 * Format: [PREFIX]-YYYY-XXXXX (e.g., INV-2024-00001)
 * Prefix and start number are configurable per tenant
 */
invoiceSchema.statics.generateInvoiceNumber = async function (tenantId) {
  // Fetch tenant to get invoice settings
  const tenant = await Tenant.findById(tenantId).select('settings.invoicePrefix settings.invoiceStartNumber');
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const prefix = (tenant.settings?.invoicePrefix || 'INV').toUpperCase();
  const startNumber = tenant.settings?.invoiceStartNumber || 1;
  const year = new Date().getFullYear();
  const invoicePrefix = `${prefix}-${year}-`;

  // Find the last invoice number for this tenant and year
  const lastInvoice = await this.findOne({
    tenant: tenantId,
    invoiceNumber: new RegExp(`^${invoicePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');

  let sequence = startNumber;
  if (lastInvoice) {
    // Extract sequence from last invoice number
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSequence = parseInt(parts[parts.length - 1], 10);
    sequence = lastSequence + 1;
  }

  return `${invoicePrefix}${String(sequence).padStart(5, '0')}`;
};

/**
 * Mark invoice as paid
 */
invoiceSchema.methods.markAsPaid = function (amount, paymentMethod) {
  this.paymentStatus.amountPaid += amount;
  this.paymentStatus.amountDue = this.total - this.paymentStatus.amountPaid;
  this.paymentStatus.lastPaymentDate = new Date();
  
  if (this.paymentStatus.amountPaid >= this.total) {
    this.status = 'paid';
    this.paidAt = new Date();
  } else if (this.paymentStatus.amountPaid > 0) {
    this.status = 'partial';
  }
  
  if (paymentMethod) {
    this.paymentMethod = paymentMethod;
  }
};

/**
 * Mark invoice as overdue
 */
invoiceSchema.methods.markAsOverdue = function () {
  if (this.status !== 'paid' && this.status !== 'cancelled' && this.status !== 'refunded') {
    this.status = 'overdue';
  }
};

/**
 * Mark invoice as sent
 */
invoiceSchema.methods.markAsSent = function (recipientEmail) {
  this.sentAt = new Date();
  if (this.status === 'draft') {
    this.status = 'sent';
  }
  
  this.emailsSent.push({
    to: recipientEmail,
    sentAt: new Date(),
    status: 'sent',
  });
};

/**
 * Cancel invoice
 */
invoiceSchema.methods.cancel = function (reason) {
  this.status = 'cancelled';
  this.internalNotes = this.internalNotes 
    ? `${this.internalNotes}\n\nCancelled: ${reason}` 
    : `Cancelled: ${reason}`;
};

/**
 * Process refund
 */
invoiceSchema.methods.refund = function (amount, reason) {
  if (this.status !== 'paid' && this.status !== 'partial') {
    throw new Error('Can only refund paid or partially paid invoices');
  }

  this.paymentStatus.amountPaid -= amount;
  this.paymentStatus.amountDue = this.total - this.paymentStatus.amountPaid;
  
  if (this.paymentStatus.amountPaid <= 0) {
    this.status = 'refunded';
  }
  
  this.internalNotes = this.internalNotes 
    ? `${this.internalNotes}\n\nRefunded ${amount}: ${reason}` 
    : `Refunded ${amount}: ${reason}`;
};

/**
 * Find overdue invoices
 */
invoiceSchema.statics.findOverdue = function (tenantId) {
  return this.find({
    tenant: tenantId,
    status: { $in: ['sent', 'partial'] },
    dueDate: { $lt: new Date() },
  }).sort({ dueDate: 1 });
};

/**
 * Get invoice statistics
 */
invoiceSchema.statics.getStatistics = async function (tenantId, dateRange = {}) {
  const matchQuery = { tenant: tenantId };
  
  if (dateRange.startDate || dateRange.endDate) {
    matchQuery.issueDate = {};
    if (dateRange.startDate) {
      matchQuery.issueDate.$gte = new Date(dateRange.startDate);
    }
    if (dateRange.endDate) {
      matchQuery.issueDate.$lte = new Date(dateRange.endDate);
    }
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalPaid: { $sum: '$paymentStatus.amountPaid' },
        totalDue: { $sum: '$paymentStatus.amountDue' },
      },
    },
  ]);

  const result = {
    draft: { count: 0, totalAmount: 0 },
    sent: { count: 0, totalAmount: 0, totalDue: 0 },
    paid: { count: 0, totalAmount: 0, totalPaid: 0 },
    partial: { count: 0, totalAmount: 0, totalPaid: 0, totalDue: 0 },
    overdue: { count: 0, totalAmount: 0, totalDue: 0 },
    cancelled: { count: 0, totalAmount: 0 },
    refunded: { count: 0, totalAmount: 0 },
  };

  stats.forEach((stat) => {
    result[stat._id] = stat;
  });

  // Calculate totals
  result.total = {
    count: stats.reduce((sum, s) => sum + s.count, 0),
    totalAmount: stats.reduce((sum, s) => sum + s.totalAmount, 0),
    totalPaid: stats.reduce((sum, s) => sum + (s.totalPaid || 0), 0),
    totalDue: stats.reduce((sum, s) => sum + (s.totalDue || 0), 0),
  };

  return result;
};

// Update overdue status before queries
invoiceSchema.pre(/^find/, function (next) {
  // Only update status if not already filtered
  if (!this.getQuery().status) {
    this.updateMany(
      {
        status: { $in: ['sent', 'partial'] },
        dueDate: { $lt: new Date() },
      },
      { $set: { status: 'overdue' } }
    );
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
