# Email Tracking ID System - Testing Guide

## 🧪 Quick Start Testing

This guide walks you through testing the email tracking ID system end-to-end.

---

## Prerequisites

1. Backend server running
2. MongoDB connected
3. SMTP configured
4. IMAP configured (for incoming email testing)
5. Test email account ready

---

## Test 1: Generate Tracking ID (30 seconds)

### Using Node.js REPL

```bash
cd backend
node
```

```javascript
const mongoose = require('mongoose');
const EmailTrackingService = require('./src/services/emailTrackingService');
const Tenant = require('./src/models/Tenant');

// Connect to MongoDB
mongoose.connect('your-mongodb-url');

// Get your tenant ID (replace with actual ID)
const tenantId = '507f1f77bcf86cd799439011';

// Test 1: Generate tracking ID
(async () => {
  const trackingId = await EmailTrackingService.generateTrackingId(
    tenantId,
    'customer@example.com'
  );
  
  console.log('✅ Generated Tracking ID:', trackingId);
  // Expected format: TRK-ABC12-000001
  
  // Verify format
  const isValid = EmailTrackingService.isValidTrackingId(trackingId);
  console.log('✅ Valid format:', isValid); // Should be true
  
  // Parse components
  const parsed = EmailTrackingService.parseTrackingId(trackingId);
  console.log('✅ Parsed:', parsed);
  // { prefix: 'TRK', customerHash: 'ABC12', sequence: 1 }
})();
```

### Expected Output:
```
✅ Generated Tracking ID: TRK-A3F9E-000001
✅ Valid format: true
✅ Parsed: {
  prefix: 'TRK',
  customerHash: 'A3F9E',
  sequence: 1
}
```

---

## Test 2: Inject Tracking ID (1 minute)

```javascript
// Test HTML injection
const html = `
<html>
<body>
  <p>Dear John,</p>
  <p>Here's your tour quote...</p>
</body>
</html>
`;

const injected = EmailTrackingService.injectTrackingId(html, 'TRK-ABC12-000001');
console.log('✅ Injected HTML:', injected);

// Test plain text injection
const plainText = `
Dear John,

Here's your tour quote...

Best regards,
Sarah
`;

const injectedText = EmailTrackingService.injectTrackingIdPlainText(
  plainText,
  'TRK-ABC12-000001'
);
console.log('✅ Injected Plain Text:', injectedText);
```

### Expected Output (HTML):
```html
<html>
<body>
  <p>Dear John,</p>
  <p>Here's your tour quote...</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 11px; color: #9ca3af;">
      <strong>Reference Number:</strong> [TRK-ABC12-000001]
    </p>
    <p style="font-size: 10px; color: #9ca3af;">
      Please include this reference number in your reply for faster assistance.
    </p>
  </div>
  <div style="display:none">TRACKING_ID:[TRK-ABC12-000001]</div>
</body>
</html>
```

### Expected Output (Plain Text):
```
Dear John,

Here's your tour quote...

Best regards,
Sarah

---
Reference Number: [TRK-ABC12-000001]
Please include this reference number in your reply for faster assistance.
```

---

## Test 3: Extract Tracking ID (1 minute)

```javascript
// Test extraction from different formats

// Format 1: Brackets
const body1 = 'Customer replied: [TRK-ABC12-000001]';
console.log('✅ Extracted:', EmailTrackingService.extractTrackingId(body1));

// Format 2: REF: prefix
const body2 = 'Customer wrote REF: TRK-ABC12-000001 in their email';
console.log('✅ Extracted:', EmailTrackingService.extractTrackingId(body2));

// Format 3: Human-readable
const body3 = 'Previous email said Tracking ID: TRK-ABC12-000001';
console.log('✅ Extracted:', EmailTrackingService.extractTrackingId(body3));

// Format 4: Reference Number
const body4 = 'Reference Number: TRK-ABC12-000001';
console.log('✅ Extracted:', EmailTrackingService.extractTrackingId(body4));

// Test with quoted reply
const quotedReply = `
Hi Sarah,

Yes, I'd like to proceed!

Thanks,
John

On Mon, Jan 15, 2025 at 2:00 PM Sarah wrote:
> Dear John,
> 
> Here's your quote...
> 
> ---
> Reference Number: [TRK-ABC12-000001]
`;
console.log('✅ Extracted from quoted:', EmailTrackingService.extractTrackingId(quotedReply));
```

