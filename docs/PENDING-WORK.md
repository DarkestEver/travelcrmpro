# 📋 Pending Work - Travel CRM

**Date Created:** November 6, 2025  
**Status:** 30 Items Identified  
**Category:** Feature Completion & Enhancement

---

## 📊 Summary

After comprehensive analysis of the codebase, documentation, and requirements, **30 pending items** have been identified and prioritized. These items will transform the Travel CRM from a solid MVP with advanced features to a fully-featured enterprise platform.

### Current Completion Status

| Category | Complete | Pending | Completion % |
|----------|----------|---------|--------------|
| **Backend APIs** | 74 endpoints | 0 | 100% ✅ |
| **Backend Services** | 7 services | 0 | 100% ✅ |
| **Frontend Pages** | 3 complete | 6 pending | 33% ⚠️ |
| **Components** | 8 | 14 pending | 36% ⚠️ |
| **Testing** | 0% | 100% | 0% ❌ |
| **Documentation** | API Docs | Swagger UI | 50% ⚠️ |
| **Production Features** | Core | Advanced | 60% ⚠️ |

**Overall Completion: ~65%**

---

## 🎯 Priority Breakdown

### 🔴 CRITICAL (P0) - Must Complete for Production
**8 items - Essential for basic functionality**

1. **Complete Customers Page** - Core entity, referenced by quotes/bookings
2. **Complete Suppliers Page** - Core entity, needed for itineraries
3. **Complete Itineraries Page** - Central to business model
4. **Complete Quotes Page** - Revenue generation workflow
5. **Complete Bookings Page** - Final transaction management
6. **Complete Profile Page** - User account management
7. **Write Unit Tests** - Production readiness requirement
8. **Setup Database Backups** - Data protection critical

### 🟡 HIGH (P1) - Should Complete Soon
**10 items - Significantly improves usability**

9. **Real-time Notifications UI** - Already built backend, needs frontend
10. **Analytics Dashboard** - Business intelligence (backend ready)
11. **Bulk Operations** - Efficiency for large datasets
12. **Advanced Filters** - Improves search/discovery
13. **Form Validation Library** - Better UX and data quality
14. **Loading States & Skeletons** - Professional user experience
15. **Error Boundary** - Graceful error handling
16. **Export Functionality** - Data portability needed
17. **Email Templates** - Professional communication
18. **Rate Limiting** - Security and resource protection

### 🟢 MEDIUM (P2) - Nice to Have
**8 items - Enhances platform value**

19. **Reports Page** - Business reporting needs
20. **Settings Page** - System configuration
21. **Audit Logs Page** - Compliance requirement
22. **Help/Support Section** - User onboarding
23. **Dashboard Widgets** - Customization
24. **Search Functionality** - Quick navigation
25. **Swagger/API Documentation** - Developer experience
26. **Frontend Component Tests** - Quality assurance

### 🔵 LOW (P3) - Future Enhancement
**4 items - Polish and advanced features**

27. **File Upload Component** - Rich media support
28. **Calendar View** - Alternative visualization
29. **Dark Mode** - User preference
30. **Monitoring & Logging** - Operations visibility

---

## 📁 Detailed Pending Items

### 1. Frontend Pages (6 pending)

#### ❌ **Customers.jsx** - Currently placeholder
**Current State:**
```jsx
<p className="text-gray-600">Customer management coming soon...</p>
```

**Needs:**
- DataTable with pagination, search, filters
- Create/Edit customer modal with form validation
- Fields: name, email, phone, address, preferences, assigned agent
- Delete confirmation dialog
- Customer details modal/drawer
- Status badges (active/inactive)
- Contact actions (email, call)
- Spending analytics cards
- Export customers to CSV

**Related APIs:** Already built (9 endpoints)
- GET /api/customers
- POST /api/customers
- GET /api/customers/:id
- PUT /api/customers/:id
- DELETE /api/customers/:id
- GET /api/customers/:id/bookings
- GET /api/customers/:id/quotes
- POST /api/customers/import
- GET /api/customers/export

---

#### ❌ **Suppliers.jsx** - Currently placeholder
**Current State:**
```jsx
<p className="text-gray-600">Supplier management coming soon...</p>
```

