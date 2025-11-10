const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testFullFlow() {
  console.log('=== TESTING FULL USER + AGENT FLOW ===\n');

  try {
    // Step 1: Create tenant and login
    console.log('Step 1: Creating tenant...\n');
    const tenantData = {
      name: 'Debug Agency',
      subdomain: `debug${Date.now()}`,
      ownerName: 'Debug Owner',
      ownerEmail: `owner.${Date.now()}@debug.com`,
      ownerPassword: 'Owner@123456',
      ownerPhone: '+1-555-0000',
      plan: 'free'
    };

    const tenantResponse = await axios.post(`${API_BASE}/tenants`, tenantData);
    const tenantId = tenantResponse.data.data.tenant._id;
    console.log('✓ Tenant created:', tenantId);
    console.log('');

    // Step 2: Login
    console.log('Step 2: Logging in...\n');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for tenant to be fully ready

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: tenantData.ownerEmail,
      password: tenantData.ownerPassword
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✓ Logged in');
    console.log('');

    // Step 3: Create user for agent
    console.log('Step 3: Creating user...\n');
    const userData = {
      name: 'Test Agent User',
      email: `agent.${Date.now()}@test.com`,
      password: 'Agent@123456',
      role: 'agent',
      phone: '+1-555-9999'
    };

    const userResponse = await axios.post(`${API_BASE}/auth/register`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    const userId = userResponse.data.data.user.id;
    console.log('✓ User created:', userId);
    console.log('');

    // Step 4: Create agent profile
    console.log('Step 4: Creating agent profile...\n');
    const agentData = {
      userId: userId,
      agencyName: 'Test Travel Agency',
      contactPerson: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      creditLimit: 10000,
      tier: 'silver'
    };

    const agentResponse = await axios.post(`${API_BASE}/agents`, agentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('✓ SUCCESS');
    console.log('Status:', agentResponse.status);
    console.log('\n=== FULL RESPONSE ===');
    console.log(JSON.stringify(agentResponse.data, null, 2));
    console.log('\n=== RESPONSE STRUCTURE ===');
    console.log('agentResponse.data:', typeof agentResponse.data);
    console.log('agentResponse.data.success:', agentResponse.data.success);
    console.log('agentResponse.data.data:', typeof agentResponse.data.data);
    console.log('agentResponse.data.data.agent:', agentResponse.data.data?.agent ? 'exists' : 'null');
    console.log('agentResponse.data.agent:', agentResponse.data.agent ? 'exists' : 'null');
    
    if (agentResponse.data.data?.agent) {
      const agent = agentResponse.data.data.agent;
      console.log('\n=== AGENT OBJECT ===');
      console.log('agent._id:', agent._id);
      console.log('agent.id:', agent.id);
      console.log('agent.agencyName:', agent.agencyName);
    }

  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('Stack:', error.message);
  }
}

testFullFlow();
