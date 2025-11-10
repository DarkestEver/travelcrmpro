/**
 * Main Test Runner
 * Orchestrates all tests autonomously
 */

const logger = require('./utils/logger');
const dataStore = require('./utils/test-data-store');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import all test modules
const test0 = require('./tests/test-0-setup');
const test1 = require('./tests/test-1-create-tenant');
const test2 = require('./tests/test-2-agency-login');
const test3 = require('./tests/test-3-create-agents');
const test4 = require('./tests/test-4-create-customers');
const test5 = require('./tests/test-5-create-suppliers');
const test6 = require('./tests/test-6-create-itineraries');
const test7 = require('./tests/test-7-create-quotes');
const test8 = require('./tests/test-8-create-bookings');
const test9 = require('./tests/test-9-operator-functionality');

// Test configuration
const TESTS = [
  { name: 'Test 0: Server Health Check', module: test0, critical: true },
  { name: 'Test 1: Create Demo Tenant', module: test1, critical: true },
  { name: 'Test 2: Agency Admin Login', module: test2, critical: true },
  { name: 'Test 3: Create Agents', module: test3, critical: false },
  { name: 'Test 4: Create Customers', module: test4, critical: false },
  { name: 'Test 5: Create Suppliers', module: test5, critical: false },
  { name: 'Test 6: Create Itineraries', module: test6, critical: false },
  { name: 'Test 7: Create Quotes', module: test7, critical: false },
  { name: 'Test 8: Create Bookings', module: test8, critical: false },
  { name: 'Test 9: Operator Functionality', module: test9, critical: false }
];

async function runCleanup() {
  logger.info('Running cleanup script...');
  try {
    const { stdout } = await execPromise('node test\\cleanup.js');
    console.log(stdout);
    logger.success('Cleanup completed');
    return true;
  } catch (error) {
    logger.warning('Cleanup had issues, continuing anyway');
    return false;
  }
}

async function runAllTests() {
  logger.header('🚀 Travel CRM - Autonomous Test Suite');
  logger.info('Running all tests automatically...');
  logger.info('Tests will continue even if non-critical tests fail\n');

  // Run cleanup first
  await runCleanup();
  await new Promise(resolve => setTimeout(resolve, 2000));

  let criticalFailure = false;

  for (const test of TESTS) {
    try {
      logger.header(test.name);
      
      const result = await test.module.runTest();
      
      if (result.success) {
        logger.success(`${test.name} - PASSED ✅`);
      } else {
        logger.error(`${test.name} - FAILED ❌`);
        logger.error(`Error: ${result.error || 'Unknown error'}`);
        
        if (test.critical) {
          logger.error('Critical test failed! Stopping test suite.');
          criticalFailure = true;
          break;
        } else {
          logger.warning('Non-critical test failed. Continuing...');
        }
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      logger.error(`${test.name} - EXCEPTION ❌`);
      logger.error(`Exception: ${error.message}`);
      console.error(error);
      
      if (test.critical) {
        logger.error('Critical test exception! Stopping test suite.');
        criticalFailure = true;
        break;
      }
    }
  }

  // Generate summary report
  generateSummaryReport(criticalFailure);
}

function generateSummaryReport(criticalFailure) {
  logger.header('📊 TEST SUMMARY REPORT');
  
  const summary = dataStore.getSummary();
  
  console.log('\n✅ RESOURCES CREATED:'.green);
  logger.result('Tenants', summary.totalTenants);
  logger.result('Customers', summary.totalCustomers);
  logger.result('Suppliers', summary.totalSuppliers);
  logger.result('Itineraries', summary.totalItineraries);
  logger.result('Quotes', summary.totalQuotes);
  logger.result('Bookings', summary.totalBookings);
  logger.result('Agents', dataStore.data.users.agent?.length || 0);
  
  console.log('\n📈 TEST RESULTS:'.cyan);
  logger.result('Tests Passed', summary.testsPassed);
  logger.result('Tests Failed', summary.testsFailed);
  
  if (criticalFailure) {
    console.log('\n⚠️  CRITICAL FAILURE DETECTED'.red);
    logger.error('Some critical tests failed. Please review the logs above.');
  } else if (summary.testsFailed > 0) {
    console.log('\n⚠️  SOME TESTS FAILED'.yellow);
    logger.warning('Some non-critical tests failed. System may still be functional.');
  } else {
    console.log('\n🎉 ALL TESTS PASSED!'.green);
    logger.success('Test suite completed successfully!');
  }
  
  // Save test data
  const filePath = dataStore.save('test-results.json');
  console.log(`\n📝 Full test data saved to: ${filePath}`.yellow);
  
  console.log('\n🔑 LOGIN CREDENTIALS:'.cyan);
  logger.credential('Super Admin', 'admin@travelcrm.com / Admin@123');
  logger.credential('Agency Admin', 'admin@demoagency.com / Admin@123');
  logger.credential('Agent 1', 'agent1@demoagency.com / Agent@123');
  logger.credential('Customer 1', 'customer1@test.com / Customer@123');
  
  console.log('\n' + '='.repeat(60).magenta);
  logger.info('Test suite completed!');
}

// Run tests
runAllTests().catch(error => {
  logger.error('Fatal error in test runner:');
  console.error(error);
  process.exit(1);
});
