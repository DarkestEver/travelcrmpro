# Backend Development - Complete TODO Tracker

**Last Updated:** November 24, 2025  
**Total Tasks:** 450+  
**Completed:** ~150 (33%)  
**Remaining:** ~300 (67%)

---

## 🎯 Quick Status Dashboard

| Category | Completed | Pending | Priority |
|----------|-----------|---------|----------|
| **Core System** | 8/8 (100%) | 0/8 | ✅ Complete |
| **Business Logic** | 2/7 (29%) | 5/7 | 🔴 P0 Critical |
| **Integrations** | 0/6 (0%) | 6/6 | 🔴 P0 Critical |
| **Operations** | 0/5 (0%) | 5/5 | 🟡 P1 High |
| **Enhancements** | 0/4 (0%) | 4/4 | 🟢 P2 Medium |

---

## Phase 1-5: Core System (✅ COMPLETE)

### ✅ Phase 1: Authentication & Multi-Tenant
- [x] User model with password hashing
- [x] JWT authentication (access + refresh)
- [x] Email verification
- [x] Password reset flow
- [x] RBAC middleware
- [x] Profile management
- [x] Avatar upload
- [x] Session tracking
- [x] Rate limiting
- [x] Multi-tenant isolation

### ✅ Phase 2: Supplier Management (Partial)
- [x] Supplier model
- [x] Supplier CRUD
- [x] Contact management
- [x] Service offerings
- [x] 23/27 tests passing

### ✅ Phase 3: Lead Management
- [x] Lead model
- [x] Lead CRUD
- [x] Assignment workflow
- [x] Status tracking
- [x] 34/34 tests passing

### ✅ Phase 4: Itinerary Builder
- [x] Itinerary model with nested schemas
- [x] Day-wise planning
- [x] Auto-cost calculation
- [x] Template system
- [x] 30/30 tests passing

### ✅ Phase 5: Booking Management
- [x] Booking model
- [x] Booking CRUD
- [x] Status workflow
- [x] Payment tracking
- [x] Traveler management
- [x] Auto-generated booking numbers

---

## Phase 2 Enhancement: Rate Lists (🔴 P0 - 5-6 days)

### Database
- [ ] Create RateList model with full schema
- [ ] Add 4 compound indexes
- [ ] Implement virtual fields (isValid)
- [ ] Add validation hooks
- [ ] Test model in isolation

### Core Features
- [ ] Implement `calculatePrice()` method
  - [ ] Seasonal rate application
  - [ ] Occupancy-based pricing
  - [ ] Age-based pricing (adult/child/infant)
  - [ ] Bulk discount calculation
  - [ ] Tax calculation
- [ ] Implement `isBlackoutDate()` method
- [ ] Implement `findOverlapping()` static method

### Controller
- [ ] Create rateListController.js
- [ ] Implement `getAllRateLists()` with filters
  - [ ] Filter by supplier
  - [ ] Filter by service type
  - [ ] Filter by destination
  - [ ] Filter by valid date range
  - [ ] Pagination
- [ ] Implement `getRateList()`
- [ ] Implement `createRateList()`
  - [ ] Validate date ranges
  - [ ] Check for overlaps
  - [ ] Auto-generate code
- [ ] Implement `updateRateList()`
- [ ] Implement `deleteRateList()`
- [ ] Implement `publishRateList()`
- [ ] Implement `unpublishRateList()`
- [ ] Implement `cloneRateList()` for versioning
- [ ] Implement `validateDates()` overlap checker
- [ ] Implement `calculatePrice()` endpoint
- [ ] Implement `bulkUpdate()`

### Import/Export
- [ ] Install dependencies: csv-parser, xlsx, csv-writer
- [ ] Create rateListImportService.js
  - [ ] CSV parser with validation
  - [ ] Excel parser (XLSX)
  - [ ] Error reporting (row-by-row)
  - [ ] Bulk insert with transactions
- [ ] Create rateListExportService.js
  - [ ] CSV generator
  - [ ] Excel generator (XLSX)
  - [ ] Apply filters to export
- [ ] Add file upload middleware (multer)
- [ ] Implement import endpoint
- [ ] Implement export endpoint

