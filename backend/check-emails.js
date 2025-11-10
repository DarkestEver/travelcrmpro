// Check emails in database
require('dotenv').config();
const mongoose = require('mongoose');

async function checkEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const EmailLog = require('./src/models/EmailLog');
    
    const tenantId = '690ce6d206c104addbfedb65';
    
    const totalCount = await EmailLog.countDocuments({ tenantId });
    console.log(`📊 Total emails for tenant: ${totalCount}\n`);
    
    const emails = await EmailLog.find({ tenantId })
      .sort({ receivedAt: -1 })
      .limit(10)
      .lean();
    
    console.log('📧 Last 10 emails:\n');
    
    if (emails.length === 0) {
      console.log('❌ No emails found for this tenant!');
    } else {
      emails.forEach((email, index) => {
        console.log(`${index + 1}. Email ID: ${email._id}`);
        console.log(`   From: ${email.from.email}`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Received: ${email.receivedAt}`);
        console.log(`   Source: ${email.source}`);
        console.log(`   Processing Status: ${email.processingStatus}`);
        console.log(`   Category: ${email.category || 'N/A'}`);
        console.log(`   Category Confidence: ${email.categoryConfidence || 'N/A'}`);
        console.log(`   Has Extracted Data: ${email.extractedData ? 'Yes' : 'No'}`);
        
        if (email.extractedData) {
          console.log(`   Extracted Data Keys: ${Object.keys(email.extractedData).join(', ')}`);
        }
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Connection closed');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('  CHECK EMAILS IN DATABASE');
console.log('══════════════════════════════════════════════════════════════\n');

checkEmails();
