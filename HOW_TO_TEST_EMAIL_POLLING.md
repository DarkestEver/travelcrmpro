# 🧪 How to Test Email Polling - Step by Step

**Email Sent To:** app@travelmanagerpro.com  
**Subject:** test

---

## ✅ **Step 1: Watch Server Logs**

The IMAP polling runs **every 2 minutes**. Look at your backend terminal.

### **What You Should See (within 2 minutes):**

```
⏰ Email polling cron job triggered
🔄 Polling 1 email account(s)...
📬 Polling emails for: app@travelmanagerpro.com
📨 Found 1 unread email(s) for app@travelmanagerpro.com
✅ Saved email: 673xxxxx - "test"
📤 Queued email for processing: 673xxxxx
✅ Fetched 1 new email(s) from app@travelmanagerpro.com
✅ Email polling cycle complete
```

### **Then Email Processing:**

```
Processing email 673xxxxx
🤖 Starting AI categorization for email: test
Category: CUSTOMER
Confidence: 95%
✅ Quote created from email: QT-20251110-001
```

---

## ✅ **Step 2: Check Frontend**

Open your Travel CRM admin panel:

1. **Go to Emails page** → You should see:
   - Subject: "test"
   - Source: IMAP
   - Status: completed or converted_to_quote

2. **Go to Quotes page** → You should see:
   - New quote created from the email
   - Customer email from the sender

3. **Go to Email Accounts page** → Check:
   - Last Fetch: Should show recent timestamp
   - Last Status: success
   - Emails Received: Should increment by 1

---

## ✅ **Step 3: Check Database (Optional)**

If you have MongoDB Compass or similar:

```javascript
// Find the email
db.emaillogs.find({ 
  subject: "test",
  source: "imap" 
}).sort({ receivedAt: -1 }).limit(1)

// Should show:
{
  "_id": "673xxxxx",
  "subject": "test",
  "from": { "email": "your-sender-email@domain.com" },
  "to": [{ "email": "app@travelmanagerpro.com" }],
  "source": "imap",  // ← Confirms it was fetched via IMAP
  "processingStatus": "completed",
  "quoteId": "673yyyyy",  // ← Quote was created
  "receivedAt": "2025-11-10T..."
}
```

---

## ⏱️ **Timeline:**

| Time | What Happens |
|------|-------------|
| **0:00** | You send email to app@travelmanagerpro.com |
| **0:00-2:00** | Email sits in inbox, waiting for next poll |
| **2:00** | 🔄 Cron job triggers |
| **2:01** | 📨 Email fetched from IMAP |
| **2:02** | 💾 Email saved to database |
| **2:03** | 📤 Added to processing queue |
| **2:04** | 🤖 AI processes email |
| **2:05** | 💼 Quote created |
| **2:06** | ✅ Customer receives acknowledgment email |

**Total time:** Up to 2 minutes (depending on when you sent it)

---

## 🔍 **If Email Not Found After 2 Minutes:**

### **Check 1: Server Logs**

Look for errors:
```
❌ Error polling app@travelmanagerpro.com: Authentication failed
❌ IMAP connection error: AUTHENTICATIONFAILED
```

### **Check 2: Email Account Configuration**

Make sure:
- ✅ `autoFetch: true`
- ✅ `isActive: true`
- ✅ IMAP credentials correct
- ✅ IMAP enabled in email provider

### **Check 3: Email Location**

- ✅ Email in **INBOX** (not spam/junk)
- ✅ Email is **UNREAD** (polling only fetches unread)
- ✅ Sent to correct address

### **Check 4: IMAP Settings**

For Gmail:
- Enable IMAP in Gmail settings
- Use App Password (not regular password)
- Allow "Less secure apps" if needed

### **Check 5: Firewall/Network**

- Port 993 (IMAP SSL) not blocked
- Server can reach email provider

---

## 📊 **Quick Status Check (Via Frontend)**

### **Option 1: Email Accounts Page**

```
Admin Panel → Settings → Email Accounts → Click on app@travelmanagerpro.com
```

Check:
- **Last Fetch At:** Should be recent (within last 2 minutes)
- **Last Fetch Status:** Should be "success"
- **Last Fetch Error:** Should be empty/null
- **Stats → Emails Received:** Should increment

### **Option 2: Emails Page**

```
Admin Panel → Communications → Emails → Filter by Source: IMAP
```

You should see your "test" email listed.

### **Option 3: Quotes Page**

```
Admin Panel → Sales → Quotes → Sort by Date (newest first)
```

If email had travel inquiry content, a quote should be created.

---

## 🎯 **Success Indicators**

✅ **Server Logs Show:**
- "Found 1 unread email(s)"
- "Saved email: xxx - 'test'"
- "Queued email for processing"

✅ **Frontend Shows:**
- Email appears in Emails list
- Source is "IMAP"
- Processing status is "completed"

✅ **Email Account Shows:**
- Last Fetch status: "success"
- Last Fetch timestamp: Recent
- Emails Received count increased

---

## 💡 **What Happens Next?**

After email is fetched:

1. **Email Saved** → EmailLog in database
2. **Queue Added** → Processing queue (Bull/Redis)
3. **AI Processing** → Categorizes email (CUSTOMER/SUPPLIER/etc)
4. **Data Extraction** → Extracts trip details if present
5. **Quote Creation** → Creates quote if it's a customer inquiry
6. **Customer Reply** → Sends acknowledgment email
7. **Operator Notification** → Notifies operators via WebSocket

---

## 🔁 **To Test Again:**

1. **Send another email** to app@travelmanagerpro.com
2. **Wait up to 2 minutes**
3. **Watch server logs** for polling activity
4. **Check frontend** for new email

---

## 📝 **Best Practices for Testing:**

### **Test Email 1: Simple Test**
```
Subject: Test Email
Body: This is a simple test.
```
**Expected:** Email fetched, no quote created (not a travel inquiry)

### **Test Email 2: Travel Inquiry**
```
Subject: Dubai Holiday Package Inquiry
Body:
Hi, I'm interested in a 5-day trip to Dubai for 2 adults.
Dates: December 15-20, 2025
Budget: $3,000
Please send me a quote.
Thanks!
```
**Expected:** Email fetched, quote auto-created, customer gets reply

### **Test Email 3: With Attachment**
```
Subject: Flight Booking Request
Body: Please book these flights.
Attachment: flight-details.pdf
```
**Expected:** Email fetched with attachment, needs manual review

---

## ⚙️ **Troubleshooting Commands**

### **Restart Server:**
```bash
# In backend terminal, press Ctrl+C, then:
npm run dev
```

### **Check MongoDB:**
```bash
# Show recent emails
mongo
use travel-crm
db.emaillogs.find().sort({receivedAt: -1}).limit(5)
```

### **View Server Logs:**
```bash
# In backend directory
tail -f logs/combined.log  # If logging to file
```

---

## 🎉 **Summary**

**To test your email:**

1. ✅ **Sent email** to app@travelmanagerpro.com ✓
2. ⏳ **Wait 0-2 minutes** for next polling cycle
3. 👀 **Watch server logs** for polling activity
4. ✅ **Check frontend** Emails page for your email
5. ✅ **Verify** source shows as "IMAP"

**If it works, you'll see it within 2 minutes!** 🚀

---

**Current Status:**  
⏳ Waiting for next polling cycle (runs every 2 minutes)  
📧 Email: app@travelmanagerpro.com  
🔄 Polling: Automatic  
⏰ Next check: Within 2 minutes  

**Just watch your backend server logs!** 👀
