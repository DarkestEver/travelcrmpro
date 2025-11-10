# Travel CRM - Comprehensive Test Suite

## Overview
This test suite validates all features of the Travel CRM system through automated API testing. It tests the complete workflow from agency admin registration to customer access.

## Test Structure

### Test Files
1. **01-agency-admin-registration.test.js** - Agency admin user registration
2. **02-authentication.test.js** - Login tests for all roles
3. **03-agency-admin-workflow.test.js** - Agency admin creating entities
4. **04-operator-workflow.test.js** - Operator role workflow
5. **05-agent-role.test.js** - Agent permissions and access
6. **06-customer-role.test.js** - Customer portal access
7. **07-e2e-workflow.test.js** - End-to-end data flow validation

### Helper Files
- **helpers/api-client.js** - HTTP request wrapper
- **helpers/data-generator.js** - Test data generation
- **helpers/test-reporter.js** - Test result reporting
- **helpers/test-utils.js** - Common utility functions

### Master Test Runner
- **run-all-tests.js** - Orchestrates all test suites

## Prerequisites

1. MongoDB must be running
2. Backend server must be running on http://localhost:5000
3. Node.js and npm installed

## Installation

No additional dependencies needed. Uses built-in Node.js modules and existing project dependencies (axios).

## Running Tests

### Run All Tests
```bash
cd backend
node test/run-all-tests.js
```

### Run Individual Test Suites
```bash
# Agency Admin Registration
node test/01-agency-admin-registration.test.js

# Authentication Tests
node test/02-authentication.test.js

# And so on...
```

## Test Coverage

### 1. Agency Admin Registration
- ✓ Create new agency admin user
- ✓ Prevent duplicate email registration
- ✓ Reject invalid registration data

### 2. Authentication
- ✓ Login as agency admin
- ✓ Login as operator (if created)
- ✓ Login as agent (if created)
- ✓ Login as customer (if created)
- ✓ Reject invalid login credentials
- ✓ Validate authentication token

### 3. Agency Admin Workflow
- ✓ Create agent user
- ✓ Create customer user
- ✓ Create supplier
- ✓ Create itinerary
- ✓ Create quote
- ✓ Create booking
- ✓ List all created entities

### 4. Operator Workflow
- ✓ Create operator user (by agency admin)
- ✓ Login as operator
- ✓ Operator creates agent
- ✓ Operator creates customer
- ✓ Operator creates supplier
- ✓ Operator creates itinerary
- ✓ Operator creates quote
- ✓ Operator creates booking

### 5. Agent Role Tests
- ✓ Agent login
- ✓ Agent can view customers
- ✓ Agent can view itineraries
- ✓ Agent can view quotes
- ✓ Agent can view bookings
- ✓ Agent access restrictions

### 6. Customer Role Tests
- ✓ Customer login
- ✓ Customer can view own profile
- ✓ Customer can view own itineraries
- ✓ Customer can view own quotes
- ✓ Customer can view own bookings
- ✓ Customer cannot access admin resources

### 7. End-to-End Workflow
- ✓ Verify tenant data isolation
- ✓ Data flow: Admin creates data for customer
- ✓ Data flow: Customer data visible to admin
- ✓ Booking lifecycle (Create → Update → Complete)
- ✓ Quote to booking conversion flow

## Test Reports

### Console Output
- Real-time test execution status
- Color-coded pass/fail indicators
- Test duration and summary

### JSON Reports
- Detailed test results saved to `test/reports/`
- Individual test suite reports
- Master report combining all results

### Text Reports
- Human-readable summary reports
- Overall statistics
- Test suite breakdown

## Test Data

All test data is automatically generated and includes:

### Users
- 1 Agency Admin
- 1 Operator
- 2 Agents
- 2 Customers

### Business Entities
- 2 Suppliers (Hotel, Airline)
- 2+ Itineraries
- 2 Quotes
- 2 Bookings

### Credentials
All test users use the password: `Test@123456`

## Validation Points

### User Management
- User registration with proper validation
- Role-based access control
- Authentication and authorization
- Tenant isolation

### Dashboard Data
- Entity creation and retrieval
- Data filtering by role
- Proper associations between entities

### Agents
- Agent creation by admin/operator
- Agent login and access
- Commission tracking

### Customers
- Customer creation
- Customer portal access
- Customer-specific data filtering

### Suppliers
- Supplier management
- Supplier associations with bookings

### Itineraries
- Itinerary creation
- Multi-day planning
- Customer associations
- Status management

### Quotes
- Quote generation
- Price calculations
- Quote acceptance workflow
- Valid until date handling

### Bookings
- Booking creation
- Payment tracking
- Status lifecycle
- Customer and itinerary associations

## Workflow Validation

### Tenant Admin → Customer Flow
1. Admin creates customer
2. Admin creates itinerary for customer
3. Admin creates quote for customer
4. Customer logs in
5. Customer sees their itinerary and quote
6. Customer can track booking status

### Customer → Tenant Admin Flow
1. Customer data is created/updated
2. Admin can view all customer data
3. Admin can manage customer bookings
4. Admin can update customer itineraries

## Error Handling

Tests validate:
- Invalid input rejection
- Duplicate data prevention
- Authentication failures
- Authorization restrictions
- Missing required fields
- Invalid data formats

## Notes

- Tests run sequentially to maintain data dependencies
- Nodemon auto-restart delays are handled (2-second wait)
- All test data is isolated per test run
- Reports include timestamps and unique identifiers
- Tests are idempotent (can be run multiple times)

## Troubleshooting

### Server Not Running
Ensure backend server is running:
```bash
cd backend
npm run dev
```

### Database Connection Issues
Check MongoDB is running:
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Port Already in Use
If port 5000 is in use, update API_URL in helpers/api-client.js

### Test Failures
1. Check server logs for errors
2. Review test reports in `test/reports/`
3. Run individual test suites to isolate issues
4. Verify database connectivity

## Best Practices

1. **Run tests in a test database** - Use separate DB for testing
2. **Clean data between runs** - Clear test data if needed
3. **Monitor server logs** - Check for API errors during tests
4. **Review reports** - Analyze failed tests thoroughly
5. **Update tests** - Keep tests in sync with API changes

## Future Enhancements

- [ ] Add performance benchmarking
- [ ] Implement parallel test execution
- [ ] Add visual regression testing
- [ ] Create CI/CD integration
- [ ] Add load testing scenarios
- [ ] Implement test data cleanup
- [ ] Add webhook testing
- [ ] Add notification testing

## Support

For issues or questions:
1. Check test reports for detailed error messages
2. Review API documentation
3. Check server logs
4. Verify all prerequisites are met