**Needs:**
- Complete CRUD similar to Agents page
- DataTable with advanced features
- Create/Edit supplier form
- Fields: company name, contact person, email, phone, country, service type (hotel/transport/activities), rating, commission rate, payment terms
- Approve/Suspend/Reactivate actions (workflow)
- Status badges (pending/active/suspended/inactive)
- Tier badges (bronze/silver/gold/platinum)
- Performance metrics cards (response time, fulfillment rate, rating)
- Delete confirmation
- Commission rate display
- Contact details display

**Related APIs:** Already built (9 endpoints)
- GET /api/suppliers
- POST /api/suppliers
- GET /api/suppliers/:id
- PUT /api/suppliers/:id
- DELETE /api/suppliers/:id
- POST /api/suppliers/:id/approve
- POST /api/suppliers/:id/suspend
- POST /api/suppliers/:id/reactivate
- GET /api/suppliers/:id/bookings

---

#### ❌ **Itineraries.jsx** - Currently placeholder
**Current State:**
```jsx
<p className="text-gray-600">Itinerary builder coming soon...</p>
```

**Needs:**
- DataTable listing all itineraries
- Create/Edit itinerary form with:
  - Basic info: title, destination, duration, price
  - Accommodation details with supplier link
  - Transport details with supplier link
  - Activities/sightseeing with day-by-day planner
  - Inclusions/exclusions lists
  - Terms and conditions
  - Images/gallery
- Day-by-day itinerary builder (drag-and-drop optional)
- Duplicate itinerary action
- Publish/Unpublish toggle
- Delete with confirmation
- Preview modal with formatted display
- Generate PDF button (backend ready)
- Assign to quotes
- Search and filters (destination, duration, price range)
- Status: draft/published/archived

**Related APIs:** Already built (10 endpoints)
- GET /api/itineraries
- POST /api/itineraries
- GET /api/itineraries/:id
- PUT /api/itineraries/:id
- DELETE /api/itineraries/:id
- POST /api/itineraries/:id/duplicate
- POST /api/itineraries/:id/publish
- POST /api/itineraries/:id/unpublish
- GET /api/itineraries/:id/quotes
- POST /api/itineraries/:id/generate-pdf

---

#### ❌ **Quotes.jsx** - Currently placeholder
**Current State:**
```jsx
<p className="text-gray-600">Quote management coming soon...</p>
```

**Needs:**
- DataTable with advanced filters
- Filters: status (draft/sent/accepted/rejected/expired), date range, agent, customer
- Create/Edit quote form with:
  - Customer selection (searchable dropdown)
  - Itinerary selection
  - Pricing breakdown (base price, markup, taxes, total)
  - Validity date picker
  - Special notes/terms
  - Payment terms
- Quote status workflow management
- Status badges with colors
- Convert to booking button (for accepted quotes)
- Send email action (with template preview)
- Generate PDF button (backend ready)
- Delete with confirmation
- Duplicate quote action
- Pricing calculator component (auto-calculate markup, taxes)
- Quote history/versions
- Follow-up reminders

**Related APIs:** Already built (9 endpoints)
- GET /api/quotes
- POST /api/quotes
- GET /api/quotes/:id
- PUT /api/quotes/:id
- DELETE /api/quotes/:id
- POST /api/quotes/:id/send
- POST /api/quotes/:id/accept
- POST /api/quotes/:id/reject
- POST /api/quotes/:id/convert-to-booking

---

#### ❌ **Bookings.jsx** - Currently placeholder
**Current State:**
```jsx
<p className="text-gray-600">Booking management coming soon...</p>
```

**Needs:**
- DataTable with advanced filters
- Filters: status, date range, agent, customer, destination
- View booking details in modal/drawer:
  - Customer info
  - Itinerary details
  - Quote reference
  - Payment tracking (paid, pending, refunded)
  - Traveler details
  - Special requests
  - Booking notes
- Booking status management (pending → confirmed → completed → cancelled)
- Status badges with timeline
- Payment tracking component:
  - Payment history table
  - Add payment modal
  - Partial payment support
  - Payment method tracking
  - Receipt generation
- Generate voucher PDF button (backend ready)
- Send confirmation email action
- Cancel booking with reason modal
- Refund management
- Add/edit traveler details form
- Booking timeline/history (audit trail)
- Supplier confirmation tracking
- Export bookings

