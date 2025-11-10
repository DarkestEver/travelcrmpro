const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api/v1';
const TENANT_ID = '676d49be5ab4d8fef5d2c53d'; // Update with your tenant ID

// Test email data
const testEmails = [
  {
    name: 'Customer Inquiry - Dubai Honeymoon',
    data: {
      from: 'john.smith@gmail.com',
      to: 'travel@yourcompany.com',
      subject: 'Dubai Honeymoon Package Inquiry',
      text: `Hi,

My wife and I are planning our honeymoon and we're very interested in visiting Dubai. We're looking at traveling from December 15-22, 2024 (7 nights).

We'd like a luxury package with:
- 5-star hotel accommodation
- Airport transfers
- Some activities like desert safari and Burj Khalifa visit
- Romantic experiences

Our budget is around $6000 for both of us. Is this feasible?

Looking forward to hearing from you!

Best regards,
John Smith
+1-555-0123`,
      tenantId: TENANT_ID
    }
  },
  {
    name: 'Customer Inquiry - Bali Family Trip',
    data: {
      from: 'sarah.johnson@yahoo.com',
      to: 'travel@yourcompany.com',
      subject: 'Family vacation to Bali',
      text: `Hello,

We're a family of 4 (2 adults, 2 children ages 8 and 10) interested in a Bali vacation next summer (July 2024).

Requirements:
- 10 days / 9 nights
- Family-friendly resort with kids activities
- Must include flights from Los Angeles
- Half-board (breakfast + dinner)
- Some cultural tours and beach activities

Budget: approximately $8000-9000 total

Can you send us some package options?

Thanks!
Sarah Johnson`,
      tenantId: TENANT_ID
    }
  },
  {
    name: 'Supplier Package - Maldives Luxury',
    data: {
      from: 'packages@maldivesparadise.com',
      to: 'travel@yourcompany.com',
      subject: 'Updated Maldives Packages - Valid Until March 2024',
      text: `Dear Partner,

We're excited to share our updated Maldives luxury packages:

**Paradise Island Escape**
- Destination: Maldives (Male)
- Duration: 5 nights / 6 days
- Hotel: Ocean Paradise Resort (5-star)
- Room Type: Overwater Villa
- Valid: January 15 - March 31, 2024
- Price: $3,200 per person
- Child Price: $1,800 (2-12 years)

Includes:
- International flights from major cities
- Speedboat transfers
- All meals (full board)
- Complimentary spa session
- Sunset cruise
- Snorkeling equipment

Minimum: 2 pax, Maximum: 4 pax per villa
Available slots: 20 bookings

**Luxury Honeymoon Package**
- Destination: Maldives (Baa Atoll)
- Duration: 7 nights / 8 days
- Hotel: Sunset Beach Resort (5-star)
- Room Type: Beach Villa with Private Pool
- Valid: January 1 - April 30, 2024
- Price: $4,500 per person
- Includes: Honeymoon decorations, romantic dinner, couples massage

Contact us for bookings!

Best regards,
Maldives Paradise Tours
packages@maldivesparadise.com`,
      tenantId: TENANT_ID
    }
  },
  {
    name: 'Customer Inquiry - European Tour',
    data: {
      from: 'mike.williams@hotmail.com',
      to: 'travel@yourcompany.com',
      subject: 'Multi-city Europe trip',
      text: `Hi there,

I'm interested in a European tour covering multiple cities. Looking at September 2024.

Cities I want to visit:
- Paris (3 nights)
- Rome (3 nights)
- Barcelona (2 nights)

Travel group: 2 adults

Preferences:
- 4-star hotels
- Central locations
- Breakfast included
- Some guided tours

Budget: Around $5000 per person including flights from New York

Is this possible? What packages do you have?

Regards,
Mike Williams`,
      tenantId: TENANT_ID
    }
  }
];

async function sendTestEmail(email) {
  try {
    console.log(`\n📧 Sending: ${email.name}...`);
    
    const response = await axios.post(`${API_URL}/emails/webhook`, email.data);
    
    console.log(`✅ Success! Email ID: ${response.data.emailId}`);
    console.log(`   Status: ${response.data.message}`);
    
    return response.data.emailId;
  } catch (error) {
    console.error(`❌ Failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function waitForProcessing(emailId, maxWait = 30000) {
  console.log(`⏳ Waiting for email ${emailId} to be processed...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await axios.get(`${API_URL}/emails/${emailId}`, {
        headers: {
          // Add your auth token here if needed
          // 'Authorization': 'Bearer your-token-here'
        }
      });
      
      const email = response.data.data;
      
      if (email.processingStatus === 'processed') {
        console.log(`✅ Email processed!`);
        console.log(`   Category: ${email.category} (${email.categoryConfidence}% confidence)`);
        console.log(`   Sentiment: ${email.sentiment || 'N/A'}`);
        
        if (email.extractedData) {
          console.log(`   Data Extracted: Yes`);
          if (email.extractedData.destination) {
            console.log(`   Destination: ${email.extractedData.destination}`);
          }
        }
        
        if (email.matchingResults && email.matchingResults.length > 0) {
          console.log(`   Matches Found: ${email.matchingResults.length}`);
          console.log(`   Top Match Score: ${email.matchingResults[0].score}/100`);
        }
        
        if (email.responseGenerated) {
          console.log(`   Response Generated: Yes`);
        }
        
        console.log(`   AI Cost: $${email.openaiCost?.toFixed(4) || '0.0000'}`);
        
        return email;
      }
      
      if (email.processingStatus === 'failed') {
        console.log(`❌ Email processing failed!`);
        return email;
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error checking status: ${error.message}`);
    }
  }
  
  console.log(`⏰ Timeout waiting for processing`);
  return null;
}

async function runTests() {
  console.log('🚀 AI Email Automation Test Script');
  console.log('===================================\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}\n`);
  
  const results = [];
  
  for (const email of testEmails) {
    try {
      const emailId = await sendTestEmail(email);
      
      // Wait a bit before checking status
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const processedEmail = await waitForProcessing(emailId);
      
      results.push({
        name: email.name,
        success: processedEmail !== null,
        emailId,
        data: processedEmail
      });
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      results.push({
        name: email.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('================\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  console.log('\n\nDetailed Results:');
  results.forEach((result, idx) => {
    console.log(`\n${idx + 1}. ${result.name}`);
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (result.emailId) {
      console.log(`   Email ID: ${result.emailId}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n\n🎉 Test run complete!');
  console.log(`\nView dashboard at: http://localhost:5174/emails\n`);
}

// Run the tests
runTests().catch(console.error);
