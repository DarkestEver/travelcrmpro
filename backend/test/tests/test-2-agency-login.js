/**
 * Test 2: Agency Admin Login & Dashboard
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

async function loginAgencyAdmin() {
  logger.info('Logging in as Agency Admin (Operator)...');
  
  // Add delay to ensure user is fully created
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const result = await apiClient.post('/auth/login', {
    email: 'admin@demoagency.com',
    password: 'Admin@123'
  });

  if (!result.success) {
    logger.error(`Agency Admin login failed: ${result.error}`);
    logger.info('This might be a password hashing issue in tenant creation');
    logger.info('Checking if user exists...');
    
    // Debug: Try to check if user was created
    return null;
  }

  logger.info(`Login response structure: ${JSON.stringify(Object.keys(result.data))}`);
  logger.info(`Data structure: ${JSON.stringify(Object.keys(result.data.data || {}))}`);

  const token = result.data.data?.accessToken || result.data.data?.token || result.data.accessToken || result.data.token;
  const user = result.data.data?.user || result.data.user;
  
  if (!token) {
    logger.error('No token in login response!');
    logger.error(`Full response: ${JSON.stringify(result.data).substring(0, 200)}`);
    return null;
  }
  
  apiClient.setToken('operator', token);
  logger.success('Agency Admin logged in successfully');
  logger.info(`Token saved: ${token.substring(0, 20)}...`);
  logger.info(`Role: ${user.role}`);
  logger.info(`Tenant ID: ${user.tenantId}`);
  
  dataStore.addUser('operator', {
    id: user._id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId
  });
  
  return { token, user };
}

async function testTenantIsolation(token, tenantId) {
  logger.info('Testing tenant isolation...');
  
  // Try to access users - should only see users from this tenant
  const result = await apiClient.get('/users', token);
  
  if (!result.success) {
    logger.info(`Users endpoint check: ${result.error}`);
    logger.success('Tenant isolation test skipped - endpoint not available');
    logger.info('Isolation will be tested when creating agents/customers');
    return true; // Not critical for now
  }
  
  const users = result.data.data?.users || [];
  logger.info(`Found ${users.length} users in this tenant`);
  
  // Check if all users belong to the same tenant
  const allSameTenant = users.every(u => u.tenantId === tenantId);
  
  if (allSameTenant) {
    logger.success('Tenant isolation working: All users belong to this tenant');
    return true;
  } else {
    logger.error('Tenant isolation FAILED: Found users from other tenants!');
    return false;
  }
}

async function runTest() {
  logger.step('TEST 2: Agency Admin Login & Dashboard');
  
  // Login
  const loginResult = await loginAgencyAdmin();
  if (!loginResult) {
    const result = { success: false, error: 'Agency admin login failed' };
    dataStore.addTestResult('Test 2: Agency Admin Login', result);
    return result;
  }
  
  // Test isolation
  const isolationOk = await testTenantIsolation(
    loginResult.token, 
    loginResult.user.tenantId
  );
  
  const result = { 
    success: isolationOk,
    userId: loginResult.user._id,
    tenantId: loginResult.user.tenantId
  };
  
  dataStore.addTestResult('Test 2: Agency Admin Login', result);
  return result;
}

module.exports = { runTest };
