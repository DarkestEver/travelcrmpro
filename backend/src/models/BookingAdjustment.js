const mongoose = require('mongoose');

/**
 * Booking Adjustment Model
 * Handles all financial adjustments on bookings:
 * - Extra charges (airport fees, insurance, etc.)
 * - Penalties (late cancellation, no-show)
 * - Discounts (promotional, loyalty)
 * - Losses (write-offs, bad debts)
 * - Compensations (service failures)
 */

const bookingAdjustmentSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  
  // Related Booking
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  
  itineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
  },
  
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Adjustment Details
  adjustmentNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  adjustmentType: {
    type: String,
    enum: [
      'extra_charge',      // Additional charges
      'penalty',           // Penalties for violations
      'discount',          // Discounts applied
      'loss',              // Business losses
      'compensation',      // Customer compensation
      'refund_adjustment', // Refund modifications
      'correction',        // Price corrections
      'waiver',            // Fee waivers
      'other'
    ],
    required: true,
    index: true,
  },
  
  category: {
    type: String,
    enum: [
      // Extra Charges
      'airport_fee',
      'baggage_fee',
      'insurance',
      'service_charge',
      'processing_fee',
      'convenience_fee',
      'upgrade_charge',
      'change_fee',
      
      // Penalties
      'late_cancellation',
      'no_show',
      'policy_violation',
      'damage_charge',
      'early_checkout',
      
      // Discounts
      'early_bird',
      'loyalty_discount',
      'promotional',
      'group_discount',
      'seasonal_discount',
      'referral_discount',
      
      // Losses
      'bad_debt',
      'write_off',
      'operational_loss',
      'fraud_loss',
      'chargeback',
      
      // Compensations
      'service_failure',
      'delay_compensation',
      'quality_issue',
      'goodwill',
      
      // Adjustments
      'price_correction',
      'refund_adjustment',
      'waiver',
      'other'
    ],
    required: true,
  },
  
  // Financial Impact
  amount: {
    type: Number,
    required: true,
  },
  
  impactType: {
    type: String,
    enum: ['debit', 'credit'], // debit = charge customer, credit = refund/discount
    required: true,
  },
  
  currency: {
    type: String,
    default: 'USD',
  },
  
  // Tax Handling
  isTaxable: {
    type: Boolean,
    default: true,
  },
  
  taxRate: {
    type: Number,
    default: 0,
  },
  
  taxAmount: {
    type: Number,
    default: 0,
  },
  
  totalAmount: {
    type: Number,
    required: true,
  },
  
  // Description & Justification
  description: {
    type: String,
    required: true,
  },
  
  internalNotes: {
    type: String,
  },
  
  reason: {
    type: String,
    required: true,
  },
  
  // Approval Workflow
  requiresApproval: {
    type: Boolean,
    default: false,
  },
  
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto_approved'],
    default: 'auto_approved',
  },
  
  approvalThreshold: {
    type: Number,
    default: 0, // Amount above which approval is needed
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  approvedAt: {
    type: Date,
  },
  
  rejectionReason: {
    type: String,
  },
  
  // Invoice & Payment
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  
  invoiceNumber: {
    type: String,
  },
  
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'waived', 'written_off'],
    default: 'unpaid',
  },
  
  paidAt: {
    type: Date,
  },
  
  // Revenue Impact Tracking
  revenueImpact: {
    // Impact on different stakeholders
    customer: {
      type: Number,
      default: 0, // Amount customer pays/receives
    },
    supplier: {
      type: Number,
      default: 0, // Impact on supplier payment
    },
    agent: {
      type: Number,
      default: 0, // Impact on agent commission
    },
    agency: {
      type: Number,
      default: 0, // Impact on agency revenue
    },
  },
  
  // Accounting
  accountingCode: {
    type: String,
  },
  
  costCenter: {
    type: String,
  },
  
  glAccount: {
    type: String, // General Ledger Account
  },
  
  // Supporting Documents
  documents: [{
    type: {
      type: String,
      enum: ['receipt', 'invoice', 'proof', 'email', 'other'],
    },
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Customer Communication
  notifyCustomer: {
    type: Boolean,
    default: true,
  },
  
  customerNotified: {
    type: Boolean,
    default: false,
  },
  
  notificationSentAt: {
    type: Date,
  },
  
  customerAcknowledged: {
    type: Boolean,
    default: false,
  },
  
  customerDisputeRaised: {
    type: Boolean,
    default: false,
  },
  
  disputeNotes: {
    type: String,
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paid', 'cancelled', 'reversed', 'disputed'],
    default: 'draft',
    index: true,
  },
  
  effectiveDate: {
    type: Date,
    default: Date.now,
  },
  
  reversedAt: {
    type: Date,
  },
  
  reversalReason: {
    type: String,
  },
  
  reversalAdjustmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingAdjustment',
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  }],
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Indexes
bookingAdjustmentSchema.index({ tenantId: 1, bookingId: 1 });
bookingAdjustmentSchema.index({ tenantId: 1, adjustmentType: 1, status: 1 });
bookingAdjustmentSchema.index({ tenantId: 1, customerId: 1, status: 1 });
bookingAdjustmentSchema.index({ tenantId: 1, paymentStatus: 1 });
bookingAdjustmentSchema.index({ tenantId: 1, approvalStatus: 1 });

