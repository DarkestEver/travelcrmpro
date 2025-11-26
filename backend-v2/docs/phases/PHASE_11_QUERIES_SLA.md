# Phase 11: Queries & SLA Management

**Status:** ❌ Not Started  
**Priority:** P1 (High)  
**Estimated Time:** 5-6 days  
**Dependencies:** Phase 1 (Auth & Multi-Tenant), Phase 3 (Lead Management)

## Overview

Query intake and management system with auto-assignment engine, SLA tracking, escalation workflow, and agent workload balancing.

## Current Implementation Status

### ✅ Implemented
- None - This phase is completely new

### ❌ Missing (100%)
- [ ] **Query model** with complete schema
- [ ] **Query CRUD** operations
- [ ] **Auto-assignment engine** (round-robin, workload-based, skill-based)
- [ ] **Agent availability** tracking (online/offline)
- [ ] **SLA deadline** calculation
- [ ] **SLA escalation** system (4 levels)
- [ ] **Priority management** (high/medium/low)
- [ ] **Status workflow** (draft → pending → assigned → quoted → converted)
- [ ] **Query source** tracking (web, phone, email, referral, walk-in)
- [ ] **Duplicate detection**
- [ ] **Agent workload** calculation
- [ ] **Query filters** and search

## Database Models

### Query Schema (NEW - To Implement)

```javascript
const querySchema = new mongoose.Schema({
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
    unique: true,
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
    referredBy: String, // For referral source
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
      required: true,
      index: true,
    },
    responseDeadline: Date, // First response deadline
    resolutionDeadline: Date, // Final resolution deadline
    
    responded: {
      type: Boolean,
      default: false,
    },
    respondedAt: Date,
    responseTime: Number, // Minutes
    
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolutionTime: Number, // Minutes
    
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
  return !this.sla.resolved && new Date() > this.sla.deadline;
});

// Virtual: Time until deadline
querySchema.virtual('timeUntilDeadline').get(function() {
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
  if (!this.sla.resolved && !this.sla.breached) {
    if (new Date() > this.sla.deadline) {
      this.sla.breached = true;
      this.sla.breachedAt = new Date();
    }
  }
  next();
});
```

### AgentAvailability Schema (NEW - To Implement)

```javascript
const agentAvailabilitySchema = new mongoose.Schema({
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
    unique: true,
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

  skills: [String], // For skill-based routing
  
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

// Index
agentAvailabilitySchema.index({ tenant: 1, isOnline: 1, status: 1 });
```

## API Endpoints

```javascript
// ========== Query Management ==========

// List queries
GET /queries
Query params:
  - status
  - priority
  - assignedTo
  - source
  - dateFrom, dateTo
  - overdue (boolean)
  - unassigned (boolean)
  - page, limit, sort

// Get query
GET /queries/:id

// Create query
POST /queries/create
Body: Query schema

// Update query
PATCH /queries/:id

// Delete query
DELETE /queries/:id

// ========== Assignment ==========

// Assign manually
POST /queries/:id/assign
Body: { agentId }

// Auto-assign (round-robin)
POST /queries/:id/auto-assign

// Bulk assign
POST /queries/bulk-assign
Body: { queryIds: [], agentId }

// Reassign
POST /queries/:id/reassign
Body: { agentId, reason }

// Unassign
POST /queries/:id/unassign

// ========== Status Management ==========

// Update status
PATCH /queries/:id/status
Body: { status, notes }

// Mark as responded
POST /queries/:id/mark-responded

// Mark as resolved
POST /queries/:id/mark-resolved

// ========== SLA & Escalation ==========

// Get overdue queries
GET /queries/overdue

// Escalate query
POST /queries/:id/escalate
Body: { level, escalateTo }

// Get escalated queries
GET /queries/escalated

// ========== Agent Availability ==========

// Set agent status
POST /agents/availability/status
Body: { status } // available, busy, away, offline

// Get online agents
GET /agents/online

// Get agent workload
GET /agents/:id/workload

// Auto-assignment config
GET /agents/assignment-config
PATCH /agents/assignment-config
Body: { method, maxCapacity }

// ========== Analytics ==========

// Query statistics
GET /queries/stats
Query: dateFrom, dateTo, groupBy

// SLA compliance report
GET /queries/sla-report
Query: dateFrom, dateTo

// Agent performance
GET /queries/agent-performance
Query: dateFrom, dateTo, agentId

// Source analysis
GET /queries/source-analysis

// ========== Duplicate Detection ==========

// Find duplicates
POST /queries/find-duplicates
Body: { email, phone }

// Mark as duplicate
POST /queries/:id/mark-duplicate
Body: { originalQueryId }
```

## Implementation Steps

### Step 1: Create Models (1 day)
- [ ] Create Query model
- [ ] Create AgentAvailability model
- [ ] Add all indexes
- [ ] Add virtual fields
- [ ] Implement instance methods
- [ ] Implement static methods
- [ ] Add validation hooks

### Step 2: Auto-Assignment Engine (1.5 days)
- [ ] Create `src/services/autoAssignmentService.js`
- [ ] Implement round-robin algorithm
  - [ ] Get all online agents
  - [ ] Skip agents at capacity
  - [ ] Round-robin selection
- [ ] Implement workload-based assignment
  - [ ] Calculate current workload per agent
  - [ ] Assign to agent with lowest workload
- [ ] Implement skill-based assignment
  - [ ] Match query requirements to agent skills
  - [ ] Assign to best-matched agent
- [ ] Update agent availability after assignment

