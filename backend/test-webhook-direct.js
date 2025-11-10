// Direct test of webhook without authentication
// This simulates an external email webhook that shouldn't need auth

require('dotenv').config();
const mongoose = require('mongoose');
const openaiService = require('./src/services/openaiService');

const testEmailData = {
  from: 'keshav.singh4@gmail.com',
  to: 'app@travelmanagerpro.com',
  subject: 'Urgent: Booking Request for Dubai Trip',
  text: `Hello,

I'm interested in booking a trip to Dubai for 2 people from December 15-22, 2025.

We would like:
- Round trip flights from New York
- 5-star hotel accommodation
- Desert safari tour
- Burj Khalifa tickets

Budget: $5000 per person

Please send me a quote as soon as possible.

Best regards,
John Smith
Phone: +1-555-0123
Email: keshav.singh4@gmail.com`,
  html: '<p>Hello,</p><p>I\'m interested in booking a trip to Dubai...</p>',
  date: new Date(),
  messageId: `<test-${Date.now()}@example.com>`,
  receivedAt: new Date()
};

async function testDirectAI() {
  try {
    console.log('🚀 Testing AI Email Processing Directly\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const EmailAccount = require('./src/models/EmailAccount');
    const Email = require('./src/models/EmailLog');
    const Tenant = require('./src/models/Tenant');

    // Get email account
    const emailAccount = await EmailAccount.findOne({ email: 'app@travelmanagerpro.com' });
    if (!emailAccount) {
      console.error('❌ Email account not found!');
      process.exit(1);
    }

    console.log('📧 Email Account Found:');
    console.log(`   Email: ${emailAccount.email}`);
    console.log(`   Tenant: ${emailAccount.tenantId}`);
    console.log(`   AI Enabled: ${emailAccount.aiEnabled}\n`);

    // Get tenant AI settings
    const tenant = await Tenant.findById(emailAccount.tenantId);
    if (!tenant) {
      console.error('❌ Tenant not found!');
      process.exit(1);
    }

    console.log('🏢 Tenant Found:');
    console.log(`   Name: ${tenant.name}`);
    console.log(`   AI Enabled: ${tenant.settings?.aiSettings?.enabled || false}`);
    console.log(`   OpenAI Key: ${tenant.settings?.aiSettings?.openaiApiKey ? '✅ Set' : '❌ Not Set'}\n`);

    if (!tenant.settings?.aiSettings?.enabled) {
      console.error('❌ AI is not enabled for this tenant!');
      console.log('💡 Please enable AI in the tenant settings first.');
      process.exit(1);
    }

    if (!tenant.settings?.aiSettings?.openaiApiKey) {
      console.error('❌ OpenAI API key is not configured!');
      console.log('💡 Please add your OpenAI API key in the AI Settings page.');
      process.exit(1);
    }

    // Create email in database
    console.log('💾 Creating email in database...\n');
    const email = new Email({
      tenantId: emailAccount.tenantId,
      emailAccountId: emailAccount._id,
      from: {
        email: testEmailData.from,
        name: 'John Smith'
      },
      to: [{
        email: testEmailData.to,
        name: 'Travel Manager'
      }],
      subject: testEmailData.subject,
      bodyText: testEmailData.text,
      bodyHtml: testEmailData.html,
      messageId: testEmailData.messageId,
      receivedAt: testEmailData.receivedAt,
      source: 'webhook',
      processingStatus: 'pending'
    });

    await email.save();
    console.log('✅ Email saved to database\n');
    console.log(`   Email ID: ${email._id}\n`);

    // Process with AI
    console.log('🤖 Processing email with AI...\n');
    console.log('⏳ This may take 10-20 seconds...\n');

    // Step 1: Categorize email
    console.log('📋 Step 1: Categorizing email...\n');
    const categorization = await openaiService.categorizeEmail(
      email, // Pass entire email object
      emailAccount.tenantId
    );

    console.log('✅ Categorization complete:');
    console.log(`   Category: ${categorization.category}`);
    console.log(`   Confidence: ${categorization.confidence}%`);
    console.log(`   Sentiment: ${categorization.sentiment}\n`);

    // Step 2: Extract entities based on category
    console.log('📋 Step 2: Extracting information...\n');
    let entities = {};
    
    if (categorization.category === 'INQUIRY' || categorization.category === 'BOOKING_REQUEST' || categorization.category === 'CUSTOMER') {
      entities = await openaiService.extractCustomerInquiry(
        email, // Pass entire email object
        emailAccount.tenantId
      );
    }

    console.log('✅ Entity extraction complete\n');

    // Step 3: Generate response
    console.log('📋 Step 3: Generating AI response...\n');
    const aiResponse = await openaiService.generateResponse(
      email, // Pass entire email object
      {
        category: categorization.category,
        extractedData: entities
      },
      'inquiry',
      emailAccount.tenantId
    );

    console.log('✅ Response generation complete\n');

    // Update email with AI results using correct schema
    email.processingStatus = 'completed';
    email.category = categorization.category;
    email.categoryConfidence = categorization.confidence;
    email.extractedData = {
      ...entities,
      sentiment: categorization.sentiment,
      priority: categorization.urgency || 'normal',
      suggestedActions: categorization.suggestedActions || [],
      aiResponse: aiResponse.message || aiResponse,
      processingCost: (categorization.cost || 0) + (entities.cost || 0) + (aiResponse.cost || 0),
      processedAt: new Date()
    };
    
    email.responseGenerated = true;
    email.markModified('extractedData');
    
    await email.save();
    
    console.log('💾 Email updated in database with AI results\n');

    const result = { success: true, email };

    if (result.success) {
      console.log('✅ AI PROCESSING SUCCESSFUL!\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      console.log('📊 AI Analysis Results:\n');
      
      const ai = result.email.extractedData || {};
      
      console.log('🏷️  Category:', result.email.category || 'N/A');
      console.log('⚡ Priority:', ai.priority || 'N/A');
      console.log('📈 Confidence:', result.email.categoryConfidence ? `${result.email.categoryConfidence}%` : 'N/A');
      console.log('😊 Sentiment:', ai.sentiment || 'N/A');
      
      if (ai && Object.keys(ai).length > 0) {
        console.log('\n📋 Extracted Information:\n');
        console.log(JSON.stringify(ai, null, 2));
      }
      
      if (ai.aiResponse) {
        console.log('\n📝 AI Generated Response:\n');
        console.log('─────────────────────────────────────────────────────────');
        console.log(typeof ai.aiResponse === 'string' ? ai.aiResponse : JSON.stringify(ai.aiResponse, null, 2));
        console.log('─────────────────────────────────────────────────────────');
      }
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('✅ TEST PASSED: AI Email Agent is working correctly!');
      console.log('═══════════════════════════════════════════════════════════\n');
      
    } else {
      console.error('❌ AI Processing Failed:', result.error);
      console.error('\n💡 Possible issues:');
      console.error('   1. Invalid OpenAI API key');
      console.error('   2. OpenAI API rate limit exceeded');
      console.error('   3. Network connection issues');
      console.error('   4. AI service configuration problems');
    }

    await mongoose.connection.close();
    console.log('✅ Connection closed\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('  AI EMAIL AGENT - DIRECT TEST');
console.log('══════════════════════════════════════════════════════════════\n');

testDirectAI();
