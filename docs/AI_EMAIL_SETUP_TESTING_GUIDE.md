# 🚀 AI Email Automation - Setup & Testing Guide

**Date:** November 10, 2025  
**Status:** System Ready - Just needs API key

---

## 📧 How Emails Are Read (Already Implemented)

Your system has **2 ways** to receive emails:

### **Method 1: Webhook Endpoint (Production)**
```
Email Provider (Gmail/Outlook/SendGrid)
         ↓ forwards to
http://your-domain.com/api/v1/emails/webhook
         ↓
Backend receives & processes automatically
```

### **Method 2: Direct API Call (Testing/Development)**
```bash
POST http://localhost:5000/api/v1/emails/webhook
Content-Type: application/json

{
  "from": "customer@example.com",
  "to": "travel@yourcompany.com",
  "subject": "Dubai vacation inquiry",
  "text": "Email body text...",
  "tenantId": "your-tenant-id"
}
```

---

## 🔑 Configure OpenAI API Key

### **Step 1: Get OpenAI API Key**

1. **Go to:** https://platform.openai.com/api-keys
2. **Sign up** or **Log in** to your OpenAI account
3. **Click:** "Create new secret key"
4. **Copy the key** (starts with `sk-...`)
   - ⚠️ **IMPORTANT:** Save it now - you can only see it once!

**Pricing:**
- $5-10 free credit for new accounts
- Pay-as-you-go: ~$0.03-0.06 per email
- Estimate: $50/month for ~1000 emails

### **Step 2: Add Key to Backend .env File**

**File:** `backend/.env`

I've already added the configuration line. Just replace the placeholder:

```bash
# OpenAI Configuration (for AI Email Automation)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-YOUR-ACTUAL-KEY-HERE
```

**Example:**
```bash
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

### **Step 3: Restart Backend Server**

```bash
cd backend
npm run dev
```

**You should see:**
```
✅ Global OpenAI service initialized
✅ Email queue initialized with Redis
```

If you see:
```
⚠️  Global OPENAI_API_KEY not configured
```
Then your key is not set correctly.

---

## ✅ Verify Setup

### **Quick Check**

1. **Backend running?** http://localhost:5000
2. **Frontend running?** http://localhost:5174
3. **MongoDB running?** Check connection
4. **Redis running?** (Optional - has fallback)
5. **OpenAI key set?** Check `.env` file

---

## 🧪 How to Test the System

### **Method 1: Use the Test Script (Easiest)**

I've created a test script that sends 4 sample emails automatically.

#### **Step 1: Update Tenant ID**

**File:** `test-email-automation.js` (line 5)

```javascript
const TENANT_ID = '676d49be5ab4d8fef5d2c53d'; // ← Change this
```

**How to find your Tenant ID:**

```bash
# Open MongoDB shell
mongosh travel-crm

# Find your tenant
db.tenants.findOne({}, { _id: 1, name: 1 })

