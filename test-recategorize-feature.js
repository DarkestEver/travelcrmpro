const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

let authToken = '';
let testEmailId = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    authToken = response.data.token;
    console.log('✅ Logged in successfully');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSearchByEmail(emailAddress) {
  try {
    const response = await axios.get(`${BASE_URL}/emails/search-by-email`, {
      params: { email: emailAddress },
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`\n✅ Search by email successful`);
    console.log(`   Found ${response.data.count} emails from ${emailAddress}`);
    response.data.data.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email.subject} (${email.category}) - ${new Date(email.receivedDate).toLocaleDateString()}`);
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Search by email failed:', error.response?.data || error.message);
    return [];
  }
}

async function testUpdateCategory(emailId, category, parentQueryId = null) {
  try {
    const payload = { category };
    if (parentQueryId) {
      payload.parentQueryId = parentQueryId;
      payload.isDuplicate = true;
    }
    
    const response = await axios.patch(
      `${BASE_URL}/emails/${emailId}/category`,
      payload,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(`\n✅ Update category successful`);
    console.log(`   Email: ${response.data.data.subject}`);
    console.log(`   New Category: ${response.data.data.category}`);
    if (parentQueryId) {
      console.log(`   Linked to Parent: ${parentQueryId}`);
      console.log(`   Is Duplicate: ${response.data.data.isDuplicate}`);
    }
    return response.data.data;
  } catch (error) {
    console.error('❌ Update category failed:', error.response?.data || error.message);
    return null;
  }
}

async function getAllEmails() {
  try {
    const response = await axios.get(`${BASE_URL}/emails`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 10 }
    });
    console.log(`\n✅ Retrieved ${response.data.data.length} emails`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Get emails failed:', error.response?.data || error.message);
    return [];
  }
}

async function runTests() {
  console.log('🧪 Testing Re-categorize Feature\n');
  console.log('=================================\n');

  // Step 1: Login
  console.log('Step 1: Authenticating...');
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Tests aborted - login failed');
    return;
  }

  // Step 2: Get all emails
  console.log('\nStep 2: Fetching emails...');
  const emails = await getAllEmails();
  if (emails.length === 0) {
    console.log('\n⚠️  No emails found in database. Please create some test emails first.');
    return;
  }

  // Step 3: Test search by email
  console.log('\nStep 3: Testing search by email...');
  const firstEmail = emails[0];
  const senderEmail = firstEmail.from.email;
  console.log(`   Searching for emails from: ${senderEmail}`);
  const searchResults = await testSearchByEmail(senderEmail);

  // Step 4: Test simple re-categorization
  console.log('\nStep 4: Testing simple re-categorization...');
  if (emails.length > 0) {
    const emailToUpdate = emails[0];
    console.log(`   Re-categorizing email: ${emailToUpdate.subject}`);
    const newCategory = emailToUpdate.category === 'CUSTOMER' ? 'SUPPLIER' : 'CUSTOMER';
    await testUpdateCategory(emailToUpdate._id, newCategory);
  }

  // Step 5: Test linking to parent query
  console.log('\nStep 5: Testing link to parent query...');
  if (searchResults.length >= 2) {
    const parentEmail = searchResults[0];
    const childEmail = searchResults[1];
    console.log(`   Linking "${childEmail.subject}" to parent "${parentEmail.subject}"`);
    await testUpdateCategory(childEmail._id, childEmail.category, parentEmail._id);
  } else {
    console.log('   ⚠️  Need at least 2 emails from same sender to test linking');
  }

  console.log('\n=================================');
  console.log('✅ Tests completed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
