const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testAgentProfileCreation() {
  console.log('=== TESTING AGENT PROFILE CREATION ===\n');

  // Use existing tenant and token
  const tenantId = '690fda6c22eee181017322a6';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGZkYTZjMjJlZWUxODEwMTczMjJhNyIsInJvbGUiOiJvcGVyYXRvciIsInRlbmFudElkIjoiNjkwZmRhNmMyMmVlZTE4MTAxNzMyMmE2IiwiaWF0IjoxNzYyNjQ2NjQ5LCJleHAiOjE3NjMyNTE0NDl9.VUILzAsPXj3gJBkmdKr0Bde5Oe0vBgLhcCikNafHtbQ';

  try {
    // Step 1: Create user
    console.log('Step 1: Creating user...\n');
    const userData = {
      name: 'Debug Agent User',
      email: `agent.debug.${Date.now()}@test.com`,
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

    console.log('✓ User created');
    const userId = userResponse.data.data.user.id;
    console.log('User ID:', userId);
    console.log('');

    // Step 2: Create agent profile
    console.log('Step 2: Creating agent profile...\n');
    const agentData = {
      userId: userId,
      agencyName: 'Debug Travel Agency',
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

    console.log('Agent Data:', JSON.stringify(agentData, null, 2));
    console.log('');

    const agentResponse = await axios.post(`${API_BASE}/agents`, agentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('✓ SUCCESS');
    console.log('Status:', agentResponse.status);
    console.log('Response:', JSON.stringify(agentResponse.data, null, 2));

  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testAgentProfileCreation();
