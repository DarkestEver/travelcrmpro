# CC/BCC UI Debug - Troubleshooting Guide

## Issue
User reported that CC/BCC payload is not sending any data despite the UI allowing users to add recipients.

## Debugging Steps Added

### Frontend Logging
Added comprehensive console logging to track CC/BCC data flow:

1. **Modal Initialization** (handleOpenReplyModal):
```javascript
console.log('🔓 Reply modal opened with initial data:', {
  subject: `Re: ${email.subject}`,
  cc: [],
  bcc: [],
  attachments: []
});
```

2. **Before Sending** (handleSendReply):
```javascript
console.log('📤 Frontend - Sending reply with data:', {
  subject: replyData.subject,
  cc: replyData.cc,
  bcc: replyData.bcc,
  hasAttachments: attachmentFiles.length > 0
});
```

3. **FormData Path**:
```javascript
console.log('📦 FormData CC/BCC:', {
  cc: JSON.stringify(replyData.cc),
  bcc: JSON.stringify(replyData.bcc)
});
```

4. **JSON Path**:
```javascript
console.log('📨 JSON payload:', replyData);
```

5. **Debug Button**: Added a debug button next to "Add CC/BCC" toggle to inspect state at any time

### Backend Logging
Added detailed logging to see exactly what's received:

1. **Raw Request Data**:
```javascript
console.log('📥 Backend - Received request body:', {
  hasFiles: req.files && req.files.length > 0,
  bodyKeys: Object.keys(req.body),
  ccRaw: req.body.cc,
  bccRaw: req.body.bcc
});
```

2. **Parsing Process**:
```javascript
console.log('🔧 Parsing email array:', { 
  value, 
  type: typeof value, 
  isArray: Array.isArray(value) 
});
```

3. **Parsed Results**:
```javascript
console.log('✅ Backend - Parsed CC/BCC:', { cc, bcc });
```

## How to Use Debug Tools

### Step 1: Open Reply Modal
- Open an email
- Click "Reply" button
- Check console for: `🔓 Reply modal opened with initial data`
- Verify cc: [] and bcc: [] are initialized

### Step 2: Add CC/BCC Recipients
- Click "Add CC/BCC" to expand fields
- Enter an email address (e.g., test@example.com)
- Press Enter or click "Add" button
- Verify chip appears below input field

### Step 3: Check State
- Click the "Debug" button next to CC/BCC toggle
- Console will show current replyData state
- Verify cc and bcc arrays contain added emails

### Step 4: Send Reply
- Click "Send Reply"
- Check console for multiple log entries:
  - `📤 Frontend - Sending reply with data` - Shows what's being sent
  - `📦 FormData CC/BCC` or `📨 JSON payload` - Shows format
  - `📥 Backend - Received request body` - Shows what backend got
  - `🔧 Parsing email array` - Shows parsing process
  - `✅ Backend - Parsed CC/BCC` - Shows final arrays

## Common Issues to Check

### Issue 1: CC/BCC Array is Empty in State
**Symptom**: Debug button shows empty arrays even after adding emails

**Causes**:
- handleAddCC/handleAddBCC not updating state correctly
- Invalid email format (must contain @)
- State not re-rendering

**Check**:
```javascript
// Verify these functions update replyData
const handleAddCC = () => {
  if (ccInput.trim()) {
    const emails = ccInput.split(/[,;:]/).map(e => e.trim()).filter(e => e && e.includes('@'));
    setReplyData({ ...replyData, cc: [...replyData.cc, ...emails] });
    setCcInput('');
  }
};
```

### Issue 2: Data Lost During Send
**Symptom**: Debug shows arrays populated, but logs show empty on send

**Causes**:
- State not updated before send (async issue)
- replyData reference is stale

**Solution**: Use functional setState or ensure state is current

### Issue 3: Backend Not Receiving Data
**Symptom**: Frontend logs show data, backend logs show undefined/empty

**Causes**:
- Content-Type mismatch (JSON vs FormData)
- Axios not serializing properly
- Backend middleware not parsing body

