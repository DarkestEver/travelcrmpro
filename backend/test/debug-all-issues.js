const axios = require('axios');
const API_BASE = 'http://localhost:5000/api/v1';

async function debugAllIssues() {
  console.log('=== DEBUGGING ALL REMAINING ISSUES ===\n');
  
  try {
    // Step 1: Create tenant & login as admin
    console.log('1. Creating tenant...');
    const tenantData = {
      name: 'Debug Agency',
      subdomain: `debug${Date.now()}`,
      owner: {
        name: 'Admin User',
        email: `admin.${Date.now()}@test.com`,
        password: 'Test@123456',
        phone: '+1234567890'
      }
    };
    
    const tenantResp = await axios.post(`${API_BASE}/tenants/register`, tenantData);
    const tenantId = tenantResp.data.data.tenant._id;
    const adminToken = tenantResp.data.data.token;
    console.log('✓ Tenant created, Admin logged in\n');

    // Step 2: Create Agent user
    console.log('2. Creating agent user...');
    const agentUser = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Agent',
      email: `agent.${Date.now()}@test.com`,
      password: 'Agent@123456',
      role: 'agent',
      phone: '+1234567891'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
    });
    const agentUserId = agentUser.data.data.user._id;
    const agentEmail = agentUser.data.data.user.email;
    const agentPassword = 'Agent@123456';
    
    // Create agent profile
    const agentProfile = await axios.post(`${API_BASE}/agents`, {
      userId: agentUserId,
      agencyName: 'Test Agency',
      contactPerson: 'Test Agent',
      address: '123 Test St',
      tier: 'basic'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
    });
    const agentId = agentProfile.data.data.agent._id;
    console.log(`✓ Agent created: ${agentId}`);

    // Step 3: TEST AGENT LOGIN (Issue #3)
    console.log('\n3. Testing agent login...');
    try {
      const agentLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: agentEmail,
        password: agentPassword
      }, {
        headers: { 'X-Tenant-ID': tenantId }
      });
      console.log('✓ AGENT LOGIN WORKS!');
    } catch (err) {
      console.log('✗ AGENT LOGIN FAILED:', err.response?.data?.message);
      console.log('   Status:', err.response?.status);
    }

    // Step 4: Create Customer
    console.log('\n4. Creating customer...');
    const customerUser = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Customer',
      email: `customer.${Date.now()}@test.com`,
      password: 'Customer@123456',
      role: 'customer',
      phone: '+1234567892'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
    });
    const customerUserId = customerUser.data.data.user._id;
    
    const customerProfile = await axios.post(`${API_BASE}/customers`, {
      userId: customerUserId,
      passportNumber: 'ABC123',
      dateOfBirth: '1990-01-01',
      nationality: 'US'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
    });
    const customerId = customerProfile.data.data.customer._id;
    console.log(`✓ Customer created: ${customerId}`);

    // Step 5: Create Itinerary
    console.log('\n5. Creating itinerary...');
    const itinerary = await axios.post(`${API_BASE}/itineraries`, {
      customerId,
      title: 'Test Trip',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
      destination: { country: 'France', city: 'Paris' },
      destinations: [{ country: 'France', city: 'Paris', duration: 7 }],
      duration: { days: 7, nights: 6 },
      status: 'draft'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
    });
    const itineraryId = itinerary.data.data.itinerary._id;
    console.log(`✓ Itinerary created: ${itineraryId}`);

    // Step 6: Create Quote
    console.log('\n6. Creating quote...');
    const quote = await axios.post(`${API_BASE}/quotes`, {
      customerId,
      itineraryId,
      agentId,
      numberOfTravelers: 2,
      travelDates: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)
      },
      pricing: { baseCost: 5000, totalPrice: 5000 },
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'draft'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
    });
    const quoteId = quote.data.data.quote._id;
    console.log(`✓ Quote created: ${quoteId}`);

    // Step 7: TEST BOOKING CREATION (Issue #1)
    console.log('\n7. Testing booking creation...');
    try {
      const booking = await axios.post(`${API_BASE}/bookings`, {
        customerId,
        itineraryId,
        quoteId,
        agentId,
        travelDates: {
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)
        },
        numberOfTravelers: 2,
        financial: {
          totalAmount: 5000,
          paidAmount: 1000,
          pendingAmount: 4000,
          currency: 'USD'
        },
        status: 'confirmed'
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
      });
      console.log('✓ BOOKING CREATION WORKS!');
      console.log('   Booking ID:', booking.data.data.booking._id);
    } catch (err) {
      console.log('✗ BOOKING CREATION FAILED:', err.response?.data?.message);
      console.log('   Status:', err.response?.status);
      console.log('   Full error:', JSON.stringify(err.response?.data, null, 2));
    }

    // Step 8: Create Operator
    console.log('\n8. Creating operator...');
    const operatorUser = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Operator',
      email: `operator.${Date.now()}@test.com`,
      password: 'Operator@123456',
      role: 'operator',
      phone: '+1234567893'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Tenant-ID': tenantId }
    });
    const operatorEmail = operatorUser.data.data.user.email;
    const operatorPassword = 'Operator@123456';
    console.log('✓ Operator user created');

    // Login as operator
    const operatorLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: operatorEmail,
      password: operatorPassword
    }, {
      headers: { 'X-Tenant-ID': tenantId }
    });
    const operatorToken = operatorLogin.data.data.token;
    console.log('✓ Operator logged in');

    // Step 9: TEST OPERATOR CREATING AGENT (Issue #2)
    console.log('\n9. Testing operator creating agent profile...');
    try {
      const opAgentUser = await axios.post(`${API_BASE}/auth/register`, {
        name: 'Operator Created Agent',
        email: `opagent.${Date.now()}@test.com`,
        password: 'Test@123456',
        role: 'agent',
        phone: '+1234567894'
      }, {
        headers: { 'Authorization': `Bearer ${operatorToken}`, 'X-Tenant-ID': tenantId }
      });
      
      const opAgentProfile = await axios.post(`${API_BASE}/agents`, {
        userId: opAgentUser.data.data.user._id,
        agencyName: 'Operator Agency',
        contactPerson: 'Operator Agent',
        address: '456 Op St',
        tier: 'basic'
      }, {
        headers: { 'Authorization': `Bearer ${operatorToken}`, 'X-Tenant-ID': tenantId }
      });
      console.log('✓ OPERATOR CAN CREATE AGENTS!');
    } catch (err) {
      console.log('✗ OPERATOR CREATE AGENT FAILED:', err.response?.data?.message);
      console.log('   Status:', err.response?.status);
    }

    console.log('\n=== SUMMARY ===');
    console.log('Test complete. Check results above for failures.');

  } catch (error) {
    console.log('\n✗ UNEXPECTED ERROR:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugAllIssues();
