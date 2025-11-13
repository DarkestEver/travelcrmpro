# CC/BCC Debug Test Plan

## Enhanced Logging Added
I've added comprehensive logging to track exactly what's happening with CC/BCC. Follow these steps to diagnose the issue.

## Test Steps

### Step 1: Open Reply Modal
1. Open any email
2. Click the **Reply** button
3. **Check browser console** for:
   ```
   🔓 Reply modal opened with initial data: { cc: [], bcc: [], ... }
   ```
   ✅ This confirms modal initialized correctly

### Step 2: Add CC Recipient
1. Click **"Add CC/BCC"** to expand the fields
2. In the CC input field, type: `test@example.com`
3. Press **Enter** (or click **Add** button)
4. **Check browser console** for these logs in order:
   ```
   🔵 handleAddCC called, ccInput: test@example.com
   🔵 Parsed emails: ["test@example.com"]
   🔵 Current replyData.cc: []
   🔵 New CC array: ["test@example.com"]
   🔄 replyData state changed: { cc: ["test@example.com"], bcc: [], ccLength: 1, bccLength: 0 }
   ```
5. **Visual Check**: Does a blue chip appear with "test@example.com" below the input?
   - ✅ YES → State update is working
   - ❌ NO → State update failed

### Step 3: Add BCC Recipient
1. In the BCC input field, type: `secret@example.com`
2. Press **Enter** (or click **Add** button)
3. **Check browser console** for:
   ```
   🔵 handleAddBCC called, bccInput: secret@example.com
   🔵 Parsed emails: ["secret@example.com"]
   🔵 Current replyData.bcc: []
   🔵 New BCC array: ["secret@example.com"]
   🔄 replyData state changed: { cc: ["test@example.com"], bcc: ["secret@example.com"], ccLength: 1, bccLength: 1 }
   ```
4. **Visual Check**: Does a gray chip appear with "secret@example.com"?

### Step 4: Click Debug Button
1. Click the **"Debug"** button next to "Add CC/BCC"
2. **Check browser console** for:
   ```
   🐛 Debug State: {
     replyData: { ... },
     cc: ["test@example.com"],
     bcc: ["secret@example.com"],
     ccLength: 1,
     bccLength: 1
   }
   ```
3. **Verify**: CC and BCC arrays contain the emails you added

### Step 5: Add Attachment (Optional)
1. Click **"Choose Files"** (paperclip icon)
2. Select a file
3. **Visual Check**: File name appears in attachment list

### Step 6: Send Reply
1. Type something in the email body (e.g., "test message")
2. Click **"Send Reply"**
3. **Check browser console** for these logs in order:

   **A. Before sending:**
   ```
   📤 Frontend - Sending reply with data: {
     subject: "Re: ...",
     cc: ["test@example.com"],
     bcc: ["secret@example.com"],
     hasAttachments: true/false
   }
   ```

   **B. If attachments exist (FormData path):**
   ```
   📦 FormData CC/BCC: {
     cc: "[\"test@example.com\"]",
     bcc: "[\"secret@example.com\"]"
   }
   ```

   **C. If no attachments (JSON path):**
   ```
   📨 JSON payload: {
     subject: "Re: ...",
     body: "...",
     cc: ["test@example.com"],
     bcc: ["secret@example.com"]
   }
   ```

4. **Check backend terminal/console** for:
   ```
   📥 Backend - Received request body: {
     hasFiles: true/false,
     bodyKeys: ["subject", "body", "plainText", "cc", "bcc"],
     ccRaw: "[\"test@example.com\"]" or ["test@example.com"],
     bccRaw: "[\"secret@example.com\"]" or ["secret@example.com"]
   }
   ```

   ```
   🔧 Parsing email array: { value: ..., type: "...", isArray: ... }
   🔧 Parsing email array: { value: ..., type: "...", isArray: ... }
   ```

   ```
   ✅ Backend - Parsed CC/BCC: {
     cc: ["test@example.com"],
     bcc: ["secret@example.com"]
   }
   ```

   ```
   📤 Sending reply via tenant SMTP: {
     host: "...",
     port: ...,
     from: "...",
     to: "...",
     cc: ["test@example.com"],
     bcc: ["secret@example.com"],
     attachments: 0 or 1
   }
   ```

## Diagnostic Decision Tree

### Issue A: No chips appear when adding CC/BCC
**Symptoms:**
- Type email and press Enter
- No chip appears below input
- Console shows: `🔴 ccInput is empty or whitespace` OR no logs at all

**Causes:**
1. Input field not updating `ccInput` state
2. `handleAddCC` not being called
3. Email validation failing (no @ symbol)

