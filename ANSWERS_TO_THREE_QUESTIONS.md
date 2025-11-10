# 📋 Answers to Your Three Questions

**Date:** November 10, 2025

---

## ❓ **Question 1: Email Dashboard is Too Slow**

### **Current Implementation:**

The email dashboard uses this query (in `emailController.js`):

```javascript
EmailLog.find(filter)
  .sort({ receivedAt: -1 })
  .skip(skip)
  .limit(parseInt(limit))
  .select('-bodyHtml -bodyText -headers')
```

### **Why It's Slow:**

1. **Large bodyText field** - Excluded in select but still impacts query planning
2. **Missing compound indexes** - Queries filter by multiple fields
3. **No pagination default** - May load too many records
4. **Populate operations** - If populating customer/quote data

### **Solutions to Speed It Up:**

#### **Solution 1: Add Database Indexes**

Add these to `EmailLog.js` model:

```javascript
// Compound indexes for common queries
emailLogSchema.index({ tenantId: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, processingStatus: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, category: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, requiresReview: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, source: 1, receivedAt: -1 });
```

#### **Solution 2: Optimize Query**

```javascript
// Use lean() for faster queries
EmailLog.find(filter)
  .sort({ receivedAt: -1 })
  .skip(skip)
  .limit(parseInt(limit))
  .select('messageId from to subject receivedAt processingStatus category source requiresReview')
  .lean() // ← Faster, returns plain objects
```

#### **Solution 3: Add Caching**

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache email list for 1 minute
const cacheKey = `emails:${tenantId}:${page}:${category}:${status}`;
const cached = await client.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// ... fetch from DB ...

await client.setEx(cacheKey, 60, JSON.stringify(result));
```

#### **Solution 4: Use Aggregation Pipeline**

For complex queries with counts:

```javascript
const result = await EmailLog.aggregate([
  { $match: filter },
  { $sort: { receivedAt: -1 } },
  {
    $facet: {
      emails: [
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $project: {
            messageId: 1,
            from: 1,
            to: 1,
            subject: 1,
            receivedAt: 1,
            processingStatus: 1,
            category: 1,
            source: 1
          }
        }
      ],
      totalCount: [{ $count: 'count' }]
    }
  }
]);
```

---

## ❓ **Question 2: Where Tenant Admin Will Add OpenAI Key & Select Engine**

### **Backend Already Supports It!**

The Tenant model already has OpenAI settings:

```javascript
// In Tenant.js model (line 314)
settings: {
  aiSettings: {
    openaiApiKey: String,  // Encrypted
    model: String,         // 'gpt-4', 'gpt-3.5-turbo', etc
    maxTokens: Number,
    temperature: Number
  }
}
```

### **What's Missing: Frontend UI**

You need to create a Settings page in the admin panel.

### **Where to Add It:**

#### **Option 1: Settings Page (Recommended)**

```
Admin Panel → Settings → AI Configuration
```

**Location:** `frontend/src/pages/Settings/AISettings.jsx`

**Create this page:**

```jsx
import React, { useState, useEffect } from 'react';
import { updateTenantSettings, getTenantSettings } from '../api/tenant';

const AISettings = () => {
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    model: 'gpt-4-turbo',
    maxTokens: 2000,
    temperature: 0.7,
    enableAI: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const response = await getTenantSettings();
    setSettings(response.data.aiSettings);
  };

  const handleSave = async () => {
    await updateTenantSettings({
      aiSettings: settings
    });
    alert('AI Settings saved successfully!');
  };

  return (
    <div className="ai-settings">
      <h2>🤖 AI Configuration</h2>
      
      <div className="form-group">
        <label>OpenAI API Key</label>
        <input
          type="password"
          value={settings.openaiApiKey}
          onChange={(e) => setSettings({...settings, openaiApiKey: e.target.value})}
          placeholder="sk-..."
        />
        <small>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></small>
      </div>

      <div className="form-group">
        <label>Model</label>
        <select
          value={settings.model}
          onChange={(e) => setSettings({...settings, model: e.target.value})}
        >
          <option value="gpt-4-turbo">GPT-4 Turbo (Recommended)</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster, Cheaper)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Max Tokens</label>
        <input
          type="number"
          value={settings.maxTokens}
          onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
        />
        <small>Maximum response length (500-4000)</small>
      </div>

      <div className="form-group">
        <label>Temperature</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
        />
        <span>{settings.temperature}</span>
        <small>Creativity level (0=focused, 1=creative)</small>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={settings.enableAI}
            onChange={(e) => setSettings({...settings, enableAI: e.target.checked})}
          />
          Enable AI Email Processing
        </label>
      </div>

      <button onClick={handleSave} className="btn-primary">
        💾 Save AI Settings
      </button>
    </div>
  );
};

