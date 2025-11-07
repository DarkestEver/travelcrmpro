# Phase B: Prioritized Implementation Todo List

**Last Updated**: Current Session  
**Total Estimated Duration**: 8-10 weeks  
**Prerequisites**: Phase A Complete ✅  
**Implementation Strategy**: Test-Driven Development (TDD) with <500 lines/file

---

## Priority Legend

- 🔴 **CRITICAL** - Blocks revenue generation, must be completed first
- 🟠 **HIGH** - Core functionality, high business value
- 🟡 **MEDIUM** - Important but not blocking, can be parallelized
- 🟢 **LOW** - Nice-to-have, efficiency improvements

---

## Phase B.1: Agent Self-Service Portal (Week 1-3)

### Priority: 🔴 CRITICAL

**Why Critical**: Enables agent revenue generation, the core B2B business model

### Sprint 1.1: Agent Portal Foundation (Days 1-3)

#### Backend Tasks
- [ ] **B1.1.1** - Create agent role schema extension in User model (30 min)
  - Add `agentCode`, `agentLevel`, `creditLimit`, `commissionRate`
  - File: `backend/src/models/User.js` (modify existing)

- [ ] **B1.1.2** - Create agent middleware for route protection (1 hour)
  - File: `backend/src/middleware/agentAuth.js` (<100 lines)
  - Verify agent role and active status

- [ ] **B1.1.3** - Create agent-scoped data access helper (2 hours)
  - File: `backend/src/utils/agentDataAccess.js` (<150 lines)
  - Functions: `getAgentCustomers()`, `getAgentQuotes()`, `getAgentBookings()`

#### Frontend Tasks
- [ ] **B1.1.4** - Create agent portal route structure (1 hour)
  - File: `frontend/src/routes/agentRoutes.jsx` (<80 lines)
  - Routes: `/agent/dashboard`, `/agent/customers`, `/agent/quotes`, `/agent/bookings`

- [ ] **B1.1.5** - Create agent portal layout component (2 hours)
  - File: `frontend/src/layouts/AgentLayout.jsx` (<200 lines)
  - Sidebar with agent-specific navigation
  - Agent profile section

#### Testing
- [ ] **B1.1.6** - Create agent middleware tests (1 hour)
  - File: `backend/test/middleware/agentAuth.test.js` (<150 lines)

**Sprint 1.1 Deliverable**: Agent can access protected routes ✅

---

### Sprint 1.2: Agent Dashboard (Days 4-5)

#### Backend Tasks
- [ ] **B1.2.1** - Create agent stats controller (2 hours)
  - File: `backend/src/controllers/agentStatsController.js` (<200 lines)
  - Functions: `getDashboardStats()`, `getRecentActivity()`
  - Stats: Total customers, pending quotes, confirmed bookings, revenue

- [ ] **B1.2.2** - Create agent stats routes (30 min)
  - File: `backend/src/routes/agentRoutes.js` (<100 lines)
  - `GET /api/v1/agent/stats`
  - `GET /api/v1/agent/activity`

#### Frontend Tasks
- [ ] **B1.2.3** - Create agent dashboard page (3 hours)
  - File: `frontend/src/pages/agent/Dashboard.jsx` (<300 lines)
  - KPI cards: customers, quotes, bookings, revenue
  - Recent activity list
  - Quick actions (Add Customer, Request Quote)

- [ ] **B1.2.4** - Create agent KPI card component (1 hour)
  - File: `frontend/src/components/agent/KPICard.jsx` (<100 lines)
  - Reusable stat display with icon

- [ ] **B1.2.5** - Create agent stats API service (30 min)
  - File: `frontend/src/services/agentAPI.js` (<150 lines)

#### Testing
- [ ] **B1.2.6** - Create agent stats tests (1 hour)
  - File: `backend/test/controllers/agentStats.test.js` (<200 lines)

**Sprint 1.2 Deliverable**: Agent dashboard shows real-time stats ✅

---

### Sprint 1.3: Agent Customer Management (Days 6-9)

#### Backend Tasks
- [ ] **B1.3.1** - Update Customer model for agent association (1 hour)
  - File: `backend/src/models/Customer.js` (modify)
  - Add `agentId` field with index

- [ ] **B1.3.2** - Create agent customer controller (3 hours)
  - File: `backend/src/controllers/agentCustomerController.js` (<300 lines)
  - Functions: `getMyCustomers()`, `createCustomer()`, `updateCustomer()`, `deleteCustomer()`
  - Agent-scoped queries only

- [ ] **B1.3.3** - Create agent customer routes (30 min)
  - File: `backend/src/routes/agentCustomerRoutes.js` (<80 lines)

- [ ] **B1.3.4** - Create CSV import service for agents (2 hours)
  - File: `backend/src/services/agentCustomerImport.js` (<250 lines)
  - Parse CSV, validate, associate with agent
  - Return errors by row

#### Frontend Tasks
- [ ] **B1.3.5** - Create agent customer list page (3 hours)
  - File: `frontend/src/pages/agent/Customers.jsx` (<350 lines)
  - Table with search and pagination
  - Actions: Edit, Delete, Email

- [ ] **B1.3.6** - Create agent customer form modal (2 hours)
  - File: `frontend/src/components/agent/CustomerFormModal.jsx` (<250 lines)
  - Fields: name, email, phone, notes, preferences

- [ ] **B1.3.7** - Create CSV import modal (2 hours)
  - File: `frontend/src/components/agent/CustomerImportModal.jsx` (<200 lines)
  - File upload, preview, error display
  - Download template button

#### Testing
- [ ] **B1.3.8** - Create agent customer tests (2 hours)
  - File: `backend/test/controllers/agentCustomer.test.js` (<300 lines)
  - Test agent scoping (can't access other agents' customers)

**Sprint 1.3 Deliverable**: Agents can fully manage their customers ✅

---

### Sprint 1.4: Quote Request System (Days 10-12)

#### Backend Tasks
- [ ] **B1.4.1** - Create QuoteRequest schema (2 hours)
  - File: `backend/src/models/QuoteRequest.js` (<250 lines)
  - Fields: agentId, customerId, destination, dates, pax, budget, status, notes
  - Status: pending, reviewing, quoted, accepted, rejected

- [ ] **B1.4.2** - Create quote request controller (3 hours)
  - File: `backend/src/controllers/quoteRequestController.js` (<300 lines)
  - Functions: `submitRequest()`, `getMyRequests()`, `acceptQuote()`, `rejectQuote()`

