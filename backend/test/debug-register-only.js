const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testRegister() {
  console.log('=== TESTING /auth/register WITH TENANT CONTEXT ===\n');

  // Use the tenant ID and token from the last successful test
  const tenantId = '690fd953733864cdd0b3961d';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGZkOTUzNzMzODY0Y2RkMGIzOTYxZSIsInJvbGUiOiJvcGVyYXRvciIsInRlbmFudElkIjoiNjkwZmQ5NTM3MzM4NjRjZGQwYjM5NjFkIiwiaWF0IjoxNzYyNjQ2MzY5LCJleHAiOjE3NjI2NDk5Njl9.jwBfOJBRLqbmgIoZtVD0Yr9rDpImk6-Qdz_1kxmIBRI';

  // Test 1: Register with tenant context
  console.log('Test 1: POST /auth/register with X-Tenant-ID header\n');
  
  const userData = {
    name: 'Test Agent User',
    email: `agent.${Date.now()}@test.com`,
    password: 'Agent@123456',
    role: 'agent',
    phone: '+1-555-1111'
  };

  console.log('User Data:', JSON.stringify(userData, null, 2));
  console.log('Headers:');
  console.log('  Authorization: Bearer <token>');
  console.log('  X-Tenant-ID:', tenantId);
  console.log('');

  try {
    const response = await axios.post(`${API_BASE}/auth/register`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json'
      }
    });

    console.log('✓ SUCCESS');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.user) {
      console.log('\nExtracted User Info:');
      console.log('  User ID:', response.data.data.user.id || response.data.data.user._id);
      console.log('  Email:', response.data.data.user.email);
      console.log('  Role:', response.data.data.user.role);
    }

  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Full Error:', error.message);
  }
}

testRegister();
