# Email Conversation Workflow - Complete Guide

## Overview
The system supports **multi-level back-and-forth email conversations** with intelligent AI-first responses and manual override capability from UI.

---

## 🔄 Complete Conversation Flow

### Level 1: Initial Customer Email

```
Customer → sends email → IMAP polling detects → AI processes
                                                    ↓
                                    AI auto-replies (if not manually replied)
```

**What happens:**
1. ✅ IMAP polls every 2 minutes, fetches email
2. ✅ AI categorizes (CUSTOMER, SUPPLIER, etc.)
3. ✅ AI extracts travel details
4. ✅ AI detects missing info (if any)
5. ✅ AI generates appropriate response
6. ✅ **Auto-sends reply** (unless UI operator already replied manually)

### Level 2: Customer Reply #1

```
Customer → replies with more info → IMAP detects → AI processes again
                                                         ↓
                                         AI auto-replies (unless manually overridden)
```

**Email threading:**
- Reply has `inReplyTo: <original-message-id>`
- System links emails via `messageId` → `inReplyTo` chain
- Full conversation history maintained in database

### Level 3: Customer Reply #2 (and beyond)

```
Customer → replies again → IMAP detects → AI processes
                                              ↓
                              AI auto-replies OR human takes over from UI
```

**Unlimited back-and-forth** until:
- ✅ All info collected
- ✅ Package/itinerary sent
- ✅ Booking confirmed
- OR manual intervention from UI

---

## 🎛️ Manual Override from UI

### When Operator Replies Manually:

**API Endpoint:**
```
POST /api/v1/emails/:id/reply
Authorization: Bearer <token>

{
  "subject": "Re: Your Bali Trip Inquiry",
  "body": "<p>Hi John, I personally reviewed your request...</p>",
  "plainText": "Hi John, I personally reviewed your request..."
}
```

**What happens:**
1. ✅ Email sent immediately to customer
2. ✅ Database updated:
   ```javascript
   {
     manuallyReplied: true,
     responseType: 'manual',
     responseSentAt: new Date(),
     repliedBy: userId,
     processingStatus: 'completed'
   }
   ```
3. ✅ **AI auto-reply is SKIPPED** for this email
4. ✅ Conversation continues - next customer reply triggers AI again (unless manually replied again)

---

## 📊 Database Schema

### EmailLog Collection

```javascript
{
  _id: "email-001",
  messageId: "<abc123@customer.com>",
  inReplyTo: "<prev-msg@travelcrm.com>",  // Links to previous email
  references: ["<msg1>", "<msg2>"],        // Full thread history
  
  from: { email: "customer@email.com", name: "John Doe" },
  subject: "Re: Bali Trip Inquiry",
  bodyText: "Thanks! We have 2 kids ages 8 and 12...",
  
  // AI Processing
  category: "CUSTOMER",
  extractedData: {
    destination: "Bali",
    travelers: { adults: 2, children: 2, childAges: [8, 12] },
    missingInfo: []  // Empty means complete
  },
  
  // Response Tracking
  generatedResponse: {
    subject: "Perfect! Here are your Bali itineraries",
    body: "<html>...",
    plainText: "...",
    // If manual reply:
    manualReply: {
      subject: "...",
      body: "...",
      sentAt: "2025-11-11T15:00:00Z",
      sentBy: "690c2fbf3388216b98feb91f"
    }
  },
  
  // Response Status
  responseType: "auto" | "manual" | "none",
  responseSentAt: "2025-11-11T14:50:00Z",
  responseId: "<response-123@travelcrm.com>",
  
  // Manual Override
  manuallyReplied: false,  // ← KEY FIELD!
  repliedBy: ObjectId("user-id"),
  
  // Processing
  aiProcessed: true,
  processingStatus: "completed",
  processedAt: "2025-11-11T14:49:00Z"
}
```

---

## 🤖 AI Auto-Reply Decision Logic

### In `emailProcessingQueue.js` - Step 6:

```javascript
// Generate response
const response = await openaiService.generateResponse(...);
email.generatedResponse = response;
await email.save();

// Check if manually replied
if (email.manuallyReplied) {
  console.log('⏭️  Skipping auto-reply - email was manually replied');
  return { status: 'completed', reason: 'Manually replied - skipped' };
}

// Auto-send
await emailService.sendEmail({
  to: email.from.email,
  subject: response.subject,
  html: response.body
});

email.responseType = 'auto';
email.responseSentAt = new Date();
await email.save();
```

**Logic:**
- AI **always generates** a response (for review/reference)
- AI **only sends** if `manuallyReplied === false`
- Operator can preview AI response in UI before deciding to:
  - ✅ Let AI send it (do nothing)
  - ✅ Modify and send manually
  - ✅ Write completely custom reply

---

## 🔗 Email Threading & Conversation History

### How It Works:

1. **Email #1** (Customer):
   ```javascript
   {
     messageId: "<email1@customer.com>",
     inReplyTo: null,
     references: []
   }
   ```

