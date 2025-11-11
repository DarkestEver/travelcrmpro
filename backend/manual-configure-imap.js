/**
 * Manually Configure IMAP with Polling Interval
 */

const mongoose = require('mongoose');
const EmailAccount = require('./src/models/EmailAccount');

async function manuallyConfigureIMAP() {
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

    console.log('📧 Current Account:', account.email);
    console.log('Current IMAP:', account.imapConfig);
    console.log('');

    // Configure IMAP directly via MongoDB
    account.imapConfig = {
      enabled: true,
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      username: account.email,
      password: 'YOUR_APP_PASSWORD_HERE', // Replace this!
      mailbox: 'INBOX',
      pollingInterval: 300000 // 5 minutes in milliseconds
    };

    account.isActive = true;
    account.markModified('imapConfig'); // Force Mongoose to save nested object

    await account.save();

    console.log('✅ IMAP Configuration Saved!');
    console.log('');
    console.log('📧 Email:', account.email);
    console.log('🔹 IMAP Host:', account.imapConfig.host);
    console.log('🔹 IMAP Port:', account.imapConfig.port);
    console.log('🔹 Polling Interval:', account.imapConfig.pollingInterval, 'ms');
    console.log('');
    console.log('⚠️  IMPORTANT: Edit this file and replace YOUR_APP_PASSWORD_HERE with your actual Gmail app password!');
    console.log('');
    console.log('💡 After setting password:');
    console.log('   1. Run this script again: node manual-configure-imap.js');
    console.log('   2. Restart backend: npm start');
    console.log('   3. Check logs for "IMAP polling started"');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

manuallyConfigureIMAP();