### Expected Output:
```
✅ Extracted: TRK-ABC12-000001
✅ Extracted: TRK-ABC12-000001
✅ Extracted: TRK-ABC12-000001
✅ Extracted: TRK-ABC12-000001
✅ Extracted from quoted: TRK-ABC12-000001
```

---

## Test 4: End-to-End Email Flow (5 minutes)

### Step 1: Send Test Email with Tracking ID

Using Postman or curl:

```bash
POST http://localhost:5000/api/emails/{emailId}/reply
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "recipientEmail": "your-test-email@gmail.com",
  "subject": "Test Email with Tracking ID",
  "body": "<p>Hi! This is a test email.</p>"
}
```

### Step 2: Check Your Email

Open your test email inbox. You should see:

```
Hi! This is a test email.

---
Reference Number: [TRK-ABC12-000001]
Please include this reference number in your reply for faster assistance.
```

### Step 3: Reply to the Email

Reply to the test email with any message. Make sure to keep the quoted text with the tracking ID.

### Step 4: Wait for IMAP to Poll (or trigger manually)

Option A: Wait for automatic polling (usually 1-2 minutes)

Option B: Manually trigger email fetch:
```javascript
const EmailPollingService = require('./src/services/emailPollingService');
await EmailPollingService.pollAllTenantEmails();
```

### Step 5: Verify Threading Worked

```javascript
const EmailLog = require('./src/models/EmailLog');

// Find the reply email
const replyEmail = await EmailLog.findOne({
  'from.email': 'your-test-email@gmail.com',
  subject: /Test Email with Tracking ID/
}).populate('threadMetadata.parentEmailId');

console.log('✅ Reply Email:', {
  id: replyEmail._id,
  subject: replyEmail.subject,
  trackingIdExtracted: replyEmail.trackingId,
  parentFound: !!replyEmail.threadMetadata.parentEmailId,
  strategy: replyEmail.threadMetadata.strategy
});

// Should show:
// ✅ Reply Email: {
//   id: ...,
//   subject: 'Re: Test Email with Tracking ID',
//   trackingIdExtracted: 'TRK-ABC12-000001',
//   parentFound: true,
//   strategy: 'tracking-id'
// }
```

---

## Test 5: Test All Email Types (10 minutes)

### Test Manual Reply
```bash
POST /api/emails/{emailId}/reply
```
✅ Should generate tracking ID  
✅ Should inject into email body  
✅ Should save to EmailLog with trackingId field  

### Test AI Auto-Response
```bash
# Enable AI processing for a test email
POST /api/emails/{emailId}/process-ai
```
✅ AI response should have tracking ID  
✅ Should be saved to EmailLog  

### Test Quote Email
```bash
POST /api/quotes/send-multiple
{
  "quoteIds": ["quote1", "quote2"],
  "customerEmail": "test@example.com"
}
```
✅ Quote email should have tracking ID  
✅ Should be saved to EmailLog  

---

## Test 6: Threading Fallback (5 minutes)

This tests that tracking ID works even when headers are missing.

### Create Test Scenario:

