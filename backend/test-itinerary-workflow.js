/**
 * Test script for itinerary matching workflow
 * Tests different scenarios: complete inquiry, missing fields, no matches
 */

require('dotenv').config();
const mongoose = require('mongoose');
const itineraryMatchingService = require('./src/services/itineraryMatchingService');
const Itinerary = require('./src/models/Itinerary');

// Test data scenarios
const testScenarios = [
  {
    name: 'Complete Inquiry - Should Find Matches',
    extractedData: {
      destination: 'Paris',
      dates: {
        startDate: '2024-06-15',
        endDate: '2024-06-22',
        flexible: false
      },
      travelers: {
        adults: 2,
        children: 0
      },
      budget: {
        amount: 3000,
        currency: 'USD',
        perPerson: false
      },
      tripType: 'leisure',
      interests: ['culture', 'food', 'history']
    }
  },
  {
    name: 'Missing Destination - Should Ask Customer',
    extractedData: {
      dates: {
        startDate: '2024-07-01',
        endDate: '2024-07-10'
      },
      travelers: {
        adults: 4
      },
      budget: {
        amount: 5000,
        currency: 'USD'
      }
    }
  },
  {
    name: 'Missing Dates - Should Ask Customer',
    extractedData: {
      destination: 'Tokyo',
      travelers: {
        adults: 2
      },
      budget: {
        amount: 4000,
        currency: 'USD'
      }
    }
  },
  {
    name: 'Budget Only - Should Ask Customer',
    extractedData: {
      budget: {
        amount: 2000,
        currency: 'USD'
      },
      tripType: 'beach'
    }
  },
  {
    name: 'Obscure Destination - Should Forward to Supplier',
    extractedData: {
      destination: 'Bhutan',
      dates: {
        startDate: '2024-08-01',
        endDate: '2024-08-15'
      },
      travelers: {
        adults: 2
      },
      budget: {
        amount: 10000,
        currency: 'USD'
      }
    }
  }
];

async function createTestItinerary(tenantId) {
  console.log('\n📝 Creating test itinerary in database...\n');
  
  const testItinerary = new Itinerary({
    tenantId,
    createdBy: tenantId, // Use tenantId as creator
    title: 'Romantic Paris Getaway',
    description: 'Experience the magic of Paris with this 7-day romantic adventure',
    destination: {
      country: 'France',
      city: 'Paris',
      region: 'Île-de-France'
    },
    duration: {
      days: 7,
      nights: 6
    },
    estimatedCost: {
      currency: 'USD',
      totalCost: 2800,
      perPersonCost: 1400,
      breakdown: {
        accommodation: 1200,
        transportation: 400,
        activities: 800,
        meals: 400
      }
    },
    highlights: [
      'Visit the Eiffel Tower at sunset',
      'Seine River cruise',
      'Louvre Museum tour',
      'Montmartre walking tour',
      'French cooking class'
    ],
    inclusions: [
      '6 nights in 4-star hotel',
      'Daily breakfast',
      'Airport transfers',
      'Museum passes',
      'English-speaking guide'
    ],
    exclusions: [
      'International flights',
      'Lunch and dinner',
      'Travel insurance',
      'Personal expenses'
    ],
    days: [
      {
        dayNumber: 1,
        title: 'Arrival in Paris',
        description: 'Airport pickup and hotel check-in',
        activities: ['Airport transfer', 'Hotel check-in', 'Welcome dinner']
      },
      {
        dayNumber: 2,
        title: 'Iconic Paris',
        description: 'Visit Eiffel Tower and Champs-Élysées',
        activities: ['Eiffel Tower visit', 'Seine River cruise', 'Champs-Élysées walk']
      }
    ],
    capacity: {
      minTravelers: 2,
      maxTravelers: 6
    },
    status: 'active',
    availability: {
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-10-31')
    }
  });

  await testItinerary.save();
  console.log('✅ Test itinerary created:', testItinerary._id);
  return testItinerary;
}

async function runTest(scenario, tenantId) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 TEST: ${scenario.name}`);
  console.log('='.repeat(80));
  
  console.log('\n📋 Input Data:');
  console.log(JSON.stringify(scenario.extractedData, null, 2));
  
  try {
    const result = await itineraryMatchingService.processItineraryMatching(
      scenario.extractedData,
      tenantId
    );
    
    console.log('\n✅ RESULTS:');
    console.log('\n1️⃣ Validation:');
    console.log(`   Valid: ${result.validation.isValid}`);
    console.log(`   Completeness: ${result.validation.completeness}%`);
    console.log(`   Missing Fields: ${result.validation.missingFields.map(f => f.field).join(', ') || 'None'}`);
    
    console.log('\n2️⃣ Workflow Decision:');
    console.log(`   Action: ${result.workflow.action}`);
    console.log(`   Reason: ${result.workflow.reason}`);
    
    if (result.workflow.matches) {
      console.log(`\n3️⃣ Matching Itineraries: ${result.workflow.matches.length}`);
      result.workflow.matches.forEach((match, index) => {
        console.log(`\n   Match ${index + 1}: ${match.itinerary.title}`);
        console.log(`   Score: ${match.score}%`);
        console.log(`   Destination: ${match.itinerary.destination.city}, ${match.itinerary.destination.country}`);
        console.log(`   Duration: ${match.itinerary.duration.days} days`);
        console.log(`   Cost: ${match.itinerary.estimatedCost.currency} ${match.itinerary.estimatedCost.totalCost}`);
        console.log(`   Gaps: ${match.gaps.join(', ') || 'None'}`);
      });
    }
    
    if (result.workflow.missingFields) {
      console.log('\n4️⃣ Missing Information to Ask:');
      result.workflow.missingFields.forEach(field => {
        console.log(`   - ${field.label}: ${field.question}`);
      });
    }
    
    return {
      success: true,
      scenario: scenario.name,
      action: result.workflow.action
    };
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return {
      success: false,
      scenario: scenario.name,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Starting Itinerary Matching Workflow Test\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');
    
    // Use first tenant or create test tenant ID
    const tenantId = new mongoose.Types.ObjectId();
    console.log(`📌 Using Tenant ID: ${tenantId}\n`);
    
    // Create test itinerary
    await createTestItinerary(tenantId);
    
    // Run all test scenarios
    const results = [];
    for (const scenario of testScenarios) {
      const result = await runTest(scenario, tenantId);
      results.push(result);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.scenario}`);
      if (result.action) {
        console.log(`   → Action: ${result.action}`);
      }
      if (result.error) {
        console.log(`   → Error: ${result.error}`);
      }
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n📈 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTest, createTestItinerary };
