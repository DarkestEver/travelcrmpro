# 🧪 End-to-End Testing Plan - Travel CRM

## 📋 Overview

This document outlines the complete E2E testing strategy for the Travel CRM application, covering both backend API and frontend UI testing.

---

## 🎯 Testing Objectives

1. **Functional Testing**: Verify all features work as expected
2. **Integration Testing**: Ensure frontend and backend communicate correctly
3. **User Flow Testing**: Test complete user journeys
4. **Cross-browser Testing**: Verify compatibility across browsers
5. **Performance Testing**: Ensure acceptable load times
6. **Security Testing**: Verify authentication and authorization

---

## 🛠️ Testing Tools

### Backend Testing
- ✅ **Jest**: Unit tests for services and utilities
- ✅ **Supertest**: HTTP integration tests for API endpoints
- ✅ **Swagger UI**: Interactive API documentation and testing
- ✅ **Postman**: API collection for manual testing

### Frontend Testing
- 📦 **Playwright** (Recommended): Modern E2E testing framework
- 📦 **Cypress** (Alternative): Popular E2E testing tool
- 📦 **React Testing Library**: Component testing
- 📦 **Vitest**: Fast unit testing for Vite projects

### Performance Testing
- 📦 **Lighthouse**: Performance, accessibility, SEO audits
- 📦 **WebPageTest**: Detailed performance analysis

---

## 🧪 Test Categories

### 1. Backend API Tests

#### A. Unit Tests (Jest)
**Location**: `backend/tests/unit/`

**Test Files**:
- `authService.test.js` - Authentication logic
- `bookingService.test.js` - Booking business logic
- `quoteService.test.js` - Quote calculations
- `itineraryService.test.js` - Itinerary management
- `analyticsService.test.js` - Report generation
- `emailService.test.js` - Email sending
- `pdfService.test.js` - PDF generation

**Coverage Target**: 80%+

#### B. Integration Tests (Supertest)
**Location**: `backend/tests/integration/`

**Test Suites**:
```javascript
// auth.test.js
describe('Authentication API', () => {
  test('POST /auth/register - should register new user')
  test('POST /auth/login - should login with valid credentials')
  test('POST /auth/login - should reject invalid credentials')
  test('GET /auth/me - should return current user')
  test('POST /auth/logout - should logout user')
})

// customers.test.js
describe('Customers API', () => {
  test('GET /customers - should return all customers')
  test('POST /customers - should create customer')
  test('GET /customers/:id - should return customer by ID')
  test('PUT /customers/:id - should update customer')
  test('DELETE /customers/:id - should delete customer')
})

// bookings.test.js
describe('Bookings API', () => {
  test('POST /bookings - should create booking')
  test('POST /bookings/:id/payment - should add payment')
  test('PATCH /bookings/:id/confirm - should confirm booking')
  test('PATCH /bookings/:id/cancel - should cancel booking')
})
```

### 2. Frontend Component Tests

#### A. Component Unit Tests
**Location**: `frontend/tests/components/`

**Test Files**:
- `Login.test.jsx` - Login form functionality
- `Register.test.jsx` - Registration form
- `Dashboard.test.jsx` - Dashboard data display
- `CustomerForm.test.jsx` - Customer form validation
- `BookingForm.test.jsx` - Booking form logic
- `FileUpload.test.jsx` - File upload component
- `DateRangePicker.test.jsx` - Date picker logic

#### B. Integration Tests
**Location**: `frontend/tests/integration/`

**Test Files**:
- `authFlow.test.jsx` - Login/logout flow
- `customerCRUD.test.jsx` - Customer CRUD operations
- `bookingFlow.test.jsx` - Complete booking process

---

## 🎬 E2E Test Scenarios

### Scenario 1: User Registration & Login
**Priority**: P0 (Critical)

```javascript
test('Complete Registration and Login Flow', async ({ page }) => {
  // 1. Navigate to registration page
  await page.goto('http://localhost:5173/register')
  
  // 2. Fill registration form
  await page.fill('input[name="name"]', 'Test User')
  await page.fill('input[name="email"]', 'testuser@example.com')
  await page.fill('input[name="phone"]', '+1234567890')
  await page.selectOption('select[name="role"]', 'agent')
  await page.fill('input[name="password"]', 'TestPassword123')
  await page.fill('input[name="confirmPassword"]', 'TestPassword123')
  
  // 3. Submit form
  await page.click('button[type="submit"]')
  
  // 4. Verify redirect to dashboard
  await page.waitForURL('http://localhost:5173/dashboard')
  
  // 5. Verify user is logged in
  await expect(page.locator('text=Dashboard')).toBeVisible()
  
  // 6. Logout
  await page.click('[data-testid="user-menu"]')
  await page.click('text=Logout')
  
  // 7. Verify redirect to login
  await page.waitForURL('http://localhost:5173/login')
})
```

