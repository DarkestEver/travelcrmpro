# Phase A: MVP (Core Foundation)

**Timeline**: 8-12 weeks  
**Goal**: Launch a working system with core features for operators to create itineraries and manage quotes/bookings  
**Status**: 🔴 Not Started

---

## Overview

Phase A establishes the foundation of the Travel CRM system. At the end of this phase, operators can manage the core workflow: create itineraries, generate quotes, and process bookings with basic agent interactions.

---

## Sub-Phase A.1: Project Setup & Infrastructure (Week 1-2)

### Status: 🔴 Not Started

### Goals
- Set up development environment
- Configure CI/CD pipeline
- Establish infrastructure foundation
- Set up monitoring and logging

### Tasks

#### A.1.1 Repository & Development Environment
- [ ] Initialize Git repository with `.gitignore`
- [ ] Set up monorepo structure (frontend + backend)
- [ ] Configure EditorConfig and Prettier
- [ ] Set up ESLint for TypeScript
- [ ] Create Docker Compose for local development
- [ ] Set up environment variable management (.env files)

#### A.1.2 Frontend Setup (React + Vite)
- [ ] Initialize Vite project with React + TypeScript
- [ ] Configure Vite build optimization
- [ ] Set up Tailwind CSS
- [ ] Install React Router v6
- [ ] Configure path aliases (@/ imports)
- [ ] Set up React Query (TanStack Query) for API calls
- [ ] Install and configure Zustand for state management
- [ ] Set up React Hook Form + Zod for form validation
- [ ] Configure build-time code splitting

**Tech Stack**:
```json
{
  "framework": "React 18",
  "bundler": "Vite 5",
  "styling": "Tailwind CSS 3",
  "routing": "React Router 6",
  "state": "Zustand",
  "forms": "React Hook Form + Zod",
  "api": "TanStack Query (React Query)",
  "icons": "Lucide React"
}
```

#### A.1.3 Backend Setup (Node.js + NestJS)
- [ ] Initialize NestJS project
- [ ] Configure TypeScript strict mode
- [ ] Set up module structure (auth, agents, itineraries, etc.)
- [ ] Install class-validator and class-transformer
- [ ] Configure Swagger/OpenAPI documentation
- [ ] Set up global exception filters
- [ ] Configure CORS settings
- [ ] Set up request logging middleware

**Tech Stack**:
```json
{
  "framework": "NestJS 10",
  "runtime": "Node.js 20 LTS",
  "language": "TypeScript 5",
  "validation": "class-validator",
  "documentation": "Swagger/OpenAPI"
}
```

#### A.1.4 Database Setup
- [ ] Set up MongoDB instance (local + cloud)
- [ ] Install Mongoose ODM
- [ ] Create base schemas with timestamps
- [ ] Set up database indexes strategy
- [ ] Configure connection pooling
- [ ] Set up MongoDB migrations tool
- [ ] Optional: Set up PostgreSQL for financial data

#### A.1.5 Redis & Queue Setup
- [ ] Set up Redis instance
- [ ] Install BullMQ for job queues
- [ ] Configure job processors (email, PDF generation)
- [ ] Set up queue monitoring dashboard
- [ ] Configure retry strategies

#### A.1.6 File Storage Setup
- [ ] Choose storage provider (AWS S3 / MinIO)
- [ ] Configure S3 buckets (documents, images, pdfs)
- [ ] Set up presigned URL generation
- [ ] Configure file upload size limits
- [ ] Set up CDN for static assets

#### A.1.7 CI/CD Pipeline
- [ ] Create GitHub Actions workflow
- [ ] Configure automated testing on PR
- [ ] Set up Docker image building
- [ ] Configure staging deployment
- [ ] Set up production deployment (manual approval)
- [ ] Configure deployment secrets management

#### A.1.8 Monitoring & Logging
- [ ] Set up Sentry for error tracking
- [ ] Configure application logging (Winston/Pino)
- [ ] Set up log aggregation (optional: ELK stack)
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring (optional: UptimeRobot)
- [ ] Create basic Prometheus metrics

#### A.1.9 Security Foundation
- [ ] Configure Helmet.js for security headers
- [ ] Set up rate limiting
- [ ] Configure HTTPS/TLS
- [ ] Set up secrets management (Vault or cloud KMS)
- [ ] Enable audit logging for critical operations

