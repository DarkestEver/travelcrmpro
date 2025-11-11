# Email Account Update Fix

## Issue
When trying to update email account settings (like polling interval), the backend was throwing validation errors:
```
EmailAccount validation failed: imap.password: Path `imap.password` is required., smtp.password: Path `smtp.password` is required.
```

## Root Cause
The EmailAccount model has password fields marked as required when IMAP/SMTP is enabled:
```javascript
password: {
  type: String,
  required: function() { return this.imap.enabled; }
}
```

When updating settings through the UI, the frontend correctly sends `imap` and `smtp` objects WITHOUT the password field (since it's not being changed), but the backend controller was replacing the entire `imap`/`smtp` objects, which triggered validation.

## Solution
Updated `backend/src/controllers/emailAccountController.js` in the `updateEmailAccount` function to:

1. **Preserve existing passwords** when not provided in update
2. **Merge update data** with existing data instead of replacing
3. **Only update password** when explicitly provided

### Code Changes
```javascript
// Before - This replaced entire imap/smtp objects
emailAccount[field] = req.body[field];

// After - This merges and preserves passwords
if (field === 'imap' && req.body.imap) {
  if (!req.body.imap.password) {
    const { password, ...imapWithoutPassword } = req.body.imap;
    emailAccount.imap = {
      ...emailAccount.imap.toObject(),
      ...imapWithoutPassword
    };
  } else {
    emailAccount.imap = req.body.imap;
  }
}
```

## Testing
1. Edit email account in UI
2. Update polling interval from 300 to 600 seconds
3. Leave password fields empty
4. Click Save
5. ✅ Should save successfully without password validation errors

## Frontend Behavior
The Edit form already handles this correctly:
```javascript
// Only include passwords if they were provided
if (!formData.imap.password) {
  delete submitData.imap.password;
}
if (!formData.smtp.password) {
  delete submitData.smtp.password;
}
```

## Commits
- `3291861` - Added polling interval field to UI
- `2b3181a` - Fixed password validation on partial updates

## Result
✅ Users can now update email account settings (like polling interval) without needing to re-enter passwords
