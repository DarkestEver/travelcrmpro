/**
 * Quick Email Polling Test Script
 * 
 * Run this to check if your email was fetched
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';
const TENANT_ID = '690ce6d206c104addbfedb65'; // Main Travel Agency

async function checkRecentEmails() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   📧 Checking Recent Emails from IMAP Polling');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // Get recent emails
    const response = await axios.get(
      `${API_BASE_URL}/emails?limit=10&sort=-receivedAt`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log(`✅ Found ${response.data.length} recent email(s)\n`);
    
    // Show emails from IMAP
    const imapEmails = response.data.filter(e => e.source === 'imap');
    
    if (imapEmails.length > 0) {
      console.log('📨 IMAP Emails (Auto-fetched):');
      console.log('───────────────────────────────────────────────────────\n');
      
      imapEmails.forEach((email, index) => {
        console.log(`${index + 1}. Subject: "${email.subject}"`);
        console.log(`   From: ${email.from.email}`);
        console.log(`   To: ${email.to[0]?.email}`);
        console.log(`   Source: ${email.source.toUpperCase()}`);
        console.log(`   Status: ${email.processingStatus}`);
        console.log(`   Received: ${new Date(email.receivedAt).toLocaleString()}`);
        console.log(`   Quote ID: ${email.quoteId || 'Not created yet'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No IMAP emails found yet.');
      console.log('   Wait up to 2 minutes for polling to fetch your email.\n');
    }
    
    // Show all emails
    console.log('\n📊 All Emails:');
    console.log('───────────────────────────────────────────────────────\n');
    
    response.data.forEach((email, index) => {
      console.log(`${index + 1}. [${email.source.toUpperCase()}] "${email.subject}" - ${email.processingStatus}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function checkEmailAccountStatus() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   📬 Email Account Status');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // Get all email accounts
    const response = await axios.get(
      `${API_BASE_URL}/email-accounts`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log(`✅ Found ${response.data.length} email account(s)\n`);
    
    response.data.forEach((account, index) => {
      console.log(`${index + 1}. ${account.email}`);
      console.log(`   Account Name: ${account.accountName}`);
      console.log(`   Status: ${account.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Auto Fetch: ${account.autoFetch ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Last Fetch: ${account.lastFetchAt ? new Date(account.lastFetchAt).toLocaleString() : 'Never'}`);
      console.log(`   Last Status: ${account.lastFetchStatus || 'Never'}`);
      console.log(`   Last Error: ${account.lastFetchError || 'None'}`);
      console.log(`   Emails Received: ${account.stats?.emailsReceived || 0}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function checkQuotes() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   💼 Recent Quotes (From Emails)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/quotes?limit=10&sort=-createdAt`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log(`✅ Found ${response.data.length} recent quote(s)\n`);
    
    response.data.forEach((quote, index) => {
      console.log(`${index + 1}. Quote #${quote.quoteNumber || quote._id}`);
      console.log(`   Customer: ${quote.customer?.name || 'Unknown'}`);
      console.log(`   Email: ${quote.customer?.email || 'N/A'}`);
      console.log(`   Status: ${quote.status}`);
      console.log(`   Source: ${quote.source || 'N/A'}`);
      console.log(`   Created: ${new Date(quote.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function runTest() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║      EMAIL POLLING TEST - app@travelmanagerpro.com   ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  // Check email account status
  await checkEmailAccountStatus();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check recent emails
  await checkRecentEmails();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check quotes
  await checkQuotes();
  
  console.log('\n📝 What to do if email not found:');
  console.log('   1. Wait up to 2 minutes (polling runs every 2 min)');
  console.log('   2. Check server logs for polling activity');
  console.log('   3. Verify IMAP credentials are correct');
  console.log('   4. Check "Last Error" in email account status');
  console.log('   5. Make sure email is in INBOX (not spam/other folder)');
  console.log('\n');
}

// Run the test
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = {
  checkRecentEmails,
  checkEmailAccountStatus,
  checkQuotes,
  runTest
};
