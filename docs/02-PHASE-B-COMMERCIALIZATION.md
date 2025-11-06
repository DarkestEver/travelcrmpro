# Phase B: Commercialization (Agent & Supplier Self-Service)

**Timeline**: 8-10 weeks  
**Goal**: Enable agents to self-serve and suppliers to manage their inventory independently  
**Status**: 🔴 Not Started  
**Prerequisites**: Phase A completed

---

## Overview

Phase B transforms the system into a true B2B platform where agents can independently manage their customers and request quotes, while suppliers can manage their own rate sheets and respond to requests. This phase enables scaling without operator bottlenecks.

---

## Sub-Phase B.1: Agent Self-Service Portal (Week 1-3)

### Status: 🔴 Not Started

### Goals
- Create dedicated agent portal experience
- Enable agents to manage customers independently
- Allow agents to request quotes
- Implement agent dashboard

### Tasks

#### B.1.1 Agent Portal Infrastructure
- [ ] Create agent-specific route structure
- [ ] Implement agent-scoped data access middleware
- [ ] Create agent theme/branding configuration
- [ ] Set up agent subdomain routing (optional: agent.travelcrm.com)
- [ ] Create agent portal layout component

#### B.1.2 Agent Dashboard
- [ ] Create agent dashboard page
- [ ] Display agent KPIs:
  - Active bookings count
  - Pending quotes count
  - Credit balance / available credit
  - This month's revenue
- [ ] Show recent activity timeline
- [ ] Add quick action buttons (New Quote Request, View Customers)
- [ ] Display upcoming trips calendar

#### B.1.3 Agent Customer Management (Enhanced)
- [ ] Enhance customer list with advanced filters
- [ ] Add customer search (name, email, phone)
- [ ] Implement customer tags (VIP, Corporate, Leisure)
- [ ] Create customer import via CSV
- [ ] Add customer export functionality
- [ ] Implement customer notes section
- [ ] Add customer document upload (passport, visa)
- [ ] Create customer preference tracking (seat preference, dietary restrictions)

#### B.1.4 Quote Request Flow
- [ ] Create "New Quote Request" form:
  - Destination(s)
  - Travel dates (flexible/fixed)
  - Number of travelers (adults/children)
  - Budget range
  - Accommodation preference (3*/4*/5*)
  - Special requests (free text)
- [ ] Link request to customer
- [ ] Implement draft save functionality
- [ ] Add attachment upload (e.g., inspiration images)
- [ ] Create quote request submission
- [ ] Send notification to operator

**API Endpoints**:
```
POST   /api/v1/agents/quote-requests
GET    /api/v1/agents/quote-requests
GET    /api/v1/agents/quote-requests/:id
PUT    /api/v1/agents/quote-requests/:id
DELETE /api/v1/agents/quote-requests/:id
```

#### B.1.5 Quote Tracking & Response
- [ ] Create quote request list (agent view)
- [ ] Show quote request status (pending, quoted, accepted, rejected)
- [ ] Create quote received notification
- [ ] Implement quote detail page (agent view)
- [ ] Add "Accept Quote" button
- [ ] Add "Reject Quote" with reason
- [ ] Enable agent-operator messaging thread
- [ ] Add quote comparison view (if multiple quotes)

#### B.1.6 Agent Booking Management
- [ ] Create agent booking list
- [ ] Filter by status, date, customer
- [ ] Show booking detail (agent view)
- [ ] Display payment status
- [ ] Add payment submission (if self-pay enabled)
- [ ] Show voucher download
- [ ] Create booking history timeline

#### B.1.7 Agent Team Management
- [ ] Create sub-user management
- [ ] Define sub-user roles (Agent Admin, Agent User)
- [ ] Implement sub-user CRUD
- [ ] Set permissions (e.g., view-only vs full access)
- [ ] Add activity log per sub-user

### Deliverables
- ✅ Agent portal fully functional
- ✅ Agents can self-manage customers
- ✅ Quote request system working
- ✅ Agent booking tracking

### Acceptance Criteria
- [ ] Agent can log in and see personalized dashboard
- [ ] Agent can create/edit/delete customers
- [ ] Agent can import customers via CSV
- [ ] Agent can submit quote request with all required fields
- [ ] Agent receives notification when quote is ready
- [ ] Agent can view and accept/reject quotes
- [ ] Agent can see all their bookings with status
- [ ] Agent sub-users have appropriate access levels

---

## Sub-Phase B.2: Supplier Portal (Week 3-5)

### Status: 🔴 Not Started

### Goals
- Create supplier/country POC portal
- Enable suppliers to manage rate sheets
- Allow suppliers to respond to quote requests
- Implement supplier document management

