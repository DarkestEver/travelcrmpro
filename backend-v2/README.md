# Backend v2 - Multi-Tenant Travel CRM

Modern, scalable backend for B2B/B2C travel CRM SaaS platform.

> 📋 **[View Complete Development Plan](./docs/DEVELOPMENT_PLAN.md)** - Detailed 16-phase roadmap with timelines, features, and implementation strategy

## Phase 0: Foundations ✅

Complete foundational setup with logging, error handling, middleware, health checks, and testing infrastructure.

### Features Implemented

- ✅ **Project Structure**: Organized folder structure for scalable development
- ✅ **Environment Configuration**: Joi-validated config with 60+ environment variables
- ✅ **Logging System**: Winston with JSON/simple formats, file transports, request correlation
- ✅ **Error Handling**: 7 custom error classes mapped to HTTP status codes
- ✅ **Response Standardization**: Middleware for consistent API responses with traceId
- ✅ **Health Endpoints**: `/health`, `/ready`, `/version` for monitoring
- ✅ **Security**: Helmet, CORS, rate limiting (100 req/15min)
- ✅ **Testing**: Jest with 75% coverage threshold, unit + integration tests
- ✅ **Code Quality**: ESLint + Prettier configuration

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Validation**: Joi 17.11.0
- **Logging**: Winston 3.11.0
- **Testing**: Jest 29.7.0, Supertest 6.3.3
- **Security**: Helmet, CORS, express-rate-limit
- **Database**: MongoDB (Mongoose 8.0.3) - Phase 1
- **Cache**: Redis (ioredis 5.3.2) - Phase 1

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0 (for Phase 1+)
- Redis >= 7.0 (for Phase 1+)

### Installation

```powershell
# Install dependencies
npm install

# Copy environment variables
Copy-Item .env.example .env

# Edit .env and configure required variables
notepad .env
```

### Running the Server

```powershell
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Lint code
npm run lint

# Format code
npm run format

# Validate environment
npm run validate
```

### Environment Variables

See `.env.example` for all available configuration options. Minimum required:

```env
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug

# Phase 1+ requirements
MONGODB_URI=mongodb://localhost:27017/travel-crm
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
```

## API Documentation

### Health Endpoints

#### `GET /health`

Basic health check.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "version": "0.1.0"
  },
  "traceId": "abc-123-def"
}
```

#### `GET /ready`

Readiness check with dependency verification.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "checks": {
      "database": "connected",
      "redis": "connected"
    }
  },
  "traceId": "abc-123-def"
}
```

#### `GET /version`

API version information.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "0.1.0",
    "apiVersion": "v2",
    "nodeVersion": "v18.17.0",
    "environment": "development"
  },
  "traceId": "abc-123-def"
}
```

### Response Format

All API responses follow a standardized envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... },
  "traceId": "request-id"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... },
    "type": "ValidationError"
  },
  "traceId": "request-id"
}
```

## Multi-Tenant Architecture

### Overview
A comprehensive multi-tenant SaaS platform for travel agencies, tour operators, and itinerary planners. Each tenant operates independently with their own suppliers, operators, agents, and customers in a complete B2B and B2C ecosystem.

### Tenant Identification
- **Subdomain-based:** `tenant-name.travelcrm.com`
- **Path-based:** `travelcrm.com/tenant-name`
- **Custom domain:** `agency.com` (mapped to tenant)
- Automatic tenant resolution from request URL
- Tenant isolation at database level

### User Roles & Access Hierarchy

```
Super Admin (Platform Owner)
└── Tenant (Travel Agency/Tour Operator)
    ├── Supplier (Hotels, Airlines, Transport)
    ├── Operator (Internal Operations Team)
    ├── Agent (B2B Sales)
    │   └── Agent's Customers (B2B Clients)
    └── Customer (B2C Direct Customers)
```

#### 1. Super Admin (Platform Level)
**Access:** Full platform management
- Manage all tenants (create, suspend, delete)
- View cross-tenant analytics
- System configuration and updates
- Billing and subscription management
- Platform-wide monitoring
- **Login:** `admin.travelcrm.com` or `/super-admin`

#### 2. Tenant (Agency/Organization Owner)
**Access:** Complete control of their organization
- Tenant organization profile management
- Branding (logo, colors, domain)
- User management (suppliers, operators, agents, customers)
- Subscription and billing settings
- Reports and analytics for their organization
- Custom settings and preferences
- **Login:** `{tenant}.travelcrm.com` or `/{tenant-slug}`

#### 3. Supplier (External Partners)
**Access:** Manage offerings and rate lists
- Rate list management with validity periods
- CSV/Excel import/export
- Seasonal pricing and special rates
- Inventory management (hotels, activities, transport, meals)
- Booking confirmations and payment tracking
- **Login:** `{tenant}.travelcrm.com/supplier`

#### 4. Operator (Internal Operations)
**Access:** Operational management
- Query assignment and processing
- Quote review and approval
- Booking creation and management
- SLA monitoring and resource allocation
- **Login:** `{tenant}.travelcrm.com/operator`

#### 5. Agent (B2B Sales Representatives)
**Access:** Sales and customer management
- Browse published packages
- Create quotes from packages
- Build custom itineraries using rate lists
- Manage queries and customers
- Track commissions and sales metrics
- **Login:** `{tenant}.travelcrm.com/agent`

#### 6. Customer (B2C Direct Customers)
**Access:** Limited customer portal
- Browse packages and request quotes
- View queries and bookings
- Complete payments and manage documents
- Leave reviews and ratings
- **Login:** `{tenant}.travelcrm.com/customer`

## Project Structure

```
backend-v2/
├── src/
│   ├── config/           # Configuration and constants
│   ├── lib/              # Shared libraries (logger, errors)
│   ├── middleware/       # Express middleware
│   ├── controllers/      # Request handlers
│   ├── routes/           # Route definitions
│   ├── models/           # Database models (Phase 1+)
│   ├── services/         # Business logic (Phase 1+)
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
├── tests/
│   ├── setup.js          # Test configuration
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── logs/                 # Application logs
├── docs/                 # Documentation
│   ├── DEVELOPMENT_PLAN.md
│   └── phases/           # Phase-wise implementation guides
├── .env.example          # Environment variables template
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .gitignore
└── package.json
```

## Development Workflow

### Adding New Features

1. Update relevant phase document in `docs/phases/`
2. Implement models, services, controllers, routes
3. Add middleware if needed
4. Write unit tests alongside implementation
5. Write integration tests for API endpoints
6. Update this README with new endpoints
7. Run `npm run lint` and `npm run format`
8. Ensure tests pass: `npm test`

### Error Handling

Use custom error classes in `src/lib/errors.js`:

```javascript
const { ValidationError, NotFoundError } = require('../lib/errors');

// Validation error
throw new ValidationError('ERR_INVALID_EMAIL', 'Invalid email format', {
  field: 'email',
  value: req.body.email,
});

// Not found error
throw new NotFoundError('ERR_USER_NOT_FOUND', 'User not found');
```

### Logging

Use the logger from `src/lib/logger.js`:

```javascript
const logger = require('../lib/logger');

logger.info('User created', { userId, email });
logger.warn('Rate limit exceeded', { ip: req.ip });
logger.error('Database connection failed', { error: err.message });
```

### Response Helpers

Use standardized response helpers:

```javascript
// Success with data
res.ok({ user }, { page: 1, total: 100 });

// Created resource
res.created({ user }, { location: '/api/users/123' });

// No content
res.noContent();

// Error
res.fail(400, 'ERR_VALIDATION', 'Validation failed', { fields: errors });
```

## Testing

### Running Tests

```powershell
# All tests
npm test

# Watch mode
npm run test:watch

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage
```

### Writing Tests

**Unit Test Example:**
```javascript
const { ValidationError } = require('../../../src/lib/errors');

describe('ValidationError', () => {
  test('should create error with default status 400', () => {
    const error = new ValidationError('ERR_TEST', 'Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('ERR_TEST');
  });
});
```

