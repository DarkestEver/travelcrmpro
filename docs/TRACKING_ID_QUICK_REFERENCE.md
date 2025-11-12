# Email Tracking ID - Quick Reference Card

## 🚀 Quick Start

### Import the Service
```javascript
const EmailTrackingService = require('../services/emailTrackingService');
```

---

## 📝 Common Operations

### 1. Generate Tracking ID
```javascript
const trackingId = await EmailTrackingService.generateTrackingId(
  tenantId,
  customerEmail  // Optional: for customer-specific hash
);
// Returns: "TRK-ABC12-001234"
```

### 2. Inject into Email
```javascript
// HTML email
const htmlWithTracking = EmailTrackingService.injectTrackingId(
  originalHtmlBody,
  trackingId
);

// Plain text email
const textWithTracking = EmailTrackingService.injectTrackingIdPlainText(
  originalTextBody,
  trackingId
);
```

### 3. Extract from Reply
```javascript
const trackingId = EmailTrackingService.extractTrackingId(emailBody);
// Returns: "TRK-ABC12-001234" or null
```

### 4. Find Parent Email
```javascript
const parent = await EmailTrackingService.findParentByTrackingId(
  parsedEmail,
  tenantId
);
// Returns: EmailLog document or null
```

---

## 🔧 Full Integration Pattern

### Sending Email with Tracking

```javascript
// 1. Generate tracking ID
const trackingId = await EmailTrackingService.generateTrackingId(
  tenantId,
  recipientEmail
);

// 2. Inject into email body
let emailBodyWithTracking = originalBody;
let plainTextWithTracking = originalPlainText;

if (trackingId) {
  emailBodyWithTracking = EmailTrackingService.injectTrackingId(
    originalBody,
    trackingId
  );
  plainTextWithTracking = EmailTrackingService.injectTrackingIdPlainText(
    originalPlainText,
    trackingId
  );
}

// 3. Send email
const info = await transporter.sendMail({
  from: senderEmail,
  to: recipientEmail,
  subject: subject,
  html: emailBodyWithTracking,
  text: plainTextWithTracking
});

// 4. Save to database with tracking ID
const emailLog = await EmailLog.create({
  tenantId,
  messageId: info.messageId,
  trackingId: trackingId,  // ← Important!
  bodyHtml: emailBodyWithTracking,
  bodyText: plainTextWithTracking,
  // ... other fields
});
```

### Processing Incoming Email

```javascript
// 1. Extract tracking ID from body
const trackingId = EmailTrackingService.extractTrackingId(incomingEmail.body);

// 2. Find parent (if tracking ID exists)
let parent = null;
if (trackingId) {
  parent = await EmailTrackingService.findParentByTrackingId(
    incomingEmail,
    tenantId
  );
}

// 3. Link to parent in threading
if (parent) {
  await EmailThreadingService.linkReplyToParent(incomingEmail, parent);
}
```

---

## 📋 Tracking ID Format

```
[TRK-ABC12-001234]
  │    │      │
  │    │      └─ Sequence (6 digits)
  │    └──────── Customer Hash (5 chars)
  └───────────── Prefix (2-10 chars)
```

### Components:
- **Prefix**: Tenant-configurable (default: "TRK")
- **Customer Hash**: MD5 of customer email (first 5 chars, uppercase)
- **Sequence**: Auto-incrementing per tenant (atomic)

---

## 🎨 What Gets Injected

### HTML Email Footer
```html
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
  <p style="font-size: 11px; color: #9ca3af;">
    <strong>Reference Number:</strong> [TRK-ABC12-001234]
  </p>
  <p style="font-size: 10px; color: #9ca3af;">
    Please include this reference number in your reply for faster assistance.
  </p>
</div>
<div style="display:none">TRACKING_ID:[TRK-ABC12-001234]</div>
```

### Plain Text Footer
```
---
Reference Number: [TRK-ABC12-001234]
Please include this reference number in your reply for faster assistance.
```

---

## 🔍 Extraction Patterns

The service checks for these patterns (in order):

1. `[TRK-ABC12-001234]` - Brackets
2. `REF: TRK-ABC12-001234` - Outlook style
3. `Tracking ID: TRK-ABC12-001234` - Human-readable
4. `Reference Number: TRK-ABC12-001234` - Formal

**Returns**: First match found, or `null`

---

## ✅ Validation

### Check if Valid Format
```javascript
const isValid = EmailTrackingService.isValidTrackingId(trackingId);
// Returns: true/false
```

### Parse Components
```javascript
const parsed = EmailTrackingService.parseTrackingId(trackingId);
// Returns: { prefix: 'TRK', customerHash: 'ABC12', sequence: 1234 }
```

---

## 🎯 Integration Points

### Already Integrated:
- ✅ Manual replies (`emailController.js`)
- ✅ AI auto-responses (`emailProcessingQueue.js`)
- ✅ Quote emails (`quoteController.js`)
- ✅ Email threading (`emailThreadingService.js`)

### To Integrate:
If you're adding a new email sending endpoint:

```javascript
// Template for new integration
async function sendYourCustomEmail(req, res) {
  const { tenantId, recipientEmail, body } = req.body;
  
  // 1. Generate tracking ID
  const trackingId = await EmailTrackingService.generateTrackingId(
    tenantId,
    recipientEmail
  );
  
  // 2. Inject into body
  const bodyWithTracking = EmailTrackingService.injectTrackingId(body, trackingId);
  
  // 3. Send email
  const info = await sendEmail({
    to: recipientEmail,
    html: bodyWithTracking,
    // ...
  });
  
  // 4. Save with tracking ID
  await EmailLog.create({
    trackingId: trackingId,  // ← Don't forget this!
    // ...
  });
}
```

