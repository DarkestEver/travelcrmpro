const mongoose = require('mongoose');

const supplierPackageCacheSchema = new mongoose.Schema({
  // Source Information
  sourceEmailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog',
    required: true,
    index: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true
  },
  supplierEmail: {
    type: String,
    required: true,
    index: true
  },
  
  // Package Details
  packageName: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true,
    index: true
  },
  destinationCode: String, // ISO code or IATA
  country: String,
  region: String,
  
  // Dates & Availability
  validFrom: {
    type: Date,
    index: true
  },
  validUntil: {
    type: Date,
    index: true
  },
  blackoutDates: [Date],
  availableDates: [Date],
  
  // Pricing
  pricePerPerson: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  childPrice: {
    amount: Number,
    currency: { type: String, default: 'USD' }
  },
  singleSupplement: {
    amount: Number,
    currency: { type: String, default: 'USD' }
  },
  
  // Package Details
  duration: {
    nights: Number,
    days: Number
  },
  packageType: {
    type: String,
    enum: ['honeymoon', 'family', 'adventure', 'luxury', 'budget', 'group', 'solo', 'business', 'other'],
    index: true
  },
  
  // Inclusions
  inclusions: [{
    type: String,
    enum: ['flights', 'hotels', 'meals', 'activities', 'transfers', 'visa', 'insurance', 'guide', 'other']
  }],
  inclusionDetails: [String],
  
  // Accommodation
  hotels: [{
    name: String,
    rating: Number,
    roomType: String,
    nights: Number
  }],
  
  // Activities
  activities: [String],
  
  // Capacity
  minPax: Number,
  maxPax: Number,
  availableSlots: Number,
  
  // Special Features
  highlights: [String],
  specialRequirements: [String],
  tags: [String],
  
  // Extracted Data (Full JSON from AI)
  extractedData: mongoose.Schema.Types.Mixed,
  extractionConfidence: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'soldout', 'suspended', 'pending_verification'],
    default: 'active',
    index: true
  },
  
  // Verification
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  
  // Usage Tracking
  timesMatched: {
    type: Number,
    default: 0
  },
  timesBooked: {
    type: Number,
    default: 0
  },
  lastMatchedAt: Date,
  
  // Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Cache Management
  cacheExpiry: {
    type: Date,
    index: true
  },
  autoRefresh: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes (cacheExpiry already indexed via index: true in schema)
supplierPackageCacheSchema.index({ tenantId: 1, destination: 1, status: 1 });
supplierPackageCacheSchema.index({ tenantId: 1, validFrom: 1, validUntil: 1 });
supplierPackageCacheSchema.index({ tenantId: 1, packageType: 1 });
supplierPackageCacheSchema.index({ supplierEmail: 1, status: 1 });

// Text index for search
supplierPackageCacheSchema.index({
  packageName: 'text',
  destination: 'text',
  highlights: 'text',
  tags: 'text'
});

// Virtual for price range
supplierPackageCacheSchema.virtual('priceRange').get(function() {
  const base = this.pricePerPerson.amount;
  const min = this.childPrice ? Math.min(base, this.childPrice.amount) : base;
  const max = this.singleSupplement ? base + this.singleSupplement.amount : base;
  return { min, max, currency: this.pricePerPerson.currency };
});

// Virtual for expired status
supplierPackageCacheSchema.virtual('isExpired').get(function() {
  return this.validUntil && this.validUntil < new Date();
});

// Methods
supplierPackageCacheSchema.methods.incrementMatch = function() {
  this.timesMatched += 1;
  this.lastMatchedAt = new Date();
  return this.save();
};

supplierPackageCacheSchema.methods.markAsBooked = function() {
  this.timesBooked += 1;
  if (this.availableSlots) {
    this.availableSlots -= 1;
    if (this.availableSlots <= 0) {
      this.status = 'soldout';
    }
  }
  return this.save();
};

supplierPackageCacheSchema.methods.verify = function(userId) {
  this.verified = true;
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  this.status = 'active';
  return this.save();
};

// Statics
supplierPackageCacheSchema.statics.searchPackages = function(tenantId, criteria) {
  const query = {
    tenantId,
    status: 'active',
    verified: true
  };
  
  // More flexible destination matching - WITHOUT $text to avoid query planner issues
  if (criteria.destination) {
    const destination = criteria.destination.toLowerCase().trim();
    
    // Use $or with regex matching only (remove $text to avoid MongoDB query planner conflict)
    query.$or = [
      // Case-insensitive regex match on destination
      { destination: { $regex: destination, $options: 'i' } },
      // Case-insensitive regex match on country
      { country: { $regex: destination, $options: 'i' } },
      // Case-insensitive regex match on region
      { region: { $regex: destination, $options: 'i' } },
      // Case-insensitive regex match on package name (might contain destination)
      { packageName: { $regex: destination, $options: 'i' } },
      // Check highlights array for destination
      { highlights: { $regex: destination, $options: 'i' } },
      // Check tags array for destination
      { tags: { $regex: destination, $options: 'i' } }
    ];
  }
  
  if (criteria.minBudget || criteria.maxBudget) {
    query['pricePerPerson.amount'] = {};
    if (criteria.minBudget) query['pricePerPerson.amount'].$gte = criteria.minBudget;
    if (criteria.maxBudget) query['pricePerPerson.amount'].$lte = criteria.maxBudget;
  }
  
  if (criteria.packageType) {
    query.packageType = criteria.packageType;
  }
  
  if (criteria.startDate) {
    query.$and = [
      { validFrom: { $lte: new Date(criteria.startDate) } },
      { validUntil: { $gte: new Date(criteria.startDate) } }
    ];
  }
  
  return this.find(query).sort({ timesBooked: -1, timesMatched: -1 });
};

supplierPackageCacheSchema.statics.cleanExpired = function() {
  return this.updateMany(
    {
      validUntil: { $lt: new Date() },
      status: 'active'
    },
    {
      $set: { status: 'expired' }
    }
  );
};

module.exports = mongoose.model('SupplierPackageCache', supplierPackageCacheSchema);
