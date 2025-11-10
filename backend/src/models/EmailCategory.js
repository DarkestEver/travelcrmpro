const mongoose = require('mongoose');

const emailCategorySchema = new mongoose.Schema({
  // Category Definition
  name: {
    type: String,
    required: true,
    enum: ['SUPPLIER', 'CUSTOMER', 'AGENT', 'FINANCE', 'OTHER', 'SPAM']
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  
  // Visual Styling
  color: {
    type: String,
    default: '#gray'
  },
  icon: {
    type: String,
    default: 'mail'
  },
  
  // AI Prompts
  categorizationPrompt: {
    type: String,
    required: true
  },
  extractionPrompt: String,
  
  // Keywords for pattern matching
  keywords: [String],
  excludeKeywords: [String],
  
  // Email patterns
  fromPatterns: [String], // regex patterns for email addresses
  subjectPatterns: [String],
  
  // Processing Rules
  autoProcess: {
    type: Boolean,
    default: true
  },
  requiresReview: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Response Settings
  autoRespond: {
    type: Boolean,
    default: false
  },
  defaultResponseTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResponseTemplate'
  },
  responseDelayMinutes: {
    type: Number,
    default: 0
  },
  
  // Workflow
  assignTo: {
    role: {
      type: String,
      enum: ['agency_admin', 'operator', 'agent', 'finance', 'auto']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Notifications
  notifyUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifyRoles: [{
    type: String,
    enum: ['agency_admin', 'operator', 'agent', 'finance']
  }],
  
  // Analytics
  totalEmails: {
    type: Number,
    default: 0
  },
  totalProcessed: {
    type: Number,
    default: 0
  },
  averageConfidence: {
    type: Number,
    default: 0
  },
  accuracyRate: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // System vs Custom
  isSystem: {
    type: Boolean,
    default: false
  },
  
  // Custom Actions
  customActions: [{
    name: String,
    triggerCondition: String, // JSON condition
    action: {
      type: {
        type: String,
        enum: ['webhook', 'email', 'notification', 'script']
      },
      config: mongoose.Schema.Types.Mixed
    }
  }]
}, {
  timestamps: true
});

// Indexes
emailCategorySchema.index({ tenantId: 1, name: 1 }, { unique: true });
emailCategorySchema.index({ tenantId: 1, isActive: 1 });

// Methods
emailCategorySchema.methods.incrementStats = function(confidence, accurate = true) {
  this.totalEmails += 1;
  this.totalProcessed += 1;
  
  // Update average confidence
  const totalConf = this.averageConfidence * (this.totalProcessed - 1);
  this.averageConfidence = (totalConf + confidence) / this.totalProcessed;
  
  // Update accuracy rate
  if (accurate) {
    const totalAcc = this.accuracyRate * (this.totalProcessed - 1);
    this.accuracyRate = (totalAcc + 100) / this.totalProcessed;
  } else {
    const totalAcc = this.accuracyRate * (this.totalProcessed - 1);
    this.accuracyRate = totalAcc / this.totalProcessed;
  }
  
  return this.save();
};

emailCategorySchema.methods.matchesPattern = function(email) {
  // Check from patterns
  if (this.fromPatterns && this.fromPatterns.length > 0) {
    const fromMatch = this.fromPatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(email.from.email);
    });
    if (fromMatch) return true;
  }
  
  // Check subject patterns
  if (this.subjectPatterns && this.subjectPatterns.length > 0) {
    const subjectMatch = this.subjectPatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(email.subject);
    });
    if (subjectMatch) return true;
  }
  
  // Check keywords
  if (this.keywords && this.keywords.length > 0) {
    const fullText = `${email.subject} ${email.bodyText}`.toLowerCase();
    const keywordMatch = this.keywords.some(keyword => 
      fullText.includes(keyword.toLowerCase())
    );
    if (keywordMatch) {
      // Check exclude keywords
      if (this.excludeKeywords && this.excludeKeywords.length > 0) {
        const excludeMatch = this.excludeKeywords.some(keyword =>
          fullText.includes(keyword.toLowerCase())
        );
        if (excludeMatch) return false;
      }
      return true;
    }
  }
  
  return false;
};

// Statics
emailCategorySchema.statics.findActiveCategories = function(tenantId) {
  return this.find({
    tenantId,
    isActive: true
  }).sort({ priority: -1 });
};

emailCategorySchema.statics.getStatsSummary = async function(tenantId) {
  return this.aggregate([
    { $match: { tenantId: mongoose.Types.ObjectId(tenantId) } },
    {
      $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        activeCategories: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        totalEmails: { $sum: '$totalEmails' },
        avgConfidence: { $avg: '$averageConfidence' },
        avgAccuracy: { $avg: '$accuracyRate' }
      }
    }
  ]);
};

module.exports = mongoose.model('EmailCategory', emailCategorySchema);
