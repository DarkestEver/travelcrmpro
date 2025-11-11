/**
 * Check Pending Emails and Processing Status
 */

const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function checkPendingEmails() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';

    // Find all pending emails
    const pendingEmails = await EmailLog.find({
      tenantId,
      processingStatus: 'pending'
    }).sort({ receivedAt: -1 });

    console.log(`📊 Found ${pendingEmails.length} pending email(s)\n`);

    if (pendingEmails.length === 0) {
      console.log('✅ No pending emails - all processed!');
      await mongoose.disconnect();
      return;
    }

    // Check each pending email
    for (let i = 0; i < pendingEmails.length; i++) {
      const email = pendingEmails[i];
      console.log(`${'='.repeat(60)}`);
      console.log(`📧 Pending Email ${i + 1}/${pendingEmails.length}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`ID: ${email._id}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`From: ${email.from.email}`);
      console.log(`Received: ${email.receivedAt}`);
      console.log(`Direction: ${email.direction}`);
      console.log(`Source: ${email.source}`);
      console.log(`\nProcessing Status: ${email.processingStatus}`);
      console.log(`Category: ${email.category || 'Not categorized yet'}`);
      console.log(`Has Extracted Data: ${!!email.extractedData}`);
      
      if (email.aiProcessing) {
        console.log(`\nAI Processing Info:`);
        console.log(`  Status: ${email.aiProcessing.status || 'none'}`);
        console.log(`  Has Categorization: ${!!email.aiProcessing.categorization}`);
        console.log(`  Has Extraction: ${!!email.aiProcessing.extractedData}`);
      }

      console.log(`\n💡 To process this email, run:`);
      console.log(`   node process-specific-email.js ${email._id}`);
      console.log('');
    }

    // Check if email processing queue is running
    console.log(`${'='.repeat(60)}`);
    console.log('🔍 DIAGNOSIS:');
    console.log(`${'='.repeat(60)}`);
    console.log('\n1. Check if Redis is running:');
    console.log('   redis-cli ping');
    console.log('   (Should return "PONG")');
    
    console.log('\n2. Check if email polling service is running:');
    console.log('   Look for process: "Email Processing Queue"');
    
    console.log('\n3. Check backend logs for errors:');
    console.log('   Look in console where backend is running');
    
    console.log('\n4. Manual processing:');
    console.log('   node process-emails-simple.js');
    
    console.log('\n5. Check if tenant has OpenAI configured:');
    console.log('   Check Settings > AI Settings in UI');
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkPendingEmails();