**Check**: 
- `📥 Backend - Received request body` should show ccRaw and bccRaw
- Verify bodyKeys includes 'cc' and 'bcc'

### Issue 4: Data Received But Not Parsed
**Symptom**: Backend receives data but parseEmailArray returns []

**Causes**:
- Data is double-stringified
- Data format unexpected
- Filter removing valid emails

**Check**: 
- `🔧 Parsing email array` shows exact value and type
- Verify JSON.parse succeeds
- Check filter conditions

## Expected Log Flow

### Successful Reply with CC (No Attachments)
```
Frontend:
🔓 Reply modal opened with initial data: { cc: [], bcc: [] }
[User adds email]
🐛 Debug State: { cc: ["test@example.com"], bcc: [] }
📤 Frontend - Sending reply with data: { cc: ["test@example.com"], bcc: [] }
📨 JSON payload: { subject: "Re: ...", body: "...", cc: ["test@example.com"], bcc: [] }

Backend:
📥 Backend - Received request body: { ccRaw: ["test@example.com"], bccRaw: [] }
🔧 Parsing email array: { value: ["test@example.com"], type: "object", isArray: true }
✅ Backend - Parsed CC/BCC: { cc: ["test@example.com"], bcc: [] }
📤 Sending reply via tenant SMTP: { cc: ["test@example.com"], bcc: [] }
```

### Successful Reply with BCC (With Attachments)
```
Frontend:
🔓 Reply modal opened with initial data: { cc: [], bcc: [] }
[User adds email to BCC]
🐛 Debug State: { cc: [], bcc: ["secret@example.com"] }
📤 Frontend - Sending reply with data: { cc: [], bcc: ["secret@example.com"], hasAttachments: true }
📦 FormData CC/BCC: { cc: "[]", bcc: "[\"secret@example.com\"]" }

Backend:
📥 Backend - Received request body: { ccRaw: "[\"secret@example.com\"]", bccRaw: "[]", hasFiles: true }
🔧 Parsing email array: { value: "[\"secret@example.com\"]", type: "string", isArray: false }
✅ Backend - Parsed CC/BCC: { cc: [], bcc: ["secret@example.com"] }
📤 Sending reply via tenant SMTP: { cc: [], bcc: ["secret@example.com"] }
```

## Quick Diagnosis

Run through this checklist:

1. ✅ **Modal Opens**: See `🔓` log?
2. ✅ **Can Add Emails**: Chips appear in UI?
3. ✅ **State Updates**: Debug button shows populated arrays?
4. ✅ **Send Triggers**: See `📤 Frontend` log?
5. ✅ **Backend Receives**: See `📥 Backend` log?
6. ✅ **Parsing Works**: See `✅ Backend - Parsed` with correct data?
7. ✅ **Email Sends**: See `📤 Sending reply via tenant SMTP` with correct CC/BCC?

**If any step fails, that's where the issue is!**

## Files Modified

### Frontend
- **frontend/src/pages/emails/EmailDetail.jsx**:
  - Added logging to handleOpenReplyModal
  - Added logging to handleSendReply (both FormData and JSON paths)
  - Added Debug button next to CC/BCC toggle
  - Fixed attachments array initialization in replyData

### Backend
- **backend/src/controllers/emailController.js**:
  - Added logging before parsing
  - Added logging during parseEmailArray execution
  - Added logging after parsing

## Next Steps

### If Issue Persists
1. Test with a fresh email reply
2. Click "Add CC/BCC" to expand
3. Type: test@example.com
4. Press Enter or click Add
5. Verify chip appears
6. Click Debug button - check console
7. Click Send Reply - watch console logs
8. Share the console output to identify where data is lost

### Removing Debug Code
Once issue is resolved, remove:
- Debug button from UI
- Excessive console.log statements
- Keep only essential error logging

---

**Status**: 🔍 Debug tools added, awaiting test results  
**Next**: User should test and share console logs
