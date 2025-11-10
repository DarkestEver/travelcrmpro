const axios = require('axios');

const testTenantCreation = async () => {
  try {
    console.log('Testing tenant creation...');
    const data = {
      name: 'Test Travel Agency',
      subdomain: `test${Date.now()}`,
      ownerName: 'Test Owner',
      ownerEmail: `owner.${Date.now()}@test.com`,
      ownerPassword: 'Test@1234567',
      ownerPhone: '+1-555-1234',
      plan: 'free'
    };
    console.log('Sending:', JSON.stringify(data, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/v1/tenants', data, {
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('\nStatus:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 201) {
      console.log('\n✓ SUCCESS! Tenant created successfully!');
      console.log('Owner ID:', response.data.data?.owner?._id);
      console.log('Tenant ID:', response.data.data?.tenant?._id);
    } else {
      console.log('\n✗ FAILED with status', response.status);
    }
  } catch (error) {
    console.log('Full Error:', error.message);
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error Code:', error.code);
  }
};

testTenantCreation();
