const mongoose = require('mongoose');
const { Schema } = mongoose;

const documentSchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Owner (customer)
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Related booking (optional)
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },

  // Document type
  documentType: {
    type: String,
    required: true,
    enum: [
      'passport',
      'visa',
      'pan_card',
      'aadhar_card',
      'driving_license',
      'photo',
      'vaccination_certificate',
      'insurance',
      'flight_ticket',
      'hotel_voucher',
      'other'
    ],
    index: true,
  },

  // File information
  fileName: {
    type: String,
    required: true,
  },

  fileUrl: {
    type: String,
    required: true,
  },

  fileSize: Number,

  mimeType: String,

  thumbnailUrl: String,

  // Document details
  documentNumber: String,

  issuedBy: String,

  issueDate: Date,

  expiryDate: {
    type: Date,
    index: true,
  },

  issuedCountry: String,

  // OCR extracted data
  ocrData: {
    extracted: {
      type: Boolean,
      default: false,
    },
    extractedAt: Date,
    confidence: Number,
    rawData: Schema.Types.Mixed,
    fields: {
      fullName: String,
      dateOfBirth: Date,
      nationality: String,
      gender: String,
      passportNumber: String,
      placeOfIssue: String,
      documentNumber: String,
      issueDate: Date,
      expiryDate: Date,
    },
  },

  // Verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_review', 'verified', 'rejected', 'expired'],
    default: 'pending',
    index: true,
  },

  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  verifiedAt: Date,

  verificationNotes: String,

  rejectionReason: String,

  // Expiry tracking
  expiryAlerts: [{
    daysBeforeExpiry: Number,
    sentAt: Date,
    emailSent: Boolean,
  }],

  isExpired: {
    type: Boolean,
    default: false,
  },

  expiredAt: Date,

  // Sharing
  sharedWith: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
    permissions: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view',
    },
    expiresAt: Date,
  }],

  isPublic: {
    type: Boolean,
    default: false,
  },

  // Metadata
  tags: [String],
  notes: String,

  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
documentSchema.index({ tenant: 1, customer: 1, documentType: 1 });
documentSchema.index({ tenant: 1, verificationStatus: 1 });
documentSchema.index({ tenant: 1, expiryDate: 1 });
documentSchema.index({ tenant: 1, booking: 1 });

// Virtual: Days until expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diff = this.expiryDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method: Mark as verified
documentSchema.methods.verify = function(userId, notes) {
  this.verificationStatus = 'verified';
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  if (notes) this.verificationNotes = notes;
};

// Method: Reject document
documentSchema.methods.reject = function(userId, reason) {
  this.verificationStatus = 'rejected';
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  this.rejectionReason = reason;
};

// Method: Share with user
documentSchema.methods.shareWith = function(userId, permissions = 'view', expiresAt = null) {
  // Remove existing share if present
  this.sharedWith = this.sharedWith.filter(share => !share.user.equals(userId));
  
  // Add new share
  this.sharedWith.push({
    user: userId,
    sharedAt: new Date(),
    permissions,
    expiresAt,
  });
};

// Method: Revoke share
documentSchema.methods.revokeShare = function(userId) {
  this.sharedWith = this.sharedWith.filter(share => !share.user.equals(userId));
};

// Method: Check if expired
documentSchema.methods.checkExpiry = function() {
  if (this.expiryDate && new Date() > this.expiryDate && !this.isExpired) {
    this.isExpired = true;
    this.expiredAt = new Date();
    this.verificationStatus = 'expired';
    return true;
  }
  return false;
};

// Method: Record expiry alert
documentSchema.methods.recordExpiryAlert = function(daysBeforeExpiry) {
  this.expiryAlerts.push({
    daysBeforeExpiry,
    sentAt: new Date(),
    emailSent: true,
  });
};

// Static: Get expiring documents
documentSchema.statics.getExpiringDocuments = function(tenantId, days = 90) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    tenant: tenantId,
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
    isExpired: false,
    verificationStatus: 'verified',
  })
    .populate('customer', 'firstName lastName email')
    .sort('expiryDate');
};

// Static: Get pending verification documents
documentSchema.statics.getPendingVerification = function(tenantId) {
  return this.find({
    tenant: tenantId,
    verificationStatus: { $in: ['pending', 'in_review'] },
  })
    .populate('customer', 'firstName lastName email phone')
    .populate('uploadedBy', 'firstName lastName')
    .sort('-createdAt');
};

// Pre-save: Check expiry
documentSchema.pre('save', function(next) {
  this.checkExpiry();
  next();
});

module.exports = mongoose.model('Document', documentSchema);
