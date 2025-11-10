/**
 * Test 3: Agency Admin Workflow Tests
 * Tests creating agents, customers, suppliers, itineraries, quotes, bookings
 */

const ApiClient = require('./helpers/api-client');
const DataGenerator = require('./helpers/data-generator');
const TestReporter = require('./helpers/test-reporter');
const TestUtils = require('./helpers/test-utils');

class AgencyAdminWorkflowTest {
  constructor(testData = {}) {
    this.client = new ApiClient();
    this.reporter = new TestReporter('Agency Admin Workflow');
    this.testData = testData;
    this.createdEntities = {};
  }

  async run() {
    this.reporter.logSection('AGENCY ADMIN WORKFLOW TESTS');
    
    try {
      // Setup authentication
      this.setupAuth();
      
      // Run tests
      await this.testCreateAgent();
      await this.testCreateCustomer();
      await this.testCreateSupplier();
      await this.testCreateItinerary();
      await this.testCreateQuote();
      await this.testCreateBooking();
      await this.testListAllEntities();
      
      this.reporter.printSummary();
      const reportPath = this.reporter.saveReport();
      
      return {
        success: this.reporter.getSummary().failed === 0,
        summary: this.reporter.getSummary(),
        createdEntities: this.createdEntities,
        reportPath
      };
    } catch (error) {
      this.reporter.logError(`Test suite failed: ${error.message}`);
      this.reporter.printSummary();
      throw error;
    }
  }

  setupAuth() {
    TestUtils.assertNotNull(this.testData.agencyAdmin, 'Agency admin data required');
    TestUtils.assertNotNull(this.testData.agencyAdmin.token, 'Agency admin token required');
    
    this.client.setToken(this.testData.agencyAdmin.token);
    if (this.testData.agencyAdmin.tenantId) {
      this.client.setTenant(this.testData.agencyAdmin.tenantId);
    }
    
    this.reporter.logInfo('Authenticated as agency admin');
  }

