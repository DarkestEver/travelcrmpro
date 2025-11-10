/**
 * Test 6: Create Itineraries with Demo Data
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

const itinerariesData = [
  {
    title: 'Paris Romance 7D/6N',
    destination: {
      city: 'Paris',
      country: 'France'
    },
    duration: 7,
    price: 150000,
    description: 'Romantic getaway to the City of Love with Eiffel Tower, Louvre Museum, and Seine River cruise',
    type: 'package',
    category: 'international',
    inclusions: ['Accommodation', 'Daily Breakfast', 'Airport Transfers', 'City Tour', 'Seine River Cruise'],
    exclusions: ['International Flights', 'Travel Insurance', 'Personal Expenses', 'Lunch & Dinner']
  },
  {
    title: 'Bali Adventure 5D/4N',
    destination: {
      city: 'Bali',
      country: 'Indonesia'
    },
    duration: 5,
    price: 80000,
    description: 'Adventure and relaxation in tropical paradise with beaches, temples, and water sports',
    type: 'package',
    category: 'international',
    inclusions: ['Beach Resort Stay', 'Breakfast', 'Airport Transfers', 'Temple Tours', 'Water Sports'],
    exclusions: ['Flights', 'Visa Fees', 'Travel Insurance', 'Meals not mentioned']
  },
  {
    title: 'Goa Beach Escape 3D/2N',
    destination: {
      city: 'Goa',
      country: 'India'
    },
    duration: 3,
    price: 25000,
    description: 'Quick beach getaway with water sports, beach parties, and seafood',
    type: 'package',
    category: 'domestic',
    inclusions: ['Beach Resort', 'Breakfast', 'Airport Pickup', 'Water Sports'],
    exclusions: ['Flights', 'Lunch & Dinner', 'Personal Expenses']
  }
];

async function createItinerary(itineraryData, token) {
  const result = await apiClient.post('/itineraries', {
    title: itineraryData.title,
    destination: itineraryData.destination,
    duration: itineraryData.duration,
    price: itineraryData.price,
    description: itineraryData.description,
    type: itineraryData.type,
    category: itineraryData.category,
    inclusions: itineraryData.inclusions,
    exclusions: itineraryData.exclusions,
    status: 'active'
  }, token);

  if (!result.success) {
    logger.error(`Failed to create ${itineraryData.title}: ${result.error}`);
    return null;
  }

  const itineraryId = result.data.data?.itinerary?._id || result.data.data?._id;
  logger.success(`Itinerary created: ${itineraryData.title} (₹${itineraryData.price})`);
  
  dataStore.addItinerary({
    id: itineraryId,
    title: itineraryData.title,
    destination: itineraryData.destination,
    price: itineraryData.price,
    duration: itineraryData.duration
  });
  
  return itineraryId;
}

async function runTest() {
  logger.step('TEST 6: Create Itineraries with Demo Data');
  
  const token = apiClient.getToken('operator');
  if (!token) {
    logger.error('No operator token found. Run Test 2 first.');
    const result = { success: false, error: 'No operator token' };
    dataStore.addTestResult('Test 6: Create Itineraries', result);
    return result;
  }
  
  let createdCount = 0;
  
  for (const itineraryData of itinerariesData) {
    const itineraryId = await createItinerary(itineraryData, token);
    if (itineraryId) createdCount++;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  logger.info(`Created ${createdCount}/${itinerariesData.length} itineraries`);
  
  const result = { 
    success: createdCount === itinerariesData.length,
    createdCount,
    totalExpected: itinerariesData.length
  };
  
  dataStore.addTestResult('Test 6: Create Itineraries', result);
  return result;
}

module.exports = { runTest };