export default AISettings;
```

#### **Option 2: Quick Access in Sidebar**

Add to your existing settings page:

```
Settings → General
Settings → Email Accounts
Settings → AI Configuration ← NEW
Settings → Users & Permissions
```

### **Backend API Endpoint Needed:**

Create in `tenantController.js`:

```javascript
/**
 * Update tenant settings (including AI settings)
 * PATCH /api/v1/tenants/settings
 */
async updateSettings(req, res) {
  try {
    const tenantId = req.user.tenantId;
    const { aiSettings, emailSettings, generalSettings } = req.body;

    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Update settings
    if (aiSettings) {
      tenant.settings.aiSettings = {
        ...tenant.settings.aiSettings,
        ...aiSettings
      };
    }

    if (emailSettings) {
      tenant.settings.emailSettings = {
        ...tenant.settings.emailSettings,
        ...emailSettings
      };
    }

    await tenant.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: tenant.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
}

/**
 * Get tenant settings
 * GET /api/v1/tenants/settings
 */
async getSettings(req, res) {
  try {
    const tenantId = req.user.tenantId;
    
    const tenant = await Tenant.findById(tenantId)
      .select('settings subdomain companyName');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
}
```

### **Add Route:**

In `backend/src/routes/tenant.js`:

```javascript
router.patch('/settings', protect, tenantController.updateSettings);
router.get('/settings', protect, tenantController.getSettings);
```

---

## ❓ **Question 3: Where to See Processed/Unprocessed Email History**

### **Current Status:**

The email list already exists but needs better filtering.

### **What You Need to Add:**

#### **Option 1: Enhanced Email Dashboard with Filters**

**Location:** `frontend/src/pages/Emails/EmailList.jsx`

Add these filters:

```jsx
const EmailList = () => {
  const [filters, setFilters] = useState({
    status: 'all',        // pending, processing, completed, failed
    category: 'all',      // CUSTOMER, SUPPLIER, AGENT, FINANCE
    source: 'all',        // imap, webhook, manual
    dateRange: 'last7days',
    requiresReview: false
  });

  return (
    <div className="email-dashboard">
      <h1>📧 Email Management</h1>
      
      {/* Filter Bar */}
      <div className="filter-bar">
        {/* Processing Status Filter */}
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="all">All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="processing">🔄 Processing</option>
          <option value="completed">✅ Completed</option>
          <option value="failed">❌ Failed</option>
          <option value="converted_to_quote">💼 Converted to Quote</option>
          <option value="duplicate_detected">🔁 Duplicate</option>
        </select>

        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="all">All Categories</option>
          <option value="CUSTOMER">👤 Customer</option>
          <option value="SUPPLIER">🏨 Supplier</option>
          <option value="AGENT">🤝 Agent</option>
          <option value="FINANCE">💰 Finance</option>
          <option value="OTHER">📄 Other</option>
        </select>

        {/* Source Filter */}
        <select
          value={filters.source}
          onChange={(e) => setFilters({...filters, source: e.target.value})}
        >
          <option value="all">All Sources</option>
          <option value="imap">📧 IMAP (Auto-fetched)</option>
          <option value="webhook">🌐 Webhook (Website)</option>
          <option value="manual">✍️ Manual</option>
        </select>

        {/* Date Range */}
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
        >
          <option value="today">Today</option>
          <option value="last7days">Last 7 Days</option>
          <option value="last30days">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>

        {/* Review Filter */}
        <label>
          <input
            type="checkbox"
            checked={filters.requiresReview}
            onChange={(e) => setFilters({...filters, requiresReview: e.target.checked})}
          />
          Requires Review Only
        </label>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <StatCard title="Total Emails" value={stats.total} icon="📧" />
        <StatCard title="Processed" value={stats.processed} icon="✅" color="green" />
        <StatCard title="Pending" value={stats.pending} icon="⏳" color="orange" />
        <StatCard title="Failed" value={stats.failed} icon="❌" color="red" />
      </div>

      {/* Email List */}
      <div className="email-list">
        {emails.map(email => (
          <EmailCard key={email._id} email={email} />
        ))}
      </div>
    </div>
  );
};
```

#### **Option 2: Dedicated Processing History View**

**Location:** `frontend/src/pages/Emails/ProcessingHistory.jsx`

```jsx
const ProcessingHistory = () => {
  return (
    <div className="processing-history">
      <h2>📊 Email Processing History</h2>
      
      <table>
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>From</th>
            <th>Subject</th>
            <th>Source</th>
            <th>Category</th>
            <th>Status</th>
            <th>Processing Time</th>
            <th>Quote Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {emails.map(email => (
            <tr key={email._id} className={`status-${email.processingStatus}`}>
              <td>{formatDate(email.receivedAt)}</td>
              <td>{email.from.email}</td>
              <td>{email.subject}</td>
              <td>
                <span className={`badge-${email.source}`}>
                  {email.source === 'imap' ? '📧 IMAP' : '🌐 Webhook'}
                </span>
              </td>
              <td>
                <span className={`badge-${email.category}`}>
                  {email.category || 'Pending'}
                </span>
              </td>
              <td>
                <StatusBadge status={email.processingStatus} />
              </td>
              <td>{getProcessingTime(email)}</td>
              <td>
                {email.quoteId ? (
                  <Link to={`/quotes/${email.quoteId}`}>
                    View Quote
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td>
                <button onClick={() => viewEmail(email._id)}>View</button>
                {email.processingStatus === 'failed' && (
                  <button onClick={() => retryProcessing(email._id)}>
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### **Backend API Endpoints:**

Add to `emailController.js`:

```javascript
/**
 * Get email processing stats
 * GET /api/v1/emails/stats
 */
async getEmailStats(req, res) {
  try {
    const tenantId = req.user.tenantId;

    const stats = await EmailLog.aggregate([
      { $match: { tenantId: mongoose.Types.ObjectId(tenantId) } },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$processingStatus',
                count: { $sum: 1 }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 }
              }
            }
          ],
          bySource: [
            {
              $group: {
                _id: '$source',
                count: { $sum: 1 }
              }
            }
          ],
          total: [
            {
              $count: 'count'
            }
          ],
          avgProcessingTime: [
            {
              $match: { processedAt: { $exists: true } }
            },
            {
              $project: {
                processingTime: {
                  $subtract: ['$processedAt', '$receivedAt']
                }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$processingTime' }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0].total[0]?.count || 0,
        byStatus: stats[0].byStatus,
        byCategory: stats[0].byCategory,
        bySource: stats[0].bySource,
        avgProcessingTime: stats[0].avgProcessingTime[0]?.avgTime || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
}

/**
 * Retry failed email processing
 * POST /api/v1/emails/:id/retry
 */
async retryProcessing(req, res) {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const email = await EmailLog.findOne({ _id: id, tenantId });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Reset status
    email.processingStatus = 'pending';
    email.processingError = null;
    await email.save();

    // Re-add to queue
    await emailProcessingQueue.addToQueue(email._id, tenantId, 'high');

    res.json({
      success: true,
      message: 'Email re-queued for processing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retry processing',
      error: error.message
    });
  }
}
```

---

## 📋 **Summary**

### **Issue 1: Slow Email Dashboard**
- ✅ Add compound indexes to EmailLog model
- ✅ Use `.lean()` for faster queries
- ✅ Implement Redis caching
- ✅ Optimize select fields

### **Issue 2: OpenAI Key Management**
- ✅ Backend already supports it (Tenant model)
- ❌ Frontend UI missing - Need to create Settings page
- ✅ Create `GET/PATCH /api/v1/tenants/settings` endpoints
- ✅ Add AISettings.jsx component

### **Issue 3: Email Processing History**
- ✅ Email list exists but needs better filters
- ✅ Add filters: status, category, source, date range
- ✅ Add stats dashboard: processed vs pending
- ✅ Add processing history view with timeline
- ✅ Add retry functionality for failed emails

---

## 🚀 **Quick Fixes You Can Implement Now**

### **1. Speed Up Email Dashboard (5 minutes)**

Add to `backend/src/models/EmailLog.js`:

```javascript
// Add after existing indexes
emailLogSchema.index({ tenantId: 1, processingStatus: 1, receivedAt: -1 });
emailLogSchema.index({ tenantId: 1, source: 1, receivedAt: -1 });
```

### **2. Add Settings API (10 minutes)**

Add to `backend/src/controllers/tenantController.js` - I'll create this file next.

### **3. Frontend Filters (20 minutes)**

Add status filter dropdown to existing email list page.

---

**Want me to implement any of these solutions for you?** Let me know which one to start with!