**Related APIs:** Already built (9 endpoints)
- GET /api/bookings
- POST /api/bookings
- GET /api/bookings/:id
- PUT /api/bookings/:id
- DELETE /api/bookings/:id
- POST /api/bookings/:id/confirm
- POST /api/bookings/:id/cancel
- POST /api/bookings/:id/add-payment
- POST /api/bookings/:id/generate-voucher

---

#### ❌ **Profile.jsx** - Currently placeholder
**Current State:**
```jsx
<p className="text-gray-600">Profile settings coming soon...</p>
```

**Needs:**
- Tabbed interface (Personal Info, Security, Preferences, Activity)
- **Personal Info Tab:**
  - View/edit form: name, email, phone, address
  - Upload profile picture with crop tool
  - Image preview
  - Save changes button
- **Security Tab:**
  - Change password form with strength meter
  - Current password, new password, confirm password
  - Two-factor authentication setup (QR code)
  - Active sessions list with device info
  - Logout all devices button
  - Login history table
- **Preferences Tab:**
  - Notification preferences checkboxes (email, in-app, SMS, push)
  - Notification types (bookings, quotes, messages, system)
  - Timezone dropdown
  - Language selection
  - Date format preference
  - Currency preference
- **Activity Tab:**
  - Recent activity log table
  - Actions performed
  - IP address tracking
  - Export activity log
- Delete account option (with confirmation)

**Related APIs:** Profile endpoints available via /api/auth/profile

---

### 2. Components (14 pending)

#### ❌ **Notification UI in Header**
**Backend:** ✅ Complete (notificationService.js + routes)
**Frontend:** ❌ Missing

**Needs:**
- Bell icon with unread count badge in Header.jsx
- Dropdown panel (similar to user menu)
- List recent notifications (5-10)
- Notification item with:
  - Icon based on type
  - Title and message
  - Time ago (e.g., "2 hours ago")
  - Read/unread indicator
  - Click to navigate to related page
- Mark as read action
- Mark all as read button
- View all notifications link → new Notifications page
- WebSocket integration for live updates
- Sound/desktop notification with permission request
- Empty state when no notifications

---

#### ❌ **Analytics Dashboard Page**
**Backend:** ✅ Complete (analyticsService.js + 8 endpoints)
**Frontend:** ❌ Missing

**Needs:**
- Chart library integration (Chart.js or Recharts)
- Key metrics cards at top:
  - Total revenue with trend indicator
  - Total bookings count
  - Conversion rate percentage
  - Average booking value
- Revenue chart (line graph by month)
- Booking trends (bar chart by month/week)
- Conversion funnel visualization (quotes → bookings)
- Top performing agents table (top 10)
- Customer analytics (pie chart by region or segment)
- Date range filter (preset: today, this week, this month, custom)
- Comparison toggle (vs last period)
- Export to CSV/PDF buttons
- Auto-refresh toggle
- Responsive grid layout

**Related APIs:** Already built
- GET /api/analytics/dashboard
- GET /api/analytics/trends
- GET /api/analytics/revenue-breakdown
- GET /api/analytics/top-agents
- GET /api/analytics/customers
- GET /api/analytics/conversion-funnel

---

#### ❌ **Bulk Operations**
**Needs:**
- Enhance DataTable.jsx with:
  - Checkbox column (first column)
  - Select all checkbox in header
  - Selected items count display
  - Bulk actions dropdown (delete, export, change status, etc.)
  - Confirmation dialog showing affected item count
  - Progress indicator for bulk operations
  - Success/error toast with results
- Backend: Add batch API endpoints
  - POST /api/[resource]/bulk-delete
  - POST /api/[resource]/bulk-update
  - POST /api/[resource]/bulk-export
- Error handling (partial success scenarios)

---

#### ❌ **Advanced Filters Component**
**Needs:**
- Create new `<FilterPanel>` component
- Multi-select dropdown for status
- Date range picker (from/to dates)
- Search across multiple fields
- Dropdowns for related entities (agent, customer, supplier)
- Clear all filters button
- Active filter chips display
- Filter count badge
- Save filter presets (name and save current filters)
- Responsive: drawer on mobile, panel on desktop
- Apply filters button with loading state

---

#### ❌ **Reports Page**
**Backend:** Partially ready (analytics endpoints can be used)
**Frontend:** ❌ Missing

**Needs:**
- Report templates dropdown:
  - Bookings Report
  - Revenue Report
  - Agent Performance Report
  - Customer Analytics Report
  - Supplier Performance Report
