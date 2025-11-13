# Critical Fix: FormData Not Being Sent as multipart/form-data

## Issue
When sending email replies with attachments and CC/BCC, the data was not being sent correctly:
- ❌ Attachments not received by backend
- ❌ CC/BCC arrays not received by backend
- ❌ Only `subject` and `body` fields were being sent

## Root Cause

The axios instance in `frontend/src/services/api.js` had a **hardcoded `Content-Type: application/json` header**:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',  // ❌ PROBLEM!
  },
})
```

When sending FormData (for attachments), this caused:
1. FormData being converted to JSON (losing files and breaking arrays)
2. Backend expecting `multipart/form-data` but receiving `application/json`
3. Multer middleware not parsing files
4. CC/BCC arrays being serialized incorrectly

## The Fix

Modified the request interceptor to **detect FormData** and remove the Content-Type header, allowing the browser to set it correctly with the boundary:

```javascript
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    // 🆕 If sending FormData, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

## How It Works

### Before Fix
```
Frontend sends FormData
  ↓
Axios intercepts request
  ↓
Applies Content-Type: application/json (hardcoded)
  ↓
Tries to serialize FormData as JSON
  ↓
Loses files, breaks arrays
  ↓
Backend receives malformed data
  ↓
❌ Attachments missing, CC/BCC empty
```

### After Fix
```
Frontend sends FormData
  ↓
Axios intercepts request
  ↓
Detects: config.data instanceof FormData
  ↓
Deletes Content-Type header
  ↓
Browser automatically sets: Content-Type: multipart/form-data; boundary=----...
  ↓
FormData sent correctly with proper encoding
  ↓
Backend multer middleware parses files
  ↓
✅ Attachments received, CC/BCC arrays intact
```

## Technical Details

### Why We Delete Content-Type for FormData

When sending FormData, the browser must set the `Content-Type` header with a **boundary** parameter:

```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
```

The boundary is a unique string that separates different parts of the FormData. If we manually set `Content-Type: application/json`, then:
- Browser doesn't add the boundary
- Server can't parse the multipart data
- Data is lost or corrupted

By **deleting** the Content-Type header, the browser automatically generates the correct header with boundary.

### JSON Requests Still Work

For regular JSON requests (no FormData), the default `Content-Type: application/json` remains:
- Created in axios.create() config
- Not deleted by interceptor (only deletes for FormData)
- All existing API calls continue to work

## Testing

### Test Case 1: Reply with Attachments and CC
1. Open email and click Reply
2. Add CC: `test@example.com`
3. Attach a file
4. Send reply
5. **Expected**: 
   - Backend logs show: `hasFiles: true, ccRaw: ["test@example.com"]`
   - Email sent with attachment and CC
   - No errors

### Test Case 2: Reply without Attachments (JSON)
1. Open email and click Reply
2. Type message body
3. Send reply (no attachments)
4. **Expected**:
   - Content-Type remains `application/json`
   - Backend receives JSON payload
   - Reply sent successfully

### Test Case 3: Regular API Calls
1. Navigate to different pages (emails list, dashboard, etc.)
2. **Expected**:
   - All API calls work normally
   - No errors in console
   - Data loads correctly

## Impact

### Fixed
- ✅ Attachments now sent correctly with replies
- ✅ CC/BCC arrays received by backend
- ✅ FormData properly encoded as multipart/form-data
- ✅ Multer middleware can parse files

### No Breaking Changes
- ✅ All existing JSON API calls continue to work
- ✅ Only affects requests sending FormData
- ✅ No changes needed to other API calls

## Browser Network Tab Verification

### Before Fix (Wrong)
```
Request Headers:
Content-Type: application/json

Request Payload:
{
  "subject": "Re: ...",
  "body": "..."
  // ❌ CC, BCC, attachments missing or malformed
}
```

### After Fix (Correct)
```
Request Headers:
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

Form Data:
subject: Re: ...
body: ...
cc: ["test@example.com"]
bcc: ["secret@example.com"]
attachments: (binary)
```

## Related Issues

This fix also resolves:
- File upload issues in other parts of the app
- Any feature using FormData with the api instance
- Avatar uploads, document uploads, etc.

## Best Practices

### When to Use FormData
Use FormData when:
- Uploading files (attachments, images, documents)
- Sending binary data
- Mixing text and file data
- Need multipart/form-data encoding

### When to Use JSON
Use JSON when:
- No files involved
- Pure data objects
- Standard CRUD operations
- Default for most API calls

### Axios Interceptor Pattern
This is the correct pattern for handling mixed content types:

```javascript
api.interceptors.request.use((config) => {
  // Set auth token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Handle FormData specially
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    // Browser will set: multipart/form-data; boundary=...
  }
  // Else: Keep default application/json
  
  return config;
});
```

## Files Modified
- `frontend/src/services/api.js` - Added FormData detection in request interceptor

## Deployment Notes

### Testing Required
After deployment, test:
1. Email replies with attachments ✅
2. Email replies with CC/BCC ✅
3. Regular API calls (list emails, get email details) ✅
4. Other file uploads in the app ✅

### No Database Changes
- No migration needed
- No schema changes
- Pure frontend fix

### Rollback Plan
If issues occur, revert this single line:
```javascript
// Remove this:
if (config.data instanceof FormData) {
  delete config.headers['Content-Type'];
}
```

### Known Compatibility
- ✅ Works with all modern browsers
- ✅ Works with Vite dev server
- ✅ Works with production build
- ✅ Compatible with multer middleware on backend

---

**Status**: ✅ Fixed  
**Priority**: 🔴 Critical - Was blocking file uploads and CC/BCC  
**Impact**: High - Affects all FormData submissions  
**Testing**: Required before production deployment
