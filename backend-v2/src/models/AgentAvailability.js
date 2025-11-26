const mongoose = require('mongoose');
const { Schema } = mongoose;

const agentAvailabilitySchema = new Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  agent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  isOnline: {
    type: Boolean,
    default: false,
    index: true,
  },

  lastSeenAt: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ['available', 'busy', 'away', 'offline'],
    default: 'offline',
    index: true,
  },

  currentWorkload: {
    activeQueries: {
      type: Number,
      default: 0,
    },
    activeLeads: {
      type: Number,
      default: 0,
    },
    overdueQueries: {
      type: Number,
      default: 0,
    },
  },

  skills: [String],
  
  maxCapacity: {
    queries: {
      type: Number,
      default: 50,
    },
    leads: {
      type: Number,
      default: 100,
    },
  },
}, {
  timestamps: true,
});

// Indexes
agentAvailabilitySchema.index({ tenant: 1, agent: 1 }, { unique: true });
agentAvailabilitySchema.index({ tenant: 1, isOnline: 1, status: 1 });

// Method: Update workload
agentAvailabilitySchema.methods.updateWorkload = async function() {
  const Query = mongoose.model('Query');
  const Lead = mongoose.model('Lead');

  const activeQueries = await Query.countDocuments({
    tenant: this.tenant,
    assignedTo: this.agent,
    status: { $in: ['assigned', 'in_progress'] },
  });

  const overdueQueries = await Query.countDocuments({
    tenant: this.tenant,
    assignedTo: this.agent,
    'sla.deadline': { $lt: new Date() },
    'sla.resolved': false,
  });

  const activeLeads = await Lead.countDocuments({
    tenant: this.tenant,
    assignedTo: this.agent,
    status: { $in: ['new', 'contacted', 'qualified'] },
  });

  this.currentWorkload = {
    activeQueries,
    activeLeads,
    overdueQueries,
  };

  await this.save();
};

// Static: Get available agents for assignment
agentAvailabilitySchema.statics.getAvailableAgents = function(tenantId) {
  return this.find({
    tenant: tenantId,
    isOnline: true,
    status: 'available',
  })
    .populate('agent', 'firstName lastName email')
    .sort({ 'currentWorkload.activeQueries': 1 }); // Lowest workload first
};

// Static: Find best agent for assignment
agentAvailabilitySchema.statics.findBestAgent = async function(tenantId, method = 'workload') {
  if (method === 'round_robin') {
    // Get all available agents
    const agents = await this.find({
      tenant: tenantId,
      isOnline: true,
      status: 'available',
    })
      .populate('agent')
      .sort({ 'agent.createdAt': 1 });

    if (agents.length === 0) return null;

    // Find agent with least recent assignment
    const Query = mongoose.model('Query');
    let bestAgent = null;
    let oldestAssignment = new Date();

    for (const agentAvail of agents) {
      const lastQuery = await Query.findOne({
        tenant: tenantId,
        assignedTo: agentAvail.agent._id,
      }).sort({ assignedAt: -1 });

      const lastAssignedAt = lastQuery?.assignedAt || new Date(0);
      
      if (lastAssignedAt < oldestAssignment) {
        oldestAssignment = lastAssignedAt;
        bestAgent = agentAvail;
      }
    }

    return bestAgent;
  } else {
    // Workload-based assignment (default)
    const agents = await this.find({
      tenant: tenantId,
      isOnline: true,
      status: 'available',
    })
      .populate('agent')
      .sort({ 'currentWorkload.activeQueries': 1 });

    return agents.length > 0 ? agents[0] : null;
  }
};

module.exports = mongoose.model('AgentAvailability', agentAvailabilitySchema);
