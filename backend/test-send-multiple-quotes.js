/**
 * Test Script: Send Multiple Quotes in Single Email
 * 
 * This script tests the POST /api/v1/quotes/send-multiple endpoint
 * 
 * Prerequisites:
 * 1. At least 2-3 quotes created from the same email
 * 2. Quotes should be in 'draft' status
 * 3. All quotes must have the same customerEmail
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

// You need to replace these with actual values from your database
const config = {
  // Get this from your login
  authToken: 'YOUR_AUTH_TOKEN_HERE',
  
  // Get these from the database (EmailLog collection)
  emailId: '67137569bc51b82e755770a3', // Example email ID
  
  // Get these from the database (Quote collection)
  // These quotes should all belong to the same customer
  quoteIds: [
    '673abc123...', // Quote #1 - Paris
    '673abc456...', // Quote #2 - Bali
    '673abc789...'  // Quote #3 - Maldives
  ]
};

async function testSendMultipleQuotes() {
  try {
    console.log('\n🧪 Testing: Send Multiple Quotes in Single Email\n');
    console.log('='.repeat(60));
    
    // Step 1: Login (if needed)
    console.log('\n📝 Step 1: Login to get auth token...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'operator@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Step 2: Get all quotes to find draft quotes
    console.log('\n📝 Step 2: Fetching all quotes...');
    const quotesResponse = await axios.get(`${API_BASE}/quotes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const allQuotes = quotesResponse.data.data.quotes || quotesResponse.data.data;
    console.log(`✅ Found ${allQuotes.length} total quotes`);
    
    // Filter draft quotes
    const draftQuotes = allQuotes.filter(q => q.status === 'draft');
    console.log(`📋 Draft quotes: ${draftQuotes.length}`);
    
    if (draftQuotes.length === 0) {
      console.log('⚠️  No draft quotes found. Please create some quotes first.');
      return;
    }
    
    // Group by customer email
    const quotesByCustomer = {};
    draftQuotes.forEach(quote => {
      const email = quote.customerEmail;
      if (!quotesByCustomer[email]) {
        quotesByCustomer[email] = [];
      }
      quotesByCustomer[email].push(quote);
    });
    
    // Find customer with multiple quotes
    const customerEmails = Object.keys(quotesByCustomer);
    let selectedCustomer = null;
    let selectedQuotes = [];
    
    for (const email of customerEmails) {
      if (quotesByCustomer[email].length >= 2) {
        selectedCustomer = email;
        selectedQuotes = quotesByCustomer[email];
        break;
      }
    }
    
    if (!selectedCustomer) {
      console.log('\n⚠️  No customer with multiple draft quotes found.');
      console.log('💡 Tip: Create 2-3 quotes from the same email first.');
      console.log('\nAvailable draft quotes:');
      draftQuotes.forEach(q => {
        console.log(`  - ${q.quoteNumber}: ${q.customerEmail} - ${q.destination || 'N/A'}`);
      });
      return;
    }
    
    console.log(`\n✅ Found customer with ${selectedQuotes.length} draft quotes:`);
    console.log(`   Customer: ${selectedCustomer}`);
    selectedQuotes.forEach((q, i) => {
      console.log(`   Quote ${i + 1}: ${q.quoteNumber} - ${q.destination || 'N/A'} - ${q.pricing?.currency || 'USD'} ${q.pricing?.totalPrice || 0}`);
    });
    
    // Step 3: Send multiple quotes
    console.log('\n📝 Step 3: Sending multiple quotes in one email...');
    
    const requestPayload = {
      quoteIds: selectedQuotes.map(q => q._id),
      emailId: selectedQuotes[0].emailId || null,
      message: 'Thank you for your inquiry! We have prepared the following package options for you.'
    };
    
    console.log('\nRequest payload:');
    console.log(JSON.stringify(requestPayload, null, 2));
    
    const sendResponse = await axios.post(
      `${API_BASE}/quotes/send-multiple`,
      requestPayload,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('\n✅ SUCCESS! Quotes sent in single email');
    console.log('='.repeat(60));
    console.log('\nResponse:');
    console.log(JSON.stringify(sendResponse.data, null, 2));
    console.log('\n' + '='.repeat(60));
    
    // Step 4: Verify quotes status changed
    console.log('\n📝 Step 4: Verifying quote statuses...');
    
    for (const quote of selectedQuotes) {
      const updatedQuote = await axios.get(`${API_BASE}/quotes/${quote._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const status = updatedQuote.data.data.quote.status;
      console.log(`   ${quote.quoteNumber}: ${status} ${status === 'sent' ? '✅' : '❌'}`);
    }
    
    console.log('\n🎉 Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    console.log('\n');
  }
}

// Run the test
testSendMultipleQuotes();
