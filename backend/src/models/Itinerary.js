const mongoose = require('mongoose');

// Enhanced Location Schema
const locationSchema = new mongoose.Schema({
  name: String,
  address: String,
  country: String,
  state: String,
  city: String,
  postalCode: String,
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  placeId: String, // Google Places ID
  nearbyAttractions: [String]
}, { _id: false });

// Accommodation (Stay) Details Schema
const accommodationSchema = new mongoose.Schema({
  hotelName: { type: String, required: true },
  category: {
    type: String,
    enum: ['budget', '3-star', '4-star', '5-star', 'luxury', 'boutique', 'resort', 'hostel', 'guesthouse', 'villa', 'apartment'],
    default: '3-star'
  },
  starRating: {
    type: Number,
    min: 1,
    max: 5
  },
  roomType: {
    type: String,
    enum: ['standard', 'deluxe', 'suite', 'villa', 'apartment', 'dormitory', 'family-room', 'connecting-rooms'],
    default: 'standard'
  },
  numberOfRooms: {
    type: Number,
    default: 1
  },
  checkIn: {
    date: Date,
    time: String // "14:00"
  },
  checkOut: {
    date: Date,
    time: String // "12:00"
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'room-service', 'parking', 'airport-shuttle', 
           'laundry', 'concierge', 'business-center', 'breakfast-included', 'pet-friendly', 'beach-access',
           'balcony', 'sea-view', 'mountain-view', 'air-conditioning', 'mini-bar', 'safe', 'tv', 'bathtub']
  }],
  mealPlan: {
    type: String,
    enum: ['room-only', 'breakfast', 'half-board', 'full-board', 'all-inclusive'],
    default: 'room-only'
  },
  confirmationNumber: String,
  cancellationPolicy: String,
  specialRequests: String,
  images: [String],
  websiteUrl: String,
  phone: String,
  email: String
}, { _id: false });

// Transportation (Transfer) Details Schema
const transportationSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['flight', 'train', 'bus', 'car-rental', 'private-car', 'taxi', 'uber', 'metro', 'ferry', 'cruise', 'walking', 'bicycle'],
    required: true
  },
  provider: String, // Airline, Bus company, etc.
  class: {
    type: String,
    enum: ['economy', 'premium-economy', 'business', 'first-class', 'standard', 'sleeper', 'ac', 'non-ac']
  },
  vehicleType: String, // For cars: SUV, Sedan, etc.
  flightNumber: String,
  trainNumber: String,
  busNumber: String,
  from: {
    location: locationSchema,
    terminal: String, // Airport terminal, train platform
    departureTime: Date
  },
  to: {
    location: locationSchema,
    terminal: String,
    arrivalTime: Date
  },
  duration: String, // "2h 30m"
  distance: {
    value: Number,
    unit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    }
  },
  bookingReference: String,
  pnr: String, // Passenger Name Record
  seatNumber: String,
  baggageAllowance: String,
  pickupTime: Date,
  dropoffTime: Date,
  driverDetails: {
    name: String,
    phone: String,
    vehicleNumber: String
  },
  images: [String],
  includesInPackage: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Meal (Food) Details Schema
const mealSchema = new mongoose.Schema({
  mealType: {
    type: String,
    enum: ['breakfast', 'brunch', 'lunch', 'afternoon-tea', 'dinner', 'supper', 'snack', 'beverage'],
    required: true
  },
  cuisine: {
    type: String,
    enum: ['local', 'indian', 'chinese', 'italian', 'french', 'japanese', 'thai', 'mexican', 'mediterranean', 
           'continental', 'fusion', 'vegetarian', 'vegan', 'seafood', 'bbq', 'fast-food']
  },
  venueName: String,
  venueType: {
    type: String,
    enum: ['hotel-restaurant', 'restaurant', 'cafe', 'street-food', 'food-court', 'buffet', 'fine-dining', 
           'casual-dining', 'rooftop', 'beachside', 'food-truck', 'picnic']
  },
  dietaryOptions: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'nut-free', 'diabetic-friendly']
  }],
  specialties: [String], // Signature dishes
  menuHighlights: [String],
  averageCost: {
    amount: Number,
    currency: String,
    perPerson: Boolean
  },
  reservationRequired: {
    type: Boolean,
    default: false
  },
  reservationNumber: String,
  images: [String],
  dressCode: String,
  ambiance: String, // casual, romantic, family-friendly, etc.
  includesInPackage: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Activity Details Schema
const activitySchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['sightseeing', 'adventure', 'cultural', 'historical', 'religious', 'shopping', 'leisure', 
           'wellness', 'entertainment', 'sports', 'nature', 'photography', 'educational', 'nightlife'],
    required: true
  },
  subCategory: String,
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'difficult', 'extreme']
  },
  duration: String, // "2-3 hours"
  bestTimeToVisit: String, // "Morning", "Sunset", "After 6 PM"
  highlights: [String],
  description: String,
  whatToExpect: String,
  included: [String],
  excluded: [String],
  requirements: {
    minAge: Number,
    maxAge: Number,
    fitnessLevel: String,
    specialSkills: [String],
    permits: [String],
    equipment: [String]
  },
  operatingHours: {
    open: String,
    close: String,
    closedDays: [String]
  },
  ticketInfo: {
    required: Boolean,
    price: Number,
    bookingUrl: String,
    validityDays: Number
  },
  guideInfo: {
    required: Boolean,
    provided: Boolean,
    languages: [String],
    guideName: String,
    guidePhone: String
  },
  accessibility: {
    wheelchairAccessible: Boolean,
    childFriendly: Boolean,
    seniorFriendly: Boolean
  },
  images: [String],
  videoUrl: String,
  tips: [String],
  whatToBring: [String],
  includesInPackage: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Note Schema for custom entries
const noteSchema = new mongoose.Schema({
  content: String,
  type: {
    type: String,
    enum: ['info', 'warning', 'tip', 'reminder', 'important'],
    default: 'info'
  },
  icon: String,
  color: String
}, { _id: false });

// Main Component Schema
const componentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['stay', 'transfer', 'activity', 'meal', 'note'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  startTime: String, // "09:00"
  endTime: String, // "12:00"
  location: locationSchema,
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  
  // Type-specific details (only one will be populated based on type)
  accommodation: accommodationSchema,
  transportation: transportationSchema,
  meal: mealSchema,
  activity: activitySchema,
  note: noteSchema,
  
  // Common fields
  cost: {
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    costType: {
      type: String,
      enum: ['per-person', 'per-group', 'per-room', 'per-unit'],
      default: 'per-person'
    },
    paidTo: String, // supplier, direct, etc.
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: ['not-booked', 'booking-required', 'booked', 'cancelled'],
    default: 'not-booked'
  },
  notes: String,
  internalNotes: String, // Only visible to agents
  order: {
    type: Number,
    default: 0
  },
  images: [String],
  documents: [String], // PDFs, vouchers, tickets
}, { _id: true, timestamps: true });

// Enhanced Day Schema
const daySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
  },
  title: String,
  date: Date,
  
  // Location information for the day
  location: {
    country: String,
    state: String,
    city: String,
    region: String
  },
  
  // Weather information
  weather: {
    condition: String, // sunny, rainy, cloudy, etc.
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    description: String,
    icon: String // weather icon code
  },
  
  // Day overview
  overview: String,
  highlights: [String],
  coverImage: String,
  images: [String],
  
  // Time of day sections
  components: [componentSchema],
  
  // Distance tracking
  totalDistance: {
    value: Number,
    unit: String
  },
  
  // Notes for the day
  notes: String,
  internalNotes: String, // Only for agents
  
}, { _id: true, timestamps: true });

const itinerarySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  
  // Basic Information
  title: {
    type: String,
    required: [true, 'Please provide itinerary title'],
    trim: true,
  },
  description: String,
  coverImage: String,
  images: [String],
  
  // Destination Information
  destinations: [{
    country: String,
    state: String,
    city: String,
    region: String,
    duration: Number // days in this destination
  }],
  
  // Primary destination (for backward compatibility)
  destination: {
    country: {
      type: String,
      required: true,
    },
    state: String,
    city: String,
  },
  
  // Duration
  duration: {
    days: Number,
    nights: Number,
  },
  startDate: Date,
  endDate: Date,
  
  // Day-by-day itinerary
  days: [daySchema],
  
  // Overview and highlights
  overview: String,
  highlights: [String],
  inclusions: [String],
  exclusions: [String],
  
  // Pricing Information
  estimatedCost: {
    baseCost: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    breakdown: {
      accommodation: Number,
      transport: Number,
      activities: Number,
      meals: Number,
      guides: Number,
      permits: Number,
      insurance: Number,
      other: Number,
    },
    markup: {
      percentage: Number,
      amount: Number
    },
    taxes: {
      percentage: Number,
      amount: Number
    },
    totalCost: Number,
    profitMargin: Number
  },
  supplierReferences: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    serviceType: String,
    cost: Number,
    contactPerson: String,
    contactPhone: String,
    contactEmail: String
  }],
  
  // Categorization
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'difficult', 'extreme'],
  },
  travelStyle: {
    type: String,
    enum: ['budget', 'comfort', 'luxury', 'adventure', 'relaxation', 'cultural', 'family', 'honeymoon', 'backpacking'],
  },
  themes: [{
    type: String,
    enum: ['adventure', 'beach', 'city', 'cultural', 'family', 'honeymoon', 'luxury', 'nature', 
           'photography', 'pilgrimage', 'relaxation', 'road-trip', 'shopping', 'wellness', 'wildlife']
  }],
  
  // Seasonal Information
  bestSeasonStart: Number, // month (1-12)
  bestSeasonEnd: Number,
  seasonalNotes: String,
  
  // Group Information
  minGroupSize: Number,
  maxGroupSize: Number,
  ageRange: {
    min: Number,
    max: Number
  },
  suitableFor: [{
    type: String,
    enum: ['solo', 'couples', 'families', 'groups', 'seniors', 'kids', 'teens', 'students']
  }],
  
  // Requirements and Restrictions
  requirements: {
    visa: String,
    vaccination: [String],
    insurance: Boolean,
    fitnessLevel: String,
    specialPermits: [String]
  },
  
  // Customer/Quote Reference
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'active', 'published', 'archived', 'sent-to-client', 'approved', 'rejected', 'in-progress', 'completed'],
    default: 'draft',
  },
  
  // Versioning and Cloning
  version: {
    type: Number,
    default: 1,
  },
  clonedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateCategory: String,
  
  // Sharing and Access
  shareableLink: {
    token: String,
    expiresAt: Date,
    password: String,
    views: {
      type: Number,
      default: 0
    }
  },
  
  // Client Interaction
  clientFeedback: [{
    date: Date,
    comment: String,
    rating: Number,
    changes: [String]
  }],
  
  // Agent Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: Date,
  lastSentAt: Date,
}, {
  timestamps: true,
});

// Indexes
itinerarySchema.index({ 'destination.country': 1 });
itinerarySchema.index({ 'destinations.country': 1 });
itinerarySchema.index({ 'destinations.city': 1 });
itinerarySchema.index({ status: 1 });
itinerarySchema.index({ createdBy: 1 });
itinerarySchema.index({ assignedTo: 1 });
itinerarySchema.index({ customerId: 1 });
itinerarySchema.index({ isTemplate: 1 });
itinerarySchema.index({ travelStyle: 1 });
itinerarySchema.index({ title: 'text', description: 'text', overview: 'text' });
itinerarySchema.index({ tags: 1 });
itinerarySchema.index({ themes: 1 });
itinerarySchema.index({ startDate: 1 });
itinerarySchema.index({ 'shareableLink.token': 1 });

// Virtual for total days
itinerarySchema.virtual('totalDays').get(function() {
  return this.days.length;
});

// Virtual for total nights
itinerarySchema.virtual('totalNights').get(function() {
  return Math.max(0, this.days.length - 1);
});