**Integration Test Example:**
```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('GET /health', () => {
  test('should return 200 with health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 0 | ✅ Complete | Foundations (config, logging, errors, middleware, health) |
| Phase 1 | 🔄 Next | Auth & Multi-Tenant (JWT, RBAC, tenant isolation) |
| Phase 2 | ⏳ Planned | Suppliers & Rate Lists (pricing, CSV import/export) |
| Phase 3 | ⏳ Planned | Packages Catalog (search, filtering, publish) |
| Phase 4 | ⏳ Planned | Query Management (assignment, tracking) |
| Phase 5 | ⏳ Planned | Itinerary Builder (day-wise, costing) |
| Phase 6 | ⏳ Planned | Quotes, PDF, Email (generation, templates) |
| Phase 7 | ⏳ Planned | Payments & Ledger (invoicing, refunds) |
| Phase 8 | ⏳ Planned | Customer Portal (self-service APIs) |
| Phase 9 | ⏳ Planned | Automation & Jobs (SLA, campaigns, Bull queue) |
| Phase 10 | ⏳ Planned | Reviews & Ratings |
| Phase 11 | ⏳ Planned | Webhooks (delivery, retries) |
| Phase 12 | ⏳ Planned | Observability (monitoring, dashboards) |
| Phase 13 | ⏳ Planned | Security & Compliance (GDPR, AV scanning) |
| Phase 14 | ⏳ Planned | Performance Optimization (caching, CDN) |
| Phase 15 | ⏳ Planned | I18n & Localization (multi-currency, tax) |
| Phase 16 | ⏳ Planned | API Standards (idempotency, pagination, OpenAPI) |

See `docs/DEVELOPMENT_PLAN.md` for complete roadmap and `docs/phases/` for detailed implementation guides.

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact the development team.
  - PAN Card, Passport, Visa, Driving License
  - Travel insurance, Photos
  - Document sharing with assigned agent
- **Profile Management:** Personal details and preferences
- **Login:** `{tenant}.travelcrm.com/customer` (agent-assigned)
- **Linked to:** Specific agent within tenant
- **Restricted to:** Only see data related to their agent
- **Customer Type:** Agent-assisted (B2B - works through agent)

#### 7. Customer (B2C Direct)
**Access:** Self-service portal
- **Browse Published Packages:**
  - View all published packages in catalog
  - Filter by destination, price, duration, dates, category
  - Search packages by keywords
  - View package details, itinerary, pricing, reviews
  - Request quote directly from package
  - Instant booking (if enabled by tenant)
  
- **Query Management:**
  - Submit custom travel inquiries
  - View all submitted queries
  - Track query status and assignments
  - Add comments and updates
  - Query history and timeline
  
- **Quote Management:**
  - View all received quotes (from packages or custom)
  - Compare multiple quotes
  - Approve/reject quotes with feedback
  - Download quote PDFs
- **Booking Management:**
  - View all bookings (past, current, upcoming)
  - Booking details and itineraries
  - Download booking confirmations
  - Booking status tracking
- **Payment Management:**
  - View all payment transactions
  - Payment history and receipts
  - Download invoices
  - Outstanding balance tracking
  - Payment reminders
- **Document Management:**
  - Upload personal documents:
    - PAN Card (tax identification)
    - Passport (with expiry tracking)
    - Driving License
    - Visa documents
    - Travel insurance
    - Photos (passport size, etc.)
  - Document verification status
  - Expiry alerts for passports/visas
  - Secure document storage
  - Share documents with agent/operator
- **Profile Management:**
  - Personal details
  - Emergency contacts
  - Travel preferences
  - Dietary restrictions
  - Medical information
- **Login:** `{tenant}.travelcrm.com/customer`
- **Direct to:** Tenant (no agent intermediary)
- **Customer Type:** Direct customer (B2C - self-service)

### Authentication & Security

#### Multi-Factor Authentication
- **Email-based verification:** All logins
- **OTP via email:** For sensitive operations
- **Password reset:** Secure token-based flow
- **Session management:** JWT with refresh tokens
- **Account lockout:** After failed attempts

#### Role-Based Access Control (RBAC)
```javascript
Permissions Matrix:
                    Super  Tenant  Supplier  Operator  Agent  Customer
Manage Tenants        ✓      ✗       ✗         ✗        ✗      ✗
Tenant Settings       ✗      ✓       ✗         ✗        ✗      ✗
Manage Suppliers      ✗      ✓       ✗         ✓        ✗      ✗
Assign Queries        ✗      ✓       ✗         ✓        ✗      ✗
Create Quotes         ✗      ✓       ✗         ✓        ✓      ✗
Approve Quotes        ✗      ✓       ✗         ✓        ✗      ✓
Create Bookings       ✗      ✓       ✗         ✓        ✓      ✗
Process Payments      ✗      ✓       ✗         ✓        ✗      ✗
Upload Documents      ✗      ✓       ✗         ✓        ✓      ✓
Verify Documents      ✗      ✓       ✗         ✓        ✗      ✗
View All Queries      ✓      ✓       ✗         ✓        ✗      ✗
View Own Queries      ✓      ✓       ✓         ✓        ✓      ✓
View All Bookings     ✓      ✓       ✗         ✓        ✗      ✗
View Own Bookings     ✓      ✓       ✓         ✓        ✓      ✓
View All Payments     ✓      ✓       ✗         ✓        ✗      ✗
View Own Payments     ✓      ✓       ✓         ✓        ✓      ✓
View All Data         ✓      ✓       ✗         ✓        ✗      ✗
View Own Data         ✓      ✓       ✓         ✓        ✓      ✓
```

#### User Profile Management (All Roles)
- **Password change:** Secure with old password verification
- **Avatar upload:** Profile picture with image optimization
- **Email update:** With verification
- **Notification preferences:** Customizable alerts
- **Two-factor authentication:** Optional for all users
- **Session history:** View active sessions and logout remotely

#### Tenant Organization Page
**URL:** `{tenant}.travelcrm.com/organization` (Tenant Admin Only)
- **Company Details:** Name, address, contact, registration
- **Branding:** Logo upload, color scheme, email templates
- **Domain Settings:** Custom domain configuration
- **Business Info:** License numbers, tax IDs, certifications
- **Social Media:** Website, Facebook, Instagram links
- **Operating Hours:** Business hours and timezone
- **Default Settings:** Currency, language, date format
- **API Keys:** For integrations (Google, Stripe, etc.)

### Workflow Architecture

```
Query Creation → Assignment → Package/Itinerary → Quote → Approval → Booking → Finance

### Core Features

#### 1. Query Management
- **Multi-source Query Creation:**
  - Email AI extraction (automated)
  - Agent manual creation
  - Operator manual creation
  - Customer portal submission
- **Query Assignment:** Assign to agents or operators
- **Query Tracking:** Status, priority, SLA tracking

#### 2. Package/Itinerary Management
- **Published Packages Catalog:**
  - Tenant creates pre-built packages with fixed pricing
  - Publish packages to customer/agent portals
  - Package visibility settings (public/private/agent-only)
  - Featured packages for homepage
  - Package categories and tags for filtering
  
- **Package Browsing & Filtering:**
  - **Customers (B2C Direct):** Browse all published public packages
  - **Agents:** Browse all packages + create custom quotes
  - **Agent's Customers (B2B):** See packages recommended by their agent
  - Filter by: destination, duration, price range, dates, category
  - Search by keywords
  - Sort by: price, popularity, rating, newest
  
- **Package to Quote Conversion:**
  - Customer/Agent selects package → Auto-generate quote
  - Customize package before quoting
  - Add/remove services from base package
  - Adjust dates and travelers
  