### Tasks

#### B.2.1 Supplier Portal Infrastructure
- [ ] Create supplier-specific routes
- [ ] Implement supplier-scoped data access
- [ ] Create supplier portal layout
- [ ] Set up supplier branding
- [ ] Create supplier onboarding workflow

#### B.2.2 Supplier Dashboard
- [ ] Create supplier dashboard page
- [ ] Display supplier KPIs:
  - Pending inquiries
  - Active bookings
  - This month's confirmations
  - Revenue/commission
- [ ] Show incoming request notifications
- [ ] Display rate sheet expiry alerts
- [ ] Add quick actions (Upload Rates, Respond to Inquiry)

#### B.2.3 Rate Sheet Management (Enhanced)
- [ ] Enhance CSV upload with better validation
- [ ] Add rate sheet templates download
- [ ] Create rate sheet versioning
- [ ] Implement rate sheet approval workflow (optional)
- [ ] Add bulk rate update functionality
- [ ] Create rate sheet expiry notifications
- [ ] Implement rate sheet comparison view
- [ ] Add rate sheet duplicate functionality

**Enhanced Rate Sheet Fields**:
- Validity dates (from/to)
- Seasonality (peak, off-peak, shoulder)
- Minimum stay requirements
- Cancellation policies
- Blackout dates
- Room types / vehicle types
- Meal plans
- Inclusions/exclusions

#### B.2.4 Supplier Availability Management
- [ ] Create availability calendar UI
- [ ] Implement date range blocking (sold out)
- [ ] Add last-minute availability updates
- [ ] Create availability sync API
- [ ] Implement availability notifications to operators

#### B.2.5 Supplier Request Management
- [ ] Create incoming request list (supplier view)
- [ ] Show request details (destination, dates, pax)
- [ ] Implement "Respond to Request" form:
  - Availability confirmation
  - Proposed rates
  - Alternative suggestions
  - Notes
- [ ] Add request accept/decline
- [ ] Create supplier-operator messaging

**API Endpoints**:
```
GET    /api/v1/suppliers/requests
GET    /api/v1/suppliers/requests/:id
POST   /api/v1/suppliers/requests/:id/respond
PUT    /api/v1/suppliers/requests/:id/status
```

#### B.2.6 Supplier Document Management
- [ ] Create document repository
- [ ] Upload contracts (PDF)
- [ ] Upload certificates (insurance, licenses)
- [ ] Upload vendor agreements
- [ ] Implement document expiry tracking
- [ ] Add document version control
- [ ] Create document approval workflow

#### B.2.7 Supplier Booking Confirmations
- [ ] Create supplier booking list
- [ ] Show bookings requiring confirmation
- [ ] Implement "Confirm Booking" action
- [ ] Add voucher upload from supplier side
- [ ] Create booking modification request flow
- [ ] Implement cancellation notification

### Deliverables
- ✅ Supplier portal functional
- ✅ Suppliers can manage rates independently
- ✅ Suppliers can respond to requests
- ✅ Document management working

### Acceptance Criteria
- [ ] Supplier can log in and see dashboard
- [ ] Supplier can upload rate sheets via CSV
- [ ] Rate sheet validated with clear error messages
- [ ] Supplier can manage availability calendar
- [ ] Supplier receives notifications for new requests
- [ ] Supplier can respond with rates/availability
- [ ] Supplier can upload documents
- [ ] Supplier can confirm/modify bookings

---

## Sub-Phase B.3: Advanced Pricing Engine (Week 5-7)

### Status: 🔴 Not Started

### Goals
- Implement complex pricing rules
- Support multi-tier markup strategies
- Add seasonal pricing
- Implement promotional pricing

### Tasks

#### B.3.1 Pricing Rule Engine
- [ ] Create PricingRule schema
- [ ] Implement rule evaluation engine
- [ ] Support rule priority/ordering
- [ ] Create rule conflict resolution
- [ ] Add rule effective date ranges

**Rule Types**:
- Percentage markup
- Fixed amount markup
- Agent-specific rates
- Volume discounts (group size)
- Early bird discounts
- Last minute discounts
- Seasonal adjustments
- Package deals

#### B.3.2 Markup Management
- [ ] Create markup configuration UI
- [ ] Implement default markup rules
- [ ] Add agent-specific markup overrides
- [ ] Create destination-based markups
- [ ] Implement service-type markups (hotel vs activity)
- [ ] Add supplier-specific markups

