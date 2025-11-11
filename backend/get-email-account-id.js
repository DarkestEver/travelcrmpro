/**
 * Get Email Account ID for Testing
 */

const mongoose = require('mongoose');
const EmailAccount = require('./src/models/EmailAccount');

async function getEmailAccountId() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    
    const tenantId = '690ce6d206c104addbfedb65';
    
    const account = await EmailAccount.findOne({ tenantId }).select('_id email');
    
    if (account) {
      console.log('✅ Email Account Found:');
      console.log(`   ID: ${account._id}`);
      console.log(`   Email: ${account.email}`);
    } else {
      console.log('❌ No email account found for this tenant');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

getEmailAccountId();
