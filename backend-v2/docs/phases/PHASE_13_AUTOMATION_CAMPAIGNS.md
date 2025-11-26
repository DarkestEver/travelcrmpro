# Phase 13: Automation & Marketing Campaigns

**Status:** ❌ Not Started  
**Priority:** P2 (Medium)  
**Estimated Time:** 5-6 days  
**Dependencies:** Phase 8 (Email), Phase 11 (Queries & SLA)

## Overview

Workflow automation engine, SLA escalation system, follow-up campaigns, and marketing automation for birthdays, anniversaries, and promotional campaigns.

## Current Implementation Status

### ✅ Implemented
- None - This phase is completely new

### ❌ Missing (100%)
- [ ] **Automation rules engine**
- [ ] **SLA escalation** system (4 levels)
- [ ] **Follow-up campaigns** (day 3, 7, 14)
- [ ] **Birthday/anniversary** automation
- [ ] **Quote expiry** handling
- [ ] **Promotional campaigns**
- [ ] **Trigger-action** workflow builder
- [ ] **Campaign analytics**
- [ ] **Job monitoring** dashboard
- [ ] **Dead letter queue** (DLQ) handling

## Database Models

### AutomationRule Schema (NEW - To Implement)

```javascript
const automationRuleSchema = new mongoose.Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Rule identification
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: String,

  // Rule type
  ruleType: {
    type: String,
    required: true,
    enum: [
      'sla_escalation',
      'follow_up',
      'birthday',
      'anniversary',
      'quote_expiry',
      'booking_reminder',
      'payment_reminder',
      'review_request',
      'promotional',
      'custom'
    ],
    index: true,
  },

  // Trigger configuration
  trigger: {
    event: {
      type: String,
      required: true,
      enum: [
        'query_created',
        'quote_sent',
        'quote_viewed',
        'quote_expired',
        'booking_confirmed',
        'payment_received',
        'trip_completed',
        'sla_breached',
        'document_uploaded',
        'review_submitted',
        'scheduled', // For cron-based triggers
        'manual'
      ],
    },

    // Conditions (all must match)
    conditions: [{
      field: {
        type: String,
        required: true,
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in'],
        required: true,
      },
      value: Schema.Types.Mixed,
    }],

    // Schedule (for scheduled triggers)
    schedule: {
      type: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly', 'cron'],
      },
      time: String, // HH:mm format
      dayOfWeek: Number, // 0-6 for weekly
      dayOfMonth: Number, // 1-31 for monthly
      cronExpression: String, // For complex schedules
      timezone: {
        type: String,
        default: 'UTC',
      },
    },

    // Delay before execution
    delay: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
      },
    },
  },

  // Actions to perform
  actions: [{
    actionType: {
      type: String,
      required: true,
      enum: [
        'send_email',
        'send_sms',
        'send_whatsapp',
        'assign_query',
        'update_status',
        'create_task',
        'notify_user',
        'escalate',
        'create_lead',
        'update_field',
        'webhook'
      ],
    },

    config: {
      // For send_email
      emailTemplate: {
        type: Schema.Types.ObjectId,
        ref: 'EmailTemplate',
      },
      toField: String, // Field containing recipient email
      ccEmails: [String],
      bccEmails: [String],

      // For assign_query
      assignTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      assignmentMethod: String, // 'specific_user', 'round_robin', 'workload'

      // For update_status
      newStatus: String,

      // For escalate
      escalationLevel: Number,
      escalateTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },

      // For update_field
      fieldName: String,
      fieldValue: Schema.Types.Mixed,

      // For webhook
      webhookUrl: String,
      webhookMethod: String,
      webhookHeaders: Schema.Types.Mixed,
      webhookBody: Schema.Types.Mixed,

      // For notifications
      notificationMessage: String,
      notificationChannel: String, // 'in_app', 'email', 'sms'
    },
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  // Execution tracking
  executionCount: {
    type: Number,
    default: 0,
  },

  lastExecutedAt: Date,

  successCount: {
    type: Number,
    default: 0,
  },

  failureCount: {
    type: Number,
    default: 0,
  },

  // Limits
  maxExecutions: Number, // Stop after X executions
  validFrom: Date,
  validUntil: Date,

  // Metadata
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
automationRuleSchema.index({ tenant: 1, isActive: 1, ruleType: 1 });
automationRuleSchema.index({ tenant: 1, 'trigger.event': 1 });

// Method: Check if rule should execute
automationRuleSchema.methods.shouldExecute = function(eventData) {
  if (!this.isActive) return false;
  
  // Check validity period
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  
  // Check max executions
  if (this.maxExecutions && this.executionCount >= this.maxExecutions) return false;
  
  // Check conditions
  return this.trigger.conditions.every(condition => {
    const fieldValue = eventData[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      case 'not_contains':
        return !String(fieldValue).includes(condition.value);
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  });
};

// Method: Increment execution count
automationRuleSchema.methods.recordExecution = function(success = true) {
  this.executionCount += 1;
  this.lastExecutedAt = new Date();
  
  if (success) {
    this.successCount += 1;
  } else {
    this.failureCount += 1;
  }
  
  return this.save();
};
```

