/**
 * Test Utilities
 * Common utility functions for testing
 */

class TestUtils {
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  static assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  }

  static assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || 'Value is null or undefined');
    }
  }

  static assertArrayNotEmpty(array, message) {
    if (!Array.isArray(array) || array.length === 0) {
      throw new Error(message || 'Array is empty or not an array');
    }
  }

  static assertObjectHasKeys(obj, keys, message) {
    const missing = keys.filter(key => !(key in obj));
    if (missing.length > 0) {
      throw new Error(message || `Object missing keys: ${missing.join(', ')}`);
    }
  }

  static assertStatusCode(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected status ${expected} but got ${actual}`);
    }
  }

  static formatError(error, response = null) {
    let errorMsg = error.message || error;
    
    if (response) {
      if (response.data?.message) {
        errorMsg += ` | API: ${response.data.message}`;
      }
      if (response.data?.error) {
        errorMsg += ` | Error: ${response.data.error}`;
      }
    }
    
    return errorMsg;
  }

  static extractIds(data) {
    const ids = {};
    
    if (data.user && data.user._id) ids.userId = data.user._id;
    if (data.user && data.user.id) ids.userId = data.user.id;
    if (data._id) ids.id = data._id;
    if (data.id) ids.id = data.id;
    if (data.tenant) ids.tenantId = data.tenant;
    if (data.tenantId) ids.tenantId = data.tenantId;
    
    return ids;
  }

  static maskSensitiveData(data) {
    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    
    sensitiveFields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    });
    
    return masked;
  }

  static generateUniqueEmail(prefix = 'test') {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).substring(7)}@test.com`;
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  static logObject(obj, title = 'Object') {
    console.log(`\n--- ${title} ---`);
    console.log(JSON.stringify(obj, null, 2));
    console.log('---\n');
  }
}

module.exports = TestUtils;
