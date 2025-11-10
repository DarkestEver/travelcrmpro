# 🔧 Supplier Login Loop - Troubleshooting Steps

## Step 1: Clear Everything

**In Browser Console (F12 → Console tab):**

```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Check it's cleared
console.log('localStorage:', localStorage.length); // Should be 0
console.log('sessionStorage:', sessionStorage.length); // Should be 0

// Reload
window.location.href = '/login';
```

## Step 2: Test Backend Login API

**In Browser Console or Terminal:**

```javascript
// Test login API directly
fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'supplier@travelcrm.com',
    password: 'Supplier@123'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Login Response:', data);
  console.log('User Role:', data.data.user.role);
  console.log('Supplier ID:', data.data.user.supplierId);
})
.catch(err => console.error('❌ Login Failed:', err));
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "user": {
      "role": "supplier",
      "supplierId": "69108690d0ca5b05c5ff5374"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## Step 3: Monitor Redirects

**In Browser Console:**

```javascript
// Monitor navigation
let redirectCount = 0;
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
  redirectCount++;
  console.log(`🔄 Redirect #${redirectCount}: ${arguments[2]}`);
  return originalPushState.apply(history, arguments);
};

history.replaceState = function() {
  redirectCount++;
  console.log(`🔄 Redirect #${redirectCount}: ${arguments[2]}`);
  return originalReplaceState.apply(history, arguments);
};

// Now try logging in
console.log('✅ Monitoring active. Try logging in now.');
```

## Step 4: Check React Router

**In Browser Console after page load:**

```javascript
// Check if routes are properly loaded
console.log('Current Path:', window.location.pathname);

// Check auth state
const authState = JSON.parse(localStorage.getItem('auth-storage'));
console.log('Auth State:', authState);

if (authState && authState.state) {
  console.log('User Role:', authState.state.user?.role);
  console.log('Access Token exists:', !!authState.state.accessToken);
}
```

## Step 5: Network Tab Inspection

**In Browser DevTools:**

1. Open **Network** tab (F12 → Network)
2. Check "Preserve log"
3. Clear log
4. Try logging in
5. Look for:
   - ❌ `/login` POST - Should return 200
   - ❌ `/auth/me` GET - Should return 200  
   - ❌ `/suppliers/dashboard-stats` GET - Should return 200 or handled error
   - ❌ Any 401/403 errors that trigger re-login

## Step 6: React Query DevTools

**Check React Query state:**

```javascript
// In browser console
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.queries
```

Look for:
- `['currentUser']` query - should have data
- `['supplier-dashboard-stats']` query - check status

## Common Issues & Solutions

### Issue 1: "401 Unauthorized" on /auth/me

**Symptom:** Login succeeds but immediately redirects back to login

**Solution:**
```javascript
// Check if token is being sent
const token = JSON.parse(localStorage.getItem('auth-storage'))?.state?.accessToken;
console.log('Token exists:', !!token);