### Blackout Dates
- [ ] Add blackout dates array to model
- [ ] Implement addBlackoutDate()
- [ ] Implement removeBlackoutDate()
- [ ] Implement getBlackoutDates()
- [ ] Validate bookings against blackout dates

### Caching
- [ ] Create rateListCacheService.js
- [ ] Implement Redis caching for hot rate lists
- [ ] Cache by destination + date range
- [ ] Invalidate cache on updates
- [ ] Add cache warming job

### Validation & Routes
- [ ] Create rateListSchemas.js
  - [ ] createRateListSchema
  - [ ] updateRateListSchema
  - [ ] validateDatesSchema
  - [ ] calculatePriceSchema
  - [ ] bulkUpdateSchema
  - [ ] importSchema
- [ ] Create routes/rateList.js
- [ ] Apply RBAC (admin only for create/update/delete)
- [ ] Mount routes in app.js

### Testing
- [ ] Create tests/integration/rateList.test.js
- [ ] Test CRUD operations
- [ ] Test price calculation (10+ scenarios)
  - [ ] Base pricing
  - [ ] Seasonal rates (peak/low)
  - [ ] Occupancy pricing
  - [ ] Age-based pricing
  - [ ] Bulk discounts
  - [ ] Tax calculation
- [ ] Test overlap validation
- [ ] Test CSV import (1000+ rows)
- [ ] Test Excel import
- [ ] Test CSV export
- [ ] Test Excel export
- [ ] Test blackout dates
- [ ] Test publish/unpublish
- [ ] Test caching
- [ ] Test multi-tenant isolation

**Estimated Time:** 5-6 days  
**Critical Path:** Yes - Required for dynamic pricing

---

## Phase 6: Quotes & PDFs (🔴 P0 - 6-7 days)

### Database
- [ ] Create Quote model with full schema
- [ ] Add 5 indexes
- [ ] Implement virtual fields (isExpired, daysUntilExpiry)
- [ ] Add validation hooks

### Core Features
- [ ] Implement `generateQuoteNumber()` static
  - [ ] Format: QT-YYMM-XXXX
  - [ ] Sequential per tenant
  - [ ] Test uniqueness
- [ ] Implement `createRevision()` method
- [ ] Implement status transition methods
  - [ ] markAsSent()
  - [ ] markAsViewed()
  - [ ] approve()
  - [ ] reject()
  - [ ] convertToBooking()
- [ ] Implement expiry detection (pre-save hook)

### PDF Generation
- [ ] Install Puppeteer: `npm install puppeteer`
- [ ] Create pdfGenerationService.js
- [ ] Create HTML template for quote PDF
  - [ ] Include tenant logo
  - [ ] Apply tenant brand colors
  - [ ] Header with quote number
  - [ ] Footer with page numbers
  - [ ] Line items table
  - [ ] Pricing breakdown
  - [ ] Payment schedule
  - [ ] Terms & conditions
- [ ] Create HTML template for itinerary PDF
  - [ ] Day-wise breakdown
  - [ ] Activities, accommodation, transport
  - [ ] Map integration (optional)
- [ ] Implement `generateQuotePdf()`
- [ ] Implement `generateItineraryPdf()`
- [ ] Store PDFs in S3/MinIO
- [ ] Add error handling and retries

### Controller
- [ ] Create quoteController.js
- [ ] Implement `getAllQuotes()` with filters
  - [ ] Filter by status
  - [ ] Filter by customer
  - [ ] Filter by date range
  - [ ] Pagination
- [ ] Implement `getQuote()`
- [ ] Implement `createQuote()` from itinerary
  - [ ] Extract line items from itinerary
  - [ ] Calculate pricing
  - [ ] Generate payment schedule
  - [ ] Set validity period
  - [ ] Auto-generate quote number
- [ ] Implement `updateQuote()` (draft only)
- [ ] Implement `deleteQuote()` (draft only)
- [ ] Implement `sendQuote()` via email
  - [ ] Generate PDFs
  - [ ] Send email with attachments
  - [ ] Mark as sent
  - [ ] Track email
