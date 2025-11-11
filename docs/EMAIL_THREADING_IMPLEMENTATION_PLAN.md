# 📧 Email Threading & Reply Chain Implementation Plan

## 🎯 Current Status

### ✅ What's Working:
1. **SMTP Headers** - Correct threading headers included:
   ```javascript
   inReplyTo: email.messageId,
   references: [...email.references, email.messageId]
   ```
   - Email clients can link messages
   - Shows in conversation view

### ❌ What's Missing:
1. **Previous Email Content** - Reply doesn't include original message
2. **Visual Threading** - No quoted text formatting
3. **Conversation Context** - Customer has to scroll up to see their original question

## 📊 Problem

**Current Reply Format:**
```
Subject: Re: Tokyo Trip

Hi Customer,

Thank you for your inquiry! To help you better, we need:
- Travel dates
- Number of travelers

Best regards,
Travel Manager Pro
```

**Problem:** Customer doesn't see their original message quoted below. Looks like a standalone email, not a reply.

---

## ✅ Desired Reply Format

**With Proper Threading:**
```
Subject: Re: Tokyo Trip

Hi Keshav,

Thank you for your inquiry about Tokyo! To help you find the perfect 
package, we need a few more details:

1. **Travel Dates**: When would you like to travel?
2. **Number of Travelers**: How many adults will be traveling?

Looking forward to planning your trip!

Best regards,
Travel Manager Pro Team
---
On Nov 11, 2025 at 4:03 PM, Keshav Singh <keshav.singh4@gmail.com> wrote:

> Flying to Tokyo December 1-10, 2025. Need hotel and 
> activities. Budget $2000 per person.
```

---

## 🔧 Implementation Plan

### **Phase 1: Update Email Generation (AI Service)**

**File:** `backend/src/services/openaiService.js`

#### Changes Needed:

1. **Pass Original Email to AI**
   ```javascript
   async generateResponse(email, context, templateType, tenantId) {
     // Add original email to context
     const originalEmailQuoted = this.formatEmailAsQuote(email);
     
     // Include in AI prompt
     prompt += `\n\nOriginal Customer Email:\n${originalEmailQuoted}`;
   }
   ```

2. **Create Quote Formatter**
   ```javascript
   formatEmailAsQuote(email) {
     const date = new Date(email.receivedAt).toLocaleString();
     const from = email.from.name || email.from.email;
     
     // Format with quote markers
     const quotedBody = email.bodyText
       .split('\n')
       .map(line => `> ${line}`)
       .join('\n');
     
     return `On ${date}, ${from} <${email.from.email}> wrote:\n\n${quotedBody}`;
   }
   ```

3. **Update AI Prompt**
   ```javascript
   Instructions:
   - Generate professional response
   - Address customer by name
   - Include original email at bottom with quote markers
   - Use HTML <blockquote> for quoted text
   - Format: Your response + separator + quoted original
   ```

### **Phase 2: HTML Formatting**

**Enhanced Response Structure:**

```javascript
const htmlBody = `
<div style="font-family: Arial, sans-serif;">
  <!-- Your Response -->
  <div>
    ${aiGeneratedContent}
  </div>
  
  <!-- Separator -->
  <div style="border-top: 1px solid #ccc; margin: 20px 0;"></div>
  
  <!-- Original Email (Quoted) -->
  <div style="color: #666; font-size: 0.9em;">
    <p><strong>On ${date}, ${from} wrote:</strong></p>
    <blockquote style="border-left: 3px solid #ccc; padding-left: 15px; margin: 10px 0;">
      ${originalEmailHtml || originalEmailText}
    </blockquote>
  </div>
</div>
`;
```

### **Phase 3: Plain Text Version**

```javascript
const plainTextBody = `
${aiGeneratedPlainText}

---
On ${date}, ${from} <${email}> wrote:

${originalEmailText.split('\n').map(l => '> ' + l).join('\n')}
`;
```

---

## 📝 Detailed Implementation Steps

### **Step 1: Add Utility Function (openaiService.js)**

**Location:** Bottom of openaiService class

```javascript
/**
 * Format email as quoted reply
 */
formatEmailAsQuote(email, format = 'html') {
  const date = new Date(email.receivedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const from = email.from.name || email.from.email;
  const fromEmail = email.from.email;
  
  if (format === 'html') {
    const quotedBody = email.bodyHtml || 
      email.bodyText.replace(/\n/g, '<br>');
    
    return `
      <div style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px;">
        <p style="color: #666; font-size: 0.9em;">
          <strong>On ${date}, ${from} &lt;${fromEmail}&gt; wrote:</strong>
        </p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 15px; margin: 10px 0; color: #555;">
          ${quotedBody}
        </blockquote>
      </div>
    `;
  } else {
    // Plain text format
    const quotedBody = email.bodyText
      .split('\n')
      .map(line => '> ' + line)
      .join('\n');
    
    return `\n---\nOn ${date}, ${from} <${fromEmail}> wrote:\n\n${quotedBody}`;
  }
}
```

