# 🐛 EMAIL ACCOUNTS NOT SHOWING - DEBUGGING GUIDE

## Issue
You can add an email account and it says "saved successfully", but the account doesn't appear in the UI.

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console
1. Open the email accounts page: `http://localhost:5174/settings/email-accounts`
2. Open browser console (F12)
3. Look for these console logs:
   ```
   Email Accounts Data: { success: true, count: X, data: [...] }
   Accounts Array: [...]
   ```

**What to check:**
- ✅ If you see data: The backend is working, frontend is receiving data
- ❌ If you see error: There's an API/auth issue
- ❌ If you see nothing: The query might not be running

### Step 2: Check Network Tab
1. Open Network tab in browser console (F12 → Network)
2. Refresh the page
3. Look for request to `/api/v1/email-accounts`

**What to check:**
- ✅ Status 200: API working correctly
- ❌ Status 401: Authentication issue (not logged in or token expired)
- ❌ Status 403: Permission denied (wrong role)
- ❌ Status 404: Route not found (backend issue)
- ❌ Status 500: Server error (check backend logs)

**Click on the request and check:**
- **Request Headers:** Should have `Authorization: Bearer <token>`
- **Response:** Should be `{ success: true, count: X, data: [...] }`

### Step 3: Verify You're Logged In
The email accounts page requires authentication with admin/super_admin/operator role.

**Check:**
```javascript
// In browser console:
localStorage.getItem('token')  // Should return a long token string
localStorage.getItem('user')   // Should return user data
```

**If no token:**
- You're not logged in
- Login at `http://localhost:5174/login`

**If token exists but getting 401:**
- Token might be expired
- Logout and login again

### Step 4: Check Your Role
```javascript
// In browser console:
JSON.parse(localStorage.getItem('user')).role
```

**Required roles:** admin, super_admin, or operator

**If you have a different role:**
- This page is not accessible to your role
- Ask super_admin to change your role

### Step 5: Check Backend Logs
Look at the terminal running `npm run dev` in the backend folder.

**After adding an account, you should see:**
```
POST /api/v1/email-accounts 201 - Response sent
```

**If you see errors:**
- Read the error message
- Common issues:
  - MongoDB not connected
  - Validation errors
  - Duplicate email

### Step 6: Check MongoDB Database
Connect to MongoDB and check if the account was actually saved:

```bash
# Using MongoDB Shell
mongosh
use travel-crm
db.emailaccounts.find().pretty()
```

**What to check:**
- ✅ If account exists: Backend is saving correctly, UI issue
- ❌ If account doesn't exist: Backend not saving, check backend logs

### Step 7: Check Tenant ID
All email accounts are tenant-specific. Verify tenant ID matches:

```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem('user'));
console.log('My Tenant ID:', user.tenantId);

// In MongoDB:
db.emailaccounts.find({ tenantId: ObjectId("YOUR_TENANT_ID") })
```

**If tenant IDs don't match:**
- You're logged in with a different tenant
- Accounts won't show up

---

## 🔧 Common Fixes

### Fix 1: Clear Cache and Refresh
```javascript
// In browser console:
localStorage.clear()
window.location.reload()
// Then login again
```

### Fix 2: Invalidate React Query Cache
```javascript
// Add this button temporarily in EmailAccounts.jsx:
<button onClick={() => {
  queryClient.clear();
  queryClient.invalidateQueries(['emailAccounts']);
}}>
  Clear Cache
</button>
```

### Fix 3: Force Refetch
```javascript
// Modify the useQuery in EmailAccounts.jsx:
const { data: accounts, isLoading, error, refetch } = useQuery({
  queryKey: ['emailAccounts'],
  queryFn: emailAccountsAPI.getAll,
  staleTime: 0,  // Add this
  cacheTime: 0,  // Add this
});

// Add refetch button:
<button onClick={() => refetch()}>Refresh</button>
```

### Fix 4: Check API Base URL
Verify the API base URL is correct:

