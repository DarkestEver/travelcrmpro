const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const ShareToken = require('../src/models/ShareToken');
const User = require('../src/models/User');
const Booking = require('../src/models/Booking');
const Quote = require('../src/models/Quote');
const Itinerary = require('../src/models/Itinerary');

// Services
const shareService = require('../src/services/shareService');

// Test configuration
const TEST_TENANT_ID = new mongoose.Types.ObjectId();
const TEST_USER_ID = new mongoose.Types.ObjectId();
const TEST_BOOKING_ID = new mongoose.Types.ObjectId();
const TEST_QUOTE_ID = new mongoose.Types.ObjectId();
const TEST_ITINERARY_ID = new mongoose.Types.ObjectId();

let testToken = null;
let testPasswordProtectedToken = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTestStart(testName) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST: ${testName}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logSuccess('Connected to MongoDB');
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function cleanup() {
  try {
    await ShareToken.deleteMany({ tenantId: TEST_TENANT_ID });
    logInfo('Cleaned up test data');
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

async function testGenerateShareToken() {
  logTestStart('Generate Share Token (No Password)');

  try {
    testToken = await shareService.generateShareToken({
      entityType: 'booking',
      entityId: TEST_BOOKING_ID,
      tenantId: TEST_TENANT_ID,
      createdBy: TEST_USER_ID,
      expiresInDays: 30,
      allowedActions: ['view', 'download']
    });

    if (!testToken) {
      throw new Error('Token generation returned null');
    }

    logSuccess('Token generated successfully');
    logInfo(`Token: ${testToken.token}`);
    logInfo(`Share URL: ${testToken.shareUrl}`);
    logInfo(`Expires: ${testToken.expiresAt}`);

    // Verify token structure
    if (!testToken.token || testToken.token.length < 30) {
      throw new Error('Invalid token format');
    }

    if (testToken.entityType !== 'booking') {
      throw new Error(`Wrong entity type: ${testToken.entityType}`);
    }

    if (!testToken.entityId.equals(TEST_BOOKING_ID)) {
      throw new Error('Entity ID mismatch');
    }

    if (!testToken.isActive) {
      throw new Error('Token should be active');
    }

    logSuccess('Token structure validated');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testGeneratePasswordProtectedToken() {
  logTestStart('Generate Password-Protected Share Token');

  try {
    const password = 'SecurePass123';
    testPasswordProtectedToken = await shareService.generateShareToken({
      entityType: 'quote',
      entityId: TEST_QUOTE_ID,
      tenantId: TEST_TENANT_ID,
      createdBy: TEST_USER_ID,
      expiresInDays: 7,
      password: password,
      allowedActions: ['view', 'accept', 'reject'],
      requireEmail: true
    });

    if (!testPasswordProtectedToken) {
      throw new Error('Password-protected token generation returned null');
    }

    logSuccess('Password-protected token generated');
    logInfo(`Token: ${testPasswordProtectedToken.token}`);

    // Verify password is hashed
    if (!testPasswordProtectedToken.password) {
      throw new Error('Password not stored');
    }

    if (testPasswordProtectedToken.password === password) {
      throw new Error('Password not hashed!');
    }

    // Verify bcrypt hash
    const isValidHash = await bcrypt.compare(password, testPasswordProtectedToken.password);
    if (!isValidHash) {
      throw new Error('Password hash verification failed');
    }

    logSuccess('Password properly hashed and verified');

    // Verify allowed actions (nested in metadata)
    if (!testPasswordProtectedToken.metadata || !testPasswordProtectedToken.metadata.allowedActions) {
      throw new Error('allowedActions not found in metadata');
    }
    
    if (!testPasswordProtectedToken.metadata.allowedActions.includes('accept')) {
      throw new Error('Allowed actions not saved correctly');
    }

    if (!testPasswordProtectedToken.metadata.requireEmail) {
      throw new Error('requireEmail flag not saved');
    }

    logSuccess('Token configuration validated');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testValidateToken() {
  logTestStart('Validate Share Token (No Password)');

  try {
    if (!testToken) {
      throw new Error('No test token available');
    }

    const validatedToken = await shareService.validateToken(testToken.token);

    if (!validatedToken) {
      throw new Error('Token validation returned null');
    }

    logSuccess('Token validated successfully');

    // Note: validateToken automatically records a view, so count should be 1
    if (validatedToken.viewCount !== 1) {
      throw new Error(`Unexpected view count: ${validatedToken.viewCount}`);
    }

    logSuccess('View count is correct (1 after validation)');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testValidatePasswordProtectedToken() {
  logTestStart('Validate Password-Protected Token');

  try {
    if (!testPasswordProtectedToken) {
      throw new Error('No password-protected token available');
    }

    // Test 1: Validation without password should fail
    try {
      await shareService.validateToken(testPasswordProtectedToken.token);
      throw new Error('Validation without password should have failed');
    } catch (error) {
      if (error.message.includes('requires a password')) {
        logSuccess('Correctly rejected validation without password');
      } else {
        throw error;
      }
    }

    // Test 2: Validation with wrong password should fail
    try {
      await shareService.validateToken(testPasswordProtectedToken.token, 'WrongPassword');
      throw new Error('Validation with wrong password should have failed');
    } catch (error) {
      if (error.message.includes('Incorrect password') || error.message.includes('password')) {
        logSuccess('Correctly rejected wrong password');
      } else {
        throw error;
      }
    }

    // Test 3: Validation with correct password should succeed
    const validatedToken = await shareService.validateToken(
      testPasswordProtectedToken.token,
      'SecurePass123'
    );

    if (!validatedToken) {
      throw new Error('Token validation with correct password failed');
    }

    logSuccess('Token validated with correct password');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testRecordView() {
  logTestStart('Record View and Update View Count');

  try {
    if (!testToken) {
      throw new Error('No test token available');
    }

    // Fetch fresh token from database (it already has viewCount=1 from validation)
    let currentToken = await ShareToken.findById(testToken._id);
    const initialViewCount = currentToken.viewCount;
    logInfo(`Initial view count: ${initialViewCount}`);

    // Record another view
    await currentToken.recordView();

    // Fetch fresh token from database again
    const updatedToken = await ShareToken.findById(testToken._id);

    if (updatedToken.viewCount !== initialViewCount + 1) {
      throw new Error(`View count not incremented: expected ${initialViewCount + 1}, got ${updatedToken.viewCount}`);
    }

    logSuccess(`View count incremented to ${updatedToken.viewCount}`);

    if (!updatedToken.lastViewedAt) {
      throw new Error('lastViewedAt not set');
    }

    logSuccess(`Last viewed at: ${updatedToken.lastViewedAt}`);
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testGetTokensForEntity() {
  logTestStart('Get All Tokens for Entity');

  try {
    // Create additional tokens for the same booking
    await shareService.generateShareToken({
      entityType: 'booking',
      entityId: TEST_BOOKING_ID,
      tenantId: TEST_TENANT_ID,
      createdBy: TEST_USER_ID,
      expiresInDays: 15
    });

    const tokens = await shareService.getTokensForEntity(
      'booking',
      TEST_BOOKING_ID,
      TEST_TENANT_ID
    );

    if (!tokens || tokens.length < 2) {
      throw new Error(`Expected at least 2 tokens, got ${tokens ? tokens.length : 0}`);
    }

    logSuccess(`Found ${tokens.length} tokens for booking`);

    // Verify all tokens are for the correct entity
    const allCorrect = tokens.every(
      token => token.entityType === 'booking' && token.entityId.equals(TEST_BOOKING_ID)
    );

    if (!allCorrect) {
      throw new Error('Not all tokens match the entity');
    }

    logSuccess('All tokens correctly associated with entity');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testDeactivateToken() {
  logTestStart('Deactivate Share Token');

  try {
    if (!testToken) {
      throw new Error('No test token available');
    }

    const deactivatedToken = await shareService.deactivateToken(
      testToken._id,
      TEST_USER_ID
    );

    if (deactivatedToken.isActive) {
      throw new Error('Token is still active after deactivation');
    }

    logSuccess('Token deactivated successfully');

    // Try to validate deactivated token
    try {
      await shareService.validateToken(testToken.token);
      throw new Error('Deactivated token should not validate');
    } catch (error) {
      if (error.message.includes('expired') || error.message.includes('no longer active')) {
        logSuccess('Correctly rejected deactivated token');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testExtendExpiration() {
  logTestStart('Extend Token Expiration');

  try {
    if (!testPasswordProtectedToken) {
      throw new Error('No password-protected token available');
    }

    const originalExpiration = new Date(testPasswordProtectedToken.expiresAt);
    logInfo(`Original expiration: ${originalExpiration}`);

    const extendedToken = await shareService.extendExpiration(
      testPasswordProtectedToken._id,
      30
    );

    const newExpiration = new Date(extendedToken.expiresAt);
    logInfo(`New expiration: ${newExpiration}`);

    const daysDifference = Math.round(
      (newExpiration - originalExpiration) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference !== 30) {
      throw new Error(`Expected 30 days extension, got ${daysDifference}`);
    }

    logSuccess('Expiration extended by 30 days');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testGetTokenAnalytics() {
  logTestStart('Get Token Analytics');

  try {
    if (!testPasswordProtectedToken) {
      throw new Error('No password-protected token available');
    }

    const analytics = await shareService.getTokenAnalytics(
      testPasswordProtectedToken._id
    );

    if (!analytics) {
      throw new Error('Analytics returned null');
    }

    logSuccess('Analytics retrieved successfully');
    logInfo(`Token: ${analytics.token}`);
    logInfo(`Entity: ${analytics.entityType} (${analytics.entityId})`);
    logInfo(`View Count: ${analytics.viewCount}`);
    logInfo(`Active: ${analytics.isActive}`);
    logInfo(`Expired: ${analytics.isExpired}`);
    logInfo(`Days Until Expiration: ${analytics.daysUntilExpiration}`);

    if (typeof analytics.viewCount !== 'number') {
      throw new Error('Invalid view count in analytics');
    }

    if (typeof analytics.isExpired !== 'boolean') {
      throw new Error('Invalid isExpired in analytics');
    }

    logSuccess('Analytics data structure validated');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         SHAREABLE LINKS - COMPREHENSIVE TESTS             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  await connectDatabase();
  await cleanup();

  const results = [];

  // Run tests
  results.push({ name: 'Generate Share Token', passed: await testGenerateShareToken() });
  results.push({ name: 'Generate Password-Protected Token', passed: await testGeneratePasswordProtectedToken() });
  results.push({ name: 'Validate Token', passed: await testValidateToken() });
  results.push({ name: 'Validate Password-Protected Token', passed: await testValidatePasswordProtectedToken() });
  results.push({ name: 'Record View', passed: await testRecordView() });
  results.push({ name: 'Get Tokens for Entity', passed: await testGetTokensForEntity() });
  results.push({ name: 'Deactivate Token', passed: await testDeactivateToken() });
  results.push({ name: 'Extend Expiration', passed: await testExtendExpiration() });
  results.push({ name: 'Get Token Analytics', passed: await testGetTokenAnalytics() });

  // Cleanup
  await cleanup();

  // Print summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });

  log('\n' + '─'.repeat(60), 'cyan');
  log(`Total Tests: ${totalCount}`, 'blue');
  log(`Passed: ${passedCount}`, 'green');
  log(`Failed: ${totalCount - passedCount}`, 'red');
  log('─'.repeat(60) + '\n', 'cyan');

  if (passedCount === totalCount) {
    log('🎉 ALL TESTS PASSED! 🎉', 'green');
  } else {
    log('❌ SOME TESTS FAILED', 'red');
  }

  await mongoose.connection.close();
  logInfo('Database connection closed');

  process.exit(passedCount === totalCount ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
