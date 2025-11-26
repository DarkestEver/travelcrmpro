# Phase 8: Email System Enhancement

**Status:** 🟡 40% Complete  
**Priority:** P1 (High)  
**Estimated Time:** 2 days  
**Dependencies:** Phase 6 (Quotes), Phase 7 (Payments)

## Overview

Complete email sending implementation with SMTP/SendGrid/SES integration, template management, tracking, and retry mechanism.

## Current Implementation Status

### ✅ Implemented (40%)
- [x] **EmailQueue model** with Bull queue
- [x] **Email job processing** structure
- [x] **Basic email templates** (hardcoded)
- [x] **Email controller** endpoints

### ❌ Missing (60%)
- [ ] **Actual email sending** (SMTP/SendGrid/SES)
- [ ] **Email template** database model
- [ ] **Template variables** replacement
- [ ] **Email tracking** (sent, delivered, opened, clicked)
- [ ] **Bounce handling**
- [ ] **Retry mechanism** with exponential backoff
- [ ] **Email preferences** (unsubscribe)
- [ ] **Email statistics** dashboard

## Implementation Plan

### Step 1: Email Service Integration (0.5 day)

```javascript
// src/services/emailService.js (UPDATE - Add actual sending)
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'smtp'; // smtp, sendgrid, ses
    this.initProvider();
  }

  initProvider() {
    switch (this.provider) {
      case 'smtp':
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        break;

      case 'sendgrid':
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.transporter = sgMail;
        break;

      case 'ses':
        this.transporter = new AWS.SES({
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });
        break;
    }
  }

  async sendEmail({ to, subject, html, from, attachments = [] }) {
    const fromEmail = from || process.env.EMAIL_FROM;

    try {
      let result;

      switch (this.provider) {
        case 'smtp':
          result = await this.transporter.sendMail({
            from: fromEmail,
            to,
            subject,
            html,
            attachments,
          });
          break;

        case 'sendgrid':
          result = await this.transporter.send({
            from: fromEmail,
            to,
            subject,
            html,
            attachments: attachments.map(a => ({
              content: a.content.toString('base64'),
              filename: a.filename,
              type: a.contentType,
            })),
          });
          break;

        case 'ses':
          result = await this.transporter.sendEmail({
            Source: fromEmail,
            Destination: { ToAddresses: [to] },
            Message: {
              Subject: { Data: subject },
              Body: { Html: { Data: html } },
            },
          }).promise();
          break;
      }

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send failed:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
```

### Step 2: Email Template Model (0.25 day)

```javascript
// src/models/EmailTemplate.js (NEW)
const emailTemplateSchema = new mongoose.Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
  },

  slug: {
    type: String,
    required: true,
    index: true,
  },

  category: {
    type: String,
    enum: ['transactional', 'marketing', 'system'],
    default: 'transactional',
  },

  subject: {
    type: String,
    required: true,
  },

  body: {
    type: String,
    required: true,
  },

  // Variables available (for documentation)
  variables: [{
    name: String,
    description: String,
    example: String,
  }],

  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Unique slug per tenant
emailTemplateSchema.index({ tenant: 1, slug: 1 }, { unique: true });

// Method: Render template with variables
emailTemplateSchema.methods.render = function(variables) {
  let subject = this.subject;
  let body = this.body;

  // Replace {{variable}} with actual values
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, variables[key]);
    body = body.replace(regex, variables[key]);
  });

  return { subject, body };
};
```

### Step 3: Email Tracking Model (0.25 day)

```javascript
// src/models/EmailLog.js (NEW)
const emailLogSchema = new mongoose.Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  to: {
    type: String,
    required: true,
    index: true,
  },

  from: String,

  subject: String,

  template: {
    type: Schema.Types.ObjectId,
    ref: 'EmailTemplate',
  },

  // Tracking
  messageId: String,

  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'],
    default: 'queued',
    index: true,
  },

  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,
  failedAt: Date,

  bounceReason: String,
  errorMessage: String,

  // Tracking pixel/links
  trackingPixelUrl: String,
  trackedLinks: [String],

  // Retry tracking
  retryCount: {
    type: Number,
    default: 0,
  },

  nextRetryAt: Date,

  // Metadata
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

emailLogSchema.index({ tenant: 1, createdAt: -1 });
emailLogSchema.index({ messageId: 1 });
```

### Step 4: Enhanced Email Queue Job (0.5 day)

