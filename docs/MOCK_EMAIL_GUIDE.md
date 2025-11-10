# 📧 Mock Email Service - Developer Guide

## Overview

The Travel CRM uses an intelligent email service that automatically switches between **mock emails** (development/test) and **real emails** (production) based on environment variables.

---

## 🎯 Quick Start

### Development Mode (Mock Emails)
```bash
# .env
NODE_ENV=development
EMAIL_SERVICE_ENABLED=false  # Optional, defaults to false in dev
```

**Result:** All emails logged to console, no actual sending

### Production Mode (Real Emails)
```bash
# .env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@travelcrm.com
SMTP_FROM_NAME=Travel CRM
```

**Result:** Real emails sent via SMTP

---

## 📁 Architecture

### Files Structure
```
backend/src/utils/
├── emailService.js    ← NEW: Comprehensive mock/real email service
└── email.js          ← UPDATED: Legacy service with mock support
```

### Decision Flow
```
Email Send Request
    ↓
Check NODE_ENV + EMAIL_SERVICE_ENABLED
    ↓
├─ Dev/Test + Disabled → Mock Email (Console Log)
├─ Dev/Test + Enabled  → Real Email (SMTP)
└─ Production          → Real Email (SMTP)
```

---

## 🔧 Configuration Matrix

| NODE_ENV | EMAIL_SERVICE_ENABLED | Behavior | Use Case |
|----------|----------------------|----------|----------|
| `development` | `false` (default) | ✅ Mock | Normal development |
| `development` | `true` | 📧 Real | Test real email integration |
| `test` | `false` (default) | ✅ Mock | Automated testing |
| `test` | `true` | 📧 Real | Email integration tests |
| `production` | (any) | 📧 Real | Live environment |

---

## 📝 Mock Email Output

### Console Example
```
📧 MOCK EMAIL SENT (DEV MODE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: customer@example.com
Subject: Your Travel Quote - Q2025-000001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Body Preview:
Dear John Doe,

Thank you for your interest in our travel services.
Here is your personalized quote for:
Destination: Paris, France
Duration: 7 days, 6 nights
Total Price: $3,214.25

Quote Number: Q2025-000001
Valid Until: 2025-11-13

Best regards,
Travel CRM Team
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Mock email sent successfully
Message ID: mock-1762422084@travelcrm.local
```

---

## 🛠️ Available Functions

### 1. **sendEmail()** - Generic Email
```javascript
const { sendEmail } = require('../utils/emailService');

await sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  text: 'Plain text content',
  html: '<h1>HTML content</h1>'
});
```

### 2. **sendPasswordResetEmail()** - Auth Reset
```javascript
const { sendPasswordResetEmail } = require('../utils/emailService');

await sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://app.travelcrm.com/reset-password?token=abc123'
);
```

### 3. **sendQuoteEmail()** - Quote to Customer
```javascript
const { sendQuoteEmail } = require('../utils/emailService');

await sendQuoteEmail(quoteData, customerData);
// quoteData: { quoteNumber, destination, duration, pricing, validUntil }
// customerData: { name, email }
```

### 4. **sendBookingConfirmationEmail()** - Booking Confirmation
```javascript
const { sendBookingConfirmationEmail } = require('../utils/emailService');

await sendBookingConfirmationEmail(bookingData, customerData);
// bookingData: { bookingNumber, destination, travelDates, totalAmount }
// customerData: { name, email }
```

---

## 🔍 Debugging Mock Emails

### Enable Verbose Logging
Mock emails automatically log full details to console in development mode.

### Check Email Service Status
```javascript
// In any controller
console.log('Email Service:', {
  env: process.env.NODE_ENV,
  enabled: process.env.EMAIL_SERVICE_ENABLED,
  usingMock: process.env.NODE_ENV !== 'production' && 
             process.env.EMAIL_SERVICE_ENABLED !== 'true'
});
```

---

## 🧪 Testing Email Functionality

### Unit Test Example
```javascript
const { sendEmail } = require('../utils/emailService');

describe('Email Service', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_SERVICE_ENABLED = 'false';
  });

  test('should mock email in test environment', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Test body'
    });

    expect(result.messageId).toContain('mock-');
    expect(result.accepted).toContain('test@example.com');
  });
});
```

