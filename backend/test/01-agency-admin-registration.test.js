/**
 * Test 1: Agency Admin Registration
 * Creates a new agency admin user and validates the response
 */

const ApiClient = require('./helpers/api-client');
const DataGenerator = require('./helpers/data-generator');
const TestReporter = require('./helpers/test-reporter');
const TestUtils = require('./helpers/test-utils');

class AgencyAdminRegistrationTest {
  constructor() {
    this.client = new ApiClient();
    this.reporter = new TestReporter('Agency Admin Registration');
    this.testData = {};
  }

  async run() {
    this.reporter.logSection('AGENCY ADMIN REGISTRATION TEST');
    
    try {
      await this.testCreateAgencyAdmin();
      await this.testDuplicateRegistration();
      await this.testInvalidData();
      
      this.reporter.printSummary();
      const reportPath = this.reporter.saveReport();
      
      return {
        success: this.reporter.getSummary().failed === 0,
        summary: this.reporter.getSummary(),
        testData: this.testData,
        reportPath
      };
    } catch (error) {
      this.reporter.logError(`Test suite failed: ${error.message}`);
      this.reporter.printSummary();
      throw error;
    }
  }

  async testCreateAgencyAdmin() {
    const testStart = Date.now();
    const testName = 'Create new agency admin user';

    try {
      // Generate test data for tenant creation
      const agencyData = DataGenerator.generateAgencyAdmin({
        ownerName: 'Test Agency Admin',
        companyName: 'Test Travel Agency'
      });

      this.reporter.logInfo(`Creating tenant and owner: ${agencyData.ownerEmail}`);

      // Make tenant creation request (which also creates the owner user)
      const response = await this.client.post('/tenants', agencyData);

      // Debug: Log the actual response
      this.reporter.logInfo(`Response Status: ${response.status}`);
      if (!response.success) {
        this.reporter.logInfo(`Response Data: ${JSON.stringify(response.data)}`);
      }

      // Validate response
      TestUtils.assertStatusCode(response.status, 201, 'Tenant creation should return 201');
      TestUtils.assert(response.success, 'Tenant creation should be successful');
      TestUtils.assertNotNull(response.data, 'Response should contain data');
      
      // API returns nested structure: response.data.data contains tenant and owner
      const result = response.data.data || response.data;
      
      // Validate response structure
      TestUtils.assertObjectHasKeys(result, ['tenant', 'owner'], 'Response should contain tenant and owner');
      TestUtils.assertNotNull(result.tenant, 'Tenant data should be present');
      TestUtils.assertNotNull(result.owner, 'Owner data should be present');
      
      // Validate owner data
      const owner = result.owner;
      TestUtils.assertEqual(owner.email, agencyData.ownerEmail, 'Email should match');
      TestUtils.assertEqual(owner.role, 'operator', 'Role should be operator');
      TestUtils.assertNotNull(owner._id || owner.id, 'Owner should have an ID');

      // Store test data for later use
      this.testData.agencyAdmin = {
        email: agencyData.ownerEmail,
        password: agencyData.ownerPassword,
        name: agencyData.ownerName,
        subdomain: agencyData.subdomain,
        id: owner._id || owner.id,
        token: response.data.accessToken || response.data.token || result.accessToken || result.token,
        tenantId: result.tenant._id || result.tenant.id
      };

      this.reporter.logSuccess(`Agency admin (tenant owner) created successfully`);
      this.reporter.logInfo(`Owner ID: ${this.testData.agencyAdmin.id}`);
      this.reporter.logInfo(`Tenant ID: ${this.testData.agencyAdmin.tenantId}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Owner ID: ${this.testData.agencyAdmin.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testDuplicateRegistration() {
    const testStart = Date.now();
    const testName = 'Prevent duplicate subdomain registration';

    try {
      if (!this.testData.agencyAdmin) {
        this.reporter.logTest(testName, 'SKIP', {
          duration: Date.now() - testStart,
          info: 'No agency admin created'
        });
        return;
      }

      // Try to register with same subdomain
      const duplicateData = DataGenerator.generateAgencyAdmin();
      // Use the subdomain from first tenant
      const firstTenantSubdomain = this.testData.agencyAdmin.subdomain || 'test' + (Date.now() - 1000);
      duplicateData.subdomain = firstTenantSubdomain;

      this.reporter.logInfo(`Testing duplicate subdomain: ${duplicateData.subdomain}`);

      const response = await this.client.post('/tenants', duplicateData);

      // Should fail with 400
      TestUtils.assert(
        response.status === 400,
        'Should reject duplicate subdomain'
      );
      TestUtils.assert(!response.success, 'Response should indicate failure');

      this.reporter.logSuccess('Duplicate subdomain registration prevented successfully');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'System correctly rejected duplicate subdomain'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testInvalidData() {
    const testStart = Date.now();
    const testName = 'Reject invalid tenant creation data';

    try {
      // Test with missing required fields
      const invalidData = {
        ownerEmail: TestUtils.generateUniqueEmail('invalid')
        // Missing other required fields like subdomain, ownerName, ownerPassword
      };

      this.reporter.logInfo('Testing tenant creation with missing fields');

      const response = await this.client.post('/tenants', invalidData);

      // Should fail with 400 or 500
      TestUtils.assert(response.status === 400 || response.status === 500, 'Should reject invalid data');
      TestUtils.assert(!response.success, 'Response should indicate failure');

      this.reporter.logSuccess('Invalid data rejected successfully');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'System correctly validated input data'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  getTestData() {
    return this.testData;
  }
}

// Run if called directly
if (require.main === module) {
  const test = new AgencyAdminRegistrationTest();
  test.run()
    .then(result => {
      console.log('\nTest Data for next tests:');
      console.log(JSON.stringify(result.testData, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = AgencyAdminRegistrationTest;
