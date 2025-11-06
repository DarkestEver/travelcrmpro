const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function createTestItinerary() {
  try {
    // First, login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Create test itinerary
    console.log('\n📝 Creating test itinerary...');
    const itineraryResponse = await axios.post(
      `${BASE_URL}/itineraries`,
      {
        title: 'Test Bangkok Adventure',
        overview: 'A 3-day adventure in Bangkok',
        destination: {
          country: 'Thailand',
          city: 'Bangkok'
        },
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        numberOfDays: 3,
        numberOfNights: 2,
        status: 'draft'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const itineraryId = itineraryResponse.data.data._id;
    console.log(`✅ Itinerary created with ID: ${itineraryId}`);
    console.log(`\n🚀 Open this URL in your browser:`);
    console.log(`\x1b[36m\x1b[1mhttp://localhost:5174/itineraries/${itineraryId}/build\x1b[0m`);
    console.log(`\nOr go to Itineraries page and click the 🏗️ Build button\n`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

createTestItinerary();
