# Email Threading System Documentation

## Overview

The Email Threading System automatically detects and links email replies and forwards to create threaded conversations, similar to Gmail or Outlook. This provides complete conversation context and improves customer communication tracking.

## Features

### 🔍 Reply Detection
- **Header-based**: Uses `In-Reply-To` and `References` headers (RFC 5322 standard)
- **Subject-based**: Detects reply prefixes in 15+ languages
  - English: `Re:`, `RE:`, `Reply:`
  - German: `AW:`, `Aw:`
  - Swedish: `SV:`, `Sv:`
  - French: `Ref:`, `Réf:`
  - Spanish: `Resp:`
  - Hindi: `जवाब:`
  - Portuguese: `Resposta:`
  - Polish: `Odp:`
  - Czech: `Odpověď:`
  - Turkish: `Yanıt:`
  - Catalan: `Re:`
- **Content-based**: Analyzes email body for quoted text patterns

### 📧 Forward Detection
- Detects forward prefixes: `Fwd:`, `Fw:`, `Forward:`, `FW:`, etc.
- Identifies forwarded message patterns in body

### 🔗 Smart Parent Linking
Four-level strategy to find the original email:

1. **Message-ID Lookup**: Uses `In-Reply-To` header to find exact parent
2. **References Chain**: Traces the `References` header chain (most recent first)
3. **Subject + Participant Match**: Matches cleaned subject with sender/recipients in 30-day window
4. **Proximity Heuristic**: Finds emails from same participants within 24 hours

### 🧵 Conversation Tracking
- Maintains `threadId` for grouping related emails
- Tracks `conversationParticipants` (all email addresses involved)
- Links parent-child relationships bidirectionally
- Stores reply metadata (from, subject, snippet, timestamp)

## Database Schema

### EmailLog Model - New Fields

```javascript
{
  // Email Threading & Conversation
  threadMetadata: {
    isReply: Boolean,              // Is this a reply?
    isForward: Boolean,            // Is this a forward?
    parentEmailId: ObjectId,       // Reference to parent email
    threadId: ObjectId,            // Thread root email ID
    messageId: String,             // RFC 5322 Message-ID
    inReplyTo: String,             // RFC 5322 In-Reply-To
    references: [String]           // RFC 5322 References chain
  },
  
  // Reply tracking (on parent emails)
  replies: [{
    emailId: ObjectId,             // Reference to reply email
    from: {
      email: String,
      name: String
    },
    subject: String,
    receivedAt: Date,
    snippet: String                // First 200 chars of reply
  }],
  
  // Conversation participants
  conversationParticipants: [String]  // All email addresses in thread
}
```

## API Endpoints

### Get Email Thread
```http
GET /api/v1/emails/:id/thread
```

Returns the complete conversation thread for an email.

**Response:**
```json
{
  "success": true,
  "data": {
    "threadCount": 3,
    "emails": [
      {
        "_id": "email1",
        "subject": "Uzbekistan trip inquiry",
        "from": {...},
        "receivedAt": "2024-01-15T10:00:00Z",
        "replies": [...]
      },
      {
        "_id": "email2",
        "subject": "Re: Uzbekistan trip inquiry",
        "from": {...},
        "receivedAt": "2024-01-15T14:30:00Z",
        "threadMetadata": {
          "isReply": true,
          "parentEmailId": "email1"
        }
      }
    ]
  }
}
```

### Rebuild Email Thread
```http
POST /api/v1/emails/:id/rebuild-thread
```

Manually rebuild threading for a specific email.

**Response:**
```json
{
  "success": true,
  "message": "Thread rebuilt successfully",
  "data": {
    "isReply": true,
    "parentFound": true,
    "threadId": "email1"
  }
}
```

## Service Methods

### EmailThreadingService

#### processEmailThreading(emailDoc, tenantId)
Main entry point - processes a single email for threading.

```javascript
const result = await EmailThreadingService.processEmailThreading(
  emailLog, 
  tenantId
);
```

#### getConversationThread(emailId)
Retrieves the complete thread for an email.

```javascript
const thread = await EmailThreadingService.getConversationThread(emailId);
// Returns array of all emails in thread, chronologically ordered
```

#### rebuildAllThreads(tenantId)
Batch process all existing emails for a tenant.

```javascript
const result = await EmailThreadingService.rebuildAllThreads(tenantId);
// Returns: { totalProcessed, threadsCreated, repliesLinked, forwardsDetected, errors }
```

## Integration Points

### 1. IMAP Polling Service
Automatically processes threading when new emails arrive via IMAP.

**Location**: `backend/src/services/emailPollingService.js`

```javascript
// After saving email
await EmailThreadingService.processEmailThreading(emailLog, tenantId);
```

### 2. Webhook Receiver
Processes threading for emails received via webhook.

**Location**: `backend/src/controllers/emailController.js`

```javascript
// After creating email
await EmailThreadingService.processEmailThreading(email, tenantId);
```

### 3. Frontend Conversation Timeline
Displays threaded replies in the conversation tab.

**Location**: `frontend/src/pages/emails/EmailDetail.jsx`

```jsx
// Adds replies to timeline
if (email.replies && email.replies.length > 0) {
  email.replies.forEach(reply => {
    timeline.push({
      type: 'customer_reply',
      timestamp: new Date(reply.receivedAt),
      data: reply
    });
  });
}
```

## Usage Examples

### Example 1: Customer Email Thread

