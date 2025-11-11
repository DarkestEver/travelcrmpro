/**
 * Debug Email Fields
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function debugEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    
    const emails = await EmailLog.find({}).sort({ createdAt: -1 }).limit(3);
    
    console.log('📧 Email Fields Debug:\n');
    
    emails.forEach((email, i) => {
      console.log(`\n${i + 1}. ${email.subject}`);
      console.log('   _id:', email._id);
      console.log('   direction:', email.direction);
      console.log('   status:', email.status);
      console.log('   aiProcessing:', JSON.stringify(email.aiProcessing, null, 2));
      console.log('   Raw aiProcessing:', email.aiProcessing);
      console.log('   Has aiProcessing:', !!email.aiProcessing);
      console.log('   aiProcessing.status:', email.aiProcessing?.status);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

debugEmails();
