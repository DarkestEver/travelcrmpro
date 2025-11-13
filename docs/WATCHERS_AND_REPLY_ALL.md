# Watchers & Reply-All Feature

## Overview

Enhanced email functionality with two key features:
1. **Watchers List** - Automatically BCC designated people on all outgoing emails
2. **Reply-All Behavior** - Include original CC recipients when replying to emails

## Features

### 1. Watchers List

**What it does:**
- Automatically adds designated email addresses to BCC on ALL outgoing emails
- Useful for managers, supervisors, auditors, or backup staff who need visibility
- Watchers receive copies without recipients knowing (BCC)

**Use Cases:**
- Manager wants to monitor all customer communications
- Compliance/audit requirements to log all communications
- Backup agent needs visibility into all conversations
- Training purposes - new agents shadow experienced ones

**Where watchers are added:**
- ✅ Email replies
- ✅ Quote emails
- ✅ Booking confirmations
- ✅ All outgoing communications

### 2. Reply-All Behavior

**What it does:**
- When replying to an email that had CC recipients, they are automatically included
- Works like standard "Reply All" in email clients
- Ensures all original participants stay in the conversation

**Example:**
```
Original Email:
  From: customer@example.com
  To: support@agency.com
  CC: manager@customer.com, assistant@customer.com

Your Reply:
  From: support@agency.com
  To: customer@example.com
  CC: manager@customer.com, assistant@customer.com  ← Automatically added
```

## Schema Changes

### EmailAccount Model

Added `watchers` array field:

```javascript
watchers: [{
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: String,
  role: {
    type: String,
    enum: ['manager', 'supervisor', 'auditor', 'backup', 'other'],
    default: 'other'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}]
```

## How It Works

### Adding Watchers

**Via Database (for now):**
```javascript
// Connect to MongoDB
use travelcrm;

// Add watcher to an email account
db.emailaccounts.updateOne(
  { email: "support@agency.com" },
  {
    $push: {
      watchers: {
        email: "manager@agency.com",
        name: "John Manager",
        role: "manager",
        isActive: true,
        addedAt: new Date()
      }
    }
  }
);
```

**Via API (future UI implementation):**
```javascript
PATCH /api/v1/email-accounts/:id/watchers
{
  "watchers": [
    {
      "email": "manager@agency.com",
      "name": "John Manager",
      "role": "manager"
    },
    {
      "email": "auditor@agency.com",
      "name": "Jane Auditor",
      "role": "auditor"
    }
  ]
}
```

### Email Sending Logic

#### Reply Emails (emailController.js)

```javascript
// 1. Get user-added CC/BCC
let ccEmails = [userAddedCC...];
let bccEmails = [userAddedBCC...];

// 2. Add original CC recipients (Reply-All)
if (email.cc && email.cc.length > 0) {
  const originalCcEmails = email.cc
    .map(c => c.email)
    .filter(e => 
      e !== ourEmail && // Don't CC ourselves
      !ccEmails.includes(e) // No duplicates
    );
  ccEmails = [...ccEmails, ...originalCcEmails];
}

// 3. Add watchers to BCC
if (accountObj.watchers && accountObj.watchers.length > 0) {
  const activeWatchers = accountObj.watchers
    .filter(w => w.isActive)
    .map(w => w.email)
    .filter(e => 
      !bccEmails.includes(e) && // No duplicates
      !ccEmails.includes(e) && // Not in CC
      e !== recipient // Not the recipient
    );
  bccEmails.push(...activeWatchers);
}
```

#### Quote/Booking Emails (email.js)

```javascript
// Add watchers to BCC
if (accountObj.watchers && accountObj.watchers.length > 0) {
  const activeWatchers = accountObj.watchers
    .filter(w => w.isActive)
    .map(w => w.email)
    .filter(e => e !== customer.email);
  
  if (activeWatchers.length > 0) {
    mailOptions.bcc = activeWatchers.join(', ');
  }
}
```

