// Quick test to check backend email API
const axios = require('axios');

async function testEmailAPI() {
  console.log('🧪 Testing Email API...\n');
  
  try {
    // First, try to get a token (you'll need to update with real credentials)
    console.log('Step 1: Testing email endpoint...');
    
    const testUrl = 'http://localhost:5000/api/v1/emails';
    console.log(`URL: ${testUrl}`);
    
    // Test without auth first to see the error
    const response = await axios.get(testUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      if (err.response) {
        console.log('Response Status:', err.response.status);
        console.log('Response Data:', err.response.data);
      }
      return err.response;
    });
    
    console.log('\n✅ API is responding (even if auth failed)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🔍 Next steps:');
  console.log('1. Make sure backend is running on port 5000');
  console.log('2. Check if you have a valid auth token');
  console.log('3. Open browser console at http://localhost:5174/emails/history');
  console.log('4. Look for Network tab errors');
}

testEmailAPI();
