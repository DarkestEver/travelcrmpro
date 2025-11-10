// Test the GET /emails API endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testGetEmails() {
  try {
    console.log('🔐 Logging in as operator...\n');
    
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        email: 'operator@travelcrm.com',
        password: 'Operator@123'
      }
    );
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');
    
    console.log('📧 Fetching emails from API...\n');
    
    const emailsResponse = await axios.get(
      `${BASE_URL}/emails`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: 20
        }
      }
    );
    
    console.log('✅ API Response:\n');
    console.log('Total Emails:', emailsResponse.data.pagination?.total || 0);
    console.log('Emails Returned:', emailsResponse.data.data?.length || 0);
    
    if (emailsResponse.data.data && emailsResponse.data.data.length > 0) {
      console.log('\n📧 First Email:');
      const first = emailsResponse.data.data[0];
      console.log('  ID:', first._id);
      console.log('  From:', first.from?.email);
      console.log('  Subject:', first.subject);
      console.log('  Category:', first.category || 'N/A');
      console.log('  Status:', first.processingStatus);
      console.log('  Received:', first.receivedAt);
    } else {
      console.log('\n⚠️  No emails returned from API');
    }
    
    console.log('\n✅ Full Response:');
    console.log(JSON.stringify(emailsResponse.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('  TEST GET EMAILS API');
console.log('══════════════════════════════════════════════════════════════\n');

testGetEmails();