### Campaign Schema (NEW - To Implement)

```javascript
const campaignSchema = new mongoose.Schema({
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
    enum: ['follow_up', 'birthday', 'anniversary', 'promotional', 'seasonal', 're_engagement', 'referral'],
    index: true,
  },

  // Target audience
  targetAudience: {
    segment: {
      type: String,
      enum: ['all_customers', 'past_customers', 'leads', 'specific_users', 'custom_filter'],
      required: true,
    },

    filters: [{
      field: String,
      operator: String,
      value: Schema.Types.Mixed,
    }],

    specificUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

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
```

## API Endpoints

```javascript
// ========== Automation Rules ==========

// List automation rules
GET /automation/rules
Query params: ruleType, isActive, page, limit

// Get automation rule
GET /automation/rules/:id

// Create automation rule
POST /automation/rules/create
Body: AutomationRule schema

// Update automation rule
PATCH /automation/rules/:id

// Delete automation rule
DELETE /automation/rules/:id

// Activate/deactivate rule
POST /automation/rules/:id/toggle

// Test automation rule
POST /automation/rules/:id/test
Body: { testData }

// Get execution history
GET /automation/rules/:id/executions
Query params: dateFrom, dateTo, status, page, limit

// ========== SLA Escalation ==========

// Get escalation config
GET /automation/escalation-config

// Update escalation config
PATCH /automation/escalation-config
Body: {
  level1: { delayMinutes, escalateTo },
  level2: { delayMinutes, escalateTo },
  level3: { delayMinutes, escalateTo },
  level4: { delayMinutes, escalateTo }
}

// Get escalated items
GET /automation/escalations
Query params: level, status, page, limit

// ========== Campaigns ==========

// List campaigns
GET /automation/campaigns
Query params: campaignType, status, page, limit

// Get campaign
GET /automation/campaigns/:id

// Create campaign
POST /automation/campaigns/create
Body: Campaign schema

// Update campaign
PATCH /automation/campaigns/:id

// Delete campaign
DELETE /automation/campaigns/:id

// Start campaign
POST /automation/campaigns/:id/start

// Pause campaign
POST /automation/campaigns/:id/pause

// Resume campaign
POST /automation/campaigns/:id/resume

// Cancel campaign
POST /automation/campaigns/:id/cancel

// Get campaign stats
GET /automation/campaigns/:id/stats

// ========== Jobs Monitoring ==========

// Get job queue status
GET /automation/jobs/status

// Get job details
GET /automation/jobs/:jobId

// Retry failed job
POST /automation/jobs/:jobId/retry

// Get failed jobs (DLQ)
GET /automation/jobs/failed
Query params: jobType, page, limit

// Clear DLQ
DELETE /automation/jobs/failed/clear

// Get job statistics
GET /automation/jobs/stats
Returns: {
  queues: [{ name, waiting, active, completed, failed, delayed }],
  totalProcessed: number,
  avgProcessingTime: number
}
```

## Implementation Steps

### Step 1: Create Models (0.5 day)
- [ ] Create AutomationRule model
- [ ] Create Campaign model
- [ ] Add indexes
- [ ] Add instance methods

### Step 2: Automation Engine (1.5 days)
- [ ] Create `src/services/automationEngine.js`
- [ ] Implement trigger evaluation
- [ ] Implement condition matching
- [ ] Implement action execution
  - [ ] Send email action
  - [ ] Assign query action
  - [ ] Update status action
  - [ ] Escalate action
  - [ ] Webhook action
  - [ ] Notify user action
- [ ] Implement delay handling
- [ ] Add error handling and retries

### Step 3: SLA Escalation System (1 day)
- [ ] Create `src/jobs/slaEscalationJob.js`
- [ ] Implement 4-level escalation
  - [ ] Level 1: Assigned agent's manager (after 1 hour)
  - [ ] Level 2: Department manager (after 2 hours)
  - [ ] Level 3: Senior management (after 4 hours)
  - [ ] Level 4: CEO/CTO (after 8 hours)
- [ ] Find queries breaching SLA
- [ ] Send escalation notifications
- [ ] Update query escalation status
- [ ] Schedule job (Bull, runs every 30 minutes)

### Step 4: Follow-up Campaigns (1 day)
- [ ] Create `src/jobs/followUpCampaignJob.js`
- [ ] Quote follow-ups
  - [ ] Day 3: First reminder
  - [ ] Day 7: Second reminder
  - [ ] Day 14: Final reminder with urgency
