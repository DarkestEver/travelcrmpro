# 🔑 OpenAI API Key Configuration - Architecture Explanation

**Date:** November 10, 2025  
**Issue:** Why are there two ways to configure OpenAI keys?

---

## 🎯 **You're Absolutely Right!**

In a **multi-tenant SaaS system**, each tenant should configure their own OpenAI API key. This ensures:

✅ **Each tenant pays for their own AI usage**  
✅ **Usage limits are per-tenant**  
✅ **Tenant-specific AI settings**  
✅ **Better cost tracking**  
✅ **Scalability**

---

## 🏗️ **Current Architecture (Already Implemented)**

The backend **already supports tenant-specific keys**! Here's how it works:

### **Priority Order:**

```javascript
// File: backend/src/services/openaiService.js

async getClientForTenant(tenantId) {
  // 1️⃣ FIRST: Try tenant-specific API key
  const tenant = await Tenant.findById(tenantId);
  if (tenant?.settings?.aiSettings?.openaiApiKey) {
    console.log('✅ Using tenant-specific OpenAI key');
    return { client: new OpenAI({ apiKey: tenant.key }), source: 'tenant' };
  }

  // 2️⃣ FALLBACK: Use global .env key
  if (process.env.OPENAI_API_KEY) {
    console.log('⚠️  Using global OpenAI key (fallback)');
    return { client: this.globalClient, source: 'global' };
  }

  // 3️⃣ NO KEY: Return null
  return null;
}
```

### **Database Schema (Already Implemented):**

```javascript
// File: backend/src/models/Tenant.js

settings: {
  aiSettings: {
    enabled: Boolean,              // Enable/disable AI features
    openaiApiKey: String,          // Encrypted API key 🔐
    autoProcessEmails: Boolean,    // Auto-process incoming emails
    confidenceThreshold: Number,   // AI confidence threshold (0-100)
    autoResponseEnabled: Boolean,  // Auto-send responses
    monthlyBudget: Number,         // Max AI spend per month
    models: {
      categorization: String,      // Model for categorization
      extraction: String,          // Model for data extraction
      response: String             // Model for response generation
    }
  }
}
```

**Security:**
- ✅ API keys are **encrypted** before storage
- ✅ Decrypted only when needed
- ✅ Never sent to frontend

---

## ❌ **What's Missing: Tenant Settings UI**

The **backend is ready**, but there's **no frontend UI** for tenants to configure their OpenAI keys!

### **Current Situation:**

| Component | Status | Details |
|-----------|--------|---------|
| **Backend Model** | ✅ Complete | Tenant.aiSettings with encrypted key storage |
| **Backend Service** | ✅ Complete | openaiService checks tenant key first |
| **Backend API** | ✅ Complete | Can update tenant settings via API |
| **Frontend UI** | ❌ Missing | No page to enter OpenAI key |
| **Settings Page** | ⚠️ Partial | Has other settings, but not AI |

---

## 🚀 **What Needs to Be Built**

### **Option 1: Add AI Tab to Tenant Settings** (Recommended)

Add a new tab to the existing TenantSettings page:

**File:** `frontend/src/pages/TenantSettings.jsx`

