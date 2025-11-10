const axios = require('axios');
const APIClient = require('./helpers/api-client');

async function debugUserCreation() {
  console.log('=== DEBUGGING USER CREATION FAILURES ===\n');
  
  try {
    // Step 1: Create tenant and login
    console.log('Step 1: Creating tenant and logging in...');
    const timestamp = Date.now();
    const tenantData = {
      name: 'Debug Agency',
      subdomain: `debug${timestamp}`,
      ownerName: 'Debug Owner',
      ownerEmail: `admin.${timestamp}@test.com`,
      ownerPassword: 'Test@1234567',
      ownerPhone: '+1-555-0000',
      plan: 'free'
    };
    
    const createResp = await axios.post('http://localhost:5000/api/v1/tenants', tenantData);
    console.log('✓ Tenant created');
    const tenantId = createResp.data.data.tenant._id;
    const ownerEmail = createResp.data.data.owner.email;
    console.log('✓ Tenant ID:', tenantId);
    console.log('✓ Owner Email:', ownerEmail);
    
    // Wait and login
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const loginResp = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: ownerEmail,
      password: tenantData.ownerPassword
    });
    const token = loginResp.data.data.accessToken;
    console.log('✓ Logged in successfully');
    console.log('✓ Token:', token.substring(0, 30) + '...\n');
    
    // Step 2: Try to create an agent using different methods
    console.log('Step 2: Attempting to create an agent...\n');
    
    const agentData = {
      name: 'Test Agent',
      email: `agent.${timestamp}@test.com`,
      password: 'Agent@1234567',
      role: 'agent',
      phone: '+1-555-1111'
    };
    
    // Method 1: POST to /users
    console.log('Method 1: POST /api/v1/users');
    console.log('Agent Data:', JSON.stringify(agentData, null, 2));
    try {
      const resp1 = await axios.post('http://localhost:5000/api/v1/users', agentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      console.log('Response Status:', resp1.status);
      console.log('Response:', JSON.stringify(resp1.data, null, 2));
    } catch (err) {
      console.log('Error:', err.message);
    }
    
    console.log('\n---\n');
    
    // Method 2: POST to /agents
    console.log('Method 2: POST /api/v1/agents');
    try {
      const resp2 = await axios.post('http://localhost:5000/api/v1/agents', agentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      console.log('Response Status:', resp2.status);
      console.log('Response:', JSON.stringify(resp2.data, null, 2));
    } catch (err) {
      console.log('Error:', err.message);
    }
    
    console.log('\n---\n');
    
    // Method 3: Check what endpoints are available
    console.log('Method 3: Testing endpoint availability...');
    const endpoints = ['/users', '/agents', '/customers', '/suppliers'];
    
    for (const endpoint of endpoints) {
      try {
        const resp = await axios.get(`http://localhost:5000/api/v1${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId
          },
          validateStatus: () => true
        });
        console.log(`GET ${endpoint}: ${resp.status} ${resp.status === 200 ? '✓' : '✗'}`);
      } catch (err) {
        console.log(`GET ${endpoint}: ERROR - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n✗✗✗ TEST FAILED ✗✗✗');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugUserCreation();