- Parameter form for each report type
- Date range selection
- Additional filters (agent, status, etc.)
- Format selection (PDF, Excel, CSV)
- Generate report button
- Schedule report option (daily/weekly/monthly email)
- Report history table (previous reports)
- Download/view previous reports
- Email report option
- Preview before download

---

#### ❌ **Settings Page (Admin Only)**
**Needs:**
- Multi-tab layout
- **Company Tab:**
  - Company name, logo upload, contact info
  - Address, phone, email, website
  - Branding colors
- **Email Tab:**
  - SMTP configuration (host, port, username, password, encryption)
  - Test email button
  - Email templates editor (with variable placeholders)
  - Template preview
- **Payment Tab:**
  - Payment gateway settings (Stripe keys)
  - Supported currencies
  - Tax configuration (GST/VAT rates)
- **Bookings Tab:**
  - Auto-confirm bookings toggle
  - Quote validity days
  - Booking expiry reminder days
  - Cancellation policy
- **Notifications Tab:**
  - Enable/disable notification types
  - Notification frequency settings
  - SMS gateway settings (optional)
- **Permissions Tab:**
  - Role permissions matrix (CRUD for each resource by role)
  - Save permissions button
- **System Tab:**
  - Date format dropdown
  - Timezone dropdown
  - Default language
  - Maintenance mode toggle

---

#### ❌ **Audit Logs Page**
**Backend:** ✅ Audit logging exists (AuditLog model)
**Frontend:** ❌ Missing

**Needs:**
- DataTable showing all audit logs
- Columns: timestamp, user, action, resource, resourceId, IP, status
- Filters:
  - User dropdown (all users)
  - Action dropdown (create/update/delete/login/logout)
  - Resource dropdown (Customer/Booking/Quote/etc)
  - Date range
  - Search by resourceId
- Severity badges (info/warning/error/critical)
- Detailed view modal:
  - Full action details
  - Before/after data comparison (if available)
  - Stack trace (for errors)
- Export audit logs to CSV
- Automatic cleanup settings (e.g., delete logs older than 1 year)
- Highlight critical actions (delete, permission changes)

**Related API:** GET /api/audit-logs (needs to be created)

---

#### ❌ **Help/Support Section**
**Needs:**
- New route /help
- **FAQ Tab:**
  - Searchable accordion
  - Categories: Getting Started, Bookings, Payments, Account, Technical
  - Expandable Q&A items
- **Guides Tab:**
  - Role-specific tabs (Admin, Operator, Agent, Supplier)
  - Step-by-step guides with screenshots
  - Video tutorial embeds (YouTube/Vimeo)
- **Contact Tab:**
  - Contact support form (name, email, subject, message, file attachment)
  - Submit ticket button
  - Live chat widget integration (optional - Intercom/Zendesk)
- **Keyboard Shortcuts Modal:**
  - Triggered by ? key
  - List all shortcuts
  - Grouped by category
- **What's New:**
  - Changelog page with version history
  - Feature highlights
  - Release notes
- **Onboarding Tour:**
  - Optional guided tour for new users (react-joyride)
  - Skip/next buttons
  - Complete tour to not show again

---

#### ❌ **Form Validation with Yup**
**Needs:**
- Install `yup` and `react-hook-form`
- Create validation schemas for all forms:
  - agentSchema.js
  - customerSchema.js
  - supplierSchema.js
  - itinerarySchema.js
  - quoteSchema.js
  - bookingSchema.js
- Update all forms to use react-hook-form
- Real-time validation (on blur)
- Inline error messages with icons
- Form dirty state tracking
- Unsaved changes warning dialog
- Field-level help text/tooltips
- Conditional field validation
- Async validation (check email uniqueness)
- Custom validation error messages

---

#### ❌ **Loading States & Skeletons**
**Needs:**
- Create Skeleton components:
  - TableSkeleton (for DataTable)
  - CardSkeleton (for dashboard cards)
  - FormSkeleton (for loading forms)
- Shimmer animation effect
- Loading spinners for buttons (save, delete)
- Progress bars for file uploads
- Optimistic UI updates where appropriate
- Disable forms during submission
- Full-page loading overlay for critical operations
- Retry button on error states
- Timeout handling (show error after 30s)

---

