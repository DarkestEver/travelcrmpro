const mongoose = require('mongoose');

const aiProcessingLogSchema = new mongoose.Schema({
  // Reference to email
  emailLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog',
    required: true,
    index: true
  },
  
  // Processing Type
  processingType: {
    type: String,
    enum: ['categorization', 'extraction', 'matching', 'response_generation', 'sentiment_analysis', 'translation', 'categorization_and_extraction'],
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'retrying'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // OpenAI Details
  model: {
    type: String,
    default: 'gpt-4-turbo-preview'
  },
  prompt: String,
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  
  // Request/Response
  request: mongoose.Schema.Types.Mixed,
  response: mongoose.Schema.Types.Mixed,
  
  // Results
  result: mongoose.Schema.Types.Mixed,
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Error Handling
  error: String,
  errorCode: String,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Timing
  startedAt: Date,
  completedAt: Date,
  processingDuration: Number, // milliseconds
  
  // Cost Tracking
  estimatedCost: {
    type: Number,
    default: 0
  },
  
  // Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Validation
  validated: Boolean,
  validationScore: Number,
  validationNotes: String
}, {
  timestamps: true
});

// Indexes
aiProcessingLogSchema.index({ tenantId: 1, processingType: 1, status: 1 });
aiProcessingLogSchema.index({ emailLogId: 1, processingType: 1 });
aiProcessingLogSchema.index({ createdAt: -1 });

// Pre-save hook to calculate duration
aiProcessingLogSchema.pre('save', function(next) {
  if (this.startedAt && this.completedAt) {
    this.processingDuration = this.completedAt - this.startedAt;
  }
  next();
});

// Methods
aiProcessingLogSchema.methods.markAsCompleted = function(result, confidence) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.result = result;
  this.confidence = confidence;
  return this.save();
};

aiProcessingLogSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.error = error.message || error;
  this.errorCode = error.code;
  return this.save();
};

aiProcessingLogSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  if (this.retryCount < this.maxRetries) {
    this.status = 'retrying';
  } else {
    this.status = 'failed';
  }
  return this.save();
};

// Statics
aiProcessingLogSchema.statics.getCostSummary = async function(tenantId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        tenantId: mongoose.Types.ObjectId(tenantId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$processingType',
        totalCost: { $sum: '$estimatedCost' },
        totalTokens: { $sum: '$totalTokens' },
        count: { $sum: 1 },
        avgDuration: { $avg: '$processingDuration' }
      }
    }
  ]);
};

aiProcessingLogSchema.statics.getAccuracyMetrics = async function(tenantId, processingType) {
  return this.aggregate([
    {
      $match: {
        tenantId: mongoose.Types.ObjectId(tenantId),
        processingType,
        validated: true
      }
    },
    {
      $group: {
        _id: null,
        avgConfidence: { $avg: '$confidence' },
        avgValidationScore: { $avg: '$validationScore' },
        totalValidated: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('AIProcessingLog', aiProcessingLogSchema);
