/**
 * Check if emails are being added to the processing queue
 */

const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('./src/models/EmailLog');
const AIProcessingLog = require('./src/models/AIProcessingLog');

async function checkProcessing() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Get the Bali email
    const email = await EmailLog.findOne({ subject: /Bali/i }).sort({ receivedAt: -1 });
    
    if (!email) {
      console.log('❌ Bali email not found');
      mongoose.connection.close();
      return;
    }

    console.log('📧 Email Details:');
    console.log('- ID:', email._id);
    console.log('- Subject:', email.subject);
    console.log('- From:', email.from?.email);
    console.log('- Received:', email.receivedAt);
    console.log('- Category:', email.category || '(not categorized)');
    console.log('- AI Processed:', email.aiProcessed);
    console.log('- Processing Status:', email.processingStatus || '(none)');
    console.log('- Extracted Data:', email.extractedData ? 'Yes' : 'No');
    console.log('');

    // Check AI processing logs
    const aiLogs = await AIProcessingLog.find({ 
      emailId: email._id 
    }).sort({ createdAt: -1 });

    console.log(`🤖 AI Processing Logs: ${aiLogs.length} found\n`);

    if (aiLogs.length > 0) {
      aiLogs.forEach((log, i) => {
        console.log(`Log ${i + 1}:`);
        console.log('- Status:', log.status);
        console.log('- Stage:', log.stage);
        console.log('- Created:', log.createdAt);
        console.log('- Error:', log.error || 'None');
        console.log('');
      });
    } else {
      console.log('❌ NO AI PROCESSING LOGS FOUND!');
      console.log('');
      console.log('🔍 DIAGNOSIS: Email was fetched but NOT added to AI processing queue');
      console.log('');
      console.log('Possible causes:');
      console.log('1. emailProcessingQueue is not being called after email fetch');
      console.log('2. autoProcess.enabled is false for this account');
      console.log('3. Queue/Redis not working');
      console.log('');
    }

    // Check the email account autoProcess settings
    const EmailAccount = require('./src/models/EmailAccount');
    const account = await EmailAccount.findById(email.emailAccountId);
    
    if (account) {
      console.log('⚙️  Email Account Settings:');
      console.log('- autoProcess.enabled:', account.autoProcess?.enabled);
      console.log('- autoProcess.categories:', account.autoProcess?.categories);
      console.log('');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProcessing();