- **Custom Itinerary Builder:**
  - **Search existing packages** from supplier rate lists
  - **Create custom itineraries** by selecting rate list items
  - **Auto-calculate pricing** based on selected rate lists
  - **Link to queries and quotes** for tracking
  - **Dynamic pricing** based on seasonality and availability
  - **Rate list validation** for date conflicts and pricing

#### 3. Quote Management
- **Generate quotes from itineraries** (auto-linked to rate lists)
- **PDF generation** with professional templates
- **Email delivery** with quote PDF + itinerary PDF attachments
- **Multi-level approval** (customer/agent/operator)
- **Source tracking** and audit trail
- **Quote versioning** for revisions
- **Automatic rate calculation** from selected rate lists
- **Tax and commission** auto-calculation

#### 4. Booking Management
- Auto-creation from approved quotes
- Agent and operator tagging
- Customer assignment
- Status tracking
- Document management

#### 5. Finance Module
- Payment tracking
- Invoice generation
- Commission calculations
- Financial reporting

##### Payments & Finance (Detailed)
- **Payment Gateways:** Stripe, Razorpay, PayPal integrations with provider-agnostic abstraction
  - Create payment intents, collect client secrets/tokens
  - Provider webhooks with signature verification and idempotent processing
- **Refunds & Disputes:** Full/partial refunds, credit notes, chargeback tracking, dispute evidence links
- **Offline Payments:** Bank transfer/UPI/cash entries, approval workflows, proof uploads, reconciliation
- **Multi-Currency:** Tenant base currency, customer display currency, FX provider integration, quote-time FX lock
- **Accounting:** Sub-ledger (AR/AP), commission settlements, journal exports (Tally/QuickBooks/Xero)
- **Invoicing:** Numbering sequences per tenant, GST/VAT fields, e-invoice attachments where applicable

#### 6. Workflow Automation
- **Auto-Assignment:**
  - Agent availability tracking (online/offline status)
  - Round-robin query assignment
  - Workload-based distribution
  - Skill-based routing (destination expertise)
  - Auto-assignment rules configuration
  
- **SLA Management:**
  - Auto-escalation for SLA breaches
  - Escalation hierarchy (Agent → Senior Agent → Manager)
  - SLA breach notifications
  - Automatic priority elevation
  
- **Follow-ups & Reminders:**
  - Scheduled quote follow-ups (3 days, 7 days)
  - Payment reminder automation
  - Booking confirmation reminders
  - Pre-departure communications
  - Post-trip feedback requests
  
- **Quote Lifecycle:**
  - Automatic quote expiry handling
  - Auto-archive expired quotes
  - Re-activation workflows
  - Quote validity extension requests
  
- **Marketing Automation:**
  - Birthday emails with special offers
  - Anniversary greetings
  - Seasonal promotions
  - Abandoned query follow-ups
  - Loyalty program communications

#### 7. Reviews & Ratings
- **Customer Reviews:**
  - Post-booking review requests
  - Star ratings (1-5) with comments
  - Photo upload capability
  - Review moderation workflow
  - Public/private review options
  
- **Supplier Ratings:**
  - Service quality ratings
  - Pricing competitiveness
  - Reliability scores
  - Agent feedback on suppliers
  - Performance analytics
  
- **Agent Performance:**
  - Customer satisfaction ratings
  - Response time metrics
  - Conversion rate tracking
  - Quality scores
  - Peer reviews
  
- **Testimonials:**
  - Featured testimonials selection
  - Video testimonials support
  - Testimonial approval workflow
  - Display on tenant website
  - Social media sharing

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Caching:** Redis (multi-layer caching strategy)
- **Authentication:** JWT (access + refresh tokens)
- **Email Verification:** Token-based with expiry
- **Password Security:** bcrypt hashing + encryption at rest
- **PDF Generation:** Puppeteer (for complex layouts) or PDFKit
- **Email Service:** Nodemailer with SMTP/SendGrid/AWS SES
- **Email Templates:** Handlebars or EJS for dynamic content
- **Email Queue:** Bull (Redis-based) for reliable delivery
- **File Storage:** AWS S3 or local with multer
- **CDN:** CloudFront or Cloudflare for static assets
- **Image Processing:** Sharp (avatar optimization)
- **Validation:** Joi or Express-validator
- **Rate Limiting:** Express-rate-limit (per user/tenant)
- **Security:** Helmet, CORS, express-mongo-sanitize, HTTPS enforcement
- **Logging:** Winston or Pino with structured logging
- **Audit Trail:** MongoDB change streams for data tracking
- **Tenant Isolation:** Middleware-based tenant context
- **Background Jobs:** Bull for scheduled tasks (expiry alerts, reminders, automation)
- **Load Balancing:** PM2 cluster mode or Nginx
- **Monitoring:** Prometheus + Grafana or New Relic

### API Structure

```
/api/v2
├── /super-admin        # Super admin operations
│   ├── /tenants        # Tenant CRUD
│   ├── /analytics      # Platform analytics
│   └── /billing        # Platform billing
│
├── /auth               # Authentication (multi-tenant aware)
│   ├── /login          # Login (auto-detect role)
│   ├── /register       # Registration
│   ├── /verify-email   # Email verification
│   ├── /forgot-password
│   ├── /reset-password
│   ├── /change-password
│   ├── /logout
│   └── /refresh-token
│
├── /tenant             # Tenant management
│   ├── /profile        # Organization profile
│   ├── /branding       # Logo, colors, templates
│   ├── /settings       # Configuration
│   └── /users          # User management
│
├── /profile            # Current user profile (all roles)
│   ├── /avatar         # Upload/update avatar
│   ├── /password       # Change password
│   ├── /preferences    # User preferences
│   └── /sessions       # Active sessions
│
├── /suppliers          # Supplier management
│   ├── /rate-lists     # Rate list CRUD
│   │   ├── /create     # Create rate list
│   │   ├── /import     # Import CSV/Excel
│   │   ├── /export     # Export rate lists
│   │   ├── /bulk       # Bulk operations
│   │   └── /validate   # Validate dates & pricing
│   ├── /inventory      # Supplier inventory
│   ├── /pricing        # Dynamic pricing
│   └── /bookings       # Supplier bookings
│
├── /queries            # Query management
│   ├── /create         # Create query (agent/operator/customer)
│   ├── /assign         # Assign to agent/operator
│   └── /track          # Query tracking
│
├── /packages           # Package management
│   ├── /published      # Browse published packages
│   ├── /filter         # Filter packages (destination, price, etc.)
│   ├── /search         # Search packages
│   ├── /featured       # Featured packages
│   ├── /:id/quote      # Create quote from package
│   └── /create         # Create new package (tenant/operator)
├── /quotes             # Quote management
│   ├── /create         # Create quote from itinerary
│   ├── /send-email     # Send quote via email with PDFs
│   ├── /approve        # Customer approval
│   └── /revise         # Create quote revision
├── /bookings           # Booking management
├── /finance            # Finance operations
│   ├── /providers      # Configure payment providers
│   ├── /payments       # Create/track payments
│   ├── /refunds        # Refund operations
│   ├── /invoices       # Invoice CRUD
│   └── /ledger         # Accounting sub-ledger/exports
├── /webhooks           # Outbound webhooks mgmt
│   ├── /endpoints      # Create/list/update webhook endpoints
│   ├── /deliveries     # Delivery logs and replays
│   └── /rotate-secret  # Rotate HMAC signing secret
├── /documents          # Document management
│   ├── /upload         # Upload documents
│   ├── /verify         # Admin verification
│   ├── /share          # Share with agent/operator
│   └── /expiry-alerts  # Document expiry tracking
├── /emails             # Email management
│   ├── /send           # Send email with attachments
│   ├── /templates      # Manage email templates
│   ├── /queue          # Email queue status
│   └── /logs           # Email delivery logs
├── /customer           # Customer portal APIs
│   ├── /queries        # Customer's all queries
│   ├── /quotes         # Customer's all quotes
│   ├── /bookings       # Customer's all bookings
│   ├── /payments       # Customer's payment history
│   ├── /documents      # Customer's documents
│   └── /reviews        # Submit and view reviews
├── /reviews            # Review management
│   ├── /bookings       # Booking reviews
│   ├── /suppliers      # Supplier ratings
│   ├── /agents         # Agent performance
│   └── /testimonials   # Featured testimonials
├── /automation         # Workflow automation
│   ├── /rules          # Auto-assignment rules
│   ├── /escalations    # SLA escalation config
│   ├── /campaigns      # Marketing campaigns
│   └── /jobs           # Scheduled jobs status
├── /audit              # Audit trail
│   ├── /logs           # All data changes
│   ├── /user-activity  # User action logs
│   └── /export         # Export audit data
└── /notifications      # Notification system
```

