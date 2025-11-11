# 📧 Manual Reply SMTP Flow - UPDATED

## ✅ NEW: Using Tenant SMTP from Database

```
┌──────────────────────────────────────────────────────────────────┐
│                    BEFORE (❌ WRONG)                              │
└──────────────────────────────────────────────────────────────────┘

User clicks "Send Reply"
        ↓
  POST /api/v1/emails/:id/reply
        ↓
  emailController.replyToEmail()
        ↓
  Uses emailService.sendEmail()
        ↓
  Reads .env file:
    • EMAIL_HOST=smtp.gmail.com        ← Same for ALL tenants
    • EMAIL_USER=noreply@example.com   ← Not tenant-specific
    • EMAIL_PASSWORD=***               ← Shared password
        ↓
  Creates nodemailer transporter
        ↓
  Sends email from: noreply@example.com
        ↓
  ❌ Problem: All replies come from same address
  ❌ Problem: No multi-tenant isolation
  ❌ Problem: Can't customize per tenant


┌──────────────────────────────────────────────────────────────────┐
│                    AFTER (✅ CORRECT)                             │
└──────────────────────────────────────────────────────────────────┘

User clicks "Send Reply"
        ↓
  POST /api/v1/emails/:id/reply
  Headers: { Authorization: Bearer <JWT with tenantId> }
        ↓
  emailController.replyToEmail()
        ↓
  1. Get tenantId from req.user.tenantId (from JWT)
        ↓
  2. Query database for tenant's email account:
     EmailAccount.findOne({ 
       tenantId: "690ce6d206c104addbfedb65",  ← Tenant-specific
       isActive: true,
       'smtp.enabled': true
     })
        ↓
  3. Returns tenant's SMTP config from database:
     {
       email: "app@travelmanagerpro.com",
       smtp: {
         host: "travelmanagerpro.com",    ← Tenant's server
         port: 25,                         ← Tenant's port
         secure: false,                    ← Tenant's TLS
         username: "app@travelmanagerpro.com",
         password: "encrypted...",         ← Tenant's password
         fromName: "Travel Manager Pro"    ← Tenant's branding
       }
     }
        ↓
  4. Decrypt password using Mongoose getter:
     accountObj = emailAccount.toObject({ getters: true })
     → accountObj.smtp.password = "Ip@warming#123"
        ↓
  5. Create tenant-specific transporter:
     nodemailer.createTransporter({
       host: "travelmanagerpro.com",      ← From database
       port: 25,                           ← From database
       secure: false,                      ← From database
       auth: {
         user: "app@travelmanagerpro.com", ← From database
         pass: "Ip@warming#123"            ← Decrypted
       }
     })
        ↓
  6. Send email with tenant branding:
     transporter.sendMail({
       from: "Travel Manager Pro <app@travelmanagerpro.com>",
       to: "customer@email.com",
       subject: "Re: Dubai Trip",
       html: "<p>Your reply</p>",
       inReplyTo: "original-message-id",   ← For threading
       references: ["thread-ids"]          ← Conversation chain
     })
        ↓
  7. Email sent via tenant's SMTP server
        ↓
  ✅ Benefit: Each tenant uses their own SMTP
  ✅ Benefit: Proper sender authentication (SPF/DKIM)
  ✅ Benefit: Custom branding per tenant
  ✅ Benefit: Multi-tenant isolation
```

---

## 🔑 Key Differences

| Aspect | Before (❌) | After (✅) |
|--------|-------------|-----------|
| **SMTP Source** | .env file | Database (per tenant) |
| **Host** | Same for all | Tenant-specific |
| **Credentials** | Shared | Tenant-specific |
| **From Address** | Same for all | Tenant's email |
| **Branding** | Generic | Custom per tenant |
| **Security** | Single point of failure | Isolated per tenant |
| **Scalability** | Poor | Excellent |

---

## 📊 Multi-Tenant Example

### Tenant A (Travel Manager Pro):
```javascript
{
  tenantId: "690ce6d206c104addbfedb65",
  email: "app@travelmanagerpro.com",
  smtp: {
    host: "travelmanagerpro.com",
    fromName: "Travel Manager Pro"
  }
}
```
**Sends as:** `Travel Manager Pro <app@travelmanagerpro.com>`

### Tenant B (Another Travel Agency):
```javascript
{
  tenantId: "abc123...",
  email: "info@anothertravelagency.com",
  smtp: {
    host: "mail.anothertravelagency.com",
    fromName: "Another Travel Agency"
  }
}
```
**Sends as:** `Another Travel Agency <info@anothertravelagency.com>`

### Result:
- ✅ Each tenant's replies come from their own domain
- ✅ Proper SPF/DKIM authentication
- ✅ No cross-contamination
- ✅ Professional appearance

---

## 🛡️ Security Benefits

### 1. Tenant Isolation
```javascript
// Query includes tenantId from JWT
const emailAccount = await EmailAccount.findOne({ 
  tenantId: req.user.tenantId,  // ← From authenticated user
  isActive: true,
  'smtp.enabled': true
});
```
**Prevents:** Tenant A from using Tenant B's SMTP

### 2. Password Encryption
```javascript
// Password stored encrypted in database
password: {
  type: String,
  get: decryptPassword,  // ← Auto-decrypts on read
  set: encryptPassword   // ← Auto-encrypts on write
}
```
**Prevents:** Plain text passwords in database

### 3. JWT Authentication
```javascript
// Must be authenticated to send reply
router.post('/:id/reply', protect, emailController.replyToEmail);
//                         ^^^^^^^ Requires valid JWT
```
**Prevents:** Unauthorized email sending

---

## 📝 Code Changes Summary

### File: `backend/src/controllers/emailController.js`

#### Lines Added: ~60
#### Key Changes:
1. Import nodemailer directly
2. Query EmailAccount with tenantId
3. Decrypt password with `toObject({ getters: true })`
4. Create transporter with tenant's SMTP
5. Send with tenant's branding
6. Add logging for debugging

#### Before:
```javascript
const emailService = require('../services/emailService');
const sendResult = await emailService.sendEmail({ ... });
```

#### After:
```javascript
const EmailAccount = require('../models/EmailAccount');
const emailAccount = await EmailAccount.findOne({ tenantId, ... });
const accountObj = emailAccount.toObject({ getters: true });
const transporter = nodemailer.createTransporter({ ... });
const sendResult = await transporter.sendMail({ ... });
```

---

## ✅ Verification Checklist

- [x] Code updated in emailController.js
- [x] Tenant SMTP config verified in database
- [x] Password encryption/decryption working
- [x] Multi-tenant query uses tenantId
- [x] From address uses tenant's email
- [x] Threading headers included
- [x] Logging added for debugging
- [x] Documentation created
- [ ] Backend restarted (PENDING)
- [ ] Manual reply tested from UI (PENDING)
- [ ] Email received by customer (PENDING)

---

## 🚀 Ready to Test!

Your tenant's SMTP configuration is ready:

**SMTP Server:** travelmanagerpro.com:25  
**From:** Travel Manager Pro <app@travelmanagerpro.com>  
**Status:** ✅ Configuration verified

**Next step:** Restart backend and test manual reply from UI!