- [ ] Implement `markAsViewed()` (customer action)
- [ ] Implement `approveQuote()` (customer action)
- [ ] Implement `rejectQuote()` (customer action)
- [ ] Implement `reviseQuote()` (create new version)
- [ ] Implement `generatePdf()` on-demand
- [ ] Implement `convertToBooking()`
- [ ] Implement `getQuoteVersions()`
- [ ] Implement `compareQuotes()`
- [ ] Implement `expireOldQuotes()` cron job
- [ ] Implement `getQuoteStats()`

### Email Integration
- [ ] Create quote email template (Handlebars/EJS)
- [ ] Add magic links for approval/rejection (no login)
- [ ] Attach quote PDF
- [ ] Attach itinerary PDF
- [ ] Track email opens
- [ ] Track link clicks

### Cron Jobs
- [ ] Create Bull job: Expire old quotes (daily)
- [ ] Create Bull job: Follow-up emails (day 3, 7)

### Validation & Routes
- [ ] Create quoteSchemas.js
  - [ ] createQuoteSchema
  - [ ] updateQuoteSchema
  - [ ] sendQuoteSchema
  - [ ] approveQuoteSchema
  - [ ] rejectQuoteSchema
  - [ ] reviseQuoteSchema
- [ ] Create routes/quote.js
- [ ] Add public routes (view, approve, reject)
- [ ] Apply RBAC for internal routes
- [ ] Mount routes in app.js

### Testing
- [ ] Create tests/integration/quote.test.js
- [ ] Test quote creation from itinerary
- [ ] Test quote numbering sequence
- [ ] Test payment schedule calculation
- [ ] Test status transitions
- [ ] Test PDF generation (quote)
- [ ] Test PDF generation (itinerary)
- [ ] Test branding in PDFs
- [ ] Test email sending with attachments
- [ ] Test approval workflow
- [ ] Test rejection workflow
- [ ] Test revisions (versioning)
- [ ] Test expiry logic
- [ ] Test conversion to booking
- [ ] Test quote comparison
- [ ] Test multi-tenant isolation

**Estimated Time:** 6-7 days  
**Critical Path:** Yes - Required for customer quotes

---

## Phase 7 Enhancement: Payment Integration (🔴 P0 - 5-6 days)

### Stripe Integration
- [ ] Install: `npm install stripe`
- [ ] Create stripeService.js
- [ ] Implement `createPaymentIntent()`
- [ ] Implement `confirmPayment()`
- [ ] Implement `processRefund()`
- [ ] Implement webhook handler
  - [ ] Handle payment_intent.succeeded
  - [ ] Handle payment_intent.failed
  - [ ] Handle charge.refunded
  - [ ] Handle charge.dispute.created
- [ ] Implement signature verification
- [ ] Store Stripe credentials securely
- [ ] Add test mode support

### Razorpay Integration
- [ ] Install: `npm install razorpay`
- [ ] Create razorpayService.js
- [ ] Implement `createOrder()`
- [ ] Implement `verifySignature()`
- [ ] Implement `processRefund()`
- [ ] Implement webhook handler
  - [ ] Handle payment.authorized
  - [ ] Handle payment.captured
  - [ ] Handle payment.failed
  - [ ] Handle refund.processed
- [ ] Store Razorpay credentials securely

### PayPal Integration
- [ ] Install: `npm install @paypal/checkout-server-sdk`
- [ ] Create paypalService.js
- [ ] Implement `createOrder()`
- [ ] Implement `captureOrder()`
- [ ] Implement `processRefund()`
- [ ] Implement webhook handler
  - [ ] Handle PAYMENT.CAPTURE.COMPLETED
  - [ ] Handle PAYMENT.CAPTURE.DENIED
  - [ ] Handle PAYMENT.REFUND.COMPLETED
- [ ] Verify webhook signatures
- [ ] Store PayPal credentials securely

### Payment Model Enhancements
- [ ] Add Stripe fields (paymentIntentId, clientSecret, chargeId)
- [ ] Add Razorpay fields (orderId, paymentId, signature)
- [ ] Add PayPal fields (orderId, captureId)
- [ ] Add 3D Secure fields
- [ ] Add refunds array
- [ ] Add disputes array
- [ ] Add webhookEvents array
- [ ] Add idempotencyKey field

