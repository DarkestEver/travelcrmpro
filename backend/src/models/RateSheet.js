/**
 * RateSheet Model
 * Phase 5.2: Supplier rate sheet management with CSV upload support
 * 
 * Supports:
 * - CSV upload and parsing
 * - Version tracking
 * - Approval workflow
 * - Rate comparison
 * - Multiple service types
 * - Seasonal pricing
 * - Expiry management
 */

const mongoose = require('mongoose');

const rateLineItemSchema = new mongoose.Schema({
  // Service identification
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  serviceType: {
    type: String,
    enum: ['hotel', 'transport', 'activity', 'tour', 'meal', 'other'],
    required: [true, 'Service type is required'],
  },
  serviceCode: {
    type: String,
    trim: true,
    index: true, // For quick lookups
  },
  
  // Location
  location: {
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    region: { type: String, trim: true },
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  
  // Pricing details
  priceType: {
    type: String,
    enum: ['per-person', 'per-unit', 'per-day', 'per-service', 'flat'],
    default: 'per-person',
  },
  minPax: {
    type: Number,
    min: 1,
    default: 1,
  },
  maxPax: {
    type: Number,
    min: 1,
  },
  
  // Validity period
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required'],
  },
  validTo: {
    type: Date,
    required: [true, 'Valid to date is required'],
  },
  
  // Season/Period
  seasonName: {
    type: String,
    trim: true, // e.g., "High Season", "Low Season", "Peak"
  },
  
  // Additional details
  description: String,
  inclusions: [String],
  exclusions: [String],
  conditions: [String],
  
  // Markup settings
  markupPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  markupAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  
  // CSV mapping (to track original column values)
  originalData: {
    type: Map,
    of: String,
  },
}, { _id: true });

const rateSheetSchema = new mongoose.Schema({
  // Tenant isolation
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  
  // Supplier reference
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true,
  },
  
  // Rate sheet metadata
  name: {
    type: String,
    required: [true, 'Rate sheet name is required'],
    trim: true,
  },
  description: String,
  
  // File information
  fileName: {
    type: String,
    required: true,
  },
  fileSize: Number,
  fileType: {
    type: String,
    enum: ['csv', 'xlsx', 'json'],
    default: 'csv',
  },
  filePath: String, // Path to stored file (optional)
  
  // Version tracking
  version: {
    type: Number,
    default: 1,
    min: 1,
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RateSheet',
  },
  
  // Rate lines
  rates: [rateLineItemSchema],
  
  // Validity period (overall)
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending-approval', 'active', 'expired', 'archived', 'rejected'],
    default: 'draft',
    index: true,
  },
  
  // Approval workflow
  approvalRequired: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Upload information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Statistics
  statistics: {
    totalRates: {
      type: Number,
      default: 0,
    },
    serviceTypes: {
      type: Map,
      of: Number, // Count per service type
      default: {},
    },
    priceRange: {
      min: Number,
      max: Number,
      currency: String,
    },
    seasonCoverage: [String], // List of seasons covered
  },
  
  // CSV parsing metadata
  parsingMetadata: {
    rowsParsed: Number,
    rowsFailed: Number,
    warnings: [String],
    columnMapping: {
      type: Map,
      of: String, // Original column -> Our field mapping
    },
  },
  
  // Notes
  notes: String,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for efficient querying
rateSheetSchema.index({ tenant: 1, supplier: 1, status: 1 });
rateSheetSchema.index({ tenant: 1, effectiveDate: 1, expiryDate: 1 });
rateSheetSchema.index({ supplier: 1, status: 1, version: -1 }); // Latest versions first
rateSheetSchema.index({ 'rates.serviceCode': 1 });
rateSheetSchema.index({ 'rates.serviceType': 1, status: 1 });

// Virtual: Check if rate sheet is currently valid
rateSheetSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.effectiveDate <= now &&
    this.expiryDate >= now
  );
});

