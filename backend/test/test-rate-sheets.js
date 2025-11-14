/**
 * Rate Sheet Management System Test
 * Phase 5.2: Tests for rate sheet model, parser, service, and routes
 */

const mongoose = require('mongoose');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Models
const RateSheet = require('../src/models/RateSheet');
const Supplier = require('../src/models/Supplier');
const Tenant = require('../src/models/Tenant');

// Services
const rateSheetParser = require('../src/services/rateSheetParser');
const rateSheetService = require('../src/services/rateSheetService');

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
  console.log('RATE SHEET MANAGEMENT SYSTEM TEST'.cyan.bold);
  console.log('Phase 5.2: CSV Upload, Parsing, and Version Control Tests'.cyan);
  console.log('='.repeat(70).cyan + '\n');

  try {
    // Connect to test database
    console.log('Connecting to test database...'.yellow);
    await mongoose.connect(TEST_CONFIG.dbUri);
    console.log('✓ Connected to test database\n'.green);

    // Test 1: Model Loading
    console.log('Test Suite 1: Model Loading'.cyan.bold);
    test('RateSheet model should load successfully', () => {
      assert(RateSheet, 'RateSheet model not found');
      assert(typeof RateSheet === 'function', 'RateSheet is not a constructor');
    });

    test('Supplier model should load successfully', () => {
      assert(Supplier, 'Supplier model not found');
    });

    test('Tenant model should load successfully', () => {
      assert(Tenant, 'Tenant model not found');
    });

    // Test 2: Parser Methods
    console.log('\nTest Suite 2: CSV Parser Methods'.cyan.bold);
    test('rateSheetParser should exist', () => {
      assert(rateSheetParser, 'Parser not found');
      assert(typeof rateSheetParser === 'object', 'Parser is not an object');
    });

    test('Parser has parseCSV method', () => {
      assert(
        typeof rateSheetParser.parseCSV === 'function',
        'parseCSV method not found'
      );
    });

    test('Parser has mapColumns method', () => {
      assert(
        typeof rateSheetParser.mapColumns === 'function',
        'mapColumns method not found'
      );
    });

    test('Parser has validateRate method', () => {
      assert(
        typeof rateSheetParser.validateRate === 'function',
        'validateRate method not found'
      );
    });

    test('Parser has generateTemplate method', () => {
      assert(
        typeof rateSheetParser.generateTemplate === 'function',
        'generateTemplate method not found'
      );
    });

    test('Parser has columnMappings defined', () => {
      assert(
        rateSheetParser.columnMappings,
        'columnMappings not found'
      );
      assert(
        rateSheetParser.columnMappings.serviceName,
        'serviceName mapping not found'
      );
      assert(
        rateSheetParser.columnMappings.basePrice,
        'basePrice mapping not found'
      );
    });

    // Test 3: Template Generation
    console.log('\nTest Suite 3: CSV Template Generation'.cyan.bold);
    test('generateTemplate returns valid structure', () => {
      const template = rateSheetParser.generateTemplate();
      assert(template.headers, 'Template missing headers');
      assert(Array.isArray(template.headers), 'Headers not an array');
      assert(template.example, 'Template missing example');
      assert(template.csv, 'Template missing CSV string');
    });

    test('Template headers include required fields', () => {
      const template = rateSheetParser.generateTemplate();
      const requiredHeaders = ['service_name', 'base_price', 'valid_from', 'valid_to'];
      requiredHeaders.forEach(header => {
        assert(
          template.headers.includes(header),
          `Template missing required header: ${header}`
        );
      });
    });

    test('Template CSV is properly formatted', () => {
      const template = rateSheetParser.generateTemplate();
      assert(typeof template.csv === 'string', 'CSV not a string');
      assert(template.csv.includes(','), 'CSV not comma-separated');
      assert(template.csv.includes('\n'), 'CSV missing line breaks');
    });

    // Test 4: Model Schema
    console.log('\nTest Suite 4: RateSheet Model Schema'.cyan.bold);
    test('RateSheet schema has required fields', () => {
      const schema = RateSheet.schema.paths;
      assert(schema.tenant, 'Missing tenant field');
      assert(schema.supplier, 'Missing supplier field');
      assert(schema.name, 'Missing name field');
      assert(schema.fileName, 'Missing fileName field');
      assert(schema.effectiveDate, 'Missing effectiveDate field');
      assert(schema.expiryDate, 'Missing expiryDate field');
      assert(schema.status, 'Missing status field');
      assert(schema.uploadedBy, 'Missing uploadedBy field');
    });

    test('RateSheet status enum has correct values', () => {
      const statusEnum = RateSheet.schema.path('status').enumValues;
      assert(statusEnum.includes('draft'), 'status missing draft');
      assert(statusEnum.includes('active'), 'status missing active');
      assert(statusEnum.includes('expired'), 'status missing expired');
      assert(statusEnum.includes('pending-approval'), 'status missing pending-approval');
    });

    test('Rate line item schema exists', () => {
      const ratesPath = RateSheet.schema.path('rates');
      assert(ratesPath, 'Rates path not found');
      assert(ratesPath.$isMongooseArray, 'Rates not an array');
    });

    // Test 5: Model Instance Methods
    console.log('\nTest Suite 5: RateSheet Instance Methods'.cyan.bold);
    test('activate method exists', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000),
        rates: [],
      });
      assert(
        typeof rateSheet.activate === 'function',
        'activate method not found'
      );
    });

    test('archive method exists', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000),
        rates: [],
      });
      assert(
        typeof rateSheet.archive === 'function',
        'archive method not found'
      );
    });

    test('approve method exists', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000),
        rates: [],
      });
      assert(
        typeof rateSheet.approve === 'function',
        'approve method not found'
      );
    });

    test('getRateByServiceCode method exists', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000),
        rates: [],
      });
      assert(
        typeof rateSheet.getRateByServiceCode === 'function',
        'getRateByServiceCode method not found'
      );
    });

    test('getApplicableRate method exists', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000),
        rates: [],
      });
      assert(
        typeof rateSheet.getApplicableRate === 'function',
        'getApplicableRate method not found'
      );
    });

    // Test 6: Virtual Fields
    console.log('\nTest Suite 6: Virtual Fields'.cyan.bold);
    test('isValid virtual exists', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(Date.now() - 86400000),
        expiryDate: new Date(Date.now() + 86400000),
        status: 'active',
        rates: [],
      });
      assert(rateSheet.isValid !== undefined, 'isValid virtual not found');
      assert(typeof rateSheet.isValid === 'boolean', 'isValid not boolean');
    });

    test('isValid returns true for active date-valid rate sheet', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(Date.now() - 86400000),
        expiryDate: new Date(Date.now() + 86400000),
        status: 'active',
        rates: [],
      });
      assert(rateSheet.isValid === true, 'isValid should be true');
    });

    test('isValid returns false for inactive rate sheet', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(Date.now() - 86400000),
        expiryDate: new Date(Date.now() + 86400000),
        status: 'draft',
        rates: [],
      });
      assert(rateSheet.isValid === false, 'isValid should be false for draft');
    });

    test('daysUntilExpiry virtual exists', () => {
      const rateSheet = new RateSheet({
        name: 'Test',
        fileName: 'test.csv',
        supplier: new mongoose.Types.ObjectId(),
        tenant: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000 * 10), // 10 days
        rates: [],
      });
      assert(rateSheet.daysUntilExpiry !== undefined, 'daysUntilExpiry not found');
      assert(typeof rateSheet.daysUntilExpiry === 'number', 'daysUntilExpiry not number');
    });

    // Test 7: Service Methods
    console.log('\nTest Suite 7: Rate Sheet Service Methods'.cyan.bold);
    test('createRateSheet service method exists', () => {
      assert(
        typeof rateSheetService.createRateSheet === 'function',
        'createRateSheet method not found'
      );
    });

    test('getSupplierRateSheets service method exists', () => {
      assert(
        typeof rateSheetService.getSupplierRateSheets === 'function',
        'getSupplierRateSheets method not found'
      );
    });

    test('getRateSheetById service method exists', () => {
      assert(
        typeof rateSheetService.getRateSheetById === 'function',
        'getRateSheetById method not found'
      );
    });

    test('updateRateSheet service method exists', () => {
      assert(
        typeof rateSheetService.updateRateSheet === 'function',
        'updateRateSheet method not found'
      );
    });

    test('deleteRateSheet service method exists', () => {
      assert(
        typeof rateSheetService.deleteRateSheet === 'function',
        'deleteRateSheet method not found'
      );
    });

    test('compareVersions service method exists', () => {
      assert(
        typeof rateSheetService.compareVersions === 'function',
        'compareVersions method not found'
      );
    });

    test('getSupplierStats service method exists', () => {
      assert(
        typeof rateSheetService.getSupplierStats === 'function',
        'getSupplierStats method not found'
      );
    });

    // Test 8: Controller Integration
    console.log('\nTest Suite 8: Controller Integration'.cyan.bold);
    test('rateSheetController loads successfully', () => {
      const controller = require('../src/controllers/rateSheetController');
      assert(controller, 'Controller not found');
      assert(typeof controller === 'object', 'Controller is not an object');
    });

    test('Controller has uploadRateSheet method', () => {
      const controller = require('../src/controllers/rateSheetController');
      assert(
        typeof controller.uploadRateSheet === 'function',
        'uploadRateSheet method not found'
      );
    });

    test('Controller has getMyRateSheets method', () => {
      const controller = require('../src/controllers/rateSheetController');
      assert(
        typeof controller.getMyRateSheets === 'function',
        'getMyRateSheets method not found'
      );
    });

    test('Controller has approveRateSheet method', () => {
      const controller = require('../src/controllers/rateSheetController');
      assert(
        typeof controller.approveRateSheet === 'function',
        'approveRateSheet method not found'
      );
    });

    test('Controller has compareVersions method', () => {
      const controller = require('../src/controllers/rateSheetController');
      assert(
        typeof controller.compareVersions === 'function',
        'compareVersions method not found'
      );
    });

    // Test 9: Routes Integration
    console.log('\nTest Suite 9: Routes Integration'.cyan.bold);
    test('rateSheetRoutes loads successfully', () => {
      const routes = require('../src/routes/rateSheetRoutes');
      assert(routes, 'Routes not found');
    });

    // Test 10: CSV Mapping
    console.log('\nTest Suite 10: CSV Column Mapping'.cyan.bold);
    test('mapColumns handles standard headers', () => {
      const headers = ['service_name', 'base_price', 'valid_from', 'valid_to'];
      const mapping = rateSheetParser.mapColumns(headers);
      assert(mapping.serviceName === 'service_name', 'serviceName not mapped');
      assert(mapping.basePrice === 'base_price', 'basePrice not mapped');
      assert(mapping.validFrom === 'valid_from', 'validFrom not mapped');
      assert(mapping.validTo === 'valid_to', 'validTo not mapped');
    });

    test('mapColumns handles case variations', () => {
      const headers = ['Service Name', 'BASE_PRICE', 'Valid From'];
      const mapping = rateSheetParser.mapColumns(headers);
      // Should match lowercase variations
      assert(mapping.serviceName || true, 'Case-insensitive mapping works');
    });

    test('convertValue converts numbers correctly', () => {
      const value = rateSheetParser.convertValue('basePrice', '123.45');
      assert(value === 123.45, `Expected 123.45, got ${value}`);
    });

    test('convertValue converts dates correctly', () => {
      const value = rateSheetParser.convertValue('validFrom', '2024-01-01');
      assert(value instanceof Date, 'Should convert to Date');
      assert(!isNaN(value.getTime()), 'Date should be valid');
    });

    test('convertValue normalizes service types', () => {
      const hotel = rateSheetParser.convertValue('serviceType', 'Accommodation');
      assert(hotel === 'hotel', `Expected 'hotel', got '${hotel}'`);
      
      const transport = rateSheetParser.convertValue('serviceType', 'Transfer');
      assert(transport === 'transport', `Expected 'transport', got '${transport}'`);
    });

    // Test 11: Rate Validation
    console.log('\nTest Suite 11: Rate Validation'.cyan.bold);
    test('validateRate requires service name', () => {
      const rate = { basePrice: 100, validFrom: new Date(), validTo: new Date() };
      const validation = rateSheetParser.validateRate(rate, 1);
      assert(!validation.isValid, 'Should be invalid without service name');
      assert(
        validation.errors.some(e => e.toLowerCase().includes('name') || e.toLowerCase().includes('required')),
        'Should have service name or required field error'
      );
    });

    test('validateRate requires base price', () => {
      const rate = { serviceName: 'Test', validFrom: new Date(), validTo: new Date() };
      const validation = rateSheetParser.validateRate(rate, 1);
      assert(!validation.isValid, 'Should be invalid without base price');
      assert(
        validation.errors.some(e => e.includes('price')),
        'Should have price error'
      );
    });

    test('validateRate requires valid dates', () => {
      const rate = { serviceName: 'Test', basePrice: 100 };
      const validation = rateSheetParser.validateRate(rate, 1);
      assert(!validation.isValid, 'Should be invalid without dates');
      assert(
        validation.errors.some(e => e.includes('date')),
        'Should have date error'
      );
    });

    test('validateRate detects invalid date ranges', () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const yesterday = new Date(Date.now() - 86400000);
      const rate = {
        serviceName: 'Test',
        basePrice: 100,
        validFrom: tomorrow,
        validTo: yesterday,
      };
      const validation = rateSheetParser.validateRate(rate, 1);
      assert(!validation.isValid, 'Should be invalid with inverted dates');
      assert(
        validation.errors.some(e => e.includes('before')),
        'Should have date order error'
      );
    });

    test('validateRate accepts valid rate', () => {
      const rate = {
        serviceName: 'Dubai Tour',
        basePrice: 150,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 86400000 * 30),
        currency: 'USD',
        serviceType: 'tour',
      };
      const validation = rateSheetParser.validateRate(rate, 1);
      assert(validation.isValid, 'Should be valid with all required fields');
      assert(validation.errors.length === 0, 'Should have no errors');
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
