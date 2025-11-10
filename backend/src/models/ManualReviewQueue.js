const mongoose = require('mongoose');

const manualReviewQueueSchema = new mongoose.Schema({
  // Email Reference
  emailLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog',
    required: true,
    unique: true,
    index: true
  },
  
  // Review Reason
  reason: {
    type: String,
    enum: [
      'LOW_CONFIDENCE',           // AI confidence < threshold
      'CONFLICTING_CATEGORIES',   // Multiple categories with similar scores
      'SENSITIVE_CONTENT',        // VIP customer, complaint, refund request
      'HIGH_VALUE',               // Large booking amount
      'MANUAL_FLAG',              // Manually flagged by user
      'EXTRACTION_FAILED',        // Failed to extract required data
      'AMBIGUOUS_REQUEST',        // Unclear customer request
      'POLICY_VIOLATION',         // Potential policy issue
      'NEW_CUSTOMER',             // First-time customer
      'ESCALATION',               // Customer requested escalation
      'OTHER'
    ],
    required: true,
    index: true
  },
  reasonDetails: String,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    required: true,
    index: true
  },
  
  // AI Analysis (for context)
  aiSuggestion: {
    category: String,
    confidence: Number,
    extractedData: mongoose.Schema.Types.Mixed,
    suggestedResponse: String
  },
  
  // Review Status
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected', 'modified', 'escalated'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedAt: Date,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Review Details
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  
  // Review Decision
  decision: {
    action: {
      type: String,
      enum: ['approve_ai', 'reject_ai', 'manual_response', 'forward', 'ignore', 'reassign']
    },
    categoryOverride: String,
    extractedDataOverride: mongoose.Schema.Types.Mixed,
    customResponse: String,
    forwardTo: {
      email: String,
      userId: mongoose.Schema.Types.ObjectId
    }
  },
  
  // Response Tracking
  responseGenerated: {
    type: Boolean,
    default: false
  },
  responseSentAt: Date,
  responseApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timing
  queuedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  dueBy: {
    type: Date,
    index: true
  },
  completedAt: Date,
  timeInQueue: Number, // milliseconds
  
  // SLA Tracking
  slaTarget: Number, // minutes
  slaBreached: {
    type: Boolean,
    default: false
  },
  
  // Flags
  isUrgent: {
    type: Boolean,
    default: false,
    index: true
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  requiresManagerApproval: {
    type: Boolean,
    default: false
  },
  
  // Customer Context
  customerValue: {
    type: String,
    enum: ['vip', 'returning', 'new', 'at_risk'],
    index: true
  },
  previousBookings: Number,
  lifetimeValue: Number,
  
  // Comments/Discussion
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit Trail
  actions: [{
    action: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes
manualReviewQueueSchema.index({ tenantId: 1, status: 1, priority: -1, queuedAt: 1 });
manualReviewQueueSchema.index({ tenantId: 1, assignedTo: 1, status: 1 });
manualReviewQueueSchema.index({ tenantId: 1, isUrgent: 1, status: 1 });
manualReviewQueueSchema.index({ dueBy: 1, status: 1 });

// Pre-save hook to calculate SLA
manualReviewQueueSchema.pre('save', function(next) {
  if (this.completedAt && this.queuedAt) {
    this.timeInQueue = this.completedAt - this.queuedAt;
    
    // Check SLA breach
    if (this.slaTarget) {
      const slaMs = this.slaTarget * 60 * 1000;
      this.slaBreached = this.timeInQueue > slaMs;
    }
  }
  
  // Set due by if not set
  if (!this.dueBy && this.slaTarget) {
    this.dueBy = new Date(this.queuedAt.getTime() + (this.slaTarget * 60 * 1000));
  }
  
  next();
});

// Methods
manualReviewQueueSchema.methods.assign = function(userId, assignedBy) {
  this.assignedTo = userId;
  this.assignedAt = new Date();
  this.assignedBy = assignedBy;
  this.status = 'in_review';
  
  this.actions.push({
    action: 'assigned',
    userId: assignedBy,
    details: { assignedTo: userId }
  });
  
  return this.save();
};

manualReviewQueueSchema.methods.complete = function(decision, userId, notes) {
  this.status = decision.action === 'approve_ai' ? 'approved' : 'modified';
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.completedAt = new Date();
  this.reviewNotes = notes;
  this.decision = decision;
  
  this.actions.push({
    action: 'completed',
    userId,
    details: decision
  });
  
  return this.save();
};

manualReviewQueueSchema.methods.escalate = function(userId, reason) {
  this.isEscalated = true;
  this.priority = 'urgent';
  this.status = 'escalated';
  
  this.actions.push({
    action: 'escalated',
    userId,
    details: { reason }
  });
  
  return this.save();
};

manualReviewQueueSchema.methods.addComment = function(userId, comment) {
  this.comments.push({
    userId,
    comment
  });
  
  return this.save();
};

// Statics
manualReviewQueueSchema.statics.getMyQueue = function(tenantId, userId) {
  return this.find({
    tenantId,
    assignedTo: userId,
    status: { $in: ['pending', 'in_review'] }
  })
  .sort({ priority: -1, queuedAt: 1 })
  .populate('emailLogId', 'subject from snippet category')
  .populate('assignedBy', 'name email');
};

manualReviewQueueSchema.statics.getUnassignedQueue = function(tenantId) {
  return this.find({
    tenantId,
    status: 'pending',
    assignedTo: { $exists: false }
  })
  .sort({ priority: -1, queuedAt: 1 })
  .populate('emailLogId', 'subject from snippet category');
};

manualReviewQueueSchema.statics.getBreachedSLA = function(tenantId) {
  return this.find({
    tenantId,
    status: { $in: ['pending', 'in_review'] },
    dueBy: { $lt: new Date() }
  })
  .sort({ dueBy: 1 })
  .populate('emailLogId', 'subject from')
  .populate('assignedTo', 'name email');
};

manualReviewQueueSchema.statics.getQueueStats = async function(tenantId) {
  return this.aggregate([
    { $match: { tenantId: mongoose.Types.ObjectId(tenantId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgTimeInQueue: { $avg: '$timeInQueue' },
        urgentCount: {
          $sum: { $cond: ['$isUrgent', 1, 0] }
        },
        slaBreachedCount: {
          $sum: { $cond: ['$slaBreached', 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('ManualReviewQueue', manualReviewQueueSchema);