  async testCreateAgent() {
    const testStart = Date.now();
    const testName = 'Create agent user';

    try {
      // Step 1: Create user via /auth/register
      const agentUserData = DataGenerator.generateAgent({
        firstName: 'John',
        lastName: 'Agent',
        email: TestUtils.generateUniqueEmail('agent')
      });

      this.reporter.logInfo(`Step 1: Creating user for agent: ${agentUserData.email}`);

      const userResponse = await this.client.post('/auth/register', agentUserData);

      TestUtils.assertStatusCode(userResponse.status, 201, 'Should create user with 201');
      TestUtils.assert(userResponse.success, 'User creation should be successful');
      TestUtils.assertNotNull(userResponse.data, 'Response should contain user data');

      const user = userResponse.data.user || userResponse.data.data?.user || userResponse.data;
      const userId = user._id || user.id;
      TestUtils.assertNotNull(userId, 'User should have ID');

      this.reporter.logSuccess(`User created: ${userId}`);

      // Step 2: Create agent profile via /agents
      const agentProfileData = {
        userId: userId,
        agencyName: 'Smith Travel Agency',
        contactPerson: agentUserData.name,
        email: agentUserData.email,
        phone: agentUserData.phone,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        creditLimit: 10000,
        tier: 'silver'
      };

      this.reporter.logInfo(`Step 2: Creating agent profile for user: ${userId}`);

      const agentResponse = await this.client.post('/agents', agentProfileData);

      TestUtils.assertStatusCode(agentResponse.status, 201, 'Should create agent profile with 201');
      TestUtils.assert(agentResponse.success, 'Agent creation should be successful');
      TestUtils.assertNotNull(agentResponse.data, 'Response should contain agent data');

      const agent = agentResponse.data.agent || agentResponse.data.data?.agent || agentResponse.data;
      const agentId = agent._id || agent.id;
      TestUtils.assertNotNull(agentId, 'Agent should have ID');

      this.createdEntities.agent = {
        userId: userId,
        agentId: agentId,
        email: agentUserData.email,
        agencyName: agentProfileData.agencyName
      };

      this.reporter.logSuccess(`Agent profile created: ${agentId}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `User ID: ${userId}, Agent ID: ${agentId}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCreateCustomer() {
    const testStart = Date.now();
    const testName = 'Create customer user';

    try {
      // Step 1: Create user via /auth/register
      const customerData = DataGenerator.generateCustomer({
        firstName: 'Jane',
        lastName: 'Customer',
        email: TestUtils.generateUniqueEmail('customer')
      });

      // Extract only user fields for registration
      const customerUserData = {
        name: customerData.name,
        email: customerData.email,
        password: customerData.password,
        role: customerData.role,
        phone: customerData.phone
      };

      this.reporter.logInfo(`Step 1: Creating user for customer: ${customerUserData.email}`);

      const userResponse = await this.client.post('/auth/register', customerUserData);

      TestUtils.assertStatusCode(userResponse.status, 201, 'Should create user with 201');
      TestUtils.assert(userResponse.success, 'User creation should be successful');

      const user = userResponse.data.user || userResponse.data.data?.user || userResponse.data;
      const userId = user._id || user.id;
      TestUtils.assertNotNull(userId, 'User should have ID');

      this.reporter.logSuccess(`User created: ${userId}`);

      // Step 2: Create customer profile via /customers
      const customerProfileData = {
        userId: userId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        passportNumber: customerData.passportNumber,
        dateOfBirth: customerData.dateOfBirth,
        nationality: customerData.nationality,
        preferences: {
          seatPreference: 'window',
          mealPreference: 'vegetarian'
        }
      };

      this.reporter.logInfo(`Step 2: Creating customer profile for user: ${userId}`);

      const customerResponse = await this.client.post('/customers', customerProfileData);

      TestUtils.assertStatusCode(customerResponse.status, 201, 'Should create customer profile with 201');
      TestUtils.assert(customerResponse.success, 'Customer creation should be successful');

      const customer = customerResponse.data.customer || customerResponse.data.data?.customer || customerResponse.data;
      const customerId = customer._id || customer.id;
      TestUtils.assertNotNull(customerId, 'Customer should have ID');

      this.createdEntities.customer = {
        userId: userId,
        customerId: customerId,
        email: customerUserData.email
      };

      this.reporter.logSuccess(`Customer profile created: ${customerId}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `User ID: ${userId}, Customer ID: ${customerId}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCreateSupplier() {
    const testStart = Date.now();
    const testName = 'Create supplier';

    try {
      // Step 1: Create user via /auth/register
      const supplierUserData = {
        name: 'Premium Hotels Contact',
        email: TestUtils.generateUniqueEmail('supplier'),
        password: 'Test@123456',
        phone: '+1-555-0202',
        role: 'agent' // Suppliers don't have a dedicated role, use agent
      };

      this.reporter.logInfo(`Step 1: Creating user for supplier: ${supplierUserData.email}`);

      const userResponse = await this.client.post('/auth/register', supplierUserData);

      TestUtils.assertStatusCode(userResponse.status, 201, 'Should create user with 201');

      const user = userResponse.data.user || userResponse.data.data?.user || userResponse.data;
      const userId = user._id || user.id;
      TestUtils.assertNotNull(userId, 'User should have ID');

      this.reporter.logSuccess(`User created: ${userId}`);

      // Step 2: Create supplier profile via /suppliers
      const supplierData = {
        userId: userId,
        companyName: 'Premium Hotels Inc',
        contactPersons: [{
          name: supplierUserData.name,
          email: supplierUserData.email,
          phone: supplierUserData.phone,
          isPrimary: true
        }],
        email: supplierUserData.email,
        phone: supplierUserData.phone,
        country: 'USA',
        city: 'New York',
        state: 'NY',
        address: {
          street: '456 Hotel Avenue',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10002'
        },
        serviceTypes: ['hotel'],
        paymentTerms: 'Net 30'
      };

      this.reporter.logInfo(`Step 2: Creating supplier profile for user: ${userId}`);

      const response = await this.client.post('/suppliers', supplierData);

      TestUtils.assertStatusCode(response.status, 201, 'Should create supplier with 201');
      TestUtils.assert(response.success, 'Supplier creation should be successful');

      const supplier = response.data.supplier || response.data.data?.supplier || response.data;
      const supplierId = supplier._id || supplier.id;
      TestUtils.assertNotNull(supplierId, 'Supplier should have ID');

      this.createdEntities.supplier = {
        userId: userId,
        supplierId: supplierId,
        companyName: supplierData.companyName
      };

      this.reporter.logSuccess(`Supplier created: ${supplierId}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `User ID: ${userId}, Supplier ID: ${supplierId}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCreateItinerary() {
    const testStart = Date.now();
    const testName = 'Create itinerary';

    try {
      if (!this.createdEntities.customer) {
        throw new Error('Customer must be created first');
      }

      const itineraryData = DataGenerator.generateItinerary(
        this.createdEntities.customer.customerId,
        { title: 'Paris Vacation Package' }
      );

      this.reporter.logInfo(`Creating itinerary: ${itineraryData.title}`);

      const response = await this.client.post('/itineraries', itineraryData);

      TestUtils.assertStatusCode(response.status, 201, 'Should create itinerary with 201');
      TestUtils.assert(response.success, 'Itinerary creation should be successful');

      const itinerary = response.data.data?.itinerary || response.data.itinerary || response.data;
      TestUtils.assertNotNull(itinerary._id || itinerary.id, 'Itinerary should have ID');

      this.createdEntities.itinerary = {
        ...itineraryData,
        id: itinerary._id || itinerary.id
      };

      this.reporter.logSuccess(`Itinerary created: ${this.createdEntities.itinerary.id}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Itinerary ID: ${this.createdEntities.itinerary.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCreateQuote() {
    const testStart = Date.now();
    const testName = 'Create quote';

    try {
      if (!this.createdEntities.customer) {
        throw new Error('Customer must be created first');
      }
      if (!this.createdEntities.agent) {
        throw new Error('Agent must be created first');
      }
      if (!this.createdEntities.itinerary) {
        throw new Error('Itinerary must be created first');
      }

      const quoteData = DataGenerator.generateQuote(
        this.createdEntities.customer.customerId,
        {
          title: 'Paris Vacation Quote',
          itineraryId: this.createdEntities.itinerary.id,
          agentId: this.createdEntities.agent.agentId,
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
      TestUtils.assert(response.success, 'Quote creation should be successful');

      const quote = response.data.data?.quote || response.data.quote || response.data;
      TestUtils.assertNotNull(quote._id || quote.id, 'Quote should have ID');

      this.createdEntities.quote = {
        ...quoteData,
        id: quote._id || quote.id
      };

      this.reporter.logSuccess(`Quote created: ${this.createdEntities.quote.id}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Quote ID: ${this.createdEntities.quote.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testCreateBooking() {
    const testStart = Date.now();
    const testName = 'Create booking';

    try {
      if (!this.createdEntities.customer || !this.createdEntities.itinerary) {
        throw new Error('Customer and itinerary must be created first');
      }
      if (!this.createdEntities.quote) {
        throw new Error('Quote must be created first');
      }
      if (!this.createdEntities.agent) {
        throw new Error('Agent must be created first');
      }

      const bookingData = DataGenerator.generateBooking(
        this.createdEntities.customer.customerId,
        this.createdEntities.itinerary.id,
        {
          quoteId: this.createdEntities.quote.id,
          agentId: this.createdEntities.agent.agentId,
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
      TestUtils.assert(response.success, 'Booking creation should be successful');

      const booking = response.data.data?.booking || response.data.booking || response.data;
      TestUtils.assertNotNull(booking._id || booking.id, 'Booking should have ID');

      this.createdEntities.booking = {
        ...bookingData,
        id: booking._id || booking.id
      };

      this.reporter.logSuccess(`Booking created: ${this.createdEntities.booking.id}`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: `Booking ID: ${this.createdEntities.booking.id}`
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testListAllEntities() {
    const testStart = Date.now();
    const testName = 'List all created entities';

    try {
      this.reporter.logInfo('Fetching all entities to verify creation');

      const endpoints = [
        { name: 'Users', path: '/users' },
        { name: 'Suppliers', path: '/suppliers' },
        { name: 'Itineraries', path: '/itineraries' },
        { name: 'Quotes', path: '/quotes' },
        { name: 'Bookings', path: '/bookings' }
      ];

      let allSuccess = true;

      for (const endpoint of endpoints) {
        const response = await this.client.get(endpoint.path);
        
        if (response.success && response.status === 200) {
          this.reporter.logInfo(`${endpoint.name}: ${response.data.length || 0} items found`);
        } else {
          this.reporter.logWarning(`Failed to fetch ${endpoint.name}`);
          allSuccess = false;
        }
      }

      TestUtils.assert(allSuccess, 'All entity lists should be accessible');

      this.reporter.logSuccess('All entities verified');

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'All entity lists accessible'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  getCreatedEntities() {
    return this.createdEntities;
  }
}

module.exports = AgencyAdminWorkflowTest;
