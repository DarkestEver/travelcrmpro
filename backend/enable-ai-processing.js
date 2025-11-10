const mongoose = require('mongoose');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');

async function enableAIProcessing() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    
    const account = await EmailAccount.findOne({ 
      email: 'app@travelmanagerpro.com',
      tenantId 
    });

    if (!account) {
      console.log('❌ Email account not found!');
      process.exit(1);
    }

    console.log('📧 Current Settings:');
    console.log(`  Auto Process Enabled: ${account.autoProcess?.enabled || false}`);
    console.log(`  AI Enabled: ${account.aiEnabled || false}`);
    console.log(`  AI Auto Process: ${account.aiAutoProcess || false}`);
    console.log();

    // Enable AI processing
    console.log('🔄 Enabling AI auto-processing...\n');
    
    account.autoProcess = account.autoProcess || {};
    account.autoProcess.enabled = true;
    account.autoProcess.categories = ['CUSTOMER', 'SUPPLIER', 'AGENT', 'FINANCE', 'OTHER'];
    account.autoProcess.syncFrequency = 5; // Check every 5 minutes
    
    account.aiEnabled = true;
    account.aiAutoProcess = true;
    account.isActive = true;
    account.status = 'active';
    
    // Reduce fetch interval to 5 minutes (300000 ms)
    account.fetchInterval = 5;
    
    await account.save();

    console.log('✅ AI Auto-Processing ENABLED!');
    console.log();
    console.log('📋 Updated Settings:');
    console.log(`  Auto Process Enabled: ${account.autoProcess.enabled}`);
    console.log(`  AI Enabled: ${account.aiEnabled}`);
    console.log(`  AI Auto Process: ${account.aiAutoProcess}`);
    console.log(`  Status: ${account.status}`);
    console.log(`  Fetch Interval: ${account.fetchInterval} minutes`);
    console.log(`  Categories: ${account.autoProcess.categories.join(', ')}`);
    console.log();
    console.log('🎉 Email polling with AI processing is now ready!');
    console.log();
    console.log('The system will:');
    console.log('  1. Connect to IMAP every 5 minutes');
    console.log('  2. Fetch new unread emails');
    console.log('  3. Process with AI automatically');
    console.log('  4. Categorize, extract data, generate responses');
    console.log('  5. Save to database');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

enableAIProcessing();