### Integration Test
```bash
# Test with mock emails
NODE_ENV=test node tests/api-tests.js

# Test with real emails (be careful!)
NODE_ENV=test EMAIL_SERVICE_ENABLED=true node tests/api-tests.js
```

---

## 🚨 Production Deployment Checklist

### Before Deploying to Production

1. **Set Production Environment**
   ```bash
   NODE_ENV=production
   ```

2. **Configure SMTP Credentials**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=production@travelcrm.com
   SMTP_PASSWORD=your-secure-app-password
   SMTP_FROM_EMAIL=noreply@travelcrm.com
   SMTP_FROM_NAME=Travel CRM
   ```

3. **Verify Email Service**
   ```bash
   # Test forgot-password endpoint with real email
   curl -X POST http://your-domain.com/api/v1/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@gmail.com"}'
   ```

4. **Monitor Logs**
   - Check server logs for email send confirmations
   - Monitor SMTP service for delivery status
   - Set up alerts for email failures

5. **Fallback Strategy**
   - Configure backup SMTP service
   - Implement retry logic for failed emails
   - Log failed emails to database for manual resend

---

## 🔐 Security Best Practices

### SMTP Credentials
- ✅ Use environment variables (never commit credentials)
- ✅ Use app-specific passwords (Gmail, Outlook)
- ✅ Enable 2FA on email accounts
- ✅ Rotate passwords regularly
- ✅ Use dedicated email service account

### Email Content
- ✅ Sanitize user input in emails
- ✅ Use plain text + HTML versions
- ✅ Include unsubscribe links (marketing emails)
- ✅ Rate limit email sending per user
- ✅ Validate email addresses before sending

---

## 🐛 Troubleshooting

### Problem: Emails not sending in development
**Solution:** Check console logs for mock emails
```bash
# Should see:
📧 MOCK EMAIL SENT (DEV MODE)
```

### Problem: Real emails not working
**Solutions:**
1. Verify SMTP credentials
2. Check firewall/network settings
3. Enable "Less secure app access" (Gmail)
4. Use app-specific password
5. Check SMTP port (587 for TLS, 465 for SSL)

### Problem: Emails going to spam
**Solutions:**
1. Configure SPF records
2. Set up DKIM signing
3. Add DMARC policy
4. Use reputable SMTP service
5. Verify sender domain

### Problem: Mock emails in production
**Check:**
```bash
# Verify environment
echo $NODE_ENV  # Should be 'production'

# Force restart
pm2 restart travel-crm-backend --update-env
```

---

## 📊 Email Service Monitoring

### Metrics to Track
- Email send success rate
- Average email delivery time
- Bounce rate
- Spam complaints
- SMTP connection failures

### Logging Example
```javascript
// Add to emailService.js for production monitoring
if (process.env.NODE_ENV === 'production') {
  logger.info('Email sent', {
    to: info.accepted,
    messageId: info.messageId,
    response: info.response
  });
}
```

---

## 🔄 Migration from email.js to emailService.js

### Old Way (email.js)
```javascript
const { sendEmail } = require('../utils/email');

await sendEmail(mailOptions);
```

### New Way (emailService.js)
```javascript
const { sendQuoteEmail } = require('../utils/emailService');

await sendQuoteEmail(quoteData, customerData);
```

### Both Work!
- `email.js` - Updated with mock support, generic function
- `emailService.js` - New, specialized functions for each email type

---

## 📚 Related Documentation

- [API Test Results](./TEST_RESULTS_SUMMARY.md)
- [Environment Variables](./ENV_VARIABLES.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Swagger API Docs](http://localhost:5000/api-docs)

---

## 🎓 FAQ

**Q: Can I disable mock emails in development?**  
A: Yes, set `EMAIL_SERVICE_ENABLED=true` in your `.env` file

**Q: Will mock emails affect production?**  
A: No, production always uses real emails regardless of EMAIL_SERVICE_ENABLED

**Q: How do I test real emails locally?**  
A: Set `NODE_ENV=development` and `EMAIL_SERVICE_ENABLED=true`

**Q: What happens if SMTP fails in production?**  
A: Error is logged, user sees "Email sent" message, admin should monitor logs

**Q: Can I customize mock email format?**  
A: Yes, edit console.log statements in `emailService.js` createTransporter()

---

**Last Updated:** 2025-11-06  
**Version:** 1.0  
**Maintainer:** Development Team