#### ❌ **Error Boundary Component**
**Needs:**
- Create ErrorBoundary.jsx component
- Wrap App.jsx with ErrorBoundary
- Custom error fallback UI:
  - Error illustration/icon
  - User-friendly message ("Something went wrong")
  - Error details in dev mode (stack trace)
  - "Report Problem" button → sends error to backend
  - "Reset" button → resets component state
  - "Go Home" button
- Log errors to console (dev) and backend (production)
- Different error pages:
  - 404 Not Found (styled page)
  - 403 Forbidden (styled page)
  - 500 Server Error (styled page)
- Network error detection with retry option

---

#### ❌ **Dashboard Widgets System**
**Needs:**
- Make Dashboard.jsx customizable
- Drag-and-drop widget grid (react-grid-layout)
- Widget library modal:
  - KPI cards (revenue, bookings, customers, etc.)
  - Charts (revenue chart, booking trends)
  - Tables (recent bookings, top agents)
  - Quick actions (create booking, create quote)
- Add widget button (opens widget library)
- Remove widget button (on each widget)
- Widget settings icon (configure refresh rate, size)
- Save layout button (persist to backend per user)
- Reset to default button
- Multiple dashboard tabs (optional)
- Real-time widget updates via WebSocket
- Responsive grid (rearranges on mobile)

---

#### ❌ **Export Functionality**
**Needs:**
- Add export button to DataTable.jsx
- Export options dropdown:
  - Export current view (with applied filters)
  - Export selected rows
  - Export all data
- Format selection: CSV, Excel, PDF
- Column selection (choose which columns to export)
- Export templates (save column selections)
- Background export for large datasets:
  - Show progress bar
  - Email when complete
  - Download link in notifications
- Export history page (list of past exports)
- Automatic file cleanup (delete after 7 days)
- Backend: Enhance analytics export endpoint

---

#### ❌ **Global Search**
**Needs:**
- Add search bar to Header.jsx (center or right side)
- Keyboard shortcut: Ctrl+K (or Cmd+K on Mac)
- Search modal/dropdown overlay
- Search input with icon
- Search across all entities:
  - Customers (name, email)
  - Bookings (booking ID, customer name)
  - Quotes (quote ID, customer name)
  - Itineraries (title, destination)
  - Agents (name, email)
  - Suppliers (company name)
- Recent searches list (persist in localStorage)
- Search suggestions/autocomplete
- Search results grouped by category with icons
- Click result to navigate to detail page
- Empty state with helpful text
- ESC to close search
- Backend: Add search API endpoint
  - GET /api/search?q=term

---

#### ❌ **File Upload Component**
**Backend:** ✅ Ready (fileStorageService.js)
**Frontend:** ❌ Missing

**Needs:**
- Create FileUpload.jsx component
- Drag-and-drop zone with dashed border
- Click to browse files
- Multiple file selection
- File type validation (image, pdf, doc)
- File size validation with user-friendly messages
- Upload progress bars (one per file)
- Image preview thumbnails
- PDF/doc file icons
- Remove file button (before upload)
- Upload error handling with retry
- Compress images before upload (browser API)
- Integration with backend file storage service
- Use in Profile (avatar), Itineraries (images), Settings (logo)

**Related APIs:**
- POST /api/files/upload (needs to be created)
- GET /api/files/:id
- DELETE /api/files/:id

---

#### ❌ **Calendar View Component**
**Needs:**
- New route: /calendar
- Calendar library (FullCalendar or react-big-calendar)
- View toggles: Month, Week, Day, Agenda
- Color-coded events by status:
  - Confirmed bookings (green)
  - Pending bookings (yellow)
  - Cancelled (red)
  - Itineraries (blue)
- Click event to view details in modal
- Drag-and-drop to reschedule (with confirmation)
- Filter by agent, status, destination
- Mini calendar for date navigation
- Today button to jump to current date
- Event tooltips on hover
- Legend showing color codes
- Export calendar as PDF or ICS file

---

#### ❌ **Dark Mode**
**Needs:**
- Theme toggle button in Header (sun/moon icon)
- Persist preference in localStorage
- CSS variables for theming:
  - Define in index.css
  - --bg-primary, --bg-secondary, --text-primary, etc.
  - Light and dark palettes
- Update all components to use CSS variables
- Smooth theme transition animation
- Chart color schemes for both themes
- System preference detection (prefers-color-scheme)
- Theme preview before applying (optional)
- Update Tailwind config for dark mode support

