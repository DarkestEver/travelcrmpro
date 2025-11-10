/**
 * Quick API Check
 * Tests if the backend API is accessible
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function checkAPI() {
  console.log('Checking API connectivity...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthCheck = await axios.get('http://localhost:5000/', { validateStatus: () => true });
    console.log(`   Status: ${healthCheck.status}`);
    console.log(`   ✓ Server is running\n`);

    // Test 2: Try registration
    console.log('2. Testing registration endpoint...');
    const testData = {
      name: 'Test User',
      email: `test.${Date.now()}@test.com`,
      password: 'Test@123456',
      phone: '+1-555-1234',
      role: 'agency_admin'
    };

    console.log('   Sending registration request...');
    const response = await axios.post(`${BASE_URL}/auth/register`, testData, {
      validateStatus: () => true
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 201) {
      console.log('   ✓ Registration successful!\n');
      
      // Test 3: Try login
      console.log('3. Testing login endpoint...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testData.email,
        password: testData.password
      }, { validateStatus: () => true });

      console.log(`   Status: ${loginResponse.status}`);
      if (loginResponse.status === 200) {
        console.log('   ✓ Login successful!');
        console.log(`   Token: ${loginResponse.data.token?.substring(0, 20)}...`);
      } else {
        console.log('   ✗ Login failed');
        console.log(`   Response:`, loginResponse.data);
      }
    } else {
      console.log('   ✗ Registration failed\n');
    }

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nBackend server is not running!');
      console.error('Please start the server with: npm run dev');
    }
  }
}

checkAPI();