### API Standards

- **Versioning:** Path-based (e.g., `/api/v2`); breaking changes bump major version.
- **Idempotency:** For `POST/PATCH/DELETE`, clients send `Idempotency-Key` header.
  - Server stores request hash + response for 24h and returns the original response to duplicates.
  - Keys are scoped by tenant + route + body hash.
- **Pagination:** `page`, `limit` with response envelope `{ data, page, limit, total }`.
  - For large lists, support cursor pagination: `cursor`, `nextCursor`.
- **Sorting/Filtering:** `sort=field`, `order=asc|desc`, filter operators `field[gt]=`, `field[lt]=`, `field[in]=a,b`.
- **Conditional Requests:** Support `ETag`/`If-None-Match` for cache-friendly GETs.
- **Errors:** Consistent shape `{ error: { code, message, details } }` with trace id in headers.

#### Response Envelope (Standardized)

- All API responses follow a single envelope to ensure consistency across services.

Success (200/201/204):
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "cursor": null
  },
  "traceId": "c2b5d2c8-..." 
}
```

Error (4xx/5xx):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Destination is required",
    "details": [{"field": "destination", "reason": "required"}],
    "type": "client|server"
  },
  "traceId": "c2b5d2c8-..."
}
```

- HTTP status codes reflect outcome (e.g., 201 for create, 204 for no content).
- `traceId`/request id is included on every response and echoed in `X-Request-Id` header.
- `meta` is optional and included when relevant (pagination, cursors, aggregate totals).

#### Central Response Service (Single Source)

- All controllers must use a single response service/middleware to enforce shape and headers.

Example (JavaScript):
```js
// src/lib/response.js
const attachResponseHelpers = (req, res, next) => {
  const traceId = req.id; // set by request-id middleware

  res.ok = (data = {}, meta = undefined, status = 200) => {
    return res.status(status).json({ success: true, data, meta, traceId });
  };

  res.created = (data = {}, meta = undefined) => res.ok(data, meta, 201);
  res.noContent = () => res.status(204).send();

  res.fail = (httpStatus = 400, code = 'BAD_REQUEST', message = 'Bad request', details = undefined, type = 'client') => {
    return res.status(httpStatus).json({
      success: false,
      error: { code, message, details, type },
      traceId
    });
  };
  return next();
};

module.exports = { attachResponseHelpers };
```

Wire-up:
```js
// app.js
const requestId = require('express-request-id')();
const { attachResponseHelpers } = require('./src/lib/response');

app.use(requestId); // adds req.id and X-Request-Id header
app.use(attachResponseHelpers);
```

Usage in controllers:
```js
// In a route handler
async function listPackages(req, res) {
  const { data, total } = await svc.list({ tenantId: req.tenant.id, page: 1, limit: 20 });
  return res.ok(data, { page: 1, limit: 20, total });
}

async function createPayment(req, res) {
  try {
    const payment = await payments.create(req.body);
    return res.created({ id: payment.id, status: payment.status });
  } catch (err) {
    return res.fail(400, 'PAYMENT_ERROR', err.message, err.details, 'client');
  }
}
```

### Webhooks

- **Events:** `quote.sent`, `quote.accepted`, `booking.created`, `payment.succeeded`, `refund.processed`, `document.expiring`.
- **Security:** HMAC-SHA256 signature in `X-TravelCRM-Signature`, timestamp in `X-TravelCRM-Timestamp`.
- **Retries:** Exponential backoff with max retries; DLQ for permanently failed deliveries; manual replay.
- **Endpoints:**
  - Manage: `/api/v2/webhooks/endpoints`
  - Deliveries: `/api/v2/webhooks/deliveries`
  - Rotate Secret: `/api/v2/webhooks/rotate-secret`
- **Provider Webhooks (Inbound):** `/api/v2/finance/providers/:provider/webhook` with signature verification and idempotent handlers.

#### Webhook Response Examples (Standard Envelope)

List Deliveries (success):
```json
{
  "success": true,
  "data": [
    {
      "id": "wdlv_01HXY...",
      "event": "payment.succeeded",
      "endpointId": "wh_01HX...",
      "status": "delivered",
      "attempts": 1,
      "deliveredAt": "2025-11-23T10:15:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 },
  "traceId": "7c0c1d6b-..."
}
```

Create Endpoint (validation error):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "url must be a valid https URL",
    "details": [{ "field": "url", "reason": "invalid_format" }],
    "type": "client"
  },
  "traceId": "7c0c1d6b-..."
}
```

Inbound Provider Webhook (ack):
```json
{
  "success": true,
  "data": { "ack": true },
  "traceId": "7c0c1d6b-..."
}
```

### Payments & Finance

```http
POST /api/v2/finance/payments
{ bookingId, amount, currency, provider, method } -> { clientSecret|orderId, status }

POST /api/v2/finance/refunds
{ paymentId, amount, reason } -> { refundId, status }

GET  /api/v2/finance/ledger?from=...&to=... -> { entries, totals }
```

#### Payments Response Examples (Standard Envelope)

Create Payment (success):
```json
{
  "success": true,
  "data": {
    "id": "pay_01HXY...",
    "bookingId": "bk_01HAB...",
    "provider": "stripe",
    "amount": 250000,
    "currency": "INR",
    "status": "requires_action",
    "clientSecret": "pi_3O..._secret_..."
  },
  "traceId": "c2b5d2c8-..."
}
```

Create Payment (error):
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_ERROR",
    "message": "Card was declined",
    "details": [{ "providerCode": "card_declined" }],
    "type": "client"
  },
  "traceId": "c2b5d2c8-..."
}
```

Refund (success):
```json
{
  "success": true,
  "data": {
    "id": "rfnd_01HXY...",
    "paymentId": "pay_01HXY...",
    "amount": 50000,
    "status": "succeeded"
  },
  "traceId": "c2b5d2c8-..."
}
```

### Data & Architecture

- **Optimistic Concurrency:** Version field (`__v`) and conditional updates to prevent overwrites.
- **Idempotent Commands:** Natural keys and idempotency records for external callbacks/jobs.
- **Soft Delete + Retention:** `deletedAt` with purge windows and audit preservation.
- **Migrations:** Versioned DB migrations with backward-compatible reads; blue/green deploy notes.
- **Search:** Faceted search for packages (destination/duration/price/date), text index or Elastic/OpenSearch.
- **Locks:** Booking-level mutex to avoid double confirmation; distributed locks via Redis.
- **ETL/Exports:** Per-tenant export/import for portability and DR.

### Internationalization & Locale

- **Localization:** Multi-language content for packages, email templates; locale negotiation per request.
- **Formatting:** Currency, number, date/time formatting based on locale/timezone.
- **Taxes:** Region-specific GST/VAT rules, rounding modes, inclusive/exclusive pricing.
- **Timezones:** Tenant business-hours timezone, SLA calculations respecting holidays and working hours.
- **Calendars:** Calendar feeds (iCal) and Google Calendar sync for departures and tasks.

### Database Models

#### Core Models

1. **Tenant** - Travel agency/organization
   ```javascript
   {
     name, slug, domain, subdomain,
     logo, brandColors, emailTemplates,
     owner, subscription, settings,
     status, createdAt
   }
   ```

