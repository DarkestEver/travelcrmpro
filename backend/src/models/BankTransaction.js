const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Bank statement details
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  reference: {
    type: String,
    trim: true,
    index: true
  },
  
  bankAccountNumber: {
    type: String,
    trim: true
  },
  
  // Original raw data from bank statement
  rawData: {
    type: Map,
    of: String
  },
  
  // Reconciliation status
  status: {
    type: String,
    enum: ['unmatched', 'matched', 'manually_matched', 'ignored'],
    default: 'unmatched',
    index: true
  },
  
  // Matched booking
  matchedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    index: true
  },
  
  // Match details
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  matchMethod: {
    type: String,
    enum: ['automatic', 'manual', 'suggested']
  },
  
  matchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  matchedAt: {
    type: Date
  },
  
  // Notes
  notes: {
    type: String,
    trim: true
  },
  
  // Source file info
  importBatch: {
    type: String,
    index: true
  },
  
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  importedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
bankTransactionSchema.index({ tenant: 1, transactionDate: -1 });
bankTransactionSchema.index({ tenant: 1, status: 1 });
bankTransactionSchema.index({ tenant: 1, importBatch: 1 });

// Virtual for amount difference if matched
bankTransactionSchema.virtual('amountDifference').get(function() {
  if (this.matchedBooking && this.matchedBooking.financial) {
    return Math.abs(this.amount - this.matchedBooking.financial.totalAmount);
  }
  return null;
});

// Populate matched booking by default
bankTransactionSchema.pre(/^find/, function(next) {
  if (this.options._skipPopulate) {
    return next();
  }
  
  this.populate({
    path: 'matchedBooking',
    select: 'bookingNumber customer financial status'
  });
  
  next();
});

// Instance method to match with a booking
bankTransactionSchema.methods.matchWithBooking = async function(bookingId, matchMethod = 'manual', userId, matchScore = null) {
  this.matchedBooking = bookingId;
  this.status = matchMethod === 'manual' ? 'manually_matched' : 'matched';
  this.matchMethod = matchMethod;
  this.matchedBy = userId;
  this.matchedAt = new Date();
  if (matchScore !== null) {
    this.matchScore = matchScore;
  }
  await this.save();
  return this;
};

// Instance method to unmatch
bankTransactionSchema.methods.unmatch = async function() {
  this.matchedBooking = null;
  this.status = 'unmatched';
  this.matchMethod = null;
  this.matchedBy = null;
  this.matchedAt = null;
  this.matchScore = null;
  await this.save();
  return this;
};

// Static method to get unmatched transactions
bankTransactionSchema.statics.getUnmatched = function(tenantId) {
  return this.find({
    tenant: tenantId,
    status: 'unmatched'
  }).sort({ transactionDate: -1 });
};

// Static method to get reconciliation summary
bankTransactionSchema.statics.getReconciliationSummary = async function(tenantId, startDate, endDate) {
  const matchStage = {
    tenant: mongoose.Types.ObjectId(tenantId)
  };
  
  if (startDate || endDate) {
    matchStage.transactionDate = {};
    if (startDate) matchStage.transactionDate.$gte = new Date(startDate);
    if (endDate) matchStage.transactionDate.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    unmatched: { count: 0, totalAmount: 0 },
    matched: { count: 0, totalAmount: 0 },
    manually_matched: { count: 0, totalAmount: 0 },
    ignored: { count: 0, totalAmount: 0 }
  };
  
  summary.forEach(item => {
    result[item._id] = {
      count: item.count,
      totalAmount: item.totalAmount
    };
  });
  
  result.total = {
    count: summary.reduce((sum, item) => sum + item.count, 0),
    totalAmount: summary.reduce((sum, item) => sum + item.totalAmount, 0)
  };
  
  return result;
};

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);
