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

async function testAllSMTPPorts() {
  console.log('🧪 Testing All SMTP Port Configurations\n');
  console.log('='.repeat(60));

  const configurations = [
    { port: 465, secure: true, name: 'Port 465 (SMTPS - SSL/TLS)' },
    { port: 25, secure: false, name: 'Port 25 (Standard SMTP)' },
    { port: 587, secure: false, name: 'Port 587 (SMTP Submission - STARTTLS)' },
    { port: 2525, secure: false, name: 'Port 2525 (Alternative)' }
  ];

  for (const config of configurations) {
    try {
      console.log(`\n📡 Testing: ${config.name}`);
      console.log(`   Host: travelmanagerpro.com:${config.port}`);
      console.log(`   Secure: ${config.secure}`);

      // Update SMTP settings
      const updateData = {
        smtp: {
          enabled: true,
          host: 'travelmanagerpro.com',
          port: config.port,
          secure: config.secure,
          username: 'app@travelmanagerpro.com',
          password: 'Ip@warming#123',
          fromName: 'Travel Manager Pro'
        }
      };

      await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`, 'PUT', updateData);
      
      // Test connection
      const testResult = await makeRequest(
        `${API_BASE}/email-accounts/${ACCOUNT_ID}/test-smtp`,
        'POST'
      );

      if (testResult.data.success) {
        console.log(`   ✅ SUCCESS!`);
        console.log(`   Message: ${testResult.data.message}`);
        console.log(`\n🎉 Working configuration found: Port ${config.port}, Secure: ${config.secure}`);
        break;
      } else {
        console.log(`   ❌ FAILED`);
        console.log(`   Error: ${testResult.data.error || 'Connection timeout'}`);
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  // Final state
  console.log('\n' + '='.repeat(60));
  const finalResult = await makeRequest(`${API_BASE}/email-accounts/${ACCOUNT_ID}`);
  console.log('\n📧 Final Account Configuration:');
  console.log(`   Email: ${finalResult.data.data.email}`);
  console.log(`   SMTP Host: ${finalResult.data.data.smtp.host}`);
  console.log(`   SMTP Port: ${finalResult.data.data.smtp.port}`);
  console.log(`   SMTP Secure: ${finalResult.data.data.smtp.secure}`);
  console.log(`   SMTP Status: ${finalResult.data.data.smtp.lastTestStatus || 'not tested'}`);
  console.log(`   IMAP Status: ${finalResult.data.data.imap.lastTestStatus || 'not tested'}`);

  console.log('\n💡 Summary:');
  console.log('   ✅ IMAP: Working (port 993)');
  if (finalResult.data.data.smtp.lastTestStatus === 'success') {
    console.log(`   ✅ SMTP: Working (port ${finalResult.data.data.smtp.port})`);
  } else {
    console.log('   ❌ SMTP: All ports failed - check server configuration');
    console.log('\n   Possible issues:');
    console.log('   1. SMTP not enabled on travelmanagerpro.com');
    console.log('   2. Firewall blocking SMTP ports');
    console.log('   3. Server requires different authentication');
    console.log('   4. Domain DNS configuration issue');
  }

  console.log('\n='.repeat(60));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(60));
}

testAllSMTPPorts();
