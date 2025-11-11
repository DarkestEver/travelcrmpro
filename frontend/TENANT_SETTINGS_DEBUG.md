# Frontend Tenant Settings Debug Guide

## Added Comprehensive Logging

I've added detailed console logging throughout the TenantSettings.jsx component to help identify mapping issues:

### 1. Data Loading (useEffect)
When the page loads tenant data, you'll see:
```
🔍 TenantSettings: Loaded tenant data:
  - name: "..."
  - hasSettings: true/false
  - settingsKeys: [...]
  - branding: {...}
  - email: {...}
  - contact: {...}

🔍 TenantSettings: Setting form data:
  - name: "..."
  - settingsKeys: [...]
  - branding: {...}
  - email: {...}
```

### 2. Form Submission (handleSubmit)
When you click Save, you'll see:
```
🚀 TenantSettings: Submitting data:
  - name: "..."
  - settingsKeys: [...]
  - branding: {...}
  - email: {...}
  - contact: {...}
```

### 3. API Request (mutationFn)
When the PATCH request is sent:
```
📤 TenantSettings: Sending PATCH request to /tenants/settings
Data: {full JSON payload}

✅ TenantSettings: Received response: {...}
```

### 4. Success/Error
```
✅ TenantSettings: Update successful
OR
❌ TenantSettings: Settings update error: {...}
Error response: {...}
```

## How to Test

1. **Open the frontend** in your browser
2. **Open DevTools** (F12) and go to Console tab
3. **Navigate to Tenant Settings** page
4. **Watch the console** for the "🔍 Loaded tenant data" logs
5. **Make a change** (e.g., change company name)
6. **Click Save** and watch for "🚀 Submitting data" logs
7. **Check the response** logs

## What to Look For

### Problem 1: Data Not Loading
If you see `hasSettings: false` or empty settingsKeys, the backend isn't returning settings.

### Problem 2: Wrong Data Structure
Check if the structure in "Loaded tenant data" matches what you expect:
- `branding.companyName` should have value
- `email.senderName` should have value
- etc.

### Problem 3: Data Lost on Save
Compare the "Loaded tenant data" with "Submitting data":
- Are the values the same?
- Are any fields becoming empty or undefined?

### Problem 4: Data Lost After Refresh
After saving successfully:
1. Note the values in "Submitting data"
2. Refresh the page
3. Check "Loaded tenant data"
4. Compare - are the values the same?

## Common Issues

### Issue: Empty strings becoming defaults
**Symptom**: You save an empty string but it shows as default value after refresh
**Cause**: The `||` operator treats empty string as falsy
**Example**: `email: tenantData.settings?.email?.senderName || ''`
**Problem**: If senderName is saved as "", it will show as "" correctly

### Issue: Data structure mismatch
**Symptom**: Data saves but doesn't show after refresh
**Cause**: Backend returns different structure than frontend expects
**Solution**: Compare the structure in logs

### Issue: Nested undefined values
**Symptom**: Mongoose casting errors
**Cause**: Frontend sends objects with undefined nested properties
**Solution**: Already fixed in backend with deep merge

## Next Steps

After you test and provide the console logs, I can:
1. Identify exactly which fields are not mapping
2. Fix the data transformation logic
3. Ensure data persists correctly

## Files Modified
- `frontend/src/pages/TenantSettings.jsx` - Added comprehensive logging throughout