### Deliverables
- ✅ Running development environment (Docker Compose)
- ✅ CI/CD pipeline deploying to staging
- ✅ Monitoring dashboards configured
- ✅ Empty frontend and backend with proper structure

### Acceptance Criteria
- [ ] `npm run dev` starts both frontend and backend
- [ ] Frontend accessible at `http://localhost:5173`
- [ ] Backend API accessible at `http://localhost:3000/api`
- [ ] Swagger docs at `http://localhost:3000/api/docs`
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] S3 upload test successful
- [ ] CI/CD pipeline green on test commit
- [ ] Sentry receiving test errors

---

## Sub-Phase A.2: Authentication & Authorization (Week 2-3)

### Status: 🔴 Not Started

### Goals
- Implement secure authentication system
- Set up SSO integration
- Implement RBAC (Role-Based Access Control)
- Create user management

### Tasks

#### A.2.1 Authentication Backend
- [ ] Install Passport.js and strategies
- [ ] Implement JWT authentication
- [ ] Create auth module in NestJS
- [ ] Implement login endpoint
- [ ] Implement token refresh endpoint
- [ ] Implement logout endpoint
- [ ] Set up password hashing (bcrypt)
- [ ] Create email/password validation

#### A.2.2 SSO Integration
- [ ] Install OAuth2/OpenID Connect library
- [ ] Configure OAuth2 strategy (Google, Microsoft)
- [ ] Implement SSO callback handler
- [ ] Create SSO user provisioning logic
- [ ] Add SSO configuration in admin panel
- [ ] Test SSO flow

#### A.2.3 Role-Based Access Control
- [ ] Define user roles enum (SuperAdmin, Operator, Agent, Supplier, Auditor)
- [ ] Create permissions system
- [ ] Implement role guards
- [ ] Create resource-scoped ownership checks
- [ ] Implement permission decorators
- [ ] Create RBAC testing utilities

#### A.2.4 User Management Backend
- [ ] Create User schema/model
- [ ] Implement user CRUD endpoints
- [ ] Create user profile endpoint
- [ ] Implement password reset flow
- [ ] Create email verification flow
- [ ] Implement MFA setup (TOTP)
- [ ] Create session management

#### A.2.5 Authentication Frontend
- [ ] Create login page UI
- [ ] Implement login form with validation
- [ ] Create SSO login buttons
- [ ] Implement JWT token storage
- [ ] Create auth context/store
- [ ] Implement protected route wrapper
- [ ] Create password reset UI
- [ ] Implement email verification UI

#### A.2.6 User Management Frontend
- [ ] Create user profile page
- [ ] Implement profile edit form
- [ ] Create password change form
- [ ] Implement MFA setup UI
- [ ] Create user list (admin only)
- [ ] Create user create/edit modal

### Deliverables
- ✅ Working authentication system
- ✅ SSO integration functional
- ✅ RBAC enforced on all endpoints
- ✅ User management UI