### Scenario 2: Admin - Create & Manage Customer
**Priority**: P0 (Critical)

```javascript
test('Admin Creates and Manages Customer', async ({ page }) => {
  // 1. Login as admin
  await loginAsAdmin(page)
  
  // 2. Navigate to customers page
  await page.goto('http://localhost:5173/customers')
  
  // 3. Click "Add Customer" button
  await page.click('button:has-text("Add Customer")')
  
  // 4. Fill customer form
  await page.fill('input[name="name"]', 'John Doe')
  await page.fill('input[name="email"]', 'john.doe@example.com')
  await page.fill('input[name="phone"]', '+1234567890')
  await page.fill('input[name="company"]', 'Acme Corp')
  
  // 5. Submit form
  await page.click('button:has-text("Create Customer")')
  
  // 6. Verify success toast
  await expect(page.locator('text=Customer created successfully')).toBeVisible()
  
  // 7. Verify customer appears in list
  await expect(page.locator('text=John Doe')).toBeVisible()
  
  // 8. Click edit button
  await page.click('[data-testid="edit-customer-button"]')
  
  // 9. Update customer
  await page.fill('input[name="company"]', 'New Corp')
  await page.click('button:has-text("Update Customer")')
  
  // 10. Verify update success
  await expect(page.locator('text=Customer updated successfully')).toBeVisible()
})
```

### Scenario 3: Agent - Complete Booking Flow
**Priority**: P0 (Critical)

```javascript
test('Agent Creates Booking from Quote to Confirmation', async ({ page }) => {
  // 1. Login as agent
  await loginAsAgent(page)
  
  // 2. Create customer
  const customerId = await createCustomer(page, {
    name: 'Travel Customer',
    email: 'customer@example.com'
  })
  
  // 3. Create itinerary
  await page.goto('http://localhost:5173/itineraries')
  await page.click('button:has-text("New Itinerary")')
  await page.fill('input[name="title"]', 'Paris Tour')
  await page.fill('input[name="destination"]', 'Paris, France')
  await page.click('button:has-text("Save Itinerary")')
  
  // 4. Create quote
  await page.goto('http://localhost:5173/quotes')
  await page.click('button:has-text("New Quote")')
  await page.selectOption('select[name="customer"]', customerId)
  await page.fill('input[name="amount"]', '5000')
  await page.click('button:has-text("Create Quote")')
  
  // 5. Send quote to customer
  await page.click('button:has-text("Send Quote")')
  await expect(page.locator('text=Quote sent successfully')).toBeVisible()
  
  // 6. Accept quote
  await page.click('button:has-text("Accept Quote")')
  
  // 7. Create booking from quote
  await page.click('button:has-text("Create Booking")')
  
  // 8. Add payment
  await page.click('button:has-text("Add Payment")')
  await page.fill('input[name="amount"]', '2500')
  await page.selectOption('select[name="method"]', 'credit_card')
  await page.click('button:has-text("Submit Payment")')
  
  // 9. Confirm booking (as operator/admin)
  await loginAsOperator(page)
  await page.goto('http://localhost:5173/bookings')
  await page.click('[data-testid="confirm-booking-button"]')
  
  // 10. Verify booking is confirmed
  await expect(page.locator('text=Booking confirmed')).toBeVisible()
})
```

### Scenario 4: Reports & Analytics
**Priority**: P1 (High)

```javascript
test('Admin Views Analytics and Exports Reports', async ({ page }) => {
  // 1. Login as admin
  await loginAsAdmin(page)
  
  // 2. Navigate to dashboard
  await page.goto('http://localhost:5173/dashboard')
  
  // 3. Verify dashboard metrics load
  await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible()
  await expect(page.locator('[data-testid="total-bookings"]')).toBeVisible()
  
  // 4. View revenue report
  await page.goto('http://localhost:5173/reports/revenue')
  await expect(page.locator('text=Revenue Report')).toBeVisible()
  
  // 5. Apply date filter
  await page.click('[data-testid="date-range-picker"]')
  await page.click('text=Last 30 Days')
  
  // 6. Export to Excel
  await page.click('button:has-text("Export Excel")')
  
  // 7. Verify download initiated
  const download = await page.waitForEvent('download')
  expect(download.suggestedFilename()).toContain('revenue')
  
  // 8. View agent performance
  await page.goto('http://localhost:5173/reports/agent-performance')
  
  // 9. Verify agent rankings displayed
  await expect(page.locator('[data-testid="agent-ranking"]')).toBeVisible()
})
```

