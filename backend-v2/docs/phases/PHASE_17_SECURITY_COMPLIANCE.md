# Phase 17: Security & Compliance

**Status:** ❌ Not Started  
**Priority:** P0 (Critical - MUST before Production)  
**Estimated Time:** 5-6 days  
**Dependencies:** All previous phases

## Overview

GDPR/CCPA compliance, Data Subject Requests (DSR), virus scanning, CAPTCHA, rate limiting, security headers, audit logging, and penetration testing hardening.

## Current Implementation Status

### ✅ Implemented (Partial)
- [x] JWT authentication
- [x] Role-based access control (RBAC)
- [x] Password hashing (bcrypt)
- [x] Helmet.js (basic security headers)
- [x] CORS configuration

### ❌ Missing (90%)
- [ ] **GDPR/CCPA** compliance
- [ ] **Data Subject Requests** (DSR) - export, deletion
- [ ] **Virus scanning** (uploaded files)
- [ ] **CAPTCHA** (anti-bot protection)
- [ ] **Advanced rate limiting** (per user, per tenant)
- [ ] **Security headers** (CSP, HSTS, etc.)
- [ ] **Audit logging** (who did what, when)
- [ ] **Data encryption** (at rest)
- [ ] **SQL injection** prevention (MongoDB safe, but validate)
- [ ] **XSS protection** (input sanitization)
- [ ] **CSRF tokens** (for state-changing operations)
- [ ] **Secrets management** (Vault integration)
- [ ] **Penetration testing** fixes

## Implementation Breakdown

## 1. GDPR/CCPA Compliance

### Data Retention Policy Model

```javascript
// src/models/DataRetentionPolicy.js
const dataRetentionPolicySchema = new mongoose.Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Data category
  dataCategory: {
    type: String,
    required: true,
    enum: [
      'personal_data',       // Name, email, phone
      'financial_data',      // Payment info
      'booking_data',        // Itineraries, bookings
      'communication_data',  // Emails, messages
      'document_data',       // Passports, visas
      'analytics_data',      // Usage stats
      'audit_logs'           // System logs
    ],
  },

  // Retention period
  retentionDays: {
    type: Number,
    required: true,
  },

  // Auto-delete after retention period?
  autoDelete: {
    type: Boolean,
    default: false,
  },

  // Legal basis for processing
  legalBasis: {
    type: String,
    enum: [
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests'
    ],
  },

  description: String,

  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});
```

### Consent Management

```javascript
// Add to User model
const userSchema = new mongoose.Schema({
  // ... existing fields ...

  // GDPR consents
  consents: {
    marketing: {
      granted: Boolean,
      grantedAt: Date,
      revokedAt: Date,
      ipAddress: String,
    },
    analytics: {
      granted: Boolean,
      grantedAt: Date,
      revokedAt: Date,
      ipAddress: String,
    },
    dataProcessing: {
      granted: Boolean,
      grantedAt: Date,
      revokedAt: Date,
      ipAddress: String,
    },
  },

  // Right to be forgotten
  deletionRequested: {
    type: Boolean,
    default: false,
  },

  deletionRequestedAt: Date,

  deletionScheduledAt: Date, // Auto-delete after 30 days

  // Data export requests
  dataExportRequests: [{
    requestedAt: Date,
    completedAt: Date,
    downloadUrl: String,
    expiresAt: Date,
  }],
});
```

## 2. Data Subject Requests (DSR)

### DSR Controller

