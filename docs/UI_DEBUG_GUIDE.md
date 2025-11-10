# UI Not Showing Email Accounts - Debugging Guide

## Issue
API returns 2 accounts correctly, but UI shows "No Email Accounts"

## Quick Debug Steps

### 1. **Open Debug HTML Tool**
Open this file in your browser: `debug-email-accounts.html`
- It will show you exactly what the API is returning
- No need to login to React app
- Click "Fetch Accounts" button

### 2. **Check Browser Console**
Open http://localhost:5174/settings/email-accounts

Press F12, go to Console tab, you should see:
```
Email Accounts Data: {success: true, count: 2, data: Array(2)}
Accounts Array: Array(2)
```

If you see this, the data is loading! The issue is in the rendering.

### 3. **Check React DevTools**
Install React DevTools extension, then:
1. Navigate to email accounts page
2. Open React DevTools
3. Find `EmailAccounts` component
4. Check the `accounts` prop value

### 4. **Force Refresh in UI**
1. Go to http://localhost:5174/settings/email-accounts
2. Look for the gray debug panel at the top
3. Click "🔄 Force Refresh" button
4. Check if it shows: "Total accounts: 2 | Data length: 2"

### 5. **Hard Refresh Browser**
- Press `Ctrl + Shift + R` (Windows)
- Or `Ctrl + F5`
- This clears cache and reloads everything

### 6. **Check for JavaScript Errors**
In browser console (F12), look for red errors. Common ones:
- `Cannot read property 'map' of undefined`
- `accounts is undefined`
- CORS errors

## Manual Test in Browser Console

Open http://localhost:5174/settings/email-accounts
Open Console (F12), paste this:

```javascript
// Test 1: Check localStorage
console.log('Token:', localStorage.getItem('token') ? 'Found ✅' : 'Missing ❌');
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Test 2: Fetch directly
fetch('http://localhost:5000/api/v1/email-accounts', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ API Response:', data);
  console.log(`📊 Found ${data.count} accounts`);
  console.log('📧 Accounts:', data.data);
})
.catch(err => console.error('❌ Error:', err));
```

## Possible Causes

### 1. React Query Not Refetching
**Symptom:** Debug shows "Total accounts: 0"
**Fix:** Click "Force Refresh" button

### 2. Rendering Logic Issue
**Symptom:** Console shows data but UI doesn't render
**Check:** Line in EmailAccounts.jsx that does the mapping:
```jsx
{accounts?.data?.length > 0 ? (
  accounts.data.map((account) => (
```

### 3. CSS/Display Issue
**Symptom:** Accounts render but are invisible
**Fix:** Inspect element, check for `display: none` or `opacity: 0`

### 4. Component Not Mounted
**Symptom:** Page loads but component doesn't run
**Check:** App.jsx routing

### 5. Token Expired
**Symptom:** 401 errors in console
**Fix:** Logout and login again

## Testing the Fix

After applying any fix, verify:

1. **Debug Panel Shows:**
   ```
   Debug: Total accounts: 2 | Data length: 2
   ```

2. **Console Shows:**
   ```
   Email Accounts Data: {success: true, count: 2, ...}
   Accounts Array: (2) [{...}, {...}]
   ```

3. **UI Shows:**
   - 2 email account cards
   - app@travelmanagerpro.com (Primary ⭐)
   - pp@travelmanagerpro.com

## If Still Not Working

### Nuclear Option - Clear Everything:
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

Then:
1. Login again at http://localhost:5174
2. Navigate to /settings/email-accounts
3. Click Force Refresh

### Check Component Mount:
Add this at the top of EmailAccounts component:
```jsx
console.log('🎯 EmailAccounts component mounted!');
console.log('🎯 Accounts data:', accounts);
```

## Debug Output Example

**Working State:**
```
🎯 EmailAccounts component mounted!
Email Accounts Data: {success: true, count: 2, data: Array(2)}
Accounts Array: Array(2)
  0: {_id: "6910eef8ad00888b4c012e75", accountName: "app@travelmanagerpro.com", ...}
  1: {_id: "6910e940d4923a26b1ada9c4", accountName: "pp@travelmanagerpro.com", ...}
Debug: Total accounts: 2 | Data length: 2
```

**Broken State:**
```
🎯 EmailAccounts component mounted!
Email Accounts Data: undefined
Accounts Array: undefined
Debug: Total accounts: 0 | Data length: 0
```

## Contact Points

If none of this works, provide:
1. Screenshot of browser console
2. Screenshot of Network tab (filter: email-accounts)
3. Screenshot of React DevTools component state
4. Output from debug-email-accounts.html

## Quick Fix Script

Run this in backend terminal to ensure everything is working:
```bash
cd backend
npm run dev
```

Run this in frontend terminal:
```bash
cd frontend
npm run dev
```

Then visit: http://localhost:5174/settings/email-accounts

---

**Most Likely Issue:** React Query cache is stale. Solution: Click "Force Refresh" button!