### Scenario 5: Search & Notifications
**Priority**: P2 (Medium)

```javascript
test('Global Search and Notifications', async ({ page }) => {
  // 1. Login
  await loginAsAgent(page)
  
  // 2. Test global search (Cmd+K / Ctrl+K)
  await page.keyboard.press('Control+K')
  
  // 3. Verify search modal appears
  await expect(page.locator('[data-testid="search-modal"]')).toBeVisible()
  
  // 4. Search for customer
  await page.fill('input[placeholder*="Search"]', 'John Doe')
  await page.waitForTimeout(500) // Debounce
  
  // 5. Verify results appear
  await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
  
  // 6. Click result to navigate
  await page.click('[data-testid="search-result"]:first-child')
  
  // 7. Check notifications
  await page.click('[data-testid="notifications-bell"]')
  
  // 8. Verify notification dropdown
  await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible()
  
  // 9. Mark notification as read
  await page.click('[data-testid="mark-as-read"]:first-child')
  
  // 10. Verify unread count decreased
  // Assert logic here
})
```

### Scenario 6: File Upload & PDF Export
**Priority**: P2 (Medium)

```javascript
test('File Upload and PDF Export', async ({ page }) => {
  // 1. Login as agent
  await loginAsAgent(page)
  
  // 2. Navigate to customers
  await page.goto('http://localhost:5173/customers')
  
  // 3. Open customer detail
  await page.click('[data-testid="customer-row"]:first-child')
  
  // 4. Upload document
  const fileInput = await page.locator('input[type="file"]')
  await fileInput.setInputFiles('./test-files/sample.pdf')
  
  // 5. Verify upload success
  await expect(page.locator('text=File uploaded successfully')).toBeVisible()
  
  // 6. Navigate to itinerary
  await page.goto('http://localhost:5173/itineraries')
  await page.click('[data-testid="itinerary-row"]:first-child')
  
  // 7. Export as PDF
  await page.click('button:has-text("Export PDF")')
  
  // 8. Verify PDF download
  const download = await page.waitForEvent('download')
  expect(download.suggestedFilename()).toContain('.pdf')
})
```

### Scenario 7: Role-Based Access Control
**Priority**: P0 (Critical)

```javascript
test('Role-Based Access Control', async ({ page }) => {
  // Test 1: Agent cannot access admin features
  await loginAsAgent(page)
  
  // Try to access admin-only page
  await page.goto('http://localhost:5173/agents')
  
  // Should redirect or show forbidden
  await expect(page.locator('text=Forbidden')).toBeVisible()
  
  // Test 2: Operator can access operator features
  await loginAsOperator(page)
  await page.goto('http://localhost:5173/bookings')
  
  // Should be able to confirm bookings
  await expect(page.locator('button:has-text("Confirm Booking")')).toBeVisible()
  
  // Test 3: Admin can access everything
  await loginAsAdmin(page)
  
  // Should access all sections
  await page.goto('http://localhost:5173/agents')
  await expect(page.locator('text=Agents')).toBeVisible()
  
  await page.goto('http://localhost:5173/reports/revenue')
  await expect(page.locator('text=Revenue Report')).toBeVisible()
})
```

### Scenario 8: Mobile Responsive Testing
**Priority**: P1 (High)

```javascript
test('Mobile Responsive Layout', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })
  
  // 1. Test login on mobile
  await page.goto('http://localhost:5173/login')
  await expect(page.locator('input[name="email"]')).toBeVisible()
  
  // 2. Login
  await page.fill('input[name="email"]', 'admin@travelcrm.com')
  await page.fill('input[name="password"]', 'Admin@123')
  await page.click('button[type="submit"]')
  
  // 3. Test mobile navigation
  await page.click('[data-testid="mobile-menu-button"]')
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  
  // 4. Navigate to customers
  await page.click('text=Customers')
  
  // 5. Verify table is responsive
  await expect(page.locator('[data-testid="customers-list"]')).toBeVisible()
  
  // 6. Test form on mobile
  await page.click('button:has-text("Add Customer")')
  await expect(page.locator('form')).toBeVisible()
})
```

---

## 📊 Test Coverage Goals

### Backend
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All API endpoints
- **Security Tests**: Authentication & authorization

### Frontend
- **Component Tests**: 70%+ coverage
- **E2E Tests**: All critical user flows
- **Cross-browser**: Chrome, Firefox, Safari, Edge

---

## 🚀 Test Execution Plan

### Phase 1: Backend Testing (Week 1)
- [ ] Set up Jest testing environment
- [ ] Write unit tests for all services
- [ ] Write integration tests for all API endpoints
- [ ] Run tests and fix failures
- [ ] Generate coverage reports
- [ ] Target: 80%+ coverage

