// Test AI Email Agent with Actual Email Sending
// Run with: node test-email-ai.js

require('dotenv').config();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

async function sendTestEmail() {
  try {
    console.log('🚀 Testing AI Email Agent with Real Email\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const EmailAccount = require('./src/models/EmailAccount');
    
    // Get the first active email account
    const emailAccount = await EmailAccount.findOne({ 
      isActive: true,
      aiEnabled: true 
    });

    if (!emailAccount) {
      console.error('❌ No active email account with AI enabled found!');
      console.log('\n💡 Please configure an email account with AI enabled first.');
      process.exit(1);
    }

    console.log('📧 Found Email Account:');
    console.log(`   Email: ${emailAccount.email}`);
    console.log(`   SMTP Host: ${emailAccount.smtpHost}`);
    console.log(`   SMTP Port: ${emailAccount.smtpPort}`);
    console.log(`   AI Enabled: ${emailAccount.aiEnabled}`);
    console.log(`   AI Auto-Process: ${emailAccount.aiAutoProcess}\n`);

    // Create test transport (using Gmail for testing)
    const testTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.TEST_EMAIL_USER || 'your-test-email@gmail.com',
        pass: process.env.TEST_EMAIL_PASS || 'your-app-password'
      }
    });

    const testEmailContent = {
      from: 'keshav.singh4@gmail.com', // Sender email
      to: 'app@travelmanagerpro.com', // Your configured email account
      subject: 'Test: Urgent Booking Request for Paris Trip',
      text: `Hello Travel Team,

I need to book an urgent trip to Paris for my family.

Details:
- Destination: Paris, France
- Travel Dates: December 20-27, 2025
- Number of Travelers: 4 (2 adults, 2 children)
- Budget: $8,000 total
- Requirements:
  * Direct flights from Los Angeles
  * 4-star hotel near Eiffel Tower
  * Louvre Museum tickets
  * Seine River cruise
  * Airport transfers

This is urgent as we need to finalize by this week.

Contact Information:
Name: Sarah Johnson
Phone: +1-555-9876
Email: keshav.singh4@gmail.com

Looking forward to your quote.

Best regards,
Sarah`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Urgent Booking Request</h2>
          <p>Hello Travel Team,</p>
          <p>I need to book an urgent trip to Paris for my family.</p>
          
          <h3>Details:</h3>
          <ul>
            <li><strong>Destination:</strong> Paris, France</li>
            <li><strong>Travel Dates:</strong> December 20-27, 2025</li>
            <li><strong>Travelers:</strong> 4 (2 adults, 2 children)</li>
            <li><strong>Budget:</strong> $8,000 total</li>
          </ul>
          
          <h3>Requirements:</h3>
          <ul>
            <li>Direct flights from Los Angeles</li>
            <li>4-star hotel near Eiffel Tower</li>
            <li>Louvre Museum tickets</li>
            <li>Seine River cruise</li>
            <li>Airport transfers</li>
          </ul>
          
          <p><strong>This is urgent</strong> as we need to finalize by this week.</p>
          
          <h3>Contact Information:</h3>
          <p>
            Name: Sarah Johnson<br>
            Phone: +1-555-9876<br>
            Email: keshav.singh4@gmail.com
          </p>
          
          <p>Looking forward to your quote.</p>
          <p>Best regards,<br>Sarah</p>
        </div>
      `
    };

    console.log('📨 Sending Test Email...');
    console.log(`   From: ${testEmailContent.from}`);
    console.log(`   To: ${testEmailContent.to}`);
    console.log(`   Subject: ${testEmailContent.subject}\n`);

    const info = await testTransport.sendMail(testEmailContent);
    
    console.log('✅ Email Sent Successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);

    console.log('⏳ Waiting for AI to process the email...');
    console.log('   (This may take 30-60 seconds depending on email polling interval)\n');

    // Wait and check for processed email
    const Email = require('./src/models/Email');
    
    console.log('🔍 Checking for processed email in database...');
    
    let attempts = 0;
    const maxAttempts = 12; // Check for 2 minutes (12 * 10 seconds)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
      
      const processedEmail = await Email.findOne({
        subject: testEmailContent.subject,
        'aiMetadata.processed': true
      }).sort({ createdAt: -1 });

      if (processedEmail) {
        console.log('\n✅ Email Found and Processed by AI!\n');
        console.log('📧 Email Details:');
        console.log(`   ID: ${processedEmail._id}`);
        console.log(`   From: ${processedEmail.from}`);
        console.log(`   Subject: ${processedEmail.subject}`);
        console.log(`   Received: ${processedEmail.receivedAt}`);
        
        if (processedEmail.aiMetadata) {
          console.log('\n🤖 AI Analysis:');
          console.log(`   Category: ${processedEmail.aiMetadata.category}`);
          console.log(`   Priority: ${processedEmail.aiMetadata.priority}`);
          console.log(`   Confidence: ${processedEmail.aiMetadata.confidence}%`);
          console.log(`   Sentiment: ${processedEmail.aiMetadata.sentiment}`);
          
          if (processedEmail.aiMetadata.extractedEntities) {
            console.log('\n📋 Extracted Information:');
            const entities = processedEmail.aiMetadata.extractedEntities;
            console.log(JSON.stringify(entities, null, 2));
          }
          
          if (processedEmail.aiMetadata.suggestedActions) {
            console.log('\n💡 AI Suggested Actions:');
            processedEmail.aiMetadata.suggestedActions.forEach((action, i) => {
              console.log(`   ${i + 1}. ${action}`);
            });
          }
        }
        
        if (processedEmail.aiResponse) {
          console.log('\n📝 AI Generated Response:');
          console.log('─────────────────────────────────────────────────────');
          console.log(processedEmail.aiResponse);
          console.log('─────────────────────────────────────────────────────');
        }
        
        console.log('\n✅ TEST PASSED: AI Email Processing Complete!');
        break;
      }
      
      console.log(`   Attempt ${attempts}/${maxAttempts} - Not found yet, checking again...`);
    }
    
    if (attempts >= maxAttempts) {
      console.log('\n⚠️  Email not processed within timeout period.');
      console.log('💡 Check:');
      console.log('   1. Email polling service is running');
      console.log('   2. Email account credentials are correct');
      console.log('   3. AI settings are properly configured');
      console.log('   4. Check backend logs for errors');
    }

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('  AI EMAIL AGENT - REAL EMAIL TEST');
console.log('══════════════════════════════════════════════════════════════\n');

sendTestEmail();
