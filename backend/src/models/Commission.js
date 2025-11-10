const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    // Commission calculation
    bookingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      comment: 'Commission percentage (e.g., 10 for 10%)',
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // Payment details
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'check', 'cash', 'credit', 'adjustment'],
    },
    paymentReference: {
      type: String,
    },
    // Period
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    // Notes
    notes: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commissionSchema.index({ agentId: 1, status: 1 });
commissionSchema.index({ agentId: 1, bookingDate: -1 });
commissionSchema.index({ tenantId: 1, status: 1 });

// Virtual for formatted commission rate
commissionSchema.virtual('formattedRate').get(function () {
  return `${this.commissionRate}%`;
});

// Methods
commissionSchema.methods.approve = async function (approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

commissionSchema.methods.markAsPaid = async function (paymentMethod, paymentReference) {
  this.status = 'paid';
  this.paidAt = new Date();
  this.paymentMethod = paymentMethod;
  this.paymentReference = paymentReference;
  return this.save();
};

commissionSchema.methods.cancel = async function () {
  this.status = 'cancelled';
  return this.save();
};

// Static methods
commissionSchema.statics.calculateCommission = function (bookingAmount, commissionRate) {
  return (bookingAmount * commissionRate) / 100;
};

commissionSchema.statics.getAgentTotalCommission = async function (agentId, status = null) {
  const match = { agentId };
  if (status) match.status = status;

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { total: 0, count: 0 };
};

commissionSchema.statics.getAgentCommissionsByPeriod = async function (agentId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        agentId,
        bookingDate: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$bookingDate' },
          month: { $month: '$bookingDate' },
        },
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

// Pre-save hook to calculate commission amount
commissionSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('bookingAmount') || this.isModified('commissionRate')) {
    this.commissionAmount = (this.bookingAmount * this.commissionRate) / 100;
  }
  next();
});

// Ensure virtuals are included in JSON
commissionSchema.set('toJSON', { virtuals: true });
commissionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Commission', commissionSchema);
