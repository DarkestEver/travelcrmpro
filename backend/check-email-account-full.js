const mongoose = require('mongoose');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');

async function checkFullAccount() {
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

    console.log('=== FULL EMAIL ACCOUNT DATA ===');
    console.log(JSON.stringify(account.toObject(), null, 2));
    console.log();
    
    console.log('=== SUMMARY ===');
    console.log(`Email: ${account.email}`);
    console.log(`Status: ${account.status || 'undefined'}`);
    console.log(`Tenant: ${account.tenantId}`);
    console.log();
    
    console.log('IMAP Settings:');
    console.log(`  Host: ${account.imapHost || 'NOT SET'}`);
    console.log(`  Port: ${account.imapPort || 'NOT SET'}`);
    console.log(`  User: ${account.imapUser || 'NOT SET'}`);
    console.log(`  Password: ${account.imapPassword ? 'SET (encrypted)' : 'NOT SET'}`);
    console.log(`  TLS: ${account.imapTls}`);
    console.log();
    
    console.log('SMTP Settings:');
    console.log(`  Host: ${account.smtpHost || 'NOT SET'}`);
    console.log(`  Port: ${account.smtpPort || 'NOT SET'}`);
    console.log(`  User: ${account.smtpUser || 'NOT SET'}`);
    console.log(`  Password: ${account.smtpPassword ? 'SET (encrypted)' : 'NOT SET'}`);
    console.log(`  TLS: ${account.smtpTls}`);
    console.log();
    
    console.log('Polling Settings:');
    console.log(`  Auto Fetch: ${account.autoFetch}`);
    console.log(`  Fetch Interval: ${account.fetchInterval}`);
    console.log();
    
    console.log('AI Settings:');
    console.log(`  AI Enabled: ${account.aiEnabled}`);
    console.log(`  AI Auto Process: ${account.aiAutoProcess}`);
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkFullAccount();
