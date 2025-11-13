# Email Re-categorization & Duplicate Query Management

## Overview

The **Re-categorize Feature** allows agents to manually change email categories and link duplicate customer queries together, ensuring proper conversation threading and preventing fragmented communication.

## Features

### 1. Manual Re-categorization
- Change email category from AI-assigned to agent-selected
- Categories: CUSTOMER, SUPPLIER, AGENT, FINANCE, OTHER
- Maintains audit trail of category changes

### 2. Duplicate Query Detection
- Automatically searches for existing emails from same sender
- Shows list of previous queries when re-categorizing
- Displays email subject, category, status, and date

### 3. Link to Existing Query
- One-click linking to parent query
- Updates conversation thread automatically
- Marks email as duplicate
- Creates parent-child relationship in database

### 4. Conversation Threading
- All linked emails share the same conversation thread
- Parent query shows all child duplicates
- Audit trail records linking actions
- Future replies automatically part of same thread

---

## User Interface

### Re-categorize Modal Components

1. **Current Email Info**
   - Subject, sender name/email, received date
   - Visual card at top of modal

2. **Category Dropdown**
   - Required field
   - 5 options: CUSTOMER, SUPPLIER, AGENT, FINANCE, OTHER
   - Pre-selected with current category

3. **Existing Queries List**
   - Automatically populated from same sender
   - Shows up to 50 most recent emails
   - Each query displays:
     - Subject (truncated if long)
     - Category badge (color-coded)
     - Status badge (PENDING, IN_PROGRESS, COMPLETED, FAILED)
     - Date/time received
     - Destination (if extracted)
   - Radio button selection
   - Click anywhere on card to select

4. **Duplicate Warning**
   - Yellow alert box appears when query selected
   - Explains linking behavior
   - Warns about conversation thread update

5. **Action Buttons**
   - Cancel: Close modal without changes
   - Save: Re-categorize only (if no parent selected)
   - Link & Re-categorize: Update category and link to parent

---

## Technical Implementation

### Frontend Files Modified

**`frontend/src/pages/emails/EmailDetail.jsx`**
- Added modal state management
- Implemented `searchExistingQueries()` function
- Implemented `handleRecategorize()` function
- Added Re-categorize Modal UI component (inline)

**`frontend/src/services/emailAPI.js`**
- Added `searchByEmail(emailAddress)` method
- Added `updateEmailCategory(id, data)` method

### Backend Files Modified

**`backend/src/routes/emailRoutes.js`**
```javascript
// New routes
router.get('/search-by-email', emailController.searchByEmail);
router.patch('/:id/category', emailController.updateEmailCategory);
```

**`backend/src/controllers/emailController.js`**
- Added `searchByEmail()` controller method
- Added `updateEmailCategory()` controller method

**`backend/src/models/EmailLog.js`**
- Added `parentQueryId` field (ObjectId ref to EmailLog)
- Added `childQueries` array (array of ObjectId refs)
- Added `isDuplicate` boolean field
- Added `conversationHistory` array for audit trail

---

## API Endpoints

### Search Emails by Sender

**GET** `/api/v1/emails/search-by-email?email=customer@example.com`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `email` (required): Email address to search for

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60a1...",
      "subject": "Bali Trip Inquiry",
      "category": "CUSTOMER",
      "processingStatus": "COMPLETED",
      "receivedDate": "2024-01-15T10:30:00Z",
      "extractedData": {
        "destination": {
          "city": "Ubud",
          "country": "Indonesia"
        }
      },
      "from": {
        "email": "john@example.com",
        "name": "John Doe"
      },
      "to": [...]
    }
  ],
  "count": 3
}
```

### Update Email Category

**PATCH** `/api/v1/emails/:id/category`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "category": "CUSTOMER",
  "parentQueryId": "60a2...",  // Optional
  "isDuplicate": true           // Optional
}
```

**Response (Simple Re-categorization):**
```json
{
  "success": true,
  "message": "Email re-categorized successfully",
  "data": {
    "_id": "60a1...",
    "subject": "Follow-up on Bali Trip",
    "category": "CUSTOMER",
    "conversationHistory": [
      {
        "timestamp": "2024-01-16T14:22:00Z",
        "action": "RECATEGORIZED",
        "actor": "agent@travelcrm.com",
        "details": {
          "oldCategory": "OTHER",
          "newCategory": "CUSTOMER",
          "parentQueryId": null
        }
      }
    ]
  }
}
```

**Response (Linked to Parent):**
```json
{
  "success": true,
  "message": "Email re-categorized and linked to existing query",
  "data": {
    "_id": "60a1...",
    "subject": "Follow-up on Bali Trip",
    "category": "CUSTOMER",
    "parentQueryId": "60a2...",
    "isDuplicate": true,
    "conversationHistory": [
      {
        "timestamp": "2024-01-16T14:22:00Z",
        "action": "RECATEGORIZED_AND_LINKED",
        "actor": "agent@travelcrm.com",
        "details": {
          "oldCategory": "OTHER",
          "newCategory": "CUSTOMER",
          "parentQueryId": "60a2..."
        }
      }
    ]
  }
}
```

