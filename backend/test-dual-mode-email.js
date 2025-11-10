/**
 * Test Script: Dual-Mode Email System
 * 
 * This script helps you test both IMAP polling and webhook email reception.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';
const TENANT_ID = '66e50b97e5e59e8ab7492c42'; // Replace with your tenant ID

// Test 1: Create Email Account with IMAP Configuration
async function testCreateEmailAccount() {
  console.log('\n=== Test 1: Create Email Account ===\n');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/email-accounts`,
      {
        accountName: 'Test Gmail Account',
        email: 'test@gmail.com', // Replace with your email
        provider: 'gmail',
        
        imap: {
          enabled: true,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          username: 'test@gmail.com',
          password: 'your-app-password' // Replace with app password
        },
        
        smtp: {
          enabled: true,
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          username: 'test@gmail.com',
          password: 'your-app-password',
          fromName: 'Test CRM',
          replyTo: 'test@gmail.com'
        },
        
        autoFetch: true,
        isActive: true,
        isPrimary: true,
        purpose: 'support',
        tenantId: TENANT_ID
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log('✅ Email Account Created:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data._id;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test 2: Send Test Email via Webhook
async function testWebhookEmail() {
  console.log('\n=== Test 2: Send Email via Webhook ===\n');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/emails/webhook`,
      {
        from: {
          email: 'customer@example.com',
          name: 'John Doe'
        },
        to: [{
          email: 'sales@yourcompany.com',
          name: 'Sales Team'
        }],
        subject: 'Dubai Holiday Inquiry - Webhook Test',
        bodyText: `Hello,

I'm interested in booking a 7-day luxury holiday to Dubai for 2 adults.

Dates: December 15-22, 2025
Budget: $5,000 per person
Interests: Beach resort, city tours, desert safari

Please send me a quote.

Thanks,
John Doe`,
        bodyHtml: `<p>Hello,</p>
<p>I'm interested in booking a 7-day luxury holiday to Dubai for 2 adults.</p>
<ul>
  <li><strong>Dates:</strong> December 15-22, 2025</li>
  <li><strong>Budget:</strong> $5,000 per person</li>
  <li><strong>Interests:</strong> Beach resort, city tours, desert safari</li>
</ul>
<p>Please send me a quote.</p>
<p>Thanks,<br>John Doe</p>`,
        receivedAt: new Date().toISOString(),
        tenantId: TENANT_ID
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log('✅ Webhook Email Received:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.emailId;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test 3: Check Email Account Status
async function testCheckEmailAccountStatus(accountId) {
  console.log('\n=== Test 3: Check Email Account Status ===\n');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/email-accounts/${accountId}`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log('✅ Email Account Status:');
    console.log('Email:', response.data.email);
    console.log('Auto Fetch:', response.data.autoFetch);
    console.log('Last Fetch:', response.data.lastFetchAt || 'Never');
    console.log('Last Status:', response.data.lastFetchStatus || 'Never');
    console.log('Last Error:', response.data.lastFetchError || 'None');
    console.log('\nStats:');
    console.log('Emails Received:', response.data.stats?.emailsReceived || 0);
    console.log('Emails Sent:', response.data.stats?.emailsSent || 0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test 4: List Recent Emails
async function testListEmails() {
  console.log('\n=== Test 4: List Recent Emails ===\n');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/emails?limit=10&sort=-receivedAt`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log(`✅ Found ${response.data.length} recent emails:\n`);
    
    response.data.forEach((email, index) => {
      console.log(`${index + 1}. [${email.source.toUpperCase()}] ${email.subject}`);
      console.log(`   From: ${email.from.email}`);
      console.log(`   Status: ${email.processingStatus}`);
      console.log(`   Received: ${new Date(email.receivedAt).toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test 5: Check IMAP vs Webhook Email Count
async function testEmailSourceStats() {
  console.log('\n=== Test 5: Email Source Statistics ===\n');
  
  try {
    const [imapEmails, webhookEmails] = await Promise.all([
      axios.get(`${API_BASE_URL}/emails?source=imap`, {
        headers: { 'X-Tenant-ID': TENANT_ID }
      }),
      axios.get(`${API_BASE_URL}/emails?source=webhook`, {
        headers: { 'X-Tenant-ID': TENANT_ID }
      })
    ]);
    
    console.log('📊 Email Source Breakdown:');
    console.log(`📧 IMAP (Auto-fetched): ${imapEmails.data.length} emails`);
    console.log(`🌐 Webhook (Direct): ${webhookEmails.data.length} emails`);
    console.log(`📈 Total: ${imapEmails.data.length + webhookEmails.data.length} emails`);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run All Tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Dual-Mode Email System - Integration Tests       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // Test webhook email (no account needed)
  const emailId = await testWebhookEmail();
  
  if (emailId) {
    console.log('\n✅ Webhook test successful!');
    console.log('⏳ Wait 30 seconds for email to be processed...');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  // List all emails
  await testListEmails();
  
  // Show statistics
  await testEmailSourceStats();
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   Tests Complete!                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Configure a real email account with IMAP settings');
  console.log('2. Send a test email to that account');
  console.log('3. Wait up to 2 minutes for IMAP polling to fetch it');
  console.log('4. Check server logs for polling activity');
  console.log('5. Run testListEmails() to see IMAP-fetched emails');
}

// Export functions for individual testing
module.exports = {
  testCreateEmailAccount,
  testWebhookEmail,
  testCheckEmailAccountStatus,
  testListEmails,
  testEmailSourceStats,
  runAllTests
};

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
