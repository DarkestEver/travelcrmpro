const mongoose = require('mongoose');
const { Schema } = mongoose;

const campaignSchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Campaign identification
  name: {
    type: String,
    required: true,
    trim: true,
  },

  campaignType: {
    type: String,
    required: true,
    enum: [
      'follow_up',
      'birthday',
      'anniversary',
      'promotional',
      'seasonal',
      're_engagement',
      'referral',
    ],
    index: true,
  },

  // Target audience
  targetAudience: {
    segment: {
      type: String,
      enum: ['all_customers', 'past_customers', 'leads', 'specific_users', 'custom_filter'],
      required: true,
    },

    filters: [
      {
        field: String,
        operator: String,
        value: Schema.Types.Mixed,
      },
    ],

    specificUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    estimatedCount: Number,
  },

  // Campaign content
  content: {
    emailTemplate: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    smsTemplate: String,
    whatsappTemplate: String,

    subject: String,
    preheader: String,
  },

  // Scheduling
  schedule: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,

    frequency: {
      type: String,
      enum: ['one_time', 'recurring'],
      default: 'one_time',
    },

    recurrence: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
    },

    sendTime: String, // HH:mm
    timezone: String,
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'],
    default: 'draft',
    index: true,
  },

  // Analytics
  stats: {
    sent: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: Number,
      default: 0,
    },
    opened: {
      type: Number,
      default: 0,
    },
    clicked: {
      type: Number,
      default: 0,
    },
    converted: {
      type: Number,
      default: 0,
    },
    bounced: {
      type: Number,
      default: 0,
    },
    unsubscribed: {
      type: Number,
      default: 0,
    },
  },

  // Execution tracking
  lastRunAt: Date,
  nextRunAt: Date,

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
});

// Indexes
campaignSchema.index({ tenant: 1, status: 1 });
campaignSchema.index({ tenant: 1, campaignType: 1 });
campaignSchema.index({ 'schedule.startDate': 1, status: 1 });

// Method: Calculate campaign metrics
campaignSchema.methods.getMetrics = function () {
  const { sent, delivered, opened, clicked, converted } = this.stats;

  return {
    deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(2) : 0,
    openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : 0,
    clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(2) : 0,
    conversionRate: sent > 0 ? ((converted / sent) * 100).toFixed(2) : 0,
  };
};

// Method: Increment stat counter
campaignSchema.methods.incrementStat = async function (statName) {
  if (!this.stats.hasOwnProperty(statName)) {
    throw new Error(`Invalid stat name: ${statName}`);
  }

  this.stats[statName] += 1;
  return this.save();
};

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
