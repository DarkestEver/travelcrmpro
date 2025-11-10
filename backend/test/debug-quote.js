const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testQuoteCreation() {
  try {
    console.log('=== TESTING QUOTE CREATION ===\n');

    // Step 1: Create tenant
    console.log('Step 1: Creating tenant...\n');
    const tenantData = {
      name: 'Test Agency',
      subdomain: `test${Date.now()}`,
      owner: {
        name: 'Test Owner',
        email: `owner.${Date.now()}@test.com`,
        password: 'Test@123456',
        phone: '+1234567890'
      }
    };

    const tenantResponse = await axios.post(`${API_BASE}/tenants/register`, tenantData);
    const tenantId = tenantResponse.data.data.tenant._id;
    console.log('✓ Tenant created:', tenantId);

    // Step 2: Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: tenantData.owner.email,
      password: tenantData.owner.password
    }, {
      headers: { 'X-Tenant-ID': tenantId }
    });
    const token = loginResponse.data.data.token;
    console.log('✓ Logged in\n');

    // Step 3: Create customer user
    console.log('Step 3: Creating customer...\n');
    const customerUserData = {
      name: 'Test Customer',
      email: `customer.${Date.now()}@test.com`,
      password: 'Test@123456',
      role: 'customer',
      phone: '+1234567890'
    };

    const userResponse = await axios.post(`${API_BASE}/auth/register`, customerUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const userId = userResponse.data.data.user._id;
    console.log('✓ User created:', userId);

    // Step 4: Create customer profile
    const customerProfileData = {
      userId: userId,
      passportNumber: 'ABC123456',
      dateOfBirth: '1990-01-01',
      nationality: 'US'
    };

    const customerResponse = await axios.post(`${API_BASE}/customers`, customerProfileData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const customerId = customerResponse.data.data.customer._id;
    console.log('✓ Customer profile created:', customerId);
    console.log('');

    // Step 5: Create quote
    console.log('Step 5: Creating quote...\n');
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 15);

    const quoteData = {
      customerId: customerId,
      title: 'Paris Vacation Quote',
      description: 'Comprehensive travel package',
      validUntil: validUntil.toISOString(),
      items: [
        {
          description: 'Hotel Accommodation (7 nights)',
          quantity: 7,
          unitPrice: 150,
          total: 1050
        },
        {
          description: 'Round Trip Flight',
          quantity: 1,
          unitPrice: 800,
          total: 800
        }
      ],
      subtotal: 1850,
      tax: 185,
      total: 2035,
      status: 'draft',
      notes: 'Test quote'
    };

    console.log('Quote Data:', JSON.stringify(quoteData, null, 2));
    console.log('');

    const quoteResponse = await axios.post(`${API_BASE}/quotes`, quoteData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('✓ SUCCESS!');
    console.log('Status:', quoteResponse.status);
    console.log('Response:', JSON.stringify(quoteResponse.data, null, 2));

  } catch (error) {
    console.log('\n✗ FAILED');
    console.log('Error at:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testQuoteCreation();
