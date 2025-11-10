# 🐛 Frontend Issues - Debugging Guide

**Date:** November 10, 2025  
**Issues Reported:**
1. ❌ No emails showing in Processing History page
2. ❌ Settings/AI and Emails/History not linked in sidebar
3. ❌ Enable AI toggle not working

---

## ✅ **FIXES APPLIED**

### **1. Sidebar Navigation - FIXED** ✅

**Files Updated:**
- `frontend/src/components/Sidebar.jsx`

**Changes Made:**
```jsx
// Added new icons
import { FiCpu, FiClock } from 'react-icons/fi'

// Added state for settings submenu
const [settingsOpen, setSettingsOpen] = useState(false)

// Updated Emails submenu to include Processing History
{
  name: 'Emails',
  submenu: [
    { name: 'Dashboard', path: '/emails', icon: FiInbox },
    { name: 'Processing History', path: '/emails/history', icon: FiClock }, // NEW
    { name: 'Review Queue', path: '/emails/review-queue', icon: FiFileText },
    { name: 'Analytics', path: '/emails/analytics', icon: FiTrendingUp },
  ],
}

// Changed "Tenant Settings" to "Settings" with submenu
{
  name: 'Settings',
  submenu: [
    { name: 'General', path: '/settings', icon: FiSettings },
    { name: 'Email Accounts', path: '/settings/email-accounts', icon: FiMail },
    { name: 'AI Configuration', path: '/settings/ai', icon: FiCpu }, // NEW
  ],
}
```

**Result:** 
- ✅ Processing History link now appears under Emails menu
- ✅ AI Configuration link now appears under Settings menu
- ✅ Both menus are collapsible/expandable

---

### **2. Toggle Component - CHECKED** ⚠️

**File:** `frontend/src/pages/settings/AISettings.jsx`

**Current Code:**
```jsx
<input
  type="checkbox"
  checked={settings.enableAI}
  onChange={(e) => setSettings({ ...settings, enableAI: e.target.checked })}
  className="sr-only peer"
/>
```

**Status:** Code looks correct. Toggle should work.

**Possible Issues:**
1. **Browser Console Error** - Check for JavaScript errors
2. **CSS Issue** - Tailwind classes might not be loading
3. **React State** - State not updating properly

**How to Debug:**
```javascript
// Add console.log to see if onChange is firing
onChange={(e) => {
  console.log('Toggle clicked:', e.target.checked);
  setSettings({ ...settings, enableAI: e.target.checked })
}}
```

---

### **3. No Emails Showing - NEEDS INVESTIGATION** ❌

**Possible Causes:**

#### **A. Backend API Not Working**
```bash
# Test backend API directly
curl http://localhost:5000/api/v1/emails

# Expected error: 401 Unauthorized (API needs auth)
# If you get connection error, backend is not running
```

#### **B. Authentication Issue**
The API requires authentication. Check:
```javascript
// In browser console at /emails/history
localStorage.getItem('token')  // Should return a token
```

#### **C. No Emails in Database**
```bash
# Connect to MongoDB and check
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const count = await EmailLog.countDocuments();
  console.log('Total emails:', count);
  
  const emails = await EmailLog.find().limit(5).select('subject from receivedAt');
  console.log('Sample emails:', emails);
  
  process.exit(0);
});
"
```

#### **D. Frontend API Call Failing**
Open browser console (F12) and check:
1. **Network Tab** - Look for failed API calls to `/api/v1/emails`
2. **Console Tab** - Look for JavaScript errors
3. **Response Data** - Check what the API is returning

---

## 🔍 **DEBUGGING STEPS**

### **Step 1: Check Backend is Running**
```bash
# In backend terminal, you should see:
Server running on port 5000
Connected to MongoDB
Email polling started successfully
```

### **Step 2: Check Frontend is Running**
```bash
# In frontend terminal, you should see:
VITE v4.x.x  ready in xxx ms
Local:   http://localhost:5174/
```

### **Step 3: Open Browser Console**
1. Go to: `http://localhost:5174/emails/history`
2. Press `F12` to open DevTools
3. Click **Console** tab
4. Look for errors (red text)
5. Click **Network** tab
6. Look for failed requests (red status codes)

### **Step 4: Check Authentication**
```javascript
// In browser console
localStorage.getItem('token')

// Should show something like:
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// If null, you need to login again
```