### Invoicing System
- [ ] Create Invoice model
- [ ] Implement `generateInvoiceNumber()` (INV-YYMM-XXXX)
- [ ] Create invoiceController.js
- [ ] Implement invoice CRUD
- [ ] Implement invoice PDF generation
- [ ] Implement `markAsPaid()`
- [ ] Implement `recordPayment()` for partial payments
- [ ] Implement email delivery

### Ledger System
- [ ] Create Ledger model (double-entry)
- [ ] Create ledgerController.js
- [ ] Implement ledger entry creation
  - [ ] Payment entries
  - [ ] Refund entries
  - [ ] Commission entries
  - [ ] Adjustment entries
- [ ] Implement `getBalanceSheet()`
- [ ] Implement `getProfitAndLoss()`
- [ ] Implement reconciliation

### Multi-Currency
- [ ] Integrate FX rates API (exchangerate-api.com)
- [ ] Create fxService.js
- [ ] Implement rate fetching
- [ ] Implement rate caching (24h TTL)
- [ ] Implement conversion logic
- [ ] Store FX rate with each payment

### Refunds & Disputes
- [ ] Implement full refund processing
- [ ] Implement partial refund processing
- [ ] Add refund tracking to payments
- [ ] Implement dispute handling
- [ ] Add notifications for disputes

### Controller Enhancements
- [ ] Update paymentController.js
- [ ] Add gateway configuration endpoints
- [ ] Add payment intent/order creation
- [ ] Add webhook endpoints (Stripe, Razorpay, PayPal)
- [ ] Add refund endpoint
- [ ] Add invoice endpoints
- [ ] Add ledger endpoints
- [ ] Add FX conversion endpoint

### Idempotency & Webhooks
- [ ] Implement idempotency middleware
- [ ] Store webhook event IDs in Redis
- [ ] Prevent duplicate webhook processing
- [ ] Log all webhook events
- [ ] Add webhook replay capability

### Testing
- [ ] Create tests/integration/payment-gateways.test.js
- [ ] Test Stripe payment flow
- [ ] Test Razorpay payment flow
- [ ] Test PayPal payment flow
- [ ] Test webhook handling (all gateways)
- [ ] Test signature verification
- [ ] Test idempotency
- [ ] Test refund processing
- [ ] Test invoice generation
- [ ] Test ledger entries balance
- [ ] Test multi-currency
- [ ] Test 3D Secure flow
- [ ] Test dispute handling

**Estimated Time:** 5-6 days  
**Critical Path:** Yes - Required for revenue collection

---

## Phase 8 Enhancement: Email Automation (🟡 P1 - 3-4 days)

### Email Service Integration
- [ ] Install Nodemailer: `npm install nodemailer`
- [ ] Create emailService.js
- [ ] Integrate SendGrid
- [ ] Integrate AWS SES (alternative)
- [ ] Implement email sending
- [ ] Implement retry logic (3 attempts)
- [ ] Implement exponential backoff

### Email Templates
- [ ] Install Handlebars: `npm install handlebars`
- [ ] Create template rendering engine
- [ ] Create booking confirmation template
- [ ] Create payment receipt template
- [ ] Create quote sent template
- [ ] Create itinerary update template
- [ ] Create password reset template
- [ ] Create welcome email template
- [ ] Add variable substitution {{variableName}}

### Email Queue
- [ ] Install Bull: `npm install bull`
- [ ] Create email queue
- [ ] Add job: sendEmail
- [ ] Add job: sendBulkEmail
- [ ] Add retry logic
- [ ] Add dead letter queue (DLQ)
- [ ] Monitor queue depth

### Email Tracking
- [ ] Implement open tracking (pixel)
- [ ] Implement click tracking (redirect links)
- [ ] Update EmailLog on events
- [ ] Add tracking statistics endpoint

### Controller Enhancements
- [ ] Update emailController.js
- [ ] Implement actual email sending (not just logging)
- [ ] Implement template variable validation
- [ ] Implement bulk email sending
- [ ] Add email queue status endpoint