- [ ] **B1.4.3** - Create quote request routes (30 min)
  - File: `backend/src/routes/quoteRequestRoutes.js` (<100 lines)

- [ ] **B1.4.4** - Create notification on new request (1 hour)
  - File: `backend/src/services/notificationService.js` (modify existing)
  - Notify operators when agent submits request

#### Frontend Tasks
- [ ] **B1.4.5** - Create quote request form page (4 hours)
  - File: `frontend/src/pages/agent/RequestQuote.jsx` (<400 lines)
  - Form: customer select, destination, dates, travelers, budget, preferences
  - Travel style, difficulty, themes checkboxes
  - Inspiration notes textarea

- [ ] **B1.4.6** - Create quote request list page (3 hours)
  - File: `frontend/src/pages/agent/QuoteRequests.jsx` (<300 lines)
  - Table with filters (status, date range)
  - View quote details modal
  - Accept/Reject actions

- [ ] **B1.4.7** - Create quote detail modal (2 hours)
  - File: `frontend/src/components/agent/QuoteDetailModal.jsx` (<250 lines)
  - Show itinerary preview
  - Price breakdown
  - Accept/Reject buttons

#### Testing
- [ ] **B1.4.8** - Create quote request tests (2 hours)
  - File: `backend/test/controllers/quoteRequest.test.js` (<300 lines)

**Sprint 1.4 Deliverable**: Agents can submit and manage quote requests ✅

---

### Sprint 1.5: Agent Booking Tracking (Days 13-15)

#### Backend Tasks
- [ ] **B1.5.1** - Update Booking model for agent field (30 min)
  - File: `backend/src/models/Booking.js` (modify)
  - Add `agentId` field

- [ ] **B1.5.2** - Create agent booking controller (2 hours)
  - File: `backend/src/controllers/agentBookingController.js` (<250 lines)
  - Functions: `getMyBookings()`, `getBookingDetails()`

- [ ] **B1.5.3** - Create agent booking routes (30 min)
  - File: `backend/src/routes/agentBookingRoutes.js` (<80 lines)

#### Frontend Tasks
- [ ] **B1.5.4** - Create agent booking list page (3 hours)
  - File: `frontend/src/pages/agent/Bookings.jsx` (<350 lines)
  - Table with filters (status, date range)
  - Status badges (confirmed, pending, cancelled)
  - View booking details

- [ ] **B1.5.5** - Create booking detail view (2 hours)
  - File: `frontend/src/components/agent/BookingDetailView.jsx` (<300 lines)
  - Customer info, itinerary, payment status
  - Download voucher button

#### Testing
- [ ] **B1.5.6** - Create agent booking tests (1 hour)
  - File: `backend/test/controllers/agentBooking.test.js` (<200 lines)

**Sprint 1.5 Deliverable**: Agents can track all their bookings ✅

---

### Sprint 1.6: Agent Sub-User Management (Days 16-18)

#### Backend Tasks
- [ ] **B1.6.1** - Create SubUser schema (2 hours)
  - File: `backend/src/models/SubUser.js` (<200 lines)
  - Fields: parentAgentId, name, email, role, permissions, isActive
  - Roles: admin, user (view-only)

- [ ] **B1.6.2** - Create sub-user controller (3 hours)
  - File: `backend/src/controllers/subUserController.js` (<300 lines)
  - Functions: `createSubUser()`, `updateSubUser()`, `deleteSubUser()`, `getSubUsers()`

- [ ] **B1.6.3** - Create sub-user auth middleware (1 hour)
  - File: `backend/src/middleware/subUserAuth.js` (<100 lines)
  - Check permissions before actions

- [ ] **B1.6.4** - Create activity log service (2 hours)
  - File: `backend/src/services/activityLog.js` (<200 lines)
  - Log all sub-user actions with timestamp

#### Frontend Tasks
- [ ] **B1.6.5** - Create sub-user management page (3 hours)
  - File: `frontend/src/pages/agent/SubUsers.jsx` (<300 lines)
  - Table with add/edit/delete actions
  - Role and permission toggles

- [ ] **B1.6.6** - Create sub-user form modal (2 hours)
  - File: `frontend/src/components/agent/SubUserFormModal.jsx` (<200 lines)

- [ ] **B1.6.7** - Create activity log view (2 hours)
  - File: `frontend/src/components/agent/ActivityLog.jsx` (<200 lines)
  - Timeline view of actions per sub-user

#### Testing
- [ ] **B1.6.8** - Create sub-user tests (2 hours)
  - File: `backend/test/controllers/subUser.test.js` (<250 lines)

**Sprint 1.6 Deliverable**: Agents can manage sub-users with permissions ✅

---

## Phase B.2: Supplier Portal (Week 3-5)

### Priority: 🟠 HIGH

**Why High**: Unlocks operational efficiency, reduces manual rate updates

### Sprint 2.1: Supplier Portal Foundation (Days 19-21)

#### Backend Tasks
- [ ] **B2.1.1** - Create Supplier schema (2 hours)
  - File: `backend/src/models/Supplier.js` (<300 lines)
  - Fields: companyName, contactPerson, email, phone, country, city, type (hotel, transport, activity), status

- [ ] **B2.1.2** - Create supplier role in User model (1 hour)
  - File: `backend/src/models/User.js` (modify)
  - Add `supplierId` reference field

- [ ] **B2.1.3** - Create supplier middleware (1 hour)
  - File: `backend/src/middleware/supplierAuth.js` (<100 lines)

- [ ] **B2.1.4** - Create supplier controller (2 hours)
  - File: `backend/src/controllers/supplierController.js` (<250 lines)
  - Functions: `getProfile()`, `updateProfile()`, `uploadDocuments()`

#### Frontend Tasks
- [ ] **B2.1.5** - Create supplier route structure (1 hour)
  - File: `frontend/src/routes/supplierRoutes.jsx` (<80 lines)

- [ ] **B2.1.6** - Create supplier layout (2 hours)
  - File: `frontend/src/layouts/SupplierLayout.jsx` (<200 lines)

- [ ] **B2.1.7** - Create supplier dashboard page (3 hours)
  - File: `frontend/src/pages/supplier/Dashboard.jsx` (<300 lines)
  - KPIs: Pending inquiries, active bookings, rate sheets uploaded

#### Testing
- [ ] **B2.1.8** - Create supplier middleware tests (1 hour)
  - File: `backend/test/middleware/supplierAuth.test.js` (<150 lines)

**Sprint 2.1 Deliverable**: Supplier can access portal ✅

---

### Sprint 2.2: Rate Sheet Management (Days 22-26)

