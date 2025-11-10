/**
 * Test 9: Operator Functionality Test
 * Tests operator role permissions and data access
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

async function testOperatorDashboard(token) {
  logger.info('Testing operator dashboard access...');
  
  const result = await apiClient.get('/analytics/dashboard', token);
  
  if (result.success) {
    logger.success('Operator can access dashboard');
    const data = result.data.data || result.data;
    logger.info(`Dashboard stats: Customers=${data.totalCustomers || 0}, Bookings=${data.totalBookings || 0}`);
    return true;
  } else {
    logger.warning(`Dashboard access: ${result.error}`);
    return false;
  }
}

async function testOperatorCustomerAccess(token) {
  logger.info('Testing operator customer access...');
  
  const result = await apiClient.get('/customers', token);
  
  if (result.success) {
    const customers = result.data.data?.customers || result.data.data || [];
    logger.success(`Operator can view ${customers.length} customers`);
    return true;
  } else {
    logger.warning(`Customer access: ${result.error}`);
    return false;
  }
}

async function testOperatorItineraryAccess(token) {
  logger.info('Testing operator itinerary access...');
  
  const result = await apiClient.get('/itineraries', token);
  
  if (result.success) {
    const itineraries = result.data.data?.itineraries || result.data.data || [];
    logger.success(`Operator can view ${itineraries.length} itineraries`);
    return true;
  } else {
    logger.warning(`Itinerary access: ${result.error}`);
    return false;
  }
}

async function testOperatorQuoteAccess(token) {
  logger.info('Testing operator quote access...');
  
  const result = await apiClient.get('/quotes', token);
  
  if (result.success) {
    const quotes = result.data.data?.quotes || result.data.data || [];
    logger.success(`Operator can view ${quotes.length} quotes`);
    return true;
  } else {
    logger.warning(`Quote access: ${result.error}`);
    return false;
  }
}

async function testOperatorBookingAccess(token) {
  logger.info('Testing operator booking access...');
  
  const result = await apiClient.get('/bookings', token);
  
  if (result.success) {
    const bookings = result.data.data?.bookings || result.data.data || [];
    logger.success(`Operator can view ${bookings.length} bookings`);
    return true;
  } else {
    logger.warning(`Booking access: ${result.error}`);
    return false;
  }
}

async function testOperatorCreateCapabilities(token) {
  logger.info('Testing operator create capabilities...');
  
  // Test creating a test customer
  const result = await apiClient.post('/customers', {
    firstName: 'Test',
    lastName: 'Customer',
    email: `test${Date.now()}@test.com`,
    phone: '+91 99999 99999',
    password: 'Test@123'
  }, token);
  
  if (result.success) {
    logger.success('Operator can create customers');
    return true;
  } else {
    logger.warning(`Customer creation: ${result.error}`);
    return false;
  }
}

async function testOperatorTenantIsolation(token) {
  logger.info('Testing tenant isolation...');
  
  // Get tenant from dataStore
  const tenant = dataStore.getTenant();
  if (!tenant) {
    logger.warning('No tenant info available for isolation test');
    return false;
  }
  
  // Try to access customers (should only see own tenant)
  const result = await apiClient.get('/customers', token);
  
  if (result.success) {
    const customers = result.data.data?.customers || result.data.data || [];
    
    // Check if all customers belong to the same tenant
    const allSameTenant = customers.every(c => 
      !c.tenantId || c.tenantId === tenant.id || c.tenantId === tenant.id.toString()
    );
    
    if (allSameTenant || customers.length === 0) {
      logger.success('Tenant isolation working: All data belongs to operator\'s tenant');
      return true;
    } else {
      logger.error('Tenant isolation FAILED: Found data from other tenants!');
      return false;
    }
  } else {
    logger.warning(`Could not verify isolation: ${result.error}`);
    return false;
  }
}

async function runTest() {
  logger.step('TEST 9: Operator Functionality & Permissions');
  
  const token = apiClient.getToken('operator');
  if (!token) {
    logger.error('No operator token found. Run Test 2 first.');
    const result = { success: false, error: 'No operator token' };
    dataStore.addTestResult('Test 9: Operator Functionality', result);
    return result;
  }
  
  let passedTests = 0;
  const totalTests = 7;
  
  // Run all operator tests
  if (await testOperatorDashboard(token)) passedTests++;
  if (await testOperatorCustomerAccess(token)) passedTests++;
  if (await testOperatorItineraryAccess(token)) passedTests++;
  if (await testOperatorQuoteAccess(token)) passedTests++;
  if (await testOperatorBookingAccess(token)) passedTests++;
  if (await testOperatorCreateCapabilities(token)) passedTests++;
  if (await testOperatorTenantIsolation(token)) passedTests++;
  
  logger.info(`Operator tests passed: ${passedTests}/${totalTests}`);
  
  const result = { 
    success: passedTests >= 5, // At least 5 out of 7 tests should pass
    passedTests,
    totalTests
  };
  
  dataStore.addTestResult('Test 9: Operator Functionality', result);
  return result;
}

module.exports = { runTest };
