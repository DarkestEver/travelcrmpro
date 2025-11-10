/**
 * Test 7: Create Quotes with Demo Data
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

async function createQuote(quoteData, token) {
  const result = await apiClient.post('/quotes', quoteData, token);

  if (!result.success) {
    logger.error(`Failed to create quote: ${result.error}`);
    return null;
  }

  const quoteId = result.data.data?.quote?._id || result.data.data?._id;
  logger.success(`Quote created for customer ${quoteData.customerId.substring(0, 8)}...`);
  
  dataStore.addQuote({
    id: quoteId,
    customerId: quoteData.customerId,
    itineraryId: quoteData.itineraryId,
    amount: quoteData.pricing.totalCost
  });
  
  return quoteId;
}

async function runTest() {
  logger.step('TEST 7: Create Quotes with Demo Data');
  
  const token = apiClient.getToken('operator');
  if (!token) {
    logger.error('No operator token found. Run Test 2 first.');
    const result = { success: false, error: 'No operator token' };
    dataStore.addTestResult('Test 7: Create Quotes', result);
    return result;
  }

  // Create a default agent profile for quotes (if needed)
  const tenant = dataStore.data.tenants[0];
  const operatorUser = dataStore.data.users.operator[0];
  
  logger.info('Creating default agent profile for operator...');
  const agentResult = await apiClient.post('/agents', {
    userId: operatorUser.id,
    agencyName: tenant.name,
    contactPerson: 'Admin User',
    email: operatorUser.email,
    phone: '+91 98765 43210',
    address: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    }
  }, token);

  let agentId = null;
  if (agentResult.success) {
    agentId = agentResult.data.data?.agent?._id || agentResult.data.data?._id;
    logger.success(`Agent profile created: ${agentId}`);
  } else {
    logger.warning(`Could not create agent profile: ${agentResult.error}`);
    logger.info('Quotes will be created without agentId');
  }

  // Get customers and itineraries from dataStore
  const customers = dataStore.data.customers;
  const itineraries = dataStore.data.itineraries;

  if (customers.length < 3) {
    logger.error('Not enough customers. Need at least 3 customers.');
    const result = { success: false, error: 'Insufficient customers' };
    dataStore.addTestResult('Test 7: Create Quotes', result);
    return result;
  }

  if (itineraries.length < 2) {
    logger.error('Not enough itineraries. Need at least 2 itineraries.');
    const result = { success: false, error: 'Insufficient itineraries' };
    dataStore.addTestResult('Test 7: Create Quotes', result);
    return result;
  }

  const quotesData = [
    {
      customerId: customers[0].id,
      itineraryId: itineraries[0].id,
      agentId: agentId,
      numberOfTravelers: 2,
      travelDates: {
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000).toISOString()
      },
      pricing: {
        baseCost: 150000,
        markup: 0,
        taxes: 27000,
        totalCost: 177000
      },
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Special honeymoon package with complimentary room upgrade'
    },
    {
      customerId: customers[1].id,
      itineraryId: itineraries[1].id,
      agentId: agentId,
      numberOfTravelers: 3,
      travelDates: {
        startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString()
      },
      pricing: {
        baseCost: 120000,
        markup: 0,
        taxes: 21600,
        totalCost: 141600
      },
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Family package with kid-friendly activities'
    },
    {
      customerId: customers[2].id,
      itineraryId: itineraries[0].id,
      agentId: agentId,
      numberOfTravelers: 1,
      travelDates: {
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000).toISOString()
      },
      pricing: {
        baseCost: 75000,
        markup: 0,
        taxes: 13500,
        totalCost: 88500
      },
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Solo traveler package with flexible dates'
    }
  ];

  let createdCount = 0;
  
  for (const quoteData of quotesData) {
    const quoteId = await createQuote(quoteData, token);
    if (quoteId) createdCount++;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  logger.info(`Created ${createdCount}/${quotesData.length} quotes`);
  
  const result = { 
    success: createdCount === quotesData.length,
    createdCount,
    totalExpected: quotesData.length
  };
  
  dataStore.addTestResult('Test 7: Create Quotes', result);
  return result;
}

module.exports = { runTest };