#### Backend Tasks
- [ ] **B2.2.1** - Create RateSheet schema (3 hours)
  - File: `backend/src/models/RateSheet.js` (<350 lines)
  - Fields: supplierId, serviceType, category, validFrom, validTo, seasonType, rates[], inclusions, exclusions, cancellationPolicy

- [ ] **B2.2.2** - Create rate sheet controller (4 hours)
  - File: `backend/src/controllers/rateSheetController.js` (<400 lines)
  - Functions: `uploadRates()`, `getRates()`, `updateRates()`, `deleteRates()`, `validateCSV()`

- [ ] **B2.2.3** - Create CSV parser service (3 hours)
  - File: `backend/src/services/rateSheetParser.js` (<300 lines)
  - Parse CSV with validation
  - Return errors by row with line numbers

- [ ] **B2.2.4** - Create rate sheet versioning service (2 hours)
  - File: `backend/src/services/rateSheetVersioning.js` (<200 lines)
  - Keep history of rate changes

#### Frontend Tasks
- [ ] **B2.2.5** - Create rate sheet list page (3 hours)
  - File: `frontend/src/pages/supplier/RateSheets.jsx` (<350 lines)
  - Table with filters (service type, status, expiry)
  - Upload CSV button

- [ ] **B2.2.6** - Create rate sheet upload modal (3 hours)
  - File: `frontend/src/components/supplier/RateSheetUploadModal.jsx` (<300 lines)
  - Drag-drop CSV upload
  - Download template button
  - Preview and validation
  - Error display with row numbers

- [ ] **B2.2.7** - Create rate sheet detail view (2 hours)
  - File: `frontend/src/components/supplier/RateSheetDetailView.jsx` (<250 lines)
  - View all rates in table format
  - Edit individual rates inline

- [ ] **B2.2.8** - Create rate comparison view (2 hours)
  - File: `frontend/src/components/supplier/RateComparisonView.jsx` (<200 lines)
  - Compare two versions side-by-side

#### Testing
- [ ] **B2.2.9** - Create rate sheet parser tests (2 hours)
  - File: `backend/test/services/rateSheetParser.test.js` (<300 lines)

**Sprint 2.2 Deliverable**: Suppliers can upload and manage rate sheets ✅

---

### Sprint 2.3: Supplier Availability Management (Days 27-29)

#### Backend Tasks
- [ ] **B2.3.1** - Create Availability schema (2 hours)
  - File: `backend/src/models/Availability.js` (<200 lines)
  - Fields: supplierId, resourceId, date, availableUnits, status

- [ ] **B2.3.2** - Create availability controller (3 hours)
  - File: `backend/src/controllers/availabilityController.js` (<300 lines)
  - Functions: `getAvailability()`, `updateAvailability()`, `blockDates()`

#### Frontend Tasks
- [ ] **B2.3.3** - Create availability calendar page (4 hours)
  - File: `frontend/src/pages/supplier/Availability.jsx` (<400 lines)
  - Month view calendar
  - Click date to edit availability
  - Bulk block date range

- [ ] **B2.3.4** - Create availability edit modal (2 hours)
  - File: `frontend/src/components/supplier/AvailabilityEditModal.jsx` (<200 lines)

#### Testing
- [ ] **B2.3.5** - Create availability tests (1 hour)
  - File: `backend/test/controllers/availability.test.js` (<200 lines)

**Sprint 2.3 Deliverable**: Suppliers can manage availability calendar ✅

---

### Sprint 2.4: Supplier Request Management (Days 30-33)

#### Backend Tasks
- [ ] **B2.4.1** - Update QuoteRequest to include supplier assignments (1 hour)
  - File: `backend/src/models/QuoteRequest.js` (modify)
  - Add `assignedSuppliers` array

- [ ] **B2.4.2** - Create supplier request controller (3 hours)
  - File: `backend/src/controllers/supplierRequestController.js` (<300 lines)
  - Functions: `getMyRequests()`, `respondToRequest()`, `acceptRequest()`, `declineRequest()`

- [ ] **B2.4.3** - Create supplier-operator messaging (3 hours)
  - File: `backend/src/models/Message.js` (<200 lines)
  - File: `backend/src/controllers/messageController.js` (<250 lines)

#### Frontend Tasks
- [ ] **B2.4.4** - Create supplier request list page (3 hours)
  - File: `frontend/src/pages/supplier/Requests.jsx` (<300 lines)
  - Table with filters (status, date)
  - View details and respond button

- [ ] **B2.4.5** - Create supplier respond modal (3 hours)
  - File: `frontend/src/components/supplier/RespondToRequestModal.jsx` (<300 lines)
  - Form: Availability, proposed rates, notes, attachments

- [ ] **B2.4.6** - Create messaging interface (3 hours)
  - File: `frontend/src/components/supplier/MessagingPanel.jsx` (<250 lines)
  - Chat-like interface for supplier-operator communication

#### Testing
- [ ] **B2.4.7** - Create supplier request tests (2 hours)
  - File: `backend/test/controllers/supplierRequest.test.js` (<250 lines)

**Sprint 2.4 Deliverable**: Suppliers can respond to quote requests ✅

---

### Sprint 2.5: Supplier Document Management (Days 34-36)

#### Backend Tasks
- [ ] **B2.5.1** - Create Document schema (2 hours)
  - File: `backend/src/models/Document.js` (<200 lines)
  - Fields: supplierId, type, fileName, url, expiryDate, status, approvedBy

- [ ] **B2.5.2** - Create document controller (2 hours)
  - File: `backend/src/controllers/documentController.js` (<250 lines)
  - Functions: `uploadDocument()`, `getDocuments()`, `deleteDocument()`

- [ ] **B2.5.3** - Set up file upload (AWS S3 or local) (2 hours)
  - File: `backend/src/services/fileUpload.js` (<200 lines)

#### Frontend Tasks
- [ ] **B2.5.4** - Create document management page (3 hours)
  - File: `frontend/src/pages/supplier/Documents.jsx` (<300 lines)
  - Table with document type, expiry, status
  - Upload button, view, delete actions

- [ ] **B2.5.5** - Create document upload modal (2 hours)
  - File: `frontend/src/components/supplier/DocumentUploadModal.jsx` (<200 lines)

- [ ] **B2.5.6** - Create expiry alert component (1 hour)
  - File: `frontend/src/components/supplier/DocumentExpiryAlert.jsx` (<100 lines)

#### Testing
- [ ] **B2.5.7** - Create document tests (1 hour)
  - File: `backend/test/controllers/document.test.js` (<200 lines)

