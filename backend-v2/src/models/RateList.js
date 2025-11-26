const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * RateList Model
 * Comprehensive supplier pricing with seasonal rates, occupancy pricing, bulk discounts
 * Supports: hotels, transport, activities, meals, guides
 */

/**
 * Seasonal Pricing Schema
 */
const seasonalPricingSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['peak', 'normal', 'off'],
    required: true,
  },
  dateRanges: [{
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
  }],
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  markup: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, { _id: true });

/**
 * Occupancy-based Pricing Schema (for hotels)
 */
const occupancyPricingSchema = new Schema({
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad', 'suite'],
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0,
  },
  maxOccupants: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: true });

/**
 * Age-based Pricing Schema (for activities/transport)
 */
const ageBasedPricingSchema = new Schema({
  category: {
    type: String,
    enum: ['adult', 'child', 'infant', 'senior'],
    required: true,
  },
  ageFrom: {
    type: Number,
    required: true,
    min: 0,
  },
  ageTo: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

/**
 * Bulk Discount Schema
 */
const bulkDiscountSchema = new Schema({
  minQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  maxQuantity: {
    type: Number,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

/**
 * Additional Charges Schema
 */
const additionalChargeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  isMandatory: {
    type: Boolean,
    default: false,
  },
  applicableFor: {
    type: String,
    enum: ['per_person', 'per_booking', 'per_night', 'per_day'],
    required: true,
  },
}, { _id: true });

/**
 * Blackout Date Schema
 */
const blackoutDateSchema = new Schema({
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
}, { _id: true });

/**
 * Cancellation Policy Schema
 */
const cancellationPolicySchema = new Schema({
  daysBeforeCheckIn: {
    type: Number,
    required: true,
    min: 0,
  },
  refundPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
}, { _id: true });

/**
 * Main RateList Schema
 */
const rateListSchema = new Schema({
  // Tenant isolation
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Supplier reference
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true,
  },

  // Basic information
  name: {
    type: String,
    required: [true, 'Rate list name is required'],
    trim: true,
    maxlength: 200,
  },
  
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  },

  serviceType: {
    type: String,
    required: true,
    enum: ['hotel', 'transport', 'activity', 'meal', 'guide', 'other'],
    index: true,
  },

  // Validity period
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required'],
    index: true,
  },

  validTo: {
    type: Date,
    required: [true, 'Valid to date is required'],
    index: true,
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  // Location
  destination: {
    city: {
      type: String,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      index: true,
    },
  },

  // Pricing structure
  pricing: {
    // Base pricing
    baseType: {
      type: String,
      enum: ['per_night', 'per_person', 'per_trip', 'per_hour', 'per_day'],
      required: true,
    },
    baseCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },

    // Seasonal pricing
    seasonal: [seasonalPricingSchema],

    // Occupancy-based pricing (for hotels)
    occupancy: [occupancyPricingSchema],

    // Age-based pricing (for activities/transport)
    ageBased: [ageBasedPricingSchema],

    // Bulk/Group discounts
    bulkDiscounts: [bulkDiscountSchema],

    // Additional charges
    additionalCharges: [additionalChargeSchema],
  },

  // Availability
  availability: {
    minNights: {
      type: Number,
      min: 1,
    },
    maxNights: {
      type: Number,
    },
    minPax: {
      type: Number,
      min: 1,
      default: 1,
    },
    maxPax: {
      type: Number,
    },
    advanceBookingDays: {
      type: Number,
      min: 0,
      default: 0,
    },
    cutoffHours: {
      type: Number,
      min: 0,
      default: 24,
    },

    // Blackout dates
    blackoutDates: [blackoutDateSchema],

    // Weekly availability
    weeklyAvailability: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: true },
      sunday: { type: Boolean, default: true },
    },
  },

  // Policies
  cancellationPolicy: [cancellationPolicySchema],

  // Inclusions/Exclusions
  inclusions: [{
    type: String,
    trim: true,
  }],

  exclusions: [{
    type: String,
    trim: true,
  }],

  // Metadata
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },

  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },

  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],

  // Versioning
  version: {
    type: Number,
    default: 1,
    min: 1,
  },

  previousVersionId: {
    type: Schema.Types.ObjectId,
    ref: 'RateList',
  },

  // Publishing
  publishedAt: Date,
  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },

  // Audit
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for efficient queries
rateListSchema.index({ tenant: 1, supplier: 1, status: 1 });
rateListSchema.index({ tenant: 1, serviceType: 1, status: 1 });
rateListSchema.index({ tenant: 1, 'destination.city': 1, validFrom: 1, validTo: 1 });
rateListSchema.index({ tenant: 1, validFrom: 1, validTo: 1, status: 1 });

// Virtual: Check if rate list is currently valid
rateListSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.status === 'published' &&
    this.isActive &&
    this.validFrom <= now &&
    this.validTo >= now
  );
});

