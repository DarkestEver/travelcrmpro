const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

// Use the data from the last test run
const TENANT_ID = '6910383db819ee413c171f27';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTAzODNkYjgxOWVlNDEzYzE3MWYyOCIsInJvbGUiOiJzdXBlcl9hZG1pbiIsInRlbmFudElkIjoiNjkxMDM4M2RiODE5ZWU0MTNjMTcxZjI3IiwiaWF0IjoxNzMxMTM1ODY0LCJleHAiOjE3MzExMzk0NjR9.abc123';
const CUSTOMER_ID = '69103852b819ee413c171f50';
const AGENT_ID = '69103850b819ee413c171f46';
const ITINERARY_ID = '69103853b819ee413c171f61';

async function testQuote() {
  try {
    console.log('=== TESTING QUOTE CREATION ===\n');

    // First, login to get a fresh token
    console.log('Step 1: Logging in...\n');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin.1762670653195@test-agency.com',
      password: 'TravelCRM@2024'
    }, {
      headers: { 'X-Tenant-ID': TENANT_ID }
    });
    const token = loginResponse.data.data.token;
    console.log('✓ Logged in\n');

    console.log('Step 2: Creating quote...\n');
    
    const quoteData = {
      customerId: CUSTOMER_ID,
      itineraryId: ITINERARY_ID,
      agentId: AGENT_ID,
      numberOfTravelers: 2,
      travelDates: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)
      },
      pricing: {
        baseCost: 5000,
        markup: { percentage: 15, amount: 750 },
        taxes: { amount: 575 },
        totalPrice: 6325
      },
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'draft',
      notes: 'Test quote for validation',
      terms: 'Standard terms and conditions'
    };

    console.log('Quote Data:', JSON.stringify(quoteData, null, 2));
    console.log('');

    const response = await axios.post(`${API_BASE}/quotes`, quoteData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': TENANT_ID
      }
    });

    console.log('✓ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('\n✗ FAILED');
    console.log('Error at:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error Stack:', error.message);
  }
}

testQuote();
