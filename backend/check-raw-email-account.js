/**
 * Check Raw Email Account Data Structure
 */

const mongoose = require('mongoose');

async function checkRawEmailAccount() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    
    // Get raw data from collection
    const collection = mongoose.connection.collection('emailaccounts');
    const account = await collection.findOne({ tenantId: new mongoose.Types.ObjectId(tenantId) });

    if (!account) {
      console.log('❌ No email account found!');
      await mongoose.disconnect();
      return;
    }

    console.log('='.repeat(70));
    console.log('📧 RAW EMAIL ACCOUNT DATA FROM MONGODB');
    console.log('='.repeat(70));
    console.log(JSON.stringify(account, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkRawEmailAccount();
