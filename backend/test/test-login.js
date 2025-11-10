const axios = require('axios');

async function testFlow() {
  try {
    // Step 1: Create tenant
    console.log('Step 1: Creating tenant...');
    const timestamp = Date.now();
    const tenantData = {
      name: 'Login Test Agency',
      subdomain: `logintest${timestamp}`,
      ownerName: 'Login Test Owner',
      ownerEmail: `owner${timestamp}@logintest.com`,
      ownerPassword: 'TestPassword123!',
      ownerPhone: '+1-555-9999',
      plan: 'free'
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/v1/tenants', tenantData);
    console.log('Tenant created! Status:', createResponse.status);
    console.log('Owner Email:', tenantData.ownerEmail);
    console.log('Owner ID:', createResponse.data.data.owner._id);
    const tenantId = createResponse.data.data.tenant._id;
    console.log('Tenant ID:', tenantId);
    
    // Step 2: Try to login WITHOUT tenant header
    console.log('\nStep 2: Login WITHOUT X-Tenant-ID header...');
    try {
      const loginResponse1 = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email: tenantData.ownerEmail,
        password: tenantData.ownerPassword
      });
      console.log('Login Status:', loginResponse1.status);
    } catch (error) {
      console.log('Login Error:', error.response?.status, error.response?.data);
    }
    
    // Step 3: Try to login WITH tenant header
    console.log('\nStep 3: Login WITH X-Tenant-ID header...');
    const loginResponse2 = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: tenantData.ownerEmail,
      password: tenantData.ownerPassword
    }, {
      headers: {
        'X-Tenant-ID': tenantId
      }
    });

    console.log('\nLogin Status:', loginResponse2.status);
    console.log('\nLogin Response:', JSON.stringify(loginResponse2.data, null, 2));
  } catch (error) {
    console.error('\nError Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Code:', error.code);
  }
}

testFlow();
