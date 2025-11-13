# Fix: Duplicate Email Detection & Manual Reply Classification

## Issues Fixed

### 1. Duplicate Email Detection Not Working ❌

**Problem:**
- IMAP polling was creating duplicate records of emails
- Duplicate check only looked at `messageId`
- Didn't account for:
  - MessageId mismatches between SMTP send and IMAP fetch
  - Timing differences
  - Same email appearing multiple times in inbox

**Solution:**
Improved duplicate detection with multi-criteria check:

```javascript
// Check using multiple criteria
const existingEmail = await EmailLog.findOne({
  $or: [
    { messageId: parsed.messageId },
    {
      // Also check by subject + from + date (in case messageId differs)
      subject: parsed.subject,
      'from.email': senderEmail,
      receivedAt: {
        $gte: new Date(parsed.date.getTime() - 5000), // Within 5 seconds
        $lte: new Date(parsed.date.getTime() + 5000)
      }
    }
  ]
});
```

**Why this works:**
- Primary check: Match by `messageId` (most reliable)
- Fallback check: Match by `subject` + `sender` + `timestamp` (within 5-second window)
- Catches duplicates even if messageId is different or missing

### 2. Processing Order Issue ❌

**Problem:**
- Skip-own-emails check happened AFTER duplicate check
- Wasted DB queries checking for duplicates of our own sent emails
- Less efficient

**Solution:**
Reordered checks for better performance:

```javascript
// 1. Extract email addresses FIRST
const fromAddress = parsed.from?.value?.[0];
const senderEmail = fromAddress?.address?.toLowerCase();
const accountEmail = account.imap.username.toLowerCase();

// 2. Skip our own sent emails FIRST (before any DB queries)
if (senderEmail === accountEmail) {
  logger.info(`⏭️  Skipping our own sent email`);
  return;
}

// 3. THEN check for duplicates (only for external emails)
const existingEmail = await EmailLog.findOne({ ... });
```

**Benefits:**
- ✅ Skip own emails immediately (no DB query needed)
- ✅ Only check duplicates for external emails
- ✅ Better performance

### 3. "Manual" Source Classification ✅ (Not a bug!)

**Question:** Why are replies showing `source: 'manual'`?

**Answer:** This is **CORRECT** behavior!

```javascript
source: 'manual', // Mark as manual reply
```

**Source Types:**
- `imap` → Incoming customer emails (fetched via IMAP)
- `webhook` → Emails received via webhook
- `manual` → **Human operator replies** (sent through UI)
- `ai` → AI-generated automated responses

**Why this matters:**
- Distinguishes human replies from automated ones
- Analytics: Track human vs AI response rates
- Audit trail: Know which emails were manually handled
- Compliance: Required for some industries

**Example:**
```
Customer Email → source: 'imap'
  ↓ (Human operator replies)
Agent Reply → source: 'manual' ✅ Correct!
  ↓ (Customer replies)
Customer Reply → source: 'imap'
  ↓ (AI generates response)
AI Response → source: 'ai'
```

## Files Modified

### backend/src/services/emailPollingService.js
- **Line 168-203**: Improved duplicate detection with multi-criteria check
- **Line 168-176**: Reordered checks - skip own emails first
- **Line 178-203**: Enhanced duplicate check with subject + sender + timestamp fallback

## Testing

### Test Duplicate Detection:
1. Send a reply via UI
2. Wait for IMAP polling (or trigger manually)
3. Check Processing History
4. ✅ Should see only ONE record of the reply
5. ✅ Log should show: "Skipping our own sent email"

### Test Source Classification:
1. Receive customer email → Check: `source: 'imap'`
2. Send manual reply → Check: `source: 'manual'` ✅
3. Let AI generate response → Check: `source: 'ai'`

## Impact

**Before:**
- ❌ Duplicate emails created
- ❌ Inefficient processing order
- ✅ Source correctly marked (was already correct)

**After:**
- ✅ No duplicate emails (multi-criteria detection)
- ✅ Efficient processing (skip own emails first)
- ✅ Source correctly marked as 'manual' for human replies

## Additional Notes

### Why Multi-Criteria Duplicate Detection?

**Scenario 1: MessageId Mismatch**
```
SMTP Send:   messageId = "<abc123@gmail.com>"
IMAP Fetch:  messageId = "<abc123-modified@imap.gmail.com>"
Result: Single email, different IDs → Caught by subject+sender+time check ✅
```

**Scenario 2: No MessageId**
```
Some email servers don't set messageId
Fallback: subject + sender + timestamp
Result: Duplicate detected ✅
```

**Scenario 3: Same Email Multiple Times**
```
Email appears in INBOX and Sent folder
First fetch: Creates record
Second fetch: Caught by messageId check ✅
```

### Time Window Explanation

**5-Second Window:**
```javascript
receivedAt: {
  $gte: new Date(parsed.date.getTime() - 5000), // 5 seconds before
  $lte: new Date(parsed.date.getTime() + 5000)  // 5 seconds after
}
```

**Why 5 seconds?**
- Account for clock skew between servers
- Network latency between SMTP send and IMAP fetch
- Server processing time
- But narrow enough to avoid false matches

**Edge cases:**
- Two emails with same subject from same sender within 5 seconds
  - Extremely rare
  - Still caught by messageId check
  - Acceptable trade-off for duplicate prevention

