const mongoose = require('mongoose');
const { Schema } = mongoose;
const { USER_ROLES } = require('../config/constants');

/**
 * Lead/Query Schema
 * Represents customer inquiries and leads across tenants
 */
const leadSchema = new Schema(
  {
    // Tenant Association
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Lead Source
    source: {
      type: String,
      enum: ['website', 'phone', 'email', 'referral', 'walk-in', 'social-media', 'advertisement', 'other'],
      required: true,
      default: 'website',
    },

    // Lead Status
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'won', 'lost', 'closed'],
      required: true,
      default: 'new',
      index: true,
    },

    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },

    // Customer Information
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Customer email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },

    // Travel Requirements
    requirements: {
      destination: {
        type: String,
        trim: true,
      },
      travelDates: {
        startDate: Date,
        endDate: Date,
        flexible: {
          type: Boolean,
          default: false,
        },
      },
      numberOfTravelers: {
        adults: {
          type: Number,
          min: 0,
          default: 1,
        },
        children: {
          type: Number,
          min: 0,
          default: 0,
        },
        infants: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
      budget: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'USD',
        },
      },
      packageType: {
        type: String,
        enum: ['budget', 'standard', 'luxury', 'custom'],
      },
      specialRequirements: {
        type: String,
        trim: true,
      },
    },

    // Assignment
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Timeline
    followUpDate: {
      type: Date,
      index: true,
    },

    expectedCloseDate: {
      type: Date,
    },

    // Conversion
    convertedToBooking: {
      type: Boolean,
      default: false,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    conversionDate: {
      type: Date,
    },

    // Estimated Value
    estimatedValue: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },

    // Communication History
    notes: [
      {
        note: {
          type: String,
          required: true,
        },
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Tags for categorization
    tags: [String],

    // Loss Reason (if status is lost)
    lossReason: {
      type: String,
      enum: ['price', 'timing', 'competitor', 'no-response', 'not-interested', 'other'],
    },

    lossNotes: {
      type: String,
      trim: true,
    },

    // Metadata
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for common queries
leadSchema.index({ tenant: 1, status: 1 });
leadSchema.index({ tenant: 1, assignedTo: 1 });
leadSchema.index({ tenant: 1, createdAt: -1 });
leadSchema.index({ 'customer.email': 1, tenant: 1 });
leadSchema.index({ followUpDate: 1, status: 1 });

// Text search index
leadSchema.index({
  'customer.name': 'text',
  'customer.email': 'text',
  'requirements.destination': 'text',
  tags: 'text',
});

// Virtual for total travelers
leadSchema.virtual('totalTravelers').get(function () {
  if (!this.requirements || !this.requirements.numberOfTravelers) return 0;
  const { adults = 0, children = 0, infants = 0 } = this.requirements.numberOfTravelers;
  return adults + children + infants;
});

// Virtual for days until follow-up
leadSchema.virtual('daysUntilFollowUp').get(function () {
  if (!this.followUpDate) return null;
  const now = new Date();
  const diff = this.followUpDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to add note
leadSchema.methods.addNote = function (note, userId) {
  this.notes.push({
    note,
    createdBy: userId,
    createdAt: new Date(),
  });
  return this.save();
};

// Method to check if overdue for follow-up
leadSchema.methods.isOverdue = function () {
  if (!this.followUpDate) return false;
  return new Date() > this.followUpDate && !['won', 'lost', 'closed'].includes(this.status);
};

// Static method to get leads by status
leadSchema.statics.getByStatus = function (tenantId, status) {
  return this.find({ tenant: tenantId, status }).populate('assignedTo', 'firstName lastName email');
};

// Static method to get overdue leads
leadSchema.statics.getOverdue = function (tenantId) {
  return this.find({
    tenant: tenantId,
    followUpDate: { $lt: new Date() },
    status: { $nin: ['won', 'lost', 'closed'] },
  }).populate('assignedTo', 'firstName lastName email');
};

module.exports = mongoose.model('Lead', leadSchema);
