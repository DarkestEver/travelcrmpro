# Brand & Signature Configuration

## Summary of Changes

### ✅ Implemented Tenant-Based Branding

**Updated File:** `backend/src/services/emailTemplateService.js`

---

## How It Works Now

### 1. **Tenant Configuration Loading**
All email templates now load branding/signature from the Tenant database:

```javascript
async loadTenantConfig(tenantId) {
  const tenant = await Tenant.findById(tenantId);
  return {
    companyName: tenant.businessName || 'Travel Manager Pro',
    agentName: tenant.settings?.email?.senderName || 'Travel Team',
    email: tenant.settings?.email?.senderEmail || 'app@travelmanagerpro.com',
    phone: tenant.settings?.contact?.phone || '+1 (800) 123-4567',
    website: tenant.settings?.contact?.website || 'www.travelmanagerpro.com',
    signature: tenant.settings?.email?.emailSignature || '',
    logoUrl: tenant.settings?.branding?.logoUrl || '',
    primaryColor: tenant.settings?.branding?.primaryColor || '#2563eb'
  };
}
```

### 2. **Caching for Performance**
- Tenant config is cached for 5 minutes to avoid database queries on every email
- Template files are cached permanently (until server restart)

### 3. **Fallback Defaults**
If tenant not found or fields missing, uses these defaults:
- **Company:** Travel Manager Pro
- **Team:** Travel Team
- **Email:** app@travelmanagerpro.com
- **Phone:** +1 (800) 123-4567
- **Website:** www.travelmanagerpro.com

---

## Where Branding Comes From (Database)

### Tenant Model Fields Used:

```javascript
// In Tenant model (settings object):
{
  businessName: "Your Travel Agency",  // → Company Name
  
  settings: {
    email: {
      senderName: "Sarah Johnson",     // → Agent Name in signature
      senderEmail: "sarah@agency.com", // → Reply-to email
      emailSignature: "Custom HTML...", // → Custom signature HTML
      showLogoInEmail: true
    },
    
    contact: {
      phone: "+1 (555) 123-4567",      // → Phone in signature
      website: "www.youragency.com"    // → Website link
    },
    
    branding: {
      logoUrl: "https://...",          // → Logo image
      primaryColor: "#ff6b00"          // → Brand color
    }
  }
}
```

---

## Current Email Signature (From Screenshot)

Based on your screenshot, the current signature is:

```html
Best regards,
Travel Team
Travel Manager Pro

📧 app@travelmanagerpro.com
📞 +1 (800) 123-4567
🌐 www.travelmanagerpro.com
```

This matches the **default fallback values** because:
- Your tenant (`690ce93c464bf35e0adede29`) likely doesn't have these fields configured yet

---

## How to Customize Your Signature

### Option 1: Update Tenant Settings (Database)

Run this to update your tenant:

```javascript
const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await Tenant.findByIdAndUpdate('690ce93c464bf35e0adede29', {
    businessName: 'My Travel Agency',
    'settings.email.senderName': 'John Smith',
    'settings.email.senderEmail': 'john@mytravelagency.com',
    'settings.contact.phone': '+1 (555) 999-8888',
    'settings.contact.website': 'www.mytravelagency.com',
    'settings.branding.primaryColor': '#ff6b00',
    'settings.email.emailSignature': '<p>Custom HTML signature here</p>'
  });
  
  console.log('✅ Tenant branding updated!');
  process.exit();
});
```

### Option 2: Use Custom Signature HTML

Set `settings.email.emailSignature` to your custom HTML:

```html
<div style="font-family: Arial, sans-serif; margin-top: 20px;">
  <p style="margin: 0;">Warm regards,</p>
  <p style="margin: 0; font-weight: bold; color: #2563eb;">John Smith</p>
  <p style="margin: 0; color: #666;">Senior Travel Consultant</p>
  <p style="margin: 0; font-weight: bold;">My Travel Agency</p>
  <p style="margin: 0; font-size: 12px; color: #888;">
    📧 john@agency.com | 📞 +1 (555) 999-8888<br>
    🌐 www.mytravelagency.com
  </p>
</div>
```

---

## Templates Updated

All 4 email template methods now load tenant config:

1. ✅ `generateMissingInfoEmail()` - Ask for more info
2. ✅ `generateItinerariesEmail()` - Phase 3: High confidence matches
3. ✅ `generateModerateMatchEmail()` - Phase 3: Moderate matches
4. ✅ `generateCustomRequestEmail()` - Phase 3: Forward to supplier

---

## Testing

To see your custom branding:

1. **Update tenant settings** (database)
2. **Clear cache** (restart server or wait 5 minutes)
3. **Send test email**
4. **Check signature** in generated email

---

## Next Steps

1. **Create admin UI** to manage tenant branding settings
2. **Add logo upload** functionality
3. **Test different signature styles**
4. **Add signature preview** in settings

---

**Status:** ✅ **IMPLEMENTED**  
**Server Restart:** Required (nodemon should auto-restart)  
**Cache Duration:** 5 minutes
