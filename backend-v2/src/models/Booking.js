const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Tenant = require('./Tenant');

/**
 * Payment Schema - Individual payment transactions
 */
const paymentSchema = new Schema({
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
  method: {
    type: String,
    enum: ['credit-card', 'debit-card', 'bank-transfer', 'cash', 'check', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: String, // Payment gateway transaction ID
  reference: String, // Internal payment reference
  paidAt: Date,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
  receiptUrl: String,
}, { timestamps: true, _id: true });

/**
 * Traveler Schema - Individual traveler details
 */
const travelerSchema = new Schema({
  type: {
    type: String,
    enum: ['adult', 'child', 'infant'],
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: Date,
  passportNumber: String,
  passportExpiry: Date,
  nationality: String,
  specialRequests: String,
}, { _id: true });

/**
 * Booking Schema - Main booking entity
 */
const bookingSchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Booking reference
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Related entities
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    index: true,
  },
  itinerary: {
    type: Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true,
    index: true,
  },

  // Customer details
  customer: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
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

  // Travelers
  travelers: [travelerSchema],

  // Booking dates
  bookingDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  travelStartDate: {
    type: Date,
    required: true,
  },
  travelEndDate: {
    type: Date,
    required: true,
  },

  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      length: 3,
    },
    taxes: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    depositDueDate: Date,
  },

  // Payment tracking
  payments: [paymentSchema],
  paymentStatus: {
    type: String,
    enum: ['not-paid', 'partially-paid', 'fully-paid', 'refunded', 'overdue'],
    default: 'not-paid',
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  balanceDue: Number,

  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
    index: true,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
    notes: String,
  }],

  // Cancellation details
  cancellation: {
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['not-applicable', 'pending', 'processed', 'rejected'],
      default: 'not-applicable',
    },
  },

  // Special requests and notes
  specialRequests: String,
  internalNotes: String,
  customerNotes: String,

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['invoice', 'voucher', 'receipt', 'contract', 'confirmation', 'other'],
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  }],

  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  confirmedAt: Date,
  confirmedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
bookingSchema.index({ tenant: 1, bookingNumber: 1 }, { unique: true });
bookingSchema.index({ tenant: 1, status: 1 });
bookingSchema.index({ tenant: 1, createdBy: 1 });
bookingSchema.index({ tenant: 1, bookingDate: 1 });
bookingSchema.index({ tenant: 1, travelStartDate: 1 });
bookingSchema.index({ tenant: 1, lead: 1 });

// Virtual: Total travelers
bookingSchema.virtual('totalTravelers').get(function () {
  return this.travelers.length;
});

// Virtual: Is overdue
bookingSchema.virtual('isOverdue').get(function () {
  if (this.paymentStatus === 'fully-paid') return false;
  if (this.pricing.depositDueDate && new Date() > this.pricing.depositDueDate) {
    return true;
  }
  return false;
});

// Virtual: Days until travel
bookingSchema.virtual('daysUntilTravel').get(function () {
  const now = new Date();
  const diffTime = this.travelStartDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method: Add payment
bookingSchema.methods.addPayment = function (paymentData) {
  const payment = {
    ...paymentData,
    paidAt: paymentData.paidAt || new Date(),
  };
  
  this.payments.push(payment);
  this.updatePaymentStatus();
  
  return payment;
};

// Instance method: Update payment status
bookingSchema.methods.updatePaymentStatus = function () {
  // Calculate total paid
  this.totalPaid = this.payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate balance due
  this.balanceDue = this.pricing.totalPrice - this.totalPaid;
  
  // Update payment status
  if (this.totalPaid === 0) {
    this.paymentStatus = 'not-paid';
  } else if (this.totalPaid >= this.pricing.totalPrice) {
    this.paymentStatus = 'fully-paid';
  } else {
    this.paymentStatus = 'partially-paid';
  }
  
  // Check for overdue
  if (this.isOverdue && this.paymentStatus !== 'fully-paid') {
    this.paymentStatus = 'overdue';
  }
};

// Instance method: Update status
bookingSchema.methods.updateStatus = function (newStatus, userId, reason, notes) {
  // Add to history
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: userId,
    reason,
    notes,
  });
  
  // Update current status
  this.status = newStatus;
  
  // Update metadata based on status
  if (newStatus === 'confirmed') {
    this.confirmedAt = new Date();
    this.confirmedBy = userId;
  }
  
  if (newStatus === 'cancelled') {
    this.cancellation.cancelledAt = new Date();
    this.cancellation.cancelledBy = userId;
    this.cancellation.reason = reason;
  }
  
  this.lastModifiedBy = userId;
};

// Instance method: Add document
bookingSchema.methods.addDocument = function (documentData, userId) {
  const document = {
    ...documentData,
    uploadedAt: new Date(),
    uploadedBy: userId,
  };
  
  this.documents.push(document);
  return document;
};

// Static method: Generate booking number using tenant settings
// Format: [PREFIX]-YYMM-XXXX (e.g., BK-2501-0001)
// Prefix and start number are configurable per tenant
bookingSchema.statics.generateBookingNumber = async function (tenantId) {
  // Fetch tenant to get booking settings
  const tenant = await Tenant.findById(tenantId).select('settings.bookingPrefix settings.bookingStartNumber');
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const prefix = (tenant.settings?.bookingPrefix || 'BK').toUpperCase();
  const startNumber = tenant.settings?.bookingStartNumber || 1;
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const bookingPrefix = `${prefix}-${year}${month}`;
  
  // Find the last booking for this tenant and period
  const lastBooking = await this.findOne({
    tenant: tenantId,
    bookingNumber: new RegExp(`^${bookingPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-`),
  })
    .sort({ bookingNumber: -1 })
    .select('bookingNumber');
  
  let sequence = startNumber;
  if (lastBooking && lastBooking.bookingNumber) {
    // Extract sequence from last booking number
    const parts = lastBooking.bookingNumber.split('-');
    const lastSequence = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `${bookingPrefix}-${sequenceStr}`;
};

// Static method: Get by status
bookingSchema.statics.getByStatus = function (tenantId, status) {
  return this.find({ tenant: tenantId, status })
    .populate('itinerary', 'title destination startDate endDate')
    .populate('lead', 'customer.name customer.email')
    .populate('createdBy', 'firstName lastName')
    .sort({ bookingDate: -1 });
};

// Static method: Get upcoming trips
bookingSchema.statics.getUpcoming = function (tenantId, daysAhead = 30) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    tenant: tenantId,
    status: { $in: ['confirmed', 'pending'] },
    travelStartDate: { $gte: now, $lte: futureDate },
  })
    .populate('itinerary', 'title destination')
    .populate('customer.name')
    .sort({ travelStartDate: 1 });
};

// Pre-save hook: Calculate balance due and validate dates
bookingSchema.pre('save', function (next) {
  // Calculate balance due if not manually set
  if (this.balanceDue === undefined || this.balanceDue === null) {
    this.balanceDue = this.pricing.totalPrice - this.totalPaid;
  }
  
  // Validate travel dates
  if (this.travelStartDate && this.travelEndDate && this.travelEndDate < this.travelStartDate) {
    next(new Error('Travel end date must be after start date'));
    return;
  }
  
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
