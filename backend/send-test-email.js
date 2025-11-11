/**
 * Send Test Email to Verify Current Extraction
 * This will create a webhook-style email entry to test extraction
 */

const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const { processEmail } = require('./src/services/emailProcessingQueue');

async function sendTestEmail() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Your tenant ID and email account ID
    const tenantId = '690ce6d206c104addbfedb65';
    const emailAccountId = '6910eef8ad00888b4c012e75';

    // Test Email 1: Bali Honeymoon (Test Case 2 - Start Date + Duration)
    const testEmail = {
      messageId: `test-bali-${Date.now()}@test.com`,
      emailAccountId,
      from: {
        email: 'michael.chen@email.com',
        name: 'Michael Chen'
      },
      to: [
        {
          email: 'app@travelmanagerpro.com',
          name: 'Travel Agent'
        }
      ],
      subject: 'Bali Honeymoon Package - NEW TEST',
      bodyText: `Hello,

My fiancé and I are planning our honeymoon to Bali starting March 15 for 10 nights.

We're looking for a romantic, luxury experience. Budget is flexible, around $5,000 per person.

We love beaches, spa treatments, and cultural experiences.

Thanks,
Michael Chen
(555) 987-6543
michael.chen@email.com`,
      bodyHtml: `<p>Hello,</p>
<p>My fiancé and I are planning our honeymoon to Bali starting March 15 for 10 nights.</p>
<p>We're looking for a romantic, luxury experience. Budget is flexible, around $5,000 per person.</p>
<p>We love beaches, spa treatments, and cultural experiences.</p>
<p>Thanks,<br>
Michael Chen<br>
(555) 987-6543<br>
michael.chen@email.com</p>`,
      receivedAt: new Date(),
      direction: 'incoming',
      source: 'webhook',
      tenantId,
      processingStatus: 'pending'
    };

    console.log('📧 Creating test email in database...');
    const email = await EmailLog.create(testEmail);
    console.log(`✅ Email created with ID: ${email._id}\n`);

    console.log('🤖 Processing email with AI...');
    await processEmail(email._id.toString());
    
    console.log('\n⏳ Waiting for processing to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check results
    const processed = await EmailLog.findById(email._id);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXTRACTION RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n✉️ Email Info:');
    console.log(`   Subject: ${processed.subject}`);
    console.log(`   From: ${processed.from.email}`);
    console.log(`   Category: ${processed.category}`);
    console.log(`   Status: ${processed.processingStatus}`);
    
    if (processed.extractedData) {
      console.log('\n✅ EXTRACTED DATA:');
      console.log(JSON.stringify(processed.extractedData, null, 2));
    } else {
      console.log('\n❌ No extracted data found!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 Now refresh your UI to see this email!');
    console.log('='.repeat(60));
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

sendTestEmail();
