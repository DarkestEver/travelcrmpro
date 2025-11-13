# Email Re-categorize Feature Implementation

## Overview
Implemented manual email re-categorization with duplicate query detection and linking functionality. This allows agents to correct email categories and link duplicate customer inquiries to maintain conversation continuity.

## Components Implemented

### 1. Frontend API Methods (`frontend/src/services/emailAPI.js`)

```javascript
// Re-categorize email with optional duplicate linking
recategorize: async (id, data) => {
  const response = await api.patch(`/emails/${id}/recategorize`, data);
  return response.data;
},

// Search existing queries for duplicate detection
searchQueries: async (query) => {
  const response = await api.get('/emails/search-queries', {
    params: { q: query }
  });
  return response.data;
},

// Link email to parent query
linkToQuery: async (id, parentQueryId) => {
  const response = await api.post(`/emails/${id}/link-query`, { parentQueryId });
  return response.data;
}
```

### 2. Backend Routes (`backend/src/routes/emailRoutes.js`)

```javascript
// Re-categorize and duplicate detection routes
router.patch('/:id/recategorize', emailController.recategorizeEmail);
router.get('/search-queries', emailController.searchQueries);
router.post('/:id/link-query', emailController.linkToQuery);
```

### 3. Backend Controller Methods (`backend/src/controllers/emailController.js`)

#### recategorizeEmail()
- Updates email category
- Links email to parent query if parentQueryId provided
- Marks email as duplicate
- Updates conversation history on both parent and child emails
- Adds child email to parent's childQueries array

#### searchQueries()
- Searches CUSTOMER category emails
- Searches in: from.email, from.name, subject, extractedData.customer fields
- Returns top 20 most recent matches
- Case-insensitive regex search

#### linkToQuery()
- Links email to parent query as child
- Updates both email records
- Maintains conversation history
- Prevents duplicate links

### 4. RecategorizeModal Component (`frontend/src/components/emails/RecategorizeModal.jsx`)

**Features:**
- 5 category selection cards with icons (👤🏨🤝💰📄)
- Visual descriptions for each category
- Search existing queries by customer name/email/subject
- Real-time search results display
- Query selection with visual feedback
- Checkbox to link as duplicate
- Selected query preview with confirmation message
- Conversation merging capability
- Fully self-contained with internal state management

**User Flow:**
1. User clicks "Re-categorize" button in EmailDetail
2. Modal opens with current category pre-selected
3. User selects new category from 5 options
4. If CUSTOMER category: search box appears
5. User searches for existing queries (optional)
6. User selects matching query and checks "Link as duplicate"
7. Confirmation message shows conversation will be merged
8. User clicks "Save" to update

### 5. EmailLog Model Fields (Already Existed)

```javascript
// Duplicate Query Management
parentQueryId: { type: ObjectId, ref: 'EmailLog', index: true },
childQueries: [{ type: ObjectId, ref: 'EmailLog' }],
isDuplicate: { type: Boolean, default: false, index: true },

// Conversation History (audit trail)
conversationHistory: [{
  timestamp: Date,
  action: String, // 'RECATEGORIZED', 'RECATEGORIZED_AND_LINKED', 'LINKED_DUPLICATE'
  actor: String, // User email or 'SYSTEM'
  details: Mixed // Additional context
}]
```

## Integration Steps

### EmailDetail.jsx Integration

1. **Add Import:**
```javascript
import RecategorizeModal from '../../components/emails/RecategorizeModal';
```

2. **Keep Simple State:**
```javascript
const [showRecategorizeModal, setShowRecategorizeModal] = useState(false);
```

3. **Replace Old Modal Implementation:**

**REMOVE** these old state variables (lines 71-75):
```javascript
// OLD - Remove these
const [newCategory, setNewCategory] = useState('');
const [searchQuery, setSearchQuery] = useState('');
const [existingQueries, setExistingQueries] = useState([]);
const [selectedQueryId, setSelectedQueryId] = useState(null);
const [recategorizing, setRecategorizing] = useState(false);
```

**REMOVE** the old `handleRecategorize` function (lines 137-167)

**REPLACE** the old modal implementation (around lines 1805-2020) with:
```jsx
{/* Re-categorize Modal */}
<RecategorizeModal
  isOpen={showRecategorizeModal}
  onClose={() => setShowRecategorizeModal(false)}
  email={email}
  onSuccess={fetchEmail}
/>
```