// Calculate estimated cost before saving
itinerarySchema.pre('save', function(next) {
  if (this.days && this.days.length > 0) {
    let totalCost = 0;
    const breakdown = {
      accommodation: 0,
      transport: 0,
      activities: 0,
      meals: 0,
      guides: 0,
      permits: 0,
      insurance: 0,
      other: 0,
    };

    this.days.forEach(day => {
      day.components.forEach(component => {
        if (component.cost && component.cost.amount) {
          const amount = component.cost.amount;
          totalCost += amount;
          
          // Categorize costs based on component type
          switch (component.type) {
            case 'stay':
              breakdown.accommodation += amount;
              break;
            case 'transfer':
              breakdown.transport += amount;
              break;
            case 'activity':
              // Check if it's a guide service
              if (component.activity && component.activity.guideInfo && component.activity.guideInfo.provided) {
                breakdown.guides += amount;
              } else {
                breakdown.activities += amount;
              }
              break;
            case 'meal':
              breakdown.meals += amount;
              break;
            default:
              breakdown.other += amount;
          }
        }
      });
    });

    // Apply markup if defined
    if (this.estimatedCost.markup && this.estimatedCost.markup.percentage) {
      const markupAmount = (totalCost * this.estimatedCost.markup.percentage) / 100;
      this.estimatedCost.markup.amount = markupAmount;
      totalCost += markupAmount;
    }

    // Apply taxes if defined
    if (this.estimatedCost.taxes && this.estimatedCost.taxes.percentage) {
      const taxAmount = (totalCost * this.estimatedCost.taxes.percentage) / 100;
      this.estimatedCost.taxes.amount = taxAmount;
      totalCost += taxAmount;
    }

    this.estimatedCost.baseCost = totalCost;
    this.estimatedCost.breakdown = breakdown;
    this.estimatedCost.totalCost = totalCost;
    
    // Calculate profit margin
    const costWithoutMarkup = totalCost - (this.estimatedCost.markup?.amount || 0);
    this.estimatedCost.profitMargin = this.estimatedCost.markup?.amount || 0;
  }
  
  // Auto-calculate duration
  if (this.days && this.days.length > 0) {
    this.duration.days = this.days.length;
    this.duration.nights = Math.max(0, this.days.length - 1);
  }
  
  // Set start and end dates from first and last day
  if (this.days && this.days.length > 0) {
    const daysWithDates = this.days.filter(d => d.date);
    if (daysWithDates.length > 0) {
      this.startDate = daysWithDates[0].date;
      this.endDate = daysWithDates[daysWithDates.length - 1].date;
    }
  }
  
  next();
});

// Instance Methods

// Clone itinerary
itinerarySchema.methods.clone = function() {
  const cloned = this.toObject();
  delete cloned._id;
  delete cloned.createdAt;
  delete cloned.updatedAt;
  cloned.clonedFrom = this._id;
  cloned.version = 1;
  cloned.title = `${this.title} (Copy)`;
  cloned.status = 'draft';
  
  // Reset tracking fields
  cloned.viewCount = 0;
  cloned.downloadCount = 0;
  delete cloned.lastViewedAt;
  delete cloned.lastSentAt;
  delete cloned.shareableLink;
  delete cloned.clientFeedback;
  
  return cloned;
};

// Generate shareable link
itinerarySchema.methods.generateShareableLink = function(expiryDays = 30, password = null) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  
  this.shareableLink = {
    token,
    expiresAt,
    password: password ? crypto.createHash('sha256').update(password).digest('hex') : null,
    views: 0
  };
  
  return token;
};

// Increment view count
itinerarySchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// Get total component count
itinerarySchema.methods.getTotalComponents = function() {
  return this.days.reduce((total, day) => total + day.components.length, 0);
};

// Get components by type
itinerarySchema.methods.getComponentsByType = function(type) {
  const components = [];
  this.days.forEach(day => {
    day.components.forEach(component => {
      if (component.type === type) {
        components.push(component);
      }
    });
  });
  return components;
};

// Static Methods

// Find templates
itinerarySchema.statics.findTemplates = function(filters = {}) {
  return this.find({ ...filters, isTemplate: true, status: 'published' });
};

// Find by destination
itinerarySchema.statics.findByDestination = function(country, city = null) {
  const query = { 'destinations.country': country };
  if (city) {
    query['destinations.city'] = city;
  }
  return this.find(query);
};

// Find popular itineraries
itinerarySchema.statics.findPopular = function(limit = 10) {
  return this.find({ status: 'published' })
    .sort('-viewCount -downloadCount')
    .limit(limit);
};

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary;
