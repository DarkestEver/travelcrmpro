const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');

async function reprocessParisEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    const email = await EmailLog.findById('69126a222d6a7a37eadf12a6');

    if (!email) {
      console.log('❌ Email not found');
      process.exit(1);
    }

    console.log('📧 Reprocessing Paris Email...\n');
    console.log(`Body: ${email.bodyText}\n`);

    // Extract customer inquiry
    console.log('🤖 Extracting customer data...');
    const extraction = await openaiService.extractCustomerInquiry(email, tenantId);
    
    console.log('\n📋 EXTRACTION RESULT:');
    console.log(JSON.stringify(extraction, null, 2));
    console.log();

    if (extraction.data) {
      email.extractedData = extraction.data;
      email.openaiCost = (email.openaiCost || 0) + (extraction.cost || 0);
      email.tokensUsed = (email.tokensUsed || 0) + (extraction.tokens || 0);
      await email.save();
      console.log('✅ Extracted data saved to database');
    }

    // Generate response
    console.log('\n🤖 Generating AI response...');
    const response = await openaiService.generateResponse(
      email,
      { extractedData: email.extractedData },
      'customer_inquiry',
      tenantId
    );
    
    console.log('\n💬 RESPONSE RESULT:');
    console.log(JSON.stringify(response, null, 2));
    console.log();

    if (response.response) {
      email.aiResponse = response.response;
      email.responseGenerated = true;
      email.openaiCost = (email.openaiCost || 0) + (response.cost || 0);
      email.tokensUsed = (email.tokensUsed || 0) + (response.tokens || 0);
      await email.save();
      console.log('✅ AI response saved to database');
    }

    console.log('\n═'.repeat(70));
    console.log('✅ REPROCESSING COMPLETE!');
    console.log('═'.repeat(70));
    console.log(`Total Cost: $${email.openaiCost}`);
    console.log(`Total Tokens: ${email.tokensUsed}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

reprocessParisEmail();
