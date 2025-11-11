/**
 * Check if Backend Server is Running
 */

const http = require('http');

console.log('🔍 Checking Backend Server Status...\n');

// Test 1: Check API endpoint (without auth)
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',  // This endpoint exists
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend server is RUNNING!');
  console.log(`   Status Code: ${res.statusCode}`);
  console.log(`   Port: 5000\n`);
  
  console.log('💡 Next Steps:');
  console.log('   1. Open browser DevTools (F12)');
  console.log('   2. Go to Network tab');
  console.log('   3. Refresh your frontend page');
  console.log('   4. Look for request to: GET /api/v1/emails');
  console.log('   5. Check the response body\n');
  
  console.log('🔍 To test the API directly:');
  console.log('   1. Get your JWT token from browser LocalStorage');
  console.log('   2. Edit test-email-api.js and add your token');
  console.log('   3. Run: node test-email-api.js');
});

req.on('error', (error) => {
  console.error('❌ Backend server is NOT running!');
  console.error(`   Error: ${error.message}\n`);
  console.log('💡 Start the backend server:');
  console.log('   cd backend');
  console.log('   npm start');
});

req.on('timeout', () => {
  console.error('❌ Backend server timeout (no response)');
  req.destroy();
});

req.end();
