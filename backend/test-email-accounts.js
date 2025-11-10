/**
 * Test Email Accounts API
 * 
 * This script tests the email accounts API endpoints
 * Run with: node test-email-accounts.js
 */

const API_BASE = 'http://localhost:5000/api/v1';

// You need to replace this with your actual JWT token
// Get it from: localStorage.getItem('token') in browser console
const TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testEmailAccountsAPI() {
  console.log('🧪 Testing Email Accounts API...\n');
  
  try {
    // Test 1: Get all email accounts
    console.log('1️⃣ Testing GET /email-accounts');
    const response = await fetch(`${API_BASE}/email-accounts`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed:', response.status, response.statusText);
      const errorData = await response.json();
      console.error('Error details:', errorData);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log(`\nFound ${data.count || 0} email accounts`);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📧 Email Accounts:');
      data.data.forEach((account, index) => {
        console.log(`\n${index + 1}. ${account.accountName}`);
        console.log(`   Email: ${account.email}`);
        console.log(`   Provider: ${account.provider}`);
        console.log(`   Primary: ${account.isPrimary ? 'Yes' : 'No'}`);
        console.log(`   IMAP Status: ${account.imap?.lastTestStatus || 'not tested'}`);
        console.log(`   SMTP Status: ${account.smtp?.lastTestStatus || 'not tested'}`);
      });
    }
    
    // Test 2: Create a test email account
    console.log('\n\n2️⃣ Testing POST /email-accounts (Creating test account)');
    const createResponse = await fetch(`${API_BASE}/email-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountName: 'Test SMTP Account',
        email: 'test@example.com',
        provider: 'smtp',
        purpose: 'general',
        imap: {
          enabled: true,
          host: 'imap.example.com',
          port: 993,
          secure: true,
          username: 'test@example.com',
          password: 'testpassword123'
        },
        smtp: {
          enabled: true,
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          username: 'test@example.com',
          password: 'testpassword123',
          fromName: 'Test Sender'
        }
      })
    });
    
    if (!createResponse.ok) {
      console.error('❌ Failed:', createResponse.status, createResponse.statusText);
      const errorData = await createResponse.json();
      console.error('Error details:', errorData);
    } else {
      const createData = await createResponse.json();
      console.log('✅ Account created successfully!');
      console.log('Created account:', JSON.stringify(createData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Instructions
console.log('📧 Email Accounts API Test Script\n');
console.log('⚠️  SETUP REQUIRED:');
console.log('1. Make sure backend is running (npm run dev)');
console.log('2. Login to the frontend and get your JWT token:');
console.log('   - Open browser console (F12)');
console.log('   - Run: localStorage.getItem(\'token\')');
console.log('   - Copy the token value');
console.log('3. Replace TOKEN variable in this script with your token');
console.log('4. Run: node test-email-accounts.js\n');

if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.error('❌ Please set your JWT token first!');
  console.log('\nTo get your token:');
  console.log('1. Login to http://localhost:5174');
  console.log('2. Open browser console (F12)');
  console.log('3. Run: localStorage.getItem(\'token\')');
  console.log('4. Copy the token and replace TOKEN variable in this script');
  process.exit(1);
}

testEmailAccountsAPI();
