const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Package Model
 * Pre-built travel packages with day-wise itineraries, pricing, and SEO
 */

/**
 * Day Activity Schema
 */
const dayActivitySchema = new Schema({
  day: {
    type: Number,
    required: true,
    min: 1,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  activities: [{
    type: String,
    trim: true,
  }],
  accommodation: {
    name: String,
    type: {
      type: String,
      enum: ['hotel', '3-star', '4-star', '5-star', 'resort', 'guesthouse', 'homestay', 'camp'],
    },
    mealPlan: {
      type: String,
      enum: ['EP', 'CP', 'MAP', 'AP'],
    },
  },
  meals: [{
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    },
    included: Boolean,
  }],
  transport: {
    mode: String,
    details: String,
  },
}, { _id: true });

/**
 * Seasonal Pricing Schema
 */
const seasonalPricingSchema = new Schema({
  season: {
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
  pricePerPerson: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

/**
 * Occupancy Pricing Schema
 */
const occupancyPricingSchema = new Schema({
  occupancyType: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad'],
    required: true,
  },
  pricePerPerson: {
    type: Number,
    required: true,
    min: 0,
  },
  minOccupants: {
    type: Number,
    required: true,
    min: 1,
  },
  maxOccupants: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: true });

/**
 * Group Discount Schema
 */
const groupDiscountSchema = new Schema({
  minGroupSize: {
    type: Number,
    required: true,
    min: 1,
  },
  maxGroupSize: {
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
 * Inclusion/Exclusion Schema
 */
const inclusionExclusionSchema = new Schema({
  category: {
    type: String,
    enum: ['accommodation', 'transport', 'meals', 'activities', 'guide', 'entrance_fees', 'insurance', 'visa', 'other'],
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: true });

/**
 * Image Schema
 */
const imageSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  caption: String,
  isPrimary: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

/**
 * SEO Schema
 */
const seoSchema = new Schema({
  metaTitle: {
    type: String,
    maxlength: 60,
  },
  metaDescription: {
    type: String,
    maxlength: 160,
  },
  keywords: [{
    type: String,
    trim: true,
  }],
  ogTitle: String,
  ogDescription: String,
  ogImage: String,
}, { _id: false });

/**
 * Package Main Schema
 */
const packageSchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Package identification
  packageCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },

  // Basic information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: false, // Auto-generated from title in pre-save hook
    lowercase: true,
    trim: true,
    index: true,
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  description: {
    type: String,
    required: true,
  },
  highlights: [{
    type: String,
    trim: true,
  }],

  // Destination information
  destination: {
    country: {
      type: String,
      required: true,
      trim: true,
    },
    state: String,
    city: String,
    region: String,
  },

  // Duration
  duration: {
    days: {
      type: Number,
      required: true,
      min: 1,
    },
    nights: {
      type: Number,
      required: true,
      min: 0,
    },
  },

  // Day-wise itinerary
  itinerary: [dayActivitySchema],

  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED'],
    },
    seasonalPricing: [seasonalPricingSchema],
    occupancyPricing: [occupancyPricingSchema],
    groupDiscounts: [groupDiscountSchema],
    childDiscount: {
      ageFrom: Number,
      ageTo: Number,
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    infantDiscount: {
      ageFrom: Number,
      ageTo: Number,
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  },

  // Inclusions and Exclusions
  inclusions: [inclusionExclusionSchema],
  exclusions: [inclusionExclusionSchema],

  // Additional information
  thingsToCarry: [{
    type: String,
    trim: true,
  }],
  termsAndConditions: [{
    type: String,
    trim: true,
  }],
  cancellationPolicy: {
    type: String,
  },
  paymentPolicy: {
    type: String,
  },

  // Availability
  availableFrom: Date,
  availableTo: Date,
  blackoutDates: [{
    from: Date,
    to: Date,
    reason: String,
  }],

  // Capacity
  minGroupSize: {
    type: Number,
    default: 1,
    min: 1,
  },
  maxGroupSize: {
    type: Number,
    default: 20,
    min: 1,
  },

  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'private', 'agent-only'],
    default: 'private',
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },

  // Featured package
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  featuredOrder: {
    type: Number,
    default: 0,
  },

  // Images
  images: [imageSchema],

  // SEO
  seo: seoSchema,

  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0,
    },
    quotes: {
      type: Number,
      default: 0,
    },
    bookings: {
      type: Number,
      default: 0,
    },
    lastViewedAt: Date,
  },

  // Tags for filtering
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  categories: [{
    type: String,
    enum: ['adventure', 'beach', 'cultural', 'family', 'honeymoon', 'luxury', 'pilgrimage', 'wildlife', 'trekking', 'backpacking'],
  }],

  // Created/Updated tracking
  createdBy: {
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for efficient querying
packageSchema.index({ tenant: 1, packageCode: 1 }, { unique: true });
packageSchema.index({ tenant: 1, slug: 1 }, { unique: true });
packageSchema.index({ tenant: 1, visibility: 1, status: 1 });
packageSchema.index({ tenant: 1, isFeatured: 1, featuredOrder: 1 });
packageSchema.index({ tenant: 1, 'destination.country': 1 });
packageSchema.index({ tenant: 1, 'destination.city': 1 });
packageSchema.index({ tenant: 1, categories: 1 });
packageSchema.index({ tenant: 1, tags: 1 });
packageSchema.index({ tenant: 1, 'pricing.basePrice': 1 });
packageSchema.index({ tenant: 1, 'duration.days': 1 });
packageSchema.index({ createdAt: -1 });
packageSchema.index({ 'stats.views': -1 });
packageSchema.index({ 'stats.bookings': -1 });

// Text search index
packageSchema.index({
  title: 'text',
  subtitle: 'text',
  description: 'text',
  'destination.country': 'text',
  'destination.city': 'text',
  tags: 'text',
});

// Virtual: Primary Image
packageSchema.virtual('primaryImage').get(function () {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual: Total Days
packageSchema.virtual('totalDays').get(function () {
  return this.duration.days;
});

// Virtual: Total Nights
packageSchema.virtual('totalNights').get(function () {
  return this.duration.nights;
});

// Pre-save: Generate slug from title
packageSchema.pre('save', function (next) {
  if ((this.isNew || this.isModified('title')) && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Pre-save: Ensure only one primary image
packageSchema.pre('save', function (next) {
  if (this.isModified('images') && this.images.length > 0) {
    const primaryCount = this.images.filter(img => img.isPrimary).length;
    
    if (primaryCount === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryCount > 1) {
      let foundFirst = false;
      this.images.forEach(img => {
        if (img.isPrimary && !foundFirst) {
          foundFirst = true;
        } else if (img.isPrimary) {
          img.isPrimary = false;
        }
      });
    }
  }
  next();
});

// Instance method: Increment view count
packageSchema.methods.incrementViews = async function () {
  this.stats.views += 1;
  this.stats.lastViewedAt = new Date();
  await this.save();
  return this.stats.views;
};

// Instance method: Increment quote count
packageSchema.methods.incrementQuotes = async function () {
  this.stats.quotes += 1;
  await this.save();
  return this.stats.quotes;
};

// Instance method: Increment booking count
packageSchema.methods.incrementBookings = async function () {
  this.stats.bookings += 1;
  await this.save();
  return this.stats.bookings;
};

// Instance method: Get current price (based on season if applicable)
packageSchema.methods.getCurrentPrice = function (travelDate) {
  if (!this.pricing.seasonalPricing || this.pricing.seasonalPricing.length === 0) {
    return this.pricing.basePrice;
  }

  const date = travelDate ? new Date(travelDate) : new Date();
  
  for (const seasonal of this.pricing.seasonalPricing) {
    for (const range of seasonal.dateRanges) {
      if (date >= range.from && date <= range.to) {
        return seasonal.pricePerPerson;
      }
    }
  }

  return this.pricing.basePrice;
};

// Instance method: Calculate group price with discounts
packageSchema.methods.calculateGroupPrice = function (groupSize, travelDate) {
  const basePrice = this.getCurrentPrice(travelDate);
  let discount = 0;

  if (this.pricing.groupDiscounts && this.pricing.groupDiscounts.length > 0) {
    for (const groupDiscount of this.pricing.groupDiscounts) {
      if (groupSize >= groupDiscount.minGroupSize) {
        if (!groupDiscount.maxGroupSize || groupSize <= groupDiscount.maxGroupSize) {
          if (groupDiscount.discountType === 'percentage') {
            discount = (basePrice * groupDiscount.discountValue) / 100;
          } else {
            discount = groupDiscount.discountValue;
          }
          break;
        }
      }
    }
  }

  const pricePerPerson = basePrice - discount;
  return {
    basePrice,
    discount,
    pricePerPerson,
    totalPrice: pricePerPerson * groupSize,
    groupSize,
  };
};

// Instance method: Check if package is available for given date
packageSchema.methods.isAvailableForDate = function (date) {
  const checkDate = new Date(date);

  // Check overall availability
  if (this.availableFrom && checkDate < this.availableFrom) {
    return false;
  }
  if (this.availableTo && checkDate > this.availableTo) {
    return false;
  }

  // Check blackout dates
  if (this.blackoutDates && this.blackoutDates.length > 0) {
    for (const blackout of this.blackoutDates) {
      if (checkDate >= blackout.from && checkDate <= blackout.to) {
        return false;
      }
    }
  }

  return true;
};

// Static method: Get featured packages
packageSchema.statics.getFeaturedPackages = function (tenantId, limit = 10) {
  return this.find({
    tenant: tenantId,
    status: 'published',
    visibility: { $in: ['public', 'agent-only'] },
    isFeatured: true,
  })
    .sort({ featuredOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method: Browse packages with filters
packageSchema.statics.browsePackages = async function (tenantId, filters = {}, options = {}) {
  const {
    destination,
    country,
    city,
    minPrice,
    maxPrice,
    minDays,
    maxDays,
    categories,
    tags,
    visibility = 'public',
    search,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = { ...filters, ...options };

  const query = {
    tenant: tenantId,
    status: 'published',
  };

  // Visibility filter
  if (Array.isArray(visibility)) {
    query.visibility = { $in: visibility };
  } else {
    query.visibility = visibility;
  }

  // Destination filters
  if (country) {
    query['destination.country'] = new RegExp(country, 'i');
  }
  if (city) {
    query['destination.city'] = new RegExp(city, 'i');
  }
  if (destination) {
    query.$or = [
      { 'destination.country': new RegExp(destination, 'i') },
      { 'destination.state': new RegExp(destination, 'i') },
      { 'destination.city': new RegExp(destination, 'i') },
      { 'destination.region': new RegExp(destination, 'i') },
    ];
  }

  // Price filters
  if (minPrice !== undefined || maxPrice !== undefined) {
    query['pricing.basePrice'] = {};
    if (minPrice !== undefined) {
      query['pricing.basePrice'].$gte = parseFloat(minPrice);
    }
    if (maxPrice !== undefined) {
      query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }
  }

  // Duration filters
  if (minDays !== undefined || maxDays !== undefined) {
    query['duration.days'] = {};
    if (minDays !== undefined) {
      query['duration.days'].$gte = parseInt(minDays);
    }
    if (maxDays !== undefined) {
      query['duration.days'].$lte = parseInt(maxDays);
    }
  }

  // Category filter
  if (categories && categories.length > 0) {
    query.categories = { $in: Array.isArray(categories) ? categories : [categories] };
  }

  // Tags filter
  if (tags && tags.length > 0) {
    query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [packages, total] = await Promise.all([
    this.find(query)
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    packages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static method: Get popular packages (by bookings)
packageSchema.statics.getPopularPackages = function (tenantId, limit = 10) {
  return this.find({
    tenant: tenantId,
    status: 'published',
    visibility: { $in: ['public', 'agent-only'] },
  })
    .sort({ 'stats.bookings': -1, 'stats.views': -1 })
    .limit(limit)
    .lean();
};

// Static method: Get package statistics
packageSchema.statics.getPackageStatistics = async function (tenantId) {
  const stats = await this.aggregate([
    { $match: { tenant: tenantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$stats.views' },
        totalQuotes: { $sum: '$stats.quotes' },
        totalBookings: { $sum: '$stats.bookings' },
      },
    },
  ]);

  const result = {
    draft: { count: 0, totalViews: 0, totalQuotes: 0, totalBookings: 0 },
    published: { count: 0, totalViews: 0, totalQuotes: 0, totalBookings: 0 },
    archived: { count: 0, totalViews: 0, totalQuotes: 0, totalBookings: 0 },
  };

  stats.forEach(stat => {
    result[stat._id] = {
      count: stat.count,
      totalViews: stat.totalViews,
      totalQuotes: stat.totalQuotes,
      totalBookings: stat.totalBookings,
    };
  });

  return result;
};

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