---

### 3. Backend Enhancements (7 pending)

#### ❌ **Swagger/OpenAPI Documentation**
**Backend:** Dependencies added (swagger-ui-express, swagger-jsdoc)
**Implementation:** ❌ Missing

**Needs:**
- Configure Swagger in server.js
- Serve Swagger UI at /api-docs
- Create swagger config file:
  - API info (title, version, description)
  - Servers (local, staging, production)
  - Security schemes (JWT bearer token)
- Add JSDoc comments to all routes with @swagger tags
- Document request/response schemas
- Add example requests and responses
- Group endpoints by resource (Auth, Agents, Customers, etc.)
- Add authentication documentation
- Document error response codes (400, 401, 403, 404, 500)
- Test API directly from Swagger UI

**Example:**
```javascript
/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
```

---

#### ❌ **Unit Tests for Backend Services**
**Testing:** Framework ready in CI/CD, but no tests written

**Needs:**
- Install test dependencies (already in package.json):
  - jest
  - supertest
  - mongodb-memory-server (for testing)
- Create test files for all services:
  - `__tests__/services/pdfService.test.js`
  - `__tests__/services/notificationService.test.js`
  - `__tests__/services/analyticsService.test.js`
  - `__tests__/services/websocketService.test.js`
  - `__tests__/services/fileStorageService.test.js`
- Mock external dependencies:
  - Puppeteer (for PDF tests)
  - Redis (use redis-mock)
  - MongoDB (use mongodb-memory-server)
  - Nodemailer (mock email sending)
- Test cases for each service:
  - Success scenarios
  - Error scenarios
  - Edge cases (null inputs, empty arrays)
  - Async operations
  - Data validation
- Integration tests for API endpoints:
  - `__tests__/api/auth.test.js`
  - `__tests__/api/customers.test.js`
  - etc.
- Achieve >80% code coverage
- Run tests in CI/CD (already configured)

**Commands:**
```bash
npm test
npm run test:coverage
```

---

#### ❌ **Frontend Component Tests**
**Testing:** Vitest configured but no tests written

**Needs:**
- Install dependencies (already in package.json):
  - @testing-library/react
  - @testing-library/jest-dom
  - @testing-library/user-event
  - vitest
- Create test files for all components:
  - `src/components/__tests__/DataTable.test.jsx`
  - `src/components/__tests__/Modal.test.jsx`
  - `src/components/__tests__/ConfirmDialog.test.jsx`
- Test cases:
  - Render without crashing
  - Props handling
  - User interactions (clicks, form inputs)
  - Conditional rendering
  - Event handlers
- Test pages:
  - `src/pages/__tests__/Agents.test.jsx`
  - Test CRUD operations
  - Test React Query mutations
- Test hooks:
  - Mock React Query with QueryClient
  - Mock API responses
- Test routing:
  - Protected routes
  - Navigation
- Accessibility tests:
  - Install jest-axe
  - Test for a11y violations
- E2E tests (optional):
  - Install Playwright
  - Test critical user flows
  - Login → Create Booking → View Booking

**Commands:**
```bash
npm run test
npm run test:ui
npm run test:coverage
```

---

#### ❌ **Monitoring & Logging**
**Current:** Basic console.log
**Needs:** Production-grade logging

**Needs:**
- Configure Winston for structured logging:
  - Log levels: error, warn, info, debug
  - Separate log files (error.log, combined.log)
  - Log rotation (daily or by size)
  - JSON format for parsing
- Add request logging middleware (morgan already installed)
- Error tracking service integration:
  - Sentry (recommended)
  - Rollbar
  - Bugsnag
- Performance monitoring:
  - Response time tracking
  - Slow query logging
  - Memory usage monitoring
- Uptime monitoring:
  - Pingdom
  - UptimeRobot
- Alert rules:
  - Error rate > threshold
  - Response time > 5s
  - Server down
- Custom metrics dashboard
- Log aggregation (optional):
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Splunk
- Health check endpoints:
  - GET /health (simple)
  - GET /health/ready (with DB check)
  - GET /health/live (for Kubernetes)

---

#### ❌ **Email Templates**
**Current:** Basic text emails from notificationService.js
**Needs:** Professional HTML templates