### Phase 2: Frontend Component Testing (Week 2)
- [ ] Set up Vitest + React Testing Library
- [ ] Write component tests for all pages
- [ ] Write tests for all reusable components
- [ ] Test forms and validation logic
- [ ] Target: 70%+ coverage

### Phase 3: E2E Testing Setup (Week 3)
- [ ] Install and configure Playwright
- [ ] Set up test database
- [ ] Create test data seeds
- [ ] Write helper functions
- [ ] Configure CI/CD integration

### Phase 4: E2E Test Implementation (Week 4-5)
- [ ] Implement P0 critical scenarios
- [ ] Implement P1 high priority scenarios
- [ ] Implement P2 medium priority scenarios
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

### Phase 5: Performance & Security Testing (Week 6)
- [ ] Run Lighthouse audits
- [ ] Load testing with k6 or Artillery
- [ ] Security testing (OWASP Top 10)
- [ ] Accessibility testing
- [ ] Fix identified issues

### Phase 6: CI/CD Integration (Week 7)
- [ ] Set up GitHub Actions workflow
- [ ] Automate test execution on PR
- [ ] Set up test reporting
- [ ] Configure deployment gates
- [ ] Document testing process

---

## 🛠️ Test Infrastructure

### Required Setup

#### 1. Install Testing Tools
```bash
# Backend testing
cd backend
npm install --save-dev jest supertest @types/jest

# Frontend testing
cd frontend
npm install --save-dev @playwright/test vitest @testing-library/react @testing-library/jest-dom
```

#### 2. Create Test Database
```javascript
// backend/tests/setup.js
const mongoose = require('mongoose');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
```

#### 3. Configure Playwright
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],
};
```

---

## 📈 Success Metrics

### Coverage Targets
- Backend unit tests: **80%+**
- Backend integration tests: **100%** of endpoints
- Frontend component tests: **70%+**
- E2E critical paths: **100%**

### Performance Targets
- Page load time: **< 2 seconds**
- API response time: **< 200ms**
- Time to interactive: **< 3 seconds**
- Lighthouse score: **90+**

### Quality Targets
- Zero critical bugs in production
- < 5 medium bugs per release
- All security vulnerabilities addressed
- 100% of P0 scenarios passing

---

## 🐛 Bug Tracking

### Bug Priority Levels
- **P0 - Critical**: Blocks core functionality, immediate fix required
- **P1 - High**: Impacts major features, fix in next release
- **P2 - Medium**: Minor issues, fix when time allows
- **P3 - Low**: Nice to have, backlog

### Bug Report Template
```markdown
## Bug Title
Brief description of the bug

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Screenshots/Videos
[Attach evidence]

### Environment
- Browser: Chrome 120
- OS: Windows 11
- Backend version: 1.0.0
- Frontend version: 1.0.0

### Priority
P0 / P1 / P2 / P3

### Additional Context
Any other relevant information
```

---

## 📚 Documentation

### Test Documentation
- [ ] API testing guide ✅ (Created: API_TESTING_GUIDE.md)
- [ ] E2E testing guide (This document)
- [ ] Testing best practices
- [ ] CI/CD pipeline documentation
- [ ] Bug report templates

### Generated Reports
- Test coverage reports (HTML)
- Test execution reports
- Performance audit reports
- Security scan reports

---

## 🎯 Next Actions

1. **Immediate** (This week):
   - ✅ Set up Swagger documentation
   - ✅ Create Postman collection
   - ✅ Create API testing guide
   - ✅ Create E2E testing plan
   - [ ] Update TODO list with testing tasks

2. **Short-term** (Next 2 weeks):
   - [ ] Install and configure testing tools
   - [ ] Write backend unit tests
   - [ ] Write backend integration tests
   - [ ] Set up test database

3. **Medium-term** (Next 4 weeks):
   - [ ] Write frontend component tests
   - [ ] Implement E2E tests
   - [ ] Cross-browser testing
   - [ ] Performance testing

4. **Long-term** (Next 8 weeks):
   - [ ] CI/CD integration
   - [ ] Automated test reporting
   - [ ] Continuous monitoring
   - [ ] Load testing

---

## 📞 Support & Resources

- **Playwright Docs**: https://playwright.dev
- **Jest Docs**: https://jestjs.io
- **React Testing Library**: https://testing-library.com/react
- **Supertest**: https://github.com/visionmedia/supertest

---

**Document Version**: 1.0  
**Last Updated**: November 6, 2025  
**Status**: Planning Phase  
**Next Review**: After Phase 1 completion