// Virtual: Days until expiry
rateListSchema.virtual('daysUntilExpiry').get(function() {
  if (this.validTo) {
    const now = new Date();
    const diffTime = this.validTo - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

/**
 * Instance Methods
 */

/**
 * Check if a date is a blackout date
 * @param {Date} date - Date to check
 * @returns {Boolean} - True if blackout date
 */
rateListSchema.methods.isBlackoutDate = function(date) {
  const checkDate = new Date(date);
  
  if (!this.availability?.blackoutDates || this.availability.blackoutDates.length === 0) {
    return false;
  }

  return this.availability.blackoutDates.some(blackout => {
    return checkDate >= blackout.from && checkDate <= blackout.to;
  });
};

/**
 * Calculate price based on various factors
 * @param {Object} params - Pricing parameters
 * @param {Date} params.date - Travel date
 * @param {Number} params.nights - Number of nights (for hotels)
 * @param {Number} params.pax - Number of travelers
 * @param {Object} params.ageBreakdown - Age breakdown { adults, children, infants, seniors }
 * @param {String} params.occupancyType - Occupancy type (single/double/etc)
 * @returns {Object} - Price breakdown
 */
rateListSchema.methods.calculatePrice = function(params) {
  const { date, nights = 1, pax = 1, ageBreakdown = {}, occupancyType } = params;
  
  const result = {
    basePrice: 0,
    seasonalMarkup: 0,
    bulkDiscount: 0,
    additionalCharges: 0,
    total: 0,
    currency: this.pricing.baseCurrency,
    breakdown: [],
  };

  // Check if date is valid
  if (this.isBlackoutDate(date)) {
    throw new Error('Booking not available on this date (blackout period)');
  }

  // 1. Base price calculation
  if (this.serviceType === 'hotel' && occupancyType) {
    // Occupancy-based pricing for hotels
    const occupancyRate = this.pricing.occupancy.find(o => o.type === occupancyType);
    if (!occupancyRate) {
      throw new Error(`Occupancy type ${occupancyType} not found`);
    }
    result.basePrice = occupancyRate.pricePerNight * nights;
    result.breakdown.push({
      description: `${occupancyType} occupancy for ${nights} night(s)`,
      amount: result.basePrice,
    });
  } else if (this.pricing.ageBased && this.pricing.ageBased.length > 0) {
    // Age-based pricing for activities/transport
    const ageCategories = ['adults', 'children', 'infants', 'seniors'];
    
    ageCategories.forEach(category => {
      const count = ageBreakdown[category] || 0;
      if (count > 0) {
        const singularCategory = category.slice(0, -1); // 'adults' -> 'adult'
        const ageRate = this.pricing.ageBased.find(a => a.category === singularCategory);
        if (ageRate) {
          const categoryPrice = ageRate.price * count;
          result.basePrice += categoryPrice;
          result.breakdown.push({
            description: `${count} ${category}`,
            amount: categoryPrice,
          });
        }
      }
    });

    // If no age breakdown provided, use adult price
    if (result.basePrice === 0) {
      const adultRate = this.pricing.ageBased.find(a => a.category === 'adult');
      if (adultRate) {
        result.basePrice = adultRate.price * pax;
        result.breakdown.push({
          description: `${pax} person(s)`,
          amount: result.basePrice,
        });
      }
    }
  } else {
    // Default per-unit pricing
    const seasonal = this.pricing.seasonal && this.pricing.seasonal.length > 0
      ? this.pricing.seasonal[0]
      : null;
    
    const baseRate = seasonal ? seasonal.pricePerUnit : 0;
    result.basePrice = baseRate * (this.pricing.baseType === 'per_night' ? nights : pax);
    result.breakdown.push({
      description: `Base price (${this.pricing.baseType})`,
      amount: result.basePrice,
    });
  }

  // 2. Seasonal markup
  if (this.pricing.seasonal && this.pricing.seasonal.length > 0) {
    const checkDate = new Date(date);
    const applicableSeason = this.pricing.seasonal.find(season => {
      return season.dateRanges.some(range => {
        return checkDate >= range.from && checkDate <= range.to;
      });
    });

    if (applicableSeason && applicableSeason.markup > 0) {
      result.seasonalMarkup = (result.basePrice * applicableSeason.markup) / 100;
      result.breakdown.push({
        description: `${applicableSeason.name} markup (${applicableSeason.markup}%)`,
        amount: result.seasonalMarkup,
      });
    }
  }

  // 3. Bulk discount
  if (this.pricing.bulkDiscounts && this.pricing.bulkDiscounts.length > 0) {
    const totalPax = Object.values(ageBreakdown).reduce((sum, count) => sum + count, 0) || pax;
    
    const applicableDiscount = this.pricing.bulkDiscounts
      .filter(d => totalPax >= d.minQuantity && (!d.maxQuantity || totalPax <= d.maxQuantity))
      .sort((a, b) => b.discountValue - a.discountValue)[0];

    if (applicableDiscount) {
      if (applicableDiscount.discountType === 'percentage') {
        result.bulkDiscount = ((result.basePrice + result.seasonalMarkup) * applicableDiscount.discountValue) / 100;
      } else {
        result.bulkDiscount = applicableDiscount.discountValue;
      }
      result.breakdown.push({
        description: `Bulk discount (${totalPax} pax)`,
        amount: -result.bulkDiscount,
      });
    }
  }

  // 4. Additional charges
  if (this.pricing.additionalCharges && this.pricing.additionalCharges.length > 0) {
    this.pricing.additionalCharges.forEach(charge => {
      if (charge.isMandatory) {
        let chargeAmount = 0;
        
        switch (charge.applicableFor) {
          case 'per_person':
            chargeAmount = charge.price * pax;
            break;
          case 'per_night':
            chargeAmount = charge.price * nights;
            break;
          case 'per_day':
            chargeAmount = charge.price * nights;
            break;
          case 'per_booking':
          default:
            chargeAmount = charge.price;
        }

        result.additionalCharges += chargeAmount;
        result.breakdown.push({
          description: charge.name,
          amount: chargeAmount,
        });
      }
    });
  }

  // Calculate total
  result.total = result.basePrice + result.seasonalMarkup - result.bulkDiscount + result.additionalCharges;
  
  return result;
};

/**
 * Publish rate list
 */
rateListSchema.methods.publish = async function(userId) {
  if (this.status === 'published') {
    throw new Error('Rate list is already published');
  }

  this.status = 'published';
  this.publishedAt = new Date();
  this.publishedBy = userId;
  
  await this.save();
  return this;
};

/**
 * Unpublish rate list
 */
rateListSchema.methods.unpublish = async function() {
  if (this.status !== 'published') {
    throw new Error('Rate list is not published');
  }

  this.status = 'draft';
  this.publishedAt = null;
  this.publishedBy = null;
  
  await this.save();
  return this;
};

/**
 * Clone rate list for versioning
 */
rateListSchema.methods.clone = async function(userId, updates = {}) {
  const clonedData = this.toObject();
  
  delete clonedData._id;
  delete clonedData.__v;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  
  const newRateList = new this.constructor({
    ...clonedData,
    ...updates,
    version: this.version + 1,
    previousVersionId: this._id,
    status: 'draft',
    publishedAt: null,
    publishedBy: null,
    createdBy: userId,
  });

  await newRateList.save();
  return newRateList;
};

/**
 * Static Methods
 */

/**
 * Generate unique rate list code
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} serviceType - Service type
 * @returns {String} - Generated code
 */
rateListSchema.statics.generateCode = async function(tenantId, serviceType) {
  const prefix = `RATE-${serviceType.substring(0, 3).toUpperCase()}`;
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Count existing rate lists for this tenant and service type this year
  const count = await this.countDocuments({
    tenant: tenantId,
    serviceType,
    code: new RegExp(`^${prefix}-${year}-`, 'i'),
  });

  const sequence = String(count + 1).padStart(3, '0');
  return `${prefix}-${year}-${sequence}`;
};

/**
 * Find overlapping rate lists
 * @param {ObjectId} tenantId - Tenant ID
 * @param {ObjectId} supplierId - Supplier ID
 * @param {String} serviceType - Service type
 * @param {Date} validFrom - Start date
 * @param {Date} validTo - End date
 * @param {ObjectId} excludeId - Rate list ID to exclude (for updates)
 * @returns {Array} - Overlapping rate lists
 */
rateListSchema.statics.findOverlapping = async function(tenantId, supplierId, serviceType, validFrom, validTo, excludeId = null) {
  const query = {
    tenant: tenantId,
    supplier: supplierId,
    serviceType,
    status: { $in: ['draft', 'published'] },
    $or: [
      // New range starts within existing range
      {
        validFrom: { $lte: validFrom },
        validTo: { $gte: validFrom },
      },
      // New range ends within existing range
      {
        validFrom: { $lte: validTo },
        validTo: { $gte: validTo },
      },
      // New range completely contains existing range
      {
        validFrom: { $gte: validFrom },
        validTo: { $lte: validTo },
      },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query);
};

/**
 * Get active rate lists for supplier
 * @param {ObjectId} tenantId - Tenant ID
 * @param {ObjectId} supplierId - Supplier ID
 * @param {Date} date - Date to check
 * @returns {Array} - Active rate lists
 */
rateListSchema.statics.getActiveRateLists = async function(tenantId, supplierId, date = new Date()) {
  return this.find({
    tenant: tenantId,
    supplier: supplierId,
    status: 'published',
    isActive: true,
    validFrom: { $lte: date },
    validTo: { $gte: date },
  }).populate('supplier', 'name type');
};

/**
 * Pre-save hook: Auto-expire rate lists
 */
rateListSchema.pre('save', function(next) {
  const now = new Date();
  
  // Auto-expire if past validity period
  if (this.validTo && this.validTo < now && this.status === 'published') {
    this.status = 'archived';
    this.isActive = false;
  }

  next();
});

const RateList = mongoose.model('RateList', rateListSchema);

module.exports = RateList;
