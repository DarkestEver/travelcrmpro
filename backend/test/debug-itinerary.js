const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testItineraryCreation() {
  console.log('=== TESTING ITINERARY CREATION ===\n');

  try {
    // Step 1: Create tenant and login
    console.log('Step 1: Creating tenant...\n');
    const tenantData = {
      name: 'Itinerary Test Agency',
      subdomain: `itintest${Date.now()}`,
      ownerName: 'Test Owner',
      ownerEmail: `owner.${Date.now()}@test.com`,
      ownerPassword: 'Owner@123456',
      ownerPhone: '+1-555-0000',
      plan: 'free'
    };

    const tenantResponse = await axios.post(`${API_BASE}/tenants`, tenantData);
    const tenantId = tenantResponse.data.data.tenant._id;
    console.log('✓ Tenant created:', tenantId);

    // Wait for tenant to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: tenantData.ownerEmail,
      password: tenantData.ownerPassword
    });
    const token = loginResponse.data.data.accessToken;
    console.log('✓ Logged in\n');

    // Step 3: Create customer user
    console.log('Step 3: Creating customer...\n');
    const customerUserData = {
      name: 'Test Customer',
      email: `customer.${Date.now()}@test.com`,
      password: 'Customer@123456',
      role: 'customer',
      phone: '+1-555-1111'
    };

    const userResponse = await axios.post(`${API_BASE}/auth/register`, customerUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const userId = userResponse.data.data.user.id;
    console.log('✓ User created:', userId);

    // Step 4: Create customer profile
    const customerProfileData = {
      userId: userId,
      name: customerUserData.name,
      email: customerUserData.email,
      phone: customerUserData.phone,
      passportNumber: 'P12345678',
      dateOfBirth: '1990-01-01',
      nationality: 'US'
    };

    const customerResponse = await axios.post(`${API_BASE}/customers`, customerProfileData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const customerId = customerResponse.data.data.customer._id;
    console.log('✓ Customer profile created:', customerId);
    console.log('');

    // Step 5: Create itinerary
    console.log('Step 5: Creating itinerary...\n');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const itineraryData = {
      customerId: customerId,
      title: 'Paris Vacation Package',
      description: 'Amazing 7-day Paris vacation',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      destination: {
        country: 'France',
        city: 'Paris'
      },
      destinations: [
        {
          country: 'France',
          city: 'Paris',
          duration: 5
        },
        {
          country: 'France',
          city: 'Versailles',
          duration: 2
        }
      ],
      duration: {
        days: 7,
        nights: 6
      },
      status: 'draft',
      totalCost: 5000,
      days: [
        {
          dayNumber: 1,
          date: startDate.toISOString(),
          title: 'Arrival in Paris',
          description: 'Check-in to hotel',
          activities: [
            {
              time: '14:00',
              title: 'Hotel Check-in',
              description: 'Check-in at hotel',
              location: 'Paris Hotel',
              cost: 0
            }
          ],
          accommodation: {
            hotelName: 'Paris Hotel',
            category: '4-star',
            roomType: 'deluxe',
            numberOfRooms: 1,
            checkIn: {
              date: startDate.toISOString(),
              time: '14:00'
            },
            checkOut: {
              date: endDate.toISOString(),
              time: '12:00'
            }
          }
        }
      ]
    };

    console.log('Itinerary Data:', JSON.stringify(itineraryData, null, 2));
    console.log('');

    const itineraryResponse = await axios.post(`${API_BASE}/itineraries`, itineraryData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('✓ SUCCESS!');
    console.log('Status:', itineraryResponse.status);
    console.log('Response:', JSON.stringify(itineraryResponse.data, null, 2));

  } catch (error) {
    console.log('\n✗ FAILED');
    console.log('Error at:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testItineraryCreation();