4. **The "Re-categorize" button** (around line 530) should already work:
```jsx
<button
  onClick={() => setShowRecategorizeModal(true)}
  className="..."
>
  <Tag className="w-4 h-4" />
  {email.category ? 'Re-categorize' : 'Categorize'}
</button>
```

## Testing Checklist

- [x] Backend API methods added (recategorize, searchQueries, linkToQuery)
- [x] Backend routes configured
- [x] Frontend API methods added
- [x] RecategorizeModal component created
- [x] EmailLog model has required fields (parentQueryId, childQueries, isDuplicate, conversationHistory)
- [ ] RecategorizeModal imported in EmailDetail
- [ ] Old modal code removed from EmailDetail
- [ ] Test re-categorization without linking
- [ ] Test search for existing queries
- [ ] Test linking as duplicate
- [ ] Test conversation history updates
- [ ] Test parent/child relationship
- [ ] Test with multiple duplicates

## Usage Examples

### Re-categorize Only
1. Open email details
2. Click "Re-categorize"
3. Select new category (e.g., CUSTOMER → SUPPLIER)
4. Click "Save"

### Re-categorize and Link Duplicate
1. Open duplicate email
2. Click "Re-categorize"
3. Select "CUSTOMER" category
4. Search for original query (e.g., customer name)
5. Click on matching query from results
6. Check "Link as duplicate"
7. Click "Save"

Result: Email is linked to parent, marked as duplicate, conversation threads are merged

## Benefits

1. **Manual Correction**: Agents can fix AI miscategorization
2. **Duplicate Detection**: Find similar queries from same customer
3. **Conversation Continuity**: Link related emails to maintain context
4. **Audit Trail**: All changes tracked in conversationHistory
5. **Visual Feedback**: Clear UI showing duplicate status and relationships
6. **Flexible Search**: Search by name, email, subject for better matching

## Database Schema

### Parent Query Record
```json
{
  "_id": "parent123",
  "category": "CUSTOMER",
  "childQueries": ["child456", "child789"],
  "conversationHistory": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "action": "LINKED_DUPLICATE",
      "actor": "agent@travel.com",
      "details": {
        "linkedEmailId": "child456",
        "linkedEmailSubject": "Follow up on Bali trip"
      }
    }
  ]
}
```

### Child Query Record
```json
{
  "_id": "child456",
  "category": "CUSTOMER",
  "parentQueryId": "parent123",
  "isDuplicate": true,
  "conversationHistory": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "action": "RECATEGORIZED_AND_LINKED",
      "actor": "agent@travel.com",
      "details": {
        "oldCategory": "OTHER",
        "newCategory": "CUSTOMER",
        "parentQueryId": "parent123"
      }
    }
  ]
}
```

## Next Steps

1. Clean up EmailDetail.jsx (remove old state variables and modal code)
2. Test the feature end-to-end
3. Add UI indicators showing when an email is a duplicate or has children
4. Add "View Parent Query" / "View Child Queries" links in EmailDetail
5. Add duplicate count badge in email list
6. Consider adding "Unlink from Parent" functionality

## File Sizes Before/After

- `EmailDetail.jsx`: 2027 lines (still needs refactoring into smaller components)
- `RecategorizeModal.jsx`: 311 lines (new component)
- `emailController.js`: 1570 lines → ~1850 lines (added 3 methods)
- `emailAPI.js`: 89 lines → ~110 lines (added 3 methods)

## Known Issues

- EmailDetail.jsx is still too large (2027 lines) and should be split into smaller components
- Old modal implementation still exists in EmailDetail.jsx (needs manual cleanup)
- No UI indicators for duplicate status in email list view
- No way to unlink from parent query after linking

## Future Enhancements

1. **Batch Re-categorization**: Select multiple emails and re-categorize at once
2. **Auto-suggest Duplicates**: AI-powered duplicate detection on new emails
3. **Merge Threads**: Combine multiple related emails into single thread
4. **Split Thread**: Separate unrelated emails that were incorrectly linked
5. **Duplicate Preview**: Show preview of parent query before linking
6. **History Timeline**: Visual timeline of all category changes and linkings
