/**
 * Test 4: Operator Workflow Tests
 * Tests operator role creating various entities
 */

const ApiClient = require('./helpers/api-client');
const DataGenerator = require('./helpers/data-generator');
const TestReporter = require('./helpers/test-reporter');
const TestUtils = require('./helpers/test-utils');

class OperatorWorkflowTest {
  constructor(testData = {}) {
    this.client = new ApiClient();
    this.reporter = new TestReporter('Operator Workflow');
    this.testData = testData;
    this.operatorEntities = {};
  }

  async run() {
    this.reporter.logSection('OPERATOR WORKFLOW TESTS');
    
    try {
      // First create operator as agency admin
      await this.createOperator();
      
      // Login as operator
      await this.loginAsOperator();
      
      // Setup operator auth
      this.setupOperatorAuth();
      
      // Run operator workflow tests
      await this.testOperatorCreateAgent();
      await this.testOperatorCreateCustomer();
      await this.testOperatorCreateSupplier();
      await this.testOperatorCreateItinerary();
      await this.testOperatorCreateQuote();
      await this.testOperatorCreateBooking();
      
      this.reporter.printSummary();
      const reportPath = this.reporter.saveReport();
      
      return {
        success: this.reporter.getSummary().failed === 0,
        summary: this.reporter.getSummary(),
        operatorEntities: this.operatorEntities,
        reportPath
      };
    } catch (error) {
      this.reporter.logError(`Test suite failed: ${error.message}`);
      this.reporter.printSummary();
      throw error;
    }
  }

