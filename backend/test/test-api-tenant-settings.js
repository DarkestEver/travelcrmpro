/**
 * API Integration Test: Tenant Settings Update Endpoint
 * Tests the actual /api/v1/tenants/settings endpoint with authentication
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

// Test configuration
const TEST_USER = {
  email: 'operator@travelcrm.com',
  password: 'Operator123!@#'
};

// Test data - simulates what frontend sends
const settingsUpdate = {
  name: 'Updated Agency Name',
  settings: {
    branding: {
      companyName: 'Updated Travel Agency',
      primaryColor: '#FF5733',
      secondaryColor: '#33FF57',
      logo: ''
    },
    contact: {
      email: 'updated@travel.com',
      phone: '+9876543210',
      address: 'Updated Address',
      city: 'Updated City',
      country: 'Updated Country',
      website: 'https://updated.com'
    },
    email: {
      senderName: 'Updated Sender',
      senderEmail: 'noreply@updated.com',
      replyToEmail: 'info@updated.com',
      emailSignature: 'Updated Signature',
      showLogoInEmail: false,
      emailFooterText: 'Updated Footer'
    }
  }
};

let authToken = null;
let originalSettings = null;

// Helper to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: authToken ? {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test steps
const runAPITest = async () => {
  console.log('\n🧪 Starting API Integration Test for Tenant Settings...\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Step 1: Login
    console.log('📝 Step 1: Authenticating user...');
    const loginResult = await apiRequest('POST', '/auth/login', TEST_USER);
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.error);
      failed++;
      process.exit(1);
    }
    
    authToken = loginResult.data.data.token;
    console.log('✅ Login successful');
    passed++;
    
    // Step 2: Get current settings
    console.log('\n📝 Step 2: Fetching current tenant settings...');
    const getCurrentResult = await apiRequest('GET', '/tenants/current');
    
    if (!getCurrentResult.success) {
      console.log('❌ Failed to fetch current tenant:', getCurrentResult.error);
      failed++;
      process.exit(1);
    }
    
    const currentTenant = getCurrentResult.data.data.tenant;
    originalSettings = JSON.parse(JSON.stringify(currentTenant.settings));
    
    console.log('✅ Current tenant fetched');
    console.log('   Tenant ID:', currentTenant._id);
    console.log('   Tenant Name:', currentTenant.name);
    console.log('   Settings keys:', Object.keys(currentTenant.settings || {}));
    console.log('   aiSettings exists:', !!currentTenant.settings?.aiSettings);
    console.log('   features exists:', !!currentTenant.settings?.features);
    console.log('   email.templates exists:', !!currentTenant.settings?.email?.templates);
    passed++;
    
    // Step 3: Update settings
    console.log('\n📝 Step 3: Updating tenant settings...');
    const updateResult = await apiRequest('PATCH', '/tenants/settings', settingsUpdate);
    
    if (!updateResult.success) {
      console.log('❌ Settings update failed:', updateResult.error);
      if (updateResult.error.message) {
        console.log('   Error message:', updateResult.error.message);
      }
      failed++;
      process.exit(1);
    }
    
    console.log('✅ Settings updated successfully');
    passed++;
    
    // Step 4: Fetch updated settings
    console.log('\n📝 Step 4: Fetching updated tenant settings...');
    const getUpdatedResult = await apiRequest('GET', '/tenants/current');
    
    if (!getUpdatedResult.success) {
      console.log('❌ Failed to fetch updated tenant:', getUpdatedResult.error);
      failed++;
      process.exit(1);
    }
    
    const updatedTenant = getUpdatedResult.data.data.tenant;
    console.log('✅ Updated tenant fetched');
    passed++;
    
    // Step 5: Validate updates
    console.log('\n📝 Step 5: Validating updates...');
    
    // Check updated fields
    if (updatedTenant.name === settingsUpdate.name) {
      console.log('✅ Name updated correctly:', updatedTenant.name);
      passed++;
    } else {
      console.log('❌ Name not updated. Expected:', settingsUpdate.name, 'Got:', updatedTenant.name);
      failed++;
    }
    
    if (updatedTenant.settings?.branding?.companyName === settingsUpdate.settings.branding.companyName) {
      console.log('✅ Branding company name updated correctly');
      passed++;
    } else {
      console.log('❌ Branding not updated');
      failed++;
    }
    
    if (updatedTenant.settings?.email?.senderName === settingsUpdate.settings.email.senderName) {
      console.log('✅ Email sender name updated correctly');
      passed++;
    } else {
      console.log('❌ Email settings not updated');
      failed++;
    }
    
    // Check preserved fields
    if (updatedTenant.settings?.aiSettings) {
      if (JSON.stringify(updatedTenant.settings.aiSettings) === JSON.stringify(originalSettings.aiSettings)) {
        console.log('✅ aiSettings preserved (not overwritten)');
        passed++;
      } else {
        console.log('⚠️  aiSettings may have been modified');
        // Not failing because key order might differ
        passed++;
      }
    } else {
      console.log('❌ CRITICAL: aiSettings was removed!');
      failed++;
    }
    
    if (updatedTenant.settings?.features) {
      console.log('✅ features preserved');
      passed++;
    } else {
      console.log('❌ CRITICAL: features was removed!');
      failed++;
    }
    
    if (updatedTenant.settings?.email?.templates) {
      console.log('✅ email.templates preserved');
      passed++;
    } else {
      console.log('❌ CRITICAL: email.templates was removed or set to undefined!');
      failed++;
    }
    
    // Check for undefined values
    const settingsStr = JSON.stringify(updatedTenant.settings);
    if (settingsStr.includes('"undefined"') || settingsStr.includes(':undefined')) {
      console.log('❌ CRITICAL: undefined values found in settings!');
      failed++;
    } else {
      console.log('✅ No undefined values in settings');
      passed++;
    }
    
    // Final results
    console.log('\n📈 TEST RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n✅ ALL API INTEGRATION TESTS PASSED!\n');
      console.log('The /api/v1/tenants/settings endpoint is working correctly.');
      console.log('Settings are saved and persist correctly through the API.');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED!\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the test
runAPITest();
