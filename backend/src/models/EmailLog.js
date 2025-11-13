const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  // Basic Email Information
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  threadId: {
    type: String,
    index: true
  },
  
  // Tracking ID (embedded in email body for reliable tracking)
  trackingId: {
    type: String,
    index: true,
    sparse: true // Only index non-null values
  },
  
  // Email Account
  emailAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true,
    index: true
  },
  
  // From/To Information
  from: {
    email: { type: String, required: true, index: true },
    name: String
  },
  to: [{
    email: { type: String, required: true },
    name: String
  }],
  cc: [{
    email: String,
    name: String
  }],
  bcc: [{
    email: String,
    name: String
  }],
  
  // Email Content
  subject: {
    type: String,
    required: true,
    index: true
  },
  bodyHtml: String,
  bodyText: {
    type: String,
    required: true
  },
  snippet: String, // First 200 chars
  
  // Attachments
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    contentId: String,
    url: String, // S3/storage URL if saved
    processed: { type: Boolean, default: false }
  }],
  
  // Email Metadata
  receivedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    enum: ['imap', 'webhook', 'manual', 'api'],
    default: 'webhook',
    index: true
  }, // Track where email came from
  headers: mongoose.Schema.Types.Mixed,
  inReplyTo: String, // Message-ID of parent email
  references: [String], // Thread message IDs
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  
  // AI Processing Status
  processingStatus: {
    type: String,
    enum: [
      'pending', 
      'processing', 
      'completed', 
      'failed', 
      'skipped', 
      'converted_to_quote',
      'linked_to_existing_quote',
      'duplicate_detected'
    ],
    default: 'pending',
    index: true
  },
  processedAt: Date,
  processingError: String,
  aiExtractionFailed: { type: Boolean, default: false },
  
  // AI Results
  category: {
    type: String,
    enum: ['SUPPLIER', 'CUSTOMER', 'AGENT', 'FINANCE', 'OTHER', 'SPAM'],
    index: true
  },
  categoryConfidence: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Extracted Data (JSON)
  extractedData: mongoose.Schema.Types.Mixed,
  
  // Signature Image Processing (Vision API)
  signatureImageProcessed: { type: Boolean, default: false },
  signatureImageData: {
    processedImages: Number,
    extractedContacts: [mongoose.Schema.Types.Mixed],
    cost: Number,
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    processedAt: Date
  },
  
  // Matching Results
  matchingResults: [{
    packageId: mongoose.Schema.Types.ObjectId,
    itineraryTitle: String,
    destination: String,
    duration: Number,
    price: Number,
    currency: String,
    travelStyle: String,
    themes: [String],
    overview: String,
    score: Number,
    matchReasons: [String],
    gaps: [String],
    reasons: [String] // Legacy field, keep for backward compatibility
  }],
  
  // Itinerary Matching Results (New Workflow)
  itineraryMatching: {
    validation: {
      isValid: Boolean,
      completeness: Number,
      missingFields: [{
        field: String,
        label: String,
        question: String,
        priority: String
      }]
    },
    workflowAction: {
      type: String,
      enum: ['ASK_CUSTOMER', 'SEND_ITINERARIES', 'SEND_ITINERARIES_WITH_NOTE', 'FORWARD_TO_SUPPLIER']
    },
    reason: String,
    matchCount: Number,
    topMatches: [{
      itineraryId: mongoose.Schema.Types.ObjectId,
      title: String,
      score: Number,
      gaps: [String]
    }],
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Response Tracking
  responseGenerated: { type: Boolean, default: false },
  generatedResponse: {
    subject: String,
    body: String,
    plainText: String,
    templateType: String,
    cost: Number,
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  responseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog'
  },
  responseMessageId: String, // SMTP Message-ID of sent response
  responseSentAt: Date,
  responseType: {
    type: String,
    enum: ['auto', 'manual', 'none'],
    default: 'none'
  },
  manuallyReplied: {
    type: Boolean,
    default: false,
    index: true
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Manual Review
  requiresReview: { type: Boolean, default: false, index: true },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  reviewDecision: {
    type: String,
    enum: ['approved', 'rejected', 'modified']
  },
  
  // Flags
  isRead: { type: Boolean, default: false, index: true },
  isStarred: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isSpam: { type: Boolean, default: false },
  
  // Email-specific Watchers - Receive this specific email thread
  watchers: [{
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    name: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String, // Why they're watching this specific email
    notifyOnReply: {
      type: Boolean,
      default: true
    }
  }],
  
  // Customer/Booking Context
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    index: true
  },
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    index: true
  },
  linkedQuote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    index: true
  },
  
  // Quote History - Track all quotes generated/sent for this email
  quotesGenerated: [{
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote'
    },
    quoteNumber: String,
    status: String,
    totalPrice: Number,
    currency: String,
    includedItineraries: [{
      itineraryId: mongoose.Schema.Types.ObjectId,
      title: String
    }],
    includePdfAttachment: { type: Boolean, default: false },
    pdfUrl: String,
    sentAt: Date,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: Date,
    respondedAt: Date,
    response: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Analytics
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'urgent'],
    index: true
  },
  language: {
    type: String,
    default: 'en'
  },
  tags: [String],
  
  // OpenAI Processing
  openaiCost: {
    type: Number,
    default: 0
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  
  // Email Threading & Conversation
  threadMetadata: {
    isReply: { type: Boolean, default: false },
    isForward: { type: Boolean, default: false },
    parentEmailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailLog',
      index: true
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailLog',
      index: true
    },
    messageId: String,
    inReplyTo: String,
    references: [String]
  },
  
  // Conversation tracking
  replies: [{
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailLog'
    },
    from: {
      email: String,
      name: String
    },
    subject: String,
    receivedAt: Date,
    snippet: String
  }],
  
  conversationParticipants: [String] // Array of email addresses in this thread
}, {
  timestamps: true
});

// Indexes for performance
emailLogSchema.index({ tenantId: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, category: 1, processingStatus: 1 });
emailLogSchema.index({ tenantId: 1, requiresReview: 1, reviewedAt: 1 });
emailLogSchema.index({ 'from.email': 1, tenantId: 1 });

// New indexes for faster email dashboard queries
emailLogSchema.index({ tenantId: 1, processingStatus: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, source: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, category: 1, receivedAt: -1 });

// Virtual for full text
emailLogSchema.virtual('fullText').get(function() {
  return `${this.subject} ${this.bodyText}`;
});

// Methods
emailLogSchema.methods.markAsProcessed = function(category, confidence, extractedData) {
  this.processingStatus = 'completed';
  this.processedAt = new Date();
  this.category = category;
  this.categoryConfidence = confidence;
  this.extractedData = extractedData;
  return this.save();
};

emailLogSchema.methods.markForReview = function(reason) {
  this.requiresReview = true;
  this.reviewNotes = reason;
  return this.save();
};

// Statics
emailLogSchema.statics.getPendingEmails = function(tenantId, limit = 50) {
  return this.find({
    tenantId,
    processingStatus: 'pending'
  })
  .sort({ receivedAt: 1 })
  .limit(limit);
};

emailLogSchema.statics.getReviewQueue = function(tenantId) {
  return this.find({
    tenantId,
    requiresReview: true,
    reviewedAt: { $exists: false }
  })
  .sort({ receivedAt: -1 })
  .populate('emailAccountId', 'accountName email')
  .populate('reviewedBy', 'name email');
};

module.exports = mongoose.model('EmailLog', emailLogSchema);