---

## Database Schema Changes

### EmailLog Model Additions

```javascript
// Duplicate Query Management
parentQueryId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'EmailLog',
  index: true
},
childQueries: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'EmailLog'
}],
isDuplicate: {
  type: Boolean,
  default: false,
  index: true
},

// Conversation History (audit trail)
conversationHistory: [{
  timestamp: {
    type: Date,
    default: Date.now
  },
  action: {
    type: String,
    enum: [
      'CREATED',
      'CATEGORIZED',
      'RECATEGORIZED',
      'LINKED_DUPLICATE',
      'RECATEGORIZED_AND_LINKED',
      'EXTRACTED_DATA',
      'MATCHED_PACKAGES',
      'RESPONSE_GENERATED',
      'QUOTE_CREATED',
      'REPLIED',
      'FORWARDED',
      'MARKED_FOR_REVIEW',
      'REVIEWED'
    ]
  },
  actor: String, // User email or 'SYSTEM'
  details: mongoose.Schema.Types.Mixed
}]
```

---

## Workflow

### Agent Workflow: Re-categorize Email

1. **Open Email Detail**
   - Agent opens email from Processing History or Email Dashboard
   - Email shows current category and processing status

2. **Click "Re-categorize" Button**
   - Modal opens with current category pre-selected
   - Backend searches for emails from same sender (case-insensitive)
   - Existing queries load automatically

3. **Select New Category** (Optional)
   - Agent changes category dropdown if needed
   - Categories: CUSTOMER, SUPPLIER, AGENT, FINANCE, OTHER

4. **Link to Existing Query** (Optional)
   - If duplicates found, agent sees list of previous emails
   - Click any email card to select as parent query
   - Yellow warning shows linking behavior

5. **Save Changes**
   - If no parent selected: Simple re-categorization
   - If parent selected: Links email + updates thread
   - Success toast notification
   - Modal closes automatically
   - Email detail refreshes with new data

### Backend Workflow: Update Category

1. **Validate Request**
   - Check category is valid enum value
   - Verify email exists and belongs to user's tenant
   - If parentQueryId provided, verify parent exists

2. **Update Email**
   - Set new category
   - If linking: Set parentQueryId and isDuplicate flag
   - Add entry to conversationHistory

3. **Update Parent Query**
   - Add child email ID to parent's childQueries array
   - If parent has threadId, copy to child email
   - Add conversation entry to parent's history

4. **Return Updated Data**
   - Send success message with updated email
   - Frontend refreshes email detail view

---

## Use Cases

### Use Case 1: Simple Re-categorization
**Scenario:** AI categorized customer inquiry as "OTHER"

**Steps:**
1. Agent opens email detail
2. Clicks "Re-categorize"
3. Changes category to "CUSTOMER"
4. Clicks "Re-categorize" button
5. Email updates, no parent linkage

**Result:** Email now shows correct category

### Use Case 2: Duplicate Customer Query
**Scenario:** Customer sends second email about same trip

**Steps:**
1. Agent opens new email from John Doe
2. Clicks "Re-categorize"
3. Sees John's previous inquiry from last week
4. Clicks on previous inquiry card to select
5. Yellow warning appears about linking
6. Clicks "Link & Re-categorize"
7. Both emails now part of same conversation thread

**Result:**
- New email marked as duplicate
- Both emails linked in conversation thread
- Parent query shows child reference
- Audit trail records linking action

### Use Case 3: Finding Customer History
**Scenario:** Agent wants to see all previous emails from customer

**Steps:**
1. Open any email from customer
2. Click "Re-categorize"
3. View list of all previous emails automatically
4. Review customer's history (no need to link)
5. Close modal without changes

**Result:** Agent has quick access to customer history

---

## Edge Cases & Error Handling

### No Existing Queries Found
- Modal shows empty state message
- "No other queries found from this customer email"
- Only re-categorization option available

### Parent Query in Different Tenant
- Backend validates tenant match
- Returns 404 error if parent not found
- Toast error: "Parent query not found"

### Email Already Linked
- Frontend doesn't prevent re-linking
- Backend overwrites parentQueryId if different
- Conversation history tracks all linking changes

### Category Validation
- Frontend dropdown prevents invalid values
- Backend validates against enum
- Returns 400 error if invalid category

### Network Errors
- Frontend shows error toast
- Modal stays open for retry
- Loading states prevent double-submission

---

## Testing

### Manual Testing Checklist

