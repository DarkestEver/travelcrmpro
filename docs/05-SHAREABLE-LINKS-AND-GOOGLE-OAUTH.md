# Feature Requirements: Shareable Links & Google OAuth

## Feature 1: Dedicated Shareable Pages for Bookings/Quotes

### Problem Statement
Customers need to view bookings, quotes, and itineraries via direct links shared by travel agents, without logging into the system.

### Requirements

#### 1.1 Shareable Entities
- **Bookings**: Customer can view booking details, payment status, itinerary
- **Quotes**: Customer can view quote details, accept/reject, add comments
- **Itineraries**: Customer can view detailed itinerary with all destinations, activities, hotels

#### 1.2 Security
- Token-based access (UUID v4)
- Token expiration (configurable, default 30 days)
- Optional password protection for sensitive bookings
- View-only access (no modifications without login)

#### 1.3 Features
- **Booking Page**:
  - Booking details (dates, destinations, travelers)
  - Payment status and history
  - Downloadable itinerary PDF
  - Contact agent button
  - Accept terms and conditions

- **Quote Page**:
  - Quote details (destinations, price breakdown)
  - Accept/Reject buttons
  - Add comments/questions
  - Request modifications
  - Expiration countdown

- **Itinerary Page**:
  - Day-by-day breakdown
  - Maps integration
  - Hotel information
  - Activity details
  - Download as PDF
  - Share with others

#### 1.4 User Experience
- Mobile-responsive design
- Tenant branding (logo, colors)
- No authentication required for viewing
- Optional email verification for actions (accept quote, etc.)

### Technical Design

#### Backend
```
POST /api/v1/bookings/:id/share - Generate share token
GET /api/v1/public/bookings/:token - View booking
POST /api/v1/public/bookings/:token/accept - Accept booking

POST /api/v1/quotes/:id/share - Generate share token
GET /api/v1/public/quotes/:token - View quote
POST /api/v1/public/quotes/:token/accept - Accept quote
POST /api/v1/public/quotes/:token/reject - Reject quote
POST /api/v1/public/quotes/:token/comment - Add comment

POST /api/v1/itineraries/:id/share - Generate share token
GET /api/v1/public/itineraries/:token - View itinerary
GET /api/v1/public/itineraries/:token/pdf - Download PDF
```

#### Database Schema
```javascript
shareTokenSchema = {
  token: String (UUID),
  entityType: String (booking/quote/itinerary),
  entityId: ObjectId,
  tenantId: ObjectId,
  expiresAt: Date,
  password: String (optional, hashed),
  viewCount: Number,
  lastViewedAt: Date,
  createdBy: ObjectId,
  isActive: Boolean
}
```

#### Frontend Routes
```
/share/booking/:token - Public booking view
/share/quote/:token - Public quote view
/share/itinerary/:token - Public itinerary view
```

---

## Feature 2: Google OAuth Integration for Gmail

### Problem Statement
Current email integration requires users to enable "Less Secure Apps" or create app-specific passwords. Google OAuth provides a more secure and user-friendly way to connect Gmail accounts.

### Requirements

#### 2.1 Authentication Flow
- Google OAuth 2.0 with Gmail API scopes
- Automatic token refresh
- Multiple Gmail accounts per tenant
- Secure token storage

#### 2.2 Gmail API Scopes Required
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.modify` - Manage labels
- `https://mail.google.com/` - Full Gmail access (if needed)

#### 2.3 Features
- **Connect with Google** button in email accounts settings
- Auto-detect email address after OAuth
- Show connection status (connected/disconnected/expired)
- Re-authenticate when token expires
- Disconnect/remove account
- Support for multiple Gmail accounts

#### 2.4 Migration from IMAP
- Keep existing IMAP functionality
- Offer migration wizard for existing email accounts
- Support both IMAP and OAuth simultaneously
- Prefer OAuth for Gmail accounts

### Technical Design

#### Backend Architecture

##### OAuth Flow
```
1. User clicks "Connect with Google"
2. Redirect to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Backend exchanges code for access token & refresh token
6. Store tokens encrypted in database
7. Create/update email account with OAuth credentials
8. Test connection by fetching recent emails
```

##### Token Management
```javascript
googleOAuthTokenSchema = {
  tenantId: ObjectId,
  userId: ObjectId,
  emailAccountId: ObjectId,
  email: String,
  accessToken: String (encrypted),
  refreshToken: String (encrypted),
  expiresAt: Date,
  scope: [String],
  tokenType: String,
  lastRefreshed: Date,
  isActive: Boolean
}
```

