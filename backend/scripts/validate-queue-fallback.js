/**
 * Queue Fallback Validation Script
 * 
 * This script validates that the three-tier queue fallback system works correctly.
 * It tests all three modes: Redis, Memory, and Synchronous.
 */

const path = require('path');

// Test configuration
const TEST_CASES = [
  {
    name: 'Redis Mode (Production)',
    env: { NODE_ENV: 'production', REDIS_HOST: 'localhost', REDIS_PORT: '6379' },
    expectedMode: 'redis',
    description: 'Should use Redis Bull queue when available'
  },
  {
    name: 'Memory Mode (Development, no Redis)',
    env: { NODE_ENV: 'development' },
    expectedMode: 'memory',
    description: 'Should use in-memory queue in development without Redis'
  },
  {
    name: 'Sync Mode (Production, no Redis)',
    env: { NODE_ENV: 'production' },
    expectedMode: 'sync',
    description: 'Should use synchronous processing in production without Redis'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testQueueMode(testCase) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(`Testing: ${testCase.name}`, colors.bright);
  log(`${'='.repeat(60)}`, colors.bright);
  logInfo(testCase.description);

  try {
    // Set environment variables
    const originalEnv = { ...process.env };
    Object.assign(process.env, testCase.env);

    // Clear require cache to get fresh instance
    const modulePath = path.join(__dirname, '../src/services/emailProcessingQueue.js');
    delete require.cache[require.resolve(modulePath)];
    delete require.cache[require.resolve(path.join(__dirname, '../src/services/InMemoryQueue.js'))];
    
    // Try to clear Bull queue from cache too
    try {
      delete require.cache[require.resolve('bull')];
    } catch (e) {
      // Bull might not be installed
    }

    // Import EmailProcessingQueue
    const EmailProcessingQueue = require(modulePath);
    const queue = new EmailProcessingQueue();

    // Verify queue type
    logInfo(`Queue Type: ${queue.queueType}`);
    
    if (queue.queueType === testCase.expectedMode) {
      logSuccess(`Queue mode matches expected: ${testCase.expectedMode}`);
    } else {
      logError(`Queue mode mismatch! Expected: ${testCase.expectedMode}, Got: ${queue.queueType}`);
      return false;
    }

    // Test getStats
    const stats = await queue.getStats();
    logInfo(`Queue Stats: ${JSON.stringify(stats, null, 2)}`);
    
    if (stats.mode === testCase.expectedMode) {
      logSuccess(`Stats mode matches: ${stats.mode}`);
    } else {
      logError(`Stats mode mismatch! Expected: ${testCase.expectedMode}, Got: ${stats.mode}`);
      return false;
    }

    // Test pause/resume (should not throw)
    await queue.pause();
    logSuccess('Pause executed successfully');
    
    await queue.resume();
    logSuccess('Resume executed successfully');

    // Restore environment
    process.env = originalEnv;

    logSuccess(`✓ Test Passed: ${testCase.name}`);
    return true;

  } catch (error) {
    logError(`✗ Test Failed: ${testCase.name}`);
    logError(`Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

async function runValidation() {
  log('\n' + '═'.repeat(60), colors.bright);
  log('QUEUE FALLBACK VALIDATION', colors.bright);
  log('═'.repeat(60), colors.bright);

  logInfo('Validating three-tier queue fallback system...');
  logInfo('Testing: Redis → Memory → Sync\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    const passed = await testQueueMode(testCase);
    results.push({ name: testCase.name, passed });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log('\n' + '═'.repeat(60), colors.bright);
  log('VALIDATION SUMMARY', colors.bright);
  log('═'.repeat(60), colors.bright);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });

  log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`, colors.bright);

  if (failed === 0) {
    logSuccess('\n🎉 All validation tests passed!');
    logSuccess('The queue fallback system is working correctly.');
    return true;
  } else {
    logError(`\n❌ ${failed} test(s) failed!`);
    logError('Please review the errors above.');
    return false;
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  runValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`\nFatal error: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { runValidation, testQueueMode };
