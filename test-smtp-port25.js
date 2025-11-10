const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGMyZmJmMzM4ODIxNmI5OGZlYjkxZiIsInJvbGUiOiJvcGVyYXRvciIsInRlbmFudElkIjoiNjkwY2U2ZDIwNmMxMDRhZGRiZmVkYjY1IiwiaWF0IjoxNzYyNzE1Nzk3LCJleHAiOjE3NjMzMjA1OTd9.NSEBF6lsvbZEW86jqX5rHVZr9Oy1W7m5UPMRTIxM03E';
const ACCOUNT_ID = '6910eef8ad00888b4c012e75'; // app@travelmanagerpro.com

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testSMTPPort25() {
  console.log('🧪 Testing SMTP with Port 25\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Update account to use port 25
    console.log('\n1️⃣ Updating SMTP settings to port 25...');
    const updateData = {
      smtp: {
        enabled: true,
        host: 'travelmanagerpro.com',
        port: 25,
        secure: false,
        username: 'app@travelmanagerpro.com',
        password: 'Ip@warming#123',
        fromName: 'Travel Manager Pro'
      }
    };

    const updateResult = await makeRequest(
      `${API_BASE}/email-accounts/${ACCOUNT_ID}`,
      'PUT',
      updateData
    );

    if (updateResult.status !== 200) {
      console.error('❌ Update failed:', updateResult.status, updateResult.data);
      return;
    }

    console.log('✅ Account updated to use port 25');
    console.log(`   Host: ${updateResult.data.data.smtp.host}`);
    console.log(`   Port: ${updateResult.data.data.smtp.port}`);
    console.log(`   Secure: ${updateResult.data.data.smtp.secure}`);

    // Step 2: Test SMTP with port 25
    console.log('\n2️⃣ Testing SMTP connection with port 25...');
    console.log('   Testing... (timeout: 10s)');

    const testResult = await makeRequest(
      `${API_BASE}/email-accounts/${ACCOUNT_ID}/test-smtp`,
      'POST'
    );

    console.log('\n📊 Test Result:');
    console.log('   Status:', testResult.status);
    console.log('   Success:', testResult.data.success);
    
    if (testResult.data.success) {
      console.log('\n✅ SMTP TEST PASSED WITH PORT 25!');
      console.log('   Message:', testResult.data.message);
    } else {
      console.log('\n❌ SMTP TEST FAILED WITH PORT 25');
      console.log('   Error:', testResult.data.error);
      
      console.log('\n💡 Trying port 2525 (alternative SMTP port)...');
      
      // Try port 2525
      const update2525 = await makeRequest(
        `${API_BASE}/email-accounts/${ACCOUNT_ID}`,
        'PUT',
        {
          smtp: {
            enabled: true,
            host: 'travelmanagerpro.com',
            port: 2525,
            secure: false,
            username: 'app@travelmanagerpro.com',
            password: 'Ip@warming#123',
            fromName: 'Travel Manager Pro'
          }
        }
      );

      const test2525 = await makeRequest(
        `${API_BASE}/email-accounts/${ACCOUNT_ID}/test-smtp`,
        'POST'
      );

      if (test2525.data.success) {
        console.log('✅ SMTP TEST PASSED WITH PORT 2525!');
        console.log('   Message:', test2525.data.message);
      } else {
        console.log('❌ SMTP TEST FAILED WITH PORT 2525');
        console.log('   Error:', test2525.data.error);
        
        console.log('\n💡 Available SMTP ports to try:');
        console.log('   - Port 25 (Standard SMTP)');
        console.log('   - Port 587 (SMTP Submission - TLS)');
        console.log('   - Port 465 (SMTPS - SSL/TLS)');
        console.log('   - Port 2525 (Alternative SMTP)');
      }
    }

    // Step 3: Fetch final account state
    console.log('\n3️⃣ Fetching final account state...');
    const finalResult = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`);
    
    console.log('\n📧 Account Status:');
    console.log(`   Email: ${finalResult.data.data.email}`);
    console.log(`   SMTP Host: ${finalResult.data.data.smtp.host}`);
    console.log(`   SMTP Port: ${finalResult.data.data.smtp.port}`);
    console.log(`   SMTP Status: ${finalResult.data.data.smtp.lastTestStatus || 'not tested'}`);
    if (finalResult.data.data.smtp.lastTestError) {
      console.log(`   SMTP Error: ${finalResult.data.data.smtp.lastTestError}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSMTPPort25();