// Test /auth/me endpoint
fetch('http://localhost:5000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('✅ /auth/me Response:', data))
.catch(err => console.error('❌ /auth/me Failed:', err));
```

### Issue 2: Token not being saved

**Symptom:** Login succeeds but auth store is empty

**Check:**
```javascript
// After login, check store
const store = useAuthStore.getState();
console.log('Store:', store);
```

**Fix:** Verify `setAuth()` is being called in Login.jsx

### Issue 3: Supplier dashboard API fails

**Symptom:** Redirects to dashboard but then back to login

**Check:**
```javascript
// Test dashboard API
const token = JSON.parse(localStorage.getItem('auth-storage'))?.state?.accessToken;

fetch('http://localhost:5000/api/v1/suppliers/dashboard-stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('✅ Dashboard Stats:', data))
.catch(err => console.error('❌ Dashboard Failed:', err));
```

### Issue 4: React Query infinite loop

**Symptom:** Console shows repeated API calls

**Check:**
```javascript
// Count of API calls
performance.getEntriesByType('resource')
  .filter(e => e.name.includes('/suppliers/dashboard-stats'))
  .length;

// Should be 1-2, not 10+
```

**Fix:** Already applied in `frontend/src/pages/supplier/Dashboard.jsx`

## Full Debug Script

**Run this complete diagnostic:**

```javascript
console.clear();
console.log('🔍 === SUPPLIER LOGIN DIAGNOSTIC ===\n');

// 1. Check storage
console.log('1️⃣ Storage Check:');
const authData = localStorage.getItem('auth-storage');
console.log('  - Auth data exists:', !!authData);
if (authData) {
  const parsed = JSON.parse(authData);
  console.log('  - User role:', parsed?.state?.user?.role);
  console.log('  - Supplier ID:', parsed?.state?.user?.supplierId);
  console.log('  - Token exists:', !!parsed?.state?.accessToken);
}

// 2. Check current location
console.log('\n2️⃣ Location Check:');
console.log('  - Current path:', window.location.pathname);
console.log('  - Expected:', '/supplier/dashboard');
console.log('  - Match:', window.location.pathname === '/supplier/dashboard');

// 3. Check backend connectivity
console.log('\n3️⃣ Backend Check:');
fetch('http://localhost:5000/api/v1/health')
  .then(res => res.json())
  .then(data => console.log('  - Backend:', data))
  .catch(() => console.log('  - Backend: ❌ OFFLINE'));

// 4. Monitor next redirect
console.log('\n4️⃣ Monitoring redirects...');
let count = 0;
const original = history.pushState;
history.pushState = function() {
  count++;
  console.log(`  🔄 Redirect #${count}:`, arguments[2]);
  if (count > 5) {
    console.error('  ❌ LOOP DETECTED! Stopping...');
    history.pushState = original;
  }
  return original.apply(history, arguments);
};

console.log('\n✅ Diagnostic complete. Try logging in now.');
```

## Expected Flow (No Loop)

```
1. User enters credentials
2. POST /api/v1/auth/login → 200 OK
3. Store auth data in localStorage
4. Navigate to /supplier/dashboard (ONE TIME)
5. ProtectedRoute checks auth → PASS
6. SupplierLayout loads
7. GET /api/v1/auth/me → 200 OK
8. GET /api/v1/suppliers/dashboard-stats → 200 OK (or handled error)
9. Dashboard renders
10. DONE ✅
```

## Loop Pattern (What's Wrong)

```
1. User enters credentials
2. POST /api/v1/auth/login → 200 OK
3. Navigate to /supplier/dashboard
4. Something fails (401/403/error)
5. Redirect to /login
6. PublicRoute sees auth → redirect to /supplier/dashboard
7. Back to step 4
8. INFINITE LOOP ❌
```

## Quick Fixes to Try

### Fix 1: Hard Refresh After Clear

```bash
1. Open browser
2. F12 → Console
3. localStorage.clear()
4. Close DevTools
5. Ctrl + Shift + R (hard refresh)
6. Reopen DevTools
7. Try login
```

### Fix 2: Incognito Mode

```bash
1. Open incognito/private window
2. Go to http://localhost:5173/login
3. Login as supplier
4. If works → cache issue
5. If fails → code issue
```

### Fix 3: Check Backend Logs

```bash
cd backend
# Watch logs while logging in
npm run dev

# Look for:
# - POST /api/v1/auth/login → 200
# - GET /api/v1/auth/me → 200 or 401?
# - GET /api/v1/suppliers/dashboard-stats → 200 or 404?
```

## Contact Points

If still failing, check these files:

1. `frontend/src/pages/auth/Login.jsx` - Line 38-49 (redirect logic)
2. `frontend/src/App.jsx` - Line 106-125 (PublicRoute)
3. `frontend/src/App.jsx` - Line 350-380 (Supplier routes)
4. `frontend/src/layouts/SupplierLayout.jsx` - Line 26-37 (user query)
5. `backend/src/controllers/supplierPortalController.js` - Line 11-36 (dashboard stats)

## Success Criteria

✅ Login redirects to `/supplier/dashboard` ONE TIME
✅ No console errors
✅ Dashboard stats load (even if zeros)
✅ Can navigate to other supplier pages
✅ Network tab shows max 2-3 requests per API
✅ No 401/403 errors
