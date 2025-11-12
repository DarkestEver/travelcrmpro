const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shareTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Booking', 'Quote', 'Itinerary'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true
  },
  password: {
    type: String,
    select: false // Don't include in queries by default
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    allowedActions: {
      type: [String],
      default: ['view'] // view, accept, reject, comment, download
    },
    requireEmail: {
      type: Boolean,
      default: false
    },
    customMessage: String
  }
}, {
  timestamps: true
});

// Index for efficient lookups
shareTokenSchema.index({ token: 1, isActive: 1 });
shareTokenSchema.index({ entityType: 1, entityId: 1 });
shareTokenSchema.index({ tenantId: 1, createdAt: -1 });

// Method to check if token is valid
shareTokenSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt < new Date()) return false;
  return true;
};

// Method to increment view count
shareTokenSchema.methods.recordView = async function() {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  await this.save();
};

// Static method to find valid token
shareTokenSchema.statics.findValidToken = async function(token) {
  const shareToken = await this.findOne({
    token,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
  
  return shareToken;
};

// Virtual for share URL
shareTokenSchema.virtual('shareUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  return `${baseUrl}/share/${this.entityType}/${this.token}`;
});

// Ensure virtuals are included in JSON
shareTokenSchema.set('toJSON', { virtuals: true });
shareTokenSchema.set('toObject', { virtuals: true });

const ShareToken = mongoose.model('ShareToken', shareTokenSchema);

module.exports = ShareToken;
