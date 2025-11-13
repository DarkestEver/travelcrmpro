const mongoose = require('mongoose');

/**
 * Query Assignment Model
 * Tracks which users (agents/suppliers/customers) are assigned to queries/emails/quotes
 */
const queryAssignmentSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // What is being assigned
  entityType: {
    type: String,
    required: true,
    enum: ['EmailLog', 'Quote', 'Booking', 'QuoteRequest'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },
  
  // Who is assigned
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedRole: {
    type: String,
    enum: ['agent', 'supplier', 'customer', 'operator'],
    required: true,
    index: true
  },
  
  // Assignment metadata
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'reassigned', 'cancelled'],
    default: 'assigned',
    index: true
  },
  statusUpdatedAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Due date
  dueDate: {
    type: Date,
    index: true
  },
  
  // Notes
  notes: String,
  assignmentNotes: String,
  
  // Completion
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completionNotes: String,
  
  // Reassignment history
  reassignmentHistory: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reassignedAt: Date,
    reassignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Notifications sent
  notificationsSent: [{
    type: {
      type: String,
      enum: ['assignment', 'reminder', 'update', 'completion']
    },
    sentAt: Date,
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes
queryAssignmentSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
queryAssignmentSchema.index({ tenantId: 1, assignedTo: 1, status: 1 });
queryAssignmentSchema.index({ tenantId: 1, assignedRole: 1 });
queryAssignmentSchema.index({ tenantId: 1, dueDate: 1, status: 1 });
queryAssignmentSchema.index({ tenantId: 1, priority: 1, status: 1 });

// Pre-save middleware
queryAssignmentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusUpdatedAt = new Date();
  }
  next();
});

// Methods
queryAssignmentSchema.methods.complete = async function(userId, notes) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  this.completionNotes = notes;
  return this.save();
};

queryAssignmentSchema.methods.reassign = async function(fromUserId, toUserId, reason, reassignedBy) {
  this.reassignmentHistory.push({
    from: fromUserId,
    to: toUserId,
    reason,
    reassignedAt: new Date(),
    reassignedBy
  });
  this.assignedTo = toUserId;
  this.status = 'reassigned';
  return this.save();
};

// Statics
queryAssignmentSchema.statics.getAssignmentsForUser = function(userId, tenantId, filters = {}) {
  const query = {
    assignedTo: userId,
    tenantId,
    ...filters
  };
  return this.find(query)
    .populate('assignedBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email role')
    .sort({ priority: -1, dueDate: 1, createdAt: -1 });
};

queryAssignmentSchema.statics.getAssignmentsForEntity = function(entityType, entityId, tenantId) {
  return this.find({ entityType, entityId, tenantId })
    .populate('assignedTo', 'firstName lastName email role')
    .populate('assignedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

const QueryAssignment = mongoose.model('QueryAssignment', queryAssignmentSchema);

module.exports = QueryAssignment;
