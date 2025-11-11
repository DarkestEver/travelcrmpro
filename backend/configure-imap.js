/**
 * Configure IMAP for Email Account
 * Run this to enable automatic email polling
 */

const mongoose = require('mongoose');
const EmailAccount = require('./src/models/EmailAccount');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function configureIMAP() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    const account = await EmailAccount.findOne({ tenantId });

    if (!account) {
      console.log('❌ No email account found!');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📧 Configuring IMAP for:', account.email);
    console.log('');

    // Get IMAP configuration
    console.log('🔧 IMAP Configuration:\n');
    
    const imapHost = await question('IMAP Host (e.g., imap.gmail.com): ');
    const imapPort = await question('IMAP Port (usually 993 for SSL): ');
    const imapUser = await question(`IMAP Username (default: ${account.email}): `) || account.email;
    const imapPassword = await question('IMAP Password/App Password: ');
    const pollingInterval = await question('Polling Interval in seconds (default: 300 = 5 min): ') || '300';

    rl.close();

    // Update email account
    account.imapConfig = {
      enabled: true,
      host: imapHost,
      port: parseInt(imapPort),
      secure: true,
      username: imapUser,
      password: imapPassword, // Will be encrypted by model
      mailbox: 'INBOX',
      pollingInterval: parseInt(pollingInterval) * 1000 // Convert to ms
    };

    account.isActive = true;

    await account.save();

    console.log('\n' + '='.repeat(70));
    console.log('✅ IMAP CONFIGURED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📧 Email Account:', account.email);
    console.log('🔹 IMAP Host:', imapHost);
    console.log('🔹 IMAP Port:', imapPort);
    console.log('🔹 IMAP User:', imapUser);
    console.log('🔹 Polling Interval:', pollingInterval, 'seconds');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Restart your backend server');
    console.log('   2. Watch backend logs for "IMAP polling started"');
    console.log('   3. Send a test email to:', account.email);
    console.log('   4. Wait', pollingInterval, 'seconds for it to be fetched');
    console.log('   5. Check UI - email should appear automatically!');

    console.log('\n⚠️  IMPORTANT:');
    console.log('   - For Gmail: Use App Password, not regular password');
    console.log('   - Enable "Less secure app access" or use App Password');
    console.log('   - Make sure IMAP is enabled in email settings');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

configureIMAP();