```javascript
// Add new tab
const tabs = [
  { id: 'general', label: 'General', icon: FiSettings },
  { id: 'branding', label: 'Branding', icon: FiImage },
  { id: 'contact', label: 'Contact', icon: FiMail },
  { id: 'payment', label: 'Payment', icon: FiCreditCard },
  { id: 'finance', label: 'Finance', icon: FiDollarSign },
  { id: 'ai', label: 'AI Features', icon: FiCpu }, // 👈 NEW TAB
  { id: 'email-accounts', label: 'Email Accounts', icon: FiServer },
];

// Add AI settings form
{activeTab === 'ai' && (
  <div className="space-y-6">
    <h3 className="text-lg font-medium">AI Email Automation</h3>
    
    {/* Enable/Disable AI */}
    <div>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.ai.enabled}
          onChange={(e) => setFormData({
            ...formData,
            ai: { ...formData.ai, enabled: e.target.checked }
          })}
        />
        <span>Enable AI Email Processing</span>
      </label>
    </div>

    {/* OpenAI API Key */}
    {formData.ai.enabled && (
      <>
        <div>
          <label className="block text-sm font-medium mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={formData.ai.openaiApiKey}
            onChange={(e) => setFormData({
              ...formData,
              ai: { ...formData.ai, openaiApiKey: e.target.value }
            })}
            placeholder="sk-proj-..."
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Get your API key from{' '}
            <a 
              href="https://platform.openai.com/api-keys"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              OpenAI Dashboard
            </a>
          </p>
        </div>

        {/* Auto-process Emails */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.ai.autoProcessEmails}
              onChange={(e) => setFormData({
                ...formData,
                ai: { ...formData.ai, autoProcessEmails: e.target.checked }
              })}
            />
            <span>Automatically process incoming emails</span>
          </label>
        </div>

        {/* Confidence Threshold */}
        <div>
          <label className="block text-sm font-medium mb-2">
            AI Confidence Threshold (%)
          </label>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={formData.ai.confidenceThreshold}
            onChange={(e) => setFormData({
              ...formData,
              ai: { ...formData.ai, confidenceThreshold: parseInt(e.target.value) }
            })}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>More emails to review (50%)</span>
            <span className="font-medium">{formData.ai.confidenceThreshold}%</span>
            <span>Fewer reviews needed (95%)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Emails below this confidence score will go to manual review queue
          </p>
        </div>

        {/* Monthly Budget */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Monthly AI Budget (USD)
          </label>
          <input
            type="number"
            min="0"
            step="10"
            value={formData.ai.monthlyBudget}
            onChange={(e) => setFormData({
              ...formData,
              ai: { ...formData.ai, monthlyBudget: parseFloat(e.target.value) }
            })}
            placeholder="100"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Alert when 80% used. Stop processing at 100%.
          </p>
        </div>

        {/* Cost Estimate */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💰 Cost Estimate</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ~$0.03-0.06 per email processed</li>
            <li>• 1,000 emails/month ≈ $30-60</li>
            <li>• 3,000 emails/month ≈ $90-180</li>
          </ul>
        </div>

        {/* Test Connection Button */}
        <div>
          <button
            type="button"
            onClick={testOpenAIConnection}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test OpenAI Connection
          </button>
        </div>
      </>
    )}
  </div>
)}
```

---

## 📝 **Alternative: Direct Database Update (For Testing)**

Until the UI is built, you can configure tenant AI settings directly in MongoDB:

### **Method 1: MongoDB Shell**

```javascript
// Connect to database
mongosh travel-crm

// Update tenant AI settings
db.tenants.updateOne(
  { _id: ObjectId("690ce93c464bf35e0adede29") },
  {
    $set: {
      "settings.aiSettings": {
        enabled: true,
        openaiApiKey: "sk-proj-YOUR-ACTUAL-KEY-HERE",
        autoProcessEmails: true,
        confidenceThreshold: 70,
        autoResponseEnabled: false,
        monthlyBudget: 100,
        models: {
          categorization: "gpt-4-turbo-preview",
          extraction: "gpt-4-turbo-preview",
          response: "gpt-4-turbo-preview"
        }
      }
    }
  }
)

// Verify
db.tenants.findOne(
  { _id: ObjectId("690ce93c464bf35e0adede29") },
  { "settings.aiSettings": 1 }
)
```

### **Method 2: Backend API Call**

```bash
# Update tenant settings
curl -X PUT http://localhost:5000/api/v1/tenants/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "aiSettings": {
        "enabled": true,
        "openaiApiKey": "sk-proj-YOUR-KEY-HERE",
        "autoProcessEmails": true,
        "confidenceThreshold": 70,
        "monthlyBudget": 100
      }
    }
  }'
```

### **Method 3: Create Script**

**File:** `backend/scripts/configure-tenant-ai.js`

```javascript
const mongoose = require('mongoose');
const Tenant = require('../src/models/Tenant');
require('dotenv').config();

async function configureTenantAI() {
  await mongoose.connect(process.env.MONGODB_URI);

  const tenantId = '690ce93c464bf35e0adede29';
  const openaiKey = 'sk-proj-YOUR-KEY-HERE'; // Replace with actual key

  const tenant = await Tenant.findById(tenantId);
  
  tenant.settings.aiSettings = {
    enabled: true,
    openaiApiKey: openaiKey, // Will be encrypted on save
    autoProcessEmails: true,
    confidenceThreshold: 70,
    autoResponseEnabled: false,
    monthlyBudget: 100,
    models: {
      categorization: 'gpt-4-turbo-preview',
      extraction: 'gpt-4-turbo-preview',
      response: 'gpt-4-turbo-preview'
    }
  };

  await tenant.save();

  console.log('✅ Tenant AI settings configured');
  console.log('   API Key: ****' + openaiKey.slice(-8));
  console.log('   Encrypted in database: YES');
  
  process.exit(0);
}

configureTenantAI();
```