// Virtual: Days until expiry
rateSheetSchema.virtual('daysUntilExpiry').get(function() {
  if (this.expiryDate) {
    const now = new Date();
    const diffTime = this.expiryDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware: Calculate statistics
rateSheetSchema.pre('save', function(next) {
  if (this.rates && this.rates.length > 0) {
    // Total rates
    this.statistics.totalRates = this.rates.length;
    
    // Service types breakdown
    const serviceTypeCounts = {};
    this.rates.forEach(rate => {
      serviceTypeCounts[rate.serviceType] = (serviceTypeCounts[rate.serviceType] || 0) + 1;
    });
    this.statistics.serviceTypes = new Map(Object.entries(serviceTypeCounts));
    
    // Price range
    const prices = this.rates.map(r => r.basePrice);
    this.statistics.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: this.rates[0].currency || 'USD',
    };
    
    // Season coverage
    const seasons = [...new Set(this.rates.map(r => r.seasonName).filter(Boolean))];
    this.statistics.seasonCoverage = seasons;
  }
  
  // Auto-expire if past expiry date
  if (this.expiryDate && this.expiryDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Instance method: Activate rate sheet
rateSheetSchema.methods.activate = async function() {
  if (this.status === 'draft' || this.status === 'pending-approval') {
    this.status = 'active';
    await this.save();
  }
  return this;
};

// Instance method: Archive rate sheet
rateSheetSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
  return this;
};

// Instance method: Approve rate sheet
rateSheetSchema.methods.approve = async function(userId) {
  if (this.status === 'pending-approval') {
    this.status = 'active';
    this.approvedBy = userId;
    this.approvedAt = new Date();
    await this.save();
  }
  return this;
};

// Instance method: Reject rate sheet
rateSheetSchema.methods.reject = async function(userId, reason) {
  if (this.status === 'pending-approval') {
    this.status = 'rejected';
    this.rejectionReason = reason;
    await this.save();
  }
  return this;
};

// Instance method: Create new version
rateSheetSchema.methods.createNewVersion = async function(updates) {
  const RateSheet = this.constructor;
  
  // Create new rate sheet with incremented version
  const newVersion = new RateSheet({
    ...this.toObject(),
    _id: undefined,
    version: this.version + 1,
    previousVersionId: this._id,
    status: 'draft',
    approvedBy: undefined,
    approvedAt: undefined,
    uploadedAt: new Date(),
    ...updates,
  });
  
  await newVersion.save();
  return newVersion;
};

// Instance method: Get rate by service code
rateSheetSchema.methods.getRateByServiceCode = function(serviceCode) {
  return this.rates.find(rate => rate.serviceCode === serviceCode);
};

// Instance method: Get rates by service type
rateSheetSchema.methods.getRatesByServiceType = function(serviceType) {
  return this.rates.filter(rate => rate.serviceType === serviceType);
};

// Instance method: Get applicable rate for date
rateSheetSchema.methods.getApplicableRate = function(serviceCode, date) {
  const checkDate = new Date(date);
  return this.rates.find(rate => 
    rate.serviceCode === serviceCode &&
    rate.validFrom <= checkDate &&
    rate.validTo >= checkDate
  );
};

// Static method: Search rate sheets
rateSheetSchema.statics.search = function(filters = {}) {
  const query = {};
  
  if (filters.tenant) query.tenant = filters.tenant;
  if (filters.supplier) query.supplier = filters.supplier;
  if (filters.status) query.status = filters.status;
  if (filters.serviceType) query['rates.serviceType'] = filters.serviceType;
  
  // Date range filtering
  if (filters.date) {
    const checkDate = new Date(filters.date);
    query.effectiveDate = { $lte: checkDate };
    query.expiryDate = { $gte: checkDate };
  }
  
  return this.find(query).sort({ version: -1, createdAt: -1 });
};

// Static method: Get latest version for supplier
rateSheetSchema.statics.getLatestVersion = async function(supplierId, name) {
  return this.findOne({ supplier: supplierId, name })
    .sort({ version: -1 })
    .exec();
};

// Static method: Get expiring rate sheets
rateSheetSchema.statics.getExpiringSoon = function(tenantId, days = 30) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    tenant: tenantId,
    status: 'active',
    expiryDate: {
      $gte: now,
      $lte: futureDate,
    },
  }).sort({ expiryDate: 1 });
};

const RateSheet = mongoose.model('RateSheet', rateSheetSchema);

module.exports = RateSheet;
