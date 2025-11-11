# ✅ Tenant SMTP Configuration - COMPLETE

## Summary

The manual reply system now uses **tenant-specific SMTP settings** from the database instead of the default .env configuration.

---

## 🔧 What Was Changed

### File: `backend/src/controllers/emailController.js`

#### Before (❌ Wrong):
```javascript
// Used default .env SMTP settings for ALL tenants
const emailService = require('../services/emailService');
const sendResult = await emailService.sendEmail({
  to: email.from.email,
  subject: subject,
  html: body,
  // ... used process.env.EMAIL_HOST, etc.
});
```

#### After (✅ Correct):
```javascript
// Get tenant's email account from database
const EmailAccount = require('../models/EmailAccount');
const emailAccount = await EmailAccount.findOne({ 
  tenantId,
  isActive: true,
  'smtp.enabled': true
}).select('+smtp.password');

// Decrypt password using Mongoose getter
const accountObj = emailAccount.toObject({ getters: true });

// Create nodemailer transporter with TENANT'S SMTP settings
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: accountObj.smtp.host,        // ← From database
  port: accountObj.smtp.port,        // ← From database
  secure: accountObj.smtp.secure,    // ← From database
  auth: {
    user: accountObj.smtp.username,  // ← From database
    pass: accountObj.smtp.password   // ← Decrypted from database
  }
});

// Send using tenant's SMTP
const sendResult = await transporter.sendMail({
  from: `"${accountObj.smtp.fromName}" <${accountObj.smtp.username}>`,
  to: email.from.email,
  subject: subject,
  html: body,
  inReplyTo: email.messageId,        // ← Threading
  references: [...email.references, email.messageId]  // ← Conversation chain
});
```

---

## ✅ Current Tenant Configuration

### Email Account: **app@travelmanagerpro.com**
### Tenant ID: **690ce6d206c104addbfedb65**

#### IMAP (Receiving):
- ✅ Enabled
- Host: `travelmanagerpro.com`
- Port: `143`
- Secure: `false` (STARTTLS)
- Username: `app@travelmanagerpro.com`
- Password: ✅ Encrypted & Decrypted correctly

#### SMTP (Sending):
- ✅ Enabled
- Host: `travelmanagerpro.com`
- Port: `25`
- Secure: `false` (no SSL/TLS)
- Username: `app@travelmanagerpro.com`
- Password: ✅ Encrypted & Decrypted correctly
- From Name: `Travel Manager Pro`
- Reply-To: (not set)

#### Configuration Consistency:
- ✅ Same host for IMAP/SMTP
- ✅ Same username for IMAP/SMTP
- ✅ Same password for IMAP/SMTP

---

## 🔄 Updated Reply Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "SEND REPLY" IN UI                       │
└─────────────────────────────────────────────────────────┘
   ↓
   POST /api/v1/emails/:id/reply
   { subject, body, plainText }

┌─────────────────────────────────────────────────────────┐
│ 2. BACKEND: GET TENANT EMAIL ACCOUNT                    │
└─────────────────────────────────────────────────────────┘
   ↓
   Query: EmailAccount.findOne({ 
     tenantId: req.user.tenantId,    ← From JWT token
     isActive: true,
     'smtp.enabled': true
   })
   
   Returns: {
     email: "app@travelmanagerpro.com",
     smtp: {
       host: "travelmanagerpro.com",
       port: 25,
       username: "app@travelmanagerpro.com",
       password: "encrypted...",      ← Will be decrypted
       fromName: "Travel Manager Pro"
     }
   }

┌─────────────────────────────────────────────────────────┐
│ 3. BACKEND: DECRYPT PASSWORD                            │
└─────────────────────────────────────────────────────────┘
   ↓
   accountObj = emailAccount.toObject({ getters: true })
   
   Result: accountObj.smtp.password = "Ip@warming#123"

┌─────────────────────────────────────────────────────────┐
│ 4. BACKEND: CREATE TENANT-SPECIFIC TRANSPORTER          │
└─────────────────────────────────────────────────────────┘
   ↓
   nodemailer.createTransporter({
     host: "travelmanagerpro.com",    ← Tenant's SMTP
     port: 25,                         ← Tenant's port
     secure: false,                    ← Tenant's TLS setting
     auth: {
       user: "app@travelmanagerpro.com",
       pass: "Ip@warming#123"          ← Decrypted password
     }
   })