#### B.3.3 Commission System
- [ ] Create commission rule schema
- [ ] Implement tiered commission (volume-based)
- [ ] Add agent commission tracking
- [ ] Create commission calculation service
- [ ] Generate commission reports
- [ ] Implement commission payout tracking

#### B.3.4 Seasonal Pricing
- [ ] Define seasons (peak, shoulder, off-peak)
- [ ] Create season configuration per destination
- [ ] Implement seasonal rate adjustments
- [ ] Add seasonal markup rules
- [ ] Create seasonal pricing visualization

#### B.3.5 Promotional Pricing
- [ ] Create promo code schema
- [ ] Implement promo code validation
- [ ] Support percentage/fixed discounts
- [ ] Add usage limits (per user, total)
- [ ] Create promo code expiry
- [ ] Generate promo code reports
- [ ] Add promo code management UI

#### B.3.6 Dynamic Pricing (Basic)
- [ ] Create pricing history tracking
- [ ] Implement demand-based suggestions (manual review)
- [ ] Add competitor price tracking (manual entry)
- [ ] Create pricing analytics dashboard

#### B.3.7 Tax Management
- [ ] Create tax rule configuration
- [ ] Implement GST/VAT calculation by region
- [ ] Support tax-inclusive vs tax-exclusive pricing
- [ ] Add tax exemption handling
- [ ] Generate tax reports
- [ ] Create tax invoice generation

**API Endpoints**:
```
POST   /api/v1/pricing/calculate
GET    /api/v1/pricing/rules
POST   /api/v1/pricing/rules
PUT    /api/v1/pricing/rules/:id
DELETE /api/v1/pricing/rules/:id
POST   /api/v1/pricing/promo-codes
GET    /api/v1/pricing/promo-codes/:code/validate
```

### Deliverables
- ✅ Flexible pricing rule engine
- ✅ Multi-tier markup system
- ✅ Promo codes working
- ✅ Tax calculation accurate

### Acceptance Criteria
- [ ] Admin can create custom pricing rules
- [ ] Rules evaluated in correct priority order
- [ ] Agent-specific pricing applied correctly
- [ ] Seasonal pricing adjusts quotes automatically
- [ ] Promo codes validate and apply discounts
- [ ] Commission calculated correctly
- [ ] Tax calculated based on region
- [ ] Pricing breakdown shows all components

---

## Sub-Phase B.4: Enhanced PDF & Email Templates (Week 7-8)

### Status: 🔴 Not Started

### Goals
- Create professional branded PDFs
- Implement customizable email templates
- Support multi-language documents
- Add template management system

### Tasks

#### B.4.1 PDF Template Engine
- [ ] Create template engine (Handlebars/EJS)
- [ ] Design professional quote PDF template
- [ ] Design booking confirmation PDF
- [ ] Design voucher PDF template
- [ ] Design invoice PDF template
- [ ] Add company logo and branding
- [ ] Implement PDF styling (CSS)
- [ ] Add QR code generation
- [ ] Support page breaks and multi-page

**PDF Template Features**:
- Header with logo and company info
- Dynamic content sections
- Table formatting for itinerary
- Price breakdown tables
- Terms and conditions
- Signature blocks
- Page numbers
- Footer with contact info

#### B.4.2 Template Management System
- [ ] Create template schema
- [ ] Implement template CRUD UI
- [ ] Support template variables ({{customer.name}})
- [ ] Add template preview functionality
- [ ] Implement template versioning
- [ ] Create default templates
- [ ] Allow template customization per agent (optional)

#### B.4.3 Email Template System
- [ ] Create email template schema
- [ ] Design welcome email template
- [ ] Design quote ready email
- [ ] Design booking confirmation email
- [ ] Design payment reminder email
- [ ] Design trip reminder email (X days before)
- [ ] Add email template editor UI
- [ ] Support HTML and plain text versions

**Email Template Variables**:
```
{{customer.name}}
{{agent.name}}
{{booking.reference}}
{{itinerary.title}}
{{quote.total}}
{{booking.travel_date}}
{{company.name}}
{{company.logo_url}}
```

#### B.4.4 Multi-language Support
- [ ] Set up i18n framework (react-i18next)
- [ ] Create translation files (en, es, fr, ar, zh, hi)
- [ ] Translate UI strings
- [ ] Implement language switcher
- [ ] Add language preference per user
- [ ] Generate PDFs in selected language
- [ ] Send emails in recipient's language
- [ ] Support RTL languages (Arabic, Hebrew)

#### B.4.5 Document Branding
- [ ] Create branding configuration UI
- [ ] Upload company logo
- [ ] Set brand colors (primary, secondary)
- [ ] Configure fonts
- [ ] Add company contact info
- [ ] Set terms and conditions text
- [ ] Apply branding to all PDFs