### Testing
- [ ] Test email sending (use MailHog/Mailtrap)
- [ ] Test template rendering
- [ ] Test variable substitution
- [ ] Test open tracking
- [ ] Test click tracking
- [ ] Test retry logic
- [ ] Test bulk sending

**Estimated Time:** 3-4 days  
**Priority:** P1 - Essential for customer communication

---

## Phase 10: Packages Catalog (🟡 P1 - 4-5 days)

### Database
- [ ] Create Package model
  - [ ] Package metadata (name, destination, duration)
  - [ ] Day-wise itinerary structure
  - [ ] Pricing (base, seasonal, occupancy)
  - [ ] Visibility (public/private/agent-only)
  - [ ] Featured flag
  - [ ] Images array
  - [ ] SEO fields (title, description, keywords)
  - [ ] View counter
  - [ ] Quote counter

### Features
- [ ] Implement package creation from rate lists
- [ ] Implement publish/unpublish workflow
- [ ] Implement featured packages selection
- [ ] Implement package browsing with filters
  - [ ] By destination
  - [ ] By price range
  - [ ] By duration
  - [ ] By travel dates
- [ ] Implement text search (name, destination, highlights)
- [ ] Implement sorting (price, popularity, rating, newest)
- [ ] Implement view counter (debounced)

### Controller
- [ ] Create packageController.js
- [ ] Implement package CRUD
- [ ] Implement publish/unpublish
- [ ] Implement browsing endpoint (public)
- [ ] Implement filters endpoint
- [ ] Implement search endpoint
- [ ] Implement featured packages
- [ ] Implement create quote from package

### Routes & Validation
- [ ] Create packageSchemas.js
- [ ] Create routes/package.js
- [ ] Add public routes (browse, view)
- [ ] Add RBAC for internal routes
- [ ] Mount routes in app.js

### Testing
- [ ] Test package CRUD
- [ ] Test visibility controls
- [ ] Test filters
- [ ] Test search
- [ ] Test view counter

**Estimated Time:** 4-5 days  
**Priority:** P1 - Pre-built packages for faster sales

---

## Phase 11: Queries & SLA (🟡 P1 - 5-6 days)

### Database
- [ ] Create Query model
  - [ ] Customer details
  - [ ] Destination and dates
  - [ ] Traveler count
  - [ ] Budget
  - [ ] Requirements
  - [ ] Source (web, phone, email, referral)
  - [ ] Assignment fields
  - [ ] SLA deadline
  - [ ] Priority

### Auto-Assignment Engine
- [ ] Create autoAssignmentService.js
- [ ] Implement round-robin algorithm
- [ ] Implement workload-based assignment
- [ ] Implement skill-based assignment
- [ ] Track agent availability (online/offline)
- [ ] Skip offline agents

### SLA System
- [ ] Create SLA calculation service
- [ ] Set deadlines based on priority
  - [ ] High priority: 4 hours
  - [ ] Medium: 24 hours
  - [ ] Low: 48 hours
- [ ] Create SLA escalation job (hourly)
- [ ] Escalate overdue queries (4 levels)
- [ ] Notify agents/managers

### Controller
- [ ] Create queryController.js
- [ ] Implement query CRUD
- [ ] Implement assignment endpoint
- [ ] Implement auto-assignment trigger
- [ ] Implement SLA tracking
- [ ] Implement escalation handling

### Testing
- [ ] Test auto-assignment algorithms
- [ ] Test SLA calculation
- [ ] Test escalation logic
- [ ] Test workload balancing

**Estimated Time:** 5-6 days  
**Priority:** P1 - Essential for query management

---

## Phase 12: Customer Portal (🟡 P1 - 4-5 days)

### APIs
- [ ] Create customerPortalController.js
- [ ] Implement `getMyQueries()`
- [ ] Implement `getMyQuotes()`
- [ ] Implement `getMyBookings()`
- [ ] Implement `getMyPayments()`
- [ ] Implement `getMyDocuments()`
- [ ] Implement `submitReview()`

