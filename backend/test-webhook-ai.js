// Test AI Email Agent via Webhook
// Run with: node test-webhook-ai.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test email data - simulating a booking inquiry
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
  date: new Date().toISOString(),
  messageId: `<test-${Date.now()}@example.com>`,
  inReplyTo: null,
  references: null,
  headers: {
    'received': ['from mail.example.com'],
    'x-mailer': ['Test Mailer']
  }
};

async function testWebhookAI() {
  try {
    console.log('🚀 Testing AI Email Agent via Webhook\n');
    
    // Step 1: Login to get JWT token
    console.log('🔐 Logging in as operator...\n');
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        email: 'operator@travelcrm.com',
        password: 'Operator@123'
      }
    );
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');
    
    console.log('📧 Test Email:');
    console.log(`   From: ${testEmailData.from}`);
    console.log(`   Subject: ${testEmailData.subject}`);
    console.log(`   Content: ${testEmailData.text.substring(0, 100)}...\n`);

    console.log('🔄 Sending to webhook endpoint...\n');

    const response = await axios.post(
      `${BASE_URL}/email-accounts/webhook`,
      testEmailData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000 // 30 second timeout for AI processing
      }
    );

    console.log('✅ Response Status:', response.status);
    console.log('\n📊 AI Processing Results:\n');
    
    const result = response.data;
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      
      if (result.email) {
        console.log('\n📧 Email Details:');
        console.log(`   ID: ${result.email._id}`);
        console.log(`   From: ${result.email.from}`);
        console.log(`   Subject: ${result.email.subject}`);
        
        if (result.email.aiMetadata) {
          console.log('\n🤖 AI Metadata:');
          console.log(`   Category: ${result.email.aiMetadata.category}`);
          console.log(`   Priority: ${result.email.aiMetadata.priority}`);
          console.log(`   Confidence: ${result.email.aiMetadata.confidence}%`);
          console.log(`   Sentiment: ${result.email.aiMetadata.sentiment}`);
          
          if (result.email.aiMetadata.extractedEntities) {
            console.log('\n📋 Extracted Entities:');
            const entities = result.email.aiMetadata.extractedEntities;
            
            if (entities.destination) {
              console.log(`   🌍 Destination: ${entities.destination}`);
            }
            if (entities.travelDates) {
              console.log(`   📅 Travel Dates: ${entities.travelDates.start} to ${entities.travelDates.end}`);
            }
            if (entities.numberOfTravelers) {
              console.log(`   👥 Travelers: ${entities.numberOfTravelers}`);
            }
            if (entities.budget) {
              console.log(`   💰 Budget: ${entities.budget}`);
            }
            if (entities.services && entities.services.length > 0) {
              console.log(`   🎯 Services: ${entities.services.join(', ')}`);
            }
            if (entities.contactInfo) {
              console.log(`   📞 Contact: ${JSON.stringify(entities.contactInfo, null, 4)}`);
            }
          }
          
          if (result.email.aiMetadata.suggestedActions && result.email.aiMetadata.suggestedActions.length > 0) {
            console.log('\n💡 Suggested Actions:');
            result.email.aiMetadata.suggestedActions.forEach((action, index) => {
              console.log(`   ${index + 1}. ${action}`);
            });
          }
        }
        
        if (result.email.aiResponse) {
          console.log('\n📝 AI Generated Response:');
          console.log('─────────────────────────────────────────────────────');
          console.log(result.email.aiResponse.substring(0, 300));
          console.log('─────────────────────────────────────────────────────');
        }
      }
      
      console.log('\n✅ TEST PASSED: AI Email Processing Successful!');
    } else {
      console.error('❌ TEST FAILED:', result.message);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    
    if (error.response) {
      console.error('\n📄 Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('📄 Status:', error.response.status);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure the backend server is running on port 5000');
    }
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('  AI EMAIL AGENT WEBHOOK TEST');
console.log('══════════════════════════════════════════════════════════════\n');

testWebhookAI();