## Testing

### Test Watchers Feature

1. **Add a watcher to your email account:**
   ```bash
   # In MongoDB shell
   db.emailaccounts.findOne({ email: "your-email@gmail.com" })
   
   db.emailaccounts.updateOne(
     { email: "your-email@gmail.com" },
     {
       $set: {
         watchers: [{
           email: "watcher@example.com",
           name: "Watcher Name",
           role: "manager",
           isActive: true,
           addedAt: new Date()
         }]
       }
     }
   );
   ```

2. **Send a quote or reply:**
   - Send a quote to a customer
   - Reply to an email
   - Check backend logs for:
     ```
     👁️  Added 1 watchers to BCC: [ 'watcher@example.com' ]
     ```

3. **Verify email received:**
   - Check watcher's email inbox
   - Should receive BCC copy of the email
   - Customer won't see watcher in recipients

### Test Reply-All Feature

1. **Create an email with CC recipients:**
   - Send an email from customer with CC addresses
   - Or manually add CC to an email in database:
     ```javascript
     db.emaillogs.updateOne(
       { _id: ObjectId("email-id") },
       {
         $set: {
           cc: [
             { email: "manager@customer.com", name: "Manager" },
             { email: "assistant@customer.com", name: "Assistant" }
           ]
         }
       }
     );
     ```

2. **Reply to that email:**
   - Open email in UI
   - Click Reply
   - Check logs for:
     ```
     📋 Added 2 original CC recipients (Reply-All)
     ```

3. **Verify CC included:**
   - All original CC recipients should be in the CC field
   - You can add additional CC recipients
   - All will be included in the sent email

## Console Logs

Watch for these logs when emails are sent:

```
📋 Added 2 original CC recipients (Reply-All)
👁️  Added 1 watchers to BCC: [ 'manager@agency.com' ]
📤 Sending reply via tenant SMTP:
   host: 'smtp.gmail.com'
   to: 'customer@example.com'
   cc: [ 'manager@customer.com', 'assistant@customer.com' ]
   bcc: [ 'manager@agency.com' ]
✅ Reply sent successfully via tenant SMTP
```

## Privacy & Security

### Watchers (BCC)
- ✅ **Hidden from recipients** - Watchers are added as BCC
- ✅ **Recipients don't know** who's watching
- ✅ **No reply-all risk** - If recipient replies, it won't go to watchers

### Original CC Recipients
- ✅ **Transparent** - Recipients see who's in CC
- ✅ **Reply-all enabled** - If anyone replies, all CCs are included
- ✅ **Expected behavior** - Standard email etiquette

## Smart Filtering

The system automatically prevents duplicate recipients:

```javascript
// Prevents duplicates
- Don't CC our own email address
- Don't add watcher if already in CC
- Don't add watcher if already in BCC
- Don't BCC the main recipient
- Don't add duplicate CC addresses
```

## UI Enhancement (Future)

### Email Account Settings Page

Add Watchers section:
```jsx
<div className="watchers-section">
  <h3>Watchers</h3>
  <p>These people will receive BCC copies of all outgoing emails</p>
  
  <table>
    <thead>
      <tr>
        <th>Email</th>
        <th>Name</th>
        <th>Role</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {watchers.map(watcher => (
        <tr key={watcher.email}>
          <td>{watcher.email}</td>
          <td>{watcher.name}</td>
          <td>{watcher.role}</td>
          <td>{watcher.isActive ? 'Active' : 'Inactive'}</td>
          <td>
            <button onClick={() => toggleWatcher(watcher)}>
              {watcher.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => removeWatcher(watcher)}>
              Remove
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  
  <button onClick={openAddWatcherModal}>Add Watcher</button>
</div>
```

### Reply Modal Enhancement