### **Step 5: Check API Response**
```javascript
// In browser console, run this:
fetch('http://localhost:5000/api/v1/emails', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err))
```

Expected response:
```json
{
  "success": true,
  "data": {
    "emails": [],  // Array of emails
    "total": 0,
    "currentPage": 1,
    "pages": 0
  }
}
```

---

## 🔧 **QUICK FIXES**

### **Fix 1: If Backend Not Running**
```bash
cd backend
npm run dev
```

### **Fix 2: If Authentication Failed**
```bash
# Login again in the frontend
# Go to http://localhost:5174/login
# Use your credentials
```

### **Fix 3: If No Emails in Database**
```bash
# Send a test email to trigger IMAP polling
# Wait 2 minutes for cron job to run
# Or manually trigger polling:

cd backend
node test-email-polling.js
```

### **Fix 4: If Toggle Not Working**
1. **Check browser console** for errors
2. **Try clicking the toggle area** (the blue/gray bar, not just the circle)
3. **Refresh the page** (Ctrl+F5)
4. **Clear browser cache** and reload

### **Fix 5: If API Returns Empty Array**
This means:
- ✅ Backend is working
- ✅ Authentication is working
- ❌ No emails in database yet

**Solution:** Send a test email or run polling script

---

## 📊 **EXPECTED RESULTS AFTER FIXES**

### **Sidebar Should Look Like:**
```
📧 Emails ▼
   📥 Dashboard
   🕐 Processing History    ← NEW
   📄 Review Queue
   📈 Analytics

⚙️ Settings ▼
   ⚙️ General
   📧 Email Accounts
   🤖 AI Configuration       ← NEW
```

### **Processing History Page Should Show:**
```
📊 Email Processing History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Total: X] [Completed: Y] [Pending: Z] [Failed: W]

Filters:
[All Status ▼] [All Categories ▼] [All Sources ▼]

Date/Time | From | Subject | Source | Category | Status | ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Email rows here)
```

### **AI Settings Page Should Show:**
```
🤖 AI Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Enable AI Email Processing [🔵 TOGGLE]  ← Should toggle blue/gray

OpenAI API Key *
[sk-...]

Model
[GPT-4 Turbo ▼]

(Rest of form)
```

---

## 📝 **COMMON ERRORS & SOLUTIONS**

### **Error: "Failed to fetch"**
**Cause:** Backend not running or CORS issue  
**Solution:** 
```bash
cd backend
npm run dev
```

### **Error: "401 Unauthorized"**
**Cause:** Not logged in or token expired  
**Solution:** Login again at `/login`

### **Error: "Cannot read property 'map' of undefined"**
**Cause:** API returned unexpected data structure  
**Solution:** Check API response in Network tab

### **Error: Toggle not responding**
**Cause:** CSS not loaded or JavaScript error  
**Solution:** 
1. Check console for errors
2. Refresh page (Ctrl+F5)
3. Check Tailwind CSS is loaded

---

## 🎯 **WHAT TO CHECK RIGHT NOW**

1. **Open:** `http://localhost:5174/emails/history`
2. **Press F12** (open DevTools)
3. **Click Console tab**
4. **Take screenshot** of any errors
5. **Click Network tab**
6. **Look for `/api/v1/emails` request**
7. **Click on it** to see request/response details
8. **Take screenshot** of the response

### **Then check:**
- Is backend running? (Check terminal)
- Is frontend running? (You're viewing it)
- Is there a token? (Console: `localStorage.getItem('token')`)
- Are there emails in DB? (Run the test script above)

---

## 🚀 **NEXT STEPS**

1. **Refresh your frontend** (Ctrl+F5 to clear cache)
2. **Check sidebar** - You should now see:
   - "Processing History" under Emails
   - "AI Configuration" under Settings
3. **Click them** to verify they work
4. **Open browser console** and check for errors
5. **Share any error messages** you see

---

## 💡 **TIPS**

- Always check **browser console** first
- Always check **Network tab** for API issues
- Backend errors show in **backend terminal**
- Frontend errors show in **browser console**
- IMAP polling runs **every 2 minutes** automatically
- Test emails may take **up to 2 minutes** to appear

---

**If issues persist, provide:**
1. Screenshot of browser console errors
2. Screenshot of Network tab (API request/response)
3. Backend terminal output
4. Frontend terminal output