**Needs:**
- Create email template files in `/backend/src/templates/`:
  - welcome.html - New user welcome
  - booking-confirmation.html - Booking confirmed
  - payment-receipt.html - Payment received
  - quote-sent.html - Quote sent to customer
  - booking-reminder.html - Pre-trip reminder
  - password-reset.html - Password reset link
  - agent-approval.html - Agent approved
  - supplier-invitation.html - Supplier invitation
- HTML responsive templates:
  - Mobile-friendly design
  - Inline CSS (email clients don't support external CSS)
  - Company branding (logo, colors)
  - Call-to-action buttons
  - Social media links in footer
  - Unsubscribe link
- Plain text fallback for each template
- Variable interpolation:
  - {{userName}}, {{bookingId}}, {{amount}}, etc.
- Use email template engine:
  - Handlebars
  - EJS
  - Pug
- Preview route for development:
  - GET /api/email-preview/:template
- Test email sending with Mailtrap (development)

**Example Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    /* Inline styles */
  </style>
</head>
<body>
  <div class="container">
    <img src="{{logoUrl}}" alt="Logo">
    <h1>Booking Confirmed!</h1>
    <p>Dear {{customerName}},</p>
    <p>Your booking {{bookingId}} has been confirmed.</p>
    <!-- More content -->
  </div>
</body>
</html>
```

---

#### ❌ **Rate Limiting**
**Current:** No rate limiting
**Needs:** Protection against abuse

**Needs:**
- Install express-rate-limit (may already be in dependencies)
- Configure rate limiter:
  - Different limits by endpoint type
  - Auth endpoints: 5 requests/min (prevent brute force)
  - API endpoints: 100 requests/min
  - File uploads: 10 requests/min
- IP-based rate limiting
- Authenticated user limits (higher than anonymous)
- Rate limit headers in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
- Return 429 status code when exceeded
- Include Retry-After header
- Store limit data in Redis (distributed rate limiting)
- Whitelist IPs for admin/internal use
- Log rate limit violations
- Alert on suspicious activity
- Rate limit bypass for health checks

**Implementation:**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', authLimiter);
```

---

#### ❌ **Database Backups**
**Current:** No automated backups
**Needs:** Data protection strategy

**Needs:**
- Automated backup script:
  - Use mongodump utility
  - Cron job for daily backups (3 AM)
  - Backup to local folder first
- Backup retention policy:
  - Keep 7 daily backups
  - Keep 4 weekly backups (every Sunday)
  - Keep 3 monthly backups (1st of month)
  - Delete older backups
- Cloud storage upload:
  - AWS S3
  - Google Cloud Storage
  - Azure Blob Storage
- Backup encryption (optional):
  - Encrypt backup files before upload
  - Store encryption key securely
- Point-in-time recovery:
  - MongoDB oplog backup
  - Enable for critical data
- Backup verification:
  - Test restore on staging monthly
  - Automated restore test
- Restore procedure documentation:
  - Step-by-step guide
  - Recovery time objective (RTO): 4 hours
  - Recovery point objective (RPO): 1 hour
- Backup monitoring:
  - Alert if backup fails
  - Alert if backup size unusual
  - Dashboard showing backup status
- Backup size optimization:
  - Compress backups (gzip)
  - Incremental backups (after first full backup)

**Backup Script Example:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mongodump --uri="mongodb://localhost:27017/travelcrm" --out="$BACKUP_DIR/$DATE"
tar -czf "$BACKUP_DIR/$DATE.tar.gz" "$BACKUP_DIR/$DATE"
rm -rf "$BACKUP_DIR/$DATE"
# Upload to S3
aws s3 cp "$BACKUP_DIR/$DATE.tar.gz" s3://bucket/backups/
# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

---

## 🗂️ File Structure for Pending Items

```
frontend/src/
├── pages/
│   ├── Customers.jsx ❌ (rewrite)
│   ├── Suppliers.jsx ❌ (rewrite)
│   ├── Itineraries.jsx ❌ (rewrite)
│   ├── Quotes.jsx ❌ (rewrite)
│   ├── Bookings.jsx ❌ (rewrite)
│   ├── Profile.jsx ❌ (rewrite)
│   ├── Analytics.jsx ❌ (create)
│   ├── Reports.jsx ❌ (create)
│   ├── Settings.jsx ❌ (create)
│   ├── AuditLogs.jsx ❌ (create)
│   ├── Help.jsx ❌ (create)
│   ├── Notifications.jsx ❌ (create)
│   └── Calendar.jsx ❌ (create)
│
├── components/
│   ├── FileUpload.jsx ❌ (create)
│   ├── FilterPanel.jsx ❌ (create)
│   ├── ErrorBoundary.jsx ❌ (create)
│   ├── Skeleton.jsx ❌ (create)
│   └── widgets/ ❌ (create folder)
│       ├── RevenueWidget.jsx
│       ├── BookingsWidget.jsx
│       └── QuickActionsWidget.jsx
│
└── utils/
    ├── formSchemas.js ❌ (create - Yup schemas)
    └── theme.js ❌ (create - Dark mode)

backend/src/
├── routes/
│   ├── fileRoutes.js ❌ (create)
│   ├── searchRoutes.js ❌ (create)
│   └── auditRoutes.js ❌ (create)
│
├── templates/ ❌ (create folder)
│   ├── welcome.html
│   ├── booking-confirmation.html
│   ├── payment-receipt.html
│   └── ...
│
├── config/
│   ├── swagger.js ❌ (create)
│   └── logger.js ❌ (create - Winston)
│
├── middleware/
│   └── rateLimiter.js ❌ (create)
│
├── scripts/
│   ├── backup.sh ❌ (create)
│   └── restore.sh ❌ (create)
│
└── __tests__/ ❌ (create folder)
    ├── services/
    ├── api/
    └── utils/
```

---

## 📅 Suggested Implementation Timeline

### Week 1: Critical Pages (P0)
- Day 1-2: Customers page
- Day 3-4: Suppliers page
- Day 5: Profile page

### Week 2: Core Business Pages (P0)
- Day 1-2: Itineraries page
- Day 3-4: Quotes page
- Day 5: Bookings page

### Week 3: UX & Components (P1)
- Day 1: Notifications UI + Real-time
- Day 2: Form validation (Yup)
- Day 3: Loading states & Skeletons
- Day 4: Error boundaries
- Day 5: Bulk operations

### Week 4: Analytics & Reporting (P1)
- Day 1-2: Analytics Dashboard
- Day 3: Advanced filters
- Day 4: Export functionality
- Day 5: Reports page

### Week 5: Admin & Settings (P2)
- Day 1-2: Settings page
- Day 3: Audit logs
- Day 4: Help/Support section
- Day 5: Dashboard widgets

### Week 6: Testing & Quality (P0-P1)
- Day 1-2: Backend unit tests
- Day 3-4: Frontend component tests
- Day 5: E2E tests for critical flows

### Week 7: Backend Enhancements (P1)
- Day 1: Swagger/API docs
- Day 2: Email templates
- Day 3: Rate limiting
- Day 4: Monitoring & Logging
- Day 5: Database backups

### Week 8: Polish & Extras (P2-P3)
- Day 1: Global search
- Day 2: File upload component
- Day 3: Calendar view
- Day 4: Dark mode
- Day 5: Final testing & bug fixes

**Total: 8 weeks (2 months) for 100% completion**

---

## 🎯 Success Criteria

When all 30 items are complete, the system will have:

✅ **Complete Frontend** - All 10 pages fully functional with CRUD  
✅ **Professional UX** - Loading states, error handling, validation  
✅ **Rich Components** - Filters, bulk ops, search, exports, calendar  
✅ **Full Testing** - >80% coverage, unit + integration + E2E  
✅ **Production Ready** - Monitoring, logging, backups, rate limiting  
✅ **Developer Experience** - API docs, tests, good code organization  
✅ **Enterprise Features** - Analytics, reports, audit logs, settings  

**Result:** A truly enterprise-grade, production-ready Travel CRM platform that can be deployed and scaled with confidence.

---

## 📞 Next Steps

1. **Review this document** - Prioritize based on business needs
2. **Start with P0 items** - Critical pages first (Customers, Suppliers, etc.)
3. **One item at a time** - Mark in-progress, complete, then move to next
4. **Test as you go** - Don't wait until end to test
5. **Document changes** - Update README.md with new features
6. **Seek feedback** - Review with stakeholders after each page

---

**Created by:** GitHub Copilot  
**Date:** November 6, 2025  
**Version:** 1.0  
**Status:** ✅ Ready for Implementation
