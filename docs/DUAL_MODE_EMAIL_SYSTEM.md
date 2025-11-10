# 📧 Dual-Mode Email System - Complete Guide

**Implementation Date:** November 10, 2025  
**Status:** ✅ Fully Implemented  
**Modes:** IMAP Polling + Webhook Reception

---

## 🎯 **Overview**

Your Travel CRM now supports **TWO** methods for receiving and processing emails:

### **Mode 1: IMAP Polling (Automatic Email Fetching)**
- ✅ Automatically fetches emails from IMAP servers
- ✅ Runs every 2 minutes
- ✅ Monitors all configured email accounts
- ✅ Perfect for: Gmail, Outlook, Zoho, custom SMTP providers

### **Mode 2: Webhook Reception (Direct Integration)**
- ✅ Receives emails via HTTP POST webhook
- ✅ Real-time processing (no delay)
- ✅ Perfect for: Website chat, contact forms, API integrations

---

## 🔄 **How It Works**

```
┌─────────────────────────────────────────────────────────┐
│                   EMAIL SOURCES                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📧 Customer Email Account (Gmail/Outlook)              │
│      │                                                   │
│      └──► IMAP Polling Service (every 2 min)           │
│             │                                            │
│             └──► Email Saved to Database                │
│                    │                                     │
│                    └──► Email-to-Quote Workflow         │
│                                                          │
│  💬 Website Chat / Contact Form                         │
│      │                                                   │
│      └──► Webhook POST /api/v1/emails/webhook          │
│             │                                            │
│             └──► Email Saved to Database                │
│                    │                                     │
│                    └──► Email-to-Quote Workflow         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 **Implementation Summary**

### **New Files Created:**

1. **`backend/src/services/emailPollingService.js`**
   - Core IMAP polling logic
   - Connects to IMAP servers
   - Fetches unread emails
   - Marks emails as read
   - Processes through email-to-quote workflow

2. **`backend/src/jobs/pollEmails.js`**
   - Cron job scheduler
   - Runs every 2 minutes
   - Triggers polling for all active accounts

### **Files Modified:**

1. **`backend/src/models/EmailAccount.js`**
   - Added `autoFetch` field (enable/disable polling)
   - Added `fetchInterval` field (polling frequency)
   - Added `lastFetchAt` field (last poll timestamp)
   - Added `lastFetchStatus` field ('success', 'error', 'never')
   - Added `lastFetchError` field (error message)

2. **`backend/src/models/EmailLog.js`**
   - Added `source` field ('imap', 'webhook', 'manual', 'api')
   - Tracks where email came from

3. **`backend/src/jobs/index.js`**
   - Integrated email polling cron job

4. **`backend/src/server.js`**
   - Starts email polling service on server startup
   - Initializes alongside SLA monitoring

---

## 🚀 **Setup Instructions**

### **Step 1: Install Dependencies**

Already installed:
```bash
npm install node-imap
```

### **Step 2: Configure Email Account**

Create an email account with IMAP settings:

```javascript
POST /api/v1/email-accounts
{
  "accountName": "Support Gmail",
  "email": "support@yourcompany.com",
  "provider": "gmail",
  
  // IMAP Configuration (for receiving)
  "imap": {
    "enabled": true,
    "host": "imap.gmail.com",
    "port": 993,
    "tls": true,
    "username": "support@yourcompany.com",
    "password": "your-app-password"
  },
  
  // SMTP Configuration (for sending)
  "smtp": {
    "enabled": true,
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "username": "support@yourcompany.com",
    "password": "your-app-password",
    "fromName": "Travel CRM Support",
    "replyTo": "support@yourcompany.com"
  },
  
  // Polling Configuration
  "autoFetch": true,  // Enable automatic polling
  "isActive": true,
  "isPrimary": true,
  "purpose": "support"
}
```

### **Step 3: Verify Server Startup**

When you restart the server, you should see:

```
✅ Email polling service initialized (runs every 2 minutes)
🔄 Starting email polling service...
📧 Found 1 email account(s) to poll
✅ Email polling service started successfully
```

### **Step 4: Monitor Polling**

Every 2 minutes, you'll see:
```
⏰ Email polling cron job triggered
📬 Polling emails for: support@yourcompany.com
✅ Fetched 2 new email(s) from support@yourcompany.com
```

---

## 📧 **Email Provider Configurations**

### **Gmail**

**IMAP Settings:**
```javascript
{
  "host": "imap.gmail.com",
  "port": 993,
  "tls": true
}
```

**SMTP Settings:**
```javascript
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false
}
```

**Important:** Use App Password, not regular password
1. Enable 2FA in Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password

### **Outlook / Office 365**

**IMAP Settings:**
```javascript
{
  "host": "outlook.office365.com",
  "port": 993,
  "tls": true
}
```

**SMTP Settings:**
```javascript
{
  "host": "smtp.office365.com",
  "port": 587,
  "secure": false
}
```

### **Yahoo Mail**

**IMAP Settings:**
```javascript
{
  "host": "imap.mail.yahoo.com",
  "port": 993,
  "tls": true
}
```

**SMTP Settings:**
```javascript
{
  "host": "smtp.mail.yahoo.com",
  "port": 587,
  "secure": false
}
```

### **Zoho Mail**

**IMAP Settings:**
```javascript
{
  "host": "imap.zoho.com",
  "port": 993,
  "tls": true
}
```

**SMTP Settings:**
```javascript
{
  "host": "smtp.zoho.com",
  "port": 587,
  "secure": false
}
```

### **Custom SMTP Provider**

**IMAP Settings:**
```javascript
{
  "host": "mail.yourdomain.com",
  "port": 993,
  "tls": true
}
```

**SMTP Settings:**
```javascript
{
  "host": "mail.yourdomain.com",
  "port": 587,
  "secure": false
}
```

---

## 🌐 **Webhook Integration**

### **Endpoint:**
```
POST https://your-domain.com/api/v1/emails/webhook
```

### **Headers:**
```javascript
{
  "Content-Type": "application/json",
  "X-Tenant-ID": "your-tenant-id"
}
```

### **Request Body:**
```javascript
{
  "from": {
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "to": [
    {
      "email": "sales@yourcompany.com",
      "name": "Sales Team"
    }
  ],
  "subject": "Dubai Holiday Inquiry",
  "bodyText": "I'm interested in booking a 7-day trip to Dubai...",
  "bodyHtml": "<p>I'm interested in booking a 7-day trip to Dubai...</p>",
  "receivedAt": "2025-11-10T12:00:00Z",
  "tenantId": "your-tenant-id"
}
```

### **Response:**
```javascript
{
  "success": true,
  "message": "Email received and queued for processing",
  "emailId": "673075c8a1b2c3d4e5f67890",
  "processingStatus": "pending"
}
```

---

## 🔌 **Integration Examples**

### **1. Website Contact Form**

```javascript
// Frontend form submission
async function submitContactForm(formData) {
  const response = await fetch('https://your-api.com/api/v1/emails/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'your-tenant-id'
    },
    body: JSON.stringify({
      from: {
        email: formData.email,
        name: formData.name
      },
      to: [{
        email: 'sales@yourcompany.com',
        name: 'Sales Team'
      }],
      subject: `New inquiry from ${formData.name}`,
      bodyText: formData.message,
      bodyHtml: `<p><strong>From:</strong> ${formData.name}<br>
                 <strong>Email:</strong> ${formData.email}<br>
                 <strong>Phone:</strong> ${formData.phone}<br><br>
                 ${formData.message}</p>`,
      receivedAt: new Date().toISOString(),
      tenantId: 'your-tenant-id'
    })
  });
  
  return response.json();
}
```

### **2. Live Chat Integration**

```javascript
// When customer sends chat message
async function sendChatAsEmail(chatData) {
  await fetch('https://your-api.com/api/v1/emails/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'your-tenant-id'
    },
    body: JSON.stringify({
      from: {
        email: chatData.customerEmail || 'chat-user@temp.com',
        name: chatData.customerName || 'Chat User'
      },
      to: [{
        email: 'support@yourcompany.com',
        name: 'Support Team'
      }],
      subject: `Live Chat: ${chatData.subject}`,
      bodyText: chatData.messages.join('\n'),
      bodyHtml: chatData.messages.map(m => `<p><strong>${m.sender}:</strong> ${m.text}</p>`).join(''),
      receivedAt: new Date().toISOString(),
      tenantId: 'your-tenant-id'
    })
  });
}
```

### **3. Zapier/Make.com Integration**

**Trigger:** New email in Gmail  
**Action:** Webhook POST to your API

**Zapier Configuration:**
- Trigger: Gmail → New Email
- Action: Webhooks → Custom Request
- URL: `https://your-api.com/api/v1/emails/webhook`
- Method: POST
- Headers: `Content-Type: application/json`, `X-Tenant-ID: your-id`
- Body: Map Gmail fields to your webhook format