```javascript
// In frontend/src/services/api.js
// Should be:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
```

### Fix 5: Restart Both Servers
```bash
# Stop both servers (Ctrl+C)

# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

---

## 🧪 Test with API Directly

### Option 1: Using Browser Console
```javascript
// Get your token
const token = localStorage.getItem('token');

// Fetch email accounts
fetch('http://localhost:5000/api/v1/email-accounts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('API Response:', data));
```

### Option 2: Using cURL
```bash
# Replace YOUR_TOKEN with your actual token
curl -X GET http://localhost:5000/api/v1/email-accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Option 3: Using Test Script
```bash
cd backend
node test-email-accounts.js
```

---

## 📋 Expected Response

### Successful Response (No Accounts)
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

### Successful Response (With Accounts)
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "673071234567890abcdef123",
      "accountName": "Support Gmail",
      "email": "app@travelmanagerpro.com",
      "provider": "gmail",
      "purpose": "support",
      "isPrimary": false,
      "isActive": true,
      "imap": {
        "enabled": true,
        "host": "travelmanagerpro.com",
        "port": 587,
        "secure": false,
        "username": "app@travelmanagerpro.com",
        "lastTestStatus": "not_tested"
      },
      "smtp": {
        "enabled": true,
        "host": "travelmanagerpro.com",
        "port": 587,
        "secure": false,
        "username": "app@travelmanagerpro.com",
        "lastTestStatus": "not_tested"
      },
      "stats": {
        "emailsReceived": 0,
        "emailsSent": 0
      },
      "createdAt": "2025-11-10T10:30:00.000Z",
      "updatedAt": "2025-11-10T10:30:00.000Z"
    }
  ]
}
```

### Error Response (Not Authenticated)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Error Response (Wrong Role)
```json
{
  "success": false,
  "message": "User role 'sales' is not authorized to access this route"
}
```

---

## 🎯 Quick Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] You are logged in (check `localStorage.getItem('token')`)
- [ ] You have correct role: admin, super_admin, or operator
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 response for `/api/v1/email-accounts`
- [ ] Response contains `{ success: true, data: [...] }`
- [ ] MongoDB is running and connected
- [ ] Tenant ID matches between user and saved accounts

---

## 🔍 Advanced Debugging

### Enable Detailed Logging

**Backend (emailAccountController.js):**
```javascript
// Add at start of getEmailAccounts function:
console.log('📧 Fetching email accounts for tenant:', req.user.tenantId);
console.log('👤 User:', req.user.email, '| Role:', req.user.role);

// After fetching:
console.log('📊 Found accounts:', emailAccounts.length);
console.log('📦 Accounts:', JSON.stringify(emailAccounts, null, 2));
```

**Frontend (EmailAccounts.jsx):**
```javascript
// Already added - check browser console for:
console.log('Email Accounts Data:', accounts);
console.log('Accounts Array:', accounts?.data);
```

---

## 💡 Most Likely Issues

### 1. Not Logged In or Token Expired (90% of cases)
**Solution:** Logout and login again

### 2. Wrong Role (5% of cases)
**Solution:** Change your role to admin/super_admin/operator

### 3. Tenant Mismatch (3% of cases)
**Solution:** Check MongoDB - accounts saved under different tenant

### 4. Backend Not Running (2% of cases)
**Solution:** Start backend with `npm run dev`

---

## 📞 Still Not Working?

If none of the above helps, provide these details:

1. **Browser Console Output:**
   - Screenshot or copy all console logs
   - Any errors in red

2. **Network Tab:**
   - Screenshot of `/api/v1/email-accounts` request
   - Status code
   - Response body

3. **Backend Logs:**
   - Copy terminal output from backend
   - Any errors

4. **MongoDB Data:**
   - Result of: `db.emailaccounts.find().count()`
   - Result of: `db.emailaccounts.findOne()`

5. **User Info:**
   - Result of: `JSON.parse(localStorage.getItem('user'))`

---

*Last Updated: November 10, 2025*
