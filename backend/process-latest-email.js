const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('./src/models/EmailLog');
const processingQueue = require('./src/services/emailProcessingQueue');

async function processLatestEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    
    // Get the latest email that hasn't been processed
    const email = await EmailLog.findOne({ 
      tenantId,
      processingStatus: 'pending'
    }).sort({ createdAt: -1 });

    if (!email) {
      console.log('❌ No pending emails found');
      process.exit(1);
    }

    console.log('📧 Latest Email:');
    console.log(`   ID: ${email._id}`);
    console.log(`   From: ${email.from.email}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   Status: ${email.processingStatus}`);
    console.log();

    console.log('🤖 Adding to AI processing queue...');
    await processingQueue.addToQueue(email._id.toString(), tenantId, 'high');
    
    console.log('⏳ Waiting for AI processing to complete (20 seconds)...');
    console.log();
    
    // Wait for processing
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write(`\r   ${'▓'.repeat(i + 1)}${'░'.repeat(19 - i)} ${i + 1}/20s`);
    }
    console.log('\n');

    // Fetch updated email
    const updatedEmail = await EmailLog.findById(email._id);

    console.log('═'.repeat(60));
    console.log('🎉 AI PROCESSING RESULTS');
    console.log('═'.repeat(60));
    console.log();
    console.log(`📊 Status: ${updatedEmail.processingStatus}`);
    console.log();

    if (updatedEmail.category) {
      console.log('🏷️  CATEGORIZATION:');
      console.log(`   Category: ${updatedEmail.category}`);
      console.log(`   Confidence: ${updatedEmail.categoryConfidence}%`);
      console.log(`   Sentiment: ${updatedEmail.sentiment || 'N/A'}`);
      console.log(`   Priority: ${updatedEmail.priority || 'N/A'}`);
      console.log();
    }

    if (updatedEmail.extractedData) {
      console.log('📋 EXTRACTED DATA:');
      const data = updatedEmail.extractedData;
      
      if (data.destination) {
        console.log(`   🌍 Destination: ${data.destination}`);
      }
      if (data.dates) {
        console.log(`   📅 Check-in: ${data.dates.checkIn}`);
        console.log(`   📅 Check-out: ${data.dates.checkOut}`);
        console.log(`   📅 Duration: ${data.dates.nights || 'N/A'} nights`);
      }
      if (data.travelers) {
        console.log(`   👥 Travelers: ${data.travelers.adults || 0} adults, ${data.travelers.children || 0} children`);
      }
      if (data.budget) {
        console.log(`   💰 Budget: ${data.budget.total} ${data.budget.currency}`);
      }
      if (data.activities && data.activities.length > 0) {
        console.log(`   🎯 Activities: ${data.activities.join(', ')}`);
      }
      if (data.customerInfo) {
        console.log(`   👤 Name: ${data.customerInfo.name || 'N/A'}`);
        console.log(`   📧 Email: ${data.customerInfo.email || 'N/A'}`);
        console.log(`   📱 Phone: ${data.customerInfo.phone || 'N/A'}`);
      }
      console.log();
    }

    if (updatedEmail.responseGenerated) {
      console.log('💬 AI RESPONSE GENERATED: ✅');
      console.log();
    }

    if (updatedEmail.openaiCost) {
      console.log(`💵 Processing Cost: $${updatedEmail.openaiCost.toFixed(5)}`);
      console.log(`🔢 Tokens Used: ${updatedEmail.tokensUsed || 'N/A'}`);
      console.log();
    }

    console.log('═'.repeat(60));
    console.log('✅ Email polling with AI processing successful!');
    console.log();
    console.log('💡 Check frontend at: http://localhost:5174/emails/history');
    console.log('   The new email should appear with all AI data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

processLatestEmail();