- [ ] Booking reminders
  - [ ] 30 days before: Preparation checklist
  - [ ] 7 days before: Final reminder
  - [ ] 1 day before: Confirmation
- [ ] Schedule job (Bull, runs daily)

### Step 5: Birthday/Anniversary Automation (0.5 day)
- [ ] Create `src/jobs/birthdayEmailJob.js`
- [ ] Find customers with birthdays today
- [ ] Send personalized birthday emails
- [ ] Create `src/jobs/anniversaryEmailJob.js`
- [ ] Find booking anniversaries
- [ ] Send anniversary emails with offers
- [ ] Schedule jobs (Bull, runs daily at 9 AM tenant timezone)

### Step 6: Quote Expiry Job (0.5 day)
- [ ] Create `src/jobs/quoteExpiryJob.js`
- [ ] Find quotes expiring in 24 hours
- [ ] Send expiry warning emails
- [ ] Find expired quotes
- [ ] Mark as expired
- [ ] Send notification to agent
- [ ] Schedule job (Bull, runs daily)

### Step 7: Controllers (1 day)
- [ ] Create `src/controllers/automationController.js`
- [ ] Implement automation rules CRUD
- [ ] Implement rule toggle
- [ ] Implement rule testing
- [ ] Create `src/controllers/campaignController.js`
- [ ] Implement campaign CRUD
- [ ] Implement campaign start/pause/resume/cancel
- [ ] Create `src/controllers/jobMonitorController.js`
- [ ] Implement job monitoring endpoints
- [ ] Implement DLQ management

### Step 8: Validation & Routes (0.5 day)
- [ ] Create validation schemas
- [ ] Create routes
- [ ] Apply RBAC (admin only)
- [ ] Mount routes in app.js

### Step 9: Testing (1 day)
- [ ] Test automation rule execution
- [ ] Test trigger-condition matching
- [ ] Test all action types
- [ ] Test SLA escalation
- [ ] Test follow-up campaigns
- [ ] Test birthday emails
- [ ] Test quote expiry
- [ ] Test job monitoring
- [ ] Test DLQ handling

## Testing Strategy

### Unit Tests
- [ ] Test condition matching logic
- [ ] Test action execution
- [ ] Test escalation level calculation
- [ ] Test campaign audience filtering

### Integration Tests
- [ ] Test complete automation workflow
- [ ] Test SLA escalation end-to-end
- [ ] Test follow-up campaign delivery
- [ ] Test birthday email sending
- [ ] Test job retries
- [ ] Test DLQ processing

## Acceptance Criteria

- [ ] Automation rules execute on correct triggers
- [ ] Conditions evaluate correctly
- [ ] Actions execute successfully
- [ ] SLA escalation works (4 levels)
- [ ] Follow-up emails send on day 3, 7, 14
- [ ] Birthday emails send at configured time
- [ ] Quote expiry job marks expired quotes
- [ ] Failed jobs move to DLQ after max retries
- [ ] Job monitoring dashboard shows real-time stats
- [ ] All tests pass (>75% coverage)

## TODO Checklist

### Database
- [ ] Create AutomationRule model
- [ ] Create Campaign model

### Automation Engine
- [ ] Create automationEngine.js
- [ ] Trigger evaluation
- [ ] Condition matching
- [ ] Action execution

### Jobs
- [ ] SLA escalation job
- [ ] Follow-up campaign job
- [ ] Birthday email job
- [ ] Anniversary email job
- [ ] Quote expiry job

### Controllers
- [ ] Create automationController.js
- [ ] Create campaignController.js
- [ ] Create jobMonitorController.js

### Routes & Validation
- [ ] Create schemas
- [ ] Create routes
- [ ] Apply RBAC

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests

## Dependencies

**Environment Variables:**
```env
SLA_ESCALATION_LEVEL1_MINUTES=60
SLA_ESCALATION_LEVEL2_MINUTES=120
SLA_ESCALATION_LEVEL3_MINUTES=240
SLA_ESCALATION_LEVEL4_MINUTES=480
QUOTE_FOLLOWUP_DAYS=3,7,14
BIRTHDAY_EMAIL_HOUR=9
BIRTHDAY_EMAIL_TIMEZONE=Asia/Kolkata
QUOTE_EXPIRY_WARNING_HOURS=24
JOB_MAX_RETRIES=3
JOB_RETRY_DELAY=300000
```

## Notes

- Automation is critical for scaling operations
- SLA escalation should be transparent and configurable
- Follow-up campaigns improve conversion rates
- Birthday/anniversary emails build customer loyalty
- Monitor job failures and DLQ carefully
- Consider A/B testing for campaign emails
- Track campaign ROI
- Implement opt-out for marketing emails (GDPR compliance)