**Sprint 2.5 Deliverable**: Suppliers can upload and manage documents ✅

---

## Phase B.3: Advanced Pricing Engine (Week 5-7)

### Priority: 🟠 HIGH

**Why High**: Optimizes revenue and enables flexible pricing strategies

### Sprint 3.1: Pricing Rule Engine (Days 37-40)

#### Backend Tasks
- [ ] **B3.1.1** - Create PricingRule schema (3 hours)
  - File: `backend/src/models/PricingRule.js` (<300 lines)
  - Fields: name, type, conditions, action, priority, effectiveFrom, effectiveTo, isActive

- [ ] **B3.1.2** - Create pricing rule engine (5 hours)
  - File: `backend/src/services/pricingEngine.js` (<450 lines)
  - Functions: `evaluateRules()`, `applyMarkup()`, `calculateDiscount()`, `resolvePriority()`

- [ ] **B3.1.3** - Create pricing controller (3 hours)
  - File: `backend/src/controllers/pricingController.js` (<300 lines)
  - Functions: `calculatePrice()`, `getRules()`, `createRule()`, `updateRule()`

#### Frontend Tasks
- [ ] **B3.1.4** - Create pricing rule list page (3 hours)
  - File: `frontend/src/pages/admin/PricingRules.jsx` (<350 lines)
  - Table with filters, add/edit/delete actions

- [ ] **B3.1.5** - Create pricing rule form modal (4 hours)
  - File: `frontend/src/components/admin/PricingRuleFormModal.jsx` (<400 lines)
  - Rule builder UI with conditions and actions

- [ ] **B3.1.6** - Create pricing calculator preview (2 hours)
  - File: `frontend/src/components/admin/PricingCalculatorPreview.jsx` (<200 lines)
  - Test pricing rules on sample data

#### Testing
- [ ] **B3.1.7** - Create pricing engine tests (3 hours)
  - File: `backend/test/services/pricingEngine.test.js` (<350 lines)

**Sprint 3.1 Deliverable**: Flexible pricing rule engine operational ✅

---

### Sprint 3.2: Markup & Commission System (Days 41-44)

#### Backend Tasks
- [ ] **B3.2.1** - Create Markup schema (2 hours)
  - File: `backend/src/models/Markup.js` (<200 lines)
  - Fields: name, type, percentage, fixedAmount, conditions, applicableTo

- [ ] **B3.2.2** - Create Commission schema (2 hours)
  - File: `backend/src/models/Commission.js` (<200 lines)
  - Fields: agentId, bookingId, baseAmount, commissionRate, commissionAmount, status, paidDate

- [ ] **B3.2.3** - Create markup service (3 hours)
  - File: `backend/src/services/markupService.js` (<300 lines)
  - Functions: `applyDefaultMarkup()`, `applyAgentMarkup()`, `applyDestinationMarkup()`

- [ ] **B3.2.4** - Create commission service (3 hours)
  - File: `backend/src/services/commissionService.js` (<300 lines)
  - Functions: `calculateCommission()`, `trackCommission()`, `generateCommissionReport()`

#### Frontend Tasks
- [ ] **B3.2.5** - Create markup management page (3 hours)
  - File: `frontend/src/pages/admin/Markups.jsx` (<300 lines)

- [ ] **B3.2.6** - Create commission tracking page (3 hours)
  - File: `frontend/src/pages/admin/Commissions.jsx` (<300 lines)
  - Table with filters, export to CSV

- [ ] **B3.2.7** - Create commission report generator (2 hours)
  - File: `frontend/src/components/admin/CommissionReportGenerator.jsx` (<200 lines)

#### Testing
- [ ] **B3.2.8** - Create markup and commission tests (2 hours)
  - File: `backend/test/services/markup.test.js` (<200 lines)
  - File: `backend/test/services/commission.test.js` (<200 lines)

**Sprint 3.2 Deliverable**: Markup and commission system working ✅

---

### Sprint 3.3: Seasonal & Promotional Pricing (Days 45-48)

#### Backend Tasks
- [ ] **B3.3.1** - Create Season schema (2 hours)
  - File: `backend/src/models/Season.js` (<200 lines)
  - Fields: name, destination, startDate, endDate, type (peak, shoulder, off-peak), priceAdjustment

- [ ] **B3.3.2** - Create PromoCode schema (2 hours)
  - File: `backend/src/models/PromoCode.js` (<200 lines)
  - Fields: code, discountType, discountValue, validFrom, validTo, usageLimit, usedCount

- [ ] **B3.3.3** - Create seasonal pricing service (2 hours)
  - File: `backend/src/services/seasonalPricing.js` (<200 lines)

- [ ] **B3.3.4** - Create promo code service (3 hours)
  - File: `backend/src/services/promoCodeService.js` (<250 lines)
  - Functions: `validatePromoCode()`, `applyPromoCode()`, `trackUsage()`

#### Frontend Tasks
- [ ] **B3.3.5** - Create season management page (3 hours)
  - File: `frontend/src/pages/admin/Seasons.jsx` (<300 lines)

- [ ] **B3.3.6** - Create promo code management page (3 hours)
  - File: `frontend/src/pages/admin/PromoCodes.jsx` (<300 lines)
  - Generate random codes, set rules

- [ ] **B3.3.7** - Create promo code input component (1 hour)
  - File: `frontend/src/components/booking/PromoCodeInput.jsx` (<150 lines)
  - Real-time validation

#### Testing
- [ ] **B3.3.8** - Create seasonal and promo tests (2 hours)
  - File: `backend/test/services/seasonalPricing.test.js` (<200 lines)
  - File: `backend/test/services/promoCode.test.js` (<200 lines)

**Sprint 3.3 Deliverable**: Seasonal pricing and promo codes active ✅

---

### Sprint 3.4: Tax Management (Days 49-50)

#### Backend Tasks
- [ ] **B3.4.1** - Create TaxRule schema (2 hours)
  - File: `backend/src/models/TaxRule.js` (<200 lines)
  - Fields: region, taxType, rate, isInclusive

- [ ] **B3.4.2** - Create tax service (3 hours)
  - File: `backend/src/services/taxService.js` (<250 lines)
  - Functions: `calculateTax()`, `getTaxByRegion()`, `generateTaxReport()`

#### Frontend Tasks
- [ ] **B3.4.3** - Create tax rule management page (2 hours)
  - File: `frontend/src/pages/admin/TaxRules.jsx` (<250 lines)

