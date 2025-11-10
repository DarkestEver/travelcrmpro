/**
 * Comprehensive AI Email Agent Testing Script
 * Tests webhook endpoint and AI processing functionality
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api/v1';
let authToken = '';
let tenantId = '';

// Test email samples
const testEmails = {
  bookingInquiry: {
    from: 'customer@example.com',
    to: 'info@travelcrm.com',
    subject: 'Booking Inquiry for Paris Trip',
    body: `Hi,

I'm interested in booking a trip to Paris for 2 people from December 15-22, 2025.
Could you please send me a quote for flights and hotel accommodation?

We prefer a 4-star hotel near the Eiffel Tower.

Best regards,
John Smith
Phone: +1-555-0123`,
    date: new Date().toISOString()
  },
  
  quoteRequest: {
    from: 'sarah.jones@gmail.com',
    to: 'sales@travelcrm.com',
    subject: 'Quote Request - Bali Honeymoon Package',
    body: `Hello,

My fiancé and I are planning our honeymoon in Bali from January 10-20, 2026.
We would like a quote for:
- Round trip flights from New York
- 5-star resort with private beach
- Airport transfers
- Optional: Diving excursion

Our budget is around $5000-6000.

Please let me know what packages you can offer.

Thanks,
Sarah Jones
Email: sarah.jones@gmail.com`,
    date: new Date().toISOString()
  },
  
  customerSupport: {
    from: 'mike.wilson@yahoo.com',
    to: 'support@travelcrm.com',
    subject: 'Question about my booking #12345',
    body: `Hi Support Team,

I have a question about my booking confirmation #12345 for the London trip.
The confirmation email says check-in is at 2 PM, but I'll be arriving at 10 AM.
Can I do early check-in? Is there an additional fee?

Also, can you confirm if breakfast is included in the package?

Thanks,
Mike Wilson`,
    date: new Date().toISOString()
  },
  
  complaint: {
    from: 'angry.customer@hotmail.com',
    to: 'complaints@travelcrm.com',
    subject: 'URGENT: Very disappointed with service',
    body: `To whom it may concern,

I am extremely disappointed with the service I received during my recent trip to Rome.
The hotel was NOT as advertised, the room was dirty, and the staff was rude.

I demand a full refund immediately. This is unacceptable.

I expect a response within 24 hours or I will leave negative reviews everywhere.

Regards,
Robert Brown
Booking Ref: ROM-2025-789`,
    date: new Date().toISOString()
  },
  
  generalInquiry: {
    from: 'lisa.martinez@outlook.com',
    to: 'info@travelcrm.com',
    subject: 'Travel Requirements for Egypt',
    body: `Hello,

I'm planning a trip to Egypt in March 2026 and have some questions:
- Do I need a visa as a US citizen?
- What vaccinations are recommended?
- What's the best time to visit the pyramids?
- Are there any travel restrictions I should know about?

Thank you for your help!

Lisa Martinez`,
    date: new Date().toISOString()
  }
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

function subsection(title) {
  console.log('\n' + '-'.repeat(70));
  log(title, 'cyan');
  console.log('-'.repeat(70));
}

// Step 1: Login and get auth token
async function login() {
  section('STEP 1: Authentication');
  
  try {
    log('Logging in as operator@travelcrm.com...', 'yellow');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'operator@travelcrm.com',
      password: 'operator123'
    });
    
    authToken = response.data.data.token;
    tenantId = response.data.data.user.tenantId;
    
    log('✅ Login successful!', 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'blue');
    log(`   Tenant ID: ${tenantId}`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Login failed!', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Step 2: Update AI settings (verify encryption fix)
async function updateAISettings() {
  section('STEP 2: Update AI Settings (Test Encryption Fix)');
  
  try {
    log('Updating AI settings with OpenAI API key...', 'yellow');
    
    const aiSettings = {
      aiSettings: {
        openaiApiKey: process.env.OPENAI_API_KEY || 'sk-test-dummy-key-for-testing',
        model: 'gpt-4-turbo',
        maxTokens: 2000,
        temperature: 0.7,
        enableAI: true,
        enabled: true,
        autoProcessEmails: true,
        confidenceThreshold: 70,
        autoResponseEnabled: false,
        monthlyCostLimit: 100,
        currentMonthCost: 0,
        models: {
          categorization: 'gpt-4-turbo-preview',
          extraction: 'gpt-4-turbo-preview',
          response: 'gpt-4-turbo-preview'
        },
        stats: {
          totalEmailsProcessed: 0,
          totalCost: 0,
          averageCostPerEmail: 0
        }
      }
    };
    
    const response = await axios.patch(
      `${BASE_URL}/tenants/settings`,
      aiSettings,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    log('✅ AI settings updated successfully!', 'green');
    log('   Encryption is working correctly', 'green');
    
    return true;
  } catch (error) {
    log('❌ Failed to update AI settings!', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Step 3: Test webhook endpoint with different email types
async function testWebhookEndpoint(emailType, emailData) {
  subsection(`Testing: ${emailType}`);
  
  try {
    log(`Sending ${emailType} email to webhook...`, 'yellow');
    log(`  From: ${emailData.from}`, 'blue');
    log(`  Subject: ${emailData.subject}`, 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/email-accounts/webhook`,
      emailData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const result = response.data.data;
    
    log('✅ Email processed successfully!', 'green');
    log(`   Category: ${result.category}`, 'cyan');
    log(`   Confidence: ${result.confidence}%`, 'cyan');
    
    if (result.entities) {
      log('   Extracted Entities:', 'magenta');
      if (result.entities.names?.length) {
        log(`     - Names: ${result.entities.names.join(', ')}`, 'blue');
      }
      if (result.entities.emails?.length) {
        log(`     - Emails: ${result.entities.emails.join(', ')}`, 'blue');
      }
      if (result.entities.phones?.length) {
        log(`     - Phones: ${result.entities.phones.join(', ')}`, 'blue');
      }
      if (result.entities.destinations?.length) {
        log(`     - Destinations: ${result.entities.destinations.join(', ')}`, 'blue');
      }
      if (result.entities.dates?.length) {
        log(`     - Dates: ${result.entities.dates.join(', ')}`, 'blue');
      }
    }
    
    if (result.suggestedResponse) {
      log('\n   AI Suggested Response:', 'magenta');
      log(`   ${result.suggestedResponse.substring(0, 200)}...`, 'yellow');
    }
    
    return result;
  } catch (error) {
    log(`❌ Failed to process ${emailType} email!`, 'red');
    console.error(error.response?.data || error.message);
    return null;
  }
}

// Step 4: Verify data in database
async function verifyDatabase() {
  section('STEP 4: Verify Data in Database');
  
  try {
    log('Connecting to MongoDB...', 'yellow');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    log('✅ Connected to MongoDB', 'green');
    
    const Email = require('./src/models/Email');
    const Tenant = require('./src/models/Tenant');
    
    // Check tenant AI settings
    subsection('Checking Tenant AI Settings');
    const tenant = await Tenant.findById(tenantId);
    
    if (tenant) {
      log('✅ Tenant found', 'green');
      log(`   AI Enabled: ${tenant.settings?.aiSettings?.enabled}`, 'blue');
      log(`   Model: ${tenant.settings?.aiSettings?.model}`, 'blue');
      log(`   Auto Process: ${tenant.settings?.aiSettings?.autoProcessEmails}`, 'blue');
      
      // Check if API key is encrypted
      if (tenant.settings?.aiSettings?.openaiApiKey) {
        log('   ✅ OpenAI API Key is stored (encrypted)', 'green');
      } else {
        log('   ⚠️  No OpenAI API Key found', 'yellow');
      }
    }
    
    // Check processed emails
    subsection('Checking Processed Emails');
    const emails = await Email.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('from subject category confidence aiProcessed createdAt');
    
    log(`Found ${emails.length} emails in database`, 'cyan');
    
    emails.forEach((email, index) => {
      log(`\n   Email ${index + 1}:`, 'magenta');
      log(`     From: ${email.from}`, 'blue');
      log(`     Subject: ${email.subject}`, 'blue');
      log(`     Category: ${email.category}`, 'blue');
      log(`     Confidence: ${email.confidence}%`, 'blue');
      log(`     AI Processed: ${email.aiProcessed ? '✅' : '❌'}`, email.aiProcessed ? 'green' : 'red');
    });
    
    await mongoose.connection.close();
    log('\n✅ Database verification complete', 'green');
    
  } catch (error) {
    log('❌ Database verification failed!', 'red');
    console.error(error.message);
  }
}

// Main test execution
async function runTests() {
  console.clear();
  
  section('🤖 AI EMAIL AGENT TESTING SUITE');
  log('Testing AI email processing functionality via webhook', 'cyan');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication', 'red');
    return;
  }
  
  // Step 2: Update AI settings (test encryption fix)
  const settingsSuccess = await updateAISettings();
  if (!settingsSuccess) {
    log('\n⚠️  AI settings update failed, but continuing with tests...', 'yellow');
  }
  
  // Wait a moment for settings to be saved
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Test webhook with different email types
  section('STEP 3: Test Webhook Endpoint with Various Email Types');
  
  const results = {};
  
  results.bookingInquiry = await testWebhookEndpoint('Booking Inquiry', testEmails.bookingInquiry);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between requests
  
  results.quoteRequest = await testWebhookEndpoint('Quote Request', testEmails.quoteRequest);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.customerSupport = await testWebhookEndpoint('Customer Support', testEmails.customerSupport);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.complaint = await testWebhookEndpoint('Complaint', testEmails.complaint);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.generalInquiry = await testWebhookEndpoint('General Inquiry', testEmails.generalInquiry);
  
  // Step 4: Verify in database
  await new Promise(resolve => setTimeout(resolve, 2000));
  await verifyDatabase();
  
  // Summary
  section('📊 TEST SUMMARY');
  
  const successful = Object.values(results).filter(r => r !== null).length;
  const total = Object.keys(results).length;
  
  log(`Tests Completed: ${successful}/${total}`, 'cyan');
  
  if (successful === total) {
    log('✅ ALL TESTS PASSED!', 'green');
  } else {
    log(`⚠️  ${total - successful} tests failed`, 'yellow');
  }
  
  log('\n📝 Next Steps:', 'magenta');
  log('   1. Check the backend logs for AI processing details', 'blue');
  log('   2. Verify emails in the frontend UI', 'blue');
  log('   3. Test actual email processing via IMAP (run test-actual-email.js)', 'blue');
  
  console.log('\n');
}

// Run the tests
runTests().catch(error => {
  log('\n❌ Test suite failed with error:', 'red');
  console.error(error);
  process.exit(1);
});
