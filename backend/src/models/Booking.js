const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  bookingNumber: {
    type: String,
    unique: true,
  },
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  itineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true,
  },
  financial: {
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  paymentRecords: [{
    amount: Number,
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'paypal', 'cash', 'other'],
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paidAt: Date,
    refundedAt: Date,
    notes: String,
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  travelers: [{
    name: String,
    age: Number,
    passportNumber: String,
    passportExpiry: Date,
    nationality: String,
    specialRequests: String,
  }],
  travelDates: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  supplierConfirmations: {
    type: Map,
    of: {
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected'],
        default: 'pending',
      },
      confirmedAt: Date,
      confirmationNumber: String,
      notes: String,
    },
  },
  voucherUrl: String,
  voucherGeneratedAt: Date,
  cancellation: {
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed'],
    },
  },
  specialRequests: String,
  internalNotes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ agentId: 1, bookingStatus: 1 });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ 'travelDates.startDate': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ paymentStatus: 1 });

// Generate booking number
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    const year = new Date().getFullYear();
    this.bookingNumber = `B${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate pending amount
bookingSchema.pre('save', function(next) {
  if (this.financial) {
    this.financial.pendingAmount = this.financial.totalAmount - this.financial.paidAmount;
    
    // Update payment status
    if (this.financial.paidAmount === 0) {
      this.paymentStatus = 'pending';
    } else if (this.financial.paidAmount < this.financial.totalAmount) {
      this.paymentStatus = 'partial';
    } else if (this.financial.paidAmount >= this.financial.totalAmount) {
      this.paymentStatus = 'paid';
    }
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
