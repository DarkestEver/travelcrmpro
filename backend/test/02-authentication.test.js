/**
 * Test 2: Authentication Test Suite
 * Tests login for all user roles
 */

const ApiClient = require('./helpers/api-client');
const TestReporter = require('./helpers/test-reporter');
const TestUtils = require('./helpers/test-utils');

class AuthenticationTest {
  constructor(testData = {}) {
    this.client = new ApiClient();
    this.reporter = new TestReporter('Authentication Tests');
    this.testData = testData;
    this.tokens = {};
  }

  async run() {
    this.reporter.logSection('AUTHENTICATION TEST SUITE');
    
    try {
      await this.testAgencyAdminLogin();
      await this.testInvalidLogin();
      await this.testTokenValidation();
      
      this.reporter.printSummary();
      const reportPath = this.reporter.saveReport();
      
      return {
        success: this.reporter.getSummary().failed === 0,
        summary: this.reporter.getSummary(),
        tokens: this.tokens,
        testData: this.testData,  // Pass back updated testData
        reportPath
      };
    } catch (error) {
      this.reporter.logError(`Test suite failed: ${error.message}`);
      this.reporter.printSummary();
      throw error;
    }
  }

  async testAgencyAdminLogin() {
    const testStart = Date.now();
    const testName = 'Login as agency admin';

    try {
      TestUtils.assertNotNull(this.testData.agencyAdmin, 'Agency admin test data required');

      const loginData = {
        email: this.testData.agencyAdmin.email,
        password: this.testData.agencyAdmin.password
      };

      this.reporter.logInfo(`Logging in as: ${loginData.email}`);
      this.reporter.logInfo(`Password length: ${loginData.password?.length || 0} chars`);

      const response = await this.client.post('/auth/login', loginData);

      // Debug: Log response
      this.reporter.logInfo(`Login Status: ${response.status}`);
      if (!response.success) {
        this.reporter.logInfo(`Login Error: ${JSON.stringify(response.data)}`);
      }

      // Validate response
      TestUtils.assertStatusCode(response.status, 200, 'Login should return 200');
      TestUtils.assert(response.success, 'Login should be successful');
      
      // API returns nested structure: response.data.data contains user and tokens
      const result = response.data.data || response.data;
      TestUtils.assertNotNull(result.accessToken, 'Token should be present');
      TestUtils.assertNotNull(result.user, 'User data should be present');

      // Validate user data
      const user = result.user;
      TestUtils.assertEqual(user.email, loginData.email, 'Email should match');
      TestUtils.assertEqual(user.role, 'operator', 'Role should be operator');

      // Store token
      this.tokens.agencyAdmin = result.accessToken;
      
      // Also update the agencyAdmin object with the token for downstream tests
      if (this.testData.agencyAdmin) {
        this.testData.agencyAdmin.token = result.accessToken;
      }

      this.reporter.logSuccess('Agency admin login successful');
      this.reporter.logInfo(`Token received: ${result.accessToken.substring(0, 20)}...`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Token successfully obtained'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testOperatorLogin() {
    const testStart = Date.now();
    const testName = 'Login as operator';

    try {
      if (!this.testData.operator) {
        this.reporter.logTest(testName, 'SKIP', {
          duration: Date.now() - testStart,
          info: 'Operator not yet created'
        });
        return;
      }

      const loginData = {
        email: this.testData.operator.email,
        password: this.testData.operator.password
      };

      this.reporter.logInfo(`Logging in as operator: ${loginData.email}`);

      const response = await this.client.post('/auth/login', loginData);

      TestUtils.assertStatusCode(response.status, 200, 'Login should return 200');
      TestUtils.assert(response.success, 'Login should be successful');
      TestUtils.assertNotNull(response.data.token, 'Token should be present');

      const user = response.data.user;
      TestUtils.assertEqual(user.role, 'operator', 'Role should be operator');

      this.tokens.operator = response.data.token;

      this.reporter.logSuccess('Operator login successful');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Token successfully obtained'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testAgentLogin() {
    const testStart = Date.now();
    const testName = 'Login as agent';

    try {
      if (!this.testData.agent) {
        this.reporter.logTest(testName, 'SKIP', {
          duration: Date.now() - testStart,
          info: 'Agent not yet created'
        });
        return;
      }

      const loginData = {
        email: this.testData.agent.email,
        password: this.testData.agent.password
      };

      this.reporter.logInfo(`Logging in as agent: ${loginData.email}`);

      const response = await this.client.post('/auth/login', loginData);

      TestUtils.assertStatusCode(response.status, 200, 'Login should return 200');
      TestUtils.assert(response.success, 'Login should be successful');
      TestUtils.assertNotNull(response.data.token, 'Token should be present');

      const user = response.data.user;
      TestUtils.assertEqual(user.role, 'agent', 'Role should be agent');

      this.tokens.agent = response.data.token;

      this.reporter.logSuccess('Agent login successful');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Token successfully obtained'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCustomerLogin() {
    const testStart = Date.now();
    const testName = 'Login as customer';

    try {
      if (!this.testData.customer) {
        this.reporter.logTest(testName, 'SKIP', {
          duration: Date.now() - testStart,
          info: 'Customer not yet created'
        });
        return;
      }

      const loginData = {
        email: this.testData.customer.email,
        password: this.testData.customer.password
      };

      this.reporter.logInfo(`Logging in as customer: ${loginData.email}`);

      const response = await this.client.post('/auth/login', loginData);

      TestUtils.assertStatusCode(response.status, 200, 'Login should return 200');
      TestUtils.assert(response.success, 'Login should be successful');
      TestUtils.assertNotNull(response.data.token, 'Token should be present');

      const user = response.data.user;
      TestUtils.assertEqual(user.role, 'customer', 'Role should be customer');

      this.tokens.customer = response.data.token;

      this.reporter.logSuccess('Customer login successful');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Token successfully obtained'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testInvalidLogin() {
    const testStart = Date.now();
    const testName = 'Reject invalid login credentials';

    try {
      const invalidLogin = {
        email: 'nonexistent@test.com',
        password: 'WrongPassword123'
      };

      this.reporter.logInfo('Testing with invalid credentials');

      const response = await this.client.post('/auth/login', invalidLogin);

      TestUtils.assert(
        response.status === 401 || response.status === 400,
        'Should reject invalid credentials'
      );
      TestUtils.assert(!response.success, 'Response should indicate failure');

      this.reporter.logSuccess('Invalid login rejected successfully');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'System correctly rejected invalid credentials'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testTokenValidation() {
    const testStart = Date.now();
    const testName = 'Validate authentication token';

    try {
      TestUtils.assertNotNull(this.tokens.agencyAdmin, 'Agency admin token required');

      this.client.setToken(this.tokens.agencyAdmin);
      this.reporter.logInfo('Testing token validation with /auth/me endpoint');

      const response = await this.client.get('/auth/me');

      TestUtils.assertStatusCode(response.status, 200, 'Should validate token');
      TestUtils.assert(response.success, 'Response should be successful');
      TestUtils.assertNotNull(response.data, 'Should return user data');

      this.reporter.logSuccess('Token validated successfully');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Token is valid and returned user data'
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

  getTokens() {
    return this.tokens;
  }
}

// Run if called directly
if (require.main === module) {
  const test = new AuthenticationTest();
  test.run()
    .then(result => {
      console.log('\nTokens obtained:');
      console.log(JSON.stringify(result.tokens, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = AuthenticationTest;
