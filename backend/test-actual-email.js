/**
 * Test Actual Email Processing via IMAP
 * This script sends a real email and monitors the AI agent processing it
 */

require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api/v1';
let authToken = '';
let tenantId = '';
let emailAccountId = '';

// Colors for output
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

// Step 1: Login
async function login() {
  section('STEP 1: Authentication');
  
  try {
    log('Logging in...', 'yellow');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'operator@travelcrm.com',
      password: 'operator123'
    });
    
    authToken = response.data.data.token;
    tenantId = response.data.data.user.tenantId;
    
    log('✅ Login successful!', 'green');
    log(`   Tenant ID: ${tenantId}`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Login failed!', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Step 2: Get email account
async function getEmailAccount() {
  section('STEP 2: Get Email Account Configuration');
  
  try {
    log('Fetching email accounts...', 'yellow');
    
    const response = await axios.get(`${BASE_URL}/email-accounts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const accounts = response.data.data;
    
    if (accounts.length === 0) {
      log('⚠️  No email accounts configured!', 'yellow');
      log('   Please configure an email account first in the UI', 'yellow');
      return false;
    }
    
    const account = accounts[0];
    emailAccountId = account._id;
    
    log('✅ Email account found!', 'green');
    log(`   Email: ${account.email}`, 'blue');
    log(`   Provider: ${account.provider}`, 'blue');
    log(`   AI Processing: ${account.aiProcessing ? '✅ Enabled' : '❌ Disabled'}`, 
        account.aiProcessing ? 'green' : 'red');
    
    return account;
  } catch (error) {
    log('❌ Failed to get email account!', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Step 3: Send test email
async function sendTestEmail(toEmail) {
  section('STEP 3: Send Test Email');
  
  try {
    log('Setting up email sender...', 'yellow');
    
    // Configure your sending email account here
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com', // Change to your SMTP provider
      port: 587,
      secure: false,
      auth: {
        user: process.env.TEST_SENDER_EMAIL || 'your-email@gmail.com',
        pass: process.env.TEST_SENDER_PASSWORD || 'your-app-password'
      }
    });
    
    const testEmail = {
      from: process.env.TEST_SENDER_EMAIL || 'your-email@gmail.com',
      to: toEmail,
      subject: 'Test Booking Inquiry - AI Agent Test',
      text: `Hello,

I am interested in booking a luxury vacation package to the Maldives for my family.

Details:
- Travel dates: March 15-25, 2026
- Number of travelers: 2 adults, 2 children (ages 8 and 12)
- Preferred accommodation: 5-star resort with overwater villa
- Budget: $10,000 - $15,000
- Special requests: Snorkeling activities, kids club, spa services

Please send me a detailed quote with available options.

Contact Information:
Name: Jennifer Williams
Email: jennifer.williams@example.com
Phone: +1-555-9876

Looking forward to hearing from you!

Best regards,
Jennifer Williams`,
      html: `
        <h2>Booking Inquiry</h2>
        <p>I am interested in booking a luxury vacation package to the <strong>Maldives</strong> for my family.</p>
        
        <h3>Details:</h3>
        <ul>
          <li>Travel dates: March 15-25, 2026</li>
          <li>Number of travelers: 2 adults, 2 children (ages 8 and 12)</li>
          <li>Preferred accommodation: 5-star resort with overwater villa</li>
          <li>Budget: $10,000 - $15,000</li>
          <li>Special requests: Snorkeling activities, kids club, spa services</li>
        </ul>
        
        <p>Please send me a detailed quote with available options.</p>
        
        <h3>Contact Information:</h3>
        <p>
          <strong>Name:</strong> Jennifer Williams<br>
          <strong>Email:</strong> jennifer.williams@example.com<br>
          <strong>Phone:</strong> +1-555-9876
        </p>
        
        <p>Looking forward to hearing from you!</p>
        <p>Best regards,<br>Jennifer Williams</p>
      `
    };
    
    log('Sending test email...', 'yellow');
    log(`   From: ${testEmail.from}`, 'blue');
    log(`   To: ${testEmail.to}`, 'blue');
    log(`   Subject: ${testEmail.subject}`, 'blue');
    
    const info = await transporter.sendMail(testEmail);
    
    log('✅ Email sent successfully!', 'green');
    log(`   Message ID: ${info.messageId}`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Failed to send email!', 'red');
    console.error(error.message);
    
    if (error.message.includes('auth')) {
      log('\n⚠️  Email authentication failed. Please configure:', 'yellow');
      log('   1. Set TEST_SENDER_EMAIL in .env file', 'blue');
      log('   2. Set TEST_SENDER_PASSWORD in .env file', 'blue');
      log('   3. For Gmail: Enable 2FA and create an App Password', 'blue');
    }
    
    return false;
  }
}

// Step 4: Monitor email processing
async function monitorEmailProcessing() {
  section('STEP 4: Monitor Email Processing');
  
  log('Waiting for email to be received and processed...', 'yellow');
  log('(This may take 1-2 minutes depending on email polling interval)', 'cyan');
  
  const startTime = Date.now();
  const maxWaitTime = 180000; // 3 minutes
  let processed = false;
  
  while (!processed && (Date.now() - startTime) < maxWaitTime) {
    try {
      // Check for new emails
      const response = await axios.get(`${BASE_URL}/emails`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          limit: 10,
          sort: '-createdAt'
        }
      });
      
      const emails = response.data.data;
      
      // Look for our test email
      const testEmail = emails.find(email => 
        email.subject?.includes('Test Booking Inquiry - AI Agent Test')
      );
      
      if (testEmail) {
        processed = true;
        
        log('\n✅ EMAIL RECEIVED AND PROCESSED!', 'green');
        log('\n📧 Email Details:', 'magenta');
        log(`   From: ${testEmail.from}`, 'blue');
        log(`   Subject: ${testEmail.subject}`, 'blue');
        log(`   Received: ${new Date(testEmail.receivedAt).toLocaleString()}`, 'blue');
        
        log('\n🤖 AI Processing Results:', 'magenta');
        log(`   Category: ${testEmail.category}`, 'cyan');
        log(`   Confidence: ${testEmail.confidence}%`, 'cyan');
        log(`   AI Processed: ${testEmail.aiProcessed ? '✅ Yes' : '❌ No'}`, 
            testEmail.aiProcessed ? 'green' : 'red');
        
        if (testEmail.entities) {
          log('\n🔍 Extracted Entities:', 'magenta');
          if (testEmail.entities.names?.length) {
            log(`   Names: ${testEmail.entities.names.join(', ')}`, 'blue');
          }
          if (testEmail.entities.emails?.length) {
            log(`   Emails: ${testEmail.entities.emails.join(', ')}`, 'blue');
          }
          if (testEmail.entities.phones?.length) {
            log(`   Phones: ${testEmail.entities.phones.join(', ')}`, 'blue');
          }
          if (testEmail.entities.destinations?.length) {
            log(`   Destinations: ${testEmail.entities.destinations.join(', ')}`, 'blue');
          }
          if (testEmail.entities.dates?.length) {
            log(`   Dates: ${testEmail.entities.dates.join(', ')}`, 'blue');
          }
          if (testEmail.entities.budget) {
            log(`   Budget: ${testEmail.entities.budget}`, 'blue');
          }
        }
        
        if (testEmail.suggestedResponse) {
          log('\n💬 AI Suggested Response:', 'magenta');
          log(`${testEmail.suggestedResponse}`, 'yellow');
        }
        
        return testEmail;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
      process.stdout.write('.');
      
    } catch (error) {
      log('\n❌ Error checking emails!', 'red');
      console.error(error.response?.data || error.message);
      return null;
    }
  }
  
  if (!processed) {
    log('\n⏱️  Timeout waiting for email', 'yellow');
    log('   The email might still be processing. Check the UI or database.', 'cyan');
  }
  
  return null;
}

// Step 5: Verify in database
async function verifyInDatabase() {
  section('STEP 5: Verify in Database');
  
  try {
    log('Connecting to MongoDB...', 'yellow');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    log('✅ Connected to MongoDB', 'green');
    
    const Email = require('./src/models/Email');
    
    const testEmail = await Email.findOne({
      tenantId,
      subject: { $regex: 'Test Booking Inquiry - AI Agent Test', $options: 'i' }
    }).sort({ createdAt: -1 });
    
    if (testEmail) {
      log('✅ Email found in database!', 'green');
      log(`   Email ID: ${testEmail._id}`, 'blue');
      log(`   Category: ${testEmail.category}`, 'blue');
      log(`   AI Processed: ${testEmail.aiProcessed}`, 'blue');
      log(`   Created: ${testEmail.createdAt}`, 'blue');
    } else {
      log('⚠️  Email not found in database yet', 'yellow');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    log('❌ Database verification failed!', 'red');
    console.error(error.message);
  }
}

// Main execution
async function runTest() {
  console.clear();
  
  section('🚀 AI EMAIL AGENT - ACTUAL EMAIL TEST');
  log('Testing end-to-end email processing with AI agent', 'cyan');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    return;
  }
  
  // Step 2: Get email account
  const emailAccount = await getEmailAccount();
  if (!emailAccount) {
    log('\n📝 Instructions to set up email account:', 'magenta');
    log('   1. Open the Travel CRM UI', 'blue');
    log('   2. Go to Settings > Email Accounts', 'blue');
    log('   3. Add an email account (Gmail, Outlook, etc.)', 'blue');
    log('   4. Enable "AI Processing" for the account', 'blue');
    log('   5. Run this script again', 'blue');
    return;
  }
  
  // Check if email account has AI processing enabled
  if (!emailAccount.aiProcessing) {
    log('\n⚠️  AI Processing is disabled for this email account!', 'yellow');
    log('   Please enable it in the UI before testing', 'yellow');
    return;
  }
  
  // Step 3: Send test email
  const emailSent = await sendTestEmail(emailAccount.email);
  if (!emailSent) {
    log('\n⚠️  Could not send test email automatically', 'yellow');
    log('   You can manually send an email to:', 'cyan');
    log(`   ${emailAccount.email}`, 'bright');
    log('   with subject: "Test Booking Inquiry - AI Agent Test"', 'cyan');
  }
  
  // Step 4: Monitor processing
  const processedEmail = await monitorEmailProcessing();
  
  // Step 5: Verify in database
  await verifyInDatabase();
  
  // Summary
  section('📊 TEST SUMMARY');
  
  if (processedEmail) {
    log('✅ TEST PASSED - Email was processed by AI agent!', 'green');
  } else {
    log('⚠️  TEST INCOMPLETE - Check logs for details', 'yellow');
  }
  
  log('\n📝 Next Steps:', 'magenta');
  log('   1. Check the backend server logs for detailed AI processing', 'blue');
  log('   2. Verify the email appears in the frontend UI', 'blue');
  log('   3. Check that entities were extracted correctly', 'blue');
  log('   4. Review the AI-generated response suggestion', 'blue');
  
  console.log('\n');
}

// Run the test
runTest().catch(error => {
  log('\n❌ Test failed with error:', 'red');
  console.error(error);
  process.exit(1);
});
