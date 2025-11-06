const mongoose = require('mongoose');

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
  description: String,
  time: String,
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
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
  },
  details: mongoose.Schema.Types.Mixed, // Flexible for different component types
  images: [String],
  notes: String,
  order: Number,
}, { _id: true });

const daySchema = new mongoose.Schema({
  dayNo: {
    type: Number,
    required: true,
  },
  title: String,
  date: Date,
  components: [componentSchema],
}, { _id: true });

const itinerarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide itinerary title'],
    trim: true,
  },
  description: String,
  destination: {
    country: {
      type: String,
      required: true,
    },
    state: String,
    city: String,
  },
  duration: {
    days: Number,
    nights: Number,
  },
  days: [daySchema],
  images: [String],
  highlights: [String],
  inclusions: [String],
  exclusions: [String],
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
      other: Number,
    },
  },
  supplierReferences: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    serviceType: String,
    cost: Number,
  }],
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'difficult'],
  },
  travelStyle: {
    type: String,
    enum: ['budget', 'comfort', 'luxury'],
  },
  bestSeasonStart: Number, // month (1-12)
  bestSeasonEnd: Number,
  minGroupSize: Number,
  maxGroupSize: Number,
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'published'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  clonedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
  },
}, {
  timestamps: true,
});

// Indexes
itinerarySchema.index({ 'destination.country': 1 });
itinerarySchema.index({ status: 1 });
itinerarySchema.index({ createdBy: 1 });
itinerarySchema.index({ title: 'text', description: 'text' });
itinerarySchema.index({ tags: 1 });

// Calculate estimated cost before saving
itinerarySchema.pre('save', function(next) {
  if (this.days && this.days.length > 0) {
    let totalCost = 0;
    const breakdown = {
      accommodation: 0,
      transport: 0,
      activities: 0,
      meals: 0,
      other: 0,
    };

    this.days.forEach(day => {
      day.components.forEach(component => {
        if (component.cost && component.cost.amount) {
          totalCost += component.cost.amount;
          
          // Categorize costs
          switch (component.type) {
            case 'stay':
              breakdown.accommodation += component.cost.amount;
              break;
            case 'transfer':
              breakdown.transport += component.cost.amount;
              break;
            case 'activity':
              breakdown.activities += component.cost.amount;
              break;
            case 'meal':
              breakdown.meals += component.cost.amount;
              break;
            default:
              breakdown.other += component.cost.amount;
          }
        }
      });
    });

    this.estimatedCost.baseCost = totalCost;
    this.estimatedCost.breakdown = breakdown;
  }
  next();
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary;
