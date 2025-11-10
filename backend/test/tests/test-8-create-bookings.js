/**
 * Test 8: Create Bookings with Demo Data
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

async function createBooking(bookingData, token) {
  const result = await apiClient.post('/bookings', bookingData, token);

  if (!result.success) {
    logger.error(`Failed to create booking: ${result.error}`);
    return null;
  }

  const bookingId = result.data.data?.booking?._id || result.data.data?._id;
  logger.success(`Booking created: ${bookingData.status} - ₹${bookingData.totalAmount}`);
  
  dataStore.addBooking({
    id: bookingId,
    customerId: bookingData.customerId,
    quoteId: bookingData.quoteId,
    status: bookingData.status,
    totalAmount: bookingData.totalAmount
  });
  
  return bookingId;
}

async function runTest() {
  logger.step('TEST 8: Create Bookings with Demo Data');
  
  const token = apiClient.getToken('operator');
  if (!token) {
    logger.error('No operator token found. Run Test 2 first.');
    const result = { success: false, error: 'No operator token' };
    dataStore.addTestResult('Test 8: Create Bookings', result);
    return result;
  }

  // Get quotes from dataStore
  const quotes = dataStore.data.quotes;
  const customers = dataStore.data.customers;

  if (quotes.length < 2) {
    logger.error('Not enough quotes. Need at least 2 quotes.');
    const result = { success: false, error: 'Insufficient quotes' };
    dataStore.addTestResult('Test 8: Create Bookings', result);
    return result;
  }

  const bookingsData = [
    {
      customerId: quotes[0].customerId,
      quoteId: quotes[0].id,
      pax: { adults: 2, children: 0, infants: 0 },
      travelDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'confirmed',
      paymentStatus: 'partial',
      totalAmount: 177000,
      amountPaid: 50000,
      amountPending: 127000,
      notes: 'Advance payment received. Balance due before travel.'
    },
    {
      customerId: quotes[1].customerId,
      quoteId: quotes[1].id,
      pax: { adults: 2, children: 1, infants: 0 },
      travelDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'confirmed',
      paymentStatus: 'paid',
      totalAmount: 141600,
      amountPaid: 141600,
      amountPending: 0,
      notes: 'Full payment received. Booking confirmed.'
    }
  ];

  let createdCount = 0;
  
  for (const bookingData of bookingsData) {
    const bookingId = await createBooking(bookingData, token);
    if (bookingId) createdCount++;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  logger.info(`Created ${createdCount}/${bookingsData.length} bookings`);
  
  const result = { 
    success: createdCount === bookingsData.length,
    createdCount,
    totalExpected: bookingsData.length
  };
  
  dataStore.addTestResult('Test 8: Create Bookings', result);
  return result;
}

module.exports = { runTest };
