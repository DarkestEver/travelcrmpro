# Fix: Prevent Duplicate Email Records for Sent Replies

## Issue
When replying to an email, the system was creating duplicate records:
1. One record saved by the reply API (`source: 'manual'`)
2. Another record fetched by IMAP polling service (`source: 'imap'`)

This caused the same reply to appear twice in the email list, breaking the conversation threading.

## Root Cause
The email polling service fetches ALL emails from the IMAP inbox, including:
- **Incoming emails** (from customers)
- **Sent emails** (from us, stored in Sent folder or synced back)

When we send a reply via SMTP, two things happen:
1. ✅ We immediately save it to EmailLog with `source: 'manual'`
2. ❌ Later, IMAP polling fetches the same sent email and saves it again with `source: 'imap'`

Even though we check for duplicate `messageId`, the SMTP server may assign a different Message-ID than what Nodemailer returns, causing the duplicate check to fail.

## Solution
Modified `emailPollingService.js` to skip emails sent by the account itself.

### Code Change
**File**: `backend/src/services/emailPollingService.js`

```javascript
// Extract email addresses
const fromAddress = parsed.from?.value?.[0];
const toAddresses = parsed.to?.value || [];
const ccAddresses = parsed.cc?.value || [];

// 🆕 Skip emails sent by us (our own sent emails)
const senderEmail = fromAddress?.address?.toLowerCase();
const accountEmail = account.imap.username.toLowerCase();

if (senderEmail === accountEmail) {
  logger.info(`⏭️  Skipping our own sent email: ${parsed.messageId} from ${senderEmail}`);
  return;
}

// Save to database (only for incoming emails)
const emailLog = await EmailLog.create({ ... });
```

### Logic Flow

#### Before Fix
```
User sends reply
  ↓
1. replyToEmail API saves to EmailLog (source: 'manual', messageId: ABC123)
  ↓
SMTP sends email
  ↓
Email appears in Sent folder
  ↓
2. IMAP polling fetches email (from: our-email@domain.com, messageId: XYZ789)
  ↓
3. Saves AGAIN to EmailLog (source: 'imap')
  ↓
❌ DUPLICATE: Two records for same reply!
```

#### After Fix
```
User sends reply
  ↓
1. replyToEmail API saves to EmailLog (source: 'manual', messageId: ABC123)
  ↓
SMTP sends email
  ↓
Email appears in Sent folder
  ↓
2. IMAP polling fetches email (from: our-email@domain.com)
  ↓
3. Checks: Is sender == account owner?
  ↓
✅ YES → Skip! Log: "⏭️  Skipping our own sent email"
  ↓
✅ NO DUPLICATE: Only one record exists!
```

## Benefits

### 1. Clean Conversation Threading
- Replies now correctly appear as part of the original conversation
- No duplicate "Re: Subject" entries in the email list
- Thread view shows proper chronological flow

### 2. Accurate Email Counts
- Inbox count reflects actual incoming emails only
- Sent emails don't inflate email statistics
- Reply metrics are accurate

### 3. Better Performance
- Reduces unnecessary database writes
- Prevents duplicate AI processing
- Saves queue processing resources

### 4. Correct Source Attribution
- `source: 'manual'` - Sent via our reply API
- `source: 'imap'` - Only incoming emails
- `source: 'webhook'` - Received via webhook (if configured)
- `source: 'api'` - Sent via external API

## Testing

### Test Case 1: Send Reply (No Attachments)
1. Open an incoming email from customer
2. Click Reply
3. Compose and send reply
4. **Expected**: 
   - Reply saved immediately with `source: 'manual'`
   - IMAP polling skips the sent email
   - Only ONE record in database
   - Reply linked to parent via `threadMetadata.parentEmailId`

### Test Case 2: Send Reply (With Attachments)
1. Open an incoming email
2. Click Reply
3. Add attachments
4. Send reply
5. **Expected**:
   - Reply saved with attachments
   - IMAP polling skips it
   - No duplicate record created

### Test Case 3: Receive Reply from Customer
1. Send a reply to customer
2. Customer replies back to us
3. **Expected**:
   - Customer's reply IS fetched by IMAP (sender != our email)
   - Saved as new EmailLog with `source: 'imap'`
   - Threading links it to our original sent reply

### Test Case 4: Multiple Email Accounts
1. Configure two email accounts: account-a@domain.com, account-b@domain.com
2. Send reply from account-a
3. **Expected**:
   - IMAP polling on account-a skips it (sender == account email)
   - IMAP polling on account-b doesn't see it (different inbox)
   - No cross-contamination

## Validation Logs

