const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testCompleteQuoteFlow() {
  try {
    console.log('=== COMPLETE QUOTE CREATION TEST ===\n');

    // Step 1: Create tenant
    console.log('Step 1: Creating tenant...\n');
    const tenantData = {
      name: 'Quote Test Agency',
      subdomain: `quotetest${Date.now()}`,
      owner: {
        name: 'Test Owner',
        email: `owner.${Date.now()}@test.com`,
        password: 'Test@123456',
        phone: '+1234567890'
      }
    };

    const tenantResponse = await axios.post(`${API_BASE}/tenants/register`, tenantData);
    const tenantId = tenantResponse.data.data.tenant._id;
    const token = tenantResponse.data.data.token;
    console.log('✓ Tenant created:', tenantId);
    console.log('✓ Token received\n');

    // Step 2: Create Agent
    console.log('Step 2: Creating agent...\n');
    const agentUserData = {
      name: 'Test Agent',
      email: `agent.${Date.now()}@test.com`,
      password: 'Test@123456',
      role: 'agent',
      phone: '+1234567891'
    };

    const agentUserResponse = await axios.post(`${API_BASE}/auth/register`, agentUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const agentUserId = agentUserResponse.data.data.user._id;

    const agentProfileData = {
      userId: agentUserId,
      agencyName: 'Test Agency',
      contactPerson: agentUserData.name,
      address: '123 Test St',
      tier: 'basic'
    };

    const agentResponse = await axios.post(`${API_BASE}/agents`, agentProfileData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const agentId = agentResponse.data.data.agent._id;
    console.log('✓ Agent created:', agentId);

    // Step 3: Create Customer
    console.log('\nStep 3: Creating customer...\n');
    const customerUserData = {
      name: 'Test Customer',
      email: `customer.${Date.now()}@test.com`,
      password: 'Test@123456',
      role: 'customer',
      phone: '+1234567892'
    };

    const customerUserResponse = await axios.post(`${API_BASE}/auth/register`, customerUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const customerUserId = customerUserResponse.data.data.user._id;

    const customerProfileData = {
      userId: customerUserId,
      passportNumber: 'ABC123456',
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
    console.log('✓ Customer created:', customerId);

    // Step 4: Create Itinerary
    console.log('\nStep 4: Creating itinerary...\n');
    const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 37 * 24 * 60 * 60 * 1000);

    const itineraryData = {
      customerId: customerId,
      title: 'Paris Adventure',
      description: '7-day Paris trip',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      destination: {
        country: 'France',
        city: 'Paris'
      },
      destinations: [{
        country: 'France',
        city: 'Paris',
        duration: 7
      }],
      duration: {
        days: 7,
        nights: 6
      },
      status: 'draft'
    };

    const itineraryResponse = await axios.post(`${API_BASE}/itineraries`, itineraryData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });
    const itineraryId = itineraryResponse.data.data.itinerary._id;
    console.log('✓ Itinerary created:', itineraryId);

    // Step 5: Create Quote
    console.log('\nStep 5: Creating quote...\n');
    
    const quoteData = {
      customerId: customerId,
      itineraryId: itineraryId,
      agentId: agentId,
      numberOfTravelers: 2,
      travelDates: {
        startDate: startDate,
        endDate: endDate
      },
      pricing: {
        baseCost: 5000,
        markup: { percentage: 15, amount: 750 },
        taxes: { amount: 575 },
        totalPrice: 6325
      },
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'draft',
      notes: 'Test quote',
      terms: 'Standard terms'
    };

    console.log('Quote Data:', JSON.stringify(quoteData, null, 2));
    console.log('');

    const quoteResponse = await axios.post(`${API_BASE}/quotes`, quoteData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    });

    console.log('✓ SUCCESS!');
    console.log('Status:', quoteResponse.status);
    console.log('Quote ID:', quoteResponse.data.data.quote._id);

  } catch (error) {
    console.log('\n✗ FAILED');
    console.log('Error at:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testCompleteQuoteFlow();
