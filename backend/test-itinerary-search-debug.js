/**
 * Debug script to test itinerary search and matching
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Itinerary = require('./src/models/Itinerary');
const itineraryMatchingService = require('./src/services/itineraryMatchingService');

async function debugSearch() {
  console.log('🔍 Debugging Itinerary Search\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');
    
    // Check what itineraries exist
    const allItineraries = await Itinerary.find({})
      .select('title destination destinations status tenantId')
      .lean();
    
    console.log(`📊 Total itineraries in database: ${allItineraries.length}\n`);
    
    if (allItineraries.length > 0) {
      console.log('Existing itineraries:');
      allItineraries.forEach((itin, idx) => {
        console.log(`\n${idx + 1}. ${itin.title}`);
        console.log(`   Status: ${itin.status}`);
        console.log(`   TenantId: ${itin.tenantId}`);
        console.log(`   Destination:`, itin.destination);
        if (itin.destinations) {
          console.log(`   Destinations array:`, itin.destinations);
        }
      });
    }
    
    // Test search with "Paris"
    console.log('\n' + '='.repeat(80));
    console.log('🧪 Testing search for "Paris"');
    console.log('='.repeat(80));
    
    const testTenantId = allItineraries[0]?.tenantId || new mongoose.Types.ObjectId();
    
    const extractedData = {
      destination: 'Paris',
      dates: {
        startDate: '2024-06-15',
        endDate: '2024-06-22'
      },
      travelers: {
        adults: 2
      },
      budget: {
        amount: 3000,
        currency: 'USD'
      }
    };
    
    console.log('\n📋 Search criteria:');
    console.log(JSON.stringify(extractedData, null, 2));
    
    // Test the search directly
    const query = {
      tenantId: testTenantId,
      status: { $in: ['active', 'published'] }
    };
    
    const destRegex = new RegExp('Paris', 'i');
    query.$or = [
      { 'destination.country': destRegex },
      { 'destination.city': destRegex },
      { 'destinations.country': destRegex },
      { 'destinations.city': destRegex }
    ];
    
    console.log('\n🔎 MongoDB Query:');
    console.log(JSON.stringify(query, null, 2));
    
    const directResults = await Itinerary.find(query).lean();
    console.log(`\n✅ Direct query found: ${directResults.length} itineraries`);
    
    if (directResults.length > 0) {
      directResults.forEach(itin => {
        console.log(`   - ${itin.title}`);
      });
    }
    
    // Test through matching service
    console.log('\n🔧 Testing through itineraryMatchingService...');
    const serviceResults = await itineraryMatchingService.searchItineraries(extractedData, testTenantId);
    console.log(`✅ Service found: ${serviceResults.length} itineraries`);
    
    if (serviceResults.length > 0) {
      serviceResults.forEach(match => {
        console.log(`\n   ${match.itinerary.title}`);
        console.log(`   Score: ${match.score}%`);
        console.log(`   Destination: ${match.itinerary.destination?.city}, ${match.itinerary.destination?.country}`);
      });
    } else {
      console.log('   ⚠️  No matches found - possible issues:');
      console.log('   1. Destination field structure mismatch');
      console.log('   2. Status not "active" or "published"');
      console.log('   3. TenantId mismatch');
      console.log('   4. Score below 50% threshold');
    }
    
    // Full workflow test
    console.log('\n' + '='.repeat(80));
    console.log('🔄 Testing full workflow');
    console.log('='.repeat(80));
    
    const workflowResult = await itineraryMatchingService.processItineraryMatching(
      extractedData,
      testTenantId
    );
    
    console.log('\n📊 Workflow Result:');
    console.log(`   Action: ${workflowResult.workflow.action}`);
    console.log(`   Reason: ${workflowResult.workflow.reason}`);
    console.log(`   Matches found: ${workflowResult.matches?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run debug
if (require.main === module) {
  debugSearch().catch(console.error);
}

module.exports = { debugSearch };
