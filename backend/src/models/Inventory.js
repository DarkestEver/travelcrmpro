const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  
  // Service details
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  
  serviceType: {
    type: String,
    enum: ['hotel', 'transport', 'activity', 'tour', 'meal', 'other'],
    required: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  location: {
    city: String,
    country: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Capacity and availability
  capacity: {
    total: {
      type: Number,
      required: true,
      min: 1
    },
    available: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Pricing structure
  pricing: {
    currency: {
      type: String,
      default: 'USD'
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    // Seasonal pricing tiers
    seasonalPricing: [{
      name: String,
      startDate: Date,
      endDate: Date,
      price: Number,
      active: {
        type: Boolean,
        default: true
      }
    }],
    // Pricing by duration
    durationPricing: [{
      minDays: Number,
      maxDays: Number,
      pricePerDay: Number
    }],
    // Extra charges
    extras: [{
      name: String,
      price: Number,
      mandatory: Boolean
    }]
  },
  
  // Availability rules
  availability: {
    // Available days of week (0 = Sunday, 6 = Saturday)
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    // Date ranges when available
    availableDates: [{
      startDate: Date,
      endDate: Date
    }],
    // Blackout dates (unavailable)
    blackoutDates: [{
      date: Date,
      reason: String
    }],
    // Minimum advance booking (in days)
    minAdvanceBooking: {
      type: Number,
      default: 1
    },
    // Maximum advance booking (in days)
    maxAdvanceBooking: {
      type: Number,
      default: 365
    }
  },
  
  // Booking requirements
  requirements: {
    minPax: {
      type: Number,
      default: 1
    },
    maxPax: {
      type: Number,
      default: 100
    },
    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict', 'non-refundable'],
      default: 'moderate'
    },
    cancellationDeadline: {
      type: Number, // hours before service
      default: 24
    }
  },
  
  // Amenities and features (for hotels, activities, etc.)
  amenities: [{
    type: String
  }],
  
  // Images
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold-out', 'seasonal'],
    default: 'active',
    index: true
  },
  
  // Statistics
  statistics: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  tags: [{
    type: String
  }],
  
  featured: {
    type: Boolean,
    default: false
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Sync history for capacity tracking
  syncHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    action: {
      type: String,
      enum: ['reserve', 'confirm', 'cancel', 'complete', 'sync_correction', 'manual_override']
    },
    capacityChange: Number,
    previousAvailable: Number,
    newAvailable: Number,
    discrepancy: Number,
    source: {
      type: String,
      enum: ['booking_sync', 'manual_sync', 'admin']
    }
  }],

  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying (removed duplicates - comprehensive indexes added in Phase 10)
inventorySchema.index({ serviceType: 1, status: 1 });
inventorySchema.index({ 'location.city': 1, 'location.country': 1 });
inventorySchema.index({ featured: 1, status: 1 });

// Virtual for availability status
inventorySchema.virtual('availabilityStatus').get(function() {
  if (this.status !== 'active') {
    return this.status;
  }
  
  if (this.capacity.available === 0) {
    return 'sold-out';
  }
  
  if (this.capacity.available < this.capacity.total * 0.2) {
    return 'limited';
  }
  
  return 'available';
});

// Instance method to check availability for a date
inventorySchema.methods.isAvailableOnDate = function(date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // Check status
  if (this.status !== 'active') {
    return false;
  }
  
  // Check capacity
  if (this.capacity.available <= 0) {
    return false;
  }
  
  // Check day of week
  if (this.availability.daysOfWeek && this.availability.daysOfWeek.length > 0) {
    const dayOfWeek = checkDate.getDay();
    if (!this.availability.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }
  }
  
  // Check blackout dates
  if (this.availability.blackoutDates) {
    const isBlackedOut = this.availability.blackoutDates.some(blackout => {
      const blackoutDate = new Date(blackout.date);
      blackoutDate.setHours(0, 0, 0, 0);
      return blackoutDate.getTime() === checkDate.getTime();
    });
    
    if (isBlackedOut) {
      return false;
    }
  }
  
  // Check available date ranges
  if (this.availability.availableDates && this.availability.availableDates.length > 0) {
    const isInRange = this.availability.availableDates.some(range => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return checkDate >= start && checkDate <= end;
    });
    
    if (!isInRange) {
      return false;
    }
  }
  
  return true;
};

// Instance method to get price for a date
inventorySchema.methods.getPriceForDate = function(date) {
  const checkDate = new Date(date);
  
  // Check seasonal pricing
  if (this.pricing.seasonalPricing && this.pricing.seasonalPricing.length > 0) {
    const seasonalPrice = this.pricing.seasonalPricing.find(season => {
      if (!season.active) return false;
      const start = new Date(season.startDate);
      const end = new Date(season.endDate);
      return checkDate >= start && checkDate <= end;
    });
    
    if (seasonalPrice) {
      return seasonalPrice.price;
    }
  }
  
  return this.pricing.basePrice;
};

// Instance method to reserve capacity
inventorySchema.methods.reserveCapacity = async function(quantity = 1) {
  if (this.capacity.available < quantity) {
    throw new Error('Insufficient capacity available');
  }
  
  this.capacity.available -= quantity;
  await this.save();
  
  return this;
};

// Instance method to release capacity
inventorySchema.methods.releaseCapacity = async function(quantity = 1) {
  this.capacity.available = Math.min(
    this.capacity.available + quantity,
    this.capacity.total
  );
  await this.save();
  
  return this;
};

// Static method to search inventory
inventorySchema.statics.search = function(filters) {
  const query = { status: 'active' };
  
  if (filters.tenant) query.tenant = filters.tenant;
  if (filters.supplier) query.supplier = filters.supplier;
  if (filters.serviceType) query.serviceType = filters.serviceType;
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.country) query['location.country'] = new RegExp(filters.country, 'i');
  if (filters.featured !== undefined) query.featured = filters.featured;
  
  if (filters.minPrice || filters.maxPrice) {
    query['pricing.basePrice'] = {};
    if (filters.minPrice) query['pricing.basePrice'].$gte = filters.minPrice;
    if (filters.maxPrice) query['pricing.basePrice'].$lte = filters.maxPrice;
  }
  
  return this.find(query);
};

// Update statistics on booking
inventorySchema.methods.updateStats = async function(bookingAmount) {
  this.statistics.totalBookings += 1;
  this.statistics.totalRevenue += bookingAmount;
  await this.save();
};

// Compound indexes for performance optimization (Phase 10)
inventorySchema.index({ tenant: 1, serviceType: 1, status: 1 });
inventorySchema.index({ tenant: 1, supplier: 1, status: 1 });
inventorySchema.index({ tenant: 1, featured: 1, status: 1 });
inventorySchema.index({ tenant: 1, 'location.city': 1, serviceType: 1 });
inventorySchema.index({ tenant: 1, 'pricing.basePrice': 1, status: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
