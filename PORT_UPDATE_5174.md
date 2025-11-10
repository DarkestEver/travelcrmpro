# ✅ Frontend Port Updated to 5174

**Date:** November 9, 2025  
**Change:** Default frontend port changed from 5173 to 5174

---

## 🔧 Changes Made

### 1. Vite Configuration
**File:** `frontend/vite.config.js`

```javascript
server: {
  port: 5174,  // ← Changed from 5173
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

### 2. Documentation Updates

Updated all references from port 5173 → 5174 in:
- ✅ `docs/QUICK_LOGIN_REFERENCE.md`
- ✅ `RESTART_FRONTEND.md`

---

## 🌐 New URLs

### Main Portal Login
```
http://localhost:5174/login
```

**Roles:** Super Admin, Operator, Agent, Supplier

### Customer Portal Login
```
http://localhost:5174/customer/login
```

**Role:** Customer

---

## 🚀 How to Use

### 1. Restart Frontend Server

**Stop any running servers:**
```powershell
# Press Ctrl+C in the terminal running npm run dev
# OR
taskkill /F /IM node.exe
```

**Start fresh:**
```powershell
cd c:\Users\dell\Desktop\Travel-crm\frontend
npm run dev
```

**Expected output:**
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

### 2. Clear Browser Cache

**In browser console (F12):**
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = 'http://localhost:5174/login';
```

### 3. Test Supplier Login

1. Navigate to: **http://localhost:5174/login**
2. Enter credentials:
   ```
   Email: supplier@travelcrm.com
   Password: Supplier@123
   ```
3. Click **Login** button
4. Should redirect to: **http://localhost:5174/supplier/dashboard**

---

## 📋 Complete Test Checklist

### Before Testing
- [ ] Only ONE `npm run dev` terminal running
- [ ] Terminal shows "Local: http://localhost:5174/"
- [ ] Browser cache cleared (localStorage + sessionStorage)
- [ ] Using correct URL: http://localhost:5174/login

### During Login Test
- [ ] Login form appears without errors
- [ ] TenantBrandingContext 401 error in console (normal, can ignore)
- [ ] No other console errors
- [ ] Login button clickable

### After Login
- [ ] Redirects to `/supplier/dashboard` (NOT back to /login)
- [ ] No infinite redirect loop
- [ ] Dashboard loads with statistics
- [ ] Can navigate to other supplier pages (Products, Orders, etc.)
- [ ] Logout works and returns to login page

---

## 🔍 Troubleshooting

### Issue: Still redirects to /login

**Check localStorage has token:**
```javascript
console.log('Token:', localStorage.getItem('auth-token'));
console.log('Auth State:', localStorage.getItem('auth-storage'));
```

**Should see:**
- `auth-token`: JWT string starting with "eyJ..."
- `auth-storage`: JSON with `state.user.role = "supplier"`

### Issue: Port conflict (EADDRINUSE)

**Someone is using port 5174:**
```powershell
# Find what's using the port
netstat -ano | findstr :5174

# Kill the process (replace PID with actual number)
taskkill /F /PID <PID>
```

### Issue: Wrong port in browser

**Make sure you're NOT on:**
- ❌ http://localhost:5173/login (old port)
- ❌ http://localhost:5175/login (another instance)
- ❌ http://localhost:3000/login (backend port)

**Should be:**
- ✅ http://localhost:5174/login (correct port)

---

## 🎯 Quick Reference

### All Demo Credentials

| Role | Email | Password | Dashboard URL |
|------|-------|----------|---------------|
| Super Admin | admin@travelcrm.com | Admin@123 | http://localhost:5174/dashboard |
| Operator | operator@travelcrm.com | Operator@123 | http://localhost:5174/dashboard |
| Agent | agent@travelcrm.com | Agent@123 | http://localhost:5174/agent/dashboard |
| **Supplier** | **supplier@travelcrm.com** | **Supplier@123** | **http://localhost:5174/supplier/dashboard** |
| Customer | customer@email.com | Customer@123 | http://localhost:5174/customer/dashboard |

---

## 📝 Notes

### Why Port 5174?

You had multiple Vite dev servers running:
1. First instance grabbed port 5173
2. Second instance auto-incremented to 5174
3. You were testing on 5174, so we made it the default

### What About Port 5173?

Port 5173 is Vite's default. We changed it to 5174 to match your setup. If you prefer 5173:
1. Kill all Node.js processes
2. Change `vite.config.js` back to `port: 5173`
3. Restart `npm run dev`
4. Update all documentation URLs

### Backend Port

**Backend remains on port 5000** - no changes needed:
```
http://localhost:5000/api/v1/...
```

---

## 🔗 Related Documentation

- **Login Guide:** `/docs/LOGIN_ENDPOINTS_AND_CREDENTIALS.md`
- **Quick Reference:** `/docs/QUICK_LOGIN_REFERENCE.md`
- **Restart Instructions:** `/RESTART_FRONTEND.md`
- **Supplier Fix:** `/docs/SUPPLIER_LOGIN_INFINITE_LOOP_FIX.md`
- **Troubleshooting:** `/SUPPLIER_LOGIN_TROUBLESHOOTING.md`

---

## ✅ Verification

After making these changes, run this test:

```javascript
// In browser console at http://localhost:5174/login
console.log('🧪 Running verification test...');

// 1. Check we're on correct port
console.log('Port:', window.location.port === '5174' ? '✅ Correct (5174)' : '❌ Wrong port!');

// 2. Check storage is clear
console.log('Storage:', !localStorage.getItem('auth-token') ? '✅ Clean' : '⚠️ Has old data');

// 3. Check login form exists
console.log('Login form:', document.querySelector('form') ? '✅ Found' : '❌ Not found');

console.log('\n✅ If all checks pass, try logging in!');
```

---

**Status:** ✅ Port 5174 configured and documented  
**Next Step:** Restart frontend and test supplier login  
**Expected Outcome:** Supplier login redirects to dashboard without loop
