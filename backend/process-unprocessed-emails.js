/**
 * Manually Process Recent Emails
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const emailProcessingQueue = require('./src/services/emailProcessingQueue');

async function processRecentEmails() {
  console.log('🔄 Processing Recent Unprocessed Emails...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Find unprocessed emails
    const unprocessedEmails = await EmailLog.find({
      $or: [
        { 'aiProcessing.status': { $exists: false } },
        { 'aiProcessing.status': null },
        { 'aiProcessing.status': 'not processed' }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    console.log(`Found ${unprocessedEmails.length} unprocessed emails\n`);

    if (unprocessedEmails.length === 0) {
      console.log('✅ All emails are already processed!');
      await mongoose.disconnect();
      return;
    }

    // Update direction to 'incoming' if undefined
    for (const email of unprocessedEmails) {
      console.log(`\n📧 Processing: ${email.from.email} - ${email.subject}`);
      
      // Fix direction if undefined
      if (!email.direction) {
        email.direction = 'incoming';
        await email.save();
        console.log('   ✓ Set direction to: incoming');
      }

      // Add to processing queue
      try {
        await emailProcessingQueue.add('process-email', {
          emailId: email._id.toString(),
          tenantId: email.tenantId.toString()
        });
        console.log('   ✓ Added to processing queue');
      } catch (error) {
        console.log('   ❌ Queue error:', error.message);
      }
    }

    console.log('\n✅ All emails added to processing queue!');
    console.log('\n💡 The emails will be processed in the background.');
    console.log('   Check again in 30 seconds to see results.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    // Don't exit immediately to allow queue to process
    setTimeout(() => {
      console.log('\n👋 Script complete. Queue is still processing in background.');
      process.exit(0);
    }, 2000);
  }
}

processRecentEmails().catch(console.error);
