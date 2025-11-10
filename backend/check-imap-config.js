const mongoose = require('mongoose');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');
const Tenant = require('./src/models/Tenant');

async function checkIMAPConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    
    // Get tenant info
    const tenant = await Tenant.findById(tenantId);
    console.log('=== TENANT INFO ===');
    console.log(`Name: ${tenant.name}`);
    console.log(`Status: ${tenant.status}`);
    console.log(`AI Enabled: ${tenant.settings?.aiSettings?.enabled || false}`);
    console.log();

    // Get email accounts for this tenant
    const emailAccounts = await EmailAccount.find({ tenantId })
      .select('email status aiEnabled aiAutoProcess autoFetch fetchInterval imapHost imapPort imapUser imapTls smtpHost smtpPort smtpUser smtpTls');

    console.log('=== EMAIL ACCOUNTS FOR TENANT ===');
    console.log(`Total accounts: ${emailAccounts.length}\n`);

    for (const account of emailAccounts) {
      console.log(`📧 Email: ${account.email}`);
      console.log(`Status: ${account.status}`);
      console.log();
      
      console.log('🔹 AI Settings:');
      console.log(`  AI Enabled: ${account.aiEnabled || false}`);
      console.log(`  AI Auto-Process: ${account.aiAutoProcess || false}`);
      console.log();
      
      console.log('🔹 Polling Settings:');
      console.log(`  Auto Fetch: ${account.autoFetch || false}`);
      console.log(`  Fetch Interval: ${account.fetchInterval || 'Not set'} minutes`);
      console.log();
      
      console.log('🔹 IMAP Configuration (for RECEIVING emails):');
      console.log(`  Host: ${account.imapHost || '❌ NOT CONFIGURED'}`);
      console.log(`  Port: ${account.imapPort || '❌ NOT CONFIGURED'}`);
      console.log(`  User: ${account.imapUser || '❌ NOT CONFIGURED'}`);
      console.log(`  Password: ${account.imapPassword ? '✅ SET (encrypted)' : '❌ NOT SET'}`);
      console.log(`  TLS: ${account.imapTls !== undefined ? account.imapTls : '❌ NOT CONFIGURED'}`);
      console.log();
      
      console.log('🔹 SMTP Configuration (for SENDING emails):');
      console.log(`  Host: ${account.smtpHost || '❌ NOT CONFIGURED'}`);
      console.log(`  Port: ${account.smtpPort || '❌ NOT CONFIGURED'}`);
      console.log(`  User: ${account.smtpUser || '❌ NOT CONFIGURED'}`);
      console.log(`  Password: ${account.smtpPassword ? '✅ SET (encrypted)' : '❌ NOT SET'}`);
      console.log(`  TLS: ${account.smtpTls !== undefined ? account.smtpTls : '❌ NOT CONFIGURED'}`);
      console.log();
      
      // Check if ready for polling
      const imapReady = account.imapHost && account.imapPort && account.imapUser && account.imapPassword;
      const pollingReady = imapReady && account.autoFetch && account.status === 'active';
      
      console.log('📊 Status Summary:');
      console.log(`  IMAP Ready: ${imapReady ? '✅ YES' : '❌ NO - missing IMAP credentials'}`);
      console.log(`  Polling Ready: ${pollingReady ? '✅ YES - can start polling!' : '❌ NO - check settings above'}`);
      console.log();
      
      if (!imapReady) {
        console.log('⚠️  TO ENABLE EMAIL POLLING, YOU NEED TO:');
        if (!account.imapHost) console.log('   1. Set IMAP host (e.g., imap.gmail.com)');
        if (!account.imapPort) console.log('   2. Set IMAP port (usually 993 for SSL)');
        if (!account.imapUser) console.log('   3. Set IMAP username');
        if (!account.imapPassword) console.log('   4. Set IMAP password (will be encrypted)');
        if (!account.autoFetch) console.log('   5. Enable autoFetch');
        console.log();
      }
      
      console.log('─'.repeat(80));
      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkIMAPConfig();
