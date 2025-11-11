/**
 * Quick check of any processed emails
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function quickCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');
    
    // Count all emails
    const totalEmails = await EmailLog.countDocuments({});
    console.log(`📧 Total emails in database: ${totalEmails}\n`);
    
    // Count by status
    const pending = await EmailLog.countDocuments({ processingStatus: 'pending' });
    const processing = await EmailLog.countDocuments({ processingStatus: 'processing' });
    const completed = await EmailLog.countDocuments({ processingStatus: 'completed' });
    const failed = await EmailLog.countDocuments({ processingStatus: 'failed' });
    
    console.log('Status breakdown:');
    console.log(`   Pending: ${pending}`);
    console.log(`   Processing: ${processing}`);
    console.log(`   Completed: ${completed}`);
    console.log(`   Failed: ${failed}\n`);
    
    // Get latest email regardless of status
    const latestEmail = await EmailLog.findOne({})
      .sort({ receivedAt: -1 })
      .lean();
    
    if (latestEmail) {
      console.log('Latest email:');
      console.log(`   Subject: ${latestEmail.subject}`);
      console.log(`   Status: ${latestEmail.processingStatus}`);
      console.log(`   Category: ${latestEmail.category || 'N/A'}`);
      console.log(`   Has itineraryMatching: ${latestEmail.itineraryMatching ? 'Yes ✅' : 'No ❌'}`);
      console.log(`   Has generatedResponse: ${latestEmail.generatedResponse ? 'Yes ✅' : 'No ❌'}`);
      console.log(`   Has signatureImageData: ${latestEmail.signatureImageData ? 'Yes ✅' : 'No ❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

quickCheck().catch(console.error);
