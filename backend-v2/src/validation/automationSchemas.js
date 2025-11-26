const Joi = require('joi');

// ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Trigger condition schema
 */
const conditionSchema = Joi.object({
  field: Joi.string().required(),
  operator: Joi.string()
    .valid('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in')
    .required(),
  value: Joi.any().required(),
});

/**
 * Trigger schedule schema
 */
const scheduleSchema = Joi.object({
  type: Joi.string().valid('once', 'daily', 'weekly', 'monthly', 'cron'),
  time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
  dayOfWeek: Joi.number().min(0).max(6),
  dayOfMonth: Joi.number().min(1).max(31),
  cronExpression: Joi.string(),
  timezone: Joi.string().default('UTC'),
});

/**
 * Trigger delay schema
 */
const delaySchema = Joi.object({
  value: Joi.number().min(0).required(),
  unit: Joi.string().valid('minutes', 'hours', 'days').required(),
});

/**
 * Action config schema
 */
const actionConfigSchema = Joi.object({
  // For send_email
  emailTemplate: Joi.string().pattern(objectIdPattern),
  toField: Joi.string(),
  ccEmails: Joi.array().items(Joi.string().email()),
  bccEmails: Joi.array().items(Joi.string().email()),

  // For assign_query
  assignTo: Joi.string().pattern(objectIdPattern),
  assignmentMethod: Joi.string().valid('specific_user', 'round_robin', 'workload'),

  // For update_status
  newStatus: Joi.string(),

  // For escalate
  escalationLevel: Joi.number().min(1).max(4),
  escalateTo: Joi.string().pattern(objectIdPattern),

  // For update_field
  fieldName: Joi.string(),
  fieldValue: Joi.any(),

  // For webhook
  webhookUrl: Joi.string().uri(),
  webhookMethod: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH'),
  webhookHeaders: Joi.object(),
  webhookBody: Joi.object(),

  // For notifications
  notificationMessage: Joi.string(),
  notificationChannel: Joi.string().valid('in_app', 'email', 'sms'),
});

/**
 * Action schema
 */
const actionSchema = Joi.object({
  actionType: Joi.string()
    .valid(
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
    )
    .required(),
  config: actionConfigSchema.required(),
});

/**
 * Create automation rule
 * POST /automation/rules
 */
exports.createAutomationRuleSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().max(1000).allow(''),
  ruleType: Joi.string()
    .valid(
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
    )
    .required(),

  trigger: Joi.object({
    event: Joi.string()
      .valid(
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
        'scheduled',
        'manual'
      )
      .required(),
    conditions: Joi.array().items(conditionSchema).default([]),
    schedule: scheduleSchema,
    delay: delaySchema,
  }).required(),

  actions: Joi.array().items(actionSchema).min(1).required(),

  isActive: Joi.boolean().default(true),
  maxExecutions: Joi.number().min(1),
  validFrom: Joi.date(),
  validUntil: Joi.date().greater(Joi.ref('validFrom')),
});

/**
 * Update automation rule
 * PATCH /automation/rules/:id
 */
exports.updateAutomationRuleSchema = Joi.object({
  name: Joi.string().trim().max(200),
  description: Joi.string().max(1000).allow(''),
  ruleType: Joi.string().valid(
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
  ),

  trigger: Joi.object({
    event: Joi.string().valid(
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
      'scheduled',
      'manual'
    ),
    conditions: Joi.array().items(conditionSchema),
    schedule: scheduleSchema,
    delay: delaySchema,
  }),

  actions: Joi.array().items(actionSchema).min(1),

  isActive: Joi.boolean(),
  maxExecutions: Joi.number().min(1),
  validFrom: Joi.date(),
  validUntil: Joi.date(),
});

/**
 * Test automation rule
 * POST /automation/rules/:id/test
 */
exports.testAutomationRuleSchema = Joi.object({
  testData: Joi.object().required(),
});

/**
 * Get automation rules
 * GET /automation/rules
 */
exports.getAutomationRulesSchema = Joi.object({
  ruleType: Joi.string().valid(
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
  ),
  isActive: Joi.string().valid('true', 'false'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * Create campaign
 * POST /automation/campaigns
 */
exports.createCampaignSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  campaignType: Joi.string()
    .valid('follow_up', 'birthday', 'anniversary', 'promotional', 'seasonal', 're_engagement', 'referral')
    .required(),

  targetAudience: Joi.object({
    segment: Joi.string()
      .valid('all_customers', 'past_customers', 'leads', 'specific_users', 'custom_filter')
      .required(),
    filters: Joi.array().items(conditionSchema).default([]),
    specificUsers: Joi.array().items(Joi.string().pattern(objectIdPattern)),
    estimatedCount: Joi.number().min(0),
  }).required(),

  content: Joi.object({
    emailTemplate: Joi.string().pattern(objectIdPattern),
    smsTemplate: Joi.string().max(1000),
    whatsappTemplate: Joi.string().max(2000),
    subject: Joi.string().max(200),
    preheader: Joi.string().max(150),
  }).required(),

  schedule: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')),
    frequency: Joi.string().valid('one_time', 'recurring').default('one_time'),
    recurrence: Joi.string().valid('daily', 'weekly', 'monthly'),
    sendTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    timezone: Joi.string(),
  }).required(),
});

/**
 * Update campaign
 * PATCH /automation/campaigns/:id
 */
exports.updateCampaignSchema = Joi.object({
  name: Joi.string().trim().max(200),
  campaignType: Joi.string().valid(
    'follow_up',
    'birthday',
    'anniversary',
    'promotional',
    'seasonal',
    're_engagement',
    'referral'
  ),

  targetAudience: Joi.object({
    segment: Joi.string().valid('all_customers', 'past_customers', 'leads', 'specific_users', 'custom_filter'),
    filters: Joi.array().items(conditionSchema),
    specificUsers: Joi.array().items(Joi.string().pattern(objectIdPattern)),
    estimatedCount: Joi.number().min(0),
  }),

  content: Joi.object({
    emailTemplate: Joi.string().pattern(objectIdPattern),
    smsTemplate: Joi.string().max(1000),
    whatsappTemplate: Joi.string().max(2000),
    subject: Joi.string().max(200),
    preheader: Joi.string().max(150),
  }),

  schedule: Joi.object({
    startDate: Joi.date(),
    endDate: Joi.date(),
    frequency: Joi.string().valid('one_time', 'recurring'),
    recurrence: Joi.string().valid('daily', 'weekly', 'monthly'),
    sendTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    timezone: Joi.string(),
  }),
});

/**
 * Get campaigns
 * GET /automation/campaigns
 */
exports.getCampaignsSchema = Joi.object({
  campaignType: Joi.string().valid(
    'follow_up',
    'birthday',
    'anniversary',
    'promotional',
    'seasonal',
    're_engagement',
    'referral'
  ),
  status: Joi.string().valid('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
