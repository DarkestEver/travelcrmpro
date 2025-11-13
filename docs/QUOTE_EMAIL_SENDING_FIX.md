# Quote Email Sending Fix

## Problem

Users were not receiving quote emails when sent from the system.

## Root Cause

The `sendQuoteEmail` and `sendBookingConfirmationEmail` functions in `backend/src/utils/email.js` were using the generic `sendEmail` utility, which relies on global SMTP configuration from environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, etc.).

However, the system is designed as a **multi-tenant application** where each tenant has their own email account configured in the database (`EmailAccount` model). The reply functionality was correctly using tenant-specific SMTP settings, but quote and booking emails were not.

## Solution

Updated both `sendQuoteEmail` and `sendBookingConfirmationEmail` functions to:

1. **Fetch tenant-specific email account** from the database
2. **Create a nodemailer transporter** with tenant's SMTP settings
3. **Send emails using tenant's SMTP** credentials
4. **Log detailed sending information** for debugging

## Changes Made

### File: `backend/src/utils/email.js`

#### Before:
```javascript
const sendQuoteEmail = async (quote, agent, customer) => {
  // ... HTML template ...
  
  await sendEmail({  // ❌ Uses global SMTP config
    to: customer.email,
    subject: `Travel Quote ${quote.quoteNumber}`,
    html
  });
};
```

#### After:
```javascript
const sendQuoteEmail = async (quote, agent, customer) => {
  // ... HTML template ...
  
  // ✅ Get tenant's email account
  const EmailAccount = require('../models/EmailAccount');
  const emailAccount = await EmailAccount.findOne({ 
    tenantId: agent.tenantId || quote.tenantId,
    isActive: true,
    'smtp.enabled': true
  }).select('+smtp.password');

  if (!emailAccount) {
    throw new Error('No active SMTP email account configured');
  }

  // ✅ Create tenant-specific transporter
  const accountObj = emailAccount.toObject({ getters: true });
  const tenantTransporter = nodemailer.createTransport({
    host: accountObj.smtp.host,
    port: accountObj.smtp.port,
    secure: accountObj.smtp.secure,
    auth: {
      user: accountObj.smtp.username,
      pass: accountObj.smtp.password
    }
  });

  // ✅ Send with tenant's SMTP
  const info = await tenantTransporter.sendMail(mailOptions);
  console.log('✅ Quote email sent successfully');
};
```

## Testing

### 1. Verify Email Account Configuration
Ensure your tenant has an active email account configured:
```
Settings -> Email Accounts -> Add/Edit Email Account
- SMTP Host: smtp.gmail.com (or your provider)
- SMTP Port: 587 (or 465 for SSL)
- Username: your-email@gmail.com
- Password: your-app-password
- Enable SMTP: ✓
- Active: ✓
```

### 2. Test Quote Sending
1. Create a quote for a customer
2. Click "Send Quote"
3. Check backend logs for:
   ```
   📤 Sending quote email via tenant SMTP:
   ✅ Quote email sent successfully. MessageId: ...
   ```
4. Verify customer receives the email

### 3. Test Booking Confirmation
1. Create a booking
2. Confirm the booking
3. Check logs for successful send
4. Verify customer receives confirmation

## Error Messages

### "No active SMTP email account configured"
**Cause:** Tenant doesn't have an email account set up or it's not active.

**Solution:**
1. Go to Settings -> Email Accounts
2. Add a new email account with SMTP settings
3. Make sure "Enable SMTP" and "Active" are checked
4. Save the configuration

### "Authentication failed"
**Cause:** Invalid SMTP credentials

**Solution:**
- For Gmail: Use App Password, not regular password
- For Outlook: Enable "Less Secure Apps" or use App Password
- Verify username and password are correct

### "Connection timeout"
**Cause:** Incorrect host or port

**Solution:**
- Gmail: smtp.gmail.com, port 587 (TLS) or 465 (SSL)
- Outlook: smtp.office365.com, port 587
- Check firewall settings

## Benefits

1. ✅ **Multi-tenant support** - Each tenant uses their own email account
2. ✅ **Consistent with replies** - All outgoing emails use same mechanism
3. ✅ **Better debugging** - Detailed logs show which SMTP server is being used
4. ✅ **Proper "From" address** - Emails come from tenant's configured email
5. ✅ **No global SMTP needed** - No environment variables required

## Related Files

- `backend/src/utils/email.js` - Email sending utilities
- `backend/src/models/EmailAccount.js` - Email account schema
- `backend/src/controllers/emailController.js` - Reply email (reference implementation)
- `backend/src/controllers/quoteController.js` - Quote sending logic

## Migration Notes

If you were relying on environment variables for SMTP, you now MUST configure email accounts in the database for each tenant:

```javascript
// Old way (no longer works for quotes/bookings):
SMTP_HOST=smtp.gmail.com
SMTP_USER=admin@example.com
SMTP_PASSWORD=password

// New way (required):
Configure via UI: Settings -> Email Accounts
```

## Rollback

If you need to temporarily rollback:

1. Revert `sendQuoteEmail` to use `sendEmail()` utility
2. Ensure environment variables are set
3. This will work but lose multi-tenant capability

## Future Enhancements

- [ ] Add fallback to global SMTP if tenant account not configured
- [ ] Queue system for reliable email delivery
- [ ] Email delivery status tracking in database
- [ ] Retry mechanism for failed sends
- [ ] Email templates stored in database per tenant
