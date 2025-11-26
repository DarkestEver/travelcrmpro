const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Activity Schema - Individual activity within a day
 */
const activitySchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startTime: String, // e.g., "09:00"
  endTime: String, // e.g., "11:00"
  duration: Number, // in minutes
  type: {
    type: String,
    enum: ['sightseeing', 'adventure', 'cultural', 'leisure', 'dining', 'transport', 'other'],
    default: 'other',
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  cost: {
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    includedInPackage: {
      type: Boolean,
      default: true,
    },
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  notes: String,
  images: [String], // Image URLs
}, { _id: true });

/**
 * Accommodation Schema - Hotel/stay for a day
 */
const accommodationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['hotel', 'resort', 'guesthouse', 'apartment', 'hostel', 'villa', 'other'],
    default: 'hotel',
  },
  checkIn: Date,
  checkOut: Date,
  roomType: String,
  numberOfRooms: {
    type: Number,
    default: 1,
  },
  address: String,
  rating: Number, // 1-5 stars
  amenities: [String],
  cost: {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    perNight: Boolean,
    includedInPackage: {
      type: Boolean,
      default: true,
    },
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  confirmationNumber: String,
  notes: String,
  images: [String],
}, { _id: true });

/**
 * Transport Schema - Transportation between locations
 */
const transportSchema = new Schema({
  type: {
    type: String,
    enum: ['flight', 'train', 'bus', 'car', 'boat', 'taxi', 'transfer', 'other'],
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  departureTime: Date,
  arrivalTime: Date,
  duration: Number, // in minutes
  provider: String, // Airline, train company, etc.
  flightNumber: String,
  trainNumber: String,
  class: String, // Economy, Business, First, etc.
  cost: {
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    includedInPackage: {
      type: Boolean,
      default: true,
    },
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  bookingReference: String,
  notes: String,
}, { _id: true });

/**
 * Meal Schema - Meals for a day
 */
const mealSchema = new Schema({
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  venue: String,
  time: String,
  cost: {
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    includedInPackage: {
      type: Boolean,
      default: true,
    },
  },
  notes: String,
}, { _id: true });

/**
 * Day Schema - Individual day in the itinerary
 */
const daySchema = new Schema({
  dayNumber: {
    type: Number,
    required: true,
  },
  date: Date,
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  destination: String, // City or location for the day
  activities: [activitySchema],
  accommodation: accommodationSchema,
  transport: [transportSchema], // Can have multiple transports in a day
  meals: [mealSchema],
  notes: String,
  images: [String],
}, { _id: true, timestamps: false });

/**
 * Itinerary Schema
 * Main schema for travel itineraries
 */
const itinerarySchema = new Schema(
  {
    // Multi-tenant
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    
    // Reference to lead/booking
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    // Trip Details
    destination: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in days
      required: true,
    },
    numberOfTravelers: {
      adults: {
        type: Number,
        default: 1,
      },
      children: {
        type: Number,
        default: 0,
      },
      infants: {
        type: Number,
        default: 0,
      },
    },

    // Itinerary Content
    days: [daySchema],

    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      taxes: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalPrice: {
        type: Number,
        default: 0,
      },
      pricePerPerson: Number,
      breakdown: {
        accommodation: Number,
        transport: Number,
        activities: Number,
        meals: Number,
        other: Number,
      },
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'pending-review', 'approved', 'sent-to-client', 'accepted', 'rejected', 'archived'],
      default: 'draft',
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: [String],
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateName: String,

    // Client Information (if sent)
    sentToClient: {
      sentAt: Date,
      sentBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      clientEmail: String,
    },
    clientFeedback: {
      receivedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'requested-changes', 'rejected'],
      },
      comments: String,
      requestedChanges: [String],
    },

    // Notes
    internalNotes: String,
    clientNotes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
itinerarySchema.index({ tenant: 1, status: 1 });
itinerarySchema.index({ tenant: 1, createdBy: 1 });
itinerarySchema.index({ tenant: 1, startDate: 1 });
itinerarySchema.index({ tenant: 1, lead: 1 });
itinerarySchema.index({ tenant: 1, booking: 1 });
itinerarySchema.index({ tenant: 1, isTemplate: 1 });

// Virtual: Total travelers
itinerarySchema.virtual('totalTravelers').get(function () {
  const { adults = 0, children = 0, infants = 0 } = this.numberOfTravelers || {};
  return adults + children + infants;
});

