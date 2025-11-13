# Email Account Watchers UI

## Overview
The Email Account Watchers feature allows administrators to configure watchers at the email account level. Watchers receive BCC copies of all emails sent through a specific email account, providing oversight, compliance, and audit capabilities.

## Features Implemented

### 1. Backend API Endpoints

#### Add Watcher
```
POST /api/v1/email-accounts/:id/watchers
```

**Request Body:**
```json
{
  "email": "watcher@example.com",
  "name": "John Doe",
  "role": "supervisor",
  "description": "Team supervisor monitoring"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Watcher added successfully",
  "data": [
    {
      "email": "watcher@example.com",
      "name": "John Doe",
      "role": "supervisor",
      "description": "Team supervisor monitoring",
      "addedAt": "2024-01-15T10:30:00.000Z",
      "addedBy": "507f1f77bcf86cd799439011",
      "isActive": true
    }
  ]
}
```

#### Remove Watcher
```
DELETE /api/v1/email-accounts/:id/watchers/:email
```

**Response:**
```json
{
  "success": true,
  "message": "Watcher removed successfully",
  "data": []
}
```

#### Toggle Watcher Status
```
PATCH /api/v1/email-accounts/:id/watchers/:email/toggle
```

**Response:**
```json
{
  "success": true,
  "message": "Watcher activated successfully",
  "data": [...]
}
```

### 2. Frontend Components

#### AddWatcherModal Component
**Location:** `frontend/src/components/modals/AddWatcherModal.jsx`

**Features:**
- Form validation (email required and format check)
- Role selection dropdown with 6 predefined roles
- Optional name and description fields
- Loading states during submission
- Error handling and display
- Reset form on close/submit

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  onAdd: (watcherData) => Promise<void>,
  title: string // Optional, defaults to "Add Watcher"
}
```

**Watcher Roles:**
- Owner
- Manager
- Supervisor
- Auditor
- Compliance Officer
- Other

#### EmailAccountCard Watchers Section
**Location:** `frontend/src/pages/settings/EmailAccounts.jsx`

**Features:**
- Collapsible watchers section with eye icon toggle
- Watcher count badge
- "Add Watcher" button
- Watcher list with visual status indicators:
  - Green background for active watchers
  - Gray background for inactive watchers
  - Role badges
  - Added date display
- Per-watcher actions:
  - Toggle active/inactive status (eye icon)
  - Remove watcher (trash icon)
- Empty state with helpful message
- Integration with AddWatcherModal

### 3. API Service Updates
**Location:** `frontend/src/services/emailAccountsAPI.js`

**New Methods:**
```javascript
// Add watcher to email account
addWatcher: async (id, watcherData) => Promise<Response>

// Remove watcher from email account
removeWatcher: async (id, email) => Promise<Response>

// Toggle watcher active/inactive
toggleWatcher: async (id, email) => Promise<Response>
```

### 4. Database Schema Updates

#### Quote Model
**Location:** `backend/src/models/Quote.js`

Added `watchers` array field:
```javascript
watchers: [{
  email: { type: String, required: true, lowercase: true, trim: true },
  name: String,
  addedAt: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  notifyOnReply: { type: Boolean, default: true }
}]
```

#### Booking Model
**Location:** `backend/src/models/Booking.js`

Added identical `watchers` array field with same structure.

## Usage Guide

### For Administrators

#### 1. Adding a Watcher to an Email Account

1. Navigate to **Settings** → **Email Accounts**
2. Find the email account you want to add a watcher to
3. Scroll to the **Email Account Watchers** section
4. Click **Add Watcher** button
5. Fill in the modal form:
   - **Email Address** (required): The watcher's email
   - **Name** (optional): Full name of the watcher
   - **Role**: Select from dropdown (owner, manager, supervisor, etc.)
   - **Description** (optional): Notes about why this watcher is added
6. Click **Add Watcher** to confirm

#### 2. Viewing Watchers

1. In the Email Account card, find the **Email Account Watchers** section
2. Click the eye icon to expand/collapse the watchers list
3. The badge shows the total number of watchers configured
4. Each watcher displays:
   - Email address
   - Name (if provided)
   - Role badge
   - Active/Inactive status
   - Description (if provided)
   - Date added

#### 3. Managing Watchers

**Deactivate/Activate a Watcher:**
- Click the eye icon (green) or eye-off icon (gray) next to a watcher
- This temporarily disables the watcher without removing them
- Inactive watchers will NOT receive email copies

**Remove a Watcher:**
- Click the trash icon next to a watcher
- Confirm the removal in the popup dialog
- This permanently removes the watcher from the account

### For Developers

#### Extending Watchers to Other Components

The `AddWatcherModal` component is reusable. To add watchers to other entities:

**Example: Add Watchers to Email Detail Page**

```javascript
import AddWatcherModal from '../../components/modals/AddWatcherModal';

