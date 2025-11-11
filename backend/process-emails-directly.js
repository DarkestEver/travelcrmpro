/**
 * Directly Process Unprocessed Emails (Bypass Queue)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');
const itineraryMatchingService = require('./src/services/itineraryMatchingService');

async function processEmailsDirectly() {
  console.log('🔄 Direct Processing of Unprocessed Emails...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Find unprocessed incoming emails
    const emails = await EmailLog.find({
      direction: 'incoming',
      $or: [
        { 'aiProcessing.status': { $exists: false } },
        { 'aiProcessing.status': null },
        { 'aiProcessing.status': 'not processed' }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    console.log(`Found ${emails.length} unprocessed incoming emails\n`);

    if (emails.length === 0) {
      console.log('✅ All emails are already processed!');
      await mongoose.disconnect();
      return;
    }

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📧 Processing ${i + 1}/${emails.length}: ${email.subject}`);
      console.log(`From: ${email.from.email}`);
      console.log(`Date: ${email.createdAt}`);
      console.log('-'.repeat(70));

      try {
        // Step 1: Categorize
        console.log('1️⃣  Categorizing email...');
        const category = await openaiService.categorizeEmail(email, email.tenantId);
        console.log(`   Category: ${category.category} (${category.confidence}% confidence)`);

        email.category = category.category;
        email.aiProcessing = email.aiProcessing || {};
        email.aiProcessing.status = 'processing';
        await email.save();

        // Step 2: Extract data (if customer inquiry)
        if (category.category === 'CUSTOMER') {
          console.log('2️⃣  Extracting customer inquiry data...');
          const extracted = await openaiService.extractCustomerInquiry(email, email.tenantId);
          
          console.log(`   Destination: ${extracted.destination || 'N/A'}`);
          console.log(`   Dates: ${extracted.dates?.startDate || 'N/A'} to ${extracted.dates?.endDate || 'N/A'}`);
          console.log(`   Flexible: ${extracted.dates?.flexible}`);
          console.log(`   Travelers: ${extracted.travelers?.adults} adults, ${extracted.travelers?.children} children`);
          console.log(`   Budget: ${extracted.budget?.amount ? '$' + extracted.budget.amount : 'Not specified'}`);
          console.log(`   Missing Info: ${extracted.missingInfo?.length ? extracted.missingInfo.join(', ') : 'None'}`);

          email.aiProcessing.extractedData = extracted;

          // Step 3: Match itineraries
          console.log('3️⃣  Matching itineraries...');
          const workflow = await itineraryMatchingService.processCustomerInquiry(
            email,
            extracted,
            email.tenantId
          );
          
          console.log(`   Workflow: ${workflow.action}`);
          console.log(`   Note: ${workflow.note || 'N/A'}`);
          if (workflow.itineraries) {
            console.log(`   Matches: ${workflow.itineraries.length} itineraries`);
          }

          email.aiProcessing.workflow = workflow;
        }

        email.aiProcessing.status = 'completed';
        email.aiProcessing.completedAt = new Date();
        await email.save();

        console.log('✅ Email processed successfully!');

      } catch (error) {
        console.error(`❌ Processing failed: ${error.message}`);
        email.aiProcessing = email.aiProcessing || {};
        email.aiProcessing.status = 'failed';
        email.aiProcessing.error = error.message;
        await email.save();
      }
    }

    console.log(`\n\n${'='.repeat(70)}`);
    console.log('✅ All emails processed!');
    console.log(`\n💡 Check the UI now to see the results.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

processEmailsDirectly().catch(console.error);
