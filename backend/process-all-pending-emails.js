/**
 * Process all pending emails through AI
 */

const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');

async function processAllPendingEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Find all pending emails
    const pendingEmails = await EmailLog.find({
      processingStatus: 'pending',
      aiProcessed: { $ne: true }
    }).sort({ receivedAt: -1 });

    console.log(`📧 Found ${pendingEmails.length} pending email(s)\n`);

    if (pendingEmails.length === 0) {
      console.log('No pending emails to process');
      mongoose.connection.close();
      return;
    }

    for (const email of pendingEmails) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${email.subject}`);
      console.log(`From: ${email.from.email}`);
      console.log(`Received: ${email.receivedAt}`);
      console.log(`${'='.repeat(60)}\n`);

      try {
        // STEP 1: Categorize
        console.log('Step 1: Categorizing email...');
        const categorization = await openaiService.categorizeEmail(email, email.tenantId);
        
        email.category = categorization.category;
        email.categoryConfidence = categorization.confidence;
        email.sentiment = categorization.sentiment;
        email.tags = [categorization.subcategory];
        
        console.log(`✅ Category: ${categorization.category} (${categorization.confidence}% confidence)`);
        console.log(`   Subcategory: ${categorization.subcategory}`);
        console.log(`   Sentiment: ${categorization.sentiment}`);

        // STEP 2: Extract data
        console.log('\nStep 2: Extracting travel details...');
        let extractedData = null;

        if (categorization.category === 'CUSTOMER') {
          extractedData = await openaiService.extractCustomerInquiry(email, email.tenantId);
          console.log('✅ Extracted:', JSON.stringify(extractedData, null, 2));
        } else {
          console.log(`ℹ️  Category ${categorization.category} - no extraction needed`);
        }

        // Save results
        email.extractedData = extractedData;
        email.aiProcessed = true;
        email.processingStatus = 'completed';
        email.processedAt = new Date();
        
        await email.save();
        
        console.log('\n✅ Email processed successfully!');

      } catch (error) {
        console.error(`\n❌ Error processing email ${email._id}:`, error.message);
        email.processingStatus = 'failed';
        email.processingError = error.message;
        await email.save();
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ All pending emails processed!');
    console.log(`${'='.repeat(60)}\n`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

processAllPendingEmails();
