/**
 * Test automatic email response sending
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const emailProcessingQueue = require('./src/services/emailProcessingQueue');

async function testAutoResponse() {
  console.log('🧪 Testing Automatic Email Response Sending\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');
    
    // Create a test email inquiry
    const testEmail = new EmailLog({
      messageId: `test-${Date.now()}@travelcrm.com`,
      emailAccountId: new mongoose.Types.ObjectId(),
      tenantId: new mongoose.Types.ObjectId('690ce6d206c104addbfedb65'),
      from: {
        email: 'test.customer@example.com',
        name: 'Test Customer'
      },
      to: [{
        email: 'info@travelagency.com',
        name: 'Travel Agency'
      }],
      subject: 'Family vacation to Paris',
      bodyText: `Hi,

I'm interested in planning a family vacation to Paris.

We are 2 adults and would like to travel sometime in June 2024 for about 7 days.

Our budget is around $3000 per person.

Could you send me some package options?

Thanks,
Test Customer`,
      bodyHtml: '',
      receivedAt: new Date(),
      source: 'manual',
      processingStatus: 'pending'
    });
    
    await testEmail.save();
    console.log(`📧 Created test email: ${testEmail._id}\n`);
    
    // Add to processing queue
    console.log('⚙️  Adding email to processing queue...\n');
    await emailProcessingQueue.addEmail(testEmail._id, testEmail.tenantId);
    
    // Wait for processing
    console.log('⏳ Waiting for processing (30 seconds)...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Check results
    const processedEmail = await EmailLog.findById(testEmail._id);
    
    console.log('='.repeat(80));
    console.log('📊 PROCESSING RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n✅ Status: ${processedEmail.processingStatus}`);
    console.log(`✅ Category: ${processedEmail.category} (${processedEmail.categoryConfidence}% confidence)`);
    
    if (processedEmail.extractedData) {
      console.log('\n📋 Extracted Data:');
      console.log(`   Destination: ${processedEmail.extractedData.destination}`);
      console.log(`   Dates: ${processedEmail.extractedData.dates?.startDate} to ${processedEmail.extractedData.dates?.endDate}`);
      console.log(`   Travelers: ${processedEmail.extractedData.travelers?.adults} adults`);
      console.log(`   Budget: ${processedEmail.extractedData.budget?.currency} ${processedEmail.extractedData.budget?.amount}`);
    }
    
    if (processedEmail.itineraryMatching) {
      console.log('\n🗺️  Itinerary Matching:');
      console.log(`   Workflow Action: ${processedEmail.itineraryMatching.workflowAction}`);
      console.log(`   Reason: ${processedEmail.itineraryMatching.reason}`);
      console.log(`   Matches Found: ${processedEmail.itineraryMatching.matchCount}`);
    }
    
    if (processedEmail.generatedResponse) {
      console.log('\n✉️  Generated Response:');
      console.log(`   Subject: ${processedEmail.generatedResponse.subject}`);
      console.log(`   Body Length: ${processedEmail.generatedResponse.body?.length} chars`);
      console.log(`   Cost: $${processedEmail.generatedResponse.cost?.toFixed(4)}`);
    }
    
    if (processedEmail.responseSentAt) {
      console.log('\n📤 EMAIL SENT!');
      console.log(`   ✅ Sent At: ${processedEmail.responseSentAt}`);
      console.log(`   ✅ To: ${processedEmail.from.email}`);
      console.log(`   ✅ Message ID: ${processedEmail.responseId}`);
      console.log('\n🎉 SUCCESS: Customer received automatic response!');
    } else {
      console.log('\n⚠️  WARNING: Response was generated but NOT sent');
      if (processedEmail.processingError) {
        console.log(`   Error: ${processedEmail.processingError}`);
      }
    }
    
    console.log(`\n💰 Total Cost: $${processedEmail.openaiCost?.toFixed(4)}`);
    console.log(`🔢 Tokens Used: ${processedEmail.tokensUsed}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

testAutoResponse();
