const mongoose = require('mongoose');
const { Schema } = mongoose;
const Tenant = require('./Tenant');

/**
 * Quote Model
 * Manages quote generation, versioning, approval workflow, and conversion to bookings
 */

/**
 * Line Item Schema
 */
const lineItemSchema = new Schema({
  day: Number,
  itemType: {
    type: String,
    enum: ['accommodation', 'transport', 'activity', 'meal', 'guide', 'transfer', 'visa', 'insurance', 'other'],
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
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
  rateListSnapshot: {
    type: Schema.Types.ObjectId,
    ref: 'RateList',
  },
}, { _id: true });

/**
 * Discount Schema
 */
const discountSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

/**
 * Tax Schema
 */
const taxSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

/**
 * Payment Schedule Schema
 */
const paymentScheduleSchema = new Schema({
  milestone: {
    type: String,
    required: true,
    trim: true,
  },
  dueDate: Date,
  percentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
}, { _id: true });

/**
 * Email Sent Schema
 */
const emailSentSchema = new Schema({
  sentAt: {
    type: Date,
    default: Date.now,
  },
  toEmail: String,
  template: String,
  messageId: String,
}, { _id: true });

/**
 * Main Quote Schema
 */
const quoteSchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Quote identification
  quoteNumber: {
    type: String,
    required: false, // Auto-generated in pre-save hook
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

  // Customer information
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
  },

  // Quote details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },

  destination: {
    type: String,
    trim: true,
  },

  duration: Number, // Days

  travelDates: {
    startDate: Date,
    endDate: Date,
  },

  travelers: {
    adults: {
      type: Number,
      default: 1,
      min: 0,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    infants: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  // Line items (from itinerary)
  lineItems: [lineItemSchema],

  // Pricing breakdown
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // Discounts
    discounts: [discountSchema],

    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Taxes
    taxes: [taxSchema],

    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Grand total
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
  },

  // Payment schedule
  paymentSchedule: [paymentScheduleSchema],

  // Validity
  validFrom: {
    type: Date,
    required: true,
    default: Date.now,
  },

  validUntil: {
    type: Date,
    required: true,
    index: true,
  },

  // Inclusions/Exclusions
  inclusions: [String],
  exclusions: [String],

  // Terms & Conditions
  termsAndConditions: {
    type: String,
    maxlength: 5000,
  },

  cancellationPolicy: {
    type: String,
    maxlength: 2000,
  },

  // Status workflow
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted'],
    default: 'draft',
    index: true,
  },

  // Approval tracking
  sentAt: Date,
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  viewedAt: Date,

  approvedAt: Date,
  approvedBy: String, // Customer name
  approvalNotes: String,

  rejectedAt: Date,
  rejectionReason: String,

  expiredAt: Date,

  convertedAt: Date,
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },

  // Versioning
  version: {
    type: Number,
    default: 1,
    min: 1,
  },

  parentQuote: {
    type: Schema.Types.ObjectId,
    ref: 'Quote',
  },

  revisionNotes: String,

  // PDFs
  quotePdfUrl: String,
  itineraryPdfUrl: String,
  pdfGeneratedAt: Date,

  // Email tracking
  emailsSent: [emailSentSchema],

  // Notes and metadata
  internalNotes: {
    type: String,
    maxlength: 2000,
  },

  tags: [String],

  // Agent/Operator
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound Indexes
// Unique index for quote numbers including version
// Original quotes have version=1, revisions have version>1
// This allows multiple quotes with same quoteNumber but different versions
quoteSchema.index({ tenant: 1, quoteNumber: 1, version: 1 }, { unique: true });
// Index for finding all versions of a quote
quoteSchema.index({ tenant: 1, parentQuote: 1 });
quoteSchema.index({ tenant: 1, status: 1, validUntil: 1 });
quoteSchema.index({ tenant: 1, 'customer.email': 1 });
quoteSchema.index({ createdBy: 1, status: 1 });
quoteSchema.index({ tenant: 1, createdAt: -1 });

/**
 * Virtual Fields
 */

// Virtual: Is quote expired
quoteSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil && 
         this.status !== 'approved' && 
         this.status !== 'converted';
});

// Virtual: Days until expiry
quoteSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diff = this.validUntil - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual: Total travelers
quoteSchema.virtual('totalTravelers').get(function() {
  return (this.travelers?.adults || 0) + 
         (this.travelers?.children || 0) + 
         (this.travelers?.infants || 0);
});

/**
 * Instance Methods
 */

/**
 * Mark quote as sent
 * @param {ObjectId} userId - User who sent the quote
 */
quoteSchema.methods.markAsSent = function(userId) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.sentBy = userId;
};

/**
 * Mark quote as viewed by customer
 */
quoteSchema.methods.markAsViewed = function() {
  if (this.status === 'sent' && !this.viewedAt) {
    this.status = 'viewed';
    this.viewedAt = new Date();
  }
};

/**
 * Approve quote
 * @param {String} customerName - Customer name
 * @param {String} notes - Approval notes
 */
quoteSchema.methods.approve = function(customerName, notes) {
  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = customerName;
  this.approvalNotes = notes;
};

/**
 * Reject quote
 * @param {String} reason - Rejection reason
 */
quoteSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
};

/**
 * Convert quote to booking
 * @param {ObjectId} bookingId - Created booking ID
 */