### Acceptance Criteria
- [ ] Users can register and log in with email/password
- [ ] Users can log in via SSO (Google/Microsoft)
- [ ] JWT tokens expire and refresh correctly
- [ ] Protected routes redirect to login
- [ ] Role-based permissions enforced (e.g., Agent can't access admin routes)
- [ ] Password reset emails sent successfully
- [ ] MFA works for admin users
- [ ] Session logout works across all tabs

---

## Sub-Phase A.3: Core Data Models & API (Week 3-5)

### Status: 🔴 Not Started

### Goals
- Implement core data models
- Create CRUD APIs for core entities
- Set up data validation
- Implement audit logging

### Tasks

#### A.3.1 Agent Management
- [ ] Create Agent schema (company, contact, credit limit, commission)
- [ ] Implement Agent CRUD endpoints
- [ ] Create Agent list with filtering/sorting
- [ ] Implement Agent search
- [ ] Create Agent profile page UI
- [ ] Implement Agent form validation
- [ ] Add document upload for agents

**API Endpoints**:
```
POST   /api/v1/agents
GET    /api/v1/agents
GET    /api/v1/agents/:id
PUT    /api/v1/agents/:id
DELETE /api/v1/agents/:id
GET    /api/v1/agents/:id/customers
```

#### A.3.2 Agent Customers
- [ ] Create AgentCustomer schema
- [ ] Implement Customer CRUD endpoints
- [ ] Enforce agent-scoped access (agents see only their customers)
- [ ] Create Customer list UI
- [ ] Create Customer detail page
- [ ] Implement Customer form
- [ ] Add passport info fields (optional)

**API Endpoints**:
```
POST   /api/v1/agents/:agentId/customers
GET    /api/v1/agents/:agentId/customers
GET    /api/v1/customers/:id
PUT    /api/v1/customers/:id
DELETE /api/v1/customers/:id
```

#### A.3.3 Supplier Management
- [ ] Create Supplier schema (country, company, POC contacts)
- [ ] Implement Supplier CRUD endpoints
- [ ] Create Supplier list UI
- [ ] Create Supplier detail page
- [ ] Implement Supplier form
- [ ] Add contract document upload

**API Endpoints**:
```
POST   /api/v1/suppliers
GET    /api/v1/suppliers
GET    /api/v1/suppliers/:id
PUT    /api/v1/suppliers/:id
DELETE /api/v1/suppliers/:id
```

#### A.3.4 Rate Sheets (Basic)
- [ ] Create RateSheet schema
- [ ] Create RateLine embedded schema
- [ ] Implement CSV upload endpoint
- [ ] Implement CSV parsing and validation
- [ ] Create rate sheet list UI
- [ ] Create rate sheet upload UI
- [ ] Show validation errors to user

**API Endpoints**:
```
POST   /api/v1/suppliers/:id/rates/upload
GET    /api/v1/suppliers/:id/rates
GET    /api/v1/rates/:id
DELETE /api/v1/rates/:id
```

#### A.3.5 Activity & Site Catalog
- [ ] Create Site/Activity schema
- [ ] Implement Site CRUD endpoints
- [ ] Create Site catalog UI
- [ ] Add image upload for sites
- [ ] Implement basic search (name, location)
- [ ] Add categories and tags

**API Endpoints**:
```
POST   /api/v1/catalog/sites
GET    /api/v1/catalog/sites
GET    /api/v1/catalog/sites/:id
PUT    /api/v1/catalog/sites/:id
DELETE /api/v1/catalog/sites/:id
```

#### A.3.6 Audit Logging
- [ ] Create AuditLog schema
- [ ] Implement audit log decorator/interceptor
- [ ] Log all create/update/delete operations
- [ ] Log authentication events
- [ ] Create audit log viewer UI (admin only)

### Deliverables
- ✅ All core models created with validation
- ✅ CRUD APIs functional
- ✅ Admin UI for managing core data
- ✅ Audit logs recording all actions

### Acceptance Criteria
- [ ] Admin can create/edit/delete agents
- [ ] Agents can create/edit/delete their customers
- [ ] Agents cannot see other agents' customers
- [ ] Supplier data can be managed
- [ ] Rate sheets can be uploaded via CSV
- [ ] Invalid CSV shows clear errors
- [ ] Site catalog populated with sample data
- [ ] All critical actions logged in audit_logs collection

---

## Sub-Phase A.4: Itinerary Builder (Week 5-7)

### Status: 🔴 Not Started

### Goals
- Build itinerary creation and management system
- Implement day-by-day itinerary structure
- Create itinerary components (stay, transfer, activity)
- Build itinerary UI

### Tasks

#### A.4.1 Itinerary Data Model
- [ ] Create Itinerary schema
- [ ] Create Day embedded schema
- [ ] Create Component schemas (Stay, Transfer, Activity, Meal)
- [ ] Add image and document attachments
- [ ] Implement versioning logic (optional for MVP)
- [ ] Add status field (draft, active, archived)

**Itinerary Schema Structure**:
```typescript
{
  title: string
  country: string
  state: string
  city: string
  days: [
    {
      dayNo: number
      title: string
      components: [
        {
          type: 'stay' | 'transfer' | 'activity' | 'meal'
          title: string
          description: string
          time: string
          supplier_id: ObjectId
          cost: number
          // ... type-specific fields
        }
      ]
    }
  ]
  estimated_cost: number
  images: string[]
  status: string
  createdBy: ObjectId
  createdAt: Date
}
```

#### A.4.2 Itinerary API
- [ ] Implement Itinerary CRUD endpoints
- [ ] Create endpoint to add/remove days
- [ ] Create endpoint to add/remove/reorder components
- [ ] Implement itinerary duplication
- [ ] Create cost calculation logic
- [ ] Add search and filter endpoints

**API Endpoints**:
```
POST   /api/v1/itineraries
GET    /api/v1/itineraries
GET    /api/v1/itineraries/:id
PUT    /api/v1/itineraries/:id
DELETE /api/v1/itineraries/:id
POST   /api/v1/itineraries/:id/days
DELETE /api/v1/itineraries/:id/days/:dayNo
POST   /api/v1/itineraries/:id/days/:dayNo/components
PUT    /api/v1/itineraries/:id/days/:dayNo/components/:compId
DELETE /api/v1/itineraries/:id/days/:dayNo/components/:compId
POST   /api/v1/itineraries/:id/duplicate
```

#### A.4.3 Itinerary Builder UI - List & Detail
- [ ] Create itinerary list page with cards
- [ ] Add filters (country, status, created date)
- [ ] Create "New Itinerary" button and modal
- [ ] Implement itinerary basic info form
- [ ] Create itinerary detail page layout
- [ ] Show itinerary header (title, location, status)

#### A.4.4 Itinerary Builder UI - Day Management
- [ ] Create day list/timeline view
- [ ] Add "Add Day" button
- [ ] Implement day reordering (drag-drop or arrows)
- [ ] Create day edit modal (title, notes)
- [ ] Add day delete with confirmation

#### A.4.5 Itinerary Builder UI - Component Management
- [ ] Create component list within each day
- [ ] Add "Add Component" dropdown (Stay, Transfer, Activity, Meal)
- [ ] Create Stay component form
- [ ] Create Transfer component form
- [ ] Create Activity component form
- [ ] Create Meal component form
- [ ] Implement component reordering within day
- [ ] Add component delete with confirmation

#### A.4.6 Itinerary Builder UI - Enhancements
- [ ] Add image upload for itinerary
- [ ] Implement cost summary display
- [ ] Add supplier selection dropdown (linked to suppliers)
- [ ] Create preview mode (read-only view)
- [ ] Add "Duplicate Itinerary" action
- [ ] Implement autosave (draft mode)

### Deliverables
- ✅ Complete itinerary builder backend
- ✅ Functional itinerary UI
- ✅ Operators can create complex multi-day itineraries

### Acceptance Criteria
- [ ] Operator can create a new itinerary with title and location
- [ ] Operator can add/remove/reorder days
- [ ] Operator can add components (hotel, transfer, activity) to each day
- [ ] Each component has title, description, time, supplier, cost
- [ ] Total cost calculated and displayed
- [ ] Images can be uploaded to itinerary
- [ ] Itinerary can be duplicated
- [ ] Itinerary list shows all created itineraries with filters

---

## Sub-Phase A.5: Quote Generation & Management (Week 7-9)

### Status: 🔴 Not Started

### Goals
- Generate quotes from itineraries
- Apply pricing rules and markups
- Create quote management workflow
- Implement basic PDF generation

### Tasks

#### A.5.1 Pricing Engine (Basic)
- [ ] Create pricing calculation service
- [ ] Implement base price calculation from itinerary
- [ ] Apply percentage markup
- [ ] Apply fixed markup
- [ ] Calculate agent-specific discounts
- [ ] Calculate final price
- [ ] Add tax calculation (basic)

**Pricing Logic**:
```
base_cost = sum(all itinerary component costs)
markup = base_cost * markup_percentage + fixed_markup
agent_discount = (base_cost + markup) * agent_discount_percentage
final_price = base_cost + markup - agent_discount + taxes
```

#### A.5.2 Quote Data Model
- [ ] Create Quote schema
- [ ] Link to Itinerary, Agent, AgentCustomer
- [ ] Add pricing breakdown fields
- [ ] Add validity period
- [ ] Add status (draft, sent, accepted, rejected, expired)
- [ ] Add supplier offer references

**Quote Schema**:
```typescript
{
  itinerary_id: ObjectId
  agent_id: ObjectId
  agent_customer_id: ObjectId
  base_cost: number
  markup: number
  discount: number
  taxes: number
  total_price: number
  currency: string
  valid_until: Date
  status: string
  pdf_url: string
  createdBy: ObjectId
  createdAt: Date
}
```

#### A.5.3 Quote API
- [ ] Implement create quote endpoint
- [ ] Implement get quotes endpoint (with filters)
- [ ] Implement get quote by ID
- [ ] Implement update quote status
- [ ] Implement send quote email endpoint
- [ ] Create quote PDF generation job

**API Endpoints**:
```
POST   /api/v1/quotes
GET    /api/v1/quotes
GET    /api/v1/quotes/:id
PUT    /api/v1/quotes/:id
POST   /api/v1/quotes/:id/send
PUT    /api/v1/quotes/:id/status
```

#### A.5.4 PDF Generation (Basic)
- [ ] Choose PDF library (Puppeteer or PDFKit)
- [ ] Create basic quote PDF template (HTML)
- [ ] Implement PDF generation service
- [ ] Generate PDF on quote creation
- [ ] Upload PDF to S3
- [ ] Store PDF URL in quote document

**PDF Contents**:
- Company logo and branding
- Quote number and date
- Agent and customer details
- Itinerary summary (day-by-day)
- Price breakdown
- Terms and conditions
- Validity date

#### A.5.5 Email Service
- [ ] Set up SendGrid/Amazon SES
- [ ] Create email templates
- [ ] Implement email service
- [ ] Create "send quote email" function
- [ ] Include PDF attachment
- [ ] Add email tracking (optional: sent, opened)

#### A.5.6 Quote UI - Creation
- [ ] Create "Generate Quote" button on itinerary page
- [ ] Create quote creation form
  - Select agent
  - Select customer
  - Set markup percentage
  - Set validity period
- [ ] Show pricing preview
- [ ] Create quote confirmation

#### A.5.7 Quote UI - List & Detail
- [ ] Create quote list page
- [ ] Add filters (agent, status, date range)
- [ ] Create quote detail page
- [ ] Show itinerary details
- [ ] Show pricing breakdown
- [ ] Display PDF preview/download
- [ ] Add "Send Email" button
- [ ] Show email sent status

### Deliverables
- ✅ Quote generation from itineraries
- ✅ PDF quote documents
- ✅ Email sending functional
- ✅ Quote management UI

### Acceptance Criteria
- [ ] Operator can generate quote from itinerary
- [ ] Quote includes pricing breakdown
- [ ] PDF generated with company branding
- [ ] Quote email sent to agent with PDF attachment
- [ ] Agent receives email with downloadable PDF
- [ ] Quote list shows all quotes with status
- [ ] Quote detail shows full itinerary and pricing

---

## Sub-Phase A.6: Booking Management (Week 9-10)

### Status: 🔴 Not Started

### Goals
- Convert quotes to bookings
- Handle booking status workflow
- Implement basic payment tracking
- Generate vouchers

### Tasks

#### A.6.1 Booking Data Model
- [ ] Create Booking schema
- [ ] Link to Quote, Agent, Customer
- [ ] Add booking status (pending, confirmed, cancelled)
- [ ] Add payment tracking fields
- [ ] Add supplier confirmation fields
- [ ] Add voucher URL field

**Booking Schema**:
```typescript
{
  quote_id: ObjectId
  agent_id: ObjectId
  customer_id: ObjectId
  total_amount: number
  paid_amount: number
  payment_status: 'pending' | 'partial' | 'paid'
  payment_records: [
    {
      amount: number
      method: string
      transaction_id: string
      date: Date
    }
  ]
  booking_status: 'pending' | 'confirmed' | 'cancelled'
  supplier_confirmations: Map
  voucher_url: string
  createdAt: Date
  updatedAt: Date
}
```

#### A.6.2 Booking API
- [ ] Implement create booking endpoint (from quote)
- [ ] Implement get bookings endpoint
- [ ] Implement get booking by ID
- [ ] Implement update booking status
- [ ] Implement add payment endpoint
- [ ] Implement cancel booking endpoint
- [ ] Create voucher generation job

**API Endpoints**:
```
POST   /api/v1/bookings (from quote_id)
GET    /api/v1/bookings
GET    /api/v1/bookings/:id
PUT    /api/v1/bookings/:id/status
POST   /api/v1/bookings/:id/payments
PUT    /api/v1/bookings/:id/cancel
POST   /api/v1/bookings/:id/voucher
```

#### A.6.3 Payment Integration (Basic)
- [ ] Set up Stripe account
- [ ] Install Stripe SDK
- [ ] Create payment intent endpoint
- [ ] Implement webhook handler for payment confirmation
- [ ] Update booking payment status on webhook
- [ ] Add payment record to booking

#### A.6.4 Voucher Generation (Basic)
- [ ] Create voucher PDF template
- [ ] Implement voucher generation service
- [ ] Generate voucher on booking confirmation
- [ ] Upload voucher to S3
- [ ] Store voucher URL in booking

**Voucher Contents**:
- Booking confirmation number
- Customer details
- Itinerary summary
- Supplier contact information
- QR code (optional)
- Emergency contacts

#### A.6.5 Booking UI - List & Detail
- [ ] Create booking list page
- [ ] Add filters (status, date, agent)
- [ ] Create booking detail page
- [ ] Show booking summary
- [ ] Show payment history
- [ ] Show voucher download button
- [ ] Add status change actions

#### A.6.6 Booking UI - Payment & Actions
- [ ] Create "Confirm Booking" button on quote detail
- [ ] Show payment amount input
- [ ] Integrate Stripe payment form
- [ ] Show payment success/failure message
- [ ] Add "Cancel Booking" with confirmation dialog
- [ ] Show supplier confirmation status

### Deliverables
- ✅ Booking creation from quotes
- ✅ Payment integration working
- ✅ Voucher generation
- ✅ Booking management UI

### Acceptance Criteria
- [ ] Quote can be converted to booking
- [ ] Booking has status workflow (pending → confirmed)
- [ ] Payment can be recorded (manual or via Stripe)
- [ ] Stripe webhook updates booking status
- [ ] Voucher PDF generated on confirmation
- [ ] Voucher downloadable from booking detail
- [ ] Booking list shows all bookings with filters
- [ ] Booking can be cancelled

---

## Sub-Phase A.7: Admin Panel & Basic UI (Week 10-11)

### Status: 🔴 Not Started

### Goals
- Create admin dashboard
- Build user management interface
- Create system settings
- Implement role-based navigation

### Tasks

#### A.7.1 Dashboard Layout
- [ ] Create main layout component with sidebar
- [ ] Implement top navigation bar
- [ ] Create responsive mobile menu
- [ ] Add user profile dropdown
- [ ] Create breadcrumb navigation
- [ ] Implement role-based sidebar items

#### A.7.2 Admin Dashboard
- [ ] Create dashboard page
- [ ] Add KPI cards (total agents, bookings, revenue)
- [ ] Show recent quotes list
- [ ] Show pending bookings
- [ ] Add quick actions (create itinerary, view reports)
- [ ] Show system health status (optional)

#### A.7.3 User Management UI
- [ ] Create user list page (admin only)
- [ ] Add user filters (role, status)
- [ ] Create user create/edit modal
- [ ] Implement role assignment
- [ ] Add user activation/deactivation
- [ ] Show last login date

#### A.7.4 System Settings
- [ ] Create settings page
- [ ] Add company profile section (name, logo, address)
- [ ] Add email configuration (SMTP settings)
- [ ] Add payment gateway configuration
- [ ] Add markup default settings
- [ ] Implement settings save API

#### A.7.5 Notifications UI
- [ ] Create notification bell icon
- [ ] Implement notification dropdown
- [ ] Show recent notifications
- [ ] Mark as read functionality
- [ ] Link notifications to relevant pages

#### A.7.6 UI Polish
- [ ] Add loading spinners for async operations
- [ ] Implement error boundaries
- [ ] Add toast notifications for success/error
- [ ] Create empty states for lists
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement form field validation messages

### Deliverables
- ✅ Admin dashboard functional
- ✅ User management UI complete
- ✅ System settings configurable
- ✅ Polished UI with good UX

### Acceptance Criteria
- [ ] Dashboard shows key metrics
- [ ] Admin can manage users and roles
- [ ] Navigation adapts based on user role
- [ ] System settings can be configured
- [ ] Notifications display and link correctly
- [ ] UI is responsive on mobile/tablet/desktop
- [ ] Loading and error states handled gracefully

---

## Sub-Phase A.8: Testing & Bug Fixes (Week 11-12)

### Status: 🔴 Not Started

### Goals
- Write comprehensive tests
- Fix identified bugs
- Perform security audit
- Optimize performance

### Tasks

#### A.8.1 Backend Testing
- [ ] Write unit tests for services (>80% coverage)
- [ ] Write integration tests for APIs
- [ ] Test authentication and authorization
- [ ] Test pricing engine calculations
- [ ] Test PDF generation
- [ ] Test email sending
- [ ] Test payment webhook handling

#### A.8.2 Frontend Testing
- [ ] Write component unit tests
- [ ] Write integration tests for forms
- [ ] Test authentication flows
- [ ] Test protected routes
- [ ] Write E2E tests for critical flows:
  - User login
  - Create itinerary → generate quote → create booking
  - Upload rate sheet
  - Agent creating customer

#### A.8.3 Security Testing
- [ ] Run OWASP dependency check
- [ ] Test for SQL/NoSQL injection
- [ ] Test authentication bypass attempts
- [ ] Test authorization (access control)
- [ ] Verify password security (hashing, complexity)
- [ ] Test rate limiting
- [ ] Verify HTTPS enforcement

#### A.8.4 Performance Testing
- [ ] Load test API endpoints
- [ ] Test concurrent user scenarios
- [ ] Optimize slow database queries
- [ ] Test file upload limits
- [ ] Measure PDF generation time
- [ ] Check frontend bundle size
- [ ] Run Lighthouse performance audit

#### A.8.5 Bug Fixes
- [ ] Fix all P0 (critical) bugs
- [ ] Fix all P1 (high priority) bugs
- [ ] Document known issues (P2/P3)
- [ ] Create bug tracking system (GitHub Issues or Jira)

#### A.8.6 Documentation
- [ ] Update API documentation (Swagger)
- [ ] Write deployment guide
- [ ] Create user manual (operator guide)
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Write contribution guidelines

### Deliverables
- ✅ Test suite with >80% coverage
- ✅ All critical bugs fixed
- ✅ Security audit completed
- ✅ Documentation completed

### Acceptance Criteria
- [ ] Backend test coverage >80%
- [ ] Frontend test coverage >70%
- [ ] E2E tests passing for critical flows
- [ ] No known security vulnerabilities
- [ ] API response time <200ms (p95)
- [ ] Frontend Lighthouse score >85
- [ ] All P0 and P1 bugs fixed
- [ ] API documentation up to date

---

## Phase A Completion Checklist

### Infrastructure ✅
- [ ] Development environment running
- [ ] CI/CD pipeline functional
- [ ] Monitoring and logging active
- [ ] Database and Redis connected
- [ ] File storage configured

### Authentication ✅
- [ ] User registration and login working
- [ ] SSO integration functional
- [ ] RBAC enforced on all endpoints
- [ ] MFA enabled for admins

### Core Data ✅
- [ ] Agents, Customers, Suppliers manageable
- [ ] Rate sheets uploadable
- [ ] Site catalog populated
- [ ] Audit logs recording actions

### Itineraries ✅
- [ ] Operators can create itineraries
- [ ] Day-by-day structure working
- [ ] Components (stay, transfer, activity) addable
- [ ] Cost calculation accurate

### Quotes ✅
- [ ] Quotes generated from itineraries
- [ ] PDF generation working
- [ ] Email sending functional
- [ ] Pricing engine calculating correctly

### Bookings ✅
- [ ] Quotes convertible to bookings
- [ ] Payment integration working
- [ ] Vouchers generated
- [ ] Booking workflow complete

### Admin UI ✅
- [ ] Dashboard showing metrics
- [ ] User management functional
- [ ] System settings configurable
- [ ] Navigation and UX polished

### Quality ✅
- [ ] Tests written and passing
- [ ] Security audit completed
- [ ] Performance optimized
- [ ] Documentation complete

---

## Success Metrics for Phase A

1. **Functional**: All core workflows (create itinerary → quote → booking) working end-to-end
2. **Performance**: API p95 response time <200ms
3. **Quality**: >80% test coverage, no P0/P1 bugs
4. **Security**: No known vulnerabilities, RBAC enforced
5. **Usability**: Operators can use system with minimal training

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSO integration delays | High | Start early, use library (Passport.js), have fallback email/password auth |
| PDF generation performance | Medium | Use job queue, optimize templates, consider external service |
| Scope creep | High | Strict phase boundaries, document Phase B features separately |
| Database performance | Medium | Proper indexing, query optimization, monitoring |
| Team availability | Medium | Clear task breakdown, parallel work streams |

---

## Next Steps After Phase A

Once Phase A is complete:
1. **Deploy to production** with limited users (pilot program)
2. **Gather feedback** from operators and agents
3. **Plan Phase B** based on feedback and priorities
4. **Start Phase B** with agent self-service portal

---

**Last Updated**: Not started  
**Estimated Completion**: 12 weeks from start  
**Dependencies**: None (foundation phase)
