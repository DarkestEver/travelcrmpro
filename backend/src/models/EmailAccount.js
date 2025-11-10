const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'change-this-to-32-char-string!'; // Must be 32 chars
const ALGORITHM = 'aes-256-cbc';

// Encryption/Decryption Functions
function encryptPassword(password) {
  if (!password) return password;
  
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return password; // Fallback to plain text (not recommended for production)
  }
}

function decryptPassword(encryptedPassword) {
  if (!encryptedPassword || !encryptedPassword.includes(':')) {
    return encryptedPassword;
  }
  
  try {
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedPassword; // Return as-is if decryption fails
  }
}

const emailAccountSchema = new mongoose.Schema({
  // Tenant & User
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Account Identification
  accountName: {
    type: String,
    required: true,
    trim: true
  }, // e.g., "Support Gmail", "Sales Outlook"
  
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Provider Type
  provider: {
    type: String,
    enum: ['gmail', 'outlook', 'zoho', 'smtp', 'other'],
    required: true
  },
  
  // IMAP Configuration (Receiving)
  imap: {
    enabled: {
      type: Boolean,
      default: true
    },
    host: {
      type: String,
      required: function() { return this.imap.enabled; }
    }, // e.g., imap.gmail.com
    port: {
      type: Number,
      default: 993
    },
    secure: {
      type: Boolean,
      default: true
    }, // Use TLS
    username: {
      type: String,
      required: function() { return this.imap.enabled; }
    },
    password: {
      type: String,
      required: function() { return this.imap.enabled; },
      get: decryptPassword,
      set: encryptPassword
    }, // Encrypted
    
    // Connection Status
    lastTestedAt: Date,
    lastTestStatus: {
      type: String,
      enum: ['success', 'failed', 'pending', 'not_tested'],
      default: 'not_tested'
    },
    lastTestError: String
  },
  
  // SMTP Configuration (Sending)
  smtp: {
    enabled: {
      type: Boolean,
      default: true
    },
    host: {
      type: String,
      required: function() { return this.smtp.enabled; }
    }, // e.g., smtp.gmail.com
    port: {
      type: Number,
      default: 587
    },
    secure: {
      type: Boolean,
      default: false
    }, // Use STARTTLS
    username: {
      type: String,
      required: function() { return this.smtp.enabled; }
    },
    password: {
      type: String,
      required: function() { return this.smtp.enabled; },
      get: decryptPassword,
      set: encryptPassword
    }, // Encrypted
    
    // Sender Details
    fromName: String, // Display name for sent emails
    replyTo: String,
    
    // Connection Status
    lastTestedAt: Date,
    lastTestStatus: {
      type: String,
      enum: ['success', 'failed', 'pending', 'not_tested'],
      default: 'not_tested'
    },
    lastTestError: String
  },
  
  // OAuth (for Gmail/Outlook API - Future)
  oauth: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: String, // 'google', 'microsoft'
    clientId: String,
    clientSecret: {
      type: String,
      get: decryptPassword,
      set: encryptPassword
    },
    refreshToken: {
      type: String,
      get: decryptPassword,
      set: encryptPassword
    },
    accessToken: {
      type: String,
      get: decryptPassword,
      set: encryptPassword
    },
    tokenExpiry: Date
  },
  
  // Usage Settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPrimary: {
    type: Boolean,
    default: false
  }, // Primary email for sending
  
  // Purpose
  purpose: {
    type: String,
    enum: ['support', 'sales', 'finance', 'general', 'custom'],
    default: 'general'
  },
  
  // Auto-Processing (for AI - Phase 2)
  autoProcess: {
    enabled: {
      type: Boolean,
      default: false
    },
    categories: [String], // Which categories to auto-process
    lastSyncAt: Date,
    syncFrequency: {
      type: Number,
      default: 5
    } // minutes
  },
  
  // IMAP Polling Configuration
  autoFetch: {
    type: Boolean,
    default: true
  }, // Enable automatic email fetching via IMAP
  
  fetchInterval: {
    type: Number,
    default: 120000
  }, // Fetch interval in milliseconds (default: 2 minutes)
  
  lastFetchAt: Date, // Last time emails were fetched
  
  lastFetchStatus: {
    type: String,
    enum: ['success', 'error', 'pending', 'never'],
    default: 'never'
  },
  
  lastFetchError: String, // Last error message if fetch failed
  
  // Stats
  stats: {
    emailsReceived: {
      type: Number,
      default: 0
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    lastReceivedAt: Date,
    lastSentAt: Date
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes
emailAccountSchema.index({ tenantId: 1, email: 1 });
emailAccountSchema.index({ tenantId: 1, isPrimary: 1 });
emailAccountSchema.index({ tenantId: 1, isActive: 1 });

// Update timestamp on save
emailAccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
