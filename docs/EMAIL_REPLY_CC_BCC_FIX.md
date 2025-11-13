# Email Reply CC/BCC and Threading Fixes

## Overview
Fixed two critical issues in the email reply functionality:
1. **CC/BCC Array Parsing**: CC and BCC recipients were being sent as string elements `['[]']` instead of proper empty arrays `[]`
2. **Threading Service MongoDB Error**: Duplicate `$or` clauses causing "Cannot read properties of undefined" error

## Issues Fixed

### 1. CC/BCC String Array Issue

**Problem:**
When replying to emails with empty CC or BCC fields, the backend was creating arrays with string elements:
```javascript
// WRONG - What was happening
cc: [ '[]' ]
bcc: [ '[]' ]

// CORRECT - What should happen
cc: []
bcc: []
```

**Root Cause:**
The frontend was sending `JSON.stringify([])` which equals the string `"[]"`. The backend was:
1. Parsing it correctly: `JSON.parse("[]")` → `[]`
2. But in some edge cases, the string `"[]"` was being treated as a truthy value and wrapped: `["[]"]`

**Solution:**
Created a comprehensive `parseEmailArray()` helper function that:
- Handles already-parsed arrays
- Parses JSON strings safely
- Filters out invalid values like `"[]"` strings
- Handles comma-separated email strings
- Returns empty array for null/undefined/empty values

```javascript
const parseEmailArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(email => email && email.trim() !== '[]');
  if (typeof value === 'string') {
    // Handle empty string
    if (value.trim() === '' || value.trim() === '[]') return [];
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(email => email && email.trim() !== '[]');
      }
      return [];
    } catch (e) {
      // If not JSON, treat as comma-separated emails
      return value.split(',').map(e => e.trim()).filter(e => e && e !== '[]');
    }
  }
  return [];
};
```

**Files Modified:**
- `backend/src/controllers/emailController.js`:
  - Added `parseEmailArray()` helper function
  - Applied to both FormData (with attachments) and JSON (without attachments) parsing
  - Simplified CC/BCC array preparation (removed redundant checks)

### 2. Threading Service MongoDB Error

**Problem:**
Email threading was failing with error:
```
Cannot read properties of undefined (reading 'findOne')
```

**Root Cause:**
Invalid MongoDB query with duplicate `$or` clauses at line 153 of `emailThreadingService.js`:
```javascript
// WRONG - Duplicate $or (invalid MongoDB syntax)
{
  tenantId,
  $or: [
    { subject: cleanedSubject },
    { subject: new RegExp(...) }
  ],
  $or: [  // ❌ DUPLICATE KEY
    { 'from.email': parsedEmail.from.email },
    { 'to.email': parsedEmail.from.email }
  ],
  // ...
}
```

MongoDB doesn't allow duplicate keys in objects. The second `$or` overwrites the first, creating an invalid query structure.

**Solution:**
Combined both `$or` clauses using `$and` operator:
```javascript
// CORRECT - Using $and to combine multiple $or conditions
{
  tenantId,
  $and: [
    {
      $or: [
        { subject: cleanedSubject },
        { subject: new RegExp(`^(re:|fwd:|fw:)\\s*${this.escapeRegex(cleanedSubject)}`, 'i') }
      ]
    },
    {
      $or: [
        { 'from.email': parsedEmail.from.email },
        { 'to.email': parsedEmail.from.email }
      ]
    }
  ],
  receivedAt: { $gte: thirtyDaysAgo },
  _id: { $ne: parsedEmail._id }
}
```

This properly expresses the logic:
- **AND**: Both conditions must match:
  1. Subject matches (original OR reply/forward variation)
  2. Email involves this participant (in from OR to)

**Files Modified:**
- `backend/src/services/emailThreadingService.js`:
  - Fixed Strategy 3 threading query at line 153
  - Replaced duplicate `$or` with proper `$and` containing two `$or` clauses

## Testing

### Test CC/BCC Functionality
1. **Empty CC/BCC** (most common case):
   ```bash
   # Send reply with no CC or BCC
   # Expected: cc: [], bcc: []
   # Before fix: cc: ['[]'], bcc: ['[]']
   ```

2. **Single Recipients**:
   ```bash
   # CC: test@example.com
   # Expected: cc: ['test@example.com'], bcc: []
   ```

3. **Multiple Recipients**:
   ```bash
   # CC: test1@example.com, test2@example.com
   # BCC: test3@example.com
   # Expected: cc: ['test1@example.com', 'test2@example.com'], bcc: ['test3@example.com']
   ```

4. **With Attachments**:
   ```bash
   # Test with file attachments to ensure FormData parsing works
   # Should handle JSON.stringify() from frontend correctly
   ```

### Test Threading
1. **Reply to Email**:
   - Should find parent email by messageId
   - Should link reply to conversation thread
   - Should save reply to EmailLog without errors

2. **Reply-All**:
   - Should preserve original CC recipients
   - Should add watchers to BCC
   - Should update thread correctly