# Copy the _id value
```

Or use the default tenant ID from your `.env`:
```bash
DEFAULT_TENANT_ID=690ce93c464bf35e0adede29
```

#### **Step 2: Run Test Script**

```bash
# From project root
node test-email-automation.js
```

**What happens:**
1. Sends 4 test emails to webhook
2. AI processes them automatically
3. Shows results in terminal

**Sample test emails:**
- ✅ Dubai Honeymoon Inquiry (Customer)
- ✅ Bali Family Trip (Customer)
- ✅ Maldives Packages (Supplier)
- ✅ European Tour (Customer)

#### **Step 3: View Results in Dashboard**

1. **Open:** http://localhost:5174/emails
2. **Login** with your credentials
3. **See:** Processed emails with AI categorization

---

### **Method 2: Manual API Test (Postman/Curl)**

#### **Send Test Email:**

```bash
# Windows PowerShell
$body = @{
    from = "john@example.com"
    to = "travel@yourcompany.com"
    subject = "Dubai Honeymoon Package"
    text = @"
Hi, we're planning our honeymoon to Dubai. 
Looking for 7 days, luxury hotel, budget $6000 for 2 people.
We love water sports and fine dining!
"@
    tenantId = "690ce93c464bf35e0adede29"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/emails/webhook" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Response:**
```json
{
  "success": true,
  "message": "Email received and queued for processing",
  "emailId": "676d1234abcd5678ef90"
}
```

#### **Check Processing Status:**

```bash
# Get email details (replace {emailId} with actual ID)
curl http://localhost:5000/api/v1/emails/{emailId} `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### **Method 3: Frontend UI Test**

If you want to manually trigger processing:

1. **Go to:** http://localhost:5174/emails
2. **Click:** "Compose Email" or import email
3. **System processes automatically**

---

## 📊 What to Expect

### **Timeline:**

```
0s    - Email received
3s    - AI Categorization complete
8s    - Data Extraction complete
10s   - Package Matching complete
16s   - Response Generation complete
16s   - Ready for review (if high-value) or sent automatically
```

### **Console Output:**

```
📧 Received email: Dubai Honeymoon Package
🎯 Categorizing email...
✅ Category: CUSTOMER (95% confidence)
📝 Extracting data...
✅ Extracted: Dubai, 7 days, $6000, 2 adults
🔍 Matching packages...
✅ Found 3 matches (best: 92/100)
✍️  Generating response...
✅ Response generated
💰 Cost: $0.042
⏱️  Total time: 16 seconds
```

### **Database Check:**

```javascript
// Check EmailLog collection
db.emaillogs.findOne({ subject: /Dubai Honeymoon/ })

// Should see:
{
  _id: ObjectId("..."),
  from: { email: "john@example.com" },
  subject: "Dubai Honeymoon Package",
  category: "CUSTOMER",
  categoryConfidence: 95,
  processingStatus: "processed",
  extractedData: {
    destination: "Dubai",
    duration: { nights: 7 },
    budget: { amount: 6000 },
    // ... more
  },
  matchingResults: [
    { score: 92, packageId: "..." }
  ],
  openaiCost: 0.042
}
```

---

## 🎯 Testing Checklist

### **Basic Tests:**

- [ ] **Send customer inquiry** → Categorized as CUSTOMER
- [ ] **Send supplier package** → Categorized as SUPPLIER
- [ ] **Send spam email** → Categorized as SPAM
- [ ] **Check AI confidence** → Should be > 70%
- [ ] **Verify data extraction** → Destination, dates, budget extracted
- [ ] **Check package matching** → Finds relevant packages
- [ ] **View generated response** → Professional email created
- [ ] **Check cost tracking** → Cost logged in database

### **Advanced Tests:**

- [ ] **Low confidence email** → Goes to manual review queue
- [ ] **High-value inquiry ($10k)** → Goes to manual review
- [ ] **Missing information** → AI identifies gaps
- [ ] **Multiple destinations** → All extracted correctly
- [ ] **Wrong language** → Still processed (AI is multilingual)

---

## 🔍 Troubleshooting

### **Problem: "OpenAI not configured" error**

**Solution:**
1. Check `backend/.env` has `OPENAI_API_KEY=sk-...`
2. Key should start with `sk-proj-` or `sk-`
3. No spaces or quotes around key
4. Restart backend server

### **Problem: "Reached max retries" Redis error**

**Solution:**
- This is normal if Redis isn't running
- System uses in-memory queue as fallback
- Everything still works, just no persistence

### **Problem: "Failed to categorize email"**

**Check:**
1. OpenAI API key is valid
2. You have OpenAI credits
3. Check backend logs for error message
4. Test API key at: https://platform.openai.com/playground

### **Problem: Email stuck in "pending" status**

**Solution:**
```bash
# Check queue status
curl http://localhost:5000/api/v1/emails/stats

# Should show queue processing
{
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 5
  }
}
```

### **Problem: No packages matched**

**Reason:**
- You need supplier packages in database first
- Test script includes supplier package email
- Send supplier packages before customer inquiries

---

## 📝 Sample Test Scenarios

### **Test 1: Perfect Match**

**Step 1:** Send supplier package
```json
{
  "from": "supplier@hotels.com",
  "subject": "Dubai Luxury Package",
  "text": "7 nights Dubai, 5-star hotel, $5200, includes transfers and activities",
  "tenantId": "your-tenant-id"
}
```

**Step 2:** Send customer inquiry
```json
{
  "from": "customer@email.com",
  "subject": "Dubai vacation",
  "text": "Looking for 7 days in Dubai, luxury hotel, budget $6000",
  "tenantId": "your-tenant-id"
}
```

**Expected Result:**
- ✅ AI finds supplier package
- ✅ Match score: 90+/100
- ✅ Response includes package details

### **Test 2: No Match**

**Step 1:** Send customer inquiry for Bali
```json
{
  "from": "customer@email.com",
  "subject": "Bali vacation",
  "text": "Want to visit Bali for 10 days, budget $4000",
  "tenantId": "your-tenant-id"
}
```

**Expected Result:**
- ✅ AI categorizes as CUSTOMER
- ✅ Extracts destination (Bali)
- ❌ No packages matched
- ✅ Response: "Let me create custom package for you"

### **Test 3: High-Value Review**

**Send inquiry with >$5000 budget:**
```json
{
  "from": "vip@email.com",
  "subject": "Luxury Europe tour",
  "text": "Want 14-day luxury tour of Europe, budget $15000",
  "tenantId": "your-tenant-id"
}
```

**Expected Result:**
- ✅ Categorized as CUSTOMER
- ✅ Data extracted
- ⚠️  Sent to manual review queue (high value)
- 📋 Shows in review queue dashboard

---

## 💰 Monitor Costs

### **View Current Costs:**

```bash
# Get stats
curl http://localhost:5000/api/v1/emails/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "costs": {
    "totalCost": 2.45,
    "totalTokens": 150000,
    "avgCostPerEmail": 0.049
  }
}
```

### **Set Budget Alerts:**

Check your OpenAI dashboard:
- https://platform.openai.com/usage

Set monthly limit to avoid surprises.

---

## 🎓 Next Steps After Testing

Once testing works:

1. **Connect Real Email** - Set up email forwarding
2. **Add More Packages** - Import supplier packages
3. **Customize Templates** - Adjust response templates
4. **Train Team** - Show review queue to agents
5. **Monitor Performance** - Track accuracy and costs

---

## 📞 Quick Command Reference

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev

# Run test script
node test-email-automation.js

# Check MongoDB
mongosh travel-crm
db.emaillogs.find().limit(5)

# Check Redis (if installed)
redis-cli
KEYS *

# Test webhook
curl -X POST http://localhost:5000/api/v1/emails/webhook \
  -H "Content-Type: application/json" \
  -d '{"from":"test@test.com","subject":"Test","text":"Test email","tenantId":"YOUR_ID"}'
```

---

## ✅ Success Indicators

You'll know it's working when you see:

1. ✅ Email appears in `/emails` dashboard
2. ✅ Category badge shows (CUSTOMER/SUPPLIER/etc)
3. ✅ Confidence score > 70%
4. ✅ Extracted data section filled
5. ✅ Package matches shown (if available)
6. ✅ Generated response displayed
7. ✅ Cost tracked in stats
8. ✅ Processing time < 30 seconds

---

## 🆘 Need Help?

**Check logs:**
```bash
# Backend console shows:
✅ Email received: {emailId}
🎯 Categorizing...
✅ Category: CUSTOMER (95%)
...
```

**Check database:**
```javascript
// See what was saved
db.emaillogs.findOne({ _id: ObjectId("YOUR_EMAIL_ID") })
```

**Common issues:**
1. OpenAI key not set → Edit `.env`
2. No tenant ID → Check MongoDB for tenant
3. Redis errors → Ignore (has fallback)
4. OpenAI quota → Add payment method

---

**Ready to test?** Just add your OpenAI API key and run:

```bash
node test-email-automation.js
```

🚀 **Let's make it work!**