```
Day 1, 10:00 AM:
Customer: "I want to visit Uzbekistan for 7 days"
→ Creates EmailLog #1 (thread starter)

Day 1, 2:00 PM:
Operator: Sends quote Q-2024-001
→ Linked to EmailLog #1

Day 2, 9:00 AM:
Customer: "Re: Uzbekistan trip - Can you add spa services?"
→ System detects "Re:" prefix
→ Finds parent by subject + participants
→ Links as reply to EmailLog #1
→ Appears in conversation timeline

Day 2, 3:00 PM:
Operator: Sends updated quote Q-2024-002
→ Linked to same thread

Day 3, 10:00 AM:
Customer: "Re: Uzbekistan trip - Perfect! Book it"
→ Automatically links to thread
→ Full conversation visible
```

### Example 2: Manual Thread Rebuild

If threading is added after emails already exist:

```bash
cd backend
node rebuild-email-threads.js <tenantId>
```

This will:
1. Process all existing emails for the tenant
2. Detect reply/forward relationships
3. Link emails into conversation threads
4. Update all metadata

## UI Features

### Conversation Timeline
- Shows all emails in a conversation chronologically (latest first)
- Customer emails displayed with blue bubble
- Reply emails shown indented with "Reply" badge
- AI responses shown with purple bubble
- Sent quotes shown with green bubble

### Reply Indicators
- Reply badge on customer replies
- Indented display (ml-6) to show hierarchy
- Shows snippet of reply content
- Full reply accessible via click

## Performance Considerations

### Database Indexes
The system automatically creates indexes on:
- `threadMetadata.parentEmailId`
- `threadMetadata.threadId`
- `messageId`
- `inReplyTo`

### Query Optimization
- Uses `lean()` for read-only operations
- Limits date range searches (30 days for subject match, 24 hours for proximity)
- Processes references array in reverse (most recent first)

### Caching Recommendations
Consider caching:
- Thread lookups (60 second TTL)
- Participant lists (5 minute TTL)
- Conversation threads (30 second TTL)

## Error Handling

The threading system is designed to be **non-blocking**:
- Threading failures don't prevent email save
- Errors logged but don't crash email processing
- Missing parent emails create new threads instead of failing
- Malformed headers handled gracefully

## Testing

### Manual Test: Send Reply Email

1. Send a test email to your IMAP account
2. Reply to that email (include "Re:" in subject)
3. Wait for IMAP polling or trigger webhook
4. Check EmailLog in database:

```javascript
const email = await EmailLog.findOne({ subject: /Re:.*test/ });
console.log('Threading:', email.threadMetadata);
console.log('Parent:', email.threadMetadata.parentEmailId);
```

5. Check parent email:

```javascript
const parent = await EmailLog.findById(email.threadMetadata.parentEmailId);
console.log('Replies:', parent.replies);
```

### Automated Tests

Run threading tests:

```bash
cd backend
npm test -- emailThreadingService.test.js
```

## Troubleshooting

### Issue: Replies Not Linking

**Check:**
1. Does the reply email have `In-Reply-To` header?
2. Does the subject contain "Re:" or similar prefix?
3. Are the sender/recipient the same?
4. Is the time gap reasonable (< 30 days)?

**Debug:**
```javascript
// Check email metadata
const email = await EmailLog.findById(emailId);
console.log('In-Reply-To:', email.inReplyTo);
console.log('References:', email.references);
console.log('Subject:', email.subject);

// Try manual rebuild
await EmailThreadingService.processEmailThreading(email, tenantId);
```

### Issue: Duplicate Threads

This can happen if:
- Message-ID not unique
- Multiple accounts receiving same email
- Email forwarded between accounts

**Solution:**
Use the rebuild script with force option:

```bash
node rebuild-email-threads.js <tenantId> --force
```

### Issue: Slow Thread Queries

**Optimize:**
1. Ensure indexes are created: `db.emaillogs.getIndexes()`
2. Add caching layer (Redis)
3. Limit thread depth (e.g., max 50 emails per thread)

## Future Enhancements

### Planned Features
- [ ] Thread merging (combine separate threads)
- [ ] Thread splitting (split topic changes)
- [ ] AI-generated thread summaries
- [ ] Smart reply suggestions based on thread context
- [ ] Email chain collapse/expand
- [ ] Thread priority scoring
- [ ] Cross-account thread linking
- [ ] Thread tagging and categorization

### Advanced Detection
- [ ] Detect topic drift within threads
- [ ] Handle email clients that modify subjects
- [ ] Detect BCCed replies
- [ ] Handle calendar invites in threads

## Best Practices

1. **Always enable IMAP headers**: Configure IMAP to fetch full headers
2. **Preserve Message-IDs**: Don't strip headers when processing
3. **Regular rebuilds**: Run thread rebuild monthly to catch missed links
4. **Monitor threading rate**: Track `isReply` percentage to ensure detection works
5. **Tenant isolation**: Always filter by tenantId in thread queries
6. **Backup before rebuild**: Run database backup before bulk thread rebuild

## Configuration

### Email Account Settings

Ensure IMAP accounts fetch headers:

```javascript
{
  imap: {
    user: 'user@domain.com',
    password: '***',
    host: 'imap.domain.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    // Important: Enable header fetching
    markSeen: false,
    fetchHeaders: true  // Ensure this is enabled
  }
}
```

### Environment Variables

```env
# Threading Configuration
THREADING_ENABLED=true
THREADING_MAX_DEPTH=50
THREADING_TIME_WINDOW_DAYS=30
THREADING_PROXIMITY_HOURS=24
```

## Support

For issues or questions:
- Check logs: `backend/logs/email-threading.log`
- Review error details in rebuild results
- Test with sample emails first
- Contact: dev@travel-crm.com