  async createOperator() {
    const testStart = Date.now();
    const testName = 'Create operator user (as agency admin)';

    try {
      TestUtils.assertNotNull(this.testData.agencyAdmin, 'Agency admin data required');
      
      // Setup agency admin auth
      this.client.setToken(this.testData.agencyAdmin.token);
      if (this.testData.agencyAdmin.tenantId) {
        this.client.setTenant(this.testData.agencyAdmin.tenantId);
      }

      // Step 1: Create user via /auth/register
      const operatorData = DataGenerator.generateOperator({
        firstName: 'Bob',
        lastName: 'Operator',
        email: TestUtils.generateUniqueEmail('operator')
      });

      this.reporter.logInfo(`Creating operator user: ${operatorData.email}`);

      const response = await this.client.post('/auth/register', operatorData);

      TestUtils.assertStatusCode(response.status, 201, 'Should create operator with 201');
      TestUtils.assert(response.success, 'Operator creation should be successful');

      const operator = response.data.user || response.data.data?.user || response.data;
      TestUtils.assertEqual(operator.role, 'operator', 'Role should be operator');

      this.testData.operator = {
        ...operatorData,
        id: operator._id || operator.id,
        tenantId: this.testData.agencyAdmin.tenantId
      };

      this.reporter.logSuccess(`Operator created: ${this.testData.operator.id}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Operator ID: ${this.testData.operator.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
      throw error;
    }
  }

  async loginAsOperator() {
    const testStart = Date.now();
    const testName = 'Login as operator';

    try {
      this.client.reset();

      const loginData = {
        email: this.testData.operator.email,
        password: this.testData.operator.password
      };

      this.reporter.logInfo(`Logging in as operator: ${loginData.email}`);

      const response = await this.client.post('/auth/login', loginData);

      TestUtils.assertStatusCode(response.status, 200, 'Login should return 200');
      TestUtils.assert(response.success, 'Login should be successful');

      this.testData.operator.token = response.data.token;

      this.reporter.logSuccess('Operator login successful');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Token obtained'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
      throw error;
    }
  }

  setupOperatorAuth() {
    this.client.setToken(this.testData.operator.token);
    if (this.testData.operator.tenantId) {
      this.client.setTenant(this.testData.operator.tenantId);
    }
    this.reporter.logInfo('Authenticated as operator');
  }

  async testOperatorCreateAgent() {
    const testStart = Date.now();
    const testName = 'Operator creates agent';

    try {
      // Step 1: Create user via /auth/register
      const agentData = DataGenerator.generateAgent({
        firstName: 'Sarah',
        lastName: 'OperatorAgent',
        email: TestUtils.generateUniqueEmail('op-agent')
      });

      const agentUserData = {
        name: agentData.name,
        email: agentData.email,
        password: agentData.password,
        role: agentData.role,
        phone: agentData.phone
      };

      this.reporter.logInfo(`Creating agent: ${agentUserData.email}`);

      const userResponse = await this.client.post('/auth/register', agentUserData);
      TestUtils.assertStatusCode(userResponse.status, 201, 'Should create agent with 201');

      const user = userResponse.data.user || userResponse.data.data?.user || userResponse.data;
      const userId = user._id || user.id;

      // Step 2: Create agent profile
      const agentProfileData = {
        userId: userId,
        agencyName: 'Operator Agent Agency',
        contactPerson: agentUserData.name,
        email: agentUserData.email,
        phone: agentUserData.phone,
        address: {
          street: '789 Agent St',
          city: 'New York',
          state: 'NY',
          zipCode: '10003',
          country: 'USA'
        },
        tier: 'bronze'
      };

      const agentResponse = await this.client.post('/agents', agentProfileData);
      TestUtils.assertStatusCode(agentResponse.status, 201, 'Should create agent profile with 201');

      const agent = agentResponse.data.agent || agentResponse.data.data?.agent || agentResponse.data;
      const agentId = agent._id || agent.id;

      this.operatorEntities.agent = {
        userId: userId,
        agentId: agentId,
        email: agentUserData.email
      };

      this.reporter.logSuccess(`Agent created: ${agentId}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Agent ID: ${agentId}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testOperatorCreateCustomer() {
    const testStart = Date.now();
    const testName = 'Operator creates customer';

    try {
      // Step 1: Create user via /auth/register
      const customerData = DataGenerator.generateCustomer({
        firstName: 'Mike',
        lastName: 'OperatorCustomer',
        email: TestUtils.generateUniqueEmail('op-customer')
      });

      const customerUserData = {
        name: customerData.name,
        email: customerData.email,
        password: customerData.password,
        role: customerData.role,
        phone: customerData.phone
      };

      this.reporter.logInfo(`Creating customer: ${customerUserData.email}`);

      const userResponse = await this.client.post('/auth/register', customerUserData);
      TestUtils.assertStatusCode(userResponse.status, 201, 'Should create customer with 201');

      const user = userResponse.data.user || userResponse.data.data?.user || userResponse.data;
      const userId = user._id || user.id;

      // Step 2: Create customer profile
      const customerProfileData = {
        userId: userId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        passportNumber: customerData.passportNumber,
        dateOfBirth: customerData.dateOfBirth,
        nationality: customerData.nationality
      };

      const customerResponse = await this.client.post('/customers', customerProfileData);
      TestUtils.assertStatusCode(customerResponse.status, 201, 'Should create customer profile with 201');

      const customer = customerResponse.data.customer || customerResponse.data.data?.customer || customerResponse.data;
      const customerId = customer._id || customer.id;

      this.operatorEntities.customer = {
        userId: userId,
        customerId: customerId,
        email: customerUserData.email
      };

      this.reporter.logSuccess(`Customer created: ${customerId}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Customer ID: ${customerId}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testOperatorCreateSupplier() {
    const testStart = Date.now();
    const testName = 'Operator creates supplier';

    try {
      // Step 1: Create user via /auth/register
      const supplierUserData = {
        name: 'Luxury Airlines Contact',
        email: TestUtils.generateUniqueEmail('op-supplier'),
        password: 'Supplier@123456',
        role: 'agent', // Suppliers use agent role
        phone: '+1-555-7777'
      };

      this.reporter.logInfo(`Creating supplier: ${supplierUserData.email}`);

      const userResponse = await this.client.post('/auth/register', supplierUserData);
      TestUtils.assertStatusCode(userResponse.status, 201, 'Should create user with 201');

      const user = userResponse.data.user || userResponse.data.data?.user || userResponse.data;
      const userId = user._id || user.id;

      // Step 2: Create supplier profile
      const supplierProfileData = {
        userId: userId,
        companyName: 'Luxury Airlines Corp',
        contactPersons: [{
          name: supplierUserData.name,
          email: supplierUserData.email,
          phone: supplierUserData.phone,
          isPrimary: true
        }],
        email: supplierUserData.email,
        phone: supplierUserData.phone,
        country: 'USA',
        city: 'Los Angeles',
        state: 'CA',
        serviceTypes: ['transport'],
        paymentTerms: 'Net 30'
      };

      const supplierResponse = await this.client.post('/suppliers', supplierProfileData);
      TestUtils.assertStatusCode(supplierResponse.status, 201, 'Should create supplier with 201');

      const supplier = supplierResponse.data.supplier || supplierResponse.data.data?.supplier || supplierResponse.data;
      const supplierId = supplier._id || supplier.id;

      this.operatorEntities.supplier = {
        userId: userId,
        supplierId: supplierId,
        email: supplierUserData.email
      };

      this.reporter.logSuccess(`Supplier created: ${supplierId}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Supplier ID: ${supplierId}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testOperatorCreateItinerary() {
    const testStart = Date.now();
    const testName = 'Operator creates itinerary';

    try {
      if (!this.operatorEntities.customer) {
        throw new Error('Customer must be created first');
      }

      const itineraryData = DataGenerator.generateItinerary(
        this.operatorEntities.customer.customerId,
        { title: 'Tokyo Adventure Package' }
      );

      this.reporter.logInfo(`Creating itinerary: ${itineraryData.title}`);

      const response = await this.client.post('/itineraries', itineraryData);

      TestUtils.assertStatusCode(response.status, 201, 'Should create itinerary with 201');

      const itinerary = response.data.data?.itinerary || response.data.itinerary || response.data;
      this.operatorEntities.itinerary = {
        ...itineraryData,
        id: itinerary._id || itinerary.id
      };

      this.reporter.logSuccess(`Itinerary created: ${this.operatorEntities.itinerary.id}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Itinerary ID: ${this.operatorEntities.itinerary.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testOperatorCreateQuote() {
    const testStart = Date.now();
    const testName = 'Operator creates quote';

    try {
      if (!this.operatorEntities.customer) {
        throw new Error('Customer must be created first');
      }
      if (!this.operatorEntities.agent) {
        throw new Error('Agent must be created first');
      }
      if (!this.operatorEntities.itinerary) {
        throw new Error('Itinerary must be created first');
      }

      const quoteData = DataGenerator.generateQuote(
        this.operatorEntities.customer.customerId,
        {
          title: 'Tokyo Adventure Quote',
          itineraryId: this.operatorEntities.itinerary.id,
          agentId: this.operatorEntities.agent.agentId,
          numberOfTravelers: 2,
          travelDates: {
            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)
          },
          pricing: {
            baseCost: 5000,
            markup: { percentage: 15, amount: 750 },
            taxes: { amount: 575 },
            totalPrice: 6325
          }
        }
      );

      this.reporter.logInfo(`Creating quote: ${quoteData.title}`);

      const response = await this.client.post('/quotes', quoteData);

      TestUtils.assertStatusCode(response.status, 201, 'Should create quote with 201');

      const quote = response.data.data?.quote || response.data.quote || response.data;
      this.operatorEntities.quote = {
        ...quoteData,
        id: quote._id || quote.id
      };

      this.reporter.logSuccess(`Quote created: ${this.operatorEntities.quote.id}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Quote ID: ${this.operatorEntities.quote.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testOperatorCreateBooking() {
    const testStart = Date.now();
    const testName = 'Operator creates booking';

    try {
      if (!this.operatorEntities.customer || !this.operatorEntities.itinerary) {
        throw new Error('Customer and itinerary must be created first');
      }
      if (!this.operatorEntities.quote) {
        throw new Error('Quote must be created first');
      }
      if (!this.operatorEntities.agent) {
        throw new Error('Agent must be created first');
      }

      const bookingData = DataGenerator.generateBooking(
        this.operatorEntities.customer.customerId,
        this.operatorEntities.itinerary.id,
        {
          quoteId: this.operatorEntities.quote.id,
          agentId: this.operatorEntities.agent.agentId,
          travelDates: {
            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)
          },
          financial: {
            totalAmount: 6325,
            paidAmount: 2000,
            pendingAmount: 4325,
            currency: 'USD'
          }
        }
      );

      this.reporter.logInfo('Creating booking');

      const response = await this.client.post('/bookings', bookingData);

      TestUtils.assertStatusCode(response.status, 201, 'Should create booking with 201');

      const booking = response.data.data?.booking || response.data.booking || response.data;
      this.operatorEntities.booking = {
        ...bookingData,
        id: booking._id || booking.id
      };

      this.reporter.logSuccess(`Booking created: ${this.operatorEntities.booking.id}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Booking ID: ${this.operatorEntities.booking.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  getOperatorEntities() {
    return this.operatorEntities;
  }
}

module.exports = OperatorWorkflowTest;