### Document Management
- [ ] Create Document model
  - [ ] Document type (passport, visa, PAN, etc.)
  - [ ] File URL
  - [ ] Document number
  - [ ] Issue/expiry dates
  - [ ] Verification status
  - [ ] Shared with (agents/operators)
- [ ] Implement document upload (S3/MinIO)
- [ ] Implement OCR (Tesseract.js)
  - [ ] Extract passport number
  - [ ] Extract expiry date
  - [ ] Extract nationality
- [ ] Implement verification workflow
- [ ] Implement expiry alerts (90 days before)
- [ ] Create Bull job: Check expiring documents (daily)

### Routes
- [ ] Create routes/customerPortal.js
- [ ] Add public/authenticated routes
- [ ] Mount routes in app.js

### Testing
- [ ] Test customer endpoints
- [ ] Test document upload
- [ ] Test OCR extraction
- [ ] Test verification workflow
- [ ] Test expiry alerts

**Estimated Time:** 4-5 days  
**Priority:** P1 - Customer self-service

---

## Phase 13: Automation & Campaigns (🟢 P2 - 5-6 days)

### Automation Rules Engine
- [ ] Create AutomationRule model
- [ ] Create automationEngine.js
- [ ] Implement trigger evaluation
- [ ] Implement action execution
- [ ] Support triggers: query_created, quote_sent, booking_confirmed, etc.
- [ ] Support actions: assign, send_email, create_task, update_status

### SLA Escalation
- [ ] Create SLA escalation job (runs hourly)
- [ ] Escalate level 1 → level 2 (manager)
- [ ] Escalate level 2 → level 3 (senior management)
- [ ] Escalate level 3 → level 4 (CEO)
- [ ] Send notifications at each level

### Follow-up Campaigns
- [ ] Create follow-up job (runs daily)
- [ ] Send quote follow-up on day 3, 7, 14
- [ ] Send booking reminder before travel
- [ ] Send review request after travel

### Marketing Automation
- [ ] Create birthday email job (runs daily at 9 AM)
- [ ] Create anniversary email job
- [ ] Create promotional campaign system

### Quote Expiry
- [ ] Create quote expiry job (runs daily)
- [ ] Auto-archive expired quotes
- [ ] Send expiry notification

### Job Dashboard
- [ ] Create jobMonitorController.js
- [ ] Implement `getJobStatus()`
- [ ] Implement `retryFailedJob()`
- [ ] Implement `getJobStats()`

### Testing
- [ ] Test automation rule triggers
- [ ] Test SLA escalation
- [ ] Test follow-up campaigns
- [ ] Test birthday emails
- [ ] Test quote expiry

**Estimated Time:** 5-6 days  
**Priority:** P2 - Automation improves efficiency

---

## Phase 14: Reviews & Ratings (🟢 P2 - 3-4 days)

### Database
- [ ] Create Review model
  - [ ] Review type (booking, supplier, agent)
  - [ ] Overall rating (1-5 stars)
  - [ ] Detailed ratings (service, value, communication)
  - [ ] Review text
  - [ ] Photos
  - [ ] Status (pending, approved, rejected)
  - [ ] Featured flag

### Features
- [ ] Implement booking review submission
- [ ] Implement supplier rating
- [ ] Implement agent rating
- [ ] Implement review moderation workflow
- [ ] Implement featured testimonials selection
- [ ] Implement helpfulness voting

### Controller
- [ ] Create reviewController.js
- [ ] Implement review CRUD
- [ ] Implement moderation endpoints
- [ ] Implement testimonials endpoint
- [ ] Implement voting endpoint

### Automation
- [ ] Create review request job (runs daily)
- [ ] Send review request 3 days after trip end

### Testing
- [ ] Test review submission
- [ ] Test moderation workflow
- [ ] Test featured testimonials
- [ ] Test voting

**Estimated Time:** 3-4 days  
**Priority:** P2 - Social proof for marketing

---

## Phase 15: Webhooks & Integrations (🟢 P2 - 4-5 days)

### Outbound Webhooks
- [ ] Create WebhookEndpoint model
- [ ] Create webhookDeliveryService.js
- [ ] Implement HMAC signature generation
- [ ] Implement webhook delivery (Bull queue)
- [ ] Implement retry logic (exponential backoff, max 6 retries)
- [ ] Store delivery logs
- [ ] Implement manual replay

