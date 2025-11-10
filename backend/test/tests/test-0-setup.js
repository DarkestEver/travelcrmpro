/**
 * Test 0: Setup and Health Check
 */

const axios = require('axios');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

async function checkServerHealth() {
  logger.step('TEST 0: Checking Backend Server Health');

  try {
    // Try multiple health check endpoints
    const endpoints = [
      'http://localhost:5000/health',
      'http://localhost:5000/api/v1/health',
      'http://localhost:5000/'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 3000 });
        logger.success(`Backend server is running on port 5000 (${endpoint})`);
        return { success: true };
      } catch (err) {
        // Try next endpoint
      }
    }
    
    logger.error('Backend server is not reachable on any endpoint');
    logger.info('Please ensure: npm start is running in backend directory');
    return { success: false, error: 'Server not running' };
  } catch (error) {
    logger.error('Backend server is not reachable');
    logger.info('Please ensure: npm start is running in backend directory');
    return { success: false, error: 'Server not running' };
  }
}

async function checkDatabaseConnection(token) {
  logger.info('Checking database connection...');
  
  try {
    // Try to fetch users (requires auth)
    const apiClient = require('../utils/api-client');
    const result = await apiClient.get('/users', token);
    
    if (result.success) {
      logger.success('Database connection is working');
      return { success: true };
    } else {
      logger.warning('Database query returned error');
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error(`Database check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function waitForServer(maxAttempts = 12, delayMs = 5000) {
  logger.info('Waiting for server to be ready...');
  
  const endpoints = [
    'http://localhost:5000/health',
    'http://localhost:5000/api/v1/health',
    'http://localhost:5000/'
  ];
  
  for (let i = 0; i < maxAttempts; i++) {
    for (const endpoint of endpoints) {
      try {
        await axios.get(endpoint, { timeout: 3000 });
        logger.success(`Server is ready at ${endpoint}!`);
        return true;
      } catch (error) {
        // Try next endpoint
      }
    }
    logger.info(`Attempt ${i + 1}/${maxAttempts}: Server not ready yet, waiting...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  logger.error('Server did not become ready in time');
  return false;
}

async function runTest() {
  const result = await checkServerHealth();
  dataStore.addTestResult('Test 0: Server Health Check', result);
  
  if (!result.success) {
    logger.warning('Waiting 60 seconds for nodemon to restart server...');
    const ready = await waitForServer();
    
    if (!ready) {
      return { success: false, error: 'Server not available' };
    }
  }
  
  return { success: true };
}

module.exports = { runTest, checkDatabaseConnection };
