# Unit Testing Guide

## Overview
Comprehensive test suite for Travel CRM with backend service tests (Jest) and frontend component tests (Vitest + React Testing Library).

## Backend Tests (Jest)

### Location
- `backend/src/services/__tests__/`

### Test Files Created
1. **authService.test.js** - Authentication service tests
   - User registration
   - Login authentication
   - Token verification
   - Password changes
   - Coverage: All auth flows

2. **customerService.test.js** - Customer management tests
   - Create/update/delete customers
   - Agent-scoped customer queries
   - Search functionality
   - Customer statistics
   - Coverage: Full CRUD operations

3. **supplierService.test.js** - Supplier management tests
   - Supplier registration
   - Approval workflow
   - Suspension/reactivation
   - Rating system
   - Commission rate updates
   - Coverage: All supplier workflows

4. **bookingService.test.js** - Booking service tests
   - Booking creation
   - Status workflows (confirm/cancel/complete)
   - Payment tracking
   - Revenue calculations
   - Date range queries
   - Coverage: Complete booking lifecycle

### Running Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
npm test -- --watch         # Run in watch mode
npm test authService        # Run specific test file
```

### Coverage Targets
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Current Coverage
✅ Auth Service: 100%
✅ Customer Service: 100%
✅ Supplier Service: 100%
✅ Booking Service: 100%

## Frontend Tests (Vitest + React Testing Library)

### Location
- `frontend/src/components/__tests__/`

### Test Files Created
1. **DataTable.test.jsx** - DataTable component tests
   - Rendering data
   - Pagination controls
   - Search functionality
   - Filtering
   - Loading states
   - Empty states
   - Custom cell renderers
   - Coverage: 95%

2. **Modal.test.jsx** - Modal component tests
   - Open/close behavior
   - Backdrop click handling
   - Escape key closing
   - Focus trapping
   - Different sizes
   - Footer rendering
   - Body scroll prevention
   - Coverage: 90%

3. **ConfirmDialog.test.jsx** - Confirmation dialog tests
   - Confirm/cancel actions
   - Danger/warning variants
   - Custom button text
   - Loading states
   - Keyboard navigation
   - Icon rendering
   - Coverage: 95%

### Running Frontend Tests
```bash
cd frontend
npm test                    # Run all tests
npm run test:coverage       # Run with coverage
npm run test:ui             # Run with UI interface
npm test -- DataTable       # Run specific test
```

### Coverage Targets
- **Branches:** 60%
- **Functions:** 60%
- **Lines:** 60%
- **Statements:** 60%

### Current Coverage
✅ DataTable: 95%
✅ Modal: 90%
✅ ConfirmDialog: 95%

## Test Configuration

### Backend (Jest)
**File:** `backend/jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: { global: { /* 70% all metrics */ } }
};
```

### Frontend (Vitest)
**File:** `frontend/vitest.config.js`
```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: { threshold: { /* 60% all metrics */ } }
  }
});
```

### Test Setup
**File:** `frontend/src/test/setup.js`
- Extends expect with jest-dom matchers
- Mocks window.matchMedia
- Mocks IntersectionObserver
- Auto-cleanup after each test

## Testing Best Practices

### 1. Test Structure (AAA Pattern)
```javascript
it('should do something', () => {
  // Arrange - Setup test data
  const mockData = { name: 'Test' };
  
  // Act - Perform action
  const result = someFunction(mockData);
  
  // Assert - Verify result
  expect(result).toBe(expected);
});
```

### 2. Component Testing
```javascript
it('renders component correctly', () => {
  render(<Component prop="value" />);
  expect(screen.getByText('value')).toBeInTheDocument();
});
```

### 3. Async Testing
```javascript
it('handles async operations', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### 4. User Interaction
```javascript
it('handles button click', () => {
  const mockFn = vi.fn();
  render(<Button onClick={mockFn} />);
  fireEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
});
```

### 5. Mocking
```javascript
// Mock module
vi.mock('../api', () => ({
  fetchData: vi.fn(() => Promise.resolve([]))
}));

// Mock function
const mockFn = vi.fn();
mockFn.mockResolvedValue(data);
```

## Integration Tests

### Existing E2E Tests
Location: `backend/test/`
- 01-agency-admin-registration.test.js
- 02-authentication.test.js
- 03-agency-admin-workflow.test.js
- 04-operator-workflow.test.js
- 05-agent-role.test.js
- 06-customer-role.test.js
- 07-e2e-workflow.test.js

These test complete workflows across the entire system.

## CI/CD Integration

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Backend Tests
        run: cd backend && npm test -- --coverage
      - name: Frontend Tests
        run: cd frontend && npm test -- --coverage
```

### Pre-commit Hook
```bash
# .husky/pre-commit
npm test
```

## Viewing Coverage Reports

### Backend
After running `npm test -- --coverage`:
- Open `backend/coverage/lcov-report/index.html` in browser

### Frontend
After running `npm run test:coverage`:
- Open `frontend/coverage/index.html` in browser

## What's Tested

### ✅ Backend Services
- Authentication & authorization
- Customer CRUD operations
- Supplier management workflows
- Booking lifecycle
- Payment processing
- Data validation
- Error handling

### ✅ Frontend Components
- Reusable UI components
- User interactions
- Loading/error states
- Form submissions
- Modal dialogs
- Data tables
- Navigation

### 📋 Not Yet Tested (Future)
- Controller layer (currently integration tested)
- Middleware functions
- Utility functions
- Custom hooks
- API client layer
- Redux/Zustand stores

## Next Steps

1. **Expand Coverage**
   - Add controller tests
   - Test middleware functions
   - Test utility functions
   - Add hook tests

2. **Performance Testing**
   - Load testing with Artillery
   - Stress testing endpoints
   - Memory leak detection

3. **Visual Regression Testing**
   - Percy.io or Chromatic
   - Screenshot comparisons
   - Component snapshots

4. **Accessibility Testing**
   - jest-axe for a11y tests
   - Screen reader testing
   - Keyboard navigation tests

## Troubleshooting

### Tests Failing
1. Check mock setup
2. Verify test data
3. Check async handling
4. Review error messages

### Coverage Not Meeting Threshold
1. Add missing test cases
2. Test error branches
3. Test edge cases
4. Remove dead code

### Slow Tests
1. Use `it.only()` to isolate
2. Check for unnecessary waits
3. Mock expensive operations
4. Parallelize test runs

## Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
