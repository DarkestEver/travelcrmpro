const mongoose = require('mongoose');
const { Schema } = mongoose;

const querySchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Query identification
  queryNumber: {
    type: String,
    required: true,
    index: true,
  },

  // Source tracking
  source: {
    type: String,
    required: true,
    enum: ['website', 'phone', 'email', 'whatsapp', 'facebook', 'instagram', 'referral', 'walk_in', 'other'],
    index: true,
  },

  sourceDetails: {
    referrerUrl: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    referredBy: String,
  },

  // Customer information
  customer: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: String,
    countryCode: String,
  },

  // Link to existing lead (if converted)
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    index: true,
  },

  // Trip details
  tripDetails: {
    destination: {
      type: String,
      required: true,
      index: true,
    },
    alternateDestinations: [String],
    
    travelDates: {
      preferred: {
        from: Date,
        to: Date,
      },
      flexible: {
        type: Boolean,
        default: false,
      },
      flexibilityDays: Number,
    },

    duration: {
      days: Number,
      nights: Number,
    },

    travelers: {
      adults: {
        type: Number,
        required: true,
        default: 2,
        min: 1,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
      infants: {
        type: Number,
        default: 0,
        min: 0,
      },
      childAges: [Number],
    },
  },

  // Budget
  budget: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    isFlexible: {
      type: Boolean,
      default: false,
    },
    range: {
      min: Number,
      max: Number,
    },
  },

  // Trip type and preferences
  tripType: {
    type: String,
    enum: ['leisure', 'honeymoon', 'family', 'adventure', 'business', 'pilgrimage', 'group', 'solo', 'other'],
    index: true,
  },

  preferences: {
    accommodation: {
      type: String,
      enum: ['budget', 'standard', 'deluxe', 'luxury', 'any'],
    },
    transport: {
      type: String,
      enum: ['flight', 'train', 'bus', 'car', 'any'],
    },
    mealPlan: {
      type: String,
      enum: ['room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive'],
    },
    activities: [String],
    specialRequests: String,
  },

  // Assignment
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },

  assignedAt: Date,

  assignmentMethod: {
    type: String,
    enum: ['manual', 'auto_round_robin', 'auto_workload', 'auto_skill'],
  },

  previousAssignments: [{
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: Date,
    unassignedAt: Date,
    reason: String,
  }],

  // Status workflow
  status: {
    type: String,
    enum: ['draft', 'pending', 'assigned', 'in_progress', 'quoted', 'won', 'lost', 'cancelled'],
    default: 'draft',
    index: true,
  },

  statusHistory: [{
    status: {
      type: String,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  }],

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
  },

  // SLA tracking
  sla: {
    deadline: {
      type: Date,
      index: true,
    },
    responseDeadline: Date,
    resolutionDeadline: Date,
    
    responded: {
      type: Boolean,
      default: false,
    },
    respondedAt: Date,
    responseTime: Number,
    
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolutionTime: Number,
    
    breached: {
      type: Boolean,
      default: false,
    },
    breachedAt: Date,
    
    escalated: {
      type: Boolean,
      default: false,
    },
    escalationLevel: {
      type: Number,
      min: 0,
      max: 4,
      default: 0,
    },
    escalatedAt: Date,
    escalatedTo: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      level: Number,
      escalatedAt: Date,
      notified: Boolean,
    }],
  },

  // Communication
  notes: [{
    text: {
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
    isInternal: {
      type: Boolean,
      default: false,
    },
  }],

  // Related entities
  quotes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quote',
  }],

  // Tags and metadata
  tags: [String],
  customFields: Schema.Types.Mixed,

  // Duplicate detection
  duplicateOf: {
    type: Schema.Types.ObjectId,
    ref: 'Query',
  },

  relatedQueries: [{
    type: Schema.Types.ObjectId,
    ref: 'Query',
  }],

  // Tracking
  viewedBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
