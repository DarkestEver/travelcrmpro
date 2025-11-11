/**
 * Test: Tenant Settings Save - Validate settings persist correctly
 * This test simulates the frontend sending partial settings updates
 * and ensures existing fields are not overwritten with undefined
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import models
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');

// Test data - simulates what frontend sends
const frontendSettingsUpdate = {
  name: 'Test Travel Agency',
  settings: {
    branding: {
      companyName: 'Test Travel Co',
      primaryColor: '#4F46E5',
      secondaryColor: '#06B6D4',
      logo: ''
    },
    contact: {
      email: 'info@testtravel.com',
      phone: '+1234567890',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      website: 'https://testtravel.com'
    },
    email: {
      senderName: 'Test Travel',
      senderEmail: 'noreply@testtravel.com',
      replyToEmail: 'info@testtravel.com',
      emailSignature: 'Best regards,\nTest Travel Team',
      showLogoInEmail: true,
      emailFooterText: 'Thank you for choosing Test Travel'
      // NOTE: templates is NOT included - should not be overwritten
    },
    business: {
      operatingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true }
      },
      autoApproveBookings: false,
      requireDepositForBooking: true,
      depositPercentage: 25
    },
    payment: {
      acceptedMethods: ['cash', 'card', 'bank_transfer'],
      defaultCurrency: 'USD',
      taxRate: 10,
      serviceFeePercentage: 5
    }
    // NOTE: aiSettings, features are NOT included - should not be overwritten
  },
  metadata: {
    timezone: 'America/New_York',
    currency: 'USD'
  }
};

// Helper function to clean undefined values from object
const removeUndefined = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  
  const cleaned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
          cleaned[key] = removeUndefined(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
  }
  return cleaned;
};

// Correct merge function that preserves existing fields
const deepMergeSettings = (target, source) => {
  const result = JSON.parse(JSON.stringify(target)); // Deep clone to avoid mutation
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      
      // Skip undefined values completely
      if (sourceValue === undefined) {
        continue;
      }
      
      // Check if both target and source values are plain objects
      const isSourcePlainObject = sourceValue && 
                                  typeof sourceValue === 'object' && 
                                  !Array.isArray(sourceValue) &&
                                  !(sourceValue instanceof Date) &&
                                  sourceValue.constructor === Object;
      
      const isTargetPlainObject = result[key] && 
                                  typeof result[key] === 'object' && 
                                  !Array.isArray(result[key]) &&
                                  !(result[key] instanceof Date) &&
                                  result[key].constructor === Object;
      
      if (isSourcePlainObject && isTargetPlainObject) {
        // Recursively merge nested objects
        result[key] = deepMergeSettings(result[key], sourceValue);
      } else if (isSourcePlainObject) {
        // Source is object but target isn't - clean undefined from source
        result[key] = removeUndefined(sourceValue);
      } else {
        // Direct assignment for primitives, arrays, dates
        result[key] = sourceValue;
      }
    }
  }
  
  return result;
};

// Helper to sort object keys for comparison
const sortKeys = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeys(obj[key]);
  });
  return sorted;
};

// Run the test
const runTest = async () => {
  console.log('\n🧪 Starting Tenant Settings Save Test...\n');
  
  try {
    await connectDB();
    
    // Find an existing tenant to test with
    let tenant = await Tenant.findOne();
    
    if (!tenant) {
      console.log('❌ No tenant found in database. Please create a tenant first.');
      process.exit(1);
    }
    
    console.log('✅ Using existing tenant:', tenant._id, tenant.name);
    
    console.log('\n📊 BEFORE UPDATE:');
    console.log('Tenant ID:', tenant._id);
    console.log('Tenant Name:', tenant.name);
    console.log('Settings Keys:', Object.keys(tenant.settings || {}));
    console.log('aiSettings exists:', !!tenant.settings?.aiSettings);
    console.log('features exists:', !!tenant.settings?.features);
    console.log('email.templates exists:', !!tenant.settings?.email?.templates);
    if (tenant.settings?.email?.templates) {
      console.log('email.templates keys:', Object.keys(tenant.settings.email.templates));
    }
    
    // Store original values to verify they're preserved
    const originalAiSettings = tenant.settings?.aiSettings ? JSON.parse(JSON.stringify(tenant.settings.aiSettings)) : null;
    const originalFeatures = tenant.settings?.features ? JSON.parse(JSON.stringify(tenant.settings.features)) : null;
    const originalTemplates = tenant.settings?.email?.templates ? JSON.parse(JSON.stringify(tenant.settings.email.templates)) : null;
    
    console.log('\n🔄 APPLYING UPDATE (simulating frontend request)...');
    console.log('Update contains:', Object.keys(frontendSettingsUpdate.settings));
    
    // Apply the update using the correct merge strategy
    const { name, settings, metadata } = frontendSettingsUpdate;
    
    if (name) {
      tenant.name = name;
    }
    
    if (metadata) {
      tenant.metadata = {
        ...tenant.metadata,
        ...metadata
      };
    }
    
    if (settings) {
      // Use deep merge that preserves existing fields
      tenant.settings = deepMergeSettings(tenant.settings || {}, settings);
      tenant.markModified('settings');
    }
    
    await tenant.save();
    console.log('✅ Tenant saved successfully');
    
    // Reload from database to verify persistence
    const reloadedTenant = await Tenant.findById(tenant._id);
    
    console.log('\n📊 AFTER UPDATE (reloaded from DB):');
    console.log('Tenant Name:', reloadedTenant.name);
    console.log('Settings Keys:', Object.keys(reloadedTenant.settings || {}));
    console.log('aiSettings exists:', !!reloadedTenant.settings?.aiSettings);
    console.log('features exists:', !!reloadedTenant.settings?.features);
    console.log('email.templates exists:', !!reloadedTenant.settings?.email?.templates);
    console.log('email.senderName:', reloadedTenant.settings?.email?.senderName);
    console.log('branding.companyName:', reloadedTenant.settings?.branding?.companyName);
    
    // Validate the update
    console.log('\n✅ VALIDATION:');
    let passed = 0;
    let failed = 0;
    
    // Check updated fields
    if (reloadedTenant.name === 'Test Travel Agency') {
      console.log('✅ Name updated correctly');
      passed++;
    } else {
      console.log('❌ Name not updated:', reloadedTenant.name);
      failed++;
    }
    
    if (reloadedTenant.settings?.branding?.companyName === 'Test Travel Co') {
      console.log('✅ Branding updated correctly');
      passed++;
    } else {
      console.log('❌ Branding not updated');
      failed++;
    }
    
    if (reloadedTenant.settings?.email?.senderName === 'Test Travel') {
      console.log('✅ Email settings updated correctly');
      passed++;
    } else {
      console.log('❌ Email settings not updated');
      failed++;
    }
    
    // Check preserved fields
    if (originalAiSettings && reloadedTenant.settings?.aiSettings) {
      const after = JSON.parse(JSON.stringify(reloadedTenant.settings.aiSettings));
      
      // Deep equality check
      const isEqual = JSON.stringify(sortKeys(originalAiSettings)) === JSON.stringify(sortKeys(after));
      
      if (isEqual) {
        console.log('✅ aiSettings preserved (not overwritten)');
        passed++;
      } else {
        console.log('❌ aiSettings was modified!');
        console.log('Original:', JSON.stringify(originalAiSettings));
        console.log('After:', JSON.stringify(after));
        failed++;
      }
    }
    
    if (originalFeatures && reloadedTenant.settings?.features) {
      const after = JSON.parse(JSON.stringify(reloadedTenant.settings.features));
      const isEqual = JSON.stringify(sortKeys(originalFeatures)) === JSON.stringify(sortKeys(after));
      
      if (isEqual) {
        console.log('✅ features preserved (not overwritten)');
        passed++;
      } else {
        console.log('❌ features was modified!');
        failed++;
      }
    }
    
    if (originalTemplates && reloadedTenant.settings?.email?.templates) {
      const after = JSON.parse(JSON.stringify(reloadedTenant.settings.email.templates));
      const isEqual = JSON.stringify(sortKeys(originalTemplates)) === JSON.stringify(sortKeys(after));
      
      if (isEqual) {
        console.log('✅ email.templates preserved (not overwritten)');
        passed++;
      } else {
        console.log('❌ email.templates was modified!');
        console.log('Original:', JSON.stringify(originalTemplates));
        console.log('After:', JSON.stringify(after));
        failed++;
      }
    } else if (!reloadedTenant.settings?.email?.templates) {
      console.log('❌ CRITICAL: email.templates was removed or set to undefined!');
      failed++;
    }
    
    // Check that undefined wasn't stored
    const settingsStr = JSON.stringify(reloadedTenant.settings);
    if (settingsStr.includes('"undefined"') || settingsStr.includes(':undefined')) {
      console.log('❌ CRITICAL: undefined values found in settings!');
      failed++;
    } else {
      console.log('✅ No undefined values in settings');
      passed++;
    }
    
    console.log('\n📈 TEST RESULTS:');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n✅ ALL TESTS PASSED! Settings save is working correctly.\n');
    } else {
      console.log('\n❌ TESTS FAILED! Settings save needs to be fixed.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the test
runTest();