2. **User** - All user types with role-based fields
   ```javascript
   {
     tenantId, role, email, password,
     firstName, lastName, avatar,
     phone, address,
     
     // Customer Type Differentiation
     agentId, // if customer: assigned agent ID (B2B), null = direct customer (B2C)
     customerType, // 'direct' (B2C) or 'agent_customer' (B2B)
     
     // Customer Specific Fields
     dateOfBirth, gender, nationality,
     emergencyContact: { name, phone, relation },
     travelPreferences: {
       seatPreference, mealPreference,
       specialRequirements, dietaryRestrictions
     },
     medicalInfo: {
       bloodGroup, allergies, medications,
       medicalConditions
     },
     
     permissions, status,
     emailVerified, lastLogin
   }
   ```
   **Roles:** super_admin, tenant, supplier, operator, agent, customer

3. **Query** - Customer inquiries from all sources
   ```javascript
   {
     tenantId, customerId, source,
     assignedTo (agent/operator),
     destination, dates, travelers,
     budget, requirements,
     status, priority, slaDeadline
   }
   ```

4. **Package** - Pre-built published travel packages
   ```javascript
   {
     tenantId, createdBy,
     
     // Package Info
     name, code, description,
     destination, countries, cities,
     duration: { days, nights },
     category, // honeymoon, adventure, family, luxury, budget
     tags: [], // beach, mountains, cultural, wildlife
     
     // Itinerary (day-wise from rate lists)
     itinerary: [
       {
         day, title, description,
         accommodation: { rateListId, details },
         transport: { rateListId, details },
         activities: [{ rateListId, details }],
         meals: [{ rateListId, type }]
       }
     ],
     
     // Pricing (calculated from rate lists)
     pricing: {
       basePrice, // per person (double occupancy)
       singleSupplement, // extra for single room
       childPrice, infantPrice,
       groupDiscount: [
         { minPax, discount }
       ],
       inclusions: [],
       exclusions: [],
       currency
     },
     
     // Publishing
     isPublished, // visible to customers/agents
     visibility, // public, agent_only, private
     isFeatured, // show on homepage
     publishedAt,
     
     // Availability
     availableDates: [
       { from, to, available: true/false }
     ],
     seasonalPricing: [
       { season, from, to, priceMultiplier }
     ],
     minPax, maxPax,
     
     // Media
     images: [
       { url, caption, isPrimary, order }
     ],
     videoUrl,
     brochureUrl,
     
     // SEO & Marketing
     seoTitle, seoDescription,
     highlights: [],
     
     // Stats
     viewCount, quoteCount, bookingCount,
     avgRating, reviewCount,
     
     // Linked Rate Lists
     rateListsUsed: [rateListId],
     
     status, // draft, published, archived
     createdAt, updatedAt
   }
   ```

5. **Itinerary** - Custom or package-based itineraries
   ```javascript
   {
     tenantId, queryId, packageId,
     
     // Day-wise Planning
     days: [
       {
         day, title, description,
         
         // Services from Rate Lists (with full rate list reference)
         accommodation: { 
           rateListId, // Reference to RateList
           rateListSnapshot: { /* Copy of rate list at booking time */ },
           quantity, // number of rooms
           nights, // number of nights
           calculatedPrice, // auto-calculated from rate list
           manualOverride, // optional manual price
           guests: { adults, children, infants }
         },
         
         transport: { 
           rateListId,
           rateListSnapshot,
           quantity, // number of vehicles
           distance, // if applicable
           calculatedPrice,
           manualOverride
         },
         
         activities: [
           { 
             rateListId,
             rateListSnapshot,
             quantity, // number of people
             calculatedPrice,
             manualOverride
           }
         ],
         
         meals: [
           { 
             rateListId,
             rateListSnapshot,
             type, // breakfast, lunch, dinner
             quantity, // number of people
             calculatedPrice,
             manualOverride
           }
         ],
         
         guide: { 
           rateListId,
           rateListSnapshot,
           calculatedPrice,
           manualOverride
         },
         
         notes
       }
     ],
     
     // Pricing Calculation (auto-calculated from rate lists)
     pricingSummary: {
       accommodationTotal,
       transportTotal,
       activitiesTotal,
       mealsTotal,
       guidesTotal,
       subtotal,
       
       // Commissions (from rate lists)
       agentCommission,
       operatorCommission,
       
       // Taxes (from rate lists)
       gst,
       serviceTax,
       otherTaxes,
       
       totalTax,
       grandTotal
     },
     
     // Linked Rate Lists (for tracking)
     rateListsUsed: [
       { 
         rateListId, 
         serviceType,
         supplierId,
         priceAtBooking // snapshot of price
       }
     ],
     
     // PDF Generation
     pdfUrl, // generated itinerary PDF
     
     status, createdBy, createdAt, updatedAt
   }
   ```

6. **Quote** - Pricing proposals with itinerary links
   ```javascript
   {
     tenantId, queryId, itineraryId,
     customerId, agentId, operatorId,
     
     // Quote Details
     quoteNumber, // auto-generated (e.g., QT-2025-0001)
     title, description,
     
     // Pricing (from itinerary)
     lineItems: [
       {
         day, description, serviceType,
         quantity, unitPrice, total,
         rateListId // reference for tracking
       }
     ],
     
     subtotal,
     agentCommission, // from rate lists
     operatorCommission,
     taxBreakdown: {
       gst, serviceTax, otherTaxes
     },
     discount, // optional
     grandTotal,
     
     // Payment Terms
     paymentSchedule: [
       { 
         milestone, // advance, pre-departure, post-trip
         percentage,
         amount,
         dueDate
       }
     ],
     
     // Validity
     validFrom, validUntil,
     
     // Terms & Conditions
     termsAndConditions,
     cancellationPolicy, // from rate lists
     
     // Generated Documents
     quotePdfUrl, // generated quote PDF
     itineraryPdfUrl, // linked itinerary PDF
     
     // Email Tracking
     emailsSent: [
       {
         sentTo, sentAt, emailId,
         status, // sent, delivered, opened, failed
         attachments: []
       }
     ],
     
     // Status & Approvals
     status, // draft, sent, viewed, accepted, rejected, expired
     customerFeedback,
     rejectionReason,
     
     // Versioning (for quote revisions)
     version, previousVersionId,
     
     source, // customer_portal, agent, email_ai
     createdBy, updatedBy,
     createdAt, updatedAt
   }
   ```

7. **Booking** - Confirmed reservations
   ```javascript
   {
     tenantId, quoteId, customerId,
     agentId (who created),
     operatorId (who processed),
     itineraryId, status,
     payments, documents,
     confirmationNumber
   }
   ```

8. **Payment** - Financial transactions
   ```javascript
   {
     tenantId, bookingId, customerId,
     amount, method, status,
     invoiceUrl, receiptUrl,
     processedBy, processedAt
   }
   ```

9. **Supplier** - External partners
   ```javascript
   {
     tenantId, name, type,
     contact, businessInfo,
     bankDetails, commissionRate,
     status, createdAt
   }
   ```

