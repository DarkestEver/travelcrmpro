const axios = require('axios');
const APIClient = require('./helpers/api-client');

async function compareTests() {
  console.log('=== COMPARING STANDALONE VS TEST SUITE ===\n');
  
  const timestamp = Date.now();
  const tenantData = {
    name: 'Compare Test Agency',
    subdomain: `compare${timestamp}`,
    ownerName: 'Compare Owner',
    ownerEmail: `admin.${timestamp}@test-agency.com`,
    ownerPassword: 'Test@1234567',
    ownerPhone: '+1-555-0000',
    plan: 'free'
  };
  
  try {
    // Test 1: Create tenant with raw axios
    console.log('TEST 1: Creating tenant with raw axios...');
    const createResp = await axios.post('http://localhost:5000/api/v1/tenants', tenantData);
    console.log('✓ Status:', createResp.status);
    const ownerEmail = createResp.data.data.owner.email;
    console.log('✓ Owner email:', ownerEmail);
    
    // Wait 3 seconds
    console.log('\nWaiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Login with raw axios
    console.log('\nTEST 2: Login with raw axios (like standalone test)...');
    try {
      const loginResp1 = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email: ownerEmail,
        password: tenantData.ownerPassword
      }, {
        validateStatus: () => true
      });
      console.log('✓ Status:', loginResp1.status);
      if (loginResp1.status === 200) {
        console.log('✓ SUCCESS with raw axios!\n');
      } else {
        console.log('✗ FAILED:', loginResp1.data, '\n');
      }
    } catch (err) {
      console.log('✗ ERROR:', err.message, '\n');
    }
    
    // Test 3: Login with APIClient (like test suite)
    console.log('TEST 3: Login with APIClient (like test suite)...');
    const client = new APIClient();
    try {
      const loginResp2 = await client.post('/auth/login', {
        email: ownerEmail,
        password: tenantData.ownerPassword
      });
      console.log('✓ Status:', loginResp2.status);
      console.log('✓ Success:', loginResp2.success);
      if (loginResp2.success) {
        console.log('✓ SUCCESS with APIClient!');
        console.log('✓ Data structure:', Object.keys(loginResp2.data));
      } else {
        console.log('✗ FAILED with APIClient');
        console.log('Error:', loginResp2.data);
      }
    } catch (err) {
      console.log('✗ ERROR with APIClient:', err.message);
    }
    
  } catch (error) {
    console.error('\n✗✗✗ TEST FAILED ✗✗✗');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

compareTests();