querySchema.index({ tenant: 1, queryNumber: 1 }, { unique: true });
querySchema.index({ tenant: 1, status: 1, priority: 1 });
querySchema.index({ tenant: 1, assignedTo: 1, status: 1 });
querySchema.index({ tenant: 1, 'sla.deadline': 1 });
querySchema.index({ tenant: 1, 'customer.email': 1 });
querySchema.index({ tenant: 1, 'customer.phone': 1 });
querySchema.index({ tenant: 1, source: 1, createdAt: 1 });

// Virtual: Is overdue
querySchema.virtual('isOverdue').get(function() {
  return !this.sla.resolved && this.sla.deadline && new Date() > this.sla.deadline;
});

// Virtual: Time until deadline
querySchema.virtual('timeUntilDeadline').get(function() {
  if (!this.sla.deadline) return null;
  const now = new Date();
  const diff = this.sla.deadline - now;
  return Math.ceil(diff / (1000 * 60)); // Minutes
});

// Static: Generate query number
querySchema.statics.generateQueryNumber = async function(tenantId) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await this.countDocuments({
    tenant: tenantId,
    queryNumber: new RegExp(`^QRY-${year}${month}-`),
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `QRY-${year}${month}-${sequence}`;
};

// Method: Calculate SLA deadline
querySchema.methods.calculateSLA = function() {
  const now = new Date();
  let deadlineMinutes;

  switch (this.priority) {
    case 'urgent':
      deadlineMinutes = 120; // 2 hours
      break;
    case 'high':
      deadlineMinutes = 240; // 4 hours
      break;
    case 'medium':
      deadlineMinutes = 1440; // 24 hours
      break;
    case 'low':
      deadlineMinutes = 2880; // 48 hours
      break;
    default:
      deadlineMinutes = 1440;
  }

  this.sla.deadline = new Date(now.getTime() + deadlineMinutes * 60 * 1000);
  this.sla.responseDeadline = new Date(now.getTime() + (deadlineMinutes / 2) * 60 * 1000);
  this.sla.resolutionDeadline = this.sla.deadline;
};

// Method: Mark as responded
querySchema.methods.markAsResponded = function() {
  if (!this.sla.responded) {
    this.sla.responded = true;
    this.sla.respondedAt = new Date();
    this.sla.responseTime = Math.ceil((this.sla.respondedAt - this.createdAt) / (1000 * 60));
  }
};

// Method: Mark as resolved
querySchema.methods.markAsResolved = function() {
  if (!this.sla.resolved) {
    this.sla.resolved = true;
    this.sla.resolvedAt = new Date();
    this.sla.resolutionTime = Math.ceil((this.sla.resolvedAt - this.createdAt) / (1000 * 60));
  }
};

// Method: Escalate
querySchema.methods.escalate = function(level, userId) {
  this.sla.escalated = true;
  this.sla.escalationLevel = level;
  this.sla.escalatedAt = new Date();
  
  this.sla.escalatedTo.push({
    user: userId,
    level,
    escalatedAt: new Date(),
    notified: false,
  });
};

// Method: Assign to agent
querySchema.methods.assignTo = function(agentId, method = 'manual') {
  // Store previous assignment
  if (this.assignedTo) {
    this.previousAssignments.push({
      agent: this.assignedTo,
      assignedAt: this.assignedAt,
      unassignedAt: new Date(),
      reason: 'Reassigned',
    });
  }

  this.assignedTo = agentId;
  this.assignedAt = new Date();
  this.assignmentMethod = method;
  
  if (this.status === 'pending') {
    this.status = 'assigned';
  }
};

// Pre-save: Update status history
querySchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.updatedBy,
    });
  }
  next();
});

// Pre-save: Check SLA breach
querySchema.pre('save', function(next) {
  if (!this.sla.resolved && !this.sla.breached && this.sla.deadline) {
    if (new Date() > this.sla.deadline) {
      this.sla.breached = true;
      this.sla.breachedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Query', querySchema);
