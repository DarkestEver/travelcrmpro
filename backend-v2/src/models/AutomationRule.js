const mongoose = require('mongoose');
const { Schema } = mongoose;

const automationRuleSchema = new Schema({
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
      'custom',
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
        'manual',
      ],
    },

    // Conditions (all must match)
    conditions: [
      {
        field: {
          type: String,
          required: true,
        },
        operator: {
          type: String,
          enum: [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'greater_than',
            'less_than',
            'in',
            'not_in',
          ],
          required: true,
        },
        value: Schema.Types.Mixed,
      },
    ],

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
  actions: [
    {
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
          'webhook',
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
    },
  ],

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
automationRuleSchema.methods.shouldExecute = function (eventData) {
  if (!this.isActive) return false;

  // Check validity period
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;

  // Check max executions
  if (this.maxExecutions && this.executionCount >= this.maxExecutions) return false;

  // Check conditions
  return this.trigger.conditions.every((condition) => {
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
automationRuleSchema.methods.recordExecution = async function (success = true) {
  this.executionCount += 1;
  this.lastExecutedAt = new Date();

  if (success) {
    this.successCount += 1;
  } else {
    this.failureCount += 1;
  }

  return this.save();
};

const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);

module.exports = AutomationRule;
