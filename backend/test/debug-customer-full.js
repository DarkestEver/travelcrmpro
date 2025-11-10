const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testCustomerCreation() {
  console.log('=== TESTING CUSTOMER USER + PROFILE CREATION ===\n');

  try {
    // Use existing tenant
    const tenantId = '690fdc7d22eee18101732394';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGZkYzdkMjJlZWUxODEwMTczMjM5NSIsInJvbGUiOiJvcGVyYXRvciIsInRlbmFudElkIjoiNjkwZmRjN2QyMmVlZTE4MTAxNzMyMzk0IiwiaWF0IjoxNzYyNjQ3MTc4LCJleHAiOjE3NjMyNTE5Nzh9.3MUQv9qdQm0S8bnp01_AO_Jh2ck0HTRR3IVpPDUxk-Q';

    // Step 1: Create user
    console.log('Step 1: Creating user for customer...\n');
    const customerUserData = {
      name: 'Test Customer',
      email: `customer.test.${Date.now()}@test.com`,
      password: 'Customer@123456',
      role: 'customer',
      phone: '+1-555-4444'
    };

    console.log('User Data:', JSON.stringify(customerUserData, null, 2));

    const userResponse = await axios.post(`${API_BASE}/auth/register`, customerUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('\n✓ User created successfully');
    console.log('Status:', userResponse.status);
    console.log('User ID:', userResponse.data.data.user.id);

    const userId = userResponse.data.data.user.id;

    // Step 2: Create customer profile
    console.log('\nStep 2: Creating customer profile...\n');
    const customerProfileData = {
      userId: userId,
      name: customerUserData.name,
      email: customerUserData.email,
      phone: customerUserData.phone,
      passportNumber: 'P98765432',
      dateOfBirth: '1995-05-15',
      nationality: 'USA',
      preferences: {
        seatPreference: 'aisle',
        mealPreference: 'vegan'
      }
    };

    console.log('Profile Data:', JSON.stringify(customerProfileData, null, 2));

    const profileResponse = await axios.post(`${API_BASE}/customers`, customerProfileData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('\n✓ Customer profile created successfully');
    console.log('Status:', profileResponse.status);
    console.log('Customer ID:', profileResponse.data.data.customer._id);

  } catch (error) {
    console.log('\n✗ FAILED');
    console.log('Error at:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testCustomerCreation();
