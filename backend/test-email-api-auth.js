/**
 * Test API authentication
 */

const axios = require('axios');

async function testAuth() {
  console.log('🔐 Testing Email API Authentication\n');
  
  const emailId = '69126a222d6a7a37eadf12a6';
  const apiUrl = 'http://localhost:5000/api/v1';
  
  try {
    // Test 1: Without auth
    console.log('Test 1: Calling API without authentication...');
    try {
      const response = await axios.get(`${apiUrl}/emails/${emailId}`);
      console.log('✅ Response (no auth):', response.data);
    } catch (error) {
      console.log('❌ Expected error (no auth):', error.response?.data);
    }
    
    console.log('\n---\n');
    
    // Test 2: Login and get token
    console.log('Test 2: Logging in to get token...');
    const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
      email: 'admin@example.com', // Update with real credentials
      password: 'password123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Got token:', token.substring(0, 20) + '...');
    
    console.log('\n---\n');
    
    // Test 3: With auth
    console.log('Test 3: Calling API with authentication...');
    const emailResponse = await axios.get(`${apiUrl}/emails/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Email Response:');
    console.log('   Success:', emailResponse.data.success);
    console.log('   Subject:', emailResponse.data.data.subject);
    console.log('   Category:', emailResponse.data.data.category);
    console.log('   Has itineraryMatching:', !!emailResponse.data.data.itineraryMatching);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAuth();
