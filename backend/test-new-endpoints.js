/**
 * Test script for new Phase 1 API endpoints
 * Tests all 11 new endpoints added to itinerary controller
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testItineraryId = '';
let testDayId = '';
let testComponentId = '';
let shareToken = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log('\n🔐 Testing Authentication...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    log('✅ Login successful', 'green');
    return true;
  } catch (error) {
    log('❌ Login failed - using fallback token', 'yellow');
    // Fallback: try to get token from environment or use existing
    return false;
  }
}

async function createTestItinerary() {
  try {
    log('\n📝 Creating test itinerary...', 'blue');
    const response = await axios.post(
      `${BASE_URL}/itineraries`,
      {
        title: 'API Test Itinerary',
        overview: 'Testing new Phase 1 endpoints',
        destination: {
          country: 'India',
          city: 'Jaipur'
        },
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        numberOfDays: 5,
        numberOfNights: 4
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testItineraryId = response.data.data._id;
    log(`✅ Test itinerary created: ${testItineraryId}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to create itinerary: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testAddDay() {
  try {
    log('\n📅 Testing: Add Day endpoint...', 'blue');
    const response = await axios.post(
      `${BASE_URL}/itineraries/${testItineraryId}/days`,
      {
        dayNumber: 1,
        date: '2025-12-01',
        title: 'Day 1: Arrival in Jaipur',
        location: {
          name: 'Jaipur',
          country: 'India',
          state: 'Rajasthan',
          city: 'Jaipur',
          geoLocation: {
            type: 'Point',
            coordinates: [75.7873, 26.9124]
          }
        },
        weather: {
          condition: 'Sunny',
          temperature: { min: 15, max: 28 }
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testDayId = response.data.data.days[0]._id;
    log(`✅ Day added successfully: ${testDayId}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Add day failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateDay() {
  try {
    log('\n✏️ Testing: Update Day endpoint...', 'blue');
    await axios.put(
      `${BASE_URL}/itineraries/${testItineraryId}/days/${testDayId}`,
      {
        title: 'Day 1: Arrival & City Tour',
        notes: 'Updated with city tour'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log('✅ Day updated successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Update day failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testAddComponent() {
  try {
    log('\n🏨 Testing: Add Component (Hotel) endpoint...', 'blue');
    const response = await axios.post(
      `${BASE_URL}/itineraries/${testItineraryId}/days/${testDayId}/components`,
      {
        type: 'stay',
        title: 'Taj Rambagh Palace',
        startTime: '14:00',
        endTime: '12:00',
        location: {
          name: 'Taj Rambagh Palace',
          address: 'Bhawani Singh Road',
          city: 'Jaipur',
          country: 'India',
          geoLocation: {
            type: 'Point',
            coordinates: [75.7873, 26.9124]
          }
        },
        accommodation: {
          hotelName: 'Taj Rambagh Palace',
          category: 'luxury',
          starRating: 5,
          roomType: 'deluxe',
          numberOfRooms: 1,
          amenities: ['wifi', 'pool', 'spa', 'restaurant'],
          mealPlan: 'breakfast',
          checkIn: { date: '2025-12-01', time: '14:00' },
          checkOut: { date: '2025-12-02', time: '12:00' }
        },
        cost: {
          amount: 25000,
          currency: 'INR',
          costType: 'per-room'
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testComponentId = response.data.data.days[0].components[0]._id;
    log(`✅ Hotel component added: ${testComponentId}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Add component failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testAddActivityComponent() {
  try {
    log('\n🎭 Testing: Add Component (Activity) endpoint...', 'blue');
    await axios.post(
      `${BASE_URL}/itineraries/${testItineraryId}/days/${testDayId}/components`,
      {
        type: 'activity',
        title: 'Amber Fort Visit',
        startTime: '09:00',
        endTime: '12:00',
        location: {
          name: 'Amber Fort',
          city: 'Jaipur',
          country: 'India'
        },
        activity: {
          category: 'historical',
          duration: '3 hours',
          difficulty: 'easy',
          highlights: ['Sheesh Mahal', 'Diwan-i-Aam', 'Elephant rides'],
          included: ['Entry tickets', 'Guide'],
          excluded: ['Food', 'Tips']
        },
        cost: {
          amount: 2500,
          currency: 'INR',
          costType: 'per-person'
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log('✅ Activity component added', 'green');
    return true;
  } catch (error) {
    log(`❌ Add activity failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateComponent() {
  try {
    log('\n✏️ Testing: Update Component endpoint...', 'blue');
    await axios.put(
      `${BASE_URL}/itineraries/${testItineraryId}/days/${testDayId}/components/${testComponentId}`,
      {
        'accommodation.amenities': ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'bar']
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log('✅ Component updated successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Update component failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testReorderComponents() {
  try {
    log('\n🔄 Testing: Reorder Components endpoint...', 'blue');
    const response = await axios.get(
      `${BASE_URL}/itineraries/${testItineraryId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    const componentIds = response.data.data.days[0].components.map(c => c._id);
    
    await axios.put(
      `${BASE_URL}/itineraries/${testItineraryId}/days/${testDayId}/reorder`,
      {
        componentIds: componentIds.reverse()
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log('✅ Components reordered successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Reorder failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGenerateShareLink() {
  try {
    log('\n🔗 Testing: Generate Share Link endpoint...', 'blue');
    const response = await axios.post(
      `${BASE_URL}/itineraries/${testItineraryId}/share`,
      {
        expiryDays: 30,
        password: 'test123'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    shareToken = response.data.data.token;
    log(`✅ Share link generated: ${response.data.data.url}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Generate share link failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetSharedItinerary() {
  try {
    log('\n👁️ Testing: Get Shared Itinerary endpoint (public)...', 'blue');
    const response = await axios.get(
      `${BASE_URL}/itineraries/share/${shareToken}`,
      {
        params: { password: 'test123' }
      }
    );
    log(`✅ Shared itinerary accessed: ${response.data.data.title}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Get shared itinerary failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetStats() {
  try {
    log('\n📊 Testing: Get Itinerary Stats endpoint...', 'blue');
    const response = await axios.get(
      `${BASE_URL}/itineraries/${testItineraryId}/stats`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log(`✅ Stats retrieved:`, 'green');
    log(`   Days: ${response.data.data.totalDays}`, 'yellow');
    log(`   Components: ${response.data.data.totalComponents}`, 'yellow');
    log(`   Cost: ${response.data.data.costBreakdown.totalCost} ${response.data.data.costBreakdown.currency}`, 'yellow');
    return true;
  } catch (error) {
    log(`❌ Get stats failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCloneItinerary() {
  try {
    log('\n📋 Testing: Clone Itinerary endpoint...', 'blue');
    const response = await axios.post(
      `${BASE_URL}/itineraries/${testItineraryId}/clone`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log(`✅ Itinerary cloned: ${response.data.data._id}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Clone itinerary failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testDeleteComponent() {
  try {
    log('\n🗑️ Testing: Delete Component endpoint...', 'blue');
    await axios.delete(
      `${BASE_URL}/itineraries/${testItineraryId}/days/${testDayId}/components/${testComponentId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log('✅ Component deleted successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Delete component failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testDeleteDay() {
  try {
    log('\n🗑️ Testing: Delete Day endpoint...', 'blue');
    await axios.delete(
      `${BASE_URL}/itineraries/${testItineraryId}/days/${testDayId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log('✅ Day deleted successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Delete day failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function cleanup() {
  try {
    log('\n🧹 Cleaning up test data...', 'blue');
    await axios.delete(
      `${BASE_URL}/itineraries/${testItineraryId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    log('✅ Test itinerary deleted', 'green');
  } catch (error) {
    log(`⚠️ Cleanup warning: ${error.response?.data?.message || error.message}`, 'yellow');
  }
}

async function runAllTests() {
  log('═══════════════════════════════════════════════', 'blue');
  log('🧪 PHASE 1 API ENDPOINTS TEST SUITE', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    log('\n❌ Cannot proceed without authentication', 'red');
    return;
  }

  // Create test itinerary
  if (!await createTestItinerary()) {
    log('\n❌ Cannot proceed without test itinerary', 'red');
    return;
  }

  // Run all tests
  const tests = [
    { name: 'Add Day', fn: testAddDay },
    { name: 'Update Day', fn: testUpdateDay },
    { name: 'Add Component (Hotel)', fn: testAddComponent },
    { name: 'Add Component (Activity)', fn: testAddActivityComponent },
    { name: 'Update Component', fn: testUpdateComponent },
    { name: 'Reorder Components', fn: testReorderComponents },
    { name: 'Generate Share Link', fn: testGenerateShareLink },
    { name: 'Get Shared Itinerary', fn: testGetSharedItinerary },
    { name: 'Get Stats', fn: testGetStats },
    { name: 'Clone Itinerary', fn: testCloneItinerary },
    { name: 'Delete Component', fn: testDeleteComponent },
    { name: 'Delete Day', fn: testDeleteDay }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Cleanup
  await cleanup();

  // Summary
  log('\n═══════════════════════════════════════════════', 'blue');
  log('📊 TEST RESULTS SUMMARY', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  log(`Total Tests: ${results.total}`, 'yellow');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, results.failed === 0 ? 'green' : 'yellow');
  log('═══════════════════════════════════════════════\n', 'blue');

  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