function EmailDetail() {
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  
  const handleAddWatcher = async (watcherData) => {
    // Your API call here
    await emailAPI.addWatcherToEmail(emailId, watcherData);
  };
  
  return (
    <>
      {/* Your email detail UI */}
      <button onClick={() => setShowWatcherModal(true)}>
        Add Watcher
      </button>
      
      <AddWatcherModal
        isOpen={showWatcherModal}
        onClose={() => setShowWatcherModal(false)}
        onAdd={handleAddWatcher}
        title="Add Email Watcher"
      />
    </>
  );
}
```

#### Backend Controller Pattern

```javascript
// Add this pattern to any controller that needs watchers
exports.addWatcher = async (req, res) => {
  try {
    const { email, name, role, description } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const entity = await YourModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }
    
    // Check duplicate
    const exists = entity.watchers.find(w => w.email === email.toLowerCase());
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'This email is already a watcher'
      });
    }
    
    // Add watcher
    entity.watchers.push({
      email: email.toLowerCase().trim(),
      name,
      role: role || 'other',
      description,
      addedAt: new Date(),
      addedBy: req.user._id,
      isActive: true
    });
    
    await entity.save();
    
    res.json({
      success: true,
      message: 'Watcher added successfully',
      data: entity.watchers
    });
  } catch (error) {
    console.error('Error adding watcher:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding watcher',
      error: error.message
    });
  }
};
```

## Three-Level Watchers System

The complete watchers architecture has three levels:

### 1. Global Tenant Watchers
**Location:** `Tenant.globalWatchers`
- Receive ALL emails across entire tenant
- Configured at tenant settings level
- Highest level of oversight
- Example: CEO, Compliance Officer

### 2. Email Account Watchers (IMPLEMENTED)
**Location:** `EmailAccount.watchers`
- Receive all emails from specific email account
- Configured in Email Accounts settings
- Account-level oversight
- Example: Team supervisor, Department manager

### 3. Entity-Specific Watchers (MODELS UPDATED)
**Location:** `EmailLog.watchers`, `Quote.watchers`, `Booking.watchers`
- Receive emails for specific email/quote/booking
- Configured on individual entity
- Lowest level, most granular
- Example: Special auditor for high-value booking

### Watcher Priority & Collection

The `watcherService.collectAllWatchers()` function collects watchers in order:
1. Global tenant watchers
2. Email account watchers
3. Entity-specific watchers

All three levels are combined and deduplicated before adding to BCC.

## Testing

### Manual Testing Steps

1. **Test Adding Watcher:**
   - Go to Email Accounts settings
   - Add a watcher with valid email
   - Verify watcher appears in list
   - Check watcher count badge updates

2. **Test Duplicate Prevention:**
   - Try adding same email twice
   - Verify error message appears

3. **Test Toggle Status:**
   - Add a watcher
   - Click eye icon to deactivate
   - Verify background turns gray
   - Click eye-off icon to reactivate
   - Verify background turns green

4. **Test Remove Watcher:**
   - Add a watcher
   - Click trash icon
   - Confirm removal dialog
   - Verify watcher is removed from list
   - Check count badge decrements

5. **Test Email Sending:**
   - Add watcher to email account
   - Send email from that account
   - Verify watcher receives BCC copy
   - Check email headers for BCC field

6. **Test Inactive Watcher:**
   - Add watcher and deactivate
   - Send email from account
   - Verify inactive watcher does NOT receive email

## UI Screenshots Description

### Email Account Card - Collapsed
- Watchers section header with count badge
- "Add Watcher" button (blue)
- Eye icon to expand

### Email Account Card - Expanded
- List of watchers with color-coded status
- Each watcher shows:
  - Email address (bold)
  - Name (gray text)
  - Role badge (blue)
  - Active/Inactive badge
  - Description (small gray text)
  - Added date
  - Action buttons (eye icon, trash icon)

### Add Watcher Modal
- Modal header with UserPlus icon
- Form fields:
  - Email input with validation
  - Name input
  - Role dropdown
  - Description textarea
- Cancel and Add Watcher buttons

### Empty State
- Users icon (large, gray)
- "No watchers configured" message
- Explanation text about BCC functionality
- "Add First Watcher" button

## Security Considerations

1. **Authorization:**
   - Only admin, super_admin, and operator roles can manage watchers
   - Tenant isolation enforced (req.user.tenantId check)

2. **Email Privacy:**
   - Watchers receive BCC copies (hidden from original recipients)
   - Inactive watchers are excluded from email distribution

3. **Data Validation:**
   - Email format validation on frontend and backend
   - Email normalization (lowercase, trim)
   - Duplicate detection prevents multiple entries

4. **Audit Trail:**
   - `addedAt` timestamp records when watcher was added
   - `addedBy` references the user who added the watcher
   - Can track who configured each watcher

## Performance Notes

- Watchers are stored as embedded documents (not separate collection)
- No additional database queries for small watcher lists (< 100)
- Watcher collection happens at email send time only
- Deduplication uses Set for O(n) performance

## Future Enhancements

### Phase 1 - Remaining UI (Next Steps)
- [ ] Global tenant watchers UI in Tenant Settings page
- [ ] Email-specific watchers in Email Detail page
- [ ] Quote-specific watchers in Quote Detail page
- [ ] Booking-specific watchers in Booking Detail page

### Phase 2 - Advanced Features
- [ ] Watcher notifications preferences (reply-only, all, summary)
- [ ] Watcher groups (define reusable groups of watchers)
- [ ] Watcher analytics (track who views emails most)
- [ ] Scheduled watcher reports
- [ ] Export watcher audit logs

### Phase 3 - Automation
- [ ] Auto-add watchers based on rules (e.g., amount thresholds)
- [ ] Smart watcher suggestions based on email content
- [ ] Integration with external compliance systems
- [ ] GDPR compliance features (watcher consent tracking)

## Troubleshooting

### Watchers Not Receiving Emails

**Check:**
1. Is watcher marked as active? (green background)
2. Check email account SMTP configuration
3. Verify watcher email is valid and not bouncing
4. Check spam folder in watcher's inbox
5. Review backend logs for email sending errors

**Console Logs to Check:**
```
🌍 Global tenant watchers: 2
📧 Email account watchers: 1
📝 Entity-specific watchers: 0
👁️ Total unique watchers: 3
```

### Watcher Already Exists Error

This is expected behavior. To update an existing watcher:
1. Remove the old entry
2. Add new entry with updated details

### Modal Not Closing After Add

- Check browser console for errors
- Verify API response is successful
- Ensure `onClose()` is called in success handler

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Frontend console errors
- Review `docs/WATCHERS_AND_REPLY_ALL.md` for architecture details
- Contact development team

---

**Last Updated:** January 2024  
**Version:** 1.0  
**Status:** Production Ready