#### B.4.6 Bulk Document Generation
- [ ] Implement batch PDF generation
- [ ] Create bulk email sending
- [ ] Add job queue for large batches
- [ ] Show generation progress
- [ ] Create bulk download (ZIP)

### Deliverables
- ✅ Professional branded PDFs
- ✅ Customizable templates
- ✅ Multi-language support
- ✅ Template management UI

### Acceptance Criteria
- [ ] Quote PDFs look professional with branding
- [ ] Vouchers include all necessary information
- [ ] Invoices comply with tax requirements
- [ ] Templates editable via UI
- [ ] Email templates include dynamic content
- [ ] PDFs generated in customer's language
- [ ] Bulk operations complete without timeout
- [ ] QR codes scannable on vouchers

---

## Sub-Phase B.5: Workflow Automation & Notifications (Week 8-9)

### Status: 🔴 Not Started

### Goals
- Automate routine operations
- Implement approval workflows
- Enhance notification system
- Create scheduled jobs

### Tasks

#### B.5.1 Approval Workflow Engine
- [ ] Create workflow schema
- [ ] Implement approval chain logic
- [ ] Create approval request notification
- [ ] Build approval UI (approve/reject)
- [ ] Add delegation support
- [ ] Track approval history

**Workflows to Implement**:
- Quote discount approval (if >X% discount)
- Refund approval
- Agent credit limit increase
- Supplier onboarding approval
- Booking cancellation approval

#### B.5.2 Enhanced Notification System
- [ ] Create notification preference UI
- [ ] Implement multi-channel delivery (email + in-app + SMS)
- [ ] Add notification batching (digest mode)
- [ ] Create notification templates
- [ ] Implement notification priority levels
- [ ] Add notification history

**Notification Triggers**:
- Quote request received
- Quote ready
- Quote accepted/rejected
- Booking confirmed
- Payment received
- Payment reminder (due soon)
- Trip reminder (X days before)
- Supplier response received
- Rate sheet expiring soon
- Document expiring soon

#### B.5.3 Scheduled Job System
- [ ] Set up cron job scheduler (node-cron or BullMQ)
- [ ] Create job monitoring dashboard
- [ ] Implement failed job retry logic

**Jobs to Create**:
- **Daily**: Send payment reminders for upcoming due dates
- **Daily**: Check and alert expiring rate sheets
- **Daily**: Send trip reminders (7 days, 3 days, 1 day before)
- **Weekly**: Generate and email sales reports
- **Weekly**: Send abandoned quote follow-ups
- **Monthly**: Generate commission reports
- **Monthly**: Archive old bookings

#### B.5.4 Automated Follow-ups
- [ ] Create follow-up rule engine
- [ ] Implement abandoned quote recovery (send email after X days)
- [ ] Add post-trip feedback request (send after trip end date)
- [ ] Create booking payment reminders
- [ ] Implement supplier response reminders

#### B.5.5 Task Management System
- [ ] Create Task schema
- [ ] Implement task assignment
- [ ] Add task due dates
- [ ] Create task list UI (Kanban board)
- [ ] Add task comments
- [ ] Implement task templates (e.g., pre-departure checklist)
- [ ] Create task notifications

#### B.5.6 SLA Tracking (Basic)
- [ ] Define SLA rules (e.g., quote response within 24 hours)
- [ ] Track SLA compliance
- [ ] Create SLA breach alerts
- [ ] Generate SLA reports

### Deliverables
- ✅ Approval workflows functional
- ✅ Automated notifications working
- ✅ Scheduled jobs running
- ✅ Task management system

### Acceptance Criteria
- [ ] Discount requests trigger approval workflow
- [ ] Approvers receive notifications
- [ ] Users receive notifications via preferred channels
- [ ] Digest emails sent daily with batched notifications
- [ ] Payment reminders sent automatically
- [ ] Trip reminders sent at configured intervals
- [ ] Abandoned quotes followed up automatically
- [ ] Tasks assignable and trackable
- [ ] SLA breaches alert operators

---

## Sub-Phase B.6: Bulk Operations & Data Management (Week 9-10)

### Status: 🔴 Not Started

### Goals
- Enable bulk data operations
- Implement import/export functionality
- Add data validation and cleanup
- Create backup and restore

### Tasks

#### B.6.1 Bulk Import System
- [ ] Create import template generator
- [ ] Implement CSV parsing library
- [ ] Build validation engine for imports
- [ ] Create import preview (dry-run)
- [ ] Implement batch processing for large files
- [ ] Add error reporting with line numbers
- [ ] Create import history log