```javascript
// src/controllers/dsrController.js
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Document = require('../models/Document');
const Query = require('../models/Query');
const emailService = require('../services/emailService');
const s3Service = require('../services/s3Service');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

class DSRController {
  // Request data export (GDPR Article 20 - Right to Data Portability)
  async requestDataExport(req, res) {
    try {
      const userId = req.user._id;

      // Create export request
      const user = await User.findById(userId);
      user.dataExportRequests.push({
        requestedAt: new Date(),
      });
      await user.save();

      // Queue export job (process in background)
      const { queueDataExport } = require('../jobs/dsrJobs');
      await queueDataExport(userId);

      res.status(202).json({
        success: true,
        message: 'Data export request received. You will receive an email when ready.',
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Process data export (called by background job)
  async processDataExport(userId) {
    try {
      // Gather all user data
      const user = await User.findById(userId).select('-password');
      const bookings = await Booking.find({ customer: userId });
      const payments = await Payment.find({ customer: userId });
      const documents = await Document.find({ customer: userId });
      const queries = await Query.find({ customer: userId });

      // Create JSON export
      const exportData = {
        personal_data: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          consents: user.consents,
        },
        bookings: bookings.map(b => ({
          bookingNumber: b.bookingNumber,
          destination: b.destination,
          travelDates: b.travelDates,
          status: b.status,
          totalAmount: b.totalAmount,
        })),
        payments: payments.map(p => ({
          transactionId: p.transactionId,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          paidAt: p.paidAt,
        })),
        documents: documents.map(d => ({
          documentType: d.documentType,
          documentNumber: d.documentNumber,
          uploadedAt: d.uploadedAt,
        })),
        queries: queries.map(q => ({
          subject: q.subject,
          message: q.message,
          status: q.status,
          createdAt: q.createdAt,
        })),
        export_metadata: {
          exportedAt: new Date(),
          exportFormat: 'JSON',
          dataController: 'Travel CRM Inc.',
        },
      };

      // Save to file
      const exportDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filename = `user_data_export_${userId}_${Date.now()}.json`;
      const filepath = path.join(exportDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

      // Upload to S3 with expiry (7 days)
      const downloadUrl = await s3Service.uploadFile(
        filepath,
        `exports/${filename}`,
        { expiresIn: 7 * 24 * 60 * 60 }
      );

      // Update user record
      const lastRequest = user.dataExportRequests[user.dataExportRequests.length - 1];
      lastRequest.completedAt = new Date();
      lastRequest.downloadUrl = downloadUrl;
      lastRequest.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      // Send email with download link
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your Data Export is Ready',
        html: `
          <h2>Your data export is ready</h2>
          <p>Dear ${user.name},</p>
          <p>Your personal data export is now available for download.</p>
          <p><a href="${downloadUrl}">Download Your Data</a></p>
          <p><strong>Important:</strong> This link will expire in 7 days.</p>
          <hr>
          <small>Travel CRM - Data Protection Team</small>
        `,
      });

      // Clean up local file
      fs.unlinkSync(filepath);

      return { success: true };
    } catch (err) {
      console.error('Data export failed:', err);
      throw err;
    }
  }

  // Request account deletion (GDPR Article 17 - Right to Erasure)
  async requestAccountDeletion(req, res) {
    try {
      const userId = req.user._id;

      // Check for active bookings
      const activeBookings = await Booking.countDocuments({
        customer: userId,
        status: { $in: ['pending', 'confirmed'] },
      });

      if (activeBookings > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete account with active bookings. Please cancel or complete them first.',
        });
      }

      // Schedule deletion (30-day grace period)
      const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const user = await User.findByIdAndUpdate(userId, {
        deletionRequested: true,
        deletionRequestedAt: new Date(),
        deletionScheduledAt: deletionDate,
      }, { new: true });

      // Send confirmation email
      await emailService.sendEmail({
        to: user.email,
        subject: 'Account Deletion Scheduled',
        html: `
          <h2>Account Deletion Request Received</h2>
          <p>Dear ${user.name},</p>
          <p>Your account is scheduled for deletion on ${deletionDate.toDateString()}.</p>
          <p>You have 30 days to cancel this request by logging in and visiting your account settings.</p>
          <p>After this date, all your personal data will be permanently deleted.</p>
          <hr>
          <small>Travel CRM - Data Protection Team</small>
        `,
      });

      res.json({
        success: true,
        message: `Account deletion scheduled for ${deletionDate.toDateString()}`,
        deletionDate,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Cancel account deletion
  async cancelAccountDeletion(req, res) {
    try {
      const userId = req.user._id;

      await User.findByIdAndUpdate(userId, {
        deletionRequested: false,
        deletionRequestedAt: null,
        deletionScheduledAt: null,
      });

      res.json({
        success: true,
        message: 'Account deletion request cancelled',
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Process account deletion (called by cron job)
  async processAccountDeletion(userId) {
    try {
      // Anonymize user data (keep for legal/financial records)
      await User.findByIdAndUpdate(userId, {
        name: `Deleted User ${userId}`,
        email: `deleted_${userId}@anonymized.local`,
        phone: null,
        dateOfBirth: null,
        address: null,
        profilePicture: null,
        isDeleted: true,
      });

      // Delete uploaded documents from S3
      const documents = await Document.find({ customer: userId });
      for (const doc of documents) {
        if (doc.fileUrl) {
          await s3Service.deleteFile(doc.fileUrl);
        }
      }

      // Soft delete related data
      await Document.updateMany({ customer: userId }, { isDeleted: true });
      await Query.updateMany({ customer: userId }, { isDeleted: true });

      // Note: Keep bookings and payments for legal/financial compliance
      // But anonymize personal references

      return { success: true };
    } catch (err) {
      console.error('Account deletion failed:', err);
      throw err;
    }
  }
}

module.exports = new DSRController();
```

