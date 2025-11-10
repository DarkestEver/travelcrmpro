/**
 * Travel CRM - Complete API Testing Script
 * Tests all features from Tenant Admin to Customer workflow
 */

const axios = require('axios');
const colors = require('colors');

// Base configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const tokens = {};
const ids = {};

// Helper functions for colored output
const logSuccess = (msg) => console.log(`✅ ${msg}`.green);
const logError = (msg) => console.log(`❌ ${msg}`.red);
const logInfo = (msg) => console.log(`ℹ️  ${msg}`.cyan);
const logStep = (msg) => console.log(`\n📝 ${msg}`.yellow);
const logHeader = (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`.magenta);

// API request helper
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// TEST 0: Setup Check
// ============================================================================
async function test0_Setup() {
  logHeader('🚀 Travel CRM API Testing Suite');
  logStep('TEST 0: Checking Backend Server');

  try {
    const response = await axios.get('http://localhost:5000/health');
    logSuccess('Backend server is running');
  } catch (error) {
    logError('Backend server is not running! Start it with: npm start');
    process.exit(1);
  }

  logInfo('Make sure you have run: node scripts/seedSuperAdmin.js');
  await sleep(2000);
}

// ============================================================================
// TEST 1: Super Admin - Create Tenant
// ============================================================================
async function test1_SuperAdminCreateTenant() {
  logStep('TEST 1: Super Admin Login & Create Tenant');

  // 1.1 Login as Super Admin
  logInfo('Logging in as Super Admin...');
  const loginResult = await apiRequest('post', '/auth/login', {
    email: 'admin@travelcrm.com',
    password: 'Admin@123'
  });

  if (!loginResult.success) {
    logError(`Super Admin login failed: ${loginResult.error}`);
    logInfo('Please run: node scripts/seedSuperAdmin.js');
    return false;
  }

  tokens.superadmin = loginResult.data.data.token;
  logSuccess('Super Admin logged in successfully');
  logInfo(`Token: ${tokens.superadmin.substring(0, 20)}...`);

  // 1.2 Create New Tenant
  logInfo('Creating new tenant: Demo Travel Agency...');
  const tenantResult = await apiRequest('post', '/tenants', {
    name: 'Demo Travel Agency',
    subdomain: 'demo-agency',
    ownerName: 'Agency Admin',
    ownerEmail: 'admin@demoagency.com',
    ownerPassword: 'Admin@123',
    ownerPhone: '+91 98765 43210',
    plan: 'professional',
    settings: {
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      language: 'en'
    }
  }, tokens.superadmin);

  if (!tenantResult.success) {
    logError(`Tenant creation failed: ${tenantResult.error}`);
    return false;
  }

  ids.tenant = tenantResult.data.data.tenant._id;
  ids.tenantOwner = tenantResult.data.data.user._id;
  logSuccess('Tenant created successfully');
  logInfo(`Tenant ID: ${ids.tenant}`);
  logInfo(`Owner Email: admin@demoagency.com`);

  return true;
}

// ============================================================================
// TEST 2: Agency Admin Login
// ============================================================================
async function test2_AgencyAdminLogin() {
  logStep('TEST 2: Agency Admin Login & Dashboard');

  logInfo('Logging in as Agency Admin (Operator)...');
  const loginResult = await apiRequest('post', '/auth/login', {
    email: 'admin@demoagency.com',
    password: 'Admin@123'
  });

  if (!loginResult.success) {
    logError(`Agency Admin login failed: ${loginResult.error}`);
    return false;
  }

  tokens.operator = loginResult.data.data.token;
  ids.operatorUser = loginResult.data.data.user._id;
  logSuccess('Agency Admin logged in successfully');
  logInfo(`Role: ${loginResult.data.data.user.role}`);
  logInfo(`Tenant: ${loginResult.data.data.user.tenantId}`);

  return true;
}

// ============================================================================
// TEST 3: Create Agents
// ============================================================================
async function test3_CreateAgents() {
  logStep('TEST 3: Create Agent Users');

  const agents = [
    { name: 'Sarah Agent', email: 'agent1@demoagency.com', phone: '+91 98765 00001' },
    { name: 'Mike Agent', email: 'agent2@demoagency.com', phone: '+91 98765 00002' },
    { name: 'Lisa Agent', email: 'agent3@demoagency.com', phone: '+91 98765 00003' }
  ];

  ids.agents = [];

  for (const agent of agents) {
    logInfo(`Creating agent: ${agent.name}...`);

    const result = await apiRequest('post', '/users', {
      name: agent.name,
      email: agent.email,
      password: 'Agent@123',
      role: 'agent',
      phone: agent.phone
    }, tokens.operator);

    if (result.success) {
      ids.agents.push(result.data.data.user._id);
      logSuccess(`Agent created: ${agent.name} (${agent.email})`);
    } else {
      logError(`Agent creation failed: ${agent.name} - ${result.error}`);
    }

    await sleep(500);
  }

  logSuccess(`Total agents created: ${ids.agents.length}/3`);
  return ids.agents.length > 0;
}

// ============================================================================
// TEST 4: Create Customers
// ============================================================================
async function test4_CreateCustomers() {
  logStep('TEST 4: Create Customer Accounts');

  const customers = [
    { firstName: 'Alice', lastName: 'Johnson', email: 'customer1@test.com', phone: '+91 98765 11111' },
    { firstName: 'Bob', lastName: 'Smith', email: 'customer2@test.com', phone: '+91 98765 11112' },
    { firstName: 'Carol', lastName: 'Williams', email: 'customer3@test.com', phone: '+91 98765 11113' },
    { firstName: 'David', lastName: 'Brown', email: 'customer4@test.com', phone: '+91 98765 11114' },
    { firstName: 'Emma', lastName: 'Davis', email: 'customer5@test.com', phone: '+91 98765 11115' }
  ];

  ids.customers = [];

  for (const customer of customers) {
    logInfo(`Creating customer: ${customer.firstName} ${customer.lastName}...`);

    const result = await apiRequest('post', '/customers', {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      password: 'Customer@123',
      dateOfBirth: '1990-01-01',
      nationality: 'Indian',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      }
    }, tokens.operator);

    if (result.success) {
      ids.customers.push(result.data.data.customer._id);
      logSuccess(`Customer created: ${customer.firstName} ${customer.lastName}`);
    } else {
      logError(`Customer creation failed: ${customer.firstName} - ${result.error}`);
    }

    await sleep(500);
  }

  logSuccess(`Total customers created: ${ids.customers.length}/5`);
  return ids.customers.length > 0;
}

// ============================================================================
// TEST 5: Create Suppliers
// ============================================================================
async function test5_CreateSuppliers() {
  logStep('TEST 5: Create Supplier Accounts');

  const suppliers = [
    { name: 'Grand Hotel Supplier', email: 'hotels@supplier.com', type: 'hotel' },
    { name: 'Sky Flight Supplier', email: 'flights@supplier.com', type: 'flight' },
    { name: 'Adventure Tours Supplier', email: 'tours@supplier.com', type: 'activity' }
  ];

  ids.suppliers = [];

  for (const supplier of suppliers) {
    logInfo(`Creating supplier: ${supplier.name}...`);

    const result = await apiRequest('post', '/users', {
      name: supplier.name,
      email: supplier.email,
      password: 'Supplier@123',
      role: 'supplier',
      phone: '+91 98765 22220'
    }, tokens.operator);

    if (result.success) {
      ids.suppliers.push(result.data.data.user._id);
      logSuccess(`Supplier created: ${supplier.name}`);
    } else {
      logError(`Supplier creation failed: ${supplier.name} - ${result.error}`);
    }

    await sleep(500);
  }

  logSuccess(`Total suppliers created: ${ids.suppliers.length}/3`);
  return ids.suppliers.length > 0;
}

// ============================================================================
// TEST 6: Create Itineraries
// ============================================================================
async function test6_CreateItineraries() {
  logStep('TEST 6: Create Travel Itineraries');

  const itineraries = [
    {
      title: 'Paris Romance 7D/6N',
      destination: 'Paris, France',
      duration: 7,
      price: 150000,
      description: 'Romantic getaway to the City of Love'
    },
    {
      title: 'Bali Adventure 5D/4N',
      destination: 'Bali, Indonesia',
      duration: 5,
      price: 80000,
      description: 'Adventure and relaxation in tropical paradise'
    }
  ];

  ids.itineraries = [];

  for (const itinerary of itineraries) {
    logInfo(`Creating itinerary: ${itinerary.title}...`);

    const result = await apiRequest('post', '/itineraries', {
      title: itinerary.title,
      destination: itinerary.destination,
      duration: itinerary.duration,
      price: itinerary.price,
      description: itinerary.description,
      type: 'package',
      inclusions: ['Accommodation', 'Breakfast', 'Airport Transfer'],
      exclusions: ['Flights', 'Travel Insurance']
    }, tokens.operator);

    if (result.success) {
      ids.itineraries.push(result.data.data.itinerary._id);
      logSuccess(`Itinerary created: ${itinerary.title}`);
    } else {
      logError(`Itinerary creation failed: ${itinerary.title} - ${result.error}`);
    }

    await sleep(500);
  }

  logSuccess(`Total itineraries created: ${ids.itineraries.length}/2`);
  return ids.itineraries.length > 0;
}

// ============================================================================
// TEST 7: Create Quotes
// ============================================================================
async function test7_CreateQuotes() {
  logStep('TEST 7: Create Quotes for Customers');

  if (ids.customers.length < 3 || ids.itineraries.length < 2) {
    logError('Not enough customers or itineraries to create quotes');
    return false;
  }

  const quotes = [
    {
      customerId: ids.customers[0],
      itineraryId: ids.itineraries[0],
      amount: 150000,
      title: 'Paris Package Quote'
    },
    {
      customerId: ids.customers[1],
      itineraryId: ids.itineraries[1],
      amount: 120000,
      title: 'Bali Package Quote'
    },
    {
      customerId: ids.customers[2],
      itineraryId: ids.itineraries[0],
      amount: 75000,
      title: 'Paris Solo Trip Quote'
    }
  ];

  ids.quotes = [];

  for (const quote of quotes) {
    logInfo(`Creating quote: ${quote.title}...`);

    const result = await apiRequest('post', '/quotes', {
      customerId: quote.customerId,
      itineraryId: quote.itineraryId,
      title: quote.title,
      amount: quote.amount,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    }, tokens.operator);

    if (result.success) {
      ids.quotes.push(result.data.data.quote._id);
      logSuccess(`Quote created: ${quote.title}`);
    } else {
      logError(`Quote creation failed: ${quote.title} - ${result.error}`);
    }

    await sleep(500);
  }

  logSuccess(`Total quotes created: ${ids.quotes.length}/3`);
  return ids.quotes.length > 0;
}

// ============================================================================
// TEST 8: Create Bookings
// ============================================================================
async function test8_CreateBookings() {
  logStep('TEST 8: Create Confirmed Bookings');

  if (ids.quotes.length < 2) {
    logError('Not enough quotes to create bookings');
    return false;
  }

  const bookings = [
    {
      quoteId: ids.quotes[0],
      customerId: ids.customers[0],
      status: 'confirmed',
      paymentStatus: 'partial'
    },
    {
      quoteId: ids.quotes[1],
      customerId: ids.customers[1],
      status: 'confirmed',
      paymentStatus: 'paid'
    }
  ];

  ids.bookings = [];

  for (const booking of bookings) {
    logInfo(`Creating booking...`);

    const result = await apiRequest('post', '/bookings', {
      quoteId: booking.quoteId,
      customerId: booking.customerId,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      travelDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    }, tokens.operator);

    if (result.success) {
      ids.bookings.push(result.data.data.booking._id);
      logSuccess(`Booking created with status: ${booking.status}`);
    } else {
      logError(`Booking creation failed: ${result.error}`);
    }

    await sleep(500);
  }

  logSuccess(`Total bookings created: ${ids.bookings.length}/2`);
  return ids.bookings.length > 0;
}

// ============================================================================
// TEST 9: Agent Login and Workflow
// ============================================================================
async function test9_AgentWorkflow() {
  logStep('TEST 9: Agent Login & Create Customer');

  logInfo('Logging in as Agent1...');
  const loginResult = await apiRequest('post', '/auth/login', {
    email: 'agent1@demoagency.com',
    password: 'Agent@123'
  });

  if (!loginResult.success) {
    logError(`Agent login failed: ${loginResult.error}`);
    return false;
  }

  tokens.agent = loginResult.data.data.token;
  logSuccess(`Agent logged in successfully (Role: ${loginResult.data.data.user.role})`);

  // Agent creates a customer
  logInfo('Agent creating new customer...');
  const customerResult = await apiRequest('post', '/customers', {
    firstName: 'Frank',
    lastName: 'Miller',
    email: 'customer6@test.com',
    phone: '+91 98765 11116',
    password: 'Customer@123'
  }, tokens.agent);

  if (customerResult.success) {
    logSuccess('Agent created customer: Frank Miller');
    return true;
  } else {
    logError(`Agent customer creation failed: ${customerResult.error}`);
    return false;
  }
}

// ============================================================================
// TEST 10: Customer Login and Portal
// ============================================================================
async function test10_CustomerPortal() {
  logStep('TEST 10: Customer Portal Login');

  logInfo('Logging in as Customer1 (Alice)...');
  const loginResult = await apiRequest('post', '/customer/auth/login', {
    email: 'customer1@test.com',
    password: 'Customer@123',
    tenantId: ids.tenant
  });

  if (!loginResult.success) {
    logError(`Customer login failed: ${loginResult.error}`);
    logInfo('Customer portal endpoint may need adjustment');
    return false;
  }

  tokens.customer = loginResult.data.data.token;
  logSuccess('Customer logged in successfully');

  // Fetch customer dashboard
  logInfo('Fetching customer dashboard...');
  const dashboardResult = await apiRequest('get', '/customer/dashboard', null, tokens.customer);

  if (dashboardResult.success) {
    logSuccess('Customer dashboard retrieved');
  } else {
    logInfo('Customer dashboard endpoint may need adjustment');
  }

  return true;
}

// ============================================================================
// Generate Summary Report
// ============================================================================
function generateReport() {
  logHeader('📊 TEST SUMMARY REPORT');

  console.log('\n✅ CREATED RESOURCES:'.green);
  console.log(`   • Tenant ID: ${ids.tenant || 'N/A'}`.white);
  console.log(`   • Agents: ${ids.agents?.length || 0} created`.white);
  console.log(`   • Customers: ${ids.customers?.length || 0} created`.white);
  console.log(`   • Suppliers: ${ids.suppliers?.length || 0} created`.white);
  console.log(`   • Itineraries: ${ids.itineraries?.length || 0} created`.white);
  console.log(`   • Quotes: ${ids.quotes?.length || 0} created`.white);
  console.log(`   • Bookings: ${ids.bookings?.length || 0} created`.white);

  console.log('\n🔑 LOGIN CREDENTIALS:'.cyan);
  console.log('   Super Admin:  admin@travelcrm.com / Admin@123'.white);
  console.log('   Agency Admin: admin@demoagency.com / Admin@123'.white);
  console.log('   Agent1:       agent1@demoagency.com / Agent@123'.white);
  console.log('   Customer1:    customer1@test.com / Customer@123'.white);

  // Save IDs to file
  const fs = require('fs');
  fs.writeFileSync('./test-ids.json', JSON.stringify(ids, null, 2));
  console.log('\n📝 IDs saved to: test-ids.json'.yellow);

  console.log('\n✨ Testing completed!'.green);
  console.log('='.repeat(60).magenta);
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
  try {
    await test0_Setup();
    
    const t1 = await test1_SuperAdminCreateTenant();
    if (!t1) {
      logError('Test 1 failed. Cannot continue.');
      return;
    }

    const t2 = await test2_AgencyAdminLogin();
    if (!t2) {
      logError('Test 2 failed. Cannot continue.');
      return;
    }

    await test3_CreateAgents();
    await test4_CreateCustomers();
    await test5_CreateSuppliers();
    await test6_CreateItineraries();
    await test7_CreateQuotes();
    await test8_CreateBookings();
    await test9_AgentWorkflow();
    await test10_CustomerPortal();

    generateReport();

  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runAllTests();
