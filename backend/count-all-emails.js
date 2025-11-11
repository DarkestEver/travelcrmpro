/**
 * Count All Emails by Status
 */

const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function countEmails() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';

    // Count by status
    const total = await EmailLog.countDocuments({ tenantId });
    const completed = await EmailLog.countDocuments({ tenantId, processingStatus: 'completed' });
    const pending = await EmailLog.countDocuments({ tenantId, processingStatus: 'pending' });
    const failed = await EmailLog.countDocuments({ tenantId, processingStatus: 'failed' });

    console.log('📊 EMAIL COUNT:');
    console.log(`   Total: ${total}`);
    console.log(`   Completed: ${completed}`);
    console.log(`   Pending: ${pending}`);
    console.log(`   Failed: ${failed}`);
    console.log('');

    // List all emails
    const emails = await EmailLog.find({ tenantId })
      .sort({ receivedAt: -1 })
      .select('subject from.email receivedAt processingStatus category');

    console.log('📧 ALL EMAILS:');
    console.log('='.repeat(80));
    emails.forEach((email, index) => {
      console.log(`${index + 1}. ${email.subject}`);
      console.log(`   From: ${email.from.email}`);
      console.log(`   Status: ${email.processingStatus}`);
      console.log(`   Category: ${email.category || 'None'}`);
      console.log(`   Received: ${email.receivedAt.toLocaleString()}`);
      console.log('');
    });

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

countEmails();