---

## 📊 **Monitoring & Debugging**

### **Check Email Account Status**

```bash
GET /api/v1/email-accounts/:id
```

Response shows polling status:
```javascript
{
  "email": "support@yourcompany.com",
  "autoFetch": true,
  "lastFetchAt": "2025-11-10T19:00:00Z",
  "lastFetchStatus": "success",
  "lastFetchError": null,
  "stats": {
    "emailsReceived": 45,
    "emailsSent": 32
  }
}
```

### **View Email Logs**

```bash
GET /api/v1/emails?source=imap
GET /api/v1/emails?source=webhook
```

### **Server Logs**

Polling activity:
```
2025-11-10 19:00:00 info: ⏰ Email polling cron job triggered
2025-11-10 19:00:00 info: 🔄 Polling 2 email account(s)...
2025-11-10 19:00:01 info: 📬 Polling emails for: support@yourcompany.com
2025-11-10 19:00:02 info: 📨 Found 3 unread email(s) for support@yourcompany.com
2025-11-10 19:00:03 info: ✅ Saved email: 673075c8... - "Dubai Trip Inquiry"
2025-11-10 19:00:03 info: 📤 Queued email for processing: 673075c8...
2025-11-10 19:00:05 info: ✅ Email polling cycle complete
```

### **Common Issues**

