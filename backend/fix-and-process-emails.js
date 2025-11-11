/**
 * Fix and Process All Emails
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');
const itineraryMatchingService = require('./src/services/itineraryMatchingService');

async function fixAndProcessEmails() {
  console.log('🔧 Fixing and Processing All Emails...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Update all emails with undefined direction to 'incoming'
    const updateResult = await EmailLog.updateMany(
      { direction: { $in: [null, undefined] } },
      { $set: { direction: 'incoming', status: 'received' } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} emails with direction='incoming'\n`);

    // Now find and process them
    const emails = await EmailLog.find({
      direction: 'incoming',
      $or: [
        { 'aiProcessing.status': { $exists: false } },
        { 'aiProcessing.status': null },
        { 'aiProcessing.status': 'not processed' }
      ]
    }).sort({ createdAt: -1 });

    console.log(`Found ${emails.length} emails to process\n`);

    if (emails.length === 0) {
      console.log('✅ No emails to process!');
      await mongoose.disconnect();
      return;
    }

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📧 ${i + 1}/${emails.length}: ${email.subject}`);
      console.log(`From: ${email.from.email}`);
      console.log(`Date: ${email.createdAt}`);
      console.log('-'.repeat(70));

      try {
        // Categorize
        console.log('1️⃣  Categorizing...');
        const category = await openaiService.categorizeEmail(email, email.tenantId);
        console.log(`   → ${category.category} (${category.confidence}% confidence)`);

        email.category = category.category;
        email.aiProcessing = {
          status: 'processing',
          categorization: category
        };
        await email.save();

        // Extract data (if customer inquiry)
        if (category.category === 'CUSTOMER') {
          console.log('2️⃣  Extracting data...');
          const extracted = await openaiService.extractCustomerInquiry(email, email.tenantId);
          
          console.log(`   → Destination: ${extracted.destination || 'N/A'}`);
          console.log(`   → Dates: ${extracted.dates?.startDate || 'N/A'} to ${extracted.dates?.endDate || 'N/A'} (flexible: ${extracted.dates?.flexible})`);
          console.log(`   → Travelers: ${extracted.travelers?.adults || 0} adults, ${extracted.travelers?.children || 0} children, ${extracted.travelers?.infants || 0} infants`);
          if (extracted.travelers?.childAges?.length > 0) {
            console.log(`   → Child Ages: [${extracted.travelers.childAges.join(', ')}]`);
          }
          console.log(`   → Budget: ${extracted.budget?.amount ? '$' + extracted.budget.amount : 'Not specified'}`);
          console.log(`   → Missing: ${extracted.missingInfo?.length ? extracted.missingInfo.join(', ') : 'None'}`);

          email.aiProcessing.extractedData = extracted;

          // Match itineraries
          console.log('3️⃣  Matching itineraries...');
          const workflow = await itineraryMatchingService.processCustomerInquiry(
            email,
            extracted,
            email.tenantId
          );
          
          console.log(`   → Action: ${workflow.action}`);
          if (workflow.note) console.log(`   → Note: ${workflow.note}`);
          if (workflow.itineraries) {
            console.log(`   → Found: ${workflow.itineraries.length} matching itineraries`);
          }

          email.aiProcessing.workflow = workflow;
        }

        email.aiProcessing.status = 'completed';
        email.aiProcessing.completedAt = new Date();
        await email.save();

        console.log('✅ PROCESSED!');

      } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
        email.aiProcessing = email.aiProcessing || {};
        email.aiProcessing.status = 'failed';
        email.aiProcessing.error = error.message;
        await email.save();
      }

      // Small delay between emails to avoid rate limits
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n\n${'='.repeat(70)}`);
    console.log('🎉 ALL EMAILS PROCESSED!');
    console.log(`\n💡 Refresh the UI to see the results.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixAndProcessEmails().catch(console.error);