### Webhook Management
- [ ] Create webhookController.js
- [ ] Implement endpoint CRUD
- [ ] Implement delivery log retrieval
- [ ] Implement manual replay endpoint
- [ ] Implement secret rotation

### Testing
- [ ] Test webhook delivery
- [ ] Test signature generation
- [ ] Test retry logic
- [ ] Test manual replay

**Estimated Time:** 4-5 days  
**Priority:** P2 - Integration with external systems

---

## Phase 16: Observability & Ops (🔴 P0 - 4-5 days)

### Logging
- [ ] Ensure all logs include traceId, tenantId, userId
- [ ] Ensure structured JSON format
- [ ] Add log levels (error, warn, info, debug)

### Metrics
- [ ] Install Prometheus client: `npm install prom-client`
- [ ] Create metrics service
- [ ] Expose /metrics endpoint
- [ ] Track request count by route
- [ ] Track request duration (histogram)
- [ ] Track error rate
- [ ] Track queue depth

### Dashboards
- [ ] Set up Grafana
- [ ] Create dashboard: API Performance
  - [ ] Request rate
  - [ ] P95/P99 latency
  - [ ] Error rate
- [ ] Create dashboard: Queue Health
  - [ ] Queue depth
  - [ ] Processing rate
  - [ ] Failed jobs
- [ ] Create dashboard: SLA Monitoring
  - [ ] SLA compliance %
  - [ ] Escalation count

### Error Tracking
- [ ] Install Sentry: `npm install @sentry/node`
- [ ] Initialize Sentry
- [ ] Capture all errors
- [ ] Add context (user, tenant, request)
- [ ] Set up alerts

### Alerts
- [ ] Configure alerts for error rate > 1%
- [ ] Configure alerts for P95 latency > 500ms
- [ ] Configure alerts for queue depth > 1000
- [ ] Configure alerts for failed jobs > 10
- [ ] Send to Slack/PagerDuty

### CI/CD
- [ ] Create GitHub Actions workflow
- [ ] Add linting (ESLint)
- [ ] Add tests (Jest)
- [ ] Add security scan (npm audit)
- [ ] Add Docker build
- [ ] Add deployment to staging
- [ ] Add smoke tests

### Database Migrations
- [ ] Create migration scripts directory
- [ ] Document migration process
- [ ] Create rollback scripts

### Load Testing
- [ ] Install K6: `npm install -g k6`
- [ ] Create load test scenarios
- [ ] Test with 100 concurrent users
- [ ] Test with 1000 req/sec
- [ ] Identify bottlenecks

### Testing
- [ ] Test metrics collection
- [ ] Test Sentry error capture
- [ ] Test alerts trigger correctly

**Estimated Time:** 4-5 days  
**Priority:** P0 - Required for production

---

## Phase 17: Security & Compliance (🔴 P0 - 5-6 days)

### GDPR/CCPA Compliance
- [ ] Create Consent model
- [ ] Implement consent tracking
- [ ] Create DSR (Data Subject Request) endpoints
  - [ ] Export user data (JSON)
  - [ ] Delete user data (anonymization)
- [ ] Implement data retention policies

### AV Scanning
- [ ] Install ClamAV
- [ ] Create avScanService.js
- [ ] Scan all uploaded files
- [ ] Reject malicious files
- [ ] Log scan results

### Anti-Abuse
- [ ] Integrate reCAPTCHA/Turnstile
- [ ] Add CAPTCHA to public forms
- [ ] Implement IP allowlist
- [ ] Implement IP blocklist
- [ ] Create abuse detection job

### Audit Logging
- [ ] Create AuditLog model
- [ ] Log all write operations
- [ ] Log all authentication events
- [ ] Implement audit log export

### Testing
- [ ] Test consent tracking
- [ ] Test DSR export
- [ ] Test DSR deletion
- [ ] Test AV scanning
- [ ] Test CAPTCHA

**Estimated Time:** 5-6 days  
**Priority:** P0 - Legal compliance required

---

## Phase 18: Performance & Scale (🟢 P2 - Ongoing)

