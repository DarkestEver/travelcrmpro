const axios = require('axios');

async function debugLoginIssue() {
  try {
    console.log('=== DEBUGGING LOGIN 500 ERROR ===\n');
    
    const timestamp = Date.now();
    const tenantData = {
      name: 'Debug Agency',
      subdomain: `debug${timestamp}`,
      ownerName: 'Debug Owner',
      ownerEmail: `admin.${timestamp}@test-agency.com`,
      ownerPassword: 'Test@1234567',
      ownerPhone: '+1-555-0000',
      plan: 'free'
    };
    
    // Step 1: Create tenant
    console.log('Step 1: Creating tenant...');
    const createResp = await axios.post('http://localhost:5000/api/v1/tenants', tenantData);
    console.log('✓ Tenant created:', createResp.status);
    console.log('✓ Owner ID:', createResp.data.data.owner._id);
    console.log('✓ Tenant ID:', createResp.data.data.tenant._id);
    console.log('✓ Owner Email:', createResp.data.data.owner.email);
    
    // Step 2: Wait a bit
    console.log('\nStep 2: Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Try login with detailed error handling
    console.log('\nStep 3: Attempting login...');
    console.log('Login Data:', {
      email: tenantData.ownerEmail,
      password: '***' + tenantData.ownerPassword.substring(3)
    });
    
    try {
      const loginResp = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email: tenantData.ownerEmail,
        password: tenantData.ownerPassword
      }, {
        validateStatus: () => true, // Don't throw on any status
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n✓ Login Response Status:', loginResp.status);
      console.log('✓ Response Headers:', loginResp.headers);
      console.log('✓ Response Data:', JSON.stringify(loginResp.data, null, 2));
      
      if (loginResp.status === 200) {
        console.log('\n✓✓✓ LOGIN SUCCESS! ✓✓✓');
        console.log('Token:', loginResp.data.data.accessToken.substring(0, 30) + '...');
      } else {
        console.log('\n✗✗✗ LOGIN FAILED ✗✗✗');
        console.log('This is the error we need to fix on the backend!');
      }
      
    } catch (loginError) {
      console.log('\n✗✗✗ LOGIN REQUEST FAILED ✗✗✗');
      console.log('Error:', loginError.message);
      console.log('Code:', loginError.code);
      if (loginError.response) {
        console.log('Response Status:', loginError.response.status);
        console.log('Response Data:', loginError.response.data);
      }
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

debugLoginIssue();
