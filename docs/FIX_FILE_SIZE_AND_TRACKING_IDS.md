# Fix: File Size Limit and Duplicate Tracking IDs

## Issues Fixed

### Issue 1: File Too Large Error ✅
**Error:**
```
MulterError: File too large
code: 'LIMIT_FILE_SIZE'
```

**Root Cause:**
Multer middleware had a 10MB file size limit, which was too small for typical email attachments like presentations, videos, or large PDFs.

**Solution:**
Increased file size limit from 10MB to 25MB per file.

**File:** `backend/src/middleware/upload.js`
```javascript
// Before
limits: {
  fileSize: 10 * 1024 * 1024 // 10MB max file size
}

// After
limits: {
  fileSize: 25 * 1024 * 1024 // 25MB max file size per file
}
```

### Issue 2: Duplicate Tracking IDs in Email Threads ✅
**Problem:**
When replying to emails, a new tracking ID was generated for each reply, even though the original email (and previous replies) already contained a tracking ID. This caused:
- Multiple tracking IDs in the same thread
- Confusion in tracking conversations
- Emails being treated as separate inquiries

**Example of Problem:**
```
Original Email: "EGD-ABC12-000001"
Reply 1: "EGD-ABC12-000001" + "EGD-XYZ34-000002" ← DUPLICATE!
Reply 2: "EGD-ABC12-000001" + "EGD-XYZ34-000002" + "EGD-QRS56-000003" ← MORE DUPLICATES!
```

**Solution:**
Before generating a new tracking ID, check if one already exists in the email body (from quoted original message). If found, reuse it instead of creating a new one.

**File:** `backend/src/controllers/emailController.js`
```javascript
// Check if email body already contains a tracking ID
const existingTrackingIdMatch = body.match(/[A-Z]{3}-[A-Z0-9]{5}-\d{6}/);

if (existingTrackingIdMatch) {
  trackingId = existingTrackingIdMatch[0];
  console.log(`♻️  Reusing existing tracking ID from thread: ${trackingId}`);
} else {
  // Generate new tracking ID only if none exists
  trackingId = await EmailTrackingService.generateTrackingId(tenantId, email.from.email);
  console.log(`📋 Generated new tracking ID: ${trackingId}`);
}

// Only inject if tracking ID doesn't already exist in body
if (trackingId && !existingTrackingIdMatch) {
  emailBodyWithTracking = EmailTrackingService.injectTrackingId(body, trackingId);
  plainTextWithTracking = EmailTrackingService.injectTrackingIdPlainText(plainText, trackingId);
}
```

## How Tracking ID Reuse Works

### Scenario 1: First Email (No Tracking ID)
```
Customer sends inquiry
  ↓
System generates: EGD-ABC12-000001
  ↓
Reply includes: "Your reference: EGD-ABC12-000001"
  ↓
✅ Email sent with tracking ID
```

### Scenario 2: Reply to Email (Has Tracking ID)
```
User replies to email
  ↓
Reply body includes quoted original email with: "EGD-ABC12-000001"
  ↓
System detects existing tracking ID: EGD-ABC12-000001
  ↓
Reuses same tracking ID (no new generation)
  ↓
✅ Email sent with SAME tracking ID
```

### Scenario 3: Customer Replies Back (Maintains Thread)
```
Customer replies to our reply
  ↓
Their email quotes our email with: "EGD-ABC12-000001"
  ↓
System processes incoming email
  ↓
Detects tracking ID: EGD-ABC12-000001
  ↓
Links to same conversation thread
  ↓
✅ Conversation continuity maintained
```

## Tracking ID Format

The tracking ID regex pattern: `/[A-Z]{3}-[A-Z0-9]{5}-\d{6}/`

**Format Breakdown:**
- `[A-Z]{3}` - 3 uppercase letters (tenant prefix, e.g., "EGD")
- `-` - Separator
- `[A-Z0-9]{5}` - 5 alphanumeric characters (unique hash)
- `-` - Separator
- `\d{6}` - 6 digits (sequence number)

**Examples:**
- `EGD-ABC12-000001`
- `TMP-XYZ34-000042`
- `CRM-QRS56-000123`

## Benefits

### File Size Increase
- ✅ Support larger attachments (up to 25MB)
- ✅ Handle presentations (PowerPoint, Google Slides exports)
- ✅ Accept high-resolution images
- ✅ Support longer PDFs with embedded images
- ✅ Allow compressed archives