┌─────────────────────────────────────────────────────────┐
│ 5. BACKEND: SEND EMAIL VIA TENANT'S SMTP                │
└─────────────────────────────────────────────────────────┘
   ↓
   transporter.sendMail({
     from: "Travel Manager Pro <app@travelmanagerpro.com>",
     to: "customer@email.com",
     subject: "Re: Dubai Trip",
     html: "<p>Your reply</p>",
     inReplyTo: "original-message-id",
     references: ["thread-message-ids"]
   })

┌─────────────────────────────────────────────────────────┐
│ 6. SMTP SERVER: SEND TO CUSTOMER                        │
└─────────────────────────────────────────────────────────┘
   ↓
   [Tenant SMTP: travelmanagerpro.com:25]
   → [Customer's Email Provider]
   → [Customer's Inbox]

┌─────────────────────────────────────────────────────────┐
│ 7. BACKEND: UPDATE DATABASE                             │
└─────────────────────────────────────────────────────────┘
   ↓
   email.manuallyReplied = true
   email.responseType = 'manual'
   email.responseSentAt = new Date()
   email.responseId = messageId
   await email.save()

┌─────────────────────────────────────────────────────────┐
│ 8. FRONTEND: SHOW SUCCESS                               │
└─────────────────────────────────────────────────────────┘
   ↓
   Toast: "Reply sent successfully!"
   Button: "Reply" → "Reply Again" (gray)
```

---

## 🎯 Benefits

### 1. **Multi-Tenant Isolation**
- Each tenant uses their own SMTP server
- No cross-tenant email contamination
- Proper sender authentication (SPF/DKIM)

### 2. **Custom Branding**
- Each tenant can set their own `fromName`
- Replies come from tenant's domain
- Professional sender identity

### 3. **Flexible Configuration**
- Different SMTP providers per tenant
- Different ports/security settings
- Independent of .env file

### 4. **Security**
- Passwords encrypted in database
- Tenant-scoped queries prevent leaks
- JWT authentication required

---

## ⚠️ Error Handling

### No SMTP Account Configured:
```json
{
  "success": false,
  "message": "No active SMTP email account configured for your tenant"
}
```

**Solution:** Go to Settings → Email Accounts → Enable SMTP

### SMTP Authentication Failed:
- Check username/password are correct
- Verify SMTP host and port
- Test using `check-smtp-config.js` script

### Connection Timeout:
- Check firewall allows outbound SMTP (port 25/587/465)
- Verify SMTP server is reachable
- Try different port (25 → 587 → 465)

---

## 🧪 Testing Commands

### Check Current SMTP Configuration:
```bash
cd backend
node check-smtp-config.js
```

### Test Manual Reply (After Backend Restart):
1. Restart backend: `npm start`
2. Open email detail page in UI
3. Click "Reply" button
4. Fill subject and body
5. Click "Send Reply"
6. Check backend logs for:
   ```
   📤 Sending reply via tenant SMTP: {
     host: 'travelmanagerpro.com',
     port: 25,
     from: 'app@travelmanagerpro.com',
     to: 'customer@email.com'
   }
   ✅ Reply sent successfully via tenant SMTP
   ```

---

## ✅ Summary

**Before:** All tenants used same .env SMTP settings ❌  
**After:** Each tenant uses their own database SMTP settings ✅

**Configuration Source:** EmailAccount model (MongoDB)  
**Password Security:** Encrypted with crypto, decrypted via Mongoose getter  
**Multi-Tenant:** Fully isolated per tenantId  
**Status:** ✅ READY TO TEST

---

## 📋 Next Steps

1. ✅ Tenant SMTP configuration verified
2. ⏳ Restart backend server
3. ⏳ Test manual reply from UI
4. ⏳ Verify email arrives in customer inbox
5. ⏳ Verify threading works (In-Reply-To header)
6. ⏳ Test multi-tenant isolation (if you have multiple tenants)