### **Step 2: Update generateResponse Method**

**Location:** `openaiService.js` line ~750

```javascript
async generateResponse(email, context, templateType, tenantId) {
  // ... existing code ...
  
  // Generate AI response
  const aiResponse = await this.callOpenAI(prompt, tenantId);
  
  // Parse response
  const parsed = JSON.parse(aiResponse);
  
  // Append quoted original email
  const quotedHtml = this.formatEmailAsQuote(email, 'html');
  const quotedPlain = this.formatEmailAsQuote(email, 'plain');
  
  return {
    subject: parsed.subject,
    body: parsed.body + quotedHtml,              // ← Add quoted email
    plainText: parsed.plainText + quotedPlain    // ← Add quoted email
  };
}
```

### **Step 3: Update AI Prompts**

**For ASK_CUSTOMER Template:**

```javascript
prompt = `Generate a friendly, professional email asking for missing information.

Customer Name: ${customerName}
Original Email: ${email.bodyText}

Missing Required Information:
${missingFieldsList}

Instructions:
- Greet customer warmly by name
- Thank them for their interest
- Briefly acknowledge what they mentioned
- Ask for missing information with clear questions
- Keep tone helpful and enthusiastic
- 150-200 words for YOUR response only
- DO NOT include the original email - it will be appended automatically

Respond with ONLY valid JSON:
{
  "subject": "Re: ${email.subject}",
  "body": "HTML email body WITHOUT quoted original",
  "plainText": "Plain text version WITHOUT quoted original"
}`;
```

### **Step 4: Conversation Threading**

**For Multi-Level Conversations:**

```javascript
formatConversationThread(email) {
  // Get all previous emails in thread
  const thread = await EmailLog.find({
    $or: [
      { messageId: { $in: email.references || [] } },
      { threadId: email.threadId }
    ]
  }).sort({ receivedAt: 1 });
  
  // Build thread HTML
  let threadHtml = '<div class="email-thread">';
  
  for (const msg of thread) {
    threadHtml += `
      <div style="border-left: 2px solid #ddd; padding-left: 10px; margin: 10px 0;">
        <p style="color: #666; font-size: 0.85em;">
          <strong>${msg.from.name}</strong> - ${new Date(msg.receivedAt).toLocaleString()}
        </p>
        <div>${msg.bodyHtml || msg.bodyText.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }
  
  threadHtml += '</div>';
  return threadHtml;
}
```

---

## 🎯 Implementation Priority

### **Phase 1 (Critical - Implement First):**
✅ **Basic Quote Inclusion**
- Add `formatEmailAsQuote()` utility
- Append quoted email to response body
- Works for both auto-reply and manual reply

### **Phase 2 (High Priority):**
✅ **HTML Formatting**
- Proper blockquote styling
- Visual separator
- Mobile-responsive design

### **Phase 3 (Medium Priority):**
✅ **Plain Text Version**
- Quote markers (>)
- Text separator (---)
- Fallback for non-HTML clients

### **Phase 4 (Future Enhancement):**
⏳ **Full Thread Display**
- Show entire conversation history
- Collapsible thread view
- Thread summary

---

## 📊 Expected Results

### **Before (Current):**
```
Email #1 (Customer): Tokyo trip inquiry
Email #2 (Auto-reply): Questions about dates ❌ No context
```
Customer sees: "What are they asking about?"

### **After (With Threading):**
```
Email #1 (Customer): Tokyo trip inquiry
Email #2 (Auto-reply): Questions about dates
                       ↓
                    [Original email quoted below]
```
Customer sees: "Oh right, they're asking about MY Tokyo trip!"

---

## 🧪 Testing Plan

1. **Send Test Email** → "I want to visit Paris"
2. **Verify Auto-Reply** → Should include:
   ```
   Thank you for your inquiry!
   [Questions about missing info]
   
   ---
   On Nov 11, 2025, you wrote:
   > I want to visit Paris
   ```

3. **Customer Replies** → "I want to go Jan 15-20"
4. **Second Auto-Reply** → Should show full thread:
   ```
   Great! Here are matching packages...
   
   ---
   On Nov 11, 2025, you wrote:
   > I want to go Jan 15-20
   
   On Nov 11, 2025, you wrote:
   > I want to visit Paris
   ```

---

## ✅ Benefits

1. **Better UX** - Customer always sees context
2. **Professional** - Standard email reply format
3. **Threading** - Works in all email clients
4. **Conversation Flow** - Clear back-and-forth
5. **Mobile Friendly** - Readable on phones

---

## 🚀 Implementation Timeline

- **Step 1-2:** 15 minutes (Add utility + update method)
- **Step 3:** 10 minutes (Update prompts)
- **Testing:** 10 minutes
- **Total:** ~35 minutes

**Ready to implement?** This will make your auto-replies look much more professional and provide better context for customers! 🎉