Show indicator when Reply-All is active:
```jsx
{originalCcCount > 0 && (
  <div className="alert info">
    <InfoCircle />
    Reply-All: {originalCcCount} original CC recipient(s) will be included
  </div>
)}

{watchersCount > 0 && (
  <div className="alert info">
    <Eye />
    {watchersCount} watcher(s) will receive BCC copy
  </div>
)}
```

## Database Queries

### List all watchers across all accounts
```javascript
db.emailaccounts.aggregate([
  { $match: { "watchers.0": { $exists: true } } },
  { $unwind: "$watchers" },
  { $project: {
    email: 1,
    accountName: 1,
    "watcherEmail": "$watchers.email",
    "watcherName": "$watchers.name",
    "watcherRole": "$watchers.role",
    "watcherActive": "$watchers.isActive"
  }}
]);
```

### Activate/Deactivate a watcher
```javascript
// Deactivate
db.emailaccounts.updateOne(
  { 
    email: "support@agency.com",
    "watchers.email": "manager@agency.com"
  },
  {
    $set: { "watchers.$.isActive": false }
  }
);

// Activate
db.emailaccounts.updateOne(
  { 
    email: "support@agency.com",
    "watchers.email": "manager@agency.com"
  },
  {
    $set: { "watchers.$.isActive": true }
  }
);
```

### Remove a watcher
```javascript
db.emailaccounts.updateOne(
  { email: "support@agency.com" },
  {
    $pull: {
      watchers: { email: "manager@agency.com" }
    }
  }
);
```

## Best Practices

1. **Use watchers sparingly** - Too many watchers = inbox overload
2. **Document why** - Add descriptive names and roles
3. **Use BCC for watchers** - Keeps them hidden from customers
4. **Deactivate instead of delete** - Maintain audit trail
5. **Review quarterly** - Remove watchers who no longer need access
6. **Inform watchers** - Let them know they're receiving copies
7. **GDPR compliance** - Ensure watchers have legitimate business need

## Compliance & Audit

### Benefits for Compliance
- ✅ **Complete email trail** - Watchers receive all communications
- ✅ **No user action needed** - Automatic, can't be forgotten
- ✅ **Audit-ready** - All emails logged and forwarded
- ✅ **Quality assurance** - Supervisors can monitor service quality
- ✅ **Training** - New agents' emails reviewed by trainers

### Legal Considerations
- ⚠️ **Privacy laws** - Check local regulations (GDPR, etc.)
- ⚠️ **Customer consent** - Some jurisdictions require disclosure
- ⚠️ **Data retention** - Watchers must follow retention policies
- ⚠️ **Access control** - Only authorized personnel as watchers

## Troubleshooting

### Watchers not receiving emails

1. **Check watcher is active:**
   ```javascript
   db.emailaccounts.findOne(
     { email: "support@agency.com" },
     { watchers: 1 }
   );
   ```

2. **Check logs:**
   ```
   Look for: 👁️  Added X watchers to BCC
   ```

3. **Check spam folder:**
   - Watcher's email provider may flag BCCs

4. **Verify email address:**
   - Typo in watcher email?
   - Email address valid?

### Original CC not included

1. **Check original email has CC:**
   ```javascript
   db.emaillogs.findOne({ _id: ObjectId("...") }, { cc: 1 });
   ```

2. **Check logs:**
   ```
   Look for: 📋 Added X original CC recipients
   ```

3. **Verify not our email:**
   - System skips our own email in CC

## Performance Impact

- **Minimal** - Just array operations and filtering
- **No extra queries** - Watchers already loaded with email account
- **No delays** - Same SMTP transaction sends to all recipients
- **BCC efficient** - SMTP handles BCC natively

## Summary

This feature provides:
1. ✅ **Automatic visibility** for designated watchers
2. ✅ **Reply-All functionality** maintains conversation context
3. ✅ **Zero user effort** - Works automatically
4. ✅ **Privacy preserved** - Watchers are BCC (hidden)
5. ✅ **Audit trail** - All communications captured
6. ✅ **Compliance ready** - Meets monitoring requirements