### Caching
- [ ] Implement in-memory cache (LRU, 1 min TTL)
- [ ] Implement Redis cache (1 hour TTL)
- [ ] Cache tenant data
- [ ] Cache user data
- [ ] Cache rate lists (hot data)
- [ ] Cache FX rates
- [ ] Implement cache invalidation

### Database Optimization
- [ ] Review all indexes
- [ ] Add compound indexes where needed
- [ ] Use MongoDB profiler
- [ ] Identify N+1 queries
- [ ] Fix N+1 queries with aggregation
- [ ] Optimize aggregation pipelines

### Load Testing
- [ ] Run load tests
- [ ] Target: 1000 req/sec
- [ ] Target: P95 < 300ms
- [ ] Target: Cache hit rate > 80%
- [ ] Identify bottlenecks
- [ ] Optimize slow queries

### CDN
- [ ] Set up CloudFront/Cloudflare
- [ ] Serve static assets from CDN
- [ ] Cache PDF files
- [ ] Cache images

### Testing
- [ ] Benchmark before/after optimization
- [ ] Measure cache hit rates
- [ ] Measure query performance

**Estimated Time:** Ongoing  
**Priority:** P2 - Performance improvement

---

## Phase 19: i18n & Localization (🟢 P3 - 3-4 days)

### Multi-Language
- [ ] Install i18next: `npm install i18next`
- [ ] Create language negotiation middleware
- [ ] Support languages: en-US, en-IN, es, fr
- [ ] Translate API error messages
- [ ] Translate email templates
- [ ] Package descriptions in multiple languages

### Locale
- [ ] Implement currency formatting per locale
- [ ] Implement number formatting per locale
- [ ] Implement date formatting per locale

### Tax Regionalization
- [ ] Create tax rules by region
- [ ] Apply GST for India
- [ ] Apply VAT for EU
- [ ] Apply sales tax for US

### Timezone
- [ ] Store tenant timezone
- [ ] Use tenant timezone for SLA calculation
- [ ] Convert all dates to tenant timezone

### Testing
- [ ] Test language negotiation
- [ ] Test currency formatting
- [ ] Test tax calculation by region
- [ ] Test timezone conversion

**Estimated Time:** 3-4 days  
**Priority:** P3 - International expansion

---

## 📊 Summary Statistics

**Total Estimated Time:** 60-70 days (12-14 weeks with 1 developer)

**By Priority:**
- **P0 (Critical):** ~30 days
- **P1 (High):** ~20 days
- **P2 (Medium):** ~15 days
- **P3 (Low):** ~5 days

**By Category:**
- **Database Models:** 8 new models
- **Controllers:** 12 new/enhanced controllers
- **Services:** 15 new services
- **Routes:** 10 new route modules
- **Tests:** 20+ test files
- **Integrations:** 6 major integrations
- **Cron Jobs:** 10+ background jobs

---

## 🎯 Recommended Implementation Order

### Week 1-2 (Critical Revenue Features)
1. Phase 6: Quotes & PDFs (6-7 days)
2. Phase 2 Enhancement: Rate Lists (5-6 days)

### Week 3-4 (Payment & Email)
3. Phase 7: Payment Integration (5-6 days)
4. Phase 8: Email Automation (3-4 days)

### Week 5-6 (Business Features)
5. Phase 10: Packages Catalog (4-5 days)
6. Phase 11: Queries & SLA (5-6 days)

### Week 7-8 (Customer & Operations)
7. Phase 12: Customer Portal (4-5 days)
8. Phase 16: Observability & Ops (4-5 days)

### Week 9-10 (Security & Automation)
9. Phase 17: Security & Compliance (5-6 days)
10. Phase 13: Automation & Campaigns (5-6 days)

### Week 11-12 (Enhancements)
11. Phase 14: Reviews & Ratings (3-4 days)
12. Phase 15: Webhooks (4-5 days)

### Week 13+ (Optimization)
13. Phase 18: Performance & Scale (ongoing)
14. Phase 19: i18n & Localization (3-4 days)

---

**Last Updated:** November 24, 2025  
**Next Review:** Weekly on Mondays
