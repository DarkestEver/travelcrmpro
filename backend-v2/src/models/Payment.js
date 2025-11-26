const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Payment Transaction Schema
 * Tracks individual payment transactions across the system
 */
const paymentSchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Payment reference
  transactionId: {
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

  customer: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },

  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    length: 3,
  },

  // Payment method
  method: {
    type: String,
    enum: ['credit-card', 'debit-card', 'bank-transfer', 'cash', 'check', 'paypal', 'stripe', 'other'],
    required: true,
  },

  // Card details (if applicable)
  cardDetails: {
    last4: String,
    brand: String, // visa, mastercard, amex, etc.
    expiryMonth: Number,
    expiryYear: Number,
  },

  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true,
  },

  // Gateway information
  gateway: {
    provider: {
      type: String,
      enum: ['stripe', 'paypal', 'square', 'manual', 'other'],
      default: 'manual',
    },
    gatewayTransactionId: String,
    gatewayResponse: Schema.Types.Mixed,
  },

  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  failedAt: Date,

  // Failure details
  failureReason: String,
  failureCode: String,

  // Refund details
  refund: {
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    refundTransactionId: String,
    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },

  // Notes
  description: String,
  internalNotes: String,

  // Receipt
  receiptUrl: String,
  receiptNumber: String,

  // Metadata
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

// Indexes
paymentSchema.index({ tenant: 1, status: 1 });
paymentSchema.index({ tenant: 1, booking: 1 });
paymentSchema.index({ tenant: 1, createdAt: -1 });
paymentSchema.index({ tenant: 1, 'customer.email': 1 });
paymentSchema.index({ 'gateway.gatewayTransactionId': 1 });

// Instance method: Mark as completed
paymentSchema.methods.markCompleted = function (gatewayData = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  
  if (gatewayData.transactionId) {
    this.gateway.gatewayTransactionId = gatewayData.transactionId;
  }
  if (gatewayData.response) {
    this.gateway.gatewayResponse = gatewayData.response;
  }
};

// Instance method: Mark as failed
paymentSchema.methods.markFailed = function (reason, code) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  this.failureCode = code;
};

// Instance method: Process refund
paymentSchema.methods.processRefund = function (refundAmount, reason, userId, refundTransactionId) {
  this.status = 'refunded';
  this.refund = {
    refundedAt: new Date(),
    refundAmount: refundAmount || this.amount,
    refundReason: reason,
    refundTransactionId,
    refundedBy: userId,
  };
};

// Static method: Get by status
paymentSchema.statics.getByStatus = function (tenantId, status) {
  return this.find({ tenant: tenantId, status })
    .populate('booking', 'bookingNumber customer')
    .populate('processedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method: Get revenue stats
paymentSchema.statics.getRevenueStats = async function (tenantId, startDate, endDate) {
  const match = {
    tenant: tenantId,
    status: 'completed',
  };

  if (startDate || endDate) {
    match.completedAt = {};
    if (startDate) match.completedAt.$gte = new Date(startDate);
    if (endDate) match.completedAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$amount' },
      },
    },
  ]);

  return stats[0] || {
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
  };
};

// Static method: Get revenue by method
paymentSchema.statics.getRevenueByMethod = async function (tenantId) {
  return this.aggregate([
    {
      $match: {
        tenant: tenantId,
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$method',
        totalRevenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
  ]);
};

// Static method: Generate transaction ID
paymentSchema.statics.generateTransactionId = async function (tenantId) {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const day = new Date().getDate().toString().padStart(2, '0');
  
  const lastPayment = await this.findOne({ tenant: tenantId })
    .sort({ createdAt: -1 })
    .select('transactionId');
  
  let sequence = 1;
  if (lastPayment && lastPayment.transactionId) {
    const lastSequence = parseInt(lastPayment.transactionId.split('-')[3], 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `PAY-${year}${month}${day}-${sequenceStr}`;
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
