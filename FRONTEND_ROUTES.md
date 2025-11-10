# 🛣️ Frontend Routes Configuration

**Date:** November 10, 2025

---

## ✅ **Routes Added to App.jsx**

### **1. AI Settings Route**
```jsx
<Route path="settings/ai" element={
  <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
    <AISettings />
  </RoleBasedRoute>
} />
```

**URL:** `/settings/ai`  
**Component:** `AISettings`  
**Access:** Super Admin, Operator, Admin  
**Purpose:** Configure OpenAI API key, model selection, and AI settings

---

### **2. Email Processing History Route**
```jsx
<Route path="emails/history" element={
  <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
    <ProcessingHistory />
  </RoleBasedRoute>
} />
```

**URL:** `/emails/history`  
**Component:** `ProcessingHistory`  
**Access:** Super Admin, Operator, Admin  
**Purpose:** View complete email processing history with filters and stats

---

## 📋 **Complete Email Routes Structure**

```
/emails                    → Email Dashboard (list view)
/emails/:id                → Email Detail (single email view)
/emails/history            → Processing History (NEW)
/emails/review-queue       → Review Queue (requires attention)
/emails/analytics          → Email Analytics (stats & charts)
```

---

## 📋 **Complete Settings Routes Structure**

```
/settings                  → Tenant Settings (general)
/settings/email-accounts   → Email Accounts (SMTP/IMAP config)
/settings/ai               → AI Settings (NEW - OpenAI config)
```

---

## 📦 **Files to Create**

### **1. AI Settings Component**
**Location:** `frontend/src/pages/settings/AISettings.jsx`

**What it needs:**
- Form to input OpenAI API key
- Dropdown to select model (GPT-4, GPT-3.5-turbo)
- Input for max tokens
- Slider for temperature
- Checkbox to enable/disable AI
- Save button

**API Endpoints:**
- `GET /api/v1/tenants/settings` - Load current settings
- `PATCH /api/v1/tenants/settings` - Save AI settings

**Example API call:**
```javascript
import axios from 'axios';

const saveAISettings = async (settings) => {
  const response = await axios.patch('/api/v1/tenants/settings', {
    aiSettings: {
      openaiApiKey: settings.openaiApiKey,
      model: settings.model,
      maxTokens: settings.maxTokens,
      temperature: settings.temperature,
      enableAI: settings.enableAI
    }
  });
  return response.data;
};
```

---

### **2. Processing History Component**
**Location:** `frontend/src/pages/emails/ProcessingHistory.jsx`

**What it needs:**
- Table with email processing data
- Filters: status, category, source, date range
- Status badges (pending, completed, failed)
- Link to quote (if created)
- Retry button for failed emails
- Pagination

**API Endpoints:**
- `GET /api/v1/emails?status=X&source=Y&category=Z` - Filtered email list
- `GET /api/v1/emails/stats` - Email statistics
- `POST /api/v1/emails/:id/retry` - Retry failed email

**Example API call:**
```javascript
import axios from 'axios';

const getEmailHistory = async (filters) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.source) params.append('source', filters.source);
  if (filters.category) params.append('category', filters.category);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  
  const response = await axios.get(`/api/v1/emails?${params}`);
  return response.data;
};

const getEmailStats = async () => {
  const response = await axios.get('/api/v1/emails/stats');
  return response.data;
};

const retryEmail = async (emailId) => {
  const response = await axios.post(`/api/v1/emails/${emailId}/retry`);
  return response.data;
};
```

---

## 🎨 **Navigation Menu Updates**

Update your sidebar navigation to include these new routes:

### **Settings Menu**
```jsx
<MenuItem icon={<SettingsIcon />} label="Settings">
  <SubMenu>
    <MenuItem href="/settings" label="General" />
    <MenuItem href="/settings/email-accounts" label="Email Accounts" />
    <MenuItem href="/settings/ai" label="AI Configuration" icon="🤖" /> {/* NEW */}
  </SubMenu>
</MenuItem>
```

