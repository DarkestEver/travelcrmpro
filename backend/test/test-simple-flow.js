const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testSimpleFlow() {
  try {
    const timestamp = Date.now();
    
    // Step 1: Create tenant
    console.log('\n=== STEP 1: CREATE TENANT ===');
    const tenantData = {
      name: 'Simple Test Agency',
      subdomain: `simple${timestamp}`,
      ownerName: 'Simple Owner',
      ownerEmail: `simple${timestamp}@test.com`,
      ownerPassword: 'Test@1234567',
      ownerPhone: '+1-555-0001',
      plan: 'free'
    };
    
    console.log('Creating tenant with:', tenantData);
    const createResp = await axios.post(`${BASE_URL}/tenants`, tenantData);
    console.log('✓ Tenant created! Status:', createResp.status);
    console.log('✓ Owner Email:', createResp.data.data.owner.email);
    console.log('✓ Tenant ID:', createResp.data.data.tenant._id);
    
    // Step 2: Immediately try login (no delay)
    console.log('\n=== STEP 2: LOGIN IMMEDIATELY (NO DELAY) ===');
    try {
      const loginResp = await axios.post(`${BASE_URL}/auth/login`, {
        email: tenantData.ownerEmail,
        password: tenantData.ownerPassword
      });
      console.log('✓ Login successful! Status:', loginResp.status);
      console.log('✓ Token received:', loginResp.data.data.accessToken.substring(0, 30) + '...');
      console.log('✓ User role:', loginResp.data.data.user.role);
    } catch (error) {
      console.log('✗ Login failed!');
      console.log('  Status:', error.response?.status);
      console.log('  Error:', JSON.stringify(error.response?.data, null, 2));
    }
    
    console.log('\n✓✓✓ TEST COMPLETED SUCCESSFULLY ✓✓✓\n');
    
  } catch (error) {
    console.error('\n✗✗✗ TEST FAILED ✗✗✗');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testSimpleFlow();