#### **Issue 1: Emails not being fetched**

Check:
1. `autoFetch` is set to `true`
2. IMAP credentials are correct
3. IMAP access is enabled in email provider
4. Check `lastFetchError` field for error message

#### **Issue 2: Authentication failed**

Gmail: Use App Password (not regular password)  
Outlook: Enable "Less secure apps"  
Check: Username is full email address

#### **Issue 3: Connection timeout**

- Check firewall/network settings
- Verify IMAP host and port
- Try port 143 instead of 993 (non-TLS)

---

## ⚙️ **Configuration Options**

### **Change Polling Frequency**

Edit `backend/src/jobs/pollEmails.js`:

```javascript
// Current: Every 2 minutes
cron.schedule('*/2 * * * *', ...)

// Every 1 minute
cron.schedule('*/1 * * * *', ...)

// Every 5 minutes
cron.schedule('*/5 * * * *', ...)

// Every 10 minutes
cron.schedule('*/10 * * * *', ...)
```

### **Disable Polling for Specific Account**

```javascript
PATCH /api/v1/email-accounts/:id
{
  "autoFetch": false
}
```

### **Custom Fetch Interval (Future Enhancement)**

```javascript
{
  "fetchInterval": 60000  // milliseconds (1 minute)
}
```

---

## 🎯 **Use Cases**

### **Scenario 1: Customer Emails**
- Customer sends email to sales@yourcompany.com
- **IMAP poller** fetches email within 2 minutes
- Email-to-quote workflow creates quote automatically
- Customer receives acknowledgment email

### **Scenario 2: Website Inquiry**
- Customer fills contact form on website
- Form submits to **webhook** endpoint
- Email-to-quote workflow processes immediately
- Quote created in real-time
- Customer receives instant response

### **Scenario 3: Live Chat**
- Customer starts live chat on website
- Chat messages sent to **webhook**
- Converted to email format
- Processed through email-to-quote workflow
- Agent receives notification

---

## 📈 **Performance Metrics**

| Metric | IMAP Polling | Webhook |
|--------|-------------|---------|
| **Processing Delay** | 0-2 minutes | < 1 second |
| **Reliability** | High | Very High |
| **Setup Complexity** | Medium | Easy |
| **External Dependencies** | Email server | None |
| **Best For** | Existing email accounts | Website/chat integration |

---

## 🔐 **Security Considerations**

### **IMAP Polling:**
- ✅ Passwords encrypted in database
- ✅ TLS/SSL connections to email servers
- ✅ Self-signed certificates supported
- ⚠️ Use app-specific passwords (not main password)

### **Webhook:**
- ✅ Tenant ID verification
- ✅ Rate limiting enabled
- ✅ Input validation
- ⚠️ Consider API key authentication for production

---

## 🚦 **Status**

| Component | Status | Notes |
|-----------|--------|-------|
| IMAP Polling Service | ✅ Implemented | Fully functional |
| Webhook Receiver | ✅ Implemented | Already existed |
| Email Processing Queue | ✅ Working | Bull + Redis |
| Email-to-Quote Workflow | ✅ Working | All 10 features |
| SLA Monitoring | ✅ Working | Hourly cron |
| Dual-Mode Operation | ✅ Working | Both modes active |

---

## 📝 **Next Steps**

### **Immediate:**
1. ✅ Configure email account with IMAP settings
2. ✅ Test by sending email to configured account
3. ✅ Verify email is fetched and processed
4. ✅ Check quote is created automatically

### **Optional Enhancements:**
- [ ] Add OAuth2 support for Gmail API
- [ ] Implement per-account fetch intervals
- [ ] Add email filtering rules
- [ ] Implement smart polling (slower when no emails)
- [ ] Add webhook authentication/API keys
- [ ] Create email forwarding rules dashboard

---

## 🎉 **Summary**

Your Travel CRM now has a **dual-mode email system**:

✅ **IMAP Polling** - Automatically fetches emails from email accounts every 2 minutes  
✅ **Webhook Reception** - Instantly receives emails from website/chat/API  
✅ **Single Workflow** - Both sources processed through same email-to-quote workflow  
✅ **Source Tracking** - Every email tagged with source ('imap' or 'webhook')  

**Result:** Complete email automation with maximum flexibility!

---

**Questions or issues?** Check server logs or email account `lastFetchError` field.
