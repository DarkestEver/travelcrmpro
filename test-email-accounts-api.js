const https = require('https');
const http = require('http');

// NOTE: You need to get your JWT token first
// Login at http://localhost:5174 and get token from localStorage
const JWT_TOKEN = process.argv[2] || 'YOUR_JWT_TOKEN_HERE';

if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('❌ Please provide JWT token as argument');
  console.log('');
  console.log('To get your token:');
  console.log('1. Login at http://localhost:5174');
  console.log('2. Open browser console (F12)');
  console.log('3. Run: localStorage.getItem("token")');
  console.log('4. Copy the token');
  console.log('');
  console.log('Usage: node test-email-accounts-api.js YOUR_TOKEN');
  process.exit(1);
}

const API_BASE = 'http://localhost:5000/api/v1';

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEmailAccounts() {
  console.log('🧪 Testing Email Accounts API...\n');

  try {
    // Step 1: Fetch existing accounts
    console.log('1️⃣ Fetching existing email accounts...');
    const getResult = await makeRequest(`${API_BASE}/email-accounts`);
    
    if (getResult.status !== 200) {
      console.error('❌ Fetch failed:', getResult.status, getResult.data);
      return;
    }
    
    console.log('✅ Current accounts:', JSON.stringify(getResult.data, null, 2));
    console.log(`📊 Total: ${getResult.data.count} accounts\n`);

    // Step 2: Add new account
    console.log('2️⃣ Adding new email account...');
    const newAccount = {
      accountName: 'Travel Manager Pro Email',
      email: 'app@travelmanagerpro.com',
      provider: 'smtp',
      purpose: 'general',
      isPrimary: true,
      imap: {
        enabled: true,
        host: 'travelmanagerpro.com',
        port: 993,
        secure: true,
        username: 'app@travelmanagerpro.com',
        password: 'Ip@warming#123'
      },
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

    const createResult = await makeRequest(`${API_BASE}/email-accounts`, 'POST', newAccount);
    
    if (createResult.status !== 201 && createResult.status !== 200) {
      console.error('❌ Create failed:', createResult.status, createResult.data);
      if (createResult.data.message?.includes('already exists')) {
        console.log('ℹ️  Account already exists, continuing to test...\n');
      } else {
        return;
      }
    } else {
      console.log('✅ Account created successfully!');
      console.log('📦 Created account:', JSON.stringify(createResult.data, null, 2));
      console.log('');
    }

    // Step 3: Fetch accounts again
    console.log('3️⃣ Fetching accounts again to verify...');
    const verifyResult = await makeRequest(`${API_BASE}/email-accounts`);
    
    console.log('✅ Updated accounts:', JSON.stringify(verifyResult.data, null, 2));
    console.log(`📊 Total: ${verifyResult.data.count} accounts\n`);

    if (verifyResult.data.data && verifyResult.data.data.length > 0) {
      console.log('📧 Email Accounts Found:');
      verifyResult.data.data.forEach((account, index) => {
        console.log(`\n${index + 1}. ${account.accountName}`);
        console.log(`   Email: ${account.email}`);
        console.log(`   Provider: ${account.provider}`);
        console.log(`   Primary: ${account.isPrimary ? '⭐ Yes' : 'No'}`);
        console.log(`   IMAP Status: ${account.imap?.lastTestStatus || 'not tested'}`);
        console.log(`   SMTP Status: ${account.smtp?.lastTestStatus || 'not tested'}`);
        console.log(`   ID: ${account._id}`);
      });

      // Step 4: Test IMAP connection
      const accountId = verifyResult.data.data[0]._id;
      console.log('\n4️⃣ Testing IMAP connection...');
      const imapResult = await makeRequest(`${API_BASE}/email-accounts/${accountId}/test-imap`, 'POST');
      
      console.log(imapResult.data.success ? '✅ IMAP test passed!' : '❌ IMAP test failed!');
      console.log('IMAP result:', JSON.stringify(imapResult.data, null, 2));

      // Step 5: Test SMTP connection
      console.log('\n5️⃣ Testing SMTP connection...');
      const smtpResult = await makeRequest(`${API_BASE}/email-accounts/${accountId}/test-smtp`, 'POST');
      
      console.log(smtpResult.data.success ? '✅ SMTP test passed!' : '❌ SMTP test failed!');
      console.log('SMTP result:', JSON.stringify(smtpResult.data, null, 2));

    } else {
      console.warn('⚠️  No accounts found after creation!');
      console.log('This suggests a tenant mismatch or database issue.');
    }

    console.log('\n✅ Test complete!');
    console.log('💡 Refresh the UI at http://localhost:5174/settings/email-accounts to see the account');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEmailAccounts();
