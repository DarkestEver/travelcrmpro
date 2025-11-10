const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('./src/models/EmailLog');

async function checkParisEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = await EmailLog.findById('69126a222d6a7a37eadf12a6');

    if (!email) {
      console.log('❌ Email not found');
      process.exit(1);
    }

    console.log('═'.repeat(70));
    console.log('📧 PARIS FAMILY VACATION EMAIL');
    console.log('═'.repeat(70));
    console.log();
    console.log(`From: ${email.from.email}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Status: ${email.processingStatus}`);
    console.log();
    
    console.log('🏷️  AI CATEGORIZATION:');
    console.log(`Category: ${email.category}`);
    console.log(`Confidence: ${email.categoryConfidence}%`);
    console.log(`Sentiment: ${email.sentiment}`);
    console.log(`Priority: ${email.priority}`);
    console.log();

    console.log('📋 EXTRACTED DATA:');
    if (email.extractedData) {
      console.log(JSON.stringify(email.extractedData, null, 2));
    } else {
      console.log('❌ No extracted data');
    }
    console.log();

    console.log('💬 AI RESPONSE:');
    if (email.aiResponse) {
      console.log('─'.repeat(70));
      console.log(email.aiResponse);
      console.log('─'.repeat(70));
    } else {
      console.log('❌ No AI response');
    }
    console.log();

    console.log('💵 COSTS:');
    console.log(`OpenAI Cost: $${email.openaiCost || 0}`);
    console.log(`Tokens Used: ${email.tokensUsed || 0}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkParisEmail();