quoteSchema.methods.convertToBooking = function(bookingId) {
  this.status = 'converted';
  this.convertedAt = new Date();
  this.booking = bookingId;
};

/**
 * Create a revision (new version) of the quote
 * @param {Object} updateData - Data to update in new revision
 * @param {ObjectId} userId - User creating revision
 * @returns {Promise<Quote>} - New quote revision
 */
quoteSchema.methods.createRevision = async function(updateData, userId) {
  const Quote = this.constructor;

  const revisionData = this.toObject();
  
  // Remove fields that shouldn't be copied
  delete revisionData._id;
  delete revisionData.__v;
  delete revisionData.createdAt;
  delete revisionData.updatedAt;

  const revision = new Quote({
    ...revisionData,
    ...updateData,
    version: this.version + 1,
    parentQuote: this._id,
    status: 'draft',
    quotePdfUrl: undefined,
    itineraryPdfUrl: undefined,
    pdfGeneratedAt: undefined,
    sentAt: undefined,
    sentBy: undefined,
    viewedAt: undefined,
    approvedAt: undefined,
    approvedBy: undefined,
    approvalNotes: undefined,
    rejectedAt: undefined,
    rejectionReason: undefined,
    expiredAt: undefined,
    convertedAt: undefined,
    booking: undefined,
    emailsSent: [],
    updatedBy: userId,
  });

  await revision.save();
  return revision;
};

/**
 * Add email sent record
 * @param {String} toEmail - Recipient email
 * @param {String} template - Email template used
 * @param {String} messageId - Email message ID
 */
quoteSchema.methods.addEmailSent = function(toEmail, template, messageId) {
  this.emailsSent.push({
    sentAt: new Date(),
    toEmail,
    template,
    messageId,
  });
};

/**
 * Static Methods
 */

/**
 * Generate unique quote number using tenant settings
 * Format: [PREFIX]-YYYYMM-XXXX (e.g., QT-202501-0001)
 * Prefix and start number are configurable per tenant
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<String>} - Generated quote number
 */
quoteSchema.statics.generateQuoteNumber = async function(tenantId) {
  // Fetch tenant to get quote settings
  const tenant = await Tenant.findById(tenantId).select('settings.quotePrefix settings.quoteStartNumber');
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const prefix = (tenant.settings?.quotePrefix || 'QT').toUpperCase();
  const startNumber = tenant.settings?.quoteStartNumber || 1;
  const year = new Date().getFullYear();
  const quotePrefix = `${prefix}-${year}`;

  // Find the last quote number for this tenant and period
  const lastQuote = await this.findOne({
    tenant: tenantId,
    quoteNumber: new RegExp(`^${quotePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-`),
  })
    .sort({ quoteNumber: -1 })
    .select('quoteNumber');

  let sequence = startNumber;
  if (lastQuote) {
    // Extract sequence from last quote number
    const parts = lastQuote.quoteNumber.split('-');
    const lastSequence = parseInt(parts[parts.length - 1], 10);
    sequence = lastSequence + 1;
  }

  return `${quotePrefix}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Find expiring quotes
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Number} days - Days until expiry
 * @returns {Promise<Array>} - Expiring quotes
 */
quoteSchema.statics.findExpiring = async function(tenantId, days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return this.find({
    tenant: tenantId,
    status: { $in: ['sent', 'viewed'] },
    validUntil: {
      $gte: now,
      $lte: futureDate,
    },
  })
    .populate('lead', 'customer.name customer.email')
    .populate('createdBy', 'name email')
    .sort({ validUntil: 1 });
};

/**
 * Get quote statistics
 * @param {ObjectId} tenantId - Tenant ID
 * @param {ObjectId} userId - Optional user filter
 * @returns {Promise<Object>} - Quote statistics
 */
quoteSchema.statics.getStatistics = async function(tenantId, userId = null) {
  const matchQuery = { tenant: tenantId };
  if (userId) {
    matchQuery.createdBy = userId;
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalQuotes: { $sum: 1 },
        total: { $sum: 1 },
        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        viewed: { $sum: { $cond: [{ $eq: ['$status', 'viewed'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
        converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        totalValue: { $sum: '$pricing.grandTotal' },
        approvedValue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$pricing.grandTotal', 0],
          },
        },
        convertedValue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'converted'] }, '$pricing.grandTotal', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalQuotes: 1,
        total: 1,
        byStatus: {
          draft: '$draft',
          sent: '$sent',
          viewed: '$viewed',
          approved: '$approved',
          rejected: '$rejected',
          expired: '$expired',
          converted: '$converted',
        },
        totalValue: 1,
        approvedValue: 1,
        convertedValue: 1,
      },
    },
  ]);

  return stats[0] || {
    totalQuotes: 0,
    total: 0,
    byStatus: {
      draft: 0,
      sent: 0,
      viewed: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
    },
    totalValue: 0,
    approvedValue: 0,
    convertedValue: 0,
  };
};

/**
 * Pre-save Middleware
 */

// Auto-generate quote number if not set
quoteSchema.pre('save', async function(next) {
  if (this.isNew && !this.quoteNumber) {
    try {
      this.quoteNumber = await this.constructor.generateQuoteNumber(this.tenant);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Auto-expire check
quoteSchema.pre('save', function(next) {
  if ((this.status === 'sent' || this.status === 'viewed') && new Date() > this.validUntil) {
    this.status = 'expired';
    this.expiredAt = new Date();
  }
  next();
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
