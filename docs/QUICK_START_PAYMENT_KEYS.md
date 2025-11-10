# 🚀 Quick Start - Test Payment Gateway API Keys

## ⚡ Immediate Testing Steps

### 1. Start Frontend (if not running)
```powershell
cd C:\Users\dell\Desktop\Travel-crm\frontend
npm run dev
```

### 2. Open in Browser
```
http://localhost:5173
```

### 3. Login as Tenant Owner
Use your existing tenant owner credentials

### 4. Navigate to Settings
Click **"Tenant Settings"** in the sidebar (gear icon)

### 5. Go to Payment Tab
Click the **"Payment Settings"** tab (💳 icon)

---

## 🧪 Test Scenarios

### Scenario 1: Configure Stripe (Recommended First Test)

#### Step 1: Enable Stripe
1. Scroll to "Payment Gateway Integration"
2. Check the **"Stripe"** checkbox
3. Collapsible section will appear

#### Step 2: Enter Test Keys
Get test keys from: https://dashboard.stripe.com/test/apikeys

**Note:** Use your own test keys from your Stripe dashboard. Example format:
```
Public Key: pk_test_51...
Secret Key: sk_test_51...
```

#### Step 3: Verify Security Features
- [ ] Secret key input is type="password" (shows dots)
- [ ] Click eye icon → reveals secret key
- [ ] Click eye icon again → hides secret key
- [ ] See red warning: "⚠️ Keep this secret!"

#### Step 4: Save
1. Click **"Save Changes"** button (top right)
2. Wait for green toast: "Tenant settings updated successfully"
3. Check browser console (F12) - no errors

#### Step 5: Verify Encryption
Refresh the page:
- [ ] Stripe checkbox still checked ✓
- [ ] Public key shows full value ✓
- [ ] Secret key shows masked value (e.g., `***xyz`) ✓

---

### Scenario 2: Configure PayPal

1. Enable PayPal checkbox
2. Enter test credentials:
   ```
   Client ID: AbCdEf123456-GhIjKlMnOpQrStUvWxYz
   Client Secret: ENcryptedSecretToken123456789
   ```
3. Test show/hide toggle
4. Save and verify

---

### Scenario 3: Configure Razorpay

1. Enable Razorpay checkbox
2. Enter test credentials:
   ```
   Key ID: rzp_test_1234567890abcd
   Key Secret: sampleSecretKeyToken123456
   ```
3. Test show/hide toggle
4. Save and verify

---

## ✅ What You Should See

### Before Saving
- Input fields visible and editable
- Eye icons toggle visibility
- Secret keys hidden by default
- Helpful links to provider dashboards

### After Saving
- Green success toast appears
- Page doesn't reload automatically
- All checkboxes retain state
- Public keys show full value
- Secret keys show `***last4characters`

### After Refresh
- Settings persist
- Gateways still enabled
- Public keys intact
- Secret keys masked (this is correct!)

---

## 🔍 How to Verify Encryption

### Check Database (MongoDB Compass)
```javascript
// Find your tenant
db.tenants.findOne({ _id: ObjectId("YOUR_TENANT_ID") }, {
  "settings.payment.stripeSecretKey": 1
})

// Should see encrypted format like:
{
  "settings": {
    "payment": {
      "stripeSecretKey": "a1b2c3d4e5f6g7h8:1234567890abcdef..."
    }
  }
}
```

### Check API Response (Browser DevTools)
1. Open DevTools (F12) → Network tab
2. Save settings
3. Find PATCH request to `/tenants/:id`
4. Look at Response → should see masked keys:
   ```json
   {
     "stripeSecretKey": "***f..."
   }
   ```

---

## 🐛 Common Issues & Fixes

### Issue: Keys Don't Save
**Fix**: 
1. Check browser console for errors
2. Verify backend is running (port 5000)
3. Check MongoDB connection
4. Verify ENCRYPTION_KEY in backend/.env

### Issue: Keys Show as "***..."
**Fix**: This is CORRECT! Keys are encrypted and masked for security.

### Issue: Eye Icon Doesn't Work
**Fix**: 
1. Ensure you clicked eye icon (not the input)
2. Check React state updates
3. Refresh page and try again

### Issue: Changes Don't Persist
**Fix**:
1. Verify save was successful (green toast)
2. Check MongoDB has updated data
3. Clear browser cache
4. Hard refresh (Ctrl+F5)

---

## 🎯 Expected Behavior

### ✅ Correct Behavior
- Secret keys hidden by default (dots/asterisks)
- Eye icon toggles visibility
- After save, keys are masked in API response
- After refresh, masked keys show `***xyz` format
- Public keys always show full value
- Encryption happens server-side automatically

### ❌ Incorrect Behavior
- Secret keys visible in plain text in API response
- Keys not persisting after refresh
- Encryption errors in backend logs
- Keys showing in MongoDB as plain text
- Save button not responding

---

## 📞 Quick Support Checklist

Before asking for help, check:
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Logged in as tenant owner
- [ ] ENCRYPTION_KEY present in backend/.env
- [ ] MongoDB connected and accessible
- [ ] Browser console shows no errors
- [ ] Network tab shows successful PATCH request
- [ ] Response has 200 status code

---

## 🎓 Next Steps After Testing

1. **If Everything Works**:
   - Test with real payment gateway credentials
   - Test actual payment processing
   - Configure other payment methods
   - Set up bank account details
   - Configure fees and taxes

2. **If Issues Found**:
   - Check browser console errors
   - Check backend logs
   - Review `PAYMENT_GATEWAY_KEYS_IMPLEMENTATION.md`
   - Check encryption key in .env
   - Verify MongoDB data

3. **Ready for Production**:
   - Generate new encryption key
   - Use live API keys (not test keys)
   - Set up proper key rotation
   - Configure backup procedures
   - Review security checklist

---

## 📚 Documentation Reference

- **Full Testing Guide**: `PAYMENT_GATEWAY_KEYS_IMPLEMENTATION.md`
- **Settings Usage**: `SETTINGS_USAGE_GUIDE.md`
- **Phase 1 Summary**: `PHASE1_COMPLETE_SUMMARY.md`
- **Roadmap**: `TENANT_CUSTOMIZATION_ROADMAP.md`

---

## ⏱️ Time Required

- **Initial Test**: 5-10 minutes
- **All 3 Gateways**: 15-20 minutes
- **Full Verification**: 30 minutes
- **Production Setup**: 1-2 hours

---

## 🎉 Success Criteria

You're ready to move forward when:
- ✅ All 3 gateways can be enabled
- ✅ API keys save successfully
- ✅ Keys persist after refresh
- ✅ Secret keys are encrypted in database
- ✅ API responses mask secret keys
- ✅ Show/hide toggles work
- ✅ No console errors
- ✅ Green success toast appears

---

**Ready? Start your frontend and test now!** 🚀

```powershell
cd frontend
npm run dev
```

Then navigate to: **http://localhost:5173** → **Login** → **Settings** → **Payment Settings** tab

Good luck! 🎯
