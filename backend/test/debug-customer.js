const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testCustomerFlow() {
  console.log('=== TESTING CUSTOMER CREATION FLOW ===\n');

  try {
    // Use existing tenant
    const tenantId = '690fdbb922eee1810173232a';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGZkYmI5MjJlZWUxODEwMTczMjMyYiIsInJvbGUiOiJvcGVyYXRvciIsInRlbmFudElkIjoiNjkwZmRiYjkyMmVlZTE4MTAxNzMyMzJhIiwiaWF0IjoxNzYyNjQ2OTgyLCJleHAiOjE3NjMyNTE3ODJ9.6DWdVaB4wY6w71u3o5xw6jjZiY1_BLUHkgJg_FBXnUM';

    // Create customer user
    console.log('Creating customer user...\n');
    const customerUserData = {
      name: 'Jane Customer',
      email: `customer.${Date.now()}@test.com`,
      password: 'Customer@123456',
      role: 'customer',
      phone: '+1-555-3333',
      passportNumber: 'P12345678',
      dateOfBirth: '1990-01-01',
      nationality: 'US'
    };

    console.log('Customer User Data:', JSON.stringify(customerUserData, null, 2));

    const userResponse = await axios.post(`${API_BASE}/auth/register`, customerUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('\n✓ User created');
    console.log('Status:', userResponse.status);
    console.log('User ID:', userResponse.data.data.user.id);

  } catch (error) {
    console.log('\n✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testCustomerFlow();