---

## ⚡ Performance Tips

### Use Indexed Queries
```javascript
// Fast (uses index)
await EmailLog.findOne({ trackingId: 'TRK-ABC12-001234' });

// Slow (full collection scan)
await EmailLog.findOne({ bodyText: /TRK-ABC12-001234/ });
```

### Cache Tenant Settings
```javascript
// Avoid repeated DB calls
const tenantSettingsCache = new Map();

async function getCachedPrefix(tenantId) {
  if (!tenantSettingsCache.has(tenantId)) {
    const tenant = await Tenant.findById(tenantId);
    tenantSettingsCache.set(tenantId, tenant.settings.email.trackingIdPrefix);
  }
  return tenantSettingsCache.get(tenantId);
}
```

---

## 🐛 Troubleshooting

### Tracking ID Not Generated
```javascript
// Check tenant settings
const tenant = await Tenant.findById(tenantId);
console.log('Enabled:', tenant.settings.email.enableTrackingId);
// Should be true
```

### Tracking ID Not Extracted
```javascript
// Debug extraction
const patterns = [
  /\[([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})\]/i,
  /REF:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i,
  /Tracking\s+ID:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i,
  /Reference\s+Number:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i
];

patterns.forEach((pattern, i) => {
  const match = emailBody.match(pattern);
  console.log(`Pattern ${i+1}:`, match ? match[0] : 'no match');
});
```

### Parent Not Found
```javascript
// Check database
const parent = await EmailLog.findOne({
  trackingId: 'TRK-ABC12-001234',
  tenantId: tenantId
});
console.log('Parent exists:', !!parent);
```

---

## 📊 Database Schema

### EmailLog
```javascript
{
  trackingId: {
    type: String,
    index: true,     // Fast lookups
    sparse: true     // Only index non-null values
  }
}
```

### Tenant
```javascript
{
  settings: {
    email: {
      trackingIdPrefix: { type: String, default: 'TRK', uppercase: true },
      enableTrackingId: { type: Boolean, default: true },
      trackingIdSequence: { type: Number, default: 0 }
    }
  }
}
```

---

## 🔐 Security Notes

- Tracking IDs are **reference numbers**, not authentication tokens
- Safe to display in emails
- Not sensitive data (similar to order numbers)
- Customer hash adds 60M possibilities (prevents easy enumeration)

---

## 📚 Documentation

- **Full Docs**: `docs/EMAIL_TRACKING_ID_SYSTEM.md`
- **Testing Guide**: `backend/TEST_TRACKING_ID.md`
- **Implementation Summary**: `docs/TRACKING_ID_IMPLEMENTATION_SUMMARY.md`
- **This Reference**: `docs/TRACKING_ID_QUICK_REFERENCE.md`

---

## 🎯 Key Methods Reference

| Method | Purpose | Returns |
|--------|---------|---------|
| `generateTrackingId(tenantId, customerEmail?)` | Generate new tracking ID | String: "TRK-ABC12-001234" |
| `extractTrackingId(emailBody)` | Extract from email body | String or null |
| `injectTrackingId(htmlBody, trackingId)` | Add to HTML email | String (HTML with footer) |
| `injectTrackingIdPlainText(text, trackingId)` | Add to plain text | String (text with footer) |
| `findParentByTrackingId(parsedEmail, tenantId)` | Find parent email | EmailLog or null |
| `isValidTrackingId(trackingId)` | Validate format | Boolean |
| `parseTrackingId(trackingId)` | Extract components | Object: {prefix, hash, seq} |
| `findEmailByTrackingId(trackingId, tenantId)` | Database lookup | EmailLog or null |

---

## ⚡ Example: Complete Email Send

```javascript
const EmailTrackingService = require('../services/emailTrackingService');
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

async function sendEmailWithTracking(tenantId, to, subject, body) {
  try {
    // 1. Generate tracking ID
    const trackingId = await EmailTrackingService.generateTrackingId(tenantId, to);
    console.log(`📋 Generated: ${trackingId}`);
    
    // 2. Inject into email
    const htmlBody = EmailTrackingService.injectTrackingId(body, trackingId);
    const textBody = EmailTrackingService.injectTrackingIdPlainText(
      body.replace(/<[^>]*>/g, ''),
      trackingId
    );
    
    // 3. Send via SMTP
    const transporter = nodemailer.createTransporter(/* config */);
    const info = await transporter.sendMail({
      from: 'agent@travel.com',
      to: to,
      subject: subject,
      html: htmlBody,
      text: textBody
    });
    console.log(`📧 Sent with Message-ID: ${info.messageId}`);
    
    // 4. Save to database
    const emailLog = await EmailLog.create({
      tenantId,
      messageId: info.messageId,
      trackingId: trackingId,  // ← Key field
      subject,
      from: { email: 'agent@travel.com' },
      to: [{ email: to }],
      bodyHtml: htmlBody,
      bodyText: textBody,
      direction: 'outbound',
      status: 'sent',
      sentAt: new Date()
    });
    console.log(`💾 Saved with ID: ${emailLog._id}`);
    
    return { success: true, trackingId, emailLogId: emailLog._id };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

// Usage
await sendEmailWithTracking(
  tenantId,
  'customer@example.com',
  'Your Tour Quote',
  '<p>Here is your quote...</p>'
);
```

---

**Quick Tips:**
- ✅ Always inject tracking ID before sending
- ✅ Always save trackingId to EmailLog
- ✅ Use extractTrackingId on incoming emails
- ✅ Check index exists: `EmailLog.trackingId`
- ✅ Test with TEST_TRACKING_ID.md

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 2025
