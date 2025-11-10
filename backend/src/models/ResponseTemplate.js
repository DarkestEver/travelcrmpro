const mongoose = require('mongoose');

const responseTemplateSchema = new mongoose.Schema({
  // Template Identification
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  
  // Template Category
  category: {
    type: String,
    enum: ['CUSTOMER_INQUIRY', 'PACKAGE_FOUND', 'PACKAGE_NOT_FOUND', 'SUPPLIER_QUERY', 'BOOKING_CONFIRMATION', 'PAYMENT_REMINDER', 'FOLLOW_UP', 'THANK_YOU', 'COMPLAINT_RESPONSE', 'CUSTOM'],
    required: true,
    index: true
  },
  
  // Template Content
  subject: {
    type: String,
    required: true
  },
  bodyHtml: {
    type: String,
    required: true
  },
  bodyText: String,
  
  // Variables (placeholders)
  variables: [{
    name: { type: String, required: true }, // e.g., "customerName", "packageName"
    description: String,
    required: { type: Boolean, default: false },
    defaultValue: String,
    type: {
      type: String,
      enum: ['string', 'number', 'date', 'boolean', 'array', 'object'],
      default: 'string'
    }
  }],
  
  // AI Generation Settings
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiPrompt: String,
  allowAICustomization: {
    type: Boolean,
    default: true
  },
  
  // Language
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'zh', 'ja']
  },
  
  // Tone & Style
  tone: {
    type: String,
    enum: ['formal', 'casual', 'friendly', 'professional', 'apologetic', 'enthusiastic'],
    default: 'professional'
  },
  
  // Attachments
  defaultAttachments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'active',
    index: true
  },
  
  // Usage Tracking
  timesUsed: {
    type: Number,
    default: 0
  },
  lastUsedAt: Date,
  
  // Performance Metrics
  averageResponseTime: Number, // milliseconds
  successRate: Number, // percentage
  customerSatisfactionScore: Number, // 1-5
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  parentTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResponseTemplate'
  },
  
  // Access Control
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // A/B Testing
  abTestGroup: String,
  abTestMetrics: {
    openRate: Number,
    clickRate: Number,
    responseRate: Number,
    conversionRate: Number
  }
}, {
  timestamps: true
});

// Indexes
responseTemplateSchema.index({ tenantId: 1, category: 1, status: 1 });
responseTemplateSchema.index({ code: 1, tenantId: 1 }, { unique: true });
responseTemplateSchema.index({ timesUsed: -1 });

// Methods
responseTemplateSchema.methods.render = function(data) {
  let subject = this.subject;
  let bodyHtml = this.bodyHtml;
  let bodyText = this.bodyText || this.bodyHtml.replace(/<[^>]*>/g, '');
  
  // Replace variables
  this.variables.forEach(variable => {
    const value = data[variable.name] || variable.defaultValue || '';
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    
    subject = subject.replace(regex, value);
    bodyHtml = bodyHtml.replace(regex, value);
    bodyText = bodyText.replace(regex, value);
  });
  
  return {
    subject,
    bodyHtml,
    bodyText
  };
};

responseTemplateSchema.methods.incrementUsage = function() {
  this.timesUsed += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

responseTemplateSchema.methods.updateMetrics = function(metrics) {
  if (metrics.responseTime) {
    this.averageResponseTime = this.averageResponseTime
      ? (this.averageResponseTime + metrics.responseTime) / 2
      : metrics.responseTime;
  }
  
  if (metrics.success !== undefined) {
    const total = this.timesUsed;
    const currentSuccess = (this.successRate || 0) * (total - 1) / 100;
    this.successRate = ((currentSuccess + (metrics.success ? 1 : 0)) / total) * 100;
  }
  
  if (metrics.satisfaction) {
    const total = this.timesUsed;
    const currentScore = (this.customerSatisfactionScore || 0) * (total - 1);
    this.customerSatisfactionScore = (currentScore + metrics.satisfaction) / total;
  }
  
  return this.save();
};

// Statics
responseTemplateSchema.statics.findByCategory = function(tenantId, category) {
  return this.find({
    tenantId,
    category,
    status: 'active'
  }).sort({ timesUsed: -1 });
};

responseTemplateSchema.statics.findBestPerforming = function(tenantId, category, limit = 5) {
  return this.find({
    tenantId,
    category,
    status: 'active'
  })
  .sort({ customerSatisfactionScore: -1, successRate: -1, timesUsed: -1 })
  .limit(limit);
};

responseTemplateSchema.statics.createVersion = async function(templateId, updates, userId) {
  const original = await this.findById(templateId);
  if (!original) throw new Error('Template not found');
  
  const newVersion = new this({
    ...original.toObject(),
    _id: undefined,
    version: original.version + 1,
    parentTemplate: original._id,
    updatedBy: userId,
    timesUsed: 0,
    ...updates
  });
  
  return newVersion.save();
};

module.exports = mongoose.model('ResponseTemplate', responseTemplateSchema);
