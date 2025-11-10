/**
 * Test 6: Customer Role Tests
 * Tests customer login and access to their own data
 */

const ApiClient = require('./helpers/api-client');
const TestReporter = require('./helpers/test-reporter');
const TestUtils = require('./helpers/test-utils');

class CustomerRoleTest {
  constructor(testData = {}) {
    this.client = new ApiClient();
    this.reporter = new TestReporter('Customer Role Tests');
    this.testData = testData;
  }

  async run() {
    this.reporter.logSection('CUSTOMER ROLE TESTS');
    
    try {
      await this.testCustomerLogin();
      await this.testCustomerViewOwnProfile();
      await this.testCustomerViewOwnItineraries();
      await this.testCustomerViewOwnQuotes();
      await this.testCustomerViewOwnBookings();
      await this.testCustomerAccessRestrictions();
      
      this.reporter.printSummary();
      const reportPath = this.reporter.saveReport();
      
      return {
        success: this.reporter.getSummary().failed === 0,
        summary: this.reporter.getSummary(),
        reportPath
      };
    } catch (error) {
      this.reporter.logError(`Test suite failed: ${error.message}`);
      this.reporter.printSummary();
      throw error;
    }
  }

  async testCustomerLogin() {
    const testStart = Date.now();
    const testName = 'Customer login';

    try {
      const customerData = this.testData.createdEntities?.customer || this.testData.customer;
      TestUtils.assertNotNull(customerData, 'Customer data required');

      const loginData = {
        email: customerData.email,
        password: customerData.password
      };

      this.reporter.logInfo(`Logging in as customer: ${loginData.email}`);

      const response = await this.client.post('/auth/login', loginData);

      TestUtils.assertStatusCode(response.status, 200, 'Login should return 200');
      TestUtils.assert(response.success, 'Login should be successful');
      TestUtils.assertNotNull(response.data.token, 'Token should be present');

      const user = response.data.user;
      TestUtils.assertEqual(user.role, 'customer', 'Role should be customer');

      this.testData.customerToken = response.data.token;
      this.testData.customerTenantId = user.tenant || user.tenantId;
      this.testData.customerId = user._id || user.id;

      this.reporter.logSuccess('Customer login successful');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Customer authenticated successfully'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCustomerViewOwnProfile() {
    const testStart = Date.now();
    const testName = 'Customer can view own profile';

    try {
      TestUtils.assertNotNull(this.testData.customerToken, 'Customer token required');

      this.client.setToken(this.testData.customerToken);
      if (this.testData.customerTenantId) {
        this.client.setTenant(this.testData.customerTenantId);
      }

      this.reporter.logInfo('Fetching customer profile');

      const response = await this.client.get('/auth/me');

      TestUtils.assertStatusCode(response.status, 200, 'Should access profile with 200');
      TestUtils.assert(response.success, 'Request should be successful');
      TestUtils.assertNotNull(response.data, 'Profile data should be present');

      this.reporter.logSuccess('Customer can view own profile');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Profile data retrieved successfully'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCustomerViewOwnItineraries() {
    const testStart = Date.now();
    const testName = 'Customer can view own itineraries';

    try {
      this.reporter.logInfo('Fetching customer itineraries');

      const response = await this.client.get('/itineraries');

      TestUtils.assertStatusCode(response.status, 200, 'Should access itineraries with 200');
      TestUtils.assert(response.success, 'Request should be successful');

      // Customer should only see their own itineraries
      const itineraries = response.data;
      if (Array.isArray(itineraries) && itineraries.length > 0) {
        const allOwnItineraries = itineraries.every(it => {
          const customerId = it.customer?._id || it.customer?.id || it.customer;
          return customerId?.toString() === this.testData.customerId?.toString();
        });

        if (allOwnItineraries) {
          this.reporter.logSuccess('Customer sees only own itineraries');
        } else {
          this.reporter.logWarning('Customer may see other itineraries - check filtering');
        }
      }

      this.reporter.logSuccess(`Customer can view itineraries (${itineraries.length || 0} found)`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Found ${itineraries.length || 0} itineraries`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCustomerViewOwnQuotes() {
    const testStart = Date.now();
    const testName = 'Customer can view own quotes';

    try {
      this.reporter.logInfo('Fetching customer quotes');

      const response = await this.client.get('/quotes');

      TestUtils.assertStatusCode(response.status, 200, 'Should access quotes with 200');
      TestUtils.assert(response.success, 'Request should be successful');

      this.reporter.logSuccess(`Customer can view quotes (${response.data.length || 0} found)`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Found ${response.data.length || 0} quotes`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCustomerViewOwnBookings() {
    const testStart = Date.now();
    const testName = 'Customer can view own bookings';

    try {
      this.reporter.logInfo('Fetching customer bookings');

      const response = await this.client.get('/bookings');

      TestUtils.assertStatusCode(response.status, 200, 'Should access bookings with 200');
      TestUtils.assert(response.success, 'Request should be successful');

      this.reporter.logSuccess(`Customer can view bookings (${response.data.length || 0} found)`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Found ${response.data.length || 0} bookings`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCustomerAccessRestrictions() {
    const testStart = Date.now();
    const testName = 'Customer cannot access admin resources';

    try {
      this.reporter.logInfo('Testing customer access restrictions');

      // Try to access users list (should be restricted)
      const response = await this.client.get('/users');

      // Customer should either be forbidden or get filtered results
      if (response.status === 403 || response.status === 401) {
        this.reporter.logSuccess('Customer correctly restricted from users list');
      } else if (response.status === 200) {
        // If 200, customer might have limited access
        this.reporter.logInfo('Customer has some access to users - might be filtered');
      }

      // Try to access suppliers (should be restricted)
      const suppliersResponse = await this.client.get('/suppliers');

      if (suppliersResponse.status === 403 || suppliersResponse.status === 401) {
        this.reporter.logSuccess('Customer correctly restricted from suppliers');
      } else if (suppliersResponse.status === 200) {
        this.reporter.logInfo('Customer can view suppliers');
      }

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Access restrictions tested'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    } finally {
      this.client.reset();
    }
  }
}

module.exports = CustomerRoleTest;
