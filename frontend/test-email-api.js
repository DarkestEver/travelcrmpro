/**
 * Quick Test: Add and Fetch Email Account
 * Run this in browser console on http://localhost:5174
 */

(async function testEmailAccount() {
  console.log('🧪 Testing Email Accounts API...\n');
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No token found! Please login first.');
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('👤 Logged in as:', user.email);
  console.log('🏢 Tenant ID:', user.tenantId);
  console.log('👔 Role:', user.role);
  console.log('---\n');
  
  const API_BASE = 'http://localhost:5000/api/v1';
  
  try {
    // Step 1: Fetch existing accounts
    console.log('1️⃣ Fetching existing email accounts...');
    const getResponse = await fetch(`${API_BASE}/email-accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const error = await getResponse.json();
      console.error('❌ Fetch failed:', getResponse.status, error);
      return;
    }
    
    const existingAccounts = await getResponse.json();
    console.log('✅ Current accounts:', existingAccounts);
    console.log(`📊 Total: ${existingAccounts.count} accounts\n`);
    
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
    
    console.log('📤 Sending data:', newAccount);
    
    const createResponse = await fetch(`${API_BASE}/email-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAccount)
    });
    
    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('❌ Create failed:', createResponse.status, createData);
      if (createData.message?.includes('already exists')) {
        console.log('ℹ️  Account already exists, continuing to test...');
      } else {
        return;
      }
    } else {
      console.log('✅ Account created successfully!');
      console.log('📦 Created account:', createData);
    }
    
    console.log('---\n');
    
    // Step 3: Fetch accounts again
    console.log('3️⃣ Fetching accounts again to verify...');
    const verifyResponse = await fetch(`${API_BASE}/email-accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const verifyData = await verifyResponse.json();
    console.log('✅ Updated accounts:', verifyData);
    console.log(`📊 Total: ${verifyData.count} accounts`);
    
    if (verifyData.data && verifyData.data.length > 0) {
      console.log('\n📧 Email Accounts Found:');
      verifyData.data.forEach((account, index) => {
        console.log(`\n${index + 1}. ${account.accountName}`);
        console.log(`   Email: ${account.email}`);
        console.log(`   Provider: ${account.provider}`);
        console.log(`   Primary: ${account.isPrimary ? '⭐ Yes' : 'No'}`);
        console.log(`   IMAP: ${account.imap?.lastTestStatus || 'not tested'}`);
        console.log(`   SMTP: ${account.smtp?.lastTestStatus || 'not tested'}`);
        console.log(`   ID: ${account._id}`);
      });
      
      // Step 4: Test IMAP connection
      const accountId = verifyData.data[0]._id;
      console.log('\n4️⃣ Testing IMAP connection...');
      const imapResponse = await fetch(`${API_BASE}/email-accounts/${accountId}/test-imap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const imapResult = await imapResponse.json();
      console.log(imapResult.success ? '✅ IMAP test passed!' : '❌ IMAP test failed!');
      console.log('IMAP result:', imapResult);
      
      // Step 5: Test SMTP connection
      console.log('\n5️⃣ Testing SMTP connection...');
      const smtpResponse = await fetch(`${API_BASE}/email-accounts/${accountId}/test-smtp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const smtpResult = await smtpResponse.json();
      console.log(smtpResult.success ? '✅ SMTP test passed!' : '❌ SMTP test failed!');
      console.log('SMTP result:', smtpResult);
      
    } else {
      console.warn('⚠️  No accounts found after creation!');
      console.log('This suggests a tenant mismatch or database issue.');
    }
    
    console.log('\n✅ Test complete!');
    console.log('💡 Refresh the page to see the account in UI');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
})();