// Virtual for net amount impact
bookingAdjustmentSchema.virtual('netImpact').get(function() {
  return this.impactType === 'debit' ? this.totalAmount : -this.totalAmount;
});

// Pre-save middleware
bookingAdjustmentSchema.pre('save', async function(next) {
  // Generate adjustment number if new
  if (this.isNew && !this.adjustmentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      tenantId: this.tenantId,
      createdAt: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1),
      },
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.adjustmentNumber = `ADJ-${year}${month}-${sequence}`;
  }
  
  // Calculate tax if taxable
  if (this.isTaxable && this.taxRate > 0) {
    this.taxAmount = (this.amount * this.taxRate) / 100;
    this.totalAmount = this.amount + this.taxAmount;
  } else {
    this.taxAmount = 0;
    this.totalAmount = this.amount;
  }
  
  // Check if approval required based on threshold
  if (this.approvalThreshold > 0 && this.totalAmount > this.approvalThreshold) {
    this.requiresApproval = true;
    if (this.approvalStatus === 'auto_approved') {
      this.approvalStatus = 'pending';
    }
  }
  
  next();
});

// Instance Methods

// Approve adjustment
bookingAdjustmentSchema.methods.approve = async function(userId, notes = '') {
  this.approvalStatus = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.status = 'active';
  
  this.statusHistory.push({
    status: 'approved',
    changedBy: userId,
    notes,
  });
  
  await this.save();
  return this;
};

// Reject adjustment
bookingAdjustmentSchema.methods.reject = async function(userId, reason) {
  this.approvalStatus = 'rejected';
  this.rejectionReason = reason;
  this.status = 'cancelled';
  
  this.statusHistory.push({
    status: 'rejected',
    changedBy: userId,
    notes: reason,
  });
  
  await this.save();
  return this;
};

// Mark as paid
bookingAdjustmentSchema.methods.markAsPaid = async function(paymentId) {
  this.paymentStatus = 'paid';
  this.paymentId = paymentId;
  this.paidAt = new Date();
  this.status = 'paid';
  
  await this.save();
  return this;
};

// Reverse adjustment
bookingAdjustmentSchema.methods.reverse = async function(userId, reason) {
  // Create reversal adjustment
  const reversal = new this.constructor({
    tenantId: this.tenantId,
    bookingId: this.bookingId,
    itineraryId: this.itineraryId,
    customerId: this.customerId,
    adjustmentType: this.adjustmentType,
    category: this.category,
    amount: this.amount,
    impactType: this.impactType === 'debit' ? 'credit' : 'debit', // Reverse impact
    currency: this.currency,
    description: `Reversal of ${this.adjustmentNumber}: ${this.description}`,
    reason: reason,
    status: 'active',
    createdBy: userId,
    reversalAdjustmentId: this._id,
  });
  
  await reversal.save();
  
  // Update original adjustment
  this.status = 'reversed';
  this.reversedAt = new Date();
  this.reversalReason = reason;
  this.reversalAdjustmentId = reversal._id;
  
  await this.save();
  
  return reversal;
};

// Static Methods

// Get adjustments for booking
bookingAdjustmentSchema.statics.getBookingAdjustments = async function(bookingId) {
  return await this.find({
    bookingId,
    status: { $nin: ['cancelled', 'reversed'] },
  }).sort({ createdAt: -1 });
};

// Calculate total adjustments for booking
bookingAdjustmentSchema.statics.calculateBookingTotal = async function(bookingId) {
  const adjustments = await this.find({
    bookingId,
    status: { $in: ['active', 'paid'] },
  });
  
  let totalCharges = 0;
  let totalCredits = 0;
  
  adjustments.forEach(adj => {
    if (adj.impactType === 'debit') {
      totalCharges += adj.totalAmount;
    } else {
      totalCredits += adj.totalAmount;
    }
  });
  
  return {
    totalCharges,
    totalCredits,
    netAdjustment: totalCharges - totalCredits,
    count: adjustments.length,
  };
};

// Get pending approvals
bookingAdjustmentSchema.statics.getPendingApprovals = async function(tenantId) {
  return await this.find({
    tenantId,
    requiresApproval: true,
    approvalStatus: 'pending',
  })
    .populate('bookingId')
    .populate('customerId', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// Financial summary by type
bookingAdjustmentSchema.statics.getFinancialSummary = async function(tenantId, startDate, endDate) {
  const match = {
    tenantId: mongoose.Types.ObjectId(tenantId),
    status: { $in: ['active', 'paid'] },
  };
  
  if (startDate && endDate) {
    match.effectiveDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  
  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          adjustmentType: '$adjustmentType',
          impactType: '$impactType',
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
    { $sort: { '_id.adjustmentType': 1 } },
  ]);
  
  return summary;
};

const BookingAdjustment = mongoose.model('BookingAdjustment', bookingAdjustmentSchema);

module.exports = BookingAdjustment;
