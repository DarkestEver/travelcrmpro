const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commission',
      index: true,
    },
    paymentType: {
      type: String,
      enum: ['booking_payment', 'commission_payout', 'refund', 'credit_adjustment'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'paypal', 'stripe', 'cash', 'check', 'other'],
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    direction: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true,
      comment: 'incoming: payment received from customer, outgoing: payout to agent',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    processedDate: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // For failed payments
    failureReason: {
      type: String,
      trim: true,
    },
    // Receipt/Invoice information
    receiptUrl: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
paymentSchema.index({ agentId: 1, status: 1 });
paymentSchema.index({ agentId: 1, paymentDate: -1 });
paymentSchema.index({ bookingId: 1, paymentType: 1 });
paymentSchema.index({ createdAt: -1 });

// Instance Methods

/**
 * Mark payment as completed
 */
paymentSchema.methods.markAsCompleted = async function(processedBy) {
  this.status = 'completed';
  this.processedDate = new Date();
  this.processedBy = processedBy;
  await this.save();
  return this;
};

/**
 * Mark payment as failed
 */
paymentSchema.methods.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedDate = new Date();
  await this.save();
  return this;
};

/**
 * Cancel payment
 */
paymentSchema.methods.cancel = async function() {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed payment');
  }
  this.status = 'cancelled';
  await this.save();
  return this;
};

// Static Methods

/**
 * Get agent's payment summary
 */
paymentSchema.statics.getAgentPaymentSummary = async function(agentId) {
  const summary = await this.aggregate([
    { $match: { agentId } },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return summary.reduce((acc, item) => {
    acc[item._id] = {
      amount: item.totalAmount,
      count: item.count,
    };
    return acc;
  }, {});
};

/**
 * Get agent's outstanding balance
 */
paymentSchema.statics.getOutstandingBalance = async function(agentId) {
  const Commission = mongoose.model('Commission');
  
  // Total commissions that are approved but not yet paid
  const unpaidCommissions = await Commission.aggregate([
    {
      $match: {
        agentId,
        status: { $in: ['pending', 'approved'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
      },
    },
  ]);

  return unpaidCommissions[0]?.total || 0;
};

/**
 * Get payment history for a period
 */
paymentSchema.statics.getPaymentHistory = async function(agentId, startDate, endDate) {
  const query = {
    agentId,
    paymentDate: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  return await this.find(query)
    .sort('-paymentDate')
    .populate('bookingId', 'bookingNumber')
    .populate('commissionId')
    .populate('processedBy', 'name email')
    .lean();
};

/**
 * Get total payments by type for agent
 */
paymentSchema.statics.getPaymentsByType = async function(agentId) {
  return await this.aggregate([
    { $match: { agentId, status: 'completed' } },
    {
      $group: {
        _id: '$paymentType',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