- [ ] **Simple Re-categorization**
  - [ ] Change CUSTOMER → SUPPLIER
  - [ ] Change OTHER → CUSTOMER
  - [ ] Verify category updates in email list
  - [ ] Check conversationHistory added

- [ ] **Duplicate Query Linking**
  - [ ] Create 2 emails from same sender
  - [ ] Re-categorize second email
  - [ ] Link to first email as parent
  - [ ] Verify isDuplicate flag set
  - [ ] Check parent's childQueries array
  - [ ] Verify conversationHistory on both emails

- [ ] **Search Functionality**
  - [ ] Search with no results (new customer)
  - [ ] Search with 1 result
  - [ ] Search with 10+ results
  - [ ] Verify case-insensitive search
  - [ ] Check tenant isolation (shouldn't see other tenants)

- [ ] **UI/UX**
  - [ ] Modal opens/closes properly
  - [ ] Loading states show during API calls
  - [ ] Success/error toasts appear
  - [ ] Radio selection works (click card)
  - [ ] Warning appears when parent selected
  - [ ] Buttons disable during loading

- [ ] **Error Handling**
  - [ ] Invalid category (should not be possible)
  - [ ] Parent query not found
  - [ ] Network timeout
  - [ ] Unauthorized access
  - [ ] Email already deleted

### Automated Testing

Run the test script:

```powershell
node test-recategorize-feature.js
```

This tests:
1. Authentication
2. Get all emails
3. Search by email address
4. Simple re-categorization
5. Link to parent query

---

## Performance Considerations

### Search Optimization
- Index on `from.email` field for fast lookups
- Limit results to 50 most recent emails
- Case-insensitive regex search

### Database Queries
- Single query to find emails by sender
- Uses populate for referenced fields (minimal)
- Tenant isolation in all queries

### Frontend Optimization
- Modal lazy-loads search results
- Debounced search if search input added
- Virtual scrolling for 50+ results (future)

---

## Future Enhancements

### Phase 1 (Completed)
- ✅ Manual re-categorization
- ✅ Search emails by sender
- ✅ Link to existing query
- ✅ Conversation history audit trail

### Phase 2 (Future)
- [ ] Search with filters (date range, category, status)
- [ ] Bulk re-categorization
- [ ] Auto-suggest duplicates during email processing
- [ ] Merge conversation threads
- [ ] Unlink child from parent query

### Phase 3 (Future)
- [ ] Smart duplicate detection (AI-powered)
- [ ] Automatic conversation threading
- [ ] Customer communication timeline view
- [ ] Duplicate alert notifications

---

## Troubleshooting

### Issue: Modal doesn't open
**Solution:** Check console for errors. Verify email has valid `from.email` field.

### Issue: No existing queries found (but should exist)
**Solution:** 
1. Check tenant ID matches
2. Verify `from.email` is exact match (case-insensitive)
3. Check database for emails from that sender

### Issue: Cannot link to parent
**Solution:**
1. Verify parent query exists in same tenant
2. Check parent query ID is valid ObjectId
3. Review backend logs for validation errors

### Issue: Category not updating
**Solution:**
1. Check user has permission (authenticated)
2. Verify email belongs to user's tenant
3. Check for server errors in backend logs

### Issue: Conversation history not showing
**Solution:**
1. Verify EmailLog model has conversationHistory field
2. Check backend saves conversation entry
3. Refresh email detail page

---

## Security Considerations

### Tenant Isolation
- All queries filter by `tenantId`
- Cannot search or link emails from other tenants
- Backend validates tenant ownership on all operations

### Authentication
- All endpoints require authentication
- JWT token validation on every request
- User context available via `req.user`

### Input Validation
- Category enum validated on backend
- Parent query ID validated as ObjectId
- Email address sanitized in search queries

### Audit Trail
- All re-categorization actions logged
- Actor email recorded (who made the change)
- Timestamp and details stored in conversationHistory

---

## Support & Maintenance

### Logs
- Backend logs all re-categorize actions
- Console logs in frontend for debugging
- Error messages include context

### Monitoring
- Track re-categorization frequency
- Monitor search query performance
- Alert on high error rates

### Database Maintenance
- Regular index optimization
- Archive old conversationHistory entries (future)
- Clean up orphaned child queries (future)

---

## Summary

The **Re-categorize Feature** empowers agents to:
1. ✅ Manually control email categorization
2. ✅ Find and link duplicate customer queries
3. ✅ Maintain clean conversation threads
4. ✅ Prevent fragmented customer communication
5. ✅ Track all changes with audit trail

**Key Benefits:**
- Better customer communication tracking
- Reduced duplicate queries
- Improved agent efficiency
- Full audit trail for compliance
- Easy to use, hard to break

**Next Steps:**
1. Test with real customer emails
2. Train agents on feature usage
3. Monitor adoption and effectiveness
4. Gather feedback for improvements