10. **RateList** - Supplier pricing and inventory
    ```javascript
    {
      tenantId, supplierId,
      
      // Basic Info
      name, code, description,
      category, type, status,
      
      // Validity Period
      validFrom, validTo,
      blackoutDates: [{ from, to, reason }],
      
      // Service Details
      serviceType, // hotel, transport, activity, meal, guide, package
      destination, location,
      
      // Hotel Specific
      hotelName, starRating, roomType,
      occupancy: { single, double, triple, extraBed },
      mealPlan, // EP, CP, MAP, AP
      
      // Transport Specific
      vehicleType, capacity, acType,
      route: { from, to, distance },
      
      // Activity Specific
      activityName, duration, minPax, maxPax,
      inclusions: [], exclusions: [],
      
      // Pricing
      pricing: {
        currency, // INR, USD, EUR
        basePrice, // per unit (room/vehicle/person)
        
        // Seasonal Rates
        peakSeason: { from, to, price, markup },
        offSeason: { from, to, price, discount },
        
        // Volume Discounts
        bulkDiscount: [
          { minQty, maxQty, discount }
        ],
        
        // Child/Senior Pricing
        childPrice, // 5-12 years
        infantPrice, // 0-5 years
        seniorPrice, // 60+ years
        
        // Extra Charges
        extraBedCharge,
        gstPercentage,
        serviceTax,
        otherTaxes: [],
        
        // Commission
        agentCommission, // percentage
        operatorCommission
      },
      
      // Availability
      availability: {
        monday, tuesday, wednesday,
        thursday, friday, saturday, sunday,
        minAdvanceBooking, // days
        maxAdvanceBooking,
        cutoffTime // hours before check-in
      },
      
      // Booking Policies
      cancellationPolicy: [
        { daysBeforeCheckIn, cancellationCharge }
      ],
      paymentTerms, // advance, credit days
      
      // Additional Details
      amenities: [],
      images: [],
      documents: [], // contracts, licenses
      notes,
      
      // Metadata
      createdBy, updatedBy,
      version, // for tracking changes
      isActive, isPublished,
      createdAt, updatedAt
    }
    ```

11. **CustomerDocument** - Customer uploaded documents
    ```javascript
    {
      tenantId, customerId,
      
      // Document Info
      documentType, // pan, passport, license, visa, insurance, photo, other
      documentNumber,
      
      // File Details
      fileName, fileUrl, fileSize,
      mimeType, uploadedAt,
      
      // Passport/Visa Specific
      issueDate, expiryDate,
      issuingCountry, issuingAuthority,
      
      // Verification
      verificationStatus, // pending, verified, rejected
      verifiedBy, verifiedAt,
      rejectionReason,
      
      // Sharing & Access
      sharedWith: [{ userId, role, sharedAt }],
      isPublic, // visible to all agents/operators
      
      // Metadata
      notes, tags,
      createdAt, updatedAt
    }
    ```

12. **EmailTemplate** - Email templates for notifications
    ```javascript
    {
      tenantId,
      
      // Template Info
      name, slug, category,
      // Categories: quote_sent, booking_confirmed, payment_received,
      // document_expiry, password_reset, email_verification, etc.
      
      // Content
      subject, // with variables: {{customerName}}, {{quoteNumber}}
      htmlBody, // HTML template with Handlebars
      textBody, // Plain text fallback
      
      // Variables/Placeholders
      variables: [
        { name: 'customerName', description: 'Customer full name' },
        { name: 'quoteNumber', description: 'Quote number' },
        { name: 'totalAmount', description: 'Total quote amount' },
        { name: 'validUntil', description: 'Quote validity date' },
        { name: 'itineraryLink', description: 'Link to itinerary' }
      ],
      
      // Attachments Configuration
      attachments: {
        includeQuotePdf: true,
        includeItineraryPdf: true,
        includeTerms: false
      },
      
      // Sender Info
      fromName, fromEmail,
      replyTo,
      
      // Status
      isActive, isDefault,
      createdBy, updatedBy,
      createdAt, updatedAt
    }
    ```

13. **EmailLog** - Email delivery tracking
    ```javascript
    {
      tenantId, userId, customerId,
      
      // Email Details
      templateId, emailType,
      subject, toEmail, fromEmail,
      ccEmails: [], bccEmails: [],
      
      // Content
      htmlBody, textBody,
      
      // Attachments
      attachments: [
        { 
          filename, path, contentType,
          size, isGenerated // true for PDFs
        }
      ],
      
      // Delivery Status
      status, // queued, sending, sent, delivered, opened, failed, bounced
      provider, // smtp, sendgrid, ses
      providerId, // external email ID
      
      // Tracking
      sentAt, deliveredAt, openedAt,
      clickTracking: [
        { url, clickedAt, ipAddress }
      ],
      
      // Error Handling
      error, retryCount, maxRetries,
      
      // Related Records
      quoteId, bookingId, paymentId,
      
      createdAt, updatedAt
    }
    ```

14. **Review** - Customer reviews and ratings
    ```javascript
    {
      tenantId, bookingId, customerId,
      
      // Review Target
      reviewType, // booking, supplier, agent
      targetId, // bookingId, supplierId, agentId
      
      // Rating & Feedback
      overallRating, // 1-5 stars
      ratings: {
        service: 1-5,
        valueForMoney: 1-5,
        communication: 1-5,
        quality: 1-5
      },
      
      title, reviewText,
      
      // Media
      photos: [],
      videoUrl,
      
      // Moderation
      status, // pending, approved, rejected
      moderatedBy, moderatedAt,
      rejectionReason,
      
      // Visibility
      isPublic, isFeatured,
      displayOnWebsite,
      
      // Response
      response: {
        text, respondedBy, respondedAt
      },
      
      // Helpfulness
      helpfulCount, notHelpfulCount,
      
      createdAt, updatedAt
    }
    ```

15. **AutomationRule** - Workflow automation rules
    ```javascript
    {
      tenantId,
      
      // Rule Info
      name, description, type,
      // Types: auto_assign, sla_escalation, follow_up, quote_expiry, marketing
      
      // Trigger Conditions
      trigger: {
        event, // query_created, quote_sent, sla_breach, birthday, etc.
        conditions: [
          { field, operator, value }
        ]
      },
      
      // Actions
      actions: [
        {
          type, // assign, escalate, send_email, update_status
          parameters: {}
        }
      ],
      
      // Schedule (for recurring rules)
      schedule: {
        frequency, // daily, weekly, monthly
        time, dayOfWeek, dayOfMonth
      },
      
      // Status & Stats
      isActive, priority,
      executionCount, lastExecuted,
      
      createdBy, updatedBy,
      createdAt, updatedAt
    }
    ```

16. **AuditLog** - Complete audit trail
    ```javascript
    {
      tenantId, userId,
      
      // Action Details
      action, // create, update, delete, login, logout
      entity, // query, quote, booking, user, etc.
      entityId,
      
      // Changes
      before: {}, // previous state
      after: {}, // new state
      changes: [
        { field, oldValue, newValue }
      ],
      
      // Context
      ipAddress, userAgent,
      endpoint, method,
      
      // Metadata
      timestamp, sessionId,
      success, errorMessage
    }
    ```

17. **Notification** - System notifications
    ```javascript
    {
      tenantId, userId, type,
      title, message, data,
      read, sentAt
    }
    ```

### Setup Instructions

```bash
cd backend-v2
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Environment Variables
```
NODE_ENV=development
PORT=5001

# Database
MONGODB_URI=mongodb://localhost:27017/travel-crm-v2

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@travelcrm.com
EMAIL_FROM_NAME=Travel CRM Pro

# Alternative Email Providers (choose one)
# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your-ses-access-key
AWS_SES_SECRET_KEY=your-ses-secret-key

# Email Queue (Redis for Bull)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
EMAIL_QUEUE_CONCURRENCY=5
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=60000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_DOCUMENT_TYPES=application/pdf,image/jpeg,image/png

# Document Storage
DOCUMENTS_DIR=./uploads/documents
PASSPORT_EXPIRY_ALERT_DAYS=90
VISA_EXPIRY_ALERT_DAYS=30

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET=travel-crm-files

# Platform
PLATFORM_NAME=Travel CRM Pro
PLATFORM_URL=https://travelcrm.com
SUPPORT_EMAIL=support@travelcrm.com

# Super Admin
SUPER_ADMIN_EMAIL=admin@travelcrm.com
SUPER_ADMIN_PASSWORD=change-this-password

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
HTTPS_ENFORCE=true
DATA_ENCRYPTION_KEY=your-encryption-key-for-sensitive-data
ENCRYPTION_ALGORITHM=aes-256-gcm