##### Email Account Schema Update
```javascript
emailAccountSchema = {
  // ... existing fields
  authType: { 
    type: String, 
    enum: ['imap', 'oauth_google'],
    default: 'imap'
  },
  oauthTokenId: {
    type: ObjectId,
    ref: 'GoogleOAuthToken'
  }
}
```

#### Gmail API Integration

##### Email Polling Service
```javascript
// src/services/gmailApiService.js
class GmailApiService {
  async getEmails(tokenId, params) {
    // Fetch emails using Gmail API
    // Handle pagination
    // Parse to standard email format
  }
  
  async sendEmail(tokenId, emailData) {
    // Send email via Gmail API
  }
  
  async refreshAccessToken(tokenId) {
    // Refresh expired access token
  }
  
  async markAsRead(tokenId, messageId) {
    // Mark email as read
  }
}
```

##### Unified Email Service
```javascript
// src/services/unifiedEmailService.js
class UnifiedEmailService {
  async getEmails(emailAccountId) {
    const account = await EmailAccount.findById(emailAccountId);
    
    if (account.authType === 'oauth_google') {
      return gmailApiService.getEmails(account.oauthTokenId);
    } else {
      return imapService.getEmails(account);
    }
  }
}
```

#### API Endpoints
```
GET /api/v1/auth/google/url - Get OAuth consent URL
GET /api/v1/auth/google/callback - OAuth callback handler
POST /api/v1/email-accounts/connect-gmail - Connect Gmail account
POST /api/v1/email-accounts/:id/disconnect-gmail - Disconnect
GET /api/v1/email-accounts/:id/test-connection - Test OAuth connection
```

#### Frontend Components

##### Google Sign-In Button
```jsx
<button 
  onClick={handleGoogleConnect}
  className="google-signin-btn"
>
  <GoogleIcon />
  Connect with Google
</button>
```

##### Email Account Card
```jsx
<EmailAccountCard>
  {authType === 'oauth_google' ? (
    <>
      <GoogleIcon />
      <Status>Connected via Google</Status>
      <Button onClick={disconnect}>Disconnect</Button>
    </>
  ) : (
    <>
      <MailIcon />
      <Status>IMAP Connection</Status>
      <Button onClick={migrate}>Upgrade to Google OAuth</Button>
    </>
  )}
</EmailAccountCard>
```

### Implementation Priority

#### Phase 1: Shareable Links (Higher Priority)
- Immediate customer value
- No external dependencies
- Simpler implementation

#### Phase 2: Google OAuth (Medium Priority)
- Requires Google Cloud project setup
- More complex but better UX
- Improves security

### Google Cloud Setup Required

1. Create Google Cloud Project
2. Enable Gmail API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs
6. Get Client ID and Client Secret

### Environment Variables Needed
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send

# Frontend
VITE_GOOGLE_CLIENT_ID=your_client_id
```

### Security Considerations

1. **Token Encryption**: Store OAuth tokens encrypted (AES-256)
2. **Refresh Token Rotation**: Update refresh tokens when refreshed
3. **Rate Limiting**: Implement rate limits for public endpoints
4. **CSRF Protection**: Use state parameter in OAuth flow
5. **Token Validation**: Verify tokens before accessing resources
6. **Audit Logging**: Log all token generation and access

### Testing Strategy

1. **Unit Tests**: Test token generation, validation, encryption
2. **Integration Tests**: Test OAuth flow, Gmail API calls
3. **Manual Testing**: Test full user flow for both features
4. **Load Testing**: Test public pages with multiple concurrent users

### Documentation Deliverables

1. **User Guide**: How to share bookings/quotes with customers
2. **Admin Guide**: How to set up Google OAuth
3. **API Documentation**: Public endpoint documentation
4. **Developer Guide**: How to extend shareable links

### Estimated Timeline

- **Shareable Links**: 2-3 days
  - Day 1: Backend API + Database
  - Day 2: Frontend pages
  - Day 3: Testing + Polish

- **Google OAuth**: 3-4 days
  - Day 1: Google setup + OAuth backend
  - Day 2: Gmail API integration
  - Day 3: Frontend UI
  - Day 4: Testing + Migration tools

**Total**: 5-7 days for both features

---

## Next Steps

1. Choose which feature to implement first
2. Set up Google Cloud project (if starting with OAuth)
3. Create detailed technical specifications
4. Begin implementation

**Recommendation**: Start with Shareable Links first, as it provides immediate value and has no external dependencies.
