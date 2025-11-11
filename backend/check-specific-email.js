/**
 * Check specific email
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function checkEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    
    const emailId = '69126a222d6a7a37eadf12a6';
    
    const email = await EmailLog.findById(emailId).lean();
    
    if (!email) {
      console.log('❌ Email not found');
    } else {
      console.log('✅ Email found:');
      console.log('   Subject:', email.subject);
      console.log('   Status:', email.processingStatus);
      console.log('   Category:', email.category);
      console.log('   TenantId:', email.tenantId);
      console.log('   Has itineraryMatching:', !!email.itineraryMatching);
      console.log('   Has generatedResponse:', !!email.generatedResponse);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmail();
