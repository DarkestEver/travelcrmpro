# 🚨 URGENT: Restart Frontend to Fix Infinite Loop

## Problem Identified

You have **TWO frontend servers running**:
- Port 5173 (correct Travel CRM app)
- Port 5174 (wrong - possibly leftover process or different project)

The infinite loop happens because:
1. You're testing on port 5174 (wrong app)
2. Port 5174 doesn't have your latest fixes
3. Port 5174 is a different application entirely (customer portal redirect to `/cx` suggests this)

---

## Solution Steps

### Step 1: Stop ALL Frontend Processes

**In PowerShell:**
```powershell
# Find all Node.js processes running Vite
Get-Process node | Where-Object {$_.Path -like "*node.exe*"} | Stop-Process -Force

# OR use taskkill
taskkill /F /IM node.exe
```

### Step 2: Clear Port 5173 and 5174

```powershell
# Check what's using these ports
netstat -ano | findstr :5173
netstat -ano | findstr :5174

# Kill processes on these ports (use PID from above command)
# Example: taskkill /F /PID 12345
```

### Step 3: Navigate to Frontend Directory

```powershell
cd c:\Users\dell\Desktop\Travel-crm\frontend
```

### Step 4: Start Fresh Frontend Server

```powershell
npm run dev
```

**VERIFY**: Console should say:
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

### Step 5: Clear Browser Completely

**In your browser (press F12 to open DevTools):**
```javascript
// Run this in Console tab:
localStorage.clear();
sessionStorage.clear();
indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));
console.log('✅ All storage cleared!');
```

Then **close browser completely** and reopen.

### Step 6: Test Supplier Login

1. Go to: **http://localhost:5174/login** (confirmed port!)
2. Use credentials:
   ```
   Email: supplier@travelcrm.com
   Password: Supplier@123
   ```
3. Click Login

**Expected Result**: Should redirect to `/supplier/dashboard` and stay there.

---

## Quick Command Sequence

**Copy-paste this entire block into PowerShell:**

```powershell
# Stop all node processes
taskkill /F /IM node.exe

# Wait 2 seconds
Start-Sleep -Seconds 2

# Go to frontend
cd c:\Users\dell\Desktop\Travel-crm\frontend

# Start dev server
npm run dev
```

Then in browser console (F12):
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = 'http://localhost:5174/login';
```

---

## Verification Checklist

After restart, verify:

- [ ] Only ONE terminal running `npm run dev`
- [ ] Terminal shows port **5174**
- [ ] Browser URL is **http://localhost:5174/login**
- [ ] No console errors about port conflicts
- [ ] Login page loads without redirect loops
- [ ] TenantBrandingContext 401 error is expected (ignore it)

---

## If It Still Loops

Check these in browser console (F12):

1. **After login, check token:**
   ```javascript
   console.log('Token:', localStorage.getItem('auth-token'));
   ```

2. **Check user object:**
   ```javascript
   const authData = JSON.parse(localStorage.getItem('auth-storage'));
   console.log('User:', authData?.state?.user);
   console.log('Role:', authData?.state?.user?.role);
   ```

3. **Should see:**
   ```json
   {
     "role": "supplier",
     "email": "supplier@travelcrm.com",
     "supplierId": "69108690d0ca5b05c5ff5374"
   }
   ```

If role is NOT "supplier", the login API is returning wrong user data.

---

## Common Mistakes to Avoid

❌ **Don't** test on wrong port  
✅ **Do** test on port 5174

❌ **Don't** run multiple `npm run dev` commands  
✅ **Do** run only ONE instance

❌ **Don't** use cached browser  
✅ **Do** clear all storage before testing

❌ **Don't** use customer credentials to test supplier login  
✅ **Do** use `supplier@travelcrm.com` / `Supplier@123`

---

## Background: Why Two Ports?

When you run `npm run dev` multiple times, Vite automatically increments the port:
- First run: 5173
- Second run: 5174 (because 5173 is busy)
- Third run: 5175, etc.

**We've now configured the default port to 5174** in `vite.config.js`.

This happened because:
1. You had multiple terminals running
2. Port 5173 was taken, so Vite used 5174
3. You got used to 5174, so we made it the default

**Always check:** Only ONE `npm run dev` should be running at a time!

---

## Need Help?

If after following these steps it still loops, run this diagnostic:

```javascript
// In browser console on login page:
let redirectCount = 0;
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log(`🔄 Redirect #${++redirectCount}:`, args[2]);
  console.trace();
  return originalPushState.apply(history, args);
};

history.replaceState = function(...args) {
  console.log(`🔄 Redirect #${++redirectCount}:`, args[2]);
  console.trace();
  return originalReplaceState.apply(history, args);
};

console.log('✅ Redirect tracker installed. Now try logging in...');
```

This will show EXACTLY what's causing the redirects.

---

**Created:** November 9, 2025  
**Issue:** Infinite login redirect loop  
**Root Cause:** Multiple frontend servers on different ports + wrong port testing  