### Tracking ID Reuse
- ✅ Maintain conversation continuity across replies
- ✅ Single tracking ID per inquiry thread
- ✅ Easier tracking for customers (one reference number)
- ✅ Cleaner email bodies (no ID duplication)
- ✅ Accurate conversation grouping

## Testing

### Test Case 1: Large File Upload
1. Open email and click Reply
2. Attach file > 10MB but < 25MB (e.g., 15MB PDF)
3. Send reply
4. **Expected**: 
   - ✅ File uploads successfully
   - ✅ No "File too large" error
   - ✅ Email sent with attachment

### Test Case 2: Very Large File (Over Limit)
1. Attach file > 25MB
2. Send reply
3. **Expected**:
   - ❌ "File too large" error
   - Message: "File size limit is 25MB"

### Test Case 3: New Email Thread (No Existing Tracking ID)
1. Reply to a brand new email (no tracking ID in body)
2. Send reply
3. **Expected**:
   - Backend log: `📋 Generated new tracking ID: EGD-ABC12-000XXX`
   - Email contains tracking ID
   - Only ONE tracking ID in body

### Test Case 4: Reply in Existing Thread (Has Tracking ID)
1. Reply to an email that already has a tracking ID in quoted text
2. Send reply
3. **Expected**:
   - Backend log: `♻️  Reusing existing tracking ID from thread: EGD-ABC12-000XXX`
   - Same tracking ID maintained
   - No duplicate tracking ID added

### Test Case 5: Multiple Replies (Thread Continuity)
1. Send initial reply → Generates `EGD-ABC12-000001`
2. Customer replies back (quotes our email with ID)
3. Reply again
4. **Expected**:
   - All replies use same ID: `EGD-ABC12-000001`
   - Customer sees consistent reference number
   - Conversation properly threaded

## Backend Logs

### New Tracking ID Generated
```
📋 Generated new tracking ID: EGD-ABC12-000042
✅ Reply sent successfully via tenant SMTP. MessageId: <...>
```

### Existing Tracking ID Reused
```
♻️  Reusing existing tracking ID from thread: EGD-ABC12-000042
✅ Reply sent successfully via tenant SMTP. MessageId: <...>
```

## File Size Considerations

### Current Limits
- **Per file**: 25MB
- **Total per request**: Unlimited (but practical limit ~100MB)
- **File count**: 10 attachments max

### Recommended Limits for Production
Consider setting limits based on:
- Server storage capacity
- Email server limits (SMTP)
- Network bandwidth
- User experience (upload time)

### Common File Sizes
- **Images (JPEG/PNG)**: 1-5MB
- **PDFs**: 1-10MB
- **Office Documents**: 1-5MB
- **Presentations**: 5-20MB
- **Videos**: 10-100MB+ (may need separate handling)
- **Archives (ZIP)**: Variable

### Increasing Limit Further
If you need larger files (e.g., 50MB, 100MB):

```javascript
limits: {
  fileSize: 50 * 1024 * 1024 // 50MB
}
```

But consider:
- Most email servers have 25-50MB limits
- Large files should use cloud storage (S3, Google Drive) with links
- User experience degrades with large uploads

## Error Handling

### Frontend Error Display
The frontend should catch and display file size errors:

```javascript
try {
  await emailAPI.replyToEmail(id, formData);
} catch (error) {
  if (error.response?.data?.message?.includes('File too large')) {
    toast.error('File size exceeds 25MB limit. Please use smaller files or compress them.');
  } else {
    toast.error('Failed to send reply');
  }
}
```

### Backend Error Response
```json
{
  "success": false,
  "message": "File too large. Maximum size: 25MB per file",
  "code": "LIMIT_FILE_SIZE"
}
```

## Related Files
- `backend/src/middleware/upload.js` - File size limit configuration
- `backend/src/controllers/emailController.js` - Tracking ID reuse logic
- `backend/src/services/emailTrackingService.js` - Tracking ID generation

## Migration Notes

### No Database Changes Required
- File size is middleware configuration
- Tracking ID detection is runtime logic
- No schema updates needed

### Backward Compatibility
- ✅ Existing emails with tracking IDs continue to work
- ✅ New emails get tracking IDs as before
- ✅ Replies automatically detect and reuse existing IDs
- ✅ No manual intervention needed

### Deployment
1. Deploy backend changes
2. Restart backend server (to load new middleware config)
3. No frontend changes required
4. Test file uploads and email replies

---

**Status**: ✅ Fixed  
**Priority**: High - File uploads blocked, tracking IDs duplicated  
**Impact**: Improves file upload limits and conversation tracking  
**Testing**: Required - Test various file sizes and reply scenarios
