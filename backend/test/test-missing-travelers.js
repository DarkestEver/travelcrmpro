/**
 * Test: Missing Travelers Validation
 * Verifies system asks for traveler count when not provided
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const WEBHOOK_URL = `${BASE_URL}/api/v1/emails/webhook`;
const TEST_TENANT_ID = '690ce93c464bf35e0adede29';

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║       TEST: Missing Travelers - Should Ask for Count                ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

async function testMissingTravelers() {
  try {
    // Test email WITHOUT traveler count mentioned
    const testEmail = {
      from: "john.doe@example.com",
      to: "travel@agency.com",
      subject: "Paris Trip Inquiry",
      text: `Hi,

I'm interested in visiting Paris in July 2024.
My budget is around $4000.

I love art museums and good restaurants.

Thanks,
John Doe`,
      html: "<p>I'm interested in visiting Paris in July 2024.</p>",
      tenantId: TEST_TENANT_ID
    };

    console.log('📧 Sending email without traveler count...\n');
    console.log('Email content:');
    console.log('  From:', testEmail.from);
    console.log('  Subject:', testEmail.subject);
    console.log('  Body: "...Paris in July 2024... budget $4000..."');
    console.log('  ⚠️  NO TRAVELER COUNT MENTIONED\n');

    const response = await axios.post(WEBHOOK_URL, testEmail, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ Response received!\n');
    console.log('━'.repeat(70));
    console.log('VALIDATION RESULTS:');
    console.log('━'.repeat(70));

    const data = response.data;
    
    // Check workflow action
    if (data.itineraryMatching) {
      const workflow = data.itineraryMatching.workflowAction;
      console.log(`\n✓ Workflow Action: ${workflow}`);
      
      if (workflow === 'ASK_CUSTOMER') {
        console.log('  ✅ CORRECT! System asking for more information\n');
        
        // Check if travelers is in missing fields
        if (data.itineraryMatching.validation) {
          const validation = data.itineraryMatching.validation;
          const missingFields = validation.missingFields || [];
          
          console.log('Missing Fields:');
          missingFields.forEach(field => {
            console.log(`  • ${field.label}`);
            console.log(`    Question: "${field.question}"`);
            console.log(`    Priority: ${field.priority}`);
            
            if (field.field === 'travelers') {
              console.log('    ✅ TRAVELERS CORRECTLY IDENTIFIED AS MISSING!\n');
            }
          });
          
          const hasTravelersInMissing = missingFields.some(f => f.field === 'travelers');
          
          if (hasTravelersInMissing) {
            console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
            console.log('║                                                                      ║');
            console.log('║     ✅ TEST PASSED - SYSTEM ASKS FOR TRAVELER COUNT!                ║');
            console.log('║                                                                      ║');
            console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
          } else {
            console.log('\n❌ FAILED: Travelers not in missing fields!');
            console.log('Missing fields:', missingFields.map(f => f.field).join(', '));
          }
        }
      } else {
        console.log(`  ❌ WRONG! Expected ASK_CUSTOMER, got ${workflow}\n`);
      }
    } else {
      console.log('\n❌ No itineraryMatching in response');
    }

    console.log('\n━'.repeat(70));
    console.log('FULL RESPONSE:');
    console.log('━'.repeat(70));
    console.log(JSON.stringify(data, null, 2));
    console.log('━'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Check server first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/v1/customers`, { timeout: 3000 });
    return true;
  } catch (error) {
    if (error.response) return true; // Server is up
    return false;
  }
}

(async () => {
  console.log('🔍 Checking server...');
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('❌ Server not running!');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  await testMissingTravelers();
})();