```javascript
// src/jobs/emailJob.js (UPDATE)
const emailService = require('../services/emailService');
const EmailLog = require('../models/EmailLog');
const EmailTemplate = require('../models/EmailTemplate');

async function processEmail(job) {
  const { to, subject, html, templateSlug, variables, tenantId, metadata } = job.data;

  try {
    // Create email log
    const emailLog = await EmailLog.create({
      tenant: tenantId,
      to,
      from: process.env.EMAIL_FROM,
      subject,
      status: 'queued',
      metadata,
    });

    // Render template if provided
    let finalSubject = subject;
    let finalHtml = html;

    if (templateSlug) {
      const template = await EmailTemplate.findOne({
        tenant: tenantId,
        slug: templateSlug,
        isActive: true,
      });

      if (template) {
        const rendered = template.render(variables || {});
        finalSubject = rendered.subject;
        finalHtml = rendered.body;
        emailLog.template = template._id;
      }
    }

    // Add tracking pixel
    const trackingPixelUrl = `${process.env.APP_URL}/api/email-tracking/pixel/${emailLog._id}.gif`;
    finalHtml += `<img src="${trackingPixelUrl}" width="1" height="1" alt="" />`;

    // Send email
    const result = await emailService.sendEmail({
      to,
      subject: finalSubject,
      html: finalHtml,
    });

    // Update log
    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    emailLog.messageId = result.messageId;
    emailLog.trackingPixelUrl = trackingPixelUrl;
    await emailLog.save();

    return { success: true, emailLogId: emailLog._id };
  } catch (error) {
    // Update log with failure
    await EmailLog.findOneAndUpdate(
      { to, subject },
      {
        status: 'failed',
        failedAt: new Date(),
        errorMessage: error.message,
      }
    );

    // Retry logic
    if (job.attemptsMade < 3) {
      throw error; // Bull will retry
    }

    return { success: false, error: error.message };
  }
}
```

### Step 5: Email Tracking Endpoints (0.25 day)

```javascript
// src/routes/emailTrackingRoutes.js (NEW)
const express = require('express');
const router = express.Router();
const EmailLog = require('../models/EmailLog');

// Track email open (tracking pixel)
router.get('/pixel/:emailLogId.gif', async (req, res) => {
  try {
    await EmailLog.findByIdAndUpdate(req.params.emailLogId, {
      status: 'opened',
      openedAt: new Date(),
    });

    // Return 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
    });
    res.end(pixel);
  } catch (err) {
    res.status(404).end();
  }
});

// Track link click
router.get('/click/:emailLogId/:linkIndex', async (req, res) => {
  try {
    const emailLog = await EmailLog.findById(req.params.emailLogId);
    
    if (emailLog) {
      emailLog.status = 'clicked';
      emailLog.clickedAt = new Date();
      await emailLog.save();

      // Redirect to actual link
      const targetUrl = emailLog.trackedLinks[req.params.linkIndex];
      res.redirect(targetUrl);
    } else {
      res.status(404).send('Not found');
    }
  } catch (err) {
    res.status(500).send('Error');
  }
});

module.exports = router;
```

### Step 6: Email Preferences & Unsubscribe (0.25 day)

```javascript
// Add to User model
const userSchema = new mongoose.Schema({
  // ... existing fields ...

  emailPreferences: {
    marketing: {
      type: Boolean,
      default: true,
    },
    transactional: {
      type: Boolean,
      default: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    unsubscribedAt: Date,
  },
});

// Unsubscribe endpoint
router.get('/unsubscribe/:userId/:token', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    // Verify token (should be signed JWT)
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    
    if (decoded.userId === req.params.userId) {
      user.emailPreferences.marketing = false;
      user.emailPreferences.unsubscribedAt = new Date();
      await user.save();

      res.send('You have been unsubscribed from marketing emails.');
    } else {
      res.status(400).send('Invalid token');
    }
  } catch (err) {
    res.status(500).send('Error');
  }
});
```

## Environment Variables

```env
# Email Provider (smtp, sendgrid, ses)
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@travelcrm.com

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx

# Tracking
APP_URL=https://travelcrm.com
```

## TODO Checklist

- [ ] Install dependencies (nodemailer, @sendgrid/mail, aws-sdk)
- [ ] Implement emailService.js with SMTP/SendGrid/SES
- [ ] Create EmailTemplate model
- [ ] Create EmailLog model
- [ ] Update email job with template rendering
- [ ] Add tracking pixel to emails
- [ ] Create email tracking routes
- [ ] Add unsubscribe functionality
- [ ] Create default email templates
- [ ] Test email sending (all providers)
- [ ] Test template rendering
- [ ] Test tracking pixel
- [ ] Test unsubscribe

## Acceptance Criteria

- [ ] Emails sent successfully via SMTP/SendGrid/SES
- [ ] Email templates stored in database
- [ ] Template variables replaced correctly
- [ ] Tracking pixel records opens
- [ ] Link clicks tracked
- [ ] Unsubscribe working
- [ ] Email logs show delivery status
- [ ] Retry mechanism works for failures
- [ ] Test coverage > 75%