**Solution:**
- Check if input has `value={ccInput}` and `onChange={(e) => setCcInput(e.target.value)}`
- Check if button has `onClick={handleAddCC}`
- Ensure email contains @ symbol

### Issue B: Chips appear but Debug shows empty arrays
**Symptoms:**
- Chips visible in UI
- Debug button shows: `cc: [], bcc: []`
- Console shows: `🔵 New CC array: ["test@example.com"]` but then `🔄 replyData state changed: { cc: [], ... }`

**Causes:**
- State update race condition
- `setReplyData` not persisting the update
- React state batching issue

**Solution:**
- Use functional setState:
  ```javascript
  setReplyData(prev => ({
    ...prev,
    cc: [...prev.cc, ...emails]
  }));
  ```

### Issue C: Frontend logs show data, Backend doesn't receive
**Symptoms:**
- Frontend: `📤 Frontend - Sending reply with data: { cc: [...], bcc: [...] }`
- Backend: `📥 Backend - Received request body: { ccRaw: undefined, bccRaw: undefined }`

**Causes:**
- API call not sending CC/BCC
- Axios serialization issue
- Content-Type mismatch

**Solution:**
- Check `emailAPI.replyToEmail()` implementation
- Ensure Content-Type is `multipart/form-data` for FormData or `application/json` for JSON

### Issue D: Backend receives but parsing fails
**Symptoms:**
- Backend: `📥 Backend - Received request body: { ccRaw: "[]", bccRaw: "[]" }`
- Backend: `✅ Backend - Parsed CC/BCC: { cc: [], bcc: [] }`
- Email sent with empty CC/BCC

**Causes:**
- Frontend sending string `"[]"` instead of array or stringified array with emails
- State is actually empty when sent

**Solution:**
- Check Debug button **before** clicking Send
- Verify state contains emails at send time

## Common Problems & Solutions

### Problem 1: Emails not validating (no @ symbol)
```javascript
// Current validation
.filter(e => e && e.includes('@'))

// If still having issues, add better validation:
.filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
```

### Problem 2: Multiple emails not splitting correctly
Test with:
- `test1@example.com, test2@example.com` (comma)
- `test1@example.com; test2@example.com` (semicolon)
- `test1@example.com: test2@example.com` (colon)

All should work with current regex: `/[,;:]/`

### Problem 3: State not updating immediately
React state updates are async. The console log inside `handleAddCC` might show old state.
The `useEffect` log (`🔄 replyData state changed`) shows the actual updated state.

### Problem 4: FormData vs JSON confusion
- **With attachments**: Uses FormData, CC/BCC are JSON.stringified
- **Without attachments**: Uses JSON, CC/BCC are arrays

Both should work with current `parseEmailArray()` function.

## Quick Test Commands

### Browser Console Quick Tests
```javascript
// Test email parsing
const test = "test1@example.com, test2@example.com; test3@example.com";
test.split(/[,;:]/).map(e => e.trim()).filter(e => e && e.includes('@'));
// Should return: ["test1@example.com", "test2@example.com", "test3@example.com"]

// Check current reply data
console.log(window.replyData); // May not work if not exposed

// Check if email regex works
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test("test@example.com"); // true
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test("invalid"); // false
```

## Expected Full Console Output (Success Case)

```
🔓 Reply modal opened with initial data: { cc: [], bcc: [], attachments: [] }
🔵 handleAddCC called, ccInput: test@example.com
🔵 Parsed emails: ["test@example.com"]
🔵 Current replyData.cc: []
🔵 New CC array: ["test@example.com"]
🔄 replyData state changed: { cc: ["test@example.com"], bcc: [], ccLength: 1, bccLength: 0 }
🔵 handleAddBCC called, bccInput: secret@example.com
🔵 Parsed emails: ["secret@example.com"]
🔵 Current replyData.bcc: []
🔵 New BCC array: ["secret@example.com"]
🔄 replyData state changed: { cc: ["test@example.com"], bcc: ["secret@example.com"], ccLength: 1, bccLength: 1 }
🐛 Debug State: { cc: ["test@example.com"], bcc: ["secret@example.com"], ccLength: 1, bccLength: 1 }
📤 Frontend - Sending reply with data: { cc: ["test@example.com"], bcc: ["secret@example.com"], hasAttachments: false }
📨 JSON payload: { subject: "Re: ...", body: "...", cc: ["test@example.com"], bcc: ["secret@example.com"] }
```

## Next Steps

1. Run through Steps 1-6 above
2. Copy ALL console output (both browser and backend)
3. Share the output so I can identify exactly where the issue is
4. Note any visual issues (chips not appearing, etc.)

This will give us complete visibility into the data flow!