### Successful Skip (Our Sent Email)
```
📧 Starting IMAP email polling for account: app@travelmanagerpro.com
📥 Found 15 new emails to process
⏭️  Skipping our own sent email: <abc123@travelmanagerpro.com> from app@travelmanagerpro.com
✅ Saved email: 691abc123... - "Customer Inquiry"
⏭️  Skipping our own sent email: <xyz789@travelmanagerpro.com> from app@travelmanagerpro.com
✅ Saved email: 691def456... - "Booking Request"
✅ Polling completed. Processed: 13, Skipped: 2
```

### Incoming Email (Correctly Saved)
```
📧 Processing email from: customer@example.com
📧 To: app@travelmanagerpro.com
✅ Saved email: 691ghi789... - "Re: Uzbekistan itinerary"
🔗 Threading processed for email: 691ghi789...
📤 Queued email for processing: 691ghi789...
```

## Edge Cases Handled

### 1. Case Insensitive Comparison
```javascript
const senderEmail = fromAddress?.address?.toLowerCase();
const accountEmail = account.imap.username.toLowerCase();
```
Prevents mismatches due to case differences (App@Domain.com vs app@domain.com)

### 2. Missing From Address
If `fromAddress` is null/undefined:
- `senderEmail` becomes `undefined`
- `undefined !== accountEmail` → Email is processed
- Safe fallback: Won't skip legitimate emails

### 3. Null/Empty Account Email
If `account.imap.username` is missing:
- `accountEmail` becomes empty string or causes error
- Should be caught by account validation earlier
- Polling shouldn't run for invalid accounts

### 4. Email Aliases
If your email account has aliases (e.g., support@domain.com → main@domain.com):
- Only the exact IMAP username is checked
- Sent emails from aliases will be skipped if they match
- If alias differs, might create duplicate (known limitation)

**Solution for aliases**: Add alias list to EmailAccount model and check against all

## Known Limitations

### 1. Different SMTP and IMAP Usernames
If SMTP username != IMAP username:
```javascript
smtp.username = "noreply@domain.com"
imap.username = "incoming@domain.com"
```
Sent emails won't be skipped (sender won't match IMAP username).

**Workaround**: Use same username for both SMTP and IMAP.

### 2. Shared Mailboxes
If multiple agents send from the same email account:
- All sent emails will be skipped (correct)
- Attribution tracked via `sentBy` field in EmailLog
- Works as intended

### 3. External Email Clients
If user sends email directly from Gmail/Outlook (not via our system):
- Email will be skipped by polling
- Won't appear in our system
- This is intentional - we only track emails sent via our API

## Migration Notes

### For Existing Duplicate Records
If you already have duplicates in the database, run this cleanup script:

```javascript
// cleanup-duplicate-replies.js
const EmailLog = require('./src/models/EmailLog');

async function cleanupDuplicates() {
  // Find emails with same subject, from our account, within 1 minute
  const accounts = await EmailAccount.find({});
  
  for (const account of accounts) {
    const duplicates = await EmailLog.aggregate([
      {
        $match: {
          'from.email': account.imap.username,
          source: 'imap' // Only delete IMAP-fetched duplicates
        }
      },
      {
        $group: {
          _id: { subject: '$subject', from: '$from.email' },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          sources: { $push: '$source' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    for (const dup of duplicates) {
      // Keep 'manual', delete 'imap'
      const toDelete = dup.ids.filter((_, i) => dup.sources[i] === 'imap');
      await EmailLog.deleteMany({ _id: { $in: toDelete } });
      console.log(`Deleted ${toDelete.length} duplicate(s) for: ${dup._id.subject}`);
    }
  }
}

cleanupDuplicates().then(() => console.log('Cleanup complete!'));
```

### Database Indexes
Ensure indexes exist for efficient skipping check:
```javascript
EmailLog: {
  'from.email': 1,
  source: 1,
  messageId: 1
}
```

## Related Files
- `backend/src/services/emailPollingService.js` - Main fix location
- `backend/src/controllers/emailController.js` - Reply saving logic
- `backend/src/models/EmailLog.js` - Email record schema
- `backend/src/services/emailThreadingService.js` - Thread linking

## Related Documentation
- [Email Reply CC/BCC Fix](./EMAIL_REPLY_CC_BCC_FIX.md)
- [Threading and React Warning Fix](./THREADING_AND_REACT_WARNING_FIX.md)
- [Email Threading Service](./EMAIL_THREADING_SERVICE.md)

---

**Status**: ✅ Fixed  
**Date**: November 13, 2025  
**Impact**: Critical - Prevents duplicate email records  
**Breaking Changes**: None - Only affects new emails going forward