**Import Types**:
- Customers (agent-scoped)
- Suppliers
- Rate sheets
- Sites/Activities
- Bookings (bulk updates)

#### B.6.2 Bulk Export System
- [ ] Implement export to CSV
- [ ] Implement export to Excel
- [ ] Add custom field selection
- [ ] Create filtered exports
- [ ] Support large dataset exports (streaming)
- [ ] Add scheduled exports
- [ ] Email export file when ready

**Export Types**:
- Customer list
- Booking reports
- Financial reports
- Agent performance
- Supplier performance

#### B.6.3 Bulk Operations UI
- [ ] Create bulk action toolbar
- [ ] Implement multi-select functionality
- [ ] Add bulk edit (e.g., change status for multiple bookings)
- [ ] Add bulk delete with confirmation
- [ ] Create bulk email sending
- [ ] Show bulk operation progress

#### B.6.4 Data Validation & Cleanup
- [ ] Create data validation rules
- [ ] Implement duplicate detection
- [ ] Add data quality reports
- [ ] Create cleanup utilities (remove orphaned records)
- [ ] Implement data normalization (e.g., phone numbers)

#### B.6.5 Backup & Restore
- [ ] Implement automated daily database backups
- [ ] Set up backup retention policy
- [ ] Create manual backup trigger
- [ ] Implement point-in-time restore
- [ ] Test disaster recovery procedure
- [ ] Document backup/restore process

#### B.6.6 GDPR Compliance Tools
- [ ] Implement "export my data" for customers
- [ ] Create "delete my data" with audit log
- [ ] Add consent tracking
- [ ] Implement data retention policies
- [ ] Create data processing agreements template
- [ ] Add cookie consent banner

### Deliverables
- ✅ Bulk import/export working
- ✅ Data validation robust
- ✅ Backup system automated
- ✅ GDPR tools functional

### Acceptance Criteria
- [ ] Admin can bulk import customers via CSV
- [ ] Import validates data and shows errors
- [ ] Users can export data in CSV/Excel
- [ ] Bulk operations work on 1000+ records
- [ ] Duplicate detection prevents data quality issues
- [ ] Daily backups running successfully
- [ ] Restore tested and documented
- [ ] GDPR data export completes within 24 hours
- [ ] Data deletion removes all PII

---

## Phase B Completion Checklist

### Agent Portal ✅
- [ ] Agent dashboard functional
- [ ] Agents can manage customers
- [ ] Quote request flow working
- [ ] Agent booking tracking enabled
- [ ] Sub-user management functional

### Supplier Portal ✅
- [ ] Supplier dashboard functional
- [ ] Rate sheet management enhanced
- [ ] Availability calendar working
- [ ] Supplier can respond to requests
- [ ] Document management functional

### Pricing ✅
- [ ] Advanced pricing rules working
- [ ] Commission system functional
- [ ] Seasonal pricing active
- [ ] Promo codes working
- [ ] Tax calculation accurate

### Templates ✅
- [ ] Professional PDFs generated
- [ ] Email templates customizable
- [ ] Multi-language support working
- [ ] Branding applied consistently

### Automation ✅
- [ ] Approval workflows functional
- [ ] Notifications sent multi-channel
- [ ] Scheduled jobs running
- [ ] Task management working
- [ ] SLA tracking active

### Data Management ✅
- [ ] Bulk import working
- [ ] Bulk export working
- [ ] Data validation robust
- [ ] Backups automated
- [ ] GDPR compliance tools ready

---

## Success Metrics for Phase B

1. **Agent Adoption**: 80% of agents use self-service portal
2. **Supplier Efficiency**: 90% of rate updates done by suppliers
3. **Quote Turnaround**: Average quote generation time <4 hours
4. **Automation**: 60% of routine tasks automated
5. **Data Quality**: <2% duplicate/invalid records

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent adoption resistance | High | Training program, phased rollout, support resources |
| Supplier onboarding delays | Medium | Simplified onboarding flow, dedicated support |
| Complex pricing rules performance | Medium | Caching, query optimization, rule simplification |
| Template customization complexity | Low | Provide good defaults, limit customization options |
| Bulk operation timeouts | Medium | Background jobs, progress indicators, chunking |

---

## Next Steps After Phase B

Once Phase B is complete:
1. **Launch self-service portals** to pilot group of agents and suppliers
2. **Gather feedback** and iterate
3. **Scale to all users**
4. **Begin Phase C** with AI features and advanced integrations

---

**Last Updated**: Not started  
**Estimated Completion**: 10 weeks from start  
**Dependencies**: Phase A completed and deployed
