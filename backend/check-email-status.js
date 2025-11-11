/**
 * Check Email Status - Debug Script
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const EmailAccount = require('./src/models/EmailAccount');

async function checkEmailStatus() {
  console.log('🔍 Checking Email Status...\n');
  console.log('='.repeat(70));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Check email accounts
    console.log('📧 EMAIL ACCOUNTS:');
    console.log('-'.repeat(70));
    const accounts = await EmailAccount.find({ isActive: true });
    
    if (accounts.length === 0) {
      console.log('❌ No active email accounts found!');
      console.log('   Please configure email accounts in the system.');
    } else {
      accounts.forEach((acc, i) => {
        console.log(`${i + 1}. ${acc.email}`);
        console.log(`   Protocol: ${acc.protocol}`);
        console.log(`   Active: ${acc.isActive}`);
        console.log(`   Polling Enabled: ${acc.pollingEnabled || false}`);
        console.log(`   Last Polled: ${acc.lastPolledAt || 'Never'}`);
        console.log(`   Tenant: ${acc.tenantId}`);
        console.log();
      });
    }

    // Check emails in database
    console.log('📨 EMAILS IN DATABASE:');
    console.log('-'.repeat(70));
    const totalEmails = await EmailLog.countDocuments();
    console.log(`Total Emails: ${totalEmails}\n`);

    if (totalEmails === 0) {
      console.log('❌ No emails found in database!');
      console.log('   Emails are not being received/stored.');
    } else {
      const recentEmails = await EmailLog.find()
        .sort({ createdAt: -1 })
        .limit(10);
      
      console.log('Last 10 Emails:');
      recentEmails.forEach((email, i) => {
        console.log(`\n${i + 1}. From: ${email.from.email}`);
        console.log(`   To: ${email.to?.[0]?.email || 'N/A'}`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Direction: ${email.direction}`);
        console.log(`   Status: ${email.status}`);
        console.log(`   Created: ${email.createdAt}`);
        console.log(`   AI Status: ${email.aiProcessing?.status || 'not processed'}`);
        if (email.aiProcessing?.extractedData) {
          console.log(`   Destination: ${email.aiProcessing.extractedData.destination || 'N/A'}`);
        }
      });
    }

    // Check incoming emails specifically
    console.log('\n\n📥 INCOMING EMAILS (Customer Inquiries):');
    console.log('-'.repeat(70));
    const incomingCount = await EmailLog.countDocuments({ direction: 'incoming' });
    console.log(`Total Incoming: ${incomingCount}`);
    
    const recentIncoming = await EmailLog.find({ direction: 'incoming' })
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (recentIncoming.length > 0) {
      recentIncoming.forEach((email, i) => {
        console.log(`\n${i + 1}. ${email.from.email} - ${email.subject}`);
        console.log(`   Received: ${email.createdAt}`);
        console.log(`   AI Processing: ${email.aiProcessing?.status || 'pending'}`);
      });
    } else {
      console.log('No incoming emails found.');
    }

    // Check for emails from last hour
    console.log('\n\n⏰ EMAILS FROM LAST HOUR:');
    console.log('-'.repeat(70));
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEmailsCount = await EmailLog.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });
    
    console.log(`Emails in last hour: ${recentEmailsCount}`);
    
    if (recentEmailsCount > 0) {
      const lastHourEmails = await EmailLog.find({
        createdAt: { $gte: oneHourAgo }
      }).sort({ createdAt: -1 });
      
      lastHourEmails.forEach((email, i) => {
        console.log(`\n${i + 1}. ${email.from.email}`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Time: ${email.createdAt}`);
      });
    }

    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log('='.repeat(70));
    console.log(`✓ Active Email Accounts: ${accounts.length}`);
    console.log(`✓ Total Emails: ${totalEmails}`);
    console.log(`✓ Incoming Emails: ${incomingCount}`);
    console.log(`✓ Last Hour: ${recentEmailsCount}`);
    
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('-'.repeat(70));
    
    if (accounts.length === 0) {
      console.log('⚠️  No email accounts configured');
      console.log('   → Set up email account in the UI (Email Settings)');
    }
    
    if (totalEmails === 0) {
      console.log('⚠️  No emails in database');
      console.log('   → Check if email polling is running');
      console.log('   → Check email account credentials');
      console.log('   → Check IMAP/POP3 settings');
    }
    
    if (recentEmailsCount === 0) {
      console.log('⚠️  No recent emails');
      console.log('   → Send a test email to the configured address');
      console.log('   → Wait 1-2 minutes for polling cycle');
      console.log('   → Check backend logs for errors');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkEmailStatus().catch(console.error);
