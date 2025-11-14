/**
 * Health Check System Test
 * Phase 6.1: Tests for health monitoring service
 */

const mongoose = require('mongoose');
const colors = require('colors');

// Services
const healthCheckService = require('../src/services/healthCheckService');

// Test configuration
const TEST_CONFIG = {
  dbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test',
  timeout: 10000,
};

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// Test helper functions
function test(description, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    console.log(`✓ ${description}`.green);
  } catch (error) {
    results.failed++;
    results.errors.push({ description, error: error.message });
    console.log(`✗ ${description}`.red);
    console.log(`  Error: ${error.message}`.red);
  }
}

async function asyncTest(description, fn) {
  results.total++;
  try {
    await fn();
    results.passed++;
    console.log(`✓ ${description}`.green);
  } catch (error) {
    results.failed++;
    results.errors.push({ description, error: error.message });
    console.log(`✗ ${description}`.red);
    console.log(`  Error: ${error.message}`.red);
  }
}

// Assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Main test suite
async function runTests() {
  console.log('\n' + '='.repeat(70).cyan);
  console.log('HEALTH CHECK SYSTEM TEST'.cyan.bold);
  console.log('Phase 6.1: System Monitoring and Health Checks'.cyan);
  console.log('='.repeat(70).cyan + '\n');

  try {
    // Connect to test database
    console.log('Connecting to test database...'.yellow);
    await mongoose.connect(TEST_CONFIG.dbUri);
    console.log('✓ Connected to test database\n'.green);

    // Test 1: Service Method Existence
    console.log('Test Suite 1: Service Method Existence'.cyan.bold);
    test('healthCheckService exists', () => {
      assert(healthCheckService, 'Service not found');
      assert(typeof healthCheckService === 'object', 'Service is not an object');
    });

    test('checkDatabase method exists', () => {
      assert(
        typeof healthCheckService.checkDatabase === 'function',
        'checkDatabase method not found'
      );
    });

    test('checkStripe method exists', () => {
      assert(
        typeof healthCheckService.checkStripe === 'function',
        'checkStripe method not found'
      );
    });

    test('checkEmail method exists', () => {
      assert(
        typeof healthCheckService.checkEmail === 'function',
        'checkEmail method not found'
      );
    });

    test('checkMemory method exists', () => {
      assert(
        typeof healthCheckService.checkMemory === 'function',
        'checkMemory method not found'
      );
    });

    test('checkDisk method exists', () => {
      assert(
        typeof healthCheckService.checkDisk === 'function',
        'checkDisk method not found'
      );
    });

    test('checkCPU method exists', () => {
      assert(
        typeof healthCheckService.checkCPU === 'function',
        'checkCPU method not found'
      );
    });

    test('performFullHealthCheck method exists', () => {
      assert(
        typeof healthCheckService.performFullHealthCheck === 'function',
        'performFullHealthCheck method not found'
      );
    });

    test('performQuickHealthCheck method exists', () => {
      assert(
        typeof healthCheckService.performQuickHealthCheck === 'function',
        'performQuickHealthCheck method not found'
      );
    });

    // Test 2: Database Health Check
    console.log('\nTest Suite 2: Database Health Check'.cyan.bold);
    await asyncTest('checkDatabase returns valid structure', async () => {
      const result = await healthCheckService.checkDatabase();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(result.message, 'Missing message field');
      assert(['healthy', 'unhealthy', 'warning'].includes(result.status), 'Invalid status value');
    });

    await asyncTest('checkDatabase reports healthy when connected', async () => {
      const result = await healthCheckService.checkDatabase();
      assert(
        result.status === 'healthy',
        `Expected healthy status, got ${result.status}`
      );
      assert(result.details, 'Missing details');
      assert(result.responseTime !== undefined, 'Missing responseTime');
    });

    await asyncTest('checkDatabase includes connection details', async () => {
      const result = await healthCheckService.checkDatabase();
      if (result.status === 'healthy') {
        assert(result.details.state, 'Missing state in details');
        assert(result.details.host, 'Missing host in details');
        assert(result.details.database, 'Missing database name');
      }
    });

    // Test 3: External Service Checks
    console.log('\nTest Suite 3: External Service Checks'.cyan.bold);
    await asyncTest('checkStripe returns valid structure', async () => {
      const result = await healthCheckService.checkStripe();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(result.message, 'Missing message field');
    });

    await asyncTest('checkEmail returns valid structure', async () => {
      const result = await healthCheckService.checkEmail();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(result.message, 'Missing message field');
    });

    await asyncTest('checkRedis returns valid structure', async () => {
      const result = await healthCheckService.checkRedis();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(result.message, 'Missing message field');
    });

    // Test 4: System Resource Checks
    console.log('\nTest Suite 4: System Resource Checks'.cyan.bold);
    await asyncTest('checkMemory returns valid structure', async () => {
      const result = await healthCheckService.checkMemory();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(result.message, 'Missing message field');
      assert(result.details, 'Missing details');
    });

    await asyncTest('checkMemory includes system and process memory', async () => {
      const result = await healthCheckService.checkMemory();
      assert(result.details.system, 'Missing system memory');
      assert(result.details.process, 'Missing process memory');
      assert(result.details.system.total, 'Missing total memory');
      assert(result.details.system.usagePercentage, 'Missing usage percentage');
    });

    await asyncTest('checkDisk returns valid structure', async () => {
      const result = await healthCheckService.checkDisk();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(['healthy', 'warning', 'unhealthy'].includes(result.status), 'Invalid status');
    });

    await asyncTest('checkCPU returns valid structure', async () => {
      const result = await healthCheckService.checkCPU();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(result.message, 'Missing message field');
      assert(result.details, 'Missing details');
    });

    await asyncTest('checkCPU includes core count and usage', async () => {
      const result = await healthCheckService.checkCPU();
      assert(result.details.cores, 'Missing core count');
      assert(result.details.usagePercentage, 'Missing usage percentage');
      assert(result.details.loadAverage, 'Missing load average');
    });

    // Test 5: Uptime and Environment
    console.log('\nTest Suite 5: Uptime and Environment Info'.cyan.bold);
    test('getUptime returns valid structure', () => {
      const result = healthCheckService.getUptime();
      assert(result, 'Result is null');
      assert(result.system, 'Missing system uptime');
      assert(result.process, 'Missing process uptime');
      assert(result.systemSeconds !== undefined, 'Missing system seconds');
      assert(result.processSeconds !== undefined, 'Missing process seconds');
    });

    test('getEnvironmentInfo returns valid structure', () => {
      const result = healthCheckService.getEnvironmentInfo();
      assert(result, 'Result is null');
      assert(result.nodeVersion, 'Missing node version');
      assert(result.platform, 'Missing platform');
      assert(result.architecture, 'Missing architecture');
      assert(result.environment, 'Missing environment');
    });

    // Test 6: Quick Health Check
    console.log('\nTest Suite 6: Quick Health Check'.cyan.bold);
    await asyncTest('performQuickHealthCheck returns valid structure', async () => {
      const result = await healthCheckService.performQuickHealthCheck();
      assert(result, 'Result is null');
      assert(result.status, 'Missing status field');
      assert(result.message, 'Missing message field');
      assert(result.timestamp, 'Missing timestamp');
    });

    await asyncTest('performQuickHealthCheck is fast', async () => {
      const startTime = Date.now();
      await healthCheckService.performQuickHealthCheck();
      const duration = Date.now() - startTime;
      assert(duration < 1000, `Quick check took too long: ${duration}ms`);
    });

    // Test 7: Full Health Check
    console.log('\nTest Suite 7: Full Health Check'.cyan.bold);
    await asyncTest('performFullHealthCheck returns comprehensive data', async () => {
      const result = await healthCheckService.performFullHealthCheck();
      assert(result, 'Result is null');
      assert(result.status, 'Missing overall status');
      assert(result.message, 'Missing message');
      assert(result.timestamp, 'Missing timestamp');
      assert(result.checks, 'Missing checks object');
      assert(result.uptime, 'Missing uptime');
      assert(result.environment, 'Missing environment');
    });

    await asyncTest('performFullHealthCheck includes all service checks', async () => {
      const result = await healthCheckService.performFullHealthCheck();
      assert(result.checks.database, 'Missing database check');
      assert(result.checks.stripe, 'Missing stripe check');
      assert(result.checks.email, 'Missing email check');
      assert(result.checks.memory, 'Missing memory check');
      assert(result.checks.disk, 'Missing disk check');
      assert(result.checks.cpu, 'Missing cpu check');
    });

    await asyncTest('performFullHealthCheck calculates overall status', async () => {
      const result = await healthCheckService.performFullHealthCheck();
      assert(
        ['healthy', 'unhealthy', 'critical'].includes(result.status),
        `Invalid overall status: ${result.status}`
      );
    });

    await asyncTest('performFullHealthCheck includes response time', async () => {
      const result = await healthCheckService.performFullHealthCheck();
      assert(
        result.responseTime !== undefined,
        'Missing response time'
      );
      assert(
        typeof result.responseTime === 'number',
        'Response time is not a number'
      );
    });

    // Test 8: Controller Integration
    console.log('\nTest Suite 8: Controller Integration'.cyan.bold);
    test('healthCheckController loads successfully', () => {
      const controller = require('../src/controllers/healthCheckController');
      assert(controller, 'Controller not found');
      assert(typeof controller === 'object', 'Controller is not an object');
    });

    test('Controller has quickHealthCheck method', () => {
      const controller = require('../src/controllers/healthCheckController');
      assert(
        typeof controller.quickHealthCheck === 'function',
        'quickHealthCheck method not found'
      );
    });

    test('Controller has detailedHealthCheck method', () => {
      const controller = require('../src/controllers/healthCheckController');
      assert(
        typeof controller.detailedHealthCheck === 'function',
        'detailedHealthCheck method not found'
      );
    });

    test('Controller has checkDatabase method', () => {
      const controller = require('../src/controllers/healthCheckController');
      assert(
        typeof controller.checkDatabase === 'function',
        'checkDatabase method not found'
      );
    });

    test('Controller has checkSystem method', () => {
      const controller = require('../src/controllers/healthCheckController');
      assert(
        typeof controller.checkSystem === 'function',
        'checkSystem method not found'
      );
    });

    // Test 9: Routes Integration
    console.log('\nTest Suite 9: Routes Integration'.cyan.bold);
    test('healthCheckRoutes loads successfully', () => {
      const routes = require('../src/routes/healthCheckRoutes');
      assert(routes, 'Routes not found');
    });

    // Summary
    console.log('\n' + '='.repeat(70).cyan);
    console.log('TEST SUMMARY'.cyan.bold);
    console.log('='.repeat(70).cyan);
    console.log(`Total Tests: ${results.total}`.white);
    console.log(`Passed: ${results.passed}`.green);
    console.log(`Failed: ${results.failed}`.red);
    console.log(
      `Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`.yellow
    );

    if (results.failed > 0) {
      console.log('\nFailed Tests:'.red.bold);
      results.errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.description}`.red);
        console.log(`   ${err.error}`.gray);
      });
    }

    console.log('='.repeat(70).cyan + '\n');

    // Close database connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n'.green);

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n✗ Fatal error during testing:'.red.bold);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run tests
runTests();