### Step 3: SLA Service (1 day)
- [ ] Create `src/services/slaService.js`
- [ ] Implement SLA calculation based on priority
- [ ] Create SLA monitoring job (Bull, runs every hour)
  - [ ] Find queries approaching deadline (1 hour before)
  - [ ] Send warning notifications
  - [ ] Find breached queries
  - [ ] Mark as breached
  - [ ] Trigger escalation
- [ ] Implement escalation logic (4 levels)
  - [ ] Level 1: Agent's manager
  - [ ] Level 2: Senior manager
  - [ ] Level 3: Department head
  - [ ] Level 4: CEO/CTO
- [ ] Send escalation notifications

### Step 4: Query Controller (1 day)
- [ ] Create `src/controllers/queryController.js`
- [ ] Implement `getAllQueries()` with filters
- [ ] Implement `getQuery()`
- [ ] Implement `createQuery()`
  - [ ] Auto-generate query number
  - [ ] Calculate SLA deadline
  - [ ] Detect duplicates
  - [ ] Trigger auto-assignment (if enabled)
- [ ] Implement `updateQuery()`
- [ ] Implement `deleteQuery()`
- [ ] Implement `assignQuery()`
- [ ] Implement `autoAssignQuery()`
- [ ] Implement `bulkAssign()`
- [ ] Implement `reassignQuery()`
- [ ] Implement `unassignQuery()`
- [ ] Implement `updateStatus()`
- [ ] Implement `markAsResponded()`
- [ ] Implement `markAsResolved()`
- [ ] Implement `escalateQuery()`
- [ ] Implement `getOverdueQueries()`
- [ ] Implement `getEscalatedQueries()`
- [ ] Implement `getQueryStats()`
- [ ] Implement `getSLAReport()`
- [ ] Implement `getAgentPerformance()`
- [ ] Implement `getSourceAnalysis()`
- [ ] Implement `findDuplicates()`
- [ ] Implement `markAsDuplicate()`

### Step 5: Agent Availability Controller (0.5 day)
- [ ] Create `src/controllers/agentAvailabilityController.js`
- [ ] Implement `setAgentStatus()`
- [ ] Implement `getOnlineAgents()`
- [ ] Implement `getAgentWorkload()`
- [ ] Implement `getAssignmentConfig()`
- [ ] Implement `updateAssignmentConfig()`
- [ ] Create heartbeat endpoint for keeping agents online

### Step 6: Validation & Routes (0.5 day)
- [ ] Create `src/validation/querySchemas.js`
- [ ] Create `src/routes/query.js`
- [ ] Create `src/routes/agentAvailability.js`
- [ ] Apply RBAC
- [ ] Mount routes in app.js

### Step 7: Testing (1 day)
- [ ] Create `tests/integration/query.test.js`
- [ ] Create `tests/integration/auto-assignment.test.js`
- [ ] Test query CRUD
- [ ] Test query numbering
- [ ] Test SLA calculation
- [ ] Test round-robin assignment
- [ ] Test workload-based assignment
- [ ] Test skill-based assignment
- [ ] Test SLA breach detection
- [ ] Test escalation workflow
- [ ] Test duplicate detection
- [ ] Test agent availability tracking

## Testing Strategy

### Unit Tests
- [ ] Test SLA deadline calculation
- [ ] Test round-robin algorithm
- [ ] Test workload calculation
- [ ] Test skill matching
- [ ] Test duplicate detection logic

### Integration Tests
- [ ] Test complete query lifecycle
- [ ] Test auto-assignment with multiple agents
- [ ] Test SLA monitoring job
- [ ] Test escalation at all levels
- [ ] Test agent status updates
- [ ] Test workload tracking

## Acceptance Criteria

- [ ] Queries auto-generate unique numbers per tenant
- [ ] SLA deadlines calculate correctly based on priority
- [ ] Round-robin assignment distributes evenly
- [ ] Workload-based assignment balances load
- [ ] Skill-based assignment matches requirements
- [ ] Offline agents are skipped in assignment
- [ ] Agents at capacity are skipped
- [ ] SLA breach detection works correctly
- [ ] Escalation triggers at correct times
- [ ] Escalation notifications sent
- [ ] Duplicate detection identifies matches
- [ ] Agent availability tracking is real-time
- [ ] All tests pass (>80% coverage)

## TODO Checklist

### Database
- [ ] Create Query model
- [ ] Create AgentAvailability model
- [ ] Add indexes
- [ ] Test models

### Services
- [ ] Create autoAssignmentService.js
- [ ] Create slaService.js
- [ ] Implement all assignment algorithms
- [ ] Implement SLA monitoring job
- [ ] Implement escalation logic

### Controllers
- [ ] Create queryController.js
- [ ] Create agentAvailabilityController.js
- [ ] Implement all endpoints

### Validation & Routes
- [ ] Create querySchemas.js
- [ ] Create routes
- [ ] Apply RBAC
- [ ] Mount routes

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Auto-assignment tests
- [ ] SLA tests

### Documentation
- [ ] Update API docs
- [ ] SLA configuration guide
- [ ] Auto-assignment guide

## Dependencies

**Environment Variables:**
```env
SLA_URGENT_MINUTES=120
SLA_HIGH_MINUTES=240
SLA_MEDIUM_MINUTES=1440
SLA_LOW_MINUTES=2880
AUTO_ASSIGNMENT_METHOD=workload  # round_robin | workload | skill
MAX_AGENT_QUERIES=50
MAX_AGENT_LEADS=100
```

## Notes

- SLA is critical for customer satisfaction
- Auto-assignment improves response time
- Monitor agent workload to prevent burnout
- Escalation should be transparent to customers
- Track conversion rate from queries to bookings
- Consider AI-powered assignment in future
