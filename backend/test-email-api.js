/**
 * Test Email API Endpoint
 */

const http = require('http');

const tenantId = '690ce6d206c104addbfedb65';

// You need to replace this with an actual JWT token from your logged-in session
// Get it from browser DevTools -> Application -> LocalStorage -> token
const token = 'YOUR_JWT_TOKEN_HERE';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/emails?page=1&limit=20',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Testing Email API Endpoint...\n');
console.log(`URL: http://localhost:5000/api/v1/emails`);
console.log(`\n⚠️  Note: You need to set a valid JWT token in this script!`);
console.log(`   Get it from: Browser DevTools -> Application -> LocalStorage\n`);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✅ API Response:');
      console.log(`   Total Emails: ${response.total || response.data?.length || 0}`);
      console.log(`   Emails Returned: ${response.emails?.length || response.data?.length || 0}`);
      
      if (response.emails?.length > 0 || response.data?.length > 0) {
        const emails = response.emails || response.data;
        console.log(`\n📧 First Email:`);
        console.log(`   Subject: ${emails[0].subject}`);
        console.log(`   From: ${emails[0].from?.email}`);
        console.log(`   Category: ${emails[0].category}`);
        console.log(`   Has Extracted Data: ${!!emails[0].extractedData || !!emails[0].aiProcessing?.extractedData}`);
      }
    } else if (res.statusCode === 401) {
      console.log('❌ Unauthorized - Token is invalid or expired');
      console.log('   Get a new token from your browser\'s localStorage');
    } else {
      console.log('❌ Error Response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  console.log('\n💡 Make sure backend server is running:');
  console.log('   cd backend && npm start');
});

req.end();

console.log('📡 Sending request...\n');