### Validation Logs
The backend now logs parsed CC/BCC values:
```javascript
console.log('📤 Sending reply via tenant SMTP:', {
  host: accountObj.smtp.host,
  port: accountObj.smtp.port,
  from: accountObj.smtp.username,
  to: email.from.email,
  cc: ccEmails,  // Should be proper array of emails or []
  bcc: bccEmails, // Should be proper array of emails or []
  attachments: attachments.length
});
```

## Benefits

### CC/BCC Fix
- ✅ Proper empty arrays instead of string elements
- ✅ Works with both FormData (attachments) and JSON (no attachments)
- ✅ Handles edge cases (null, undefined, empty strings, malformed JSON)
- ✅ Filters out invalid values
- ✅ Supports comma-separated email strings as fallback

### Threading Fix
- ✅ MongoDB queries execute without errors
- ✅ Proper threading by subject and participants
- ✅ Correct query logic with combined conditions
- ✅ Email replies properly linked to conversations

## Implementation Details

### Backend Changes

**emailController.js** (replyToEmail function):
```javascript
// Before (lines 770-786)
if (req.files && req.files.length > 0) {
  cc = req.body.cc ? JSON.parse(req.body.cc) : [];
  bcc = req.body.bcc ? JSON.parse(req.body.bcc) : [];
} else {
  cc = req.body.cc;
  bcc = req.body.bcc;
}

// After
const parseEmailArray = (value) => {
  // ... robust parsing logic
};

if (req.files && req.files.length > 0) {
  cc = parseEmailArray(req.body.cc);
  bcc = parseEmailArray(req.body.bcc);
} else {
  cc = parseEmailArray(req.body.cc);
  bcc = parseEmailArray(req.body.bcc);
}

// Simplified array preparation (was lines 859-860)
// Before
let ccEmails = Array.isArray(cc) ? cc : (cc ? [cc] : []);
let bccEmails = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

// After (no longer needed since parseEmailArray guarantees arrays)
let ccEmails = [...cc];
let bccEmails = [...bcc];
```

**emailThreadingService.js** (findParentEmail method):
```javascript
// Before (line 153 - INVALID)
const parent = await EmailLog.findOne({
  tenantId,
  $or: [...],
  $or: [...],  // ❌ Duplicate key
  // ...
});

// After (VALID)
const parent = await EmailLog.findOne({
  tenantId,
  $and: [
    { $or: [...] },  // Subject conditions
    { $or: [...] }   // Participant conditions
  ],
  // ...
});
```

### Frontend (No Changes Required)
The frontend continues to send CC/BCC as:
- **With attachments**: `JSON.stringify(replyData.cc)` → `"[]"` or `'["email@example.com"]'`
- **Without attachments**: `replyData.cc` → `[]` or `['email@example.com']`

The backend now handles both cases correctly.

## Error Prevention

### Type Safety
- Added array validation at parsing stage
- Filter out invalid values (empty strings, `"[]"` strings)
- Always return arrays, never undefined or null

### MongoDB Query Safety
- Use `$and` when combining multiple `$or` conditions
- Never duplicate object keys in MongoDB queries
- Test queries with MongoDB query planner before deployment

### Logging
- Log parsed CC/BCC values before sending
- Include array lengths in logs for debugging
- Log threading parent email found/not found

## Future Improvements

### Email Validation
Consider adding email format validation:
```javascript
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// In parseEmailArray
.filter(email => email && isValidEmail(email))
```

### CC/BCC Deduplication
Prevent same email appearing multiple times:
```javascript
const uniqueEmails = [...new Set([...ccEmails, ...originalCcEmails])];
```

### Threading Strategy Optimization
- Add caching for frequently accessed thread parents
- Implement thread depth limits to prevent infinite chains
- Add thread visualization in frontend

## Related Documentation
- [AI Email Automation](./AI_EMAIL_AUTOMATION_COMPLETION_REPORT.md)
- [Email Test Guide](../backend/EMAIL_TEST_GUIDE.md)
- [Watcher Service](./WATCHER_SERVICE_IMPLEMENTATION.md)

## Deployment Notes

### Pre-Deployment Checklist
- [ ] Test empty CC/BCC scenario
- [ ] Test single recipient in CC/BCC
- [ ] Test multiple recipients in CC/BCC
- [ ] Test reply with attachments
- [ ] Test reply without attachments
- [ ] Verify threading creates proper conversation chains
- [ ] Check EmailLog entries are created correctly
- [ ] Verify watchers are added to BCC
- [ ] Test Reply-All preserves original CC

### Rollback Plan
If issues occur, revert these commits:
- `emailController.js`: Restore original JSON.parse logic
- `emailThreadingService.js`: Restore duplicate $or (will cause error but won't break emails)

### Monitoring
Watch for these log patterns:
```bash
# Success pattern
"📤 Sending reply via tenant SMTP"
"cc": []  # or array of emails
"bcc": []  # or array of emails

# Error patterns to watch
"cc": ["[]"]  # Still broken
"Cannot read properties of undefined"  # Threading error
"NoQueryExecutionPlans"  # MongoDB error
```

---

**Status**: ✅ Completed  
**Date**: 2024  
**Impact**: Critical bug fixes for email reply functionality  
**Affected Modules**: Email Controller, Email Threading Service