```javascript
const EmailLog = require('./src/models/EmailLog');
const EmailThreadingService = require('./src/services/emailThreadingService');

// Step 1: Create parent email with tracking ID
const parent = await EmailLog.create({
  tenantId: 'your-tenant-id',
  messageId: '<parent@test.com>',
  subject: 'Original Inquiry',
  from: { email: 'agent@travel.com', name: 'Agent' },
  to: [{ email: 'customer@example.com', name: 'Customer' }],
  bodyHtml: '<p>Hello</p>...[TRK-ABC12-000123]',
  bodyText: 'Hello...\nReference Number: [TRK-ABC12-000123]',
  trackingId: 'TRK-ABC12-000123',
  direction: 'outbound',
  status: 'sent'
});

console.log('✅ Created parent with tracking ID:', parent._id);

// Step 2: Simulate reply WITHOUT proper headers
const reply = await EmailLog.create({
  tenantId: 'your-tenant-id',
  messageId: '<reply@test.com>',
  subject: 'Re: Original Inquiry',  // Changed subject
  from: { email: 'customer@example.com', name: 'Customer' },
  to: [{ email: 'agent@travel.com', name: 'Agent' }],
  bodyHtml: '<p>I need help</p><blockquote>...REF: TRK-ABC12-000123...</blockquote>',
  bodyText: 'I need help\n> ...REF: TRK-ABC12-000123...',
  direction: 'inbound',
  // NO inReplyTo or references headers!
});

console.log('✅ Created reply without headers:', reply._id);

// Step 3: Run threading
await EmailThreadingService.processEmailThreading(reply, 'your-tenant-id');

// Step 4: Check if threading worked
const updatedReply = await EmailLog.findById(reply._id);
console.log('✅ Threading result:', {
  parentFound: !!updatedReply.threadMetadata.parentEmailId,
  parentId: updatedReply.threadMetadata.parentEmailId,
  strategy: updatedReply.threadMetadata.strategy,
  expectedParent: parent._id
});

// Should show:
// ✅ Threading result: {
//   parentFound: true,
//   parentId: ObjectId('...'),  // Same as parent._id
//   strategy: 'tracking-id',    // Used tracking ID, not headers!
//   expectedParent: ObjectId('...')
// }
```

---

## Test 7: Custom Prefix Configuration (3 minutes)

```javascript
const Tenant = require('./src/models/Tenant');

// Update tenant prefix
const tenant = await Tenant.findByIdAndUpdate(
  'your-tenant-id',
  {
    'settings.email.trackingIdPrefix': 'ABC',  // Custom prefix
    'settings.email.trackingIdSequence': 0      // Reset sequence
  },
  { new: true }
);

console.log('✅ Updated tenant prefix:', tenant.settings.email.trackingIdPrefix);

// Generate new tracking ID
const newTrackingId = await EmailTrackingService.generateTrackingId(
  'your-tenant-id',
  'customer@example.com'
);

console.log('✅ New tracking ID with custom prefix:', newTrackingId);
// Should be: ABC-A3F9E-000001 (not TRK-...)
```

---

## Test 8: Performance Test (5 minutes)

### Test Concurrent Generation

```javascript
// Generate 100 tracking IDs concurrently
console.log('🚀 Generating 100 tracking IDs concurrently...');
const start = Date.now();

const promises = Array.from({ length: 100 }, (_, i) =>
  EmailTrackingService.generateTrackingId(
    'your-tenant-id',
    `customer${i}@example.com`
  )
);

const trackingIds = await Promise.all(promises);
const duration = Date.now() - start;

console.log(`✅ Generated ${trackingIds.length} tracking IDs in ${duration}ms`);
console.log(`✅ Average: ${duration / trackingIds.length}ms per ID`);

// Check for duplicates
const unique = new Set(trackingIds);
console.log(`✅ All unique: ${unique.size === trackingIds.length}`);
// Should be true (no duplicates due to atomic increment)

// Verify sequence numbers are sequential
const sequences = trackingIds.map(id => {
  const parsed = EmailTrackingService.parseTrackingId(id);
  return parsed.sequence;
});

console.log('✅ Sequence range:', Math.min(...sequences), '-', Math.max(...sequences));
// Should be consecutive (e.g., 1-100)
```

### Expected Performance:
- Generation: < 50ms per ID
- 100 concurrent: < 2 seconds total
- No duplicates: ✅ All unique
- Sequences: ✅ Sequential

---

## Test 9: Edge Cases (5 minutes)

### Test Missing Tracking ID

```javascript
const bodyWithout = 'This email has no tracking ID';
const extracted = EmailTrackingService.extractTrackingId(bodyWithout);
console.log('✅ Extracted from body without ID:', extracted);
// Should be: null
```

### Test Malformed Tracking ID

```javascript
const bodyMalformed = 'Bad format: TRK-ABC-123';  // Wrong format
const extracted = EmailTrackingService.extractTrackingId(bodyMalformed);
console.log('✅ Extracted malformed:', extracted);
// Should be: null (doesn't match pattern)
```

### Test Multiple Tracking IDs

```javascript
const bodyMultiple = `
  Old email: [TRK-ABC12-000001]
  New email: [TRK-ABC12-000002]