## 3. Virus Scanning (ClamAV)

### Install ClamAV

```bash
# Docker service (add to docker-compose.yml)
clamav:
  image: clamav/clamav:latest
  ports:
    - "3310:3310"
  volumes:
    - clamav-data:/var/lib/clamav
```

### Virus Scanning Service

```javascript
// src/services/virusScanService.js
const NodeClam = require('clamscan');
const logger = require('../utils/logger');

class VirusScanService {
  constructor() {
    this.clamav = null;
    this.init();
  }

  async init() {
    try {
      this.clamav = await new NodeClam().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST || 'localhost',
          port: process.env.CLAMAV_PORT || 3310,
        },
      });
      logger.info('ClamAV initialized');
    } catch (err) {
      logger.error('Failed to initialize ClamAV', { error: err.message });
    }
  }

  async scanFile(filepath) {
    if (!this.clamav) {
      logger.warn('ClamAV not available, skipping scan');
      return { isInfected: false, viruses: [] };
    }

    try {
      const { isInfected, viruses } = await this.clamav.scanFile(filepath);
      
      if (isInfected) {
        logger.warn('Virus detected', { filepath, viruses });
      }

      return { isInfected, viruses };
    } catch (err) {
      logger.error('Virus scan failed', { error: err.message });
      throw new Error('Virus scanning failed');
    }
  }

  async scanBuffer(buffer) {
    if (!this.clamav) {
      return { isInfected: false, viruses: [] };
    }

    try {
      const { isInfected, viruses } = await this.clamav.scanBuffer(buffer);
      return { isInfected, viruses };
    } catch (err) {
      logger.error('Buffer scan failed', { error: err.message });
      throw new Error('Virus scanning failed');
    }
  }
}

module.exports = new VirusScanService();
```

### File Upload Middleware with Virus Scanning

```javascript
// src/middleware/fileUploadMiddleware.js (UPDATE)
const multer = require('multer');
const virusScanService = require('../services/virusScanService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const scanUploadedFile = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const { isInfected, viruses } = await virusScanService.scanBuffer(req.file.buffer);

    if (isInfected) {
      return res.status(400).json({
        success: false,
        message: `Virus detected: ${viruses.join(', ')}`,
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'File scanning failed',
    });
  }
};

module.exports = { upload, scanUploadedFile };
```

## 4. CAPTCHA (Anti-Bot Protection)

### Install reCAPTCHA

```bash
npm install google-recaptcha
```

### CAPTCHA Middleware

```javascript
// src/middleware/captchaMiddleware.js
const { RecaptchaV2 } = require('google-recaptcha');

const recaptcha = new RecaptchaV2({
  secretKey: process.env.RECAPTCHA_SECRET_KEY,
});

const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'CAPTCHA token required',
    });
  }

  try {
    const result = await recaptcha.verify(captchaToken, req.ip);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed',
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'CAPTCHA verification error',
    });
  }
};

// Only apply to public endpoints (login, register, contact)
module.exports = verifyCaptcha;
```

## 5. Advanced Rate Limiting

### Enhanced Rate Limiter