# Session
SESSION_TIMEOUT=3600
MAX_SESSIONS_PER_USER=5

# Redis Cache
REDIS_CACHE_TTL=3600
CACHE_STRATEGY=multi-layer

# Performance
ENABLE_CDN=true
CDN_URL=https://cdn.travelcrm.com
COMPRESSION_ENABLED=true

# Automation
AUTO_ASSIGN_ENABLED=true
SLA_ESCALATION_ENABLED=true
QUOTE_EXPIRY_CHECK_INTERVAL=3600000
BIRTHDAY_EMAIL_TIME=09:00

# Monitoring
ENABLE_AUDIT_LOG=true
AUDIT_LOG_RETENTION_DAYS=90
PERFORMANCE_MONITORING=true

# Payments
PAYMENTS_PROVIDER=stripe
STRIPE_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Webhooks
WEBHOOK_SIGNING_SECRET=your-webhook-hmac-secret
WEBHOOK_MAX_RETRIES=6
WEBHOOK_RETRY_BACKOFF_MS=30000

# Currency/FX
DEFAULT_CURRENCY=INR
SUPPORTED_CURRENCIES=INR,USD,EUR
FX_PROVIDER=openexchangerates
FX_API_KEY=your-fx-api-key
FX_RATE_CACHE_TTL=86400

# Locale/Timezone/Taxes
DEFAULT_LOCALE=en-IN
SUPPORTED_LOCALES=en-IN,en-US
DEFAULT_TIMEZONE=Asia/Kolkata
BUSINESS_HOURS_TZ=Asia/Kolkata
TAX_ENGINE_REGION=IN
TAX_ROUNDING_MODE=HALF_UP

# Response/Tracing
REQUEST_ID_HEADER=X-Request-Id
INCLUDE_TRACE_ID=true
```

### Development
- **Start:** `npm run dev`
- **Test:** `npm test`
- **Lint:** `npm run lint`
- **Seed:** `npm run seed` (Create demo tenants and users)

### Key Implementation Features

#### Tenant Isolation
- Middleware extracts tenant from subdomain/path
- All database queries automatically scoped to tenant
- Cross-tenant data access prevented
- Tenant context available in all requests

#### Email-Based Login Protection
- Email verification required before login
- Verification token sent on registration
- Re-send verification email option
- Token expiry (24 hours)
- Account activation only after verification

#### Password Management
- Minimum requirements: 8 chars, uppercase, lowercase, number
- Secure hashing with bcrypt
- Change password requires old password
- Password reset via email token (1-hour expiry)
- Password history (prevent reuse of last 5)

#### Avatar Management
- Upload via multipart/form-data
- Image validation (type, size)
- Auto-resize to standard dimensions (200x200)
- Format conversion to WebP for optimization
- Old avatar cleanup on update
- Default avatar for new users

#### Document Management (Customer Portal)
- **Supported Documents:**
  - PAN Card (PDF/Image)
  - Passport (with OCR for auto-extraction)
  - Driving License
  - Visa documents
  - Travel Insurance
  - Passport-size photos
- **Features:**
  - Multi-file upload (drag & drop)
  - File type validation (PDF, JPG, PNG)
  - Max file size: 5MB per document
  - Automatic OCR for passport/visa details
  - Expiry date tracking and alerts
  - Document verification workflow
  - Secure encrypted storage
  - Share documents with agents/operators
  - Download all documents as ZIP
- **Expiry Alerts:**
  - Passport: 90 days before expiry
  - Visa: 30 days before expiry
  - Email/SMS notifications
- **Verification Status:**
  - Pending: Awaiting operator review
  - Verified: Approved by operator
  - Rejected: Needs re-upload with reason
- **Access Control:**
  - Customer: Full access to own documents
  - Agent: Access to their customer's documents
  - Operator: Access to all documents
  - Tenant: Full access to tenant's customer documents

#### Email Notification System
- **Professional Email Templates:**
  - Quote sent with PDFs attached
  - Booking confirmation
  - Payment receipt
  - Document expiry alerts
  - Query assignment notifications
  - Customizable per tenant (branding)
  
- **Email Queue with Bull (Redis):**
  - Reliable delivery with retry mechanism
  - Concurrent email sending (configurable)
  - Failed email tracking and re-queue
  - Priority-based sending
  
- **Attachment Generation:**
  - **Quote PDF:** Professional quote with pricing breakdown
  - **Itinerary PDF:** Day-by-day itinerary with images
  - Both PDFs generated on-demand and cached
  - Branded with tenant logo and colors
  
- **Email Tracking:**
  - Sent, delivered, opened status
  - Click tracking for links
  - Bounce and complaint handling
  - Delivery logs with timestamps
  
- **Multi-Provider Support:**
  - SMTP (Gmail, Outlook, etc.)
  - SendGrid (for high volume)
  - AWS SES (cost-effective)
  - Automatic fallback on provider failure

#### Rate List → Itinerary → Quote Integration

**Step 1: Rate List Selection (Agent/Operator)**
```javascript
// Agent browses supplier rate lists
GET /api/v2/suppliers/rate-lists?destination=Goa&validFrom=2025-12-01

// Returns available rate lists with pricing
// Agent selects rate lists for each service (hotel, transport, activity)
```

**Step 2: Itinerary Creation**
```javascript
// Agent builds itinerary by adding services from rate lists
POST /api/v2/packages/itinerary/create
{
  queryId: "...",
  days: [
    {
      day: 1,
      accommodation: {
        rateListId: "RL-HOTEL-001", // Reference to rate list
        quantity: 2, // 2 rooms
        nights: 1,
        guests: { adults: 4, children: 0 }
        // Price auto-calculated from rate list based on:
        // - Season (peak/off-season)
        // - Occupancy
        // - Number of nights
      },
      transport: {
        rateListId: "RL-VEHICLE-001",
        quantity: 1 // 1 vehicle
        // Price from rate list
      },
      activities: [
        {
          rateListId: "RL-ACTIVITY-001",
          quantity: 4 // 4 people
          // Price per person from rate list
        }
      ]
    }
  ]
}

// System automatically:
// 1. Validates rate list validity dates
// 2. Calculates prices based on rate list rules
// 3. Applies seasonal pricing
// 4. Calculates taxes (GST, service tax)
// 5. Calculates commissions (agent, operator)
// 6. Creates rate list snapshot (for price lock)
// 7. Generates pricing summary
```

**Step 3: Quote Generation**
```javascript
// System auto-generates quote from itinerary
POST /api/v2/quotes/create-from-itinerary
{
  itineraryId: "...",
  customerId: "...",
  validUntil: "2025-12-15"
}

// Quote includes:
// - All line items from itinerary (linked to rate lists)
// - Total pricing with breakdown
// - Tax calculations from rate lists
// - Commission calculations
// - Cancellation policy from rate lists
// - Payment schedule
```

**Step 4: PDF Generation & Email**
```javascript
// Generate PDFs and send email
POST /api/v2/quotes/:quoteId/send-email
{
  toEmail: "customer@example.com",
  message: "Here is your customized quote..."
}

// System automatically:
// 1. Generates Quote PDF with:
//    - Quote number, date, validity
//    - Customer details
//    - Line-by-line pricing (from rate lists)
//    - Tax breakdown
//    - Terms & conditions (from rate lists)
//    - Payment schedule
//    - Tenant branding (logo, colors)

// 2. Generates Itinerary PDF with:
//    - Day-by-day itinerary
//    - Service details from rate lists
//    - Hotel/vehicle/activity images
//    - Inclusions/exclusions
//    - Map integration (optional)

// 3. Sends email with:
//    - Professional template (tenant branded)
//    - Both PDFs attached
//    - Approve/Reject buttons
//    - Tracking pixels for open/click

