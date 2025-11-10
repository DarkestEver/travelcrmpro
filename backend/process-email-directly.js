const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');

async function processEmailDirectly() {
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
    console.log(`   Body preview: ${(email.bodyText || '').substring(0, 100)}...`);
    console.log(`   Status: ${email.processingStatus}`);
    console.log();

    console.log('🤖 Processing with AI...\n');

    // STEP 1: Categorize
    console.log('Step 1: Categorizing email...');
    const categorization = await openaiService.categorizeEmail(email, tenantId);
    
    email.category = categorization.category;
    email.categoryConfidence = categorization.confidence;
    email.sentiment = categorization.sentiment;
    email.priority = categorization.priority;
    email.tags = [categorization.subcategory];
    email.openaiCost = (email.openaiCost || 0) + (categorization.cost || 0);
    email.tokensUsed = (email.tokensUsed || 0) + (categorization.tokens || 0);
    
    await email.save();
    console.log(`   ✅ Category: ${categorization.category} (${categorization.confidence}% confidence)`);
    console.log(`   ✅ Sentiment: ${categorization.sentiment}`);
    console.log(`   ✅ Priority: ${categorization.priority}`);
    console.log();

    // STEP 2: Extract data if customer inquiry
    if (categorization.category === 'CUSTOMER') {
      console.log('Step 2: Extracting customer inquiry data...');
      const extraction = await openaiService.extractCustomerInquiry(email, tenantId);
      
      email.extractedData = extraction.data;
      email.openaiCost = (email.openaiCost || 0) + (extraction.cost || 0);
      email.tokensUsed = (email.tokensUsed || 0) + (extraction.tokens || 0);
      
      await email.save();
      console.log(`   ✅ Extracted data with ${extraction.confidence}% confidence`);
      console.log();
    }

    // STEP 3: Generate response
    console.log('Step 3: Generating AI response...');
    const response = await openaiService.generateResponse(
      email,
      { extractedData: email.extractedData },
      'customer_inquiry',
      tenantId
    );
    
    email.aiResponse = response.response;
    email.responseGenerated = true;
    email.openaiCost = (email.openaiCost || 0) + (response.cost || 0);
    email.tokensUsed = (email.tokensUsed || 0) + (response.tokens || 0);
    email.processingStatus = 'completed';
    email.processedAt = new Date();
    
    await email.save();
    console.log(`   ✅ Response generated`);
    console.log();

    // Display results
    console.log('═'.repeat(70));
    console.log('🎉 AI PROCESSING COMPLETE!');
    console.log('═'.repeat(70));
    console.log();
    
    console.log('🏷️  CATEGORIZATION:');
    console.log(`   Category: ${email.category}`);
    console.log(`   Confidence: ${email.categoryConfidence}%`);
    console.log(`   Sentiment: ${email.sentiment}`);
    console.log(`   Priority: ${email.priority}`);
    console.log();

    if (email.extractedData) {
      console.log('📋 EXTRACTED DATA:');
      const data = email.extractedData;
      
      if (data.destination) {
        console.log(`   🌍 Destination: ${data.destination}`);
      }
      if (data.dates) {
        console.log(`   📅 Check-in: ${data.dates.checkIn}`);
        console.log(`   📅 Check-out: ${data.dates.checkOut}`);
        if (data.dates.nights) {
          console.log(`   📅 Duration: ${data.dates.nights} nights`);
        }
      }
      if (data.travelers) {
        console.log(`   👥 Adults: ${data.travelers.adults || 0}`);
        if (data.travelers.children) {
          console.log(`   👥 Children: ${data.travelers.children}`);
        }
      }
      if (data.budget) {
        console.log(`   💰 Budget: ${data.budget.total} ${data.budget.currency}`);
      }
      if (data.activities && data.activities.length > 0) {
        console.log(`   🎯 Activities: ${data.activities.join(', ')}`);
      }
      if (data.customerInfo) {
        console.log(`   👤 Customer: ${data.customerInfo.name || 'N/A'}`);
        console.log(`   📧 Email: ${data.customerInfo.email || 'N/A'}`);
        console.log(`   📱 Phone: ${data.customerInfo.phone || 'N/A'}`);
      }
      console.log();
    }

    if (email.aiResponse) {
      console.log('💬 AI RESPONSE:');
      console.log('─'.repeat(70));
      console.log(email.aiResponse);
      console.log('─'.repeat(70));
      console.log();
    }

    console.log('💵 COST & USAGE:');
    console.log(`   Total Cost: $${email.openaiCost.toFixed(5)}`);
    console.log(`   Tokens Used: ${email.tokensUsed}`);
    console.log();

    console.log('═'.repeat(70));
    console.log();
    console.log('✅ Email successfully processed and saved to database!');
    console.log();
    console.log('📊 Summary:');
    console.log(`   Email ID: ${email._id}`);
    console.log(`   Status: ${email.processingStatus}`);
    console.log(`   Category: ${email.category} (${email.categoryConfidence}%)`);
    console.log(`   Response Generated: ${email.responseGenerated ? '✅' : '❌'}`);
    console.log();
    console.log('🌐 View in frontend:');
    console.log(`   http://localhost:5174/emails/${email._id}`);
    console.log();
    console.log('💡 The email should now appear in your email list with all AI data!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

processEmailDirectly();
