const axios = require('axios');

async function testEmailAPI() {
  try {
    console.log('Testing Email API...\n');
    
    const tenantId = '690ce6d206c104addbfedb65';
    const emailId = '69126a222d6a7a37eadf12a6'; // Paris email
    
    // Test 1: Get all emails
    console.log('1️⃣  GET /api/v1/emails - List all emails');
    try {
      const response = await axios.get('http://localhost:5000/api/v1/emails', {
        params: { page: 1, limit: 10 },
        headers: { 'X-Tenant-ID': tenantId }
      });
      
      console.log(`   ✅ Success: ${response.data.length} emails returned`);
      console.log(`   First email: ${response.data[0]?.subject}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Backend is not running on port 5000!');
      }
    }
    console.log();
    
    // Test 2: Get specific email
    console.log('2️⃣  GET /api/v1/emails/:id - Get Paris email');
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/emails/${emailId}`, {
        headers: { 'X-Tenant-ID': tenantId }
      });
      
      console.log(`   ✅ Success`);
      console.log(`   Subject: ${response.data.data.subject}`);
      console.log(`   Category: ${response.data.data.category}`);
      console.log(`   Has extractedData: ${!!response.data.data.extractedData}`);
      
      if (response.data.data.extractedData) {
        console.log(`   Destination: ${response.data.data.extractedData.destination}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.status === 404) {
        console.log('   Email not found in API');
      }
    }
    console.log();
    
    console.log('═'.repeat(60));
    console.log('🌐 Frontend URLs:');
    console.log('   Email List: http://localhost:5175/emails/history');
    console.log('   Paris Email: http://localhost:5175/emails/69126a222d6a7a37eadf12a6');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmailAPI();
