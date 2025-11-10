const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGMyZmJmMzM4ODIxNmI5OGZlYjkxZiIsInJvbGUiOiJvcGVyYXRvciIsInRlbmFudElkIjoiNjkwY2U2ZDIwNmMxMDRhZGRiZmVkYjY1IiwiaWF0IjoxNzYyNzE1Nzk3LCJleHAiOjE3NjMzMjA1OTd9.NSEBF6lsvbZEW86jqX5rHVZr9Oy1W7m5UPMRTIxM03E';
const ACCOUNT_ID = '6910e940d4923a26b1ada9c4'; // pp@travelmanagerpro.com

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

async function fixSecondAccount() {
  console.log('🔧 Fixing pp@travelmanagerpro.com account\n');
  console.log('='.repeat(60));

  try {
    // Update with correct ports
    console.log('\n1️⃣ Updating account settings to correct ports...');
    const updateData = {
      imap: {
        enabled: true,
        host: 'travelmanagerpro.com',
        port: 143,  // Changed from 587
        secure: false,  // Changed from true
        username: 'pp@travelmanagerpro.com',
        password: 'Ip@warming#123'  // Use correct password
      },
      smtp: {
        enabled: true,
        host: 'travelmanagerpro.com',
        port: 25,  // Changed from 587
        secure: false,
        username: 'pp@travelmanagerpro.com',
        password: 'Ip@warming#123',  // Use correct password
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

    console.log('✅ Account updated successfully!');
    console.log(`   IMAP: ${updateResult.data.data.imap.host}:${updateResult.data.data.imap.port}`);
    console.log(`   SMTP: ${updateResult.data.data.smtp.host}:${updateResult.data.data.smtp.port}`);

    // Test IMAP
    console.log('\n2️⃣ Testing IMAP connection...');
    const imapTest = await makeRequest(
      `${API_BASE}/email-accounts/${ACCOUNT_ID}/test-imap`,
      'POST'
    );

    if (imapTest.data.success) {
      console.log('✅ IMAP test PASSED!');
    } else {
      console.log('❌ IMAP test FAILED:', imapTest.data.error);
    }

    // Test SMTP
    console.log('\n3️⃣ Testing SMTP connection...');
    const smtpTest = await makeRequest(
      `${API_BASE}/email-accounts/${ACCOUNT_ID}/test-smtp`,
      'POST'
    );

    if (smtpTest.data.success) {
      console.log('✅ SMTP test PASSED!');
    } else {
      console.log('❌ SMTP test FAILED:', smtpTest.data.error);
    }

    // Get final status
    console.log('\n4️⃣ Final account status:');
    const finalResult = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`);
    
    console.log('\n📧 pp@travelmanagerpro.com:');
    console.log(`   IMAP: ${finalResult.data.data.imap.host}:${finalResult.data.data.imap.port} - ${finalResult.data.data.imap.lastTestStatus}`);
    console.log(`   SMTP: ${finalResult.data.data.smtp.host}:${finalResult.data.data.smtp.port} - ${finalResult.data.data.smtp.lastTestStatus}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n💡 Refresh the UI to see updated status');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

fixSecondAccount();
