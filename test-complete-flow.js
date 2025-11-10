const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

// Use token directly if provided, otherwise login
const DIRECT_TOKEN = process.argv[2];
const USER_DATA = {
  tenantId: '690ce6d206c104addbfedb65',
  email: 'operator@travelcrm.com',
  role: 'operator'
};

// Login credentials (if token not provided)
const LOGIN_CREDENTIALS = {
  email: 'operator@travelcrm.com',
  password: 'operator123'
};

function makeRequest(url, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
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

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Email Account Flow\n');
  console.log('='.repeat(60));

  let token = DIRECT_TOKEN;
  let user = USER_DATA;

  try {
    // Step 1: Login (if token not provided)
    if (!token) {
      console.log('\n1️⃣ Logging in...');
      console.log(`   Email: ${LOGIN_CREDENTIALS.email}`);
      const loginResult = await makeRequest(`${API_BASE}/auth/login`, 'POST', LOGIN_CREDENTIALS);
      
      if (loginResult.status !== 200 || !loginResult.data.success) {
        console.error('❌ Login failed:', loginResult.status, loginResult.data);
        return;
      }
      
      token = loginResult.data.token;
      user = loginResult.data.user;
      
      console.log('✅ Login successful!');
      console.log(`   User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Tenant: ${user.tenantId}`);
    } else {
      console.log('\n1️⃣ Using provided token...');
      console.log(`   User: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Tenant: ${user.tenantId}`);
    }
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Fetch existing accounts
    console.log('\n2️⃣ Fetching existing email accounts...');
    const getResult = await makeRequest(`${API_BASE}/email-accounts`, 'GET', null, token);
    
    if (getResult.status !== 200) {
      console.error('❌ Fetch failed:', getResult.status, getResult.data);
      return;
    }
    
    console.log('✅ Fetch successful!');
    console.log(`   Total accounts: ${getResult.data.count}`);
    if (getResult.data.count > 0) {
      console.log('   Existing accounts:');
      getResult.data.data.forEach((acc, i) => {
        console.log(`   ${i + 1}. ${acc.accountName} (${acc.email}) - Primary: ${acc.isPrimary}`);
      });
    }

    // Step 3: Add new account
    console.log('\n3️⃣ Adding new email account...');
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

    const createResult = await makeRequest(`${API_BASE}/email-accounts`, 'POST', newAccount, token);
    
    if (createResult.status === 400 && createResult.data.message?.includes('already exists')) {
      console.log('ℹ️  Account already exists!');
      console.log('   Message:', createResult.data.message);
    } else if (createResult.status !== 201 && createResult.status !== 200) {
      console.error('❌ Create failed:', createResult.status);
      console.error('   Error:', JSON.stringify(createResult.data, null, 2));
      return;
    } else {
      console.log('✅ Account created successfully!');
      console.log('   Account ID:', createResult.data.data._id);
      console.log('   Account Name:', createResult.data.data.accountName);
      console.log('   Email:', createResult.data.data.email);
      console.log('   Primary:', createResult.data.data.isPrimary);
    }

    // Step 4: Fetch accounts again to verify
    console.log('\n4️⃣ Fetching accounts again to verify...');
    const verifyResult = await makeRequest(`${API_BASE}/email-accounts`, 'GET', null, token);
    
    console.log('✅ Verification fetch successful!');
    console.log(`   Total accounts: ${verifyResult.data.count}`);
    
    if (verifyResult.data.data && verifyResult.data.data.length > 0) {
      console.log('\n📧 All Email Accounts:');
      console.log('-'.repeat(60));
      verifyResult.data.data.forEach((account, index) => {
        console.log(`\n${index + 1}. ${account.accountName}`);
        console.log(`   Email: ${account.email}`);
        console.log(`   Provider: ${account.provider}`);
        console.log(`   Primary: ${account.isPrimary ? '⭐ Yes' : 'No'}`);
        console.log(`   Active: ${account.isActive ? '✅' : '❌'}`);
        console.log(`   IMAP Status: ${account.imap?.lastTestStatus || 'not tested'}`);
        console.log(`   SMTP Status: ${account.smtp?.lastTestStatus || 'not tested'}`);
        console.log(`   ID: ${account._id}`);
      });

      // Find the account we just created/verified
      const targetAccount = verifyResult.data.data.find(acc => 
        acc.email === 'app@travelmanagerpro.com'
      );

      if (!targetAccount) {
        console.warn('\n⚠️  Could not find the created account!');
        console.log('This suggests a tenant mismatch or database issue.');
        return;
      }

      const accountId = targetAccount._id;

      // Step 5: Test IMAP connection
      console.log('\n5️⃣ Testing IMAP connection...');
      console.log(`   Host: ${targetAccount.imap.host}:${targetAccount.imap.port}`);
      console.log(`   Secure: ${targetAccount.imap.secure}`);
      console.log('   Testing... (timeout: 10s)');
      
      const imapResult = await makeRequest(
        `${API_BASE}/email-accounts/${accountId}/test-imap`, 
        'POST', 
        null, 
        token
      );
      
      if (imapResult.data.success) {
        console.log('✅ IMAP test PASSED!');
        console.log('   Message:', imapResult.data.message);
      } else {
        console.log('❌ IMAP test FAILED!');
        console.log('   Error:', imapResult.data.error);
        console.log('\n   Common issues:');
        console.log('   - IMAP not enabled on email server');
        console.log('   - Wrong port (try 143 for non-SSL)');
        console.log('   - Firewall blocking connection');
        console.log('   - Invalid credentials');
      }

      // Step 6: Test SMTP connection
      console.log('\n6️⃣ Testing SMTP connection...');
      console.log(`   Host: ${targetAccount.smtp.host}:${targetAccount.smtp.port}`);
      console.log(`   Secure: ${targetAccount.smtp.secure}`);
      console.log('   Testing... (timeout: 10s)');
      
      const smtpResult = await makeRequest(
        `${API_BASE}/email-accounts/${accountId}/test-smtp`, 
        'POST', 
        null, 
        token
      );
      
      if (smtpResult.data.success) {
        console.log('✅ SMTP test PASSED!');
        console.log('   Message:', smtpResult.data.message);
      } else {
        console.log('❌ SMTP test FAILED!');
        console.log('   Error:', smtpResult.data.error);
        console.log('\n   Common issues:');
        console.log('   - SMTP authentication required');
        console.log('   - Wrong port or secure setting');
        console.log('   - Firewall blocking connection');
        console.log('   - Invalid credentials');
      }

      // Step 7: Fetch final state
      console.log('\n7️⃣ Fetching final account state...');
      const finalResult = await makeRequest(`${API_BASE}/email-accounts`, 'GET', null, token);
      const finalAccount = finalResult.data.data.find(acc => acc._id === accountId);
      
      console.log('✅ Final account state:');
      console.log(`   IMAP Status: ${finalAccount.imap?.lastTestStatus || 'not tested'}`);
      console.log(`   SMTP Status: ${finalAccount.smtp?.lastTestStatus || 'not tested'}`);
      if (finalAccount.imap?.lastTestedAt) {
        console.log(`   Last IMAP Test: ${new Date(finalAccount.imap.lastTestedAt).toLocaleString()}`);
      }
      if (finalAccount.smtp?.lastTestedAt) {
        console.log(`   Last SMTP Test: ${new Date(finalAccount.smtp.lastTestedAt).toLocaleString()}`);
      }

    } else {
      console.warn('\n⚠️  No accounts found after creation!');
      console.log('This suggests a tenant mismatch or database issue.');
      console.log('\nPossible causes:');
      console.log('- Token tenant ID doesn\'t match account tenant ID');
      console.log('- Database connection issue');
      console.log('- Account created but not committed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n💡 Next steps:');
    console.log('1. Open http://localhost:5174/settings/email-accounts');
    console.log('2. Refresh the page');
    console.log('3. You should see the account in the UI');
    console.log('4. Connection status should be updated');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testCompleteFlow();