- [ ] **B3.4.4** - Create tax breakdown component (1 hour)
  - File: `frontend/src/components/booking/TaxBreakdown.jsx` (<150 lines)

#### Testing
- [ ] **B3.4.5** - Create tax service tests (1 hour)
  - File: `backend/test/services/tax.test.js` (<200 lines)

**Sprint 3.4 Deliverable**: Tax calculation accurate ✅

---

## Phase B.5: Workflow Automation & Notifications (Week 7-8)

### Priority: 🟡 MEDIUM (but should be done before B.4)

**Why Medium-High**: Reduces manual work, improves response time

### Sprint 5.1: Approval Workflow Engine (Days 51-54)

#### Backend Tasks
- [ ] **B5.1.1** - Create Workflow schema (3 hours)
  - File: `backend/src/models/Workflow.js` (<300 lines)
  - Fields: name, triggerType, steps[], status

- [ ] **B5.1.2** - Create ApprovalRequest schema (2 hours)
  - File: `backend/src/models/ApprovalRequest.js` (<200 lines)
  - Fields: workflowId, requesterId, approverId, status, comments

- [ ] **B5.1.3** - Create workflow engine (4 hours)
  - File: `backend/src/services/workflowEngine.js` (<400 lines)
  - Functions: `triggerWorkflow()`, `processStep()`, `checkConditions()`

- [ ] **B5.1.4** - Create approval controller (2 hours)
  - File: `backend/src/controllers/approvalController.js` (<250 lines)

#### Frontend Tasks
- [ ] **B5.1.5** - Create approval request list page (3 hours)
  - File: `frontend/src/pages/admin/Approvals.jsx` (<300 lines)

- [ ] **B5.1.6** - Create approval action modal (2 hours)
  - File: `frontend/src/components/admin/ApprovalActionModal.jsx` (<200 lines)
  - Approve/Reject with comments

#### Testing
- [ ] **B5.1.7** - Create workflow engine tests (2 hours)
  - File: `backend/test/services/workflowEngine.test.js` (<250 lines)

**Sprint 5.1 Deliverable**: Approval workflows operational ✅

---

### Sprint 5.2: Enhanced Notification System (Days 55-58)

#### Backend Tasks
- [ ] **B5.2.1** - Create Notification schema (2 hours)
  - File: `backend/src/models/Notification.js` (<200 lines)
  - Fields: userId, type, title, message, priority, channels, isRead, sentAt

- [ ] **B5.2.2** - Create notification preference schema (1 hour)
  - File: `backend/src/models/NotificationPreference.js` (<150 lines)

- [ ] **B5.2.3** - Create notification service (4 hours)
  - File: `backend/src/services/notificationService.js` (<400 lines)
  - Functions: `sendNotification()`, `sendEmail()`, `sendSMS()`, `sendInApp()`, `batchNotifications()`

- [ ] **B5.2.4** - Integrate email service (SendGrid/Mailgun) (3 hours)
  - File: `backend/src/services/emailService.js` (<300 lines)

- [ ] **B5.2.5** - Integrate SMS service (Twilio) (2 hours)
  - File: `backend/src/services/smsService.js` (<200 lines)

#### Frontend Tasks
- [ ] **B5.2.6** - Create notification center (3 hours)
  - File: `frontend/src/components/common/NotificationCenter.jsx` (<300 lines)
  - Bell icon with unread count, dropdown list

- [ ] **B5.2.7** - Create notification preference page (2 hours)
  - File: `frontend/src/pages/settings/NotificationPreferences.jsx` (<250 lines)
  - Toggles for email, SMS, in-app per event type

#### Testing
- [ ] **B5.2.8** - Create notification service tests (2 hours)
  - File: `backend/test/services/notification.test.js` (<250 lines)

**Sprint 5.2 Deliverable**: Multi-channel notifications working ✅

---

### Sprint 5.3: Scheduled Jobs System (Days 59-61)

#### Backend Tasks
- [ ] **B5.3.1** - Set up job queue (BullMQ) (3 hours)
  - File: `backend/src/jobs/queue.js` (<200 lines)
  - Redis connection, job processor

- [ ] **B5.3.2** - Create payment reminder job (2 hours)
  - File: `backend/src/jobs/paymentReminders.js` (<200 lines)
  - Daily check for upcoming payment due dates

- [ ] **B5.3.3** - Create trip reminder job (2 hours)
  - File: `backend/src/jobs/tripReminders.js` (<200 lines)
  - Send at 7, 3, 1 days before trip

- [ ] **B5.3.4** - Create abandoned quote follow-up job (2 hours)
  - File: `backend/src/jobs/abandonedQuoteFollowUp.js` (<200 lines)
  - Weekly check for quotes not acted upon

- [ ] **B5.3.5** - Create weekly/monthly report jobs (2 hours)
  - File: `backend/src/jobs/reportGeneration.js` (<250 lines)

- [ ] **B5.3.6** - Create job monitoring dashboard (3 hours)
  - File: `backend/src/controllers/jobMonitorController.js` (<250 lines)
  - View job status, retry failed jobs

#### Frontend Tasks
- [ ] **B5.3.7** - Create job monitoring page (2 hours)
  - File: `frontend/src/pages/admin/Jobs.jsx` (<250 lines)

#### Testing
- [ ] **B5.3.8** - Create job tests (2 hours)
  - File: `backend/test/jobs/paymentReminders.test.js` (<200 lines)

**Sprint 5.3 Deliverable**: Scheduled jobs running reliably ✅

---

### Sprint 5.4: Task Management System (Days 62-64)

#### Backend Tasks
- [ ] **B5.4.1** - Create Task schema (2 hours)
  - File: `backend/src/models/Task.js` (<200 lines)
  - Fields: title, description, assignedTo, dueDate, priority, status, relatedTo

- [ ] **B5.4.2** - Create task controller (3 hours)
  - File: `backend/src/controllers/taskController.js` (<300 lines)

- [ ] **B5.4.3** - Create task template service (2 hours)
  - File: `backend/src/services/taskTemplateService.js` (<200 lines)
  - Pre-departure checklist templates

#### Frontend Tasks
- [ ] **B5.4.4** - Create task board page (Kanban) (4 hours)
  - File: `frontend/src/pages/admin/Tasks.jsx` (<400 lines)
  - Drag-drop columns: To Do, In Progress, Done

- [ ] **B5.4.5** - Create task detail modal (2 hours)
  - File: `frontend/src/components/admin/TaskDetailModal.jsx` (<250 lines)
  - Comments, attachments, history

