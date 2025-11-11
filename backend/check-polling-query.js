/**
 * Check why email polling query is not finding the account
 */

const mongoose = require('mongoose');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');

async function checkPollingQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB');

    // This is the EXACT query used in emailPollingService.js
    console.log('\n🔍 Running the same query as emailPollingService.js:\n');
    const query = {
      status: 'active',
      autoFetch: true,
      'imap.host': { $exists: true, $ne: '' }
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const accounts = await EmailAccount.find(query);
    
    console.log(`\n📊 Found ${accounts.length} account(s) matching the query\n`);

    if (accounts.length === 0) {
      console.log('❌ NO ACCOUNTS FOUND! Let\'s check what\'s wrong:\n');
      
      // Check all accounts
      const allAccounts = await EmailAccount.find({});
      console.log(`Total accounts in database: ${allAccounts.length}\n`);
      
      if (allAccounts.length > 0) {
        const account = allAccounts[0];
        console.log('First account details:');
        console.log('- email:', account.email);
        console.log('- status:', account.status, '(expected: "active")');
        console.log('- autoFetch:', account.autoFetch, '(expected: true)');
        console.log('- imap.enabled:', account.imap?.enabled);
        console.log('- imap.host:', account.imap?.host, '(expected: exists and not empty)');
        console.log('- isActive:', account.isActive);
        
        console.log('\n🔍 DIAGNOSIS:');
        if (account.status !== 'active') {
          console.log('❌ PROBLEM: status is', account.status, 'but needs to be "active"');
        }
        if (!account.autoFetch) {
          console.log('❌ PROBLEM: autoFetch is', account.autoFetch, 'but needs to be true');
        }
        if (!account.imap?.host || account.imap.host === '') {
          console.log('❌ PROBLEM: imap.host is missing or empty');
        }
        
        console.log('\n💡 SOLUTION: The account has isActive:', account.isActive);
        console.log('   But the query checks for status: "active"');
        console.log('   The model probably uses "isActive" not "status"!');
      }
    } else {
      accounts.forEach((acc, i) => {
        console.log(`Account ${i + 1}:`);
        console.log('- email:', acc.email);
        console.log('- autoFetch:', acc.autoFetch);
        console.log('- fetchInterval:', acc.fetchInterval, 'minutes');
        console.log('- imap.host:', acc.imap?.host);
        console.log('');
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPollingQuery();