2. **Email #2** (AI Reply):
   ```javascript
   {
     messageId: "<reply1@travelcrm.com>",
     inReplyTo: "<email1@customer.com>",
     references: ["<email1@customer.com>"]
   }
   ```

3. **Email #3** (Customer Reply):
   ```javascript
   {
     messageId: "<email3@customer.com>",
     inReplyTo: "<reply1@travelcrm.com>",
     references: ["<email1@customer.com>", "<reply1@travelcrm.com>"]
   }
   ```

4. **Email #4** (Manual Reply from UI):
   ```javascript
   {
     messageId: "<reply2@travelcrm.com>",
     inReplyTo: "<email3@customer.com>",
     references: ["<email1@customer.com>", "<reply1@travelcrm.com>", "<email3@customer.com>"],
     manuallyReplied: true,
     repliedBy: "operator-user-id"
   }
   ```

### Query Full Conversation:

```javascript
// Get all emails in thread
const thread = await EmailLog.find({
  $or: [
    { messageId: threadId },
    { inReplyTo: threadId },
    { references: threadId }
  ]
}).sort({ receivedAt: 1 });
```

---

## 📋 Workflow Summary

| Level | Trigger | AI Action | Manual Override | Auto-Send |
|-------|---------|-----------|-----------------|-----------|
| **1st email** | Customer inquiry | Extract + Categorize + Generate response | ✅ Can reply from UI | ✅ Yes (unless manual) |
| **2nd email** | Customer reply #1 | Re-extract + Generate response | ✅ Can reply from UI | ✅ Yes (unless manual) |
| **3rd email** | Customer reply #2 | Re-extract + Generate response | ✅ Can reply from UI | ✅ Yes (unless manual) |
| **Nth email** | Customer reply #N | Re-extract + Generate response | ✅ Can reply from UI | ✅ Yes (unless manual) |

---

## 🎯 Key Features

1. ✅ **Unlimited conversation depth** - AI handles all levels
2. ✅ **Smart threading** - Full conversation history via `inReplyTo` + `references`
3. ✅ **Manual override** - Operator can take over anytime from UI
4. ✅ **AI generates always** - Response available for review even if not sent
5. ✅ **Auto-skip logic** - If manually replied, AI won't send duplicate
6. ✅ **Historical tracking** - Both auto and manual replies stored
7. ✅ **No conflicts** - Clear flags prevent double-sending

---

## 🔧 API Endpoints

### 1. List Emails with Conversation Threading
```
GET /api/v1/emails?includeThread=true
```

### 2. Get Single Email with Thread
```
GET /api/v1/emails/:id?includeThread=true
```

### 3. Manual Reply (Manual Override)
```
POST /api/v1/emails/:id/reply
{
  "subject": "Re: ...",
  "body": "<html>...",
  "plainText": "..."
}
```

### 4. Preview AI Response (Before Sending)
```
GET /api/v1/emails/:id
Response includes: { generatedResponse: {...} }
```

### 5. Retry AI Processing
```
POST /api/v1/emails/:id/retry
```

---

## 🎨 UI Implementation Suggestions

### Email Detail Page:

```
┌─────────────────────────────────────────────────┐
│  Email: Bali Trip Inquiry                       │
│  From: customer@email.com                       │
│  Status: ✅ Processed | 🤖 Auto-replied         │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Original Email Content]                       │
│                                                 │
├─────────────────────────────────────────────────┤
│  💡 AI Generated Response (Sent):               │
│                                                 │
│  [Show AI response that was sent]               │
│                                                 │
├─────────────────────────────────────────────────┤
│  📧 Conversation Thread (3 emails):             │
│  ├─ 1. Customer: "Looking for Bali trip..."    │
│  ├─ 2. AI Reply: "Great! A few questions..."   │
│  └─ 3. Customer: "Here are the ages..."        │
├─────────────────────────────────────────────────┤
│  [Reply Manually]  [View Full Thread]          │
└─────────────────────────────────────────────────┘
```

### Reply Modal:

```
┌─────────────────────────────────────────────────┐
│  Reply to customer@email.com                    │
├─────────────────────────────────────────────────┤
│  AI Suggested Response:                         │
│  [Show AI generated text]                       │
│  [Use This] [Modify]                            │
├─────────────────────────────────────────────────┤
│  Subject: Re: Bali Trip Inquiry                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [Rich Text Editor]                       │   │
│  │                                           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Cancel]  [Send Reply]                        │
└─────────────────────────────────────────────────┘
```

---

## ✅ Summary

**Only 1st level (initial processing) is AI-automatic. But:**
- AI processes **all levels** of conversation
- AI generates responses for **all levels**
- AI auto-sends **unless manually overridden**
- Operators can take over **at any level** from UI
- System maintains **full conversation history**
- No duplicate sends - smart conflict prevention

**Result:** Hybrid AI + Human workflow that scales!