#### Testing
- [ ] **B5.4.6** - Create task tests (1 hour)
  - File: `backend/test/controllers/task.test.js` (<200 lines)

**Sprint 5.4 Deliverable**: Task management functional ✅

---

## Phase B.4: Enhanced PDF & Email Templates (Week 8-9)

### Priority: 🟡 MEDIUM (Professional polish, can be done in parallel)

### Sprint 4.1: PDF Template Engine (Days 65-68)

#### Backend Tasks
- [ ] **B4.1.1** - Set up PDF generation library (Puppeteer or PDFKit) (2 hours)
  - File: `backend/src/services/pdfGenerator.js` (<300 lines)

- [ ] **B4.1.2** - Create quote PDF template (3 hours)
  - File: `backend/src/templates/pdf/quotePDF.ejs` (<250 lines)
  - Professional layout with branding

- [ ] **B4.1.3** - Create voucher PDF template (2 hours)
  - File: `backend/src/templates/pdf/voucherPDF.ejs` (<200 lines)

- [ ] **B4.1.4** - Create invoice PDF template (2 hours)
  - File: `backend/src/templates/pdf/invoicePDF.ejs` (<200 lines)

- [ ] **B4.1.5** - Create QR code generator (1 hour)
  - File: `backend/src/services/qrCodeGenerator.js` (<100 lines)

- [ ] **B4.1.6** - Create PDF controller (2 hours)
  - File: `backend/src/controllers/pdfController.js` (<250 lines)

#### Frontend Tasks
- [ ] **B4.1.7** - Add PDF download buttons (1 hour)
  - Modify existing pages to include download actions

#### Testing
- [ ] **B4.1.8** - Create PDF generation tests (2 hours)
  - File: `backend/test/services/pdfGenerator.test.js` (<200 lines)

**Sprint 4.1 Deliverable**: Professional branded PDFs ✅

---

### Sprint 4.2: Template Management System (Days 69-71)

#### Backend Tasks
- [ ] **B4.2.1** - Create Template schema (2 hours)
  - File: `backend/src/models/Template.js` (<200 lines)
  - Fields: name, type, content, variables, version

- [ ] **B4.2.2** - Create template controller (3 hours)
  - File: `backend/src/controllers/templateController.js` (<300 lines)

- [ ] **B4.2.3** - Create template rendering service (2 hours)
  - File: `backend/src/services/templateRenderer.js` (<200 lines)
  - Handlebars engine for variable replacement

#### Frontend Tasks
- [ ] **B4.2.4** - Create template management page (4 hours)
  - File: `frontend/src/pages/admin/Templates.jsx` (<350 lines)

- [ ] **B4.2.5** - Create template editor (4 hours)
  - File: `frontend/src/components/admin/TemplateEditor.jsx` (<400 lines)
  - Rich text editor with variable picker

- [ ] **B4.2.6** - Create template preview (2 hours)
  - File: `frontend/src/components/admin/TemplatePreview.jsx` (<200 lines)

#### Testing
- [ ] **B4.2.7** - Create template tests (1 hour)
  - File: `backend/test/controllers/template.test.js` (<200 lines)

**Sprint 4.2 Deliverable**: Template management UI working ✅

---

### Sprint 4.3: Email Template System (Days 72-74)

#### Backend Tasks
- [ ] **B4.3.1** - Create email templates (3 hours)
  - File: `backend/src/templates/email/welcome.ejs` (<150 lines)
  - File: `backend/src/templates/email/quoteReady.ejs` (<150 lines)
  - File: `backend/src/templates/email/bookingConfirmation.ejs` (<200 lines)
  - File: `backend/src/templates/email/paymentReminder.ejs` (<150 lines)
  - File: `backend/src/templates/email/tripReminder.ejs` (<150 lines)

- [ ] **B4.3.2** - Create email template controller (2 hours)
  - File: `backend/src/controllers/emailTemplateController.js` (<250 lines)

#### Frontend Tasks
- [ ] **B4.3.3** - Create email template editor page (3 hours)
  - File: `frontend/src/pages/admin/EmailTemplates.jsx` (<300 lines)

- [ ] **B4.3.4** - Create email preview component (2 hours)
  - File: `frontend/src/components/admin/EmailPreview.jsx` (<200 lines)

#### Testing
- [ ] **B4.3.5** - Create email template tests (1 hour)
  - File: `backend/test/controllers/emailTemplate.test.js` (<150 lines)

**Sprint 4.3 Deliverable**: Email templates customizable ✅

---

### Sprint 4.4: Multi-language Support (Days 75-77)

#### Backend Tasks
- [ ] **B4.4.1** - Set up i18n framework (2 hours)
  - File: `backend/src/config/i18n.js` (<100 lines)

- [ ] **B4.4.2** - Create translation files (4 hours)
  - File: `backend/src/locales/en.json` (<300 lines)
  - File: `backend/src/locales/es.json` (<300 lines)
  - File: `backend/src/locales/fr.json` (<300 lines)
  - File: `backend/src/locales/ar.json` (<300 lines)

#### Frontend Tasks
- [ ] **B4.4.3** - Set up react-i18next (2 hours)
  - File: `frontend/src/i18n.js` (<100 lines)

- [ ] **B4.4.4** - Create translation files (4 hours)
  - File: `frontend/src/locales/en/translation.json` (<400 lines)
  - File: `frontend/src/locales/es/translation.json` (<400 lines)
  - File: `frontend/src/locales/fr/translation.json` (<400 lines)

- [ ] **B4.4.5** - Create language switcher component (1 hour)
  - File: `frontend/src/components/common/LanguageSwitcher.jsx` (<100 lines)

- [ ] **B4.4.6** - Update all UI strings to use i18n (8 hours)
  - Modify existing pages to replace hardcoded text with translation keys

#### Testing
- [ ] **B4.4.7** - Create i18n tests (1 hour)
  - File: `frontend/test/i18n.test.js` (<150 lines)

**Sprint 4.4 Deliverable**: Multi-language support working ✅

---

## Phase B.6: Bulk Operations & Data Management (Week 9-10)

### Priority: 🟢 LOW (Efficiency improvements, not critical)

### Sprint 6.1: Bulk Import System (Days 78-81)

#### Backend Tasks
- [ ] **B6.1.1** - Create import template generator (2 hours)
  - File: `backend/src/services/importTemplateGenerator.js` (<200 lines)
  - Generate CSV templates for various entities

- [ ] **B6.1.2** - Create bulk import service (4 hours)
  - File: `backend/src/services/bulkImportService.js` (<400 lines)
  - Parse CSV, validate, batch insert

