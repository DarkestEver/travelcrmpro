const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGMyZmJmMzM4ODIxNmI5OGZlYjkxZiIsInJvbGUiOiJvcGVyYXRvciIsInRlbmFudElkIjoiNjkwY2U2ZDIwNmMxMDRhZGRiZmVkYjY1IiwiaWF0IjoxNzYyNzE1Nzk3LCJleHAiOjE3NjMzMjA1OTd9.NSEBF6lsvbZEW86jqX5rHVZr9Oy1W7m5UPMRTIxM03E';
const ACCOUNT_ID = '6910eef8ad00888b4c012e75';

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

async function testCorrectPorts() {
  console.log('🧪 Testing Email Server with Correct Ports\n');
  console.log('='.repeat(60));
  console.log('Server Info:');
  console.log('  POP:  travelmanagerpro.com - Port 110/995');
  console.log('  IMAP: travelmanagerpro.com - Port 143/993');
  console.log('  SMTP: travelmanagerpro.com - Port 25/465/587');
  console.log('='.repeat(60));

  try {
    // Test 1: SMTP Port 25 (confirmed open)
    console.log('\n1️⃣ Testing SMTP Port 25 (confirmed open)...');
    const smtp25 = {
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

    await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`, 'PUT', smtp25);
    console.log('   Updated to port 25');
    
    const test25 = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}/test-smtp`, 'POST');
    
    if (test25.data.success) {
      console.log('   ✅ SMTP Port 25 WORKS!');
      console.log('   Message:', test25.data.message);
    } else {
      console.log('   ❌ Port 25 Failed');
      console.log('   Error:', test25.data.error);
      console.log('   Details:', JSON.stringify(test25.data.details, null, 2));
      
      // Try port 465 with SSL
      console.log('\n2️⃣ Trying SMTP Port 465 with SSL...');
      const smtp465 = {
        smtp: {
          enabled: true,
          host: 'travelmanagerpro.com',
          port: 465,
          secure: true,
          username: 'app@travelmanagerpro.com',
          password: 'Ip@warming#123',
          fromName: 'Travel Manager Pro'
        }
      };

      await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`, 'PUT', smtp465);
      const test465 = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}/test-smtp`, 'POST');
      
      if (test465.data.success) {
        console.log('   ✅ SMTP Port 465 WORKS!');
      } else {
        console.log('   ❌ Port 465 Failed');
        console.log('   Error:', test465.data.error);
        
        // Try port 587
        console.log('\n3️⃣ Trying SMTP Port 587...');
        const smtp587 = {
          smtp: {
            enabled: true,
            host: 'travelmanagerpro.com',
            port: 587,
            secure: false,
            username: 'app@travelmanagerpro.com',
            password: 'Ip@warming#123',
            fromName: 'Travel Manager Pro'
          }
        };

        await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`, 'PUT', smtp587);
        const test587 = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}/test-smtp`, 'POST');
        
        if (test587.data.success) {
          console.log('   ✅ SMTP Port 587 WORKS!');
        } else {
          console.log('   ❌ Port 587 Failed');
          console.log('   Error:', test587.data.error);
        }
      }
    }

    // Test IMAP alternatives
    console.log('\n4️⃣ Testing IMAP Port 143 (non-SSL)...');
    const imap143 = {
      imap: {
        enabled: true,
        host: 'travelmanagerpro.com',
        port: 143,
        secure: false,
        username: 'app@travelmanagerpro.com',
        password: 'Ip@warming#123'
      }
    };

    await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`, 'PUT', imap143);
    const testImap143 = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}/test-imap`, 'POST');
    
    if (testImap143.data.success) {
      console.log('   ✅ IMAP Port 143 WORKS!');
    } else {
      console.log('   ❌ Port 143 Failed (keeping port 993)');
      console.log('   Error:', testImap143.data.error);
      
      // Revert to 993
      const imap993 = {
        imap: {
          enabled: true,
          host: 'travelmanagerpro.com',
          port: 993,
          secure: true,
          username: 'app@travelmanagerpro.com',
          password: 'Ip@warming#123'
        }
      };
      await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`, 'PUT', imap993);
    }

    // Final status
    console.log('\n' + '='.repeat(60));
    console.log('📧 Final Configuration:');
    const final = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`);
    
    console.log(`\n   Email: ${final.data.data.email}`);
    console.log(`   IMAP: ${final.data.data.imap.host}:${final.data.data.imap.port} (${final.data.data.imap.lastTestStatus})`);
    console.log(`   SMTP: ${final.data.data.smtp.host}:${final.data.data.smtp.port} (${final.data.data.smtp.lastTestStatus})`);
    
    if (final.data.data.smtp.lastTestError) {
      console.log(`\n   SMTP Error Details: ${final.data.data.smtp.lastTestError}`);
    }

    console.log('\n='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n💡 Next: Refresh UI at http://localhost:5174/settings/email-accounts');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testCorrectPorts();