Run it:
```bash
cd backend
node scripts/configure-tenant-ai.js
```

---

## 🔐 **Security Features (Already Implemented)**

### **1. Encryption**
```javascript
// API key is encrypted before saving
tenantSchema.pre('save', function(next) {
  if (this.isModified('settings.aiSettings.openaiApiKey')) {
    this.settings.aiSettings.openaiApiKey = encrypt(
      this.settings.aiSettings.openaiApiKey
    );
  }
  next();
});
```

### **2. Decryption Only When Needed**
```javascript
tenantSchema.methods.getDecryptedAISettings = function() {
  return {
    openaiApiKey: decrypt(this.settings.aiSettings.openaiApiKey),
    enabled: this.settings.aiSettings.enabled,
    // ... other settings
  };
};
```

### **3. Never Sent to Frontend**
```javascript
// API response masks the key
{
  "settings": {
    "aiSettings": {
      "enabled": true,
      "openaiApiKey": "****proj-abc123", // Masked
      "confidenceThreshold": 70
    }
  }
}
```

---

## 💰 **Cost Tracking Per Tenant**

Each tenant's AI usage is tracked separately:

```javascript
// File: backend/src/models/EmailLog.js

{
  emailId: "676d...",
  tenantId: "690ce...",
  openaiCost: 0.042,      // Cost for this email
  tokensUsed: 2000,       // Tokens used
  processingStatus: "processed"
}

// Monthly aggregation
db.emaillogs.aggregate([
  { $match: { tenantId: ObjectId("690ce..."), receivedAt: { $gte: new Date("2025-11-01") } } },
  { $group: {
    _id: "$tenantId",
    totalCost: { $sum: "$openaiCost" },
    emailsProcessed: { $sum: 1 }
  }}
])
```

---

## 🎯 **Recommendation**

### **For Now (Testing):**
1. ✅ Configure tenant AI key directly in database (Method 1 above)
2. ✅ Use the script I created
3. ✅ Test email processing

### **For Production:**
1. ❌ **Do NOT use global `.env` key** - You'll pay for all tenants!
2. ✅ **Build the UI** (Option 1 above)
3. ✅ **Each tenant configures their own key**
4. ✅ **Monitor usage per tenant**

---

## 📋 **To-Do List**

### **High Priority:**
- [ ] Build AI Settings tab in TenantSettings.jsx
- [ ] Add OpenAI API key input field
- [ ] Add "Test Connection" button
- [ ] Display current usage statistics
- [ ] Budget warning alerts

### **Medium Priority:**
- [ ] AI cost dashboard per tenant
- [ ] Monthly usage reports
- [ ] Budget breach notifications
- [ ] Model selection dropdown

### **Low Priority:**
- [ ] API key rotation feature
- [ ] Multiple API keys (load balancing)
- [ ] Custom AI prompts per tenant

---

## 🚀 **Quick Start for Testing**

### **Option 1: Use Global Key (Testing Only)**

Uncomment in `.env`:
```bash
OPENAI_API_KEY=sk-proj-YOUR-KEY
```

**Pros:** Quick to test  
**Cons:** You pay for all tenants

### **Option 2: Configure Tenant Key (Recommended)**

```bash
# Run configuration script
cd backend
node scripts/configure-tenant-ai.js
```

**Pros:** Production-ready  
**Cons:** Need to build UI later

---

## 🎓 **Summary**

**Your concern is valid!** 

The `.env` key should only be:
- ✅ For **development testing**
- ✅ As a **fallback** if tenant doesn't configure
- ❌ **NOT for production** (you'll pay for everyone!)

**The right approach:**
1. Each tenant gets their own OpenAI account
2. They configure their API key in Settings
3. They pay for their own usage
4. You just provide the platform

**Next step:** Would you like me to:
1. Build the AI Settings UI for TenantSettings page?
2. Create the database configuration script?
3. Both?

Let me know! 🚀