- [ ] **B6.1.3** - Create import history schema (1 hour)
  - File: `backend/src/models/ImportHistory.js` (<150 lines)

- [ ] **B6.1.4** - Create bulk import controller (3 hours)
  - File: `backend/src/controllers/bulkImportController.js` (<300 lines)

#### Frontend Tasks
- [ ] **B6.1.5** - Create bulk import page (4 hours)
  - File: `frontend/src/pages/admin/BulkImport.jsx` (<350 lines)
  - Select entity type, upload CSV, show preview

- [ ] **B6.1.6** - Create import preview component (2 hours)
  - File: `frontend/src/components/admin/ImportPreview.jsx` (<200 lines)

- [ ] **B6.1.7** - Create import history view (2 hours)
  - File: `frontend/src/components/admin/ImportHistory.jsx` (<200 lines)

#### Testing
- [ ] **B6.1.8** - Create bulk import tests (2 hours)
  - File: `backend/test/services/bulkImport.test.js` (<250 lines)

**Sprint 6.1 Deliverable**: Bulk import working ✅

---

### Sprint 6.2: Bulk Export System (Days 82-84)

#### Backend Tasks
- [ ] **B6.2.1** - Create bulk export service (3 hours)
  - File: `backend/src/services/bulkExportService.js` (<300 lines)
  - Support CSV and Excel formats

- [ ] **B6.2.2** - Create export controller (2 hours)
  - File: `backend/src/controllers/exportController.js` (<200 lines)

- [ ] **B6.2.3** - Create scheduled export job (2 hours)
  - File: `backend/src/jobs/scheduledExports.js` (<200 lines)
  - Email export file when ready

#### Frontend Tasks
- [ ] **B6.2.4** - Create bulk export page (3 hours)
  - File: `frontend/src/pages/admin/BulkExport.jsx` (<300 lines)
  - Select entity, filters, format

- [ ] **B6.2.5** - Add export buttons to list pages (2 hours)
  - Modify existing pages: Customers, Bookings, etc.

#### Testing
- [ ] **B6.2.6** - Create bulk export tests (1 hour)
  - File: `backend/test/services/bulkExport.test.js` (<200 lines)

**Sprint 6.2 Deliverable**: Bulk export working ✅

---

### Sprint 6.3: Data Validation & Cleanup (Days 85-87)

#### Backend Tasks
- [ ] **B6.3.1** - Create data validation service (3 hours)
  - File: `backend/src/services/dataValidation.js` (<300 lines)
  - Functions: `detectDuplicates()`, `normalizePhoneNumbers()`, `validateEmails()`

- [ ] **B6.3.2** - Create duplicate detection controller (2 hours)
  - File: `backend/src/controllers/dataQualityController.js` (<250 lines)

- [ ] **B6.3.3** - Create cleanup utilities (2 hours)
  - File: `backend/src/utils/dataCleanup.js` (<200 lines)
  - Remove orphaned records, fix inconsistencies

#### Frontend Tasks
- [ ] **B6.3.4** - Create data quality dashboard (3 hours)
  - File: `frontend/src/pages/admin/DataQuality.jsx` (<300 lines)
  - Show duplicate count, invalid records

- [ ] **B6.3.5** - Create merge duplicates interface (3 hours)
  - File: `frontend/src/components/admin/MergeDuplicates.jsx` (<300 lines)

#### Testing
- [ ] **B6.3.6** - Create data validation tests (2 hours)
  - File: `backend/test/services/dataValidation.test.js` (<200 lines)

**Sprint 6.3 Deliverable**: Data quality tools working ✅

---

### Sprint 6.4: Backup & Restore (Days 88-90)

#### Backend Tasks
- [ ] **B6.4.1** - Create backup service (3 hours)
  - File: `backend/src/services/backupService.js` (<300 lines)
  - MongoDB dump, compress, upload to S3

- [ ] **B6.4.2** - Create backup scheduler job (2 hours)
  - File: `backend/src/jobs/dailyBackup.js` (<150 lines)
  - Daily at 3 AM

- [ ] **B6.4.3** - Create restore service (3 hours)
  - File: `backend/src/services/restoreService.js` (<250 lines)

- [ ] **B6.4.4** - Create backup controller (2 hours)
  - File: `backend/src/controllers/backupController.js` (<200 lines)

#### Frontend Tasks
- [ ] **B6.4.5** - Create backup management page (3 hours)
  - File: `frontend/src/pages/admin/Backups.jsx` (<250 lines)
  - List backups, download, restore, trigger manual backup

#### Testing
- [ ] **B6.4.6** - Test disaster recovery procedure (4 hours)
  - Document: `docs/DISASTER-RECOVERY.md`
  - Test full restore from backup

**Sprint 6.4 Deliverable**: Automated backups and tested restore ✅

---

### Sprint 6.5: GDPR Compliance (Days 91-93)

#### Backend Tasks
- [ ] **B6.5.1** - Create data export for GDPR (2 hours)
  - File: `backend/src/services/gdprExport.js` (<200 lines)
  - Export all customer data in JSON format

- [ ] **B6.5.2** - Create data deletion service (3 hours)
  - File: `backend/src/services/gdprDeletion.js` (<250 lines)
  - Delete all PII, keep anonymized records for analytics

- [ ] **B6.5.3** - Create consent tracking schema (1 hour)
  - File: `backend/src/models/Consent.js` (<150 lines)

- [ ] **B6.5.4** - Create GDPR controller (2 hours)
  - File: `backend/src/controllers/gdprController.js` (<200 lines)

#### Frontend Tasks
- [ ] **B6.5.5** - Create GDPR request page (2 hours)
  - File: `frontend/src/pages/gdpr/DataRequest.jsx` (<200 lines)
  - Customer can request data export or deletion

- [ ] **B6.5.6** - Create cookie consent banner (1 hour)
  - File: `frontend/src/components/common/CookieConsent.jsx` (<150 lines)

- [ ] **B6.5.7** - Create data processing agreement template (2 hours)
  - File: `docs/DATA-PROCESSING-AGREEMENT.md`

#### Testing
- [ ] **B6.5.8** - Create GDPR tests (1 hour)
  - File: `backend/test/services/gdpr.test.js` (<200 lines)

**Sprint 6.5 Deliverable**: GDPR compliance tools functional ✅

---

## File Size Management Strategy

**Problem**: Large controller files (885 lines) violate <500 lines/file guideline

**Solution**: Refactor after Phase B completion

### Proposed File Splits

