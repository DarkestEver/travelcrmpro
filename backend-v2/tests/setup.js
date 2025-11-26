// Global test setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests
process.env.PORT = '5001'; // Use different port for tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/travel-crm-test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';

// Set test timeout
jest.setTimeout(30000);

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mongoose = require('mongoose');

// Global setup - connect to test database
beforeAll(async () => {
  try {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.error('Test database connected');
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
});

// Before each test - clear all collections
beforeEach(async () => {
  try {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Failed to clear collections:', error);
    throw error;
  }
});

// Global teardown - close all connections
afterAll(async () => {
  try {
    // Drop test database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
    await mongoose.disconnect();
    
    console.error('Test database disconnected and dropped');
    
    // Small delay for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
});
