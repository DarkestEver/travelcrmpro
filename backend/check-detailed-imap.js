/**
 * Check Detailed IMAP Configuration in Database
 */

const mongoose = require('mongoose');
const EmailAccount = require('./src/models/EmailAccount');

async function checkDetailedIMAPConfig() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    const account = await EmailAccount.findOne({ tenantId });

    if (!account) {
      console.log('❌ No email account found!');
      await mongoose.disconnect();
      return;
    }

    console.log('='.repeat(70));
    console.log('📧 EMAIL ACCOUNT CONFIGURATION');
    console.log('='.repeat(70));
    console.log('\n📌 Basic Info:');
    console.log(`   Email: ${account.email}`);
    console.log(`   Provider: ${account.provider}`);
    console.log(`   Active: ${account.isActive}`);
    console.log(`   Created: ${account.createdAt}`);
    console.log(`   Last IMAP Check: ${account.lastImapCheck || 'Never'}`);

    console.log('\n🔹 IMAP Configuration:');
    if (account.imapConfig) {
      console.log(`   Enabled: ${account.imapConfig.enabled}`);
      console.log(`   Host: ${account.imapConfig.host || 'NOT SET'}`);
      console.log(`   Port: ${account.imapConfig.port || 'NOT SET'}`);
      console.log(`   Secure: ${account.imapConfig.secure}`);
      console.log(`   Username: ${account.imapConfig.username || 'NOT SET'}`);
      console.log(`   Password Set: ${!!account.imapConfig.password}`);
      console.log(`   Mailbox: ${account.imapConfig.mailbox || 'INBOX'}`);
      console.log(`   Polling Interval: ${account.imapConfig.pollingInterval || 'NOT SET'} ms`);
      
      // Try to decrypt password to check if it's valid
      try {
        const decrypted = account.getDecryptedPassword('imap');
        console.log(`   Password Decrypts: ${!!decrypted} ${decrypted ? '(length: ' + decrypted.length + ')' : ''}`);
      } catch (error) {
        console.log(`   Password Decryption: ❌ FAILED (${error.message})`);
      }
    } else {
      console.log('   ❌ IMAP Config is NULL or UNDEFINED');
    }

    console.log('\n🔹 SMTP Configuration:');
    if (account.smtpConfig) {
      console.log(`   Enabled: ${account.smtpConfig.enabled}`);
      console.log(`   Host: ${account.smtpConfig.host || 'NOT SET'}`);
      console.log(`   Port: ${account.smtpConfig.port || 'NOT SET'}`);
      console.log(`   Secure: ${account.smtpConfig.secure}`);
      console.log(`   Username: ${account.smtpConfig.username || 'NOT SET'}`);
      console.log(`   Password Set: ${!!account.smtpConfig.password}`);
      
      try {
        const decrypted = account.getDecryptedPassword('smtp');
        console.log(`   Password Decrypts: ${!!decrypted} ${decrypted ? '(length: ' + decrypted.length + ')' : ''}`);
      } catch (error) {
        console.log(`   Password Decryption: ❌ FAILED (${error.message})`);
      }
    } else {
      console.log('   ❌ SMTP Config is NULL or UNDEFINED');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🔍 DIAGNOSIS:');
    console.log('='.repeat(70));

    const issues = [];
    const working = [];

    // Check IMAP
    if (!account.imapConfig) {
      issues.push('IMAP config object is missing');
    } else {
      if (!account.imapConfig.enabled) {
        issues.push('IMAP is disabled');
      } else {
        working.push('IMAP is enabled ✅');
      }

      if (!account.imapConfig.host) {
        issues.push('IMAP host is not set');
      } else {
        working.push(`IMAP host: ${account.imapConfig.host} ✅`);
      }

      if (!account.imapConfig.port) {
        issues.push('IMAP port is not set');
      } else {
        working.push(`IMAP port: ${account.imapConfig.port} ✅`);
      }

      if (!account.imapConfig.username) {
        issues.push('IMAP username is not set');
      } else {
        working.push(`IMAP username configured ✅`);
      }

      if (!account.imapConfig.password) {
        issues.push('IMAP password is not set');
      } else {
        working.push('IMAP password configured ✅');
      }

      if (!account.imapConfig.pollingInterval) {
        issues.push('IMAP polling interval is not set (will use default)');
      } else {
        working.push(`Polling every ${account.imapConfig.pollingInterval / 1000} seconds ✅`);
      }
    }

    if (!account.isActive) {
      issues.push('Email account is not active');
    }

    console.log('\n✅ WORKING:');
    if (working.length > 0) {
      working.forEach(item => console.log(`   ${item}`));
    } else {
      console.log('   Nothing configured yet');
    }

    console.log('\n❌ ISSUES:');
    if (issues.length > 0) {
      issues.forEach(item => console.log(`   ${item}`));
    } else {
      console.log('   No issues found! ✅');
    }

    console.log('\n' + '='.repeat(70));
    console.log('💡 NEXT STEPS:');
    console.log('='.repeat(70));

    if (issues.length === 0) {
      console.log('\n✅ Your IMAP is fully configured!');
      console.log('\n🔧 To enable automatic email polling:');
      console.log('   1. Check if backend server is running');
      console.log('   2. Check backend logs for "IMAP polling started for..."');
      console.log('   3. Check for any IMAP connection errors in logs');
      console.log('   4. Verify Redis is running: redis-cli ping');
      console.log('   5. Send a test email and wait for polling interval');
      
      console.log('\n📝 To manually test IMAP connection:');
      console.log('   node test-imap-connection.js');
      
    } else {
      console.log('\n⚠️  You need to fix the issues above first.');
      console.log('\n🔧 To configure:');
      console.log('   Option 1: Use the UI (Settings > Email Accounts)');
      console.log('   Option 2: Run: node configure-imap.js');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkDetailedIMAPConfig();