// Virtual: Trip status
itinerarySchema.virtual('tripStatus').get(function () {
  const now = new Date();
  if (this.endDate < now) return 'completed';
  if (this.startDate <= now && this.endDate >= now) return 'ongoing';
  if (this.startDate > now) return 'upcoming';
  return 'unknown';
});

// Instance method: Calculate total cost
itinerarySchema.methods.calculateTotalCost = function () {
  let total = {
    accommodation: 0,
    transport: 0,
    activities: 0,
    meals: 0,
    other: 0,
  };

  this.days.forEach(day => {
    // Accommodation
    if (day.accommodation && day.accommodation.cost) {
      total.accommodation += day.accommodation.cost.amount || 0;
    }

    // Transport
    day.transport?.forEach(t => {
      total.transport += t.cost?.amount || 0;
    });

    // Activities
    day.activities?.forEach(a => {
      total.activities += a.cost?.amount || 0;
    });

    // Meals
    day.meals?.forEach(m => {
      total.meals += m.cost?.amount || 0;
    });
  });

  const basePrice = total.accommodation + total.transport + total.activities + total.meals + total.other;
  const totalPrice = basePrice + (this.pricing.taxes || 0) - (this.pricing.discount || 0);
  const pricePerPerson = this.totalTravelers > 0 ? totalPrice / this.totalTravelers : 0;

  return {
    breakdown: total,
    basePrice,
    totalPrice,
    pricePerPerson,
  };
};

// Instance method: Update pricing
itinerarySchema.methods.updatePricing = function () {
  const costs = this.calculateTotalCost();
  
  this.pricing.breakdown = costs.breakdown;
  this.pricing.basePrice = costs.basePrice;
  this.pricing.totalPrice = costs.totalPrice;
  this.pricing.pricePerPerson = costs.pricePerPerson;

  return this.pricing;
};

// Instance method: Add day
itinerarySchema.methods.addDay = function (dayData) {
  const dayNumber = this.days.length + 1;
  const newDay = {
    ...dayData,
    dayNumber,
    activities: dayData.activities || [],
    transport: dayData.transport || [],
    meals: dayData.meals || [],
  };
  
  this.days.push(newDay);
  this.duration = this.days.length;
  
  return newDay;
};

// Instance method: Remove day
itinerarySchema.methods.removeDay = function (dayNumber) {
  const index = this.days.findIndex(d => d.dayNumber === dayNumber);
  if (index === -1) return false;
  
  this.days.splice(index, 1);
  
  // Renumber remaining days
  this.days.forEach((day, idx) => {
    day.dayNumber = idx + 1;
  });
  
  this.duration = this.days.length;
  return true;
};

// Instance method: Clone as template
itinerarySchema.methods.cloneAsTemplate = function (templateName, userId) {
  const clone = this.toObject();
  delete clone._id;
  delete clone.createdAt;
  delete clone.updatedAt;
  delete clone.lead;
  delete clone.booking;
  delete clone.sentToClient;
  delete clone.clientFeedback;
  
  clone.isTemplate = true;
  clone.templateName = templateName;
  clone.status = 'draft';
  clone.createdBy = userId;
  clone.version = 1;
  
  return clone;
};

// Static method: Get by status
itinerarySchema.statics.getByStatus = function (tenantId, status) {
  return this.find({ tenant: tenantId, status })
    .populate('createdBy', 'firstName lastName')
    .populate('lead', 'customer.name customer.email')
    .sort({ createdAt: -1 });
};

// Static method: Get templates
itinerarySchema.statics.getTemplates = function (tenantId) {
  return this.find({ tenant: tenantId, isTemplate: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ templateName: 1 });
};

// Static method: Get upcoming trips
itinerarySchema.statics.getUpcoming = function (tenantId) {
  const now = new Date();
  return this.find({
    tenant: tenantId,
    startDate: { $gt: now },
    status: { $in: ['approved', 'sent-to-client', 'accepted'] },
  })
    .populate('createdBy', 'firstName lastName')
    .populate('lead', 'customer.name customer.email')
    .sort({ startDate: 1 });
};

// Pre-save hook: Update duration and validate dates
itinerarySchema.pre('save', function (next) {
  // Calculate duration from dates if not set
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
    this.duration = diffDays;
  }

  // Validate end date is after start date
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
    return;
  }

  next();
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary;
