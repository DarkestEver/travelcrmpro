# System Email Filtering

## Overview
Prevents processing and replying to system emails like spam, undelivered messages, and auto-replies.

## Problem
- System was processing spam, mail delivery failures, and auto-replies
- Users could reply to "mailer-daemon" and "noreply@" addresses
- Created unnecessary email records in database
- Wasted processing resources on non-customer emails

## Solution

### 1. Email Type Classification
Added `emailType` field to EmailLog model:
```javascript
emailType: {
  type: String,
  enum: ['customer', 'system', 'spam', 'undelivered', 'autoreply'],
  default: 'customer',
  index: true
}
```

### 2. IMAP Polling Filters
In `emailPollingService.js`, added comprehensive filtering:

```javascript
// Skip system emails
const systemEmailPatterns = [
  'mail delivery',
  'delivery status notification',
  'undelivered mail returned to sender',
  'returned mail',
  'failure notice',
  'delivery failure',
  'mail system error',
  'postmaster',
  'mailer-daemon',
  'auto-reply',
  'automatic reply',
  'out of office',
  'vacation reply'
];

const isSystemEmail = 
  systemEmailPatterns.some(pattern => subject.includes(pattern)) ||
  senderEmail?.includes('mailer-daemon') ||
  senderEmail?.includes('postmaster') ||
  senderEmail === 'noreply@' ||
  senderEmail?.startsWith('noreply');

if (isSystemEmail) {
  logger.info(`🚫 Skipping system/automated email: "${subject}" from ${senderEmail}`);
  return;
}
```

### 3. Reply Prevention (Backend)
In `emailController.js`, added validation:

```javascript
// Prevent replies to system emails
if (email.emailType && email.emailType !== 'customer') {
  return res.status(400).json({
    success: false,
    message: `Cannot reply to ${email.emailType} emails`
  });
}

// Additional checks for system-like subjects
const systemIndicators = [
  'mail delivery',
  'undelivered mail',
  'returned mail',
  'delivery failure',
  'mailer-daemon',
  'postmaster',
  'noreply'
];

const isSystemEmail = systemIndicators.some(indicator => 
  emailSubject.includes(indicator) || fromEmail.includes(indicator)
);

if (isSystemEmail) {
  return res.status(400).json({
    success: false,
    message: 'Cannot reply to system or automated emails'
  });
}
```

### 4. UI Reply Button Disabled
In `EmailDetail.jsx`, hide Reply button for system emails:

```javascript
// Helper function
const isSystemEmail = (email) => {
  if (!email) return false;
  
  if (email.emailType && email.emailType !== 'customer') {
    return true;
  }
  
  const subject = email.subject?.toLowerCase() || '';
  const fromEmail = email.from?.email?.toLowerCase() || '';
  const systemIndicators = [
    'mail delivery',
    'undelivered mail',
    'mailer-daemon',
    'postmaster',
    'noreply'
  ];
  
  return systemIndicators.some(indicator => 
    subject.includes(indicator) || fromEmail.includes(indicator)
  );
};

// Conditional render
{email.category === 'CUSTOMER' && !isSystemEmail(email) && (
  <button onClick={handleOpenReplyModal}>Reply</button>
)}

{isSystemEmail(email) && (
  <div className="bg-yellow-100 text-yellow-800">
    System email - Replies disabled
  </div>
)}
```

## Filtered Email Types

### 1. Mail Delivery Failures
- Subject contains: "mail delivery", "delivery status notification", "undelivered mail"
- From: mailer-daemon@, postmaster@
- Reason: Cannot reply to system error messages

### 2. Auto-Replies
- Subject contains: "auto-reply", "automatic reply", "out of office", "vacation reply"
- Reason: No human will see the response

### 3. No-Reply Addresses
- From: noreply@example.com, no-reply@example.com
- Reason: Mailbox doesn't accept incoming mail

### 4. Spam/System Messages
- Categorized by AI as spam
- emailType: 'spam', 'system', 'autoreply'
- Reason: Prevent processing malicious/irrelevant content

## Benefits
1. ✅ **Reduced Database Clutter** - No system email records
2. ✅ **Better User Experience** - Reply button only shown for valid emails
3. ✅ **Resource Efficiency** - No wasted AI processing on system messages
4. ✅ **Error Prevention** - Users can't accidentally reply to mailer-daemon
5. ✅ **Clean Inbox** - Only real customer emails processed

## Testing

### Test Cases
1. **Delivery Failure Email**
   - Subject: "Undelivered Mail Returned to Sender"
   - Expected: Skipped by IMAP, not saved to database

2. **Out of Office Reply**
   - Subject: "Automatic reply: I'm on vacation"
   - Expected: Skipped by IMAP, not saved to database

3. **No-Reply Address**
   - From: noreply@company.com
   - Expected: Skipped by IMAP, not saved to database

4. **Valid Customer Email**
   - From: customer@example.com
   - Subject: "Travel inquiry"
   - Expected: Processed normally, Reply button visible

## Monitoring
Check logs for filtered emails:
```
🚫 Skipping system/automated email: "Undelivered Mail Returned to Sender" from mailer-daemon@gmail.com
⏭️  Skipping our own sent email: message-id from travel@agency.com
```

## Future Enhancements
- Add admin UI to manage system email patterns
- Allow whitelisting specific auto-reply addresses
- Add machine learning to detect new system email patterns
- Collect metrics on filtered emails (spam rate, bounce rate)