`;
const extracted = EmailTrackingService.extractTrackingId(bodyMultiple);
console.log('✅ Extracted from multiple:', extracted);
// Should return the FIRST one found: TRK-ABC12-000001
```

### Test Very Long Email

```javascript
const longBody = 'x'.repeat(100000) + '\n[TRK-ABC12-000001]';
const startTime = Date.now();
const extracted = EmailTrackingService.extractTrackingId(longBody);
const duration = Date.now() - startTime;

console.log('✅ Extracted from 100KB email:', extracted);
console.log('✅ Extraction time:', duration, 'ms');
// Should be < 10ms even for large emails
```

---

## Test 10: Database Queries (2 minutes)

### Test Tracking ID Lookup Performance

```javascript
const EmailLog = require('./src/models/EmailLog');

// Ensure index exists
await EmailLog.collection.createIndex({ trackingId: 1 });

// Test lookup
console.time('trackingIdLookup');
const email = await EmailLog.findOne({
  trackingId: 'TRK-ABC12-000001',
  tenantId: 'your-tenant-id'
});
console.timeEnd('trackingIdLookup');

console.log('✅ Found email:', !!email);
// Should be < 5ms with index
```

### Test Without Index (Performance Comparison)

```javascript
// Drop index temporarily
await EmailLog.collection.dropIndex('trackingId_1');

console.time('withoutIndex');
await EmailLog.findOne({ trackingId: 'TRK-ABC12-000001' });
console.timeEnd('withoutIndex');

// Recreate index
await EmailLog.collection.createIndex({ trackingId: 1 });

console.time('withIndex');
await EmailLog.findOne({ trackingId: 'TRK-ABC12-000001' });
console.timeEnd('withIndex');

// Should see 10-100x speedup with index
```

---

## Troubleshooting

### Issue: Tracking ID not generated

**Check:**
```javascript
const tenant = await Tenant.findById('your-tenant-id');
console.log('Tracking enabled:', tenant.settings.email.enableTrackingId);
// Should be true
```

**Fix:**
```javascript
await Tenant.findByIdAndUpdate('your-tenant-id', {
  'settings.email.enableTrackingId': true
});
```

### Issue: Tracking ID not extracted from reply

**Check:**
```javascript
const email = await EmailLog.findById('reply-email-id');
console.log('Body text:', email.bodyText);
console.log('Body HTML:', email.bodyHtml);
// Verify tracking ID is actually present
```

**Debug:**
```javascript
const patterns = [
  /\[([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})\]/i,
  /REF:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i,
  /Tracking\s+ID:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i,
  /Reference\s+Number:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i
];

patterns.forEach((pattern, i) => {
  const match = email.bodyText.match(pattern);
  console.log(`Pattern ${i+1}:`, match ? match[0] : 'no match');
});
```

### Issue: Threading not using tracking ID

**Check strategy order:**
```javascript
const email = await EmailLog.findById('reply-id');
console.log('Threading strategy used:', email.threadMetadata.strategy);
// Should be 'tracking-id' if headers were missing
```

**Check threading service logs:**
```bash
# Look for:
# "🔍 Trying tracking ID strategy..."
# "✅ Found parent by tracking ID: ..."
```

---

## Success Criteria

All tests should pass with these results:

- ✅ Tracking ID format: `PREFIX-HASH5-SEQUENCE6`
- ✅ Injection: Visible footer + hidden metadata
- ✅ Extraction: Works with 4 different patterns
- ✅ Threading: Finds parent even without headers
- ✅ Performance: < 50ms generation, < 5ms lookup
- ✅ Concurrency: No duplicate IDs
- ✅ Database: Indexed and fast
- ✅ All email types: Manual, AI, Quote

---

## Next Steps After Testing

1. **Monitor in Production**
   - Track threading success rate by strategy
   - Monitor tracking ID extraction success
   - Alert if extraction fails > 5%

2. **User Training**
   - Teach operators about reference numbers
   - Show customers how to include reference in calls/emails

3. **Admin UI** (Future)
   - Allow tenant to customize prefix
   - Show tracking ID statistics
   - Enable/disable tracking per tenant

4. **Advanced Features** (Future)
   - Customer portal with tracking ID lookup
   - SMS with tracking ID
   - QR code in email footer

---

**Testing Complete!** 🎉

If all tests pass, your tracking ID system is production-ready.
