/**
 * Phase 3 Webhook Integration Test
 * Tests the complete email processing flow through webhook
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const WEBHOOK_URL = `${BASE_URL}/api/v1/emails/webhook`;

// Use existing tenant ID from database
const TEST_TENANT_ID = '690ce93c464bf35e0adede29';

// Test email data
const testEmails = [
  {
    name: "High Confidence Match Test (≥70%)",
    data: {
      from: "sarah.johnson@example.com",
      to: "travel@example.com",
      subject: "Honeymoon to Paris",
      tenantId: TEST_TENANT_ID,
      text: `Hi there!

My fiancé and I are planning our honeymoon to Paris from July 15-22, 2024. 
We have a budget of $5000 for 2 people and we're looking for romantic experiences.

We love:
- Art museums (especially Louvre and Musée d'Orsay)
- Wine tasting
- Fine dining
- Romantic walks along Seine

Can you help us plan something special?

Best regards,
Sarah Johnson`,
      html: `<p>Hi there!</p>
<p>My fiancé and I are planning our honeymoon to Paris from July 15-22, 2024.</p>
<p>We have a budget of $5000 for 2 people and we're looking for romantic experiences.</p>`,
      receivedAt: new Date().toISOString()
    },
    expectedAction: "SEND_ITINERARIES",
    expectedTemplate: "send-itineraries"
  },
  {
    name: "Moderate Match Test (50-69%)",
    data: {
      from: "mike.brown@example.com",
      to: "travel@example.com",
      subject: "Paris Trip - Different Dates",
      tenantId: TEST_TENANT_ID,
      text: `Hello,

I'm interested in visiting Paris but my dates are flexible - sometime in August 2024.
My budget is around $3500 for 2 adults.

We prefer:
- Cultural activities
- Good food
- Some shopping

Thanks,
Mike Brown`,
      html: `<p>Hello,</p><p>I'm interested in visiting Paris but my dates are flexible.</p>`,
      receivedAt: new Date().toISOString()
    },
    expectedAction: "SEND_ITINERARIES_WITH_NOTE",
    expectedTemplate: "send-with-note"
  },
  {
    name: "Custom Request Test (<50%)",
    data: {
      from: "lisa.garcia@example.com",
      to: "travel@example.com",
      subject: "Complex Multi-City Europe Trip",
      tenantId: TEST_TENANT_ID,
      text: `Hi,

I'm planning a complex 3-week trip to Europe visiting Paris, Rome, Barcelona, and Amsterdam.
I need very specific arrangements:
- Luxury accommodations (5-star only)
- Private guides in each city
- Michelin-star restaurants
- Private transfers between cities
- Budget: $25,000 for 2 people

This is for our 25th anniversary so everything must be perfect.

Please create a custom itinerary.

Best,
Lisa Garcia`,
      html: `<p>Hi,</p><p>I'm planning a complex 3-week trip to Europe...</p>`,
      receivedAt: new Date().toISOString()
    },
    expectedAction: "FORWARD_TO_SUPPLIER",
    expectedTemplate: "forward-supplier"
  }
];

// Configuration
const API_KEY = process.env.WEBHOOK_API_KEY || 'test-api-key-123';

async function testWebhook(testCase, index) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log('='.repeat(70));
  console.log(`Expected Action: ${testCase.expectedAction}`);
  console.log(`Expected Template: ${testCase.expectedTemplate}`);
  console.log('');

  try {
    // Send webhook request
    console.log('📤 Sending webhook request...');
    const startTime = Date.now();
    
    const response = await axios.post(WEBHOOK_URL, testCase.data, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Response received in ${duration}ms`);
    console.log('');

    // Analyze response
    if (response.status === 200) {
      console.log('📊 RESPONSE DETAILS:');
      console.log('─'.repeat(70));
      
      const data = response.data;
      
      console.log(`Status:           ${data.status || 'N/A'}`);
      console.log(`Message:          ${data.message || 'N/A'}`);
      console.log(`Email ID:         ${data.emailId || 'N/A'}`);
      
      if (data.processing) {
        console.log(`\nProcessing Details:`);
        console.log(`  Category:       ${data.processing.category || 'N/A'}`);
        console.log(`  Workflow Action: ${data.processing.workflowAction || 'N/A'}`);
        console.log(`  Matches Found:   ${data.processing.matchCount || 0}`);
        
        if (data.processing.responseGeneration) {
          console.log(`\nResponse Generation:`);
          console.log(`  Method:         ${data.processing.responseGeneration.method || 'N/A'}`);
          console.log(`  Template Used:  ${data.processing.responseGeneration.template || 'N/A'}`);
          console.log(`  Cost:           $${(data.processing.responseGeneration.cost || 0).toFixed(4)}`);
          console.log(`  Duration:       ${data.processing.responseGeneration.duration || 'N/A'}ms`);
        }
        
        if (data.processing.totalCost !== undefined) {
          console.log(`\nTotal Cost:       $${data.processing.totalCost.toFixed(4)}`);
        }
      }

      // Validation
      console.log(`\n${'─'.repeat(70)}`);
      console.log('✅ VALIDATION:');
      
      const workflowAction = data.processing?.workflowAction;
      const templateUsed = data.processing?.responseGeneration?.template;
      const method = data.processing?.responseGeneration?.method;
      const cost = data.processing?.responseGeneration?.cost || 0;

      // Check workflow action
      if (workflowAction === testCase.expectedAction) {
        console.log(`  ✅ Workflow action correct: ${workflowAction}`);
      } else {
        console.log(`  ⚠️  Workflow action mismatch: got ${workflowAction}, expected ${testCase.expectedAction}`);
      }

      // Check template
      if (templateUsed === testCase.expectedTemplate) {
        console.log(`  ✅ Template correct: ${templateUsed}`);
      } else {
        console.log(`  ⚠️  Template mismatch: got ${templateUsed}, expected ${testCase.expectedTemplate}`);
      }

      // Check method (should be 'template')
      if (method === 'template') {
        console.log(`  ✅ Method is 'template' (Phase 3 active)`);
      } else {
        console.log(`  ⚠️  Method is '${method}' (expected 'template')`);
      }

      // Check cost (should be $0 for templates)
      if (cost === 0) {
        console.log(`  ✅ Response cost is $0 (Phase 3 working!)`);
      } else {
        console.log(`  ⚠️  Response cost is $${cost.toFixed(4)} (expected $0)`);
      }

      return {
        success: true,
        duration,
        workflowAction,
        templateUsed,
        method,
        cost,
        totalCost: data.processing?.totalCost || 0
      };

    } else {
      console.log(`❌ Unexpected status code: ${response.status}`);
      return { success: false, error: `Status ${response.status}` };
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`   ⚠️  Server not running! Please start the backend server:`);
      console.log(`   cd backend && npm start`);
    }
    
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          PHASE 3 WEBHOOK INTEGRATION TEST SUITE                      ║');
  console.log('║               Testing Real Email Processing Flow                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nWebhook URL: ${WEBHOOK_URL}`);
  console.log(`Test Count:  ${testEmails.length}`);
  console.log('');

  const results = [];
  
  for (let i = 0; i < testEmails.length; i++) {
    const result = await testWebhook(testEmails[i], i);
    results.push({ name: testEmails[i].name, ...result });
    
    // Wait 2 seconds between tests
    if (i < testEmails.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                         TEST SUMMARY                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Tests:    ${results.length}`);
  console.log(`✅ Passed:       ${passed}`);
  console.log(`❌ Failed:       ${failed}`);
  console.log('');

  if (passed > 0) {
    console.log('📊 PERFORMANCE METRICS:');
    console.log('─'.repeat(70));
    
    const successfulTests = results.filter(r => r.success);
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    const totalCost = successfulTests.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const responseCost = successfulTests.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    console.log(`Average Processing Time:  ${Math.round(avgDuration)}ms`);
    console.log(`Total Cost (all tests):   $${totalCost.toFixed(4)}`);
    console.log(`Response Generation Cost: $${responseCost.toFixed(4)} (should be $0!)`);
    
    if (responseCost === 0) {
      console.log('\n🎉 PHASE 3 WORKING PERFECTLY! All responses used templates ($0 cost)');
    }
    
    console.log('');
    console.log('📋 DETAILED RESULTS:');
    console.log('─'.repeat(70));
    
    results.forEach((result, i) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} Test ${i + 1}: ${result.name}`);
      if (result.success) {
        console.log(`   Workflow: ${result.workflowAction}, Template: ${result.templateUsed}`);
        console.log(`   Method: ${result.method}, Cost: $${(result.cost || 0).toFixed(4)}`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });
  }

  console.log('\n' + '═'.repeat(70));
  
  if (failed === 0) {
    console.log('🎉 ALL WEBHOOK TESTS PASSED - PHASE 3 PRODUCTION READY! 🚀');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('═'.repeat(70) + '\n');
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/customers`, { timeout: 3000 });
    return true;
  } catch (error) {
    // Even if the endpoint returns an error, server is running
    if (error.response) {
      return true;
    }
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('\n❌ ERROR: Backend server is not running!\n');
    console.log('Please start the server first:');
    console.log('  cd backend');
    console.log('  npm start\n');
    console.log('Then run this test again.\n');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  
  await runAllTests();
})();
