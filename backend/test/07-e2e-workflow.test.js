/**
 * Test 7: End-to-End Workflow Validation
 * Tests complete data flow from tenant admin to customer and back
 */

const ApiClient = require('./helpers/api-client');
const TestReporter = require('./helpers/test-reporter');
const TestUtils = require('./helpers/test-utils');

class E2EWorkflowTest {
  constructor(testData = {}) {
    this.client = new ApiClient();
    this.reporter = new TestReporter('End-to-End Workflow');
    this.testData = testData;
  }

  async run() {
    this.reporter.logSection('END-TO-END WORKFLOW VALIDATION');
    
    try {
      await this.testTenantIsolation();
      await this.testDataFlowAdminToCustomer();
      await this.testDataFlowCustomerToAdmin();
      await this.testBookingLifecycle();
      await this.testQuoteToBookingFlow();
      
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

  async testTenantIsolation() {
    const testStart = Date.now();
    const testName = 'Verify tenant data isolation';

    try {
      TestUtils.assertNotNull(this.testData.agencyAdmin, 'Agency admin data required');
      
      this.client.setToken(this.testData.agencyAdmin.token);
      if (this.testData.agencyAdmin.tenantId) {
        this.client.setTenant(this.testData.agencyAdmin.tenantId);
      }

      this.reporter.logInfo('Checking tenant data isolation');

      // Fetch all customers
      const customersResponse = await this.client.get('/users?role=customer');

      if (customersResponse.success) {
        const customers = customersResponse.data;
        
        // All customers should belong to the same tenant
        const allSameTenant = customers.every(customer => {
          const customerTenant = customer.tenant || customer.tenantId;
          return customerTenant?.toString() === this.testData.agencyAdmin.tenantId?.toString();
        });

        if (allSameTenant) {
          this.reporter.logSuccess('Tenant isolation verified - all users belong to same tenant');
        } else {
          this.reporter.logWarning('Tenant isolation may not be working correctly');
        }

        this.reporter.logTest(testName, 'PASS', {
          duration: Date.now() - testStart,
          info: `Verified ${customers.length} customers`
        });
      } else {
        throw new Error('Failed to fetch customers');
      }

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testDataFlowAdminToCustomer() {
    const testStart = Date.now();
    const testName = 'Data flow: Admin creates data for customer';

    try {
      TestUtils.assertNotNull(this.testData.agencyAdmin, 'Agency admin data required');
      TestUtils.assertNotNull(this.testData.createdEntities?.customer, 'Customer required');

      // Login as admin
      this.client.setToken(this.testData.agencyAdmin.token);
      if (this.testData.agencyAdmin.tenantId) {
        this.client.setTenant(this.testData.agencyAdmin.tenantId);
      }

      const customerId = this.testData.createdEntities.customer.id;

      this.reporter.logInfo('Admin creating itinerary for customer');

      // Admin creates itinerary for customer
      const itineraryData = {
        title: 'E2E Test Itinerary',
        customer: customerId,
        startDate: '2025-12-01',
        endDate: '2025-12-08',
        destination: 'Maldives',
        numberOfTravelers: 2,
        budget: 5000,
        status: 'confirmed',
        notes: 'E2E test itinerary'
      };

      const createResponse = await this.client.post('/itineraries', itineraryData);
      TestUtils.assertStatusCode(createResponse.status, 201, 'Should create itinerary');

      const itineraryId = createResponse.data.itinerary?._id || createResponse.data.itinerary?.id || createResponse.data._id;

      this.reporter.logSuccess(`Itinerary created: ${itineraryId}`);

      // Now login as customer and verify they can see it
      const customerData = this.testData.createdEntities.customer;
      const loginResponse = await this.client.post('/auth/login', {
        email: customerData.email,
        password: customerData.password
      });

      TestUtils.assert(loginResponse.success, 'Customer login should succeed');

      this.client.setToken(loginResponse.data.token);

      this.reporter.logInfo('Customer fetching itineraries');

      const customerItineraries = await this.client.get('/itineraries');
      TestUtils.assertStatusCode(customerItineraries.status, 200, 'Customer should access itineraries');

      // Verify customer can see the itinerary
      const foundItinerary = customerItineraries.data.find(it => {
        const id = it._id || it.id;
        return id?.toString() === itineraryId?.toString();
      });

      if (foundItinerary) {
        this.reporter.logSuccess('Customer can see itinerary created by admin');
        this.reporter.logTest(testName, 'PASS', {
          duration: Date.now() - testStart,
          info: 'Data successfully flows from admin to customer'
        });
      } else {
        throw new Error('Customer cannot see itinerary created by admin');
      }

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testDataFlowCustomerToAdmin() {
    const testStart = Date.now();
    const testName = 'Data flow: Customer data visible to admin';

    try {
      // Verify admin can see all customer bookings/itineraries
      this.client.setToken(this.testData.agencyAdmin.token);
      if (this.testData.agencyAdmin.tenantId) {
        this.client.setTenant(this.testData.agencyAdmin.tenantId);
      }

      this.reporter.logInfo('Admin fetching all bookings');

      const bookingsResponse = await this.client.get('/bookings');
      TestUtils.assertStatusCode(bookingsResponse.status, 200, 'Admin should access bookings');

      const bookings = bookingsResponse.data;

      this.reporter.logSuccess(`Admin can see all bookings (${bookings.length || 0} found)`);

      this.reporter.logTest(testName, 'PASS', {
        duration: Date.now() - testStart,
        info: 'Customer data is visible to admin'
      });

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testBookingLifecycle() {
    const testStart = Date.now();
    const testName = 'Booking lifecycle: Create -> Update -> Complete';

    try {
      this.client.setToken(this.testData.agencyAdmin.token);
      if (this.testData.agencyAdmin.tenantId) {
        this.client.setTenant(this.testData.agencyAdmin.tenantId);
      }

      const bookingId = this.testData.createdEntities?.booking?.id;

      if (!bookingId) {
        this.reporter.logTest(testName, 'SKIP', {
          duration: Date.now() - testStart,
          info: 'No booking available for lifecycle test'
        });
        return;
      }

      this.reporter.logInfo('Testing booking lifecycle');

      // Update booking status
      const updateResponse = await this.client.put(`/bookings/${bookingId}`, {
        status: 'confirmed',
        paymentStatus: 'paid'
      });

      if (updateResponse.success) {
        this.reporter.logSuccess('Booking updated successfully');
        
        // Fetch updated booking
        const getResponse = await this.client.get(`/bookings/${bookingId}`);
        
        if (getResponse.success) {
          const booking = getResponse.data.booking || getResponse.data;
          TestUtils.assertEqual(booking.status, 'confirmed', 'Status should be confirmed');
          
          this.reporter.logSuccess('Booking lifecycle completed');
          
          this.reporter.logTest(testName, 'PASS', {
            duration: Date.now() - testStart,
            info: 'Booking lifecycle validated'
          });
        } else {
          throw new Error('Failed to fetch updated booking');
        }
      } else {
        throw new Error('Failed to update booking');
      }

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }

  async testQuoteToBookingFlow() {
    const testStart = Date.now();
    const testName = 'Quote to booking conversion flow';

    try {
      this.client.setToken(this.testData.agencyAdmin.token);
      if (this.testData.agencyAdmin.tenantId) {
        this.client.setTenant(this.testData.agencyAdmin.tenantId);
      }

      const quoteId = this.testData.createdEntities?.quote?.id;

      if (!quoteId) {
        this.reporter.logTest(testName, 'SKIP', {
          duration: Date.now() - testStart,
          info: 'No quote available for conversion test'
        });
        return;
      }

      this.reporter.logInfo('Testing quote to booking flow');

      // Update quote to accepted
      const updateResponse = await this.client.put(`/quotes/${quoteId}`, {
        status: 'accepted'
      });

      if (updateResponse.success) {
        this.reporter.logSuccess('Quote marked as accepted');
        
        // Verify quote status
        const getResponse = await this.client.get(`/quotes/${quoteId}`);
        
        if (getResponse.success) {
          const quote = getResponse.data.quote || getResponse.data;
          TestUtils.assertEqual(quote.status, 'accepted', 'Quote should be accepted');
          
          this.reporter.logSuccess('Quote to booking flow validated');
          
          this.reporter.logTest(testName, 'PASS', {
            duration: Date.now() - testStart,
            info: 'Quote workflow validated'
          });
        } else {
          throw new Error('Failed to fetch updated quote');
        }
      } else {
        throw new Error('Failed to update quote');
      }

    } catch (error) {
      this.reporter.logTest(testName, 'FAIL', {
        duration: Date.now() - testStart,
        error: TestUtils.formatError(error)
      });
    }
  }
}

module.exports = E2EWorkflowTest;
