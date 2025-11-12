const axios = require('axios');

async function triggerMatch() {
  try {
    // You need to get the auth token from your browser
    // Open Developer Tools (F12) > Application > Local Storage > look for 'token' or 'authToken'
    const token = 'YOUR_TOKEN_HERE'; // Replace this!
    
    const emailId = '69137569bc51b82e755770a3';
    
    console.log('🔄 Triggering match packages via API...\n');
    
    const response = await axios.post(
      `http://localhost:5000/api/v1/emails/${emailId}/match`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Match successful!');
    console.log(`Found ${response.data.data.length} matches\n`);
    
    response.data.data.slice(0, 3).forEach((match, idx) => {
      console.log(`${idx + 1}. ${match.package.title} - Score: ${match.score}/100`);
    });
    
    console.log('\n🎉 Now refresh your browser to see the updated matches!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.log('\n💡 Tip: You need to provide your auth token in the script');
    console.log('   OR just click "Match Packages" button in the UI');
  }
}

triggerMatch();
