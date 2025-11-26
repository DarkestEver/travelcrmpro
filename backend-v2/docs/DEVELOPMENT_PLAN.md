# Travel CRM v2 - Development Plan & Strategy

**Version:** 2.0.0  
**Last Updated:** November 24, 2025  
**Estimated Timeline:** 12-14 weeks  
**Current Progress:** 50% Complete (10/20 phases done)  
**Team Size:** Adjust based on actual resources

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Development Strategy](#development-strategy)
3. [Tech Stack & Architecture Decisions](#tech-stack--architecture-decisions)
4. [Development Phases](#development-phases)
5. [Cross-Cutting Concerns](#cross-cutting-concerns)
6. [Quality Gates & Definition of Done](#quality-gates--definition-of-done)
7. [Risk Management](#risk-management)
8. [Success Metrics](#success-metrics)

---

## Executive Summary

### Vision
Build a production-ready multi-tenant B2B/B2C SaaS platform for travel agencies with enterprise-grade features: automation, scalability, security, and compliance.

### Approach
- **Backend-first development** with API-driven architecture
- **Multi-tenant by default** in all layers (data, auth, routing)
- **Security baseline** from day one (RBAC, audit, encryption)
- **Observability-first** (logging, metrics, traces, dashboards)
- **Phased rollout** with feature flags and canary deployments

### Key Milestones
- **Week 4:** Auth + Multi-tenant + Suppliers MVP
- **Week 8:** Packages + Quotes + Email system
- **Week 12:** Payments + Automation + Complete workflows
- **Week 14:** Production-ready with monitoring and compliance

---

## Development Strategy

### Guiding Principles
1. **API-First:** OpenAPI spec before implementation; contract tests in CI
2. **Test-Driven:** Unit + integration + E2E; min 75% coverage
3. **Security by Design:** Threat modeling, encryption, audit trails
4. **Scalability from Start:** Caching, indexing, horizontal scaling patterns
5. **Observability Always:** Structured logs, metrics, traces, dashboards
6. **Incremental Value:** Each phase delivers working features

### Development Workflow
```
Feature Planning → API Design (OpenAPI) → Implementation → Tests → Code Review → Deploy to Dev → QA → Staging → Production
```

### Branch Strategy
- **Main Branch:** Protected, production-ready
- **Feature Branches:** Short-lived (1-3 days), PR-based
- **Release Branches:** Optional for hotfixes
- **Commit Convention:** Conventional commits (feat, fix, docs, refactor, test)

### Environments
| Environment | Purpose | Database | Domain | Auto-Deploy |
|-------------|---------|----------|--------|-------------|
| **Development** | Active development | MongoDB Dev | `dev.travelcrm.local` | On merge to `develop` |
| **Staging** | Pre-production testing | MongoDB Staging | `staging.travelcrm.com` | On tag `v*-rc*` |
| **Production** | Live system | MongoDB Prod (replica set) | `travelcrm.com` | Manual approval |

### CI/CD Pipeline
```yaml
Pipeline Stages:
1. Lint & Format (ESLint, Prettier)
2. Type Check (TypeScript/JSDoc if applicable)
3. Unit Tests (Jest/Mocha)
4. Integration Tests (Supertest)
5. Security Scan (npm audit, Snyk)
6. Build (Docker image)
7. Deploy to Target Environment
8. Smoke Tests (health, critical paths)
9. Notify (Slack/Email)
```

---

## Tech Stack & Architecture Decisions

### Core Stack
- **Runtime:** Node.js 18+ LTS
- **Framework:** Express.js (lightweight, flexible)
- **Database:** MongoDB 6+ with Mongoose ODM
- **Caching:** Redis 7+ (sessions, cache, queues)
- **Queue:** Bull (Redis-based job queue)
- **Email:** Nodemailer + SendGrid/AWS SES
- **PDF:** Puppeteer (server-rendered HTML → PDF)
- **File Storage:** AWS S3 or MinIO (S3-compatible)
- **Authentication:** JWT (access + refresh tokens)

### DevOps & Monitoring
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (optional) or PM2 cluster
- **CI/CD:** GitHub Actions or GitLab CI
- **Logging:** Winston/Pino → CloudWatch/Elasticsearch
- **Metrics:** Prometheus + Grafana
- **Tracing:** OpenTelemetry (optional)
- **Error Tracking:** Sentry
- **Uptime Monitoring:** UptimeRobot/Pingdom

### Security Tools
- **Secrets Management:** AWS Secrets Manager / HashiCorp Vault
- **Encryption:** AES-256-GCM for PII
- **HTTPS:** Let's Encrypt / AWS ACM
- **Rate Limiting:** Express-rate-limit + Redis
- **File Scanning:** ClamAV for AV scanning

---

## Development Phases

> 📂 **Detailed Phase Documents:** [View Phase-by-Phase Breakdown](./phases/README.md)

Each phase has a dedicated document with complete implementation details, code examples, APIs, and checklists.

### Phase 0: Project Foundations (Week 1)
**📄 Detailed Document:** [PHASE_0_FOUNDATIONS.md](./phases/PHASE_0_FOUNDATIONS.md)
**Goal:** Set up project structure, config management, standardized responses, logging

#### Features
- Project scaffolding (folder structure, package.json, scripts)
- Environment configuration with validation (Joi schema)
- Centralized response middleware (`res.ok`, `res.fail`, `res.created`)
- Request ID middleware for tracing
- Structured logging with correlation IDs
- Health and readiness endpoints

#### APIs
```
GET /health         - Basic health check
GET /ready          - Readiness check (DB + Redis connection)
GET /version        - API version info
```

#### Acceptance Criteria
- ✅ Environment variables validated on startup
- ✅ Health endpoints return standardized envelope with `traceId`
- ✅ Logs include `requestId`, `tenantId`, `userId`
- ✅ Response middleware enforced across all routes

#### TODO Checklist
- [ ] Initialize project: `npm init`, install dependencies
- [ ] Create folder structure: `/src/models`, `/src/controllers`, `/src/middleware`, `/src/lib`, `/src/routes`
- [ ] Environment config loader with schema validation
- [ ] Response middleware (`src/lib/response.js`)
- [ ] Request ID middleware (`express-request-id`)
- [ ] Logger setup (Winston/Pino with JSON format)
- [ ] Health endpoints implementation
- [ ] Write unit tests for middleware
- [ ] Document API in OpenAPI spec (`docs/openapi.yaml`)

---

### Phase 1: Authentication & Multi-Tenant (Weeks 1-2)
**📄 Detailed Document:** [PHASE_1_AUTH_MULTITENANT.md](./phases/PHASE_1_AUTH_MULTITENANT.md)  
**Goal:** Tenant resolution, user authentication, RBAC, profile management

#### Features
- Tenant middleware (subdomain/path-based resolution)
- User registration with email verification
- Login/logout with JWT (access + refresh tokens)
- Password reset flow
- Role-based access control (RBAC) middleware
- User profile CRUD (avatar, password, preferences)
- Session management (view active sessions, remote logout)

#### APIs
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/verify-email
POST   /auth/forgot-password
POST   /auth/reset-password

GET    /tenant/profile
PATCH  /tenant/profile
PATCH  /tenant/branding
GET    /tenant/settings
PATCH  /tenant/settings

GET    /profile
PATCH  /profile
POST   /profile/avatar
PATCH  /profile/password
GET    /profile/sessions
DELETE /profile/sessions/:sessionId
```

#### Database Models
- **Tenant:** name, slug, domain, logo, brandColors, settings, status
- **User:** tenantId, role, email, password (hashed), emailVerified, avatar, permissions

#### Acceptance Criteria
- ✅ Tenant auto-resolved from subdomain/path
- ✅ Email verification required before login
- ✅ JWT tokens expire and refresh correctly
- ✅ RBAC middleware blocks unauthorized access
- ✅ Avatar upload resizes and optimizes images
- ✅ Password reset tokens expire after 1 hour
- ✅ Rate limiting prevents brute force attacks

#### TODO Checklist
- [ ] Tenant middleware with subdomain/path extraction
- [ ] User model with password hashing (bcrypt)
- [ ] Email verification service (token generation, expiry)
- [ ] JWT service (sign, verify, refresh)
- [ ] RBAC middleware with permissions matrix
- [ ] Auth controllers (register, login, logout, etc.)
- [ ] Profile controllers (get, update, avatar upload)
- [ ] Avatar processing with Sharp (resize to 200x200)
- [ ] Session tracking in Redis
- [ ] Rate limiting on auth endpoints (5 attempts/15 min)
- [ ] Unit + integration tests (coverage > 80%)
- [ ] Update OpenAPI spec

---

### Phase 2: Suppliers & Rate Lists (Weeks 3-4)
**📄 Detailed Document:** [PHASE_2_SUPPLIERS_RATELISTS.md](./phases/PHASE_2_SUPPLIERS_RATELISTS.md)  
**Goal:** Supplier management, comprehensive rate list system with import/export

#### Features
- Supplier CRUD operations
- Rate list creation with validation (dates, overlaps, pricing)
- Seasonal pricing (peak/off-season)
- Bulk discounts and age-based pricing
- CSV/Excel import and export
- Blackout dates management
- Rate list versioning
- Publish/unpublish workflow

#### APIs
```
GET    /suppliers
POST   /suppliers
GET    /suppliers/:id
PATCH  /suppliers/:id
DELETE /suppliers/:id

GET    /suppliers/rate-lists
POST   /suppliers/rate-lists/create
GET    /suppliers/rate-lists/:id
PATCH  /suppliers/rate-lists/:id
DELETE /suppliers/rate-lists/:id
POST   /suppliers/rate-lists/import      # CSV/Excel upload
GET    /suppliers/rate-lists/export      # Download CSV/Excel
POST   /suppliers/rate-lists/bulk        # Bulk update
POST   /suppliers/rate-lists/validate    # Validate dates & pricing
```

#### Database Models
- **Supplier:** tenantId, name, type, contact, businessInfo, bankDetails, commissionRate
- **RateList:** tenantId, supplierId, serviceType, name, validFrom, validTo, pricing (seasonal, bulk, child/infant), availability, cancellationPolicy

#### Acceptance Criteria
- ✅ Rate list date overlaps flagged on create/update
- ✅ CSV import handles 1000+ rows without timeout
- ✅ Seasonal pricing auto-applied based on date range
- ✅ Indexes on `tenantId + destination + validFrom + validTo`
- ✅ Blackout dates prevent bookings

#### TODO Checklist
- [ ] Supplier model and controllers
- [ ] RateList model with comprehensive schema
- [ ] Date overlap validation service
- [ ] CSV/Excel parser (use `csv-parser`, `xlsx`)
- [ ] CSV/Excel generator for export
- [ ] Bulk update endpoint with transaction support
- [ ] Publish/unpublish workflow
- [ ] Indexing strategy for fast lookups
- [ ] Redis caching for hot rate lists
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 3: Packages Catalog (Weeks 5-6)
**📄 Detailed Document:** *Coming Soon - Summary below*  
**Goal:** Pre-built package creation, publishing, browsing, filtering

#### Features
- Package creation (day-wise itinerary from rate lists)
- Publish packages with visibility settings (public/private/agent-only)
- Featured packages for homepage
- Package browsing with filters (destination, price, duration, dates)
- Search by keywords
- Sorting (price, popularity, rating, newest)
- Package statistics (views, quotes, bookings)
- SEO fields (title, description)

#### APIs
```
GET    /packages/published                # Browse published packages
GET    /packages/filter                   # Filter by destination, price, etc.
GET    /packages/search?q=keyword         # Text search
GET    /packages/featured                 # Featured packages
GET    /packages/:id                      # Package details
POST   /packages/create                   # Create package (tenant/operator)
PATCH  /packages/:id                      # Update package
DELETE /packages/:id                      # Delete package
POST   /packages/:id/publish              # Publish package
POST   /packages/:id/unpublish            # Unpublish package
POST   /packages/:id/quote                # Create quote from package
```

#### Database Models
- **Package:** tenantId, name, destination, duration, itinerary (day-wise), pricing, isPublished, visibility, isFeatured, images, seoTitle, viewCount, quoteCount

#### Acceptance Criteria
- ✅ Packages with `visibility=public` visible to all customers
- ✅ Packages with `visibility=agent_only` visible only to agents
- ✅ Text search finds packages by name, destination, highlights
- ✅ Filters work in combination (destination + price range + dates)
- ✅ View counter increments on package detail view
- ✅ Featured packages return max 10 results

#### TODO Checklist
- [ ] Package model with day-wise itinerary structure
- [ ] Package controllers (CRUD, publish/unpublish)
- [ ] Visibility middleware (public vs agent-only)
- [ ] Filter service (destination, price, duration, dates)
- [ ] Text search index on MongoDB (`name`, `destination`, `highlights`)
- [ ] Featured packages logic (manual selection or auto by popularity)
- [ ] View counter increment (debounced, use Redis)
- [ ] Image upload and management
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 4: Queries & Assignment (Week 6)
**Goal:** Query intake, assignment engine, SLA tracking

#### Features
- Query creation (multi-source: agent, operator, customer portal)
- Query assignment (manual or auto)
- Auto-assignment engine (round-robin, workload-based, skill-based)
- SLA deadline calculation
- Query status tracking
- Priority management

#### APIs
```
POST   /queries/create                    # Create query
POST   /queries/assign                    # Assign to agent/operator
GET    /queries/:id                       # Query details
PATCH  /queries/:id                       # Update query
GET    /queries/track                     # Track all queries
GET    /queries                           # List queries (with filters)
```

#### Database Models
- **Query:** tenantId, customerId, source, assignedTo, destination, dates, travelers, budget, requirements, status, priority, slaDeadline

#### Acceptance Criteria
- ✅ SLA deadline auto-calculated based on priority
- ✅ Auto-assignment selects agent with lowest workload
- ✅ Round-robin skips offline agents
- ✅ Query status transitions validated (draft → pending → assigned → quoted)

#### TODO Checklist
- [ ] Query model with status enum
- [ ] Query controllers (create, assign, update, list)
- [ ] SLA deadline calculation service
- [ ] Auto-assignment engine (round-robin + workload)
- [ ] Agent availability tracking (online/offline status)
- [ ] Query filters (status, priority, assignedTo, date range)
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 5: Itinerary Builder (Weeks 6-7)
**Goal:** Custom itinerary creation from rate lists with auto-pricing

#### Features
- Day-wise itinerary builder
- Service selection from rate lists (hotel, transport, activity, meal, guide)
- Auto-price calculation (seasonal, occupancy, taxes, commissions)
- Manual price override option
- Rate list snapshot for price protection
- Conflict detection (date overlaps, availability)
- Pricing summary generation

#### APIs
```
POST   /packages/itinerary/create         # Create custom itinerary
GET    /itineraries/:id                   # Itinerary details
PATCH  /itineraries/:id                   # Update itinerary
DELETE /itineraries/:id                   # Delete itinerary
POST   /itineraries/:id/calculate-price   # Recalculate pricing
```

#### Database Models
- **Itinerary:** tenantId, queryId, packageId, days (accommodation, transport, activities, meals, guide with rateListSnapshot), pricingSummary, rateListsUsed

#### Acceptance Criteria
- ✅ Price auto-calculated from rate list based on season, occupancy, nights
- ✅ Tax (GST, service tax) calculated correctly
- ✅ Commission (agent, operator) calculated from rate lists
- ✅ Rate list snapshot captured with checksum
- ✅ Conflicts flagged if rate list unavailable on selected dates

#### TODO Checklist
- [ ] Itinerary model with day-wise structure
- [ ] Price calculation engine (seasonal, occupancy, bulk)
- [ ] Tax calculation service (GST, service tax)
- [ ] Commission calculation service
- [ ] Rate list snapshot service (copy with checksum)
- [ ] Conflict detection service (date/availability checks)
- [ ] Pricing summary aggregation
- [ ] Unit + integration tests (edge cases for pricing)
- [ ] Update OpenAPI spec

---

### Phase 6: Quotes, PDFs, Emails (Weeks 7-8)
**Goal:** Quote generation, PDF rendering, email delivery with queue

#### Features
- Quote creation from itinerary
- Quote versioning (revisions)
- Payment schedule generation
- Quote PDF generation (branded with tenant logo)
- Itinerary PDF generation
- Email queue with Bull (Redis)
- Email templates with variables (Handlebars/EJS)
- Email tracking (sent, delivered, opened, clicked)
- Retry mechanism for failed emails

#### APIs
```
POST   /quotes/create                     # Create quote from itinerary
GET    /quotes/:id                        # Quote details
PATCH  /quotes/:id                        # Update quote
DELETE /quotes/:id                        # Delete quote
POST   /quotes/:id/send-email             # Send quote via email
POST   /quotes/:id/approve                # Customer approval
POST   /quotes/:id/reject                 # Customer rejection
POST   /quotes/:id/revise                 # Create new version

GET    /emails/templates                  # List templates
POST   /emails/templates                  # Create template
PATCH  /emails/templates/:id              # Update template
GET    /emails/queue                      # Queue status
GET    /emails/logs                       # Email delivery logs
```

#### Database Models
- **Quote:** tenantId, queryId, itineraryId, quoteNumber, lineItems, subtotal, taxBreakdown, grandTotal, paymentSchedule, validFrom, validUntil, quotePdfUrl, itineraryPdfUrl, emailsSent, status, version
- **EmailTemplate:** tenantId, name, slug, subject, htmlBody, textBody, variables, attachments
- **EmailLog:** tenantId, templateId, toEmail, status, provider, sentAt, deliveredAt, openedAt, error

#### Acceptance Criteria
- ✅ Quote PDF includes tenant logo and brand colors
- ✅ Email template variables replaced correctly
- ✅ Email queued with Bull and processed asynchronously
- ✅ Failed emails retried 3 times with exponential backoff
- ✅ Email open/click tracking works
- ✅ Quote versioning preserves history

#### TODO Checklist
- [ ] Quote model with versioning
- [ ] Quote controllers (create, update, approve, reject, revise)
- [ ] PDF generation service (Puppeteer with HTML templates)
- [ ] Email template engine (Handlebars/EJS)
- [ ] Bull queue setup for emails
- [ ] Email service (Nodemailer + SendGrid/SES)
- [ ] Email tracking service (open/click pixels)
- [ ] Retry logic with exponential backoff
- [ ] Email log model and storage
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 7: Bookings, Payments, Ledger (Weeks 9-10)
**Goal:** Booking management, payment gateways, refunds, invoicing, accounting

#### Features
- Booking creation from approved quotes
- Payment provider integration (Stripe, Razorpay, PayPal)
- Payment intent/order creation
- Provider webhook handling (signature verification, idempotency)
- Refund processing (full/partial)
- Invoice generation with numbering
- Ledger (AR/AP sub-ledger)
- Commission settlement tracking
- Multi-currency support with FX rates

#### APIs
```
GET    /bookings                          # List bookings
POST   /bookings                          # Create booking
GET    /bookings/:id                      # Booking details
PATCH  /bookings/:id                      # Update booking
DELETE /bookings/:id                      # Cancel booking

POST   /finance/providers                 # Configure payment provider
POST   /finance/payments                  # Create payment
GET    /finance/payments/:id              # Payment status
POST   /finance/refunds                   # Create refund
GET    /finance/refunds/:id               # Refund status
POST   /finance/invoices                  # Generate invoice
GET    /finance/invoices/:id              # Invoice details
GET    /finance/ledger                    # Ledger entries

POST   /finance/providers/:provider/webhook  # Inbound webhooks
```

#### Database Models
- **Booking:** tenantId, quoteId, customerId, agentId, operatorId, itineraryId, confirmationNumber, status, payments, documents
- **Payment:** tenantId, bookingId, provider, amount, currency, status, clientSecret, invoiceUrl, receiptUrl
- **Invoice:** tenantId, bookingId, invoiceNumber, lineItems, total, pdfUrl
- **Ledger:** tenantId, entityType, entityId, debit, credit, balance, description

#### Acceptance Criteria
- ✅ Payment webhooks idempotent (duplicate events ignored)
- ✅ Signature verification strict (reject invalid signatures)
- ✅ Refunds tracked separately with reason
- ✅ Invoice numbering sequential per tenant
- ✅ Ledger balanced (debits = credits)
- ✅ Multi-currency payments stored with FX rate at time of payment

#### TODO Checklist
- [ ] Booking model and controllers
- [ ] Payment provider abstraction layer
- [ ] Stripe integration (payment intents, webhooks)
- [ ] Razorpay integration (orders, webhooks)
- [ ] PayPal integration (orders, webhooks)
- [ ] Webhook signature verification
- [ ] Idempotency service (track processed webhook IDs)
- [ ] Refund service
- [ ] Invoice model and PDF generation
- [ ] Ledger model and double-entry bookkeeping
- [ ] FX rate service (API integration)
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 8: Customer Portal APIs & Documents (Week 10)
**Goal:** Customer-facing APIs for queries/quotes/bookings/payments/documents

#### Features
- Customer query list/details
- Customer quote list/comparison
- Customer booking list/details
- Customer payment history
- Document upload (PAN, passport, visa, license, insurance, photos)
- OCR for passport/visa (Tesseract.js)
- Document verification workflow
- Expiry alerts (passport, visa)
- Document sharing with agent/operator

#### APIs
```
GET    /customer/queries                  # Customer's queries
GET    /customer/quotes                   # Customer's quotes
GET    /customer/bookings                 # Customer's bookings
GET    /customer/payments                 # Payment history
GET    /customer/documents                # Customer's documents
POST   /customer/reviews                  # Submit review

POST   /documents/upload                  # Upload document
GET    /documents/:id                     # Document details
POST   /documents/:id/verify              # Verify document (operator)
POST   /documents/:id/share               # Share with agent/operator
GET    /documents/expiry-alerts           # Expiring documents
```

#### Database Models
- **CustomerDocument:** tenantId, customerId, documentType, fileName, fileUrl, documentNumber, issueDate, expiryDate, verificationStatus, verifiedBy, sharedWith

#### Acceptance Criteria
- ✅ OCR extracts passport number, expiry date, nationality
- ✅ Expiry alerts sent 90 days before passport expiry
- ✅ Document verification updates status and logs verifier
- ✅ Shared documents visible to assigned agent/operator only

#### TODO Checklist
- [ ] Customer portal controllers (queries, quotes, bookings, payments)
- [ ] Document upload service (S3/MinIO)
- [ ] OCR service (Tesseract.js for passport/visa)
- [ ] Document verification workflow
- [ ] Expiry alert job (Bull, daily check)
- [ ] Document sharing logic
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 9: Automation & SLA & Campaigns (Week 11)
**Goal:** Workflow automation, SLA escalations, marketing campaigns

#### Features
- Auto-assignment rules (availability, workload, skill-based)
- SLA escalation (4 levels with auto-escalate)
- Follow-up campaigns (quote follow-ups on day 3, 7, 14)
- Marketing automation (birthdays, anniversaries)
- Quote expiry handling (auto-archive)
- Job monitoring dashboard

#### APIs
```
GET    /automation/rules                  # List rules
POST   /automation/rules                  # Create rule
PATCH  /automation/rules/:id              # Update rule
DELETE /automation/rules/:id              # Delete rule

GET    /automation/escalations            # SLA escalation config
POST   /automation/escalations            # Configure escalation

GET    /automation/campaigns              # Marketing campaigns
POST   /automation/campaigns              # Create campaign

GET    /automation/jobs                   # Job queue status
POST   /automation/jobs/:id/retry         # Retry failed job
```

#### Database Models
- **AutomationRule:** tenantId, type, trigger (event, conditions), actions, schedule, isActive, executionCount

#### Acceptance Criteria
- ✅ SLA escalation job runs every hour
- ✅ Follow-up emails sent on configured days
- ✅ Birthday emails sent at configured time (9 AM tenant timezone)
- ✅ Jobs observable with status and retry count
- ✅ Failed jobs moved to DLQ after max retries

#### TODO Checklist
- [ ] Automation rule engine
- [ ] SLA escalation job (Bull scheduler)
- [ ] Follow-up campaign job
- [ ] Birthday/anniversary job
- [ ] Quote expiry job
- [ ] Job dashboard API
- [ ] DLQ and manual replay
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 10: Reviews & Ratings (Week 11)
**Goal:** Customer reviews, supplier ratings, agent performance

#### Features
- Booking reviews (post-trip)
- Supplier ratings (quality, pricing, reliability)
- Agent performance ratings
- Review moderation workflow
- Featured testimonials
- Review helpfulness voting

#### APIs
```
POST   /reviews/bookings                  # Submit booking review
GET    /reviews/bookings/:id              # Review details
POST   /reviews/suppliers                 # Rate supplier
GET    /reviews/suppliers/:id             # Supplier ratings
POST   /reviews/agents                    # Rate agent
GET    /reviews/agents/:id                # Agent ratings
GET    /reviews/testimonials              # Featured testimonials
POST   /reviews/:id/moderate              # Approve/reject review
```

#### Database Models
- **Review:** tenantId, bookingId, customerId, reviewType, targetId, overallRating, ratings (service, value, communication), reviewText, photos, status, moderatedBy, isFeatured

#### Acceptance Criteria
- ✅ Review request sent 3 days after trip end
- ✅ Moderation workflow updates status
- ✅ Featured testimonials show on website
- ✅ Helpfulness voting works

#### TODO Checklist
- [ ] Review model and controllers
- [ ] Review request job (3 days post-trip)
- [ ] Moderation workflow
- [ ] Featured testimonials selection
- [ ] Helpfulness voting
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 11: Webhooks & Integrations (Week 11)
**Goal:** Outbound webhooks, inbound provider webhooks, manual replay

#### Features
- Webhook endpoint management
- HMAC signature generation
- Webhook delivery with retries
- Delivery logs and replay
- Secret rotation
- Provider webhook handling (inbound)

#### APIs
```
GET    /webhooks/endpoints                # List endpoints
POST   /webhooks/endpoints                # Create endpoint
PATCH  /webhooks/endpoints/:id            # Update endpoint
DELETE /webhooks/endpoints/:id            # Delete endpoint

GET    /webhooks/deliveries               # Delivery logs
POST   /webhooks/deliveries/:id/replay    # Manual replay

POST   /webhooks/rotate-secret            # Rotate signing secret
```

#### Acceptance Criteria
- ✅ HMAC signature verified on delivery
- ✅ Failed deliveries retried with exponential backoff
- ✅ Max 6 retries, then move to DLQ
- ✅ Manual replay works for failed deliveries
- ✅ Secret rotation invalidates old signatures

#### TODO Checklist
- [ ] Webhook endpoint model
- [ ] Webhook delivery service (Bull queue)
- [ ] HMAC signature generation/verification
- [ ] Retry logic with exponential backoff
- [ ] Delivery log storage
- [ ] Manual replay endpoint
- [ ] Secret rotation service
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 12: Observability & Ops (Week 12)
**Goal:** Production-ready monitoring, dashboards, alerts, CI/CD

#### Features
- Structured logging with trace IDs
- Metrics collection (Prometheus)
- Dashboards (Grafana)
- Error tracking (Sentry)
- Health/readiness checks
- SLOs and error budgets
- CI/CD hardening
- Database migrations playbook

#### Acceptance Criteria
- ✅ P95 latency < 500ms
- ✅ Error rate < 1%
- ✅ Uptime > 99.9%
- ✅ All errors tracked in Sentry
- ✅ Dashboards show real-time metrics

#### TODO Checklist
- [ ] OpenTelemetry integration
- [ ] Sentry setup and error reporting
- [ ] Prometheus metrics export
- [ ] Grafana dashboards (latency, errors, queue depth, SLA)
- [ ] Alerts (PagerDuty/Slack)
- [ ] CI/CD pipeline hardening (smoke tests, rollback)
- [ ] Database migration scripts
- [ ] Runbook documentation
- [ ] Load testing (K6/Artillery)

---

### Phase 13: Security & Compliance (Week 12)
**Goal:** GDPR/CCPA compliance, AV scanning, anti-abuse

#### Features
- Consent tracking
- Data subject request (DSR) endpoints (export, delete)
- AV scanning for uploads (ClamAV)
- Anti-abuse (CAPTCHA, IP allowlist/blocklist)
- SSO/SCIM (optional)
- Audit log export

#### APIs
```
POST   /privacy/consents                  # Record consent
GET    /privacy/consents/:userId          # User consents
POST   /privacy/requests                  # DSR (export/delete)
GET    /privacy/requests/:id              # DSR status

POST   /security/allowlist                # IP allowlist
POST   /security/blocklist                # IP blocklist
```

#### Acceptance Criteria
- ✅ Consent recorded with timestamp and IP
- ✅ Export DSR returns all user data in JSON
- ✅ Delete DSR anonymizes user data
- ✅ AV scan rejects malicious files
- ✅ CAPTCHA prevents bot abuse

#### TODO Checklist
- [ ] Consent model and tracking
- [ ] DSR export service (JSON export)
- [ ] DSR delete service (anonymization)
- [ ] AV scanning integration (ClamAV)
- [ ] CAPTCHA integration (reCAPTCHA/Turnstile)
- [ ] IP allowlist/blocklist middleware
- [ ] Audit log export
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 14: Performance & Scale (Ongoing)
**Goal:** Optimize performance, prepare for horizontal scaling

#### Features
- 3-layer caching (in-memory + Redis + MongoDB)
- Database indexing optimization
- N+1 query detection and fixes
- Load testing and benchmarking
- Shard-by-tenant readiness
- CDN integration for static assets

#### Acceptance Criteria
- ✅ Cache hit rate > 80% for hot data
- ✅ P95 latency < 300ms after optimization
- ✅ Load test handles 1000 req/sec
- ✅ No N+1 queries in critical paths

#### TODO Checklist
- [ ] In-memory cache for rate lists (LRU, 1 min TTL)
- [ ] Redis cache for tenant/user data (1 hour TTL)
- [ ] MongoDB indexes review and optimization
- [ ] N+1 query audit (use MongoDB profiler)
- [ ] Load testing scenarios (K6)
- [ ] CDN setup (CloudFront/Cloudflare)
- [ ] Database sharding strategy documentation

---

### Phase 15: Internationalization & Locale (Week 13)
**Goal:** Multi-language support, locale/timezone handling, tax regionalization

#### Features
- Multi-language content for packages/templates
- Locale negotiation (Accept-Language header)
- Currency/number/date formatting
- Tax engine regionalization
- Timezone handling for SLA

#### Acceptance Criteria
- ✅ Packages support multiple languages (en-IN, en-US)
- ✅ Currency formatted correctly per locale
- ✅ Tax rules differ by region (IN vs US)
- ✅ SLA calculations respect tenant timezone

#### TODO Checklist
- [ ] i18n library integration (i18next)
- [ ] Language negotiation middleware
- [ ] Currency formatting service
- [ ] Tax engine with regional rules
- [ ] Timezone service for SLA calculation
- [ ] Unit + integration tests
- [ ] Update OpenAPI spec

---

### Phase 16: API Standards & Conformance (Ongoing)
**Goal:** Ensure all APIs follow standards, contract testing

#### Features
- Idempotency key support on all write endpoints
- Pagination/sorting/filtering standards
- ETag support for conditional requests
- OpenAPI spec completeness
- Contract tests in CI

#### Acceptance Criteria
- ✅ All POST/PATCH/DELETE support idempotency keys
- ✅ All list endpoints support pagination
- ✅ OpenAPI spec 100% coverage
- ✅ Contract tests pass in CI

#### TODO Checklist
- [ ] Idempotency middleware (Redis-based deduplication)
- [ ] Pagination middleware (page/limit/cursor)
- [ ] ETag generation and conditional request handling
- [ ] OpenAPI spec validation in CI
- [ ] Contract tests (Dredd/Pact)

---

## Cross-Cutting Concerns

### Security Checklist (Every Phase)
- [ ] Input validation (Joi/Yup schema)
- [ ] SQL/NoSQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize inputs)
- [ ] CSRF protection (if using cookies)
- [ ] Rate limiting on all endpoints
- [ ] Secrets not committed (use `.env`, vault)
- [ ] Dependencies scanned (npm audit, Snyk)
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly

### Testing Checklist (Every Phase)
- [ ] Unit tests (>75% coverage)
- [ ] Integration tests (API endpoints)
- [ ] Contract tests (OpenAPI conformance)
- [ ] E2E tests (critical user flows)
- [ ] Load tests (performance benchmarks)
- [ ] Security tests (OWASP Top 10)

### Documentation Checklist (Every Phase)
- [ ] OpenAPI spec updated
- [ ] README updated with new features
- [ ] Migration notes (if schema changes)
- [ ] Runbook updated (if new jobs/crons)
- [ ] Code comments for complex logic

### Observability Checklist (Every Phase)
- [ ] Structured logs with trace ID
- [ ] Metrics exposed (request count, latency, errors)
- [ ] Error tracking (Sentry)
- [ ] Dashboards updated (Grafana)
- [ ] Alerts configured (critical paths)

---

## Quality Gates & Definition of Done

### Definition of Done (Per Feature)
A feature is considered **done** when:
1. ✅ Code complete and peer-reviewed
2. ✅ Unit tests written (>75% coverage)
3. ✅ Integration tests pass
4. ✅ OpenAPI spec updated
5. ✅ Documentation updated (README, runbook)
6. ✅ Security checklist complete
7. ✅ Deployed to dev environment
8. ✅ Smoke tests pass
9. ✅ QA approved (manual testing)
10. ✅ Product owner accepted

### Code Review Checklist
- [ ] Code follows style guide (ESLint/Prettier)
- [ ] No hardcoded secrets or credentials
- [ ] Error handling comprehensive
- [ ] Logging added for debugging
- [ ] Performance considerations addressed
- [ ] Tests cover edge cases
- [ ] Documentation clear and complete

### Release Checklist
- [ ] All tests pass (unit, integration, E2E)
- [ ] Security scan clean (no high/critical vulnerabilities)
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured
- [ ] Stakeholders notified
- [ ] Release notes prepared

---

## Risk Management

### Identified Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Database performance degradation** | Medium | High | Early indexing, load testing, caching strategy |
| **Payment gateway downtime** | Low | High | Multi-provider support, retry logic, fallback |
| **Email delivery failures** | Medium | Medium | Queue with retries, multiple providers, monitoring |
| **Security breach** | Low | Critical | Security audits, encryption, RBAC, audit logs |
| **Third-party API rate limits** | Medium | Medium | Caching, request throttling, fallback data |
| **Scope creep** | High | Medium | Strict phase boundaries, change control process |
| **Key developer unavailable** | Medium | High | Documentation, pair programming, knowledge sharing |
| **Scalability issues under load** | Medium | High | Load testing early, horizontal scaling architecture |

### Contingency Plans
- **Critical bug in production:** Immediate rollback, hotfix branch, expedited review
- **Data loss scenario:** Automated backups (daily), point-in-time recovery tested monthly
- **Provider outage (AWS, MongoDB Atlas):** Multi-region deployment (future), status page monitoring

---

## Success Metrics

### Development Metrics
- **Velocity:** Story points completed per sprint
- **Code Quality:** Coverage >75%, zero critical bugs in production
- **Deployment Frequency:** Daily to dev, weekly to staging, bi-weekly to production
- **Lead Time:** Feature request to production < 2 weeks
- **Change Failure Rate:** <5% of deployments cause incidents

### Product Metrics
- **API Performance:** P95 latency <500ms, P99 <1s
- **Uptime:** >99.9% availability
- **Error Rate:** <1% of all requests
- **User Satisfaction:** NPS >50 (post-launch)
- **Adoption:** 10 tenants onboarded in first 3 months (post-launch)

### Business Metrics
- **Quotes Generated:** Track growth month-over-month
- **Conversion Rate:** Quote → Booking >30%
- **Revenue Per Tenant:** Track average revenue per tenant
- **Churn Rate:** <5% monthly churn (post-launch)

---

## Timeline Summary

| Phase | Duration | Start Week | End Week | Key Deliverables |
|-------|----------|------------|----------|------------------|
| **Phase 0: Foundations** | 1 week | Week 1 | Week 1 | Project structure, config, health endpoints |
| **Phase 1: Auth & Multi-Tenant** | 1-1.5 weeks | Week 1 | Week 2 | Login, RBAC, profile management |
| **Phase 2: Suppliers & Rate Lists** | 2 weeks | Week 3 | Week 4 | Supplier CRUD, rate list import/export |
| **Phase 3: Packages Catalog** | 1-1.5 weeks | Week 5 | Week 6 | Package publishing, browsing, filtering |
| **Phase 4: Queries & Assignment** | 1 week | Week 6 | Week 6 | Query intake, auto-assignment |
| **Phase 5: Itinerary Builder** | 1-1.5 weeks | Week 6 | Week 7 | Custom itineraries, auto-pricing |
| **Phase 6: Quotes, PDFs, Emails** | 2 weeks | Week 7 | Week 8 | Quote generation, PDF, email queue |
| **Phase 7: Bookings, Payments** | 2 weeks | Week 9 | Week 10 | Payment gateways, refunds, invoicing |
| **Phase 8: Customer Portal** | 1 week | Week 10 | Week 10 | Customer APIs, document upload, OCR |
| **Phase 9: Automation** | 1 week | Week 11 | Week 11 | SLA, follow-ups, campaigns |
| **Phase 10: Reviews** | 0.5 week | Week 11 | Week 11 | Reviews, ratings, testimonials |
| **Phase 11: Webhooks** | 1 week | Week 11 | Week 11 | Outbound webhooks, delivery logs |
| **Phase 12: Observability** | 1 week | Week 12 | Week 12 | Monitoring, dashboards, alerts |
| **Phase 13: Security & Compliance** | 1 week | Week 12 | Week 12 | GDPR, AV scanning, anti-abuse |
| **Phase 14: Performance** | Ongoing | Week 13 | Week 13 | Caching, indexing, load testing |
| **Phase 15: i18n & Locale** | 0.5 week | Week 13 | Week 13 | Multi-language, locale, tax regions |
| **Phase 16: API Conformance** | Ongoing | Week 14 | Week 14 | Idempotency, pagination, OpenAPI |
| **Hardening & QA** | 1 week | Week 14 | Week 14 | Bug fixes, final testing, prod prep |

**Total Estimated Duration:** 12-14 weeks

---

## Next Steps

1. **Review this plan** with stakeholders and adjust priorities/timelines
2. **Set up project tracking** (Jira, Linear, GitHub Projects)
3. **Initialize repository** with folder structure and CI/CD
4. **Start Phase 0** (foundations) immediately
5. **Weekly check-ins** to review progress and blockers
6. **Bi-weekly demos** to stakeholders

---

**Document Maintained By:** Development Team  
**Last Review Date:** November 23, 2025  
**Next Review Date:** December 7, 2025  
**Status:** Draft - Awaiting Approval