### **Email Menu**
```jsx
<MenuItem icon={<EmailIcon />} label="Emails">
  <SubMenu>
    <MenuItem href="/emails" label="All Emails" />
    <MenuItem href="/emails/history" label="Processing History" icon="📊" /> {/* NEW */}
    <MenuItem href="/emails/review-queue" label="Review Queue" />
    <MenuItem href="/emails/analytics" label="Analytics" />
  </SubMenu>
</MenuItem>
```

---

## 🔑 **Access Control**

All routes are protected with `RoleBasedRoute` and allow:
- ✅ **super_admin** - Full access
- ✅ **operator** - Full access
- ✅ **admin** - Full access
- ❌ **agent** - No access
- ❌ **customer** - No access
- ❌ **supplier** - No access
- ❌ **finance** - No access

---

## 📝 **Quick Start Checklist**

### **Step 1: Create AI Settings Page**
```bash
# Create the file
frontend/src/pages/settings/AISettings.jsx
```

**Copy the complete code from:** `ANSWERS_TO_THREE_QUESTIONS.md` (Section: Question 2)

---

### **Step 2: Create Processing History Page**
```bash
# Create the file
frontend/src/pages/emails/ProcessingHistory.jsx
```

**Copy the complete code from:** `ANSWERS_TO_THREE_QUESTIONS.md` (Section: Question 3, Option 2)

---

### **Step 3: Update Sidebar Navigation**
- Add "AI Configuration" under Settings menu
- Add "Processing History" under Emails menu

---

### **Step 4: Test the Routes**

1. **Test AI Settings:**
```
http://localhost:3000/settings/ai
```

2. **Test Processing History:**
```
http://localhost:3000/emails/history
```

3. **Verify Role Access:**
   - Login as super_admin → Should see both pages
   - Login as agent → Should see 403 Unauthorized

---

## 🚀 **Backend API Endpoints (Already Created)**

All backend APIs are ready and working:

### **Tenant Settings API**
```
GET  /api/v1/tenants/settings          → Get current settings
PATCH /api/v1/tenants/settings         → Update settings
```

### **Email API**
```
GET  /api/v1/emails                    → Get filtered email list
GET  /api/v1/emails/stats              → Get email statistics
GET  /api/v1/emails/:id                → Get single email
POST /api/v1/emails/:id/retry          → Retry failed processing
```

---

## 📊 **API Response Examples**

### **GET /api/v1/emails/stats**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": [
      { "_id": "completed", "count": 120 },
      { "_id": "pending", "count": 20 },
      { "_id": "failed", "count": 10 }
    ],
    "bySource": [
      { "_id": "imap", "count": 100 },
      { "_id": "webhook", "count": 50 }
    ],
    "byCategory": [
      { "_id": "CUSTOMER", "count": 80 },
      { "_id": "SUPPLIER", "count": 40 },
      { "_id": "FINANCE", "count": 30 }
    ],
    "avgProcessingTime": 5000
  }
}
```

### **GET /api/v1/tenants/settings**
```json
{
  "success": true,
  "data": {
    "aiSettings": {
      "openaiApiKey": "sk-...", 
      "model": "gpt-4-turbo",
      "maxTokens": 2000,
      "temperature": 0.7,
      "enableAI": true
    },
    "emailSettings": { ... },
    "generalSettings": { ... }
  }
}
```

### **POST /api/v1/emails/:id/retry**
```json
{
  "success": true,
  "message": "Email re-queued for processing"
}
```

---

## 🎯 **Summary**

### **What's Been Added:**
✅ Routes added to `App.jsx`  
✅ Import statements added  
✅ Role-based protection configured  

### **What You Need to Build:**
❌ `AISettings.jsx` component  
❌ `ProcessingHistory.jsx` component  
❌ Update sidebar navigation  

### **What's Already Working (Backend):**
✅ All API endpoints created  
✅ Database optimized with indexes  
✅ Email stats aggregation working  
✅ Retry functionality ready  
✅ OpenAI settings storage ready  

---

## 📚 **Reference Documents**

- **ANSWERS_TO_THREE_QUESTIONS.md** - Complete component code examples
- **IMPLEMENTATION_COMPLETE_SUMMARY.md** - Backend implementation details
- **DUAL_MODE_EMAIL_SYSTEM.md** - Email system documentation

---

**Next Step:** Create the two component files and update your navigation menu!