#### Current: `itineraryController.js` (885 lines)
**Split into**:
1. `itineraryController.js` (CRUD, template, archive) - ~350 lines
2. `itineraryDayController.js` (day management) - ~200 lines
3. `itineraryComponentController.js` (component management) - ~200 lines
4. `itineraryImportExportController.js` (import/export) - ~150 lines

#### Future: `agentCustomerController.js` (estimated 300 lines)
**If exceeds 500**:
1. Split into `agentCustomerController.js` (CRUD) and `agentCustomerImportController.js` (CSV import)

### File Creation Guidelines for Phase B
- **Target**: <300 lines per file (leaves room for growth)
- **Max**: 450 lines (before refactoring required)
- **Strategy**: Create separate service files for complex logic
- **Testing**: Every controller must have corresponding test file

---

## Testing Strategy

### Test Coverage Goals
- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows (agent quote request, supplier respond)

### Test File Structure
```
backend/test/
├── controllers/
│   ├── agent/
│   │   ├── agentCustomer.test.js
│   │   ├── quoteRequest.test.js
│   │   └── agentBooking.test.js
│   ├── supplier/
│   │   ├── rateSheet.test.js
│   │   ├── availability.test.js
│   │   └── supplierRequest.test.js
│   └── admin/
│       ├── pricing.test.js
│       └── workflow.test.js
├── services/
│   ├── pricingEngine.test.js
│   ├── workflowEngine.test.js
│   └── notificationService.test.js
├── middleware/
│   ├── agentAuth.test.js
│   └── supplierAuth.test.js
└── integration/
    ├── agentFlow.test.js
    └── supplierFlow.test.js

frontend/test/
├── components/
│   ├── agent/
│   └── supplier/
├── pages/
│   ├── agent/
│   └── supplier/
└── e2e/
    ├── agentQuoteRequest.spec.js
    └── supplierResponse.spec.js
```

### Test-Driven Development Workflow
1. **Write test first** (define expected behavior)
2. **Run test** (should fail - red)
3. **Write minimal code** to pass test
4. **Run test** (should pass - green)
5. **Refactor** code for quality
6. **Repeat** for next feature

---

## Deployment Strategy

### Staging Environment
- Deploy each sub-phase to staging for internal testing
- Operators test agent/supplier flows
- Fix bugs before production

### Production Rollout
- **Week 3**: B.1 (Agent Portal) to pilot agents (5-10 users)
- **Week 5**: B.2 (Supplier Portal) to pilot suppliers (3-5 users)
- **Week 7**: B.3 (Pricing Engine) to all users
- **Week 9**: B.4-B.6 features to all users

### Post-Launch Support
- **Week 1-2**: Daily monitoring, rapid bug fixes
- **Week 3-4**: Weekly check-ins with pilot users
- **Month 2**: Gather feedback, iterate on UI/UX

---

## Success Metrics

### Agent Portal Success
- **Adoption**: 80% of agents actively using portal by Month 2
- **Self-Service**: 70% of customer management done by agents (not operators)
- **Quote Requests**: 50+ requests per month

### Supplier Portal Success
- **Onboarding**: 20+ suppliers active by Month 2
- **Rate Updates**: 90% of rate updates done by suppliers
- **Response Time**: Average supplier response <24 hours

### Pricing Engine Success
- **Revenue Optimization**: 5-10% revenue increase from dynamic pricing
- **Commission Automation**: 100% of commissions calculated automatically
- **Promo Code Usage**: 15% of bookings use promo codes

### Automation Success
- **Manual Work Reduction**: 50% reduction in manual notifications
- **Response Time**: 90% of payment reminders sent on time
- **Task Completion**: 80% of tasks completed before due date

---

## Risk Mitigation

### High-Risk Areas
1. **Agent Adoption Resistance**
   - Mitigation: Training videos, support chat, phased rollout
   
2. **Supplier Onboarding Complexity**
   - Mitigation: Simplified onboarding flow, dedicated support, setup assistance
   
3. **Pricing Engine Performance**
   - Mitigation: Caching, query optimization, load testing
   
4. **Data Migration Issues**
   - Mitigation: Dry-run imports, rollback plan, data validation

### Technical Debt Management
- **Refactor large files** after Phase B completion
- **Optimize slow queries** identified during load testing
- **Update dependencies** quarterly
- **Security audit** before production launch

---

## Next Steps After Phase B

### Phase C: AI & Advanced Integrations (Week 11-16)
- AI itinerary generation
- Chatbot for customer support
- Payment gateway integrations
- Booking.com / Expedia API integrations
- WhatsApp / SMS automation

### Phase D: Mobile Apps (Week 17-24)
- React Native mobile app for agents
- Push notifications
- Offline mode
- Mobile-optimized customer booking flow

---

## Estimated Team Requirements

### For 8-10 Week Timeline
- **Backend Developer**: 1 full-time (Node.js, MongoDB, REST API)
- **Frontend Developer**: 1 full-time (React, TailwindCSS)
- **QA Engineer**: 0.5 full-time (manual + automated testing)
- **DevOps**: 0.25 part-time (deployment, CI/CD)
- **Product Manager**: 0.25 part-time (requirements, user acceptance)

### Alternative: Solo Developer
- Extend timeline to 12-14 weeks
- Focus on one sub-phase at a time
- Use existing test automation to reduce QA time

---

## Prioritized Todo Summary

### 🔴 CRITICAL (Start Immediately)
1. **B.1** - Agent Portal (Week 1-3) - 46 tasks
   - Enable revenue generation through agent self-service

### 🟠 HIGH (Start Week 3)
2. **B.2** - Supplier Portal (Week 3-5) - 37 tasks
   - Reduce operator burden for rate updates
3. **B.3** - Pricing Engine (Week 5-7) - 28 tasks
   - Optimize revenue and automate commission

### 🟡 MEDIUM (Start Week 7)
4. **B.5** - Workflow Automation (Week 7-8) - 24 tasks
   - Reduce manual work, improve response time
5. **B.4** - PDF & Email Templates (Week 8-9) - 23 tasks
   - Professional polish and multi-language support

### 🟢 LOW (Start Week 9)
6. **B.6** - Bulk Operations (Week 9-10) - 22 tasks
   - Efficiency improvements, GDPR compliance

---

**Total Tasks**: 180+  
**Total Estimated Duration**: 8-10 weeks (solo) or 6-8 weeks (team)  
**Files to Create**: ~200 new files  
**Lines of Code (Estimated)**: 45,000-50,000 lines

---

**Last Updated**: Current Session  
**Status**: Ready to Begin Phase B.1 🚀