// 4. Logs email in EmailLog model
// 5. Updates quote.emailsSent array
```

**Step 5: Price Protection**
```javascript
// Rate list snapshot saved in itinerary ensures:
// - Price remains same even if supplier updates rate list
// - Historical pricing for auditing
// - Customer sees exact price they were quoted

// Example snapshot:
rateListSnapshot: {
  name: "Deluxe Sea View Room",
  basePrice: 5000,
  gstPercentage: 12,
  agentCommission: 10,
  validFrom: "2025-11-01",
  validTo: "2025-12-31",
  capturedAt: "2025-11-23T10:30:00Z"
}
```

**Benefits of Integration:**
- ✅ No manual price entry (reduces errors)
- ✅ Automatic tax calculation
- ✅ Commission tracking from rate lists
- ✅ Price protection via snapshots
- ✅ Audit trail (which rate list was used)
- ✅ Supplier performance tracking
- ✅ Seasonal pricing handled automatically
- ✅ Bulk discounts applied automatically
- ✅ Cancellation policies inherited from rate lists

#### Session Management
- JWT access token (short-lived, 1 hour)
- Refresh token (long-lived, 7 days)
- Multiple device support
- Session tracking and history
- Remote logout from all devices
- Automatic token refresh

#### Workflow Automation System

**Auto-Assignment Engine:**
```javascript
// Agent Availability Tracking
{
  agentId, status, // online, offline, busy
  currentWorkload, maxCapacity,
  expertise: ['Goa', 'Kerala', 'Rajasthan'],
  lastAssigned, avgResponseTime
}

// Assignment Rules
Rule: When new query arrives
- Filter agents by: online status, expertise match, workload < capacity
- Sort by: response time, conversion rate
- Assign to top agent
- If no agent available → queue for next available

// Round-Robin Implementation
- Track last assigned agent per destination
- Rotate assignments evenly
- Skip offline/busy agents
- Fallback to operator if no agents available
```

**SLA Escalation:**
```javascript
// SLA Levels
Level 1: 0-12 hours → Assigned agent
Level 2: 12-18 hours → Senior agent (auto-escalate)
Level 3: 18-24 hours → Manager (critical alert)
Level 4: >24 hours → Operator + tenant owner notification

// Escalation Job (runs every hour)
Bull.schedule('sla-check', '0 * * * *', async () => {
  const breached = await Query.find({
    status: 'pending',
    slaDeadline: { $lt: new Date() }
  });
  
  for (const query of breached) {
    await escalateQuery(query);
    await sendEscalationAlert(query);
  }
});
```

**Follow-up Campaigns:**
```javascript
// Quote Follow-ups
Day 3: "Just checking in on your quote..."
Day 7: "Special discount if you book this week!"
Day 14: "Is there anything we can help with?"

// Automated Reminders
- Payment due in 7 days
- Booking departure in 3 days
- Passport expiring in 90 days
- Post-trip review request (3 days after return)

// Marketing Automation
Bull.schedule('birthday-emails', '0 9 * * *', async () => {
  const customers = await User.find({
    role: 'customer',
    dateOfBirth: { $regex: getToday() }
  });
  
  for (const customer of customers) {
    await sendBirthdayEmail(customer, {
      discount: '10%',
      validDays: 30
    });
  }
});
```

#### Performance & Scalability

**Multi-Layer Caching Strategy:**
```javascript
// Layer 1: In-Memory Cache (Node.js)
const cache = new Map();
cache.set('rate-list-' + id, data, 60000); // 1 min

// Layer 2: Redis Cache
await redis.setex('tenant-' + slug, 3600, JSON.stringify(tenant));

// Layer 3: MongoDB Indexes
db.quotes.createIndex({ tenantId: 1, customerId: 1, status: 1 });
db.rateList.createIndex({ tenantId: 1, destination: 1, validFrom: 1, validTo: 1 });
db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true });

// Cache Invalidation
- On data change → invalidate related cache
- Background job → refresh popular data
- Cache warming on server start
```

**Database Indexing Strategy:**
```javascript
// Compound Indexes for Common Queries
Query.index({ tenantId: 1, status: 1, createdAt: -1 });
Quote.index({ tenantId: 1, customerId: 1, status: 1 });
Booking.index({ tenantId: 1, agentId: 1, status: 1 });
RateList.index({ tenantId: 1, supplierId: 1, validFrom: 1, validTo: 1 });
AuditLog.index({ tenantId: 1, entityId: 1, timestamp: -1 });

// Text Search Indexes
Query.index({ destination: 'text', requirements: 'text' });
Customer.index({ firstName: 'text', lastName: 'text', email: 'text' });

// TTL Indexes
EmailLog.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
```

**CDN & Static Assets:**
```javascript
// Static File Organization
/cdn
├── /tenants/{slug}/logo.png
├── /tenants/{slug}/branding/
├── /images/destinations/
├── /pdfs/quotes/
├── /pdfs/itineraries/
└── /documents/customers/

// CloudFront/Cloudflare Configuration
- Cache PDFs: 1 year (with versioning)
- Cache images: 1 month
- Cache CSS/JS: 1 week
- Gzip compression enabled
- Brotli compression for modern browsers
```

**Horizontal Scaling:**
```javascript
// PM2 Cluster Mode
pm2 start server.js -i max // Use all CPU cores

// Nginx Load Balancer
upstream backend {
  least_conn; // Route to server with least connections
  server backend1:5001;
  server backend2:5001;
  server backend3:5001;
}

// Session Sticky
- Use Redis for session storage (not in-memory)
- JWT stateless auth (no server affinity needed)
- WebSocket sticky sessions via IP hash

// Database Scaling
- MongoDB replica set (3 nodes minimum)
- Read replicas for analytics
- Sharding by tenantId for large deployments
```

#### Security Enhancements

**Data Encryption:**
```javascript
// Encryption at Rest
- MongoDB encryption: WiredTiger encrypted storage engine
- Sensitive fields: AES-256-GCM encryption
- PII data: Encrypted before storing (passport numbers, PAN, etc.)

// Encrypted Fields
const encrypt = (text) => {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

// Customer Document Storage
{
  documentNumber: encrypt('AB1234567'), // Encrypted
  fileName: 'passport.pdf',
  fileUrl: 's3://encrypted-bucket/...' // Server-side encryption
}
```

**HTTPS Enforcement:**
```javascript
// Middleware: Force HTTPS
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// HSTS Header
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));

// SSL/TLS Configuration
- Minimum TLS 1.2
- Strong cipher suites only
- Certificate pinning
- OCSP stapling
```

**Comprehensive Audit Trail:**
```javascript
// Audit Middleware (logs all changes)
const auditMiddleware = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.method !== 'GET') {
      AuditLog.create({
        tenantId: req.tenant.id,
        userId: req.user.id,
        action: req.method,
        entity: req.baseUrl.split('/').pop(),
        entityId: req.params.id,
        before: req.body.before, // from pre-hook
        after: JSON.parse(data),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date(),
        success: res.statusCode < 400
      });
    }
    originalSend.call(this, data);
  };
  
  next();
};

// Query All Changes
GET /api/v2/audit/logs?entity=quote&entityId=123
// Returns: Who changed what and when

// Mongoose Change Streams
Quote.watch().on('change', (change) => {
  logChange(change.fullDocument, change.updateDescription);
});
```

#### Multi-Tenant Workflow
```javascript
// Request Flow
1. Request arrives → Extract tenant from URL
2. Validate tenant exists and is active
3. Authenticate user → Verify belongs to tenant
4. Check role-based permissions
5. Execute business logic (scoped to tenant)
6. Log audit trail
7. Return response

// Tenant Context Middleware
req.tenant = {
  id: '507f1f77bcf86cd799439011',
  name: 'ABC Travel Agency',
  slug: 'abc-travel',
  settings: {...}
}
```

---
**Version:** 2.0.0  
**Last Updated:** November 23, 2025  
**Architecture:** Multi-Tenant SaaS  
**License:** Proprietary
