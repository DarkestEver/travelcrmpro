/**
 * Test script to validate mandatory field extraction
 * Tests the improved extraction logic with sample customer email
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');
const itineraryMatchingService = require('./src/services/itineraryMatchingService');

async function testMandatoryFieldExtraction() {
  console.log('🧪 Testing Mandatory Field Extraction\n');
  console.log('='.repeat(80));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');
    
    // Sample email with all mandatory fields
    const testEmailContent = `Hi, we're a family of 4 looking to visit Paris from
December 20-27, 2025. Budget is around $8,000 total.
We'd like hotel near Eiffel Tower and some sightseeing
tours. Can you help us plan this trip?

Thanks,
John Doe
john@example.com
+1-555-1234`;

    console.log('📧 TEST EMAIL:');
    console.log(testEmailContent);
    console.log('\n' + '='.repeat(80) + '\n');

    // Create mock email object
    const mockEmail = {
      _id: new mongoose.Types.ObjectId(),
      from: {
        email: 'john@example.com',
        name: 'John Doe'
      },
      subject: 'Family trip to Paris',
      bodyText: testEmailContent
    };

    // Get tenant ID (use first available or create test one)
    const tenantId = new mongoose.Types.ObjectId('690ce6d206c104addbfedb65');
    
    console.log('🤖 STEP 1: AI Extraction');
    console.log('-'.repeat(80));
    
    const extractedData = await openaiService.extractCustomerInquiry(mockEmail, tenantId);
    
    console.log('\n✅ EXTRACTED DATA:');
    console.log(JSON.stringify(extractedData, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 STEP 2: Validate Mandatory Fields');
    console.log('-'.repeat(80));
    
    const validation = itineraryMatchingService.validateRequiredFields(extractedData);
    
    console.log('\n✅ VALIDATION RESULT:');
    console.log(`   Valid: ${validation.isValid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Completeness: ${Math.round(validation.completeness * 100)}%`);
    
    console.log('\n📊 MANDATORY FIELDS CHECK:');
    const mandatoryFields = [
      { name: 'destination', value: extractedData.destination, required: true },
      { name: 'dates.startDate', value: extractedData.dates?.startDate, required: true },
      { name: 'dates.endDate', value: extractedData.dates?.endDate, required: true },
      { name: 'travelers.adults', value: extractedData.travelers?.adults, required: true },
      { name: 'budget.amount', value: extractedData.budget?.amount, required: true }
    ];
    
    mandatoryFields.forEach(field => {
      const status = field.value ? '✅' : '❌';
      const value = field.value || 'MISSING';
      console.log(`   ${status} ${field.name}: ${value}`);
    });
    
    if (validation.missingFields.length > 0) {
      console.log('\n⚠️  MISSING FIELDS:');
      validation.missingFields.forEach(field => {
        console.log(`   ❌ ${field.field}: ${field.label}`);
        console.log(`      Question: ${field.question}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 STEP 3: Additional Extracted Data');
    console.log('-'.repeat(80));
    
    console.log('\n🏨 Accommodation:');
    if (extractedData.accommodation?.preferences) {
      console.log(`   Preferences: ${extractedData.accommodation.preferences.join(', ')}`);
    } else {
      console.log('   No specific preferences extracted');
    }
    
    console.log('\n🎯 Activities:');
    if (extractedData.activities && extractedData.activities.length > 0) {
      extractedData.activities.forEach(activity => {
        console.log(`   - ${activity}`);
      });
    } else {
      console.log('   No activities extracted');
    }
    
    console.log('\n👤 Customer Info:');
    console.log(`   Name: ${extractedData.customerInfo?.name || 'N/A'}`);
    console.log(`   Email: ${extractedData.customerInfo?.email || 'N/A'}`);
    console.log(`   Phone: ${extractedData.customerInfo?.phone || 'N/A'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('💰 COST TRACKING');
    console.log('-'.repeat(80));
    console.log(`   OpenAI Cost: $${extractedData.cost?.toFixed(4) || '0.0000'}`);
    console.log(`   Tokens Used: ${extractedData.tokens?.total || 0}`);
    console.log(`   Confidence: ${extractedData.confidence || 0}%`);
    
    // Test the full workflow
    console.log('\n' + '='.repeat(80));
    console.log('🔄 STEP 4: Full Itinerary Matching Workflow');
    console.log('-'.repeat(80));
    
    const workflowResult = await itineraryMatchingService.processItineraryMatching(
      extractedData,
      tenantId
    );
    
    console.log('\n✅ WORKFLOW DECISION:');
    console.log(`   Action: ${workflowResult.workflow.action}`);
    console.log(`   Reason: ${workflowResult.workflow.reason}`);
    
    if (workflowResult.matches && workflowResult.matches.length > 0) {
      console.log(`\n🎯 Matches Found: ${workflowResult.matches.length}`);
      workflowResult.matches.slice(0, 3).forEach((match, idx) => {
        console.log(`\n   Match ${idx + 1}: ${match.itinerary.title}`);
        console.log(`   Score: ${match.score}%`);
      });
    } else {
      console.log('\n   No matching itineraries found');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));
    
    // Summary
    console.log('\n📝 SUMMARY:');
    if (validation.isValid) {
      console.log('   ✅ All mandatory fields extracted successfully!');
      console.log('   ✅ Ready for itinerary matching');
    } else {
      console.log('   ❌ Some mandatory fields are missing');
      console.log('   ⚠️  System will ask customer for missing information');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run test
if (require.main === module) {
  testMandatoryFieldExtraction().catch(console.error);
}

module.exports = { testMandatoryFieldExtraction };