```javascript
// src/middleware/rateLimiter.js (UPDATE)
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');

// Per-user rate limiting
const userRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:user:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min
  keyGenerator: (req) => req.user?._id || req.ip,
  message: 'Too many requests from this user',
});

// Per-tenant rate limiting
const tenantRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:tenant:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 min per tenant
  keyGenerator: (req) => req.tenant?._id || 'anonymous',
  message: 'Too many requests from this organization',
});

// Strict rate limiting for sensitive endpoints
const strictRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:strict:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts
  keyGenerator: (req) => req.ip,
  message: 'Too many attempts. Please try again later.',
});

module.exports = {
  userRateLimiter,
  tenantRateLimiter,
  strictRateLimiter,
};
```

## 6. Audit Logging

### Audit Log Model

```javascript
// src/models/AuditLog.js
const auditLogSchema = new mongoose.Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    index: true,
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },

  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'login',
      'logout',
      'export_data',
      'delete_account',
      'change_password',
      'grant_permission',
      'revoke_permission',
    ],
    index: true,
  },

  resource: {
    type: String, // 'User', 'Booking', 'Payment', etc.
    required: true,
    index: true,
  },

  resourceId: {
    type: Schema.Types.ObjectId,
  },

  changes: Schema.Types.Mixed, // What changed (before/after)

  ipAddress: String,
  userAgent: String,
  traceId: String,

  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

// TTL index (auto-delete after 2 years)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

### Audit Logging Middleware

```javascript
// src/middleware/auditMiddleware.js
const AuditLog = require('../models/AuditLog');

const auditAction = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditLog.create({
          tenant: req.tenant?._id,
          user: req.user?._id,
          action,
          resource,
          resourceId: req.params.id || req.body._id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          traceId: req.traceId,
          metadata: {
            method: req.method,
            path: req.path,
          },
        }).catch(err => {
          console.error('Audit log failed:', err);
        });
      }

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = auditAction;
```

## Environment Variables

```env
# GDPR/CCPA
DATA_RETENTION_DAYS=730
DELETION_GRACE_PERIOD_DAYS=30

# Virus Scanning
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# CAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Audit Logging
AUDIT_LOG_RETENTION_DAYS=730
```

## Implementation Checklist

### GDPR Compliance
- [ ] Create DataRetentionPolicy model
- [ ] Add consent fields to User model
- [ ] Create DSR controller
- [ ] Implement data export
- [ ] Implement account deletion
- [ ] Create privacy policy page
- [ ] Cookie consent banner

### Virus Scanning
- [ ] Deploy ClamAV container
- [ ] Create virusScanService.js
- [ ] Update file upload middleware
- [ ] Test with EICAR test file

### CAPTCHA
- [ ] Get reCAPTCHA keys
- [ ] Create captchaMiddleware.js
- [ ] Apply to login/register
- [ ] Test bot protection

### Rate Limiting
- [ ] Enhanced rate limiters
- [ ] Per-user limits
- [ ] Per-tenant limits
- [ ] Strict limits for auth

### Audit Logging
- [ ] Create AuditLog model
- [ ] Create auditMiddleware.js
- [ ] Apply to sensitive operations
- [ ] Create audit log viewer

### Penetration Testing
- [ ] Run OWASP ZAP scan
- [ ] Fix SQL injection risks
- [ ] Fix XSS vulnerabilities
- [ ] Fix CSRF issues
- [ ] Test authentication bypass
- [ ] Test authorization flaws

## Acceptance Criteria

- [ ] Users can export their data
- [ ] Users can delete their accounts
- [ ] File uploads are scanned for viruses
- [ ] CAPTCHA blocks bots on public endpoints
- [ ] Rate limiting prevents abuse
- [ ] Audit logs track sensitive operations
- [ ] Security headers configured
- [ ] Penetration test findings resolved
- [ ] GDPR compliance documented

## Notes

- **Legal Review Required**: Have legal team review GDPR implementation
- **Data Mapping**: Document all personal data collection points
- **Third-Party Processors**: Ensure Data Processing Agreements (DPAs) in place
- **Breach Notification**: Have 72-hour breach notification process
- **Privacy by Design**: Minimize data collection by default
