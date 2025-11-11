# Tenant Settings Save Fix

## Problem
**Error:** "Failed to update settings. not firing api call"

**Root Cause:** Frontend and backend API endpoints didn't match

---

## What Was Wrong

### Frontend Issue
```javascript
// ❌ WRONG - Used wrong endpoint
const response = await api.patch(`/tenants/${tenantData._id}`, data);
```

### Backend Issue  
```javascript
// ❌ Backend expected different data structure
const { aiSettings, emailSettings, generalSettings } = req.body;

// ❌ But frontend sent:
{
  name: "...",
  settings: {
    branding: {...},
    contact: {...},
    email: {...}
  }
}
```

---

## Fixes Applied

### 1. ✅ Frontend - Fixed API Endpoint
**File:** `frontend/src/pages/TenantSettings.jsx`

```javascript
// ✅ FIXED - Use correct endpoint
const response = await api.patch(`/tenants/settings`, data);
```

**Changes:**
- Changed from `/tenants/${tenantData._id}` → `/tenants/settings`
- Added error logging for debugging

### 2. ✅ Backend - Accept Frontend Data Structure
**File:** `backend/src/controllers/tenantController.js`

```javascript
// ✅ Now accepts BOTH formats:

// Format 1 (Frontend format):
{
  name: "My Agency",
  settings: {
    branding: {...},
    contact: {...},
    email: {...}
  },
  metadata: {...}
}

// Format 2 (Old format - still supported):
{
  aiSettings: {...},
  emailSettings: {...},
  generalSettings: {...}
}
```

**Changes:**
- Added support for `name`, `settings`, `metadata` fields
- Merged entire `settings` object if provided
- Fallback to old format (`aiSettings`, etc) for backward compatibility
- Added more debug logging

---

## How It Works Now

### API Request Flow

1. **User clicks "Save Settings"** in frontend
2. **Frontend sends:**
   ```http
   PATCH /api/v1/tenants/settings
   Authorization: Bearer <token>
   
   {
     "name": "Travel Agency Name",
     "settings": {
       "branding": {
         "companyName": "My Travel",
         "primaryColor": "#4F46E5",
         "logo": "..."
       },
       "contact": {
         "email": "contact@agency.com",
         "phone": "+1 555 1234",
         "website": "www.agency.com"
       },
       "email": {
         "senderName": "John Smith",
         "senderEmail": "john@agency.com",
         "emailSignature": "<p>...</p>"
       },
       "payment": {...},
       "business": {...}
     },
     "metadata": {
       "timezone": "America/New_York",
       "currency": "USD"
     }
   }
   ```

3. **Backend validates:**
   - User is authenticated (`protect` middleware)
   - User has permission (admin/operator/super_admin)
   - Tenant exists

4. **Backend updates:**
   - Merges settings into existing tenant
   - Saves to database
   - Returns success response

5. **Frontend receives:**
   ```json
   {
     "success": true,
     "message": "Settings updated successfully",
     "data": { ...updated settings... }
   }
   ```

6. **UI updates:**
   - Shows success toast
   - Invalidates query cache
   - Refreshes tenant data

---

## Testing

### Test the Fix:

1. **Open Tenant Settings page**
2. **Make any changes:**
   - Company name
   - Email signature
   - Contact info
   - Branding colors
3. **Click "Save Settings"**
4. **Should see:**
   - ✅ Success toast: "Tenant settings updated successfully"
   - ✅ Page refreshes with new data
   - ✅ No console errors

### Debug If Issues:

Check browser console for:
```javascript
// Should see API call:
PATCH /api/v1/tenants/settings
Status: 200 OK
```

Check backend logs for:
```
updateTenantSettings: Looking for tenant: {...}
updateTenantSettings: Tenant query result: {...}
updateTenantSettings: Successfully updated tenant settings
```

---

## Related Files Modified

1. ✅ `frontend/src/pages/TenantSettings.jsx`
   - Fixed API endpoint
   - Added error logging

2. ✅ `backend/src/controllers/tenantController.js`
   - Accept both data formats
   - Better error handling
   - More debug logging

3. ⚠️ **No database migration needed** - settings structure already exists

---

## What Settings Can Be Updated

All these can now be saved properly:

### Branding
- Company name
- Primary/secondary colors
- Logo image

### Contact
- Email, phone, address
- Website URL

### Email
- Sender name/email
- Reply-to email
- **Email signature** (HTML)
- Show logo in emails
- Email footer text

### Payment
- Accepted payment methods
- Currency, tax rate, fees
- Stripe/PayPal/Razorpay keys
- Bank account details

### Business
- Operating hours (all days)
- Auto-approve bookings
- Deposit requirements
- Cancellation/refund policies
- Terms and conditions

### Metadata
- Timezone
- Default currency

---

## Email Signature Integration

Now that settings save properly, the email signature from settings will be used in all email templates!

**To update your signature:**

1. Go to **Tenant Settings** → **Email** tab
2. Fill in:
   - Sender Name: `John Smith`
   - Sender Email: `john@agency.com`
   - Email Signature: (HTML editor)
3. Click **Save**
4. **Signature appears in all outgoing emails!**

The email template service loads this from:
```javascript
tenant.settings.email.senderName → "John Smith"
tenant.settings.email.senderEmail → "john@agency.com"
tenant.settings.email.emailSignature → Custom HTML
```

---

## Status

✅ **FIXED - Ready to Test**

**Next:** Test in the UI and verify settings are saving correctly!
